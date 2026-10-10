import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  AnalysisStatus,
  CheckSystemRequestError,
  createCheckSystemClient,
  type AnalysisResult,
  type TaskView,
} from "../src/lib/checkSystem";
import { prisma } from "../src/lib/prisma";

dayjs.extend(customParseFormat);

const INTERVAL_MS = 2 * 60 * 1000;
const AppTaskStatus = {
  Ongoing: 2,
  Detected: 4,
} as const;

type LogRow = {
  key: number;
  time: string;
  message: string;
};

type StoredVideo = {
  id: number;
  start_time: string | null;
  checkStatus?: number;
  settled?: boolean;
  progress?: TaskView["progress"] | null;
  message?: string;
};

const checkSystem = createCheckSystemClient();
let ticking = false;

function readLogs(value: unknown): LogRow[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object" || !("message" in item)) {
      return [];
    }
    const message = item.message;
    if (typeof message !== "string") {
      return [];
    }
    const key =
      "key" in item && typeof item.key === "number" ? item.key : index + 1;
    const time =
      "time" in item && typeof item.time === "string" ? item.time : "";
    return [{ key, time, message }];
  });
}

function appendLog(logs: unknown, message: string) {
  const current = readLogs(logs);
  if (!message || current.at(-1)?.message === message) {
    return current;
  }
  return [
    ...current,
    {
      key: (current.at(-1)?.key ?? current.length) + 1,
      time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      message,
    },
  ];
}

function readVideo(videos: unknown): StoredVideo | null {
  if (!Array.isArray(videos) || videos.length === 0) {
    return null;
  }
  const item = videos[0];
  if (!item || typeof item !== "object" || !("id" in item)) {
    return null;
  }
  const id = Number(item.id);
  if (!Number.isInteger(id)) {
    return null;
  }
  const record = item as Record<string, unknown>;
  const progress = record.progress;
  return {
    id,
    start_time:
      typeof record.start_time === "string" ? record.start_time : null,
    checkStatus:
      typeof record.checkStatus === "number" ? record.checkStatus : undefined,
    settled: record.settled === true,
    message: typeof record.message === "string" ? record.message : undefined,
    progress:
      progress && typeof progress === "object"
        ? (progress as TaskView["progress"])
        : null,
  };
}

function patchVideos(videos: unknown, patch: Record<string, unknown>) {
  const list = Array.isArray(videos) ? [...videos] : [];
  const first = list[0];
  const base = first && typeof first === "object" ? { ...first } : {};
  list[0] = { ...base, ...patch };
  return list;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatSeconds(total: number) {
  const seconds = Math.max(0, Math.floor(total));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds % 60)}`;
}

function toClock(value: string, startTime: string | null) {
  const at = dayjs(value, ["YYYY-MM-DD HH:mm:ss", "YYYY/MM/DD HH:mm:ss"], true);
  if (!startTime || !at.isValid()) {
    const clock = value.match(/(\d{2}:\d{2}:\d{2})$/);
    return clock?.[1] ?? value;
  }
  const start = dayjs(
    startTime,
    ["YYYY/MM/DD HH:mm:ss", "YYYY-MM-DD HH:mm:ss"],
    true,
  );
  if (!start.isValid()) {
    return at.format("HH:mm:ss");
  }
  return formatSeconds(at.diff(start, "second"));
}

function mapResult(result: AnalysisResult | null, startTime: string | null) {
  if (!result) {
    return [];
  }
  if ("GPT" in result && Array.isArray(result.GPT)) {
    return result.GPT.map((item) => ({
      id: crypto.randomUUID(),
      type: "behavior",
      area: item.区域 ?? "",
      analystics: item.分析 ?? "",
      behavior: item.行为 ?? "",
      _start_time: toClock(item.开始时间, startTime),
      _end_time: toClock(item.结束时间, startTime),
    }));
  }
  if ("yolo" in result && Array.isArray(result.yolo)) {
    return result.yolo.map((item) => ({
      ...item,
      _start_time: formatSeconds(item.start),
      _end_time: formatSeconds(item.end),
    }));
  }
  return [];
}

function progressMessage(view: TaskView) {
  if (!view.progress?.stage) {
    return "";
  }
  return `${view.progress.stage} (${view.progress.current}/${view.progress.total})`;
}

function sameView(video: StoredVideo, view: TaskView) {
  return (
    video.checkStatus === view.status &&
    (video.message ?? "") === view.message &&
    JSON.stringify(video.progress ?? null) ===
      JSON.stringify(view.progress ?? null)
  );
}

async function settle(
  task: { id: number; videos: unknown; logs: unknown },
  videoId: number,
  view: Pick<TaskView, "status" | "message">,
  message: string,
) {
  await prisma.yjTask.update({
    where: { id: task.id },
    data: {
      videos: patchVideos(task.videos, {
        id: videoId,
        checkStatus: view.status,
        message: view.message,
        progress: null,
        settled: true,
      }) as Prisma.InputJsonValue,
      logs: appendLog(task.logs, message) as Prisma.InputJsonValue,
    },
  });
  console.log(`[sync] task ${task.id} stopped: ${message}`);
}

async function syncTask(task: { id: number; videos: unknown; logs: unknown }) {
  const video = readVideo(task.videos);
  if (!video || video.settled) {
    return;
  }

  console.log(`[sync] start syncing task ${task.id}`);

  let view: TaskView;
  try {
    view = await checkSystem.getTaskStatus(task.id, video.id);
  } catch (error) {
    if (error instanceof CheckSystemRequestError && error.status === 0) {
      console.error(`[sync] task ${task.id}: ${error.message}`);
      return;
    }
    if (
      error instanceof CheckSystemRequestError &&
      error.message === "任务不存在"
    ) {
      await settle(
        task,
        video.id,
        { status: AnalysisStatus.Terminated, message: error.message },
        error.message,
      );
      return;
    }
    console.error(`[sync] task ${task.id}:`, error);
    return;
  }

  const progress = view.progress
    ? ` ${view.progress.stage} (${view.progress.current}/${view.progress.total})`
    : "";
  console.log(
    `[sync] task ${task.id} result status=${view.status} message=${view.message || "-"}${progress}`,
  );

  if (
    view.status === AnalysisStatus.Queued ||
    view.status === AnalysisStatus.Running
  ) {
    if (sameView(video, view)) {
      return;
    }
    await prisma.yjTask.update({
      where: { id: task.id },
      data: {
        videos: patchVideos(task.videos, {
          checkStatus: view.status,
          message: view.message,
          progress: view.progress ?? null,
          settled: false,
        }) as Prisma.InputJsonValue,
        logs: appendLog(
          task.logs,
          progressMessage(view),
        ) as Prisma.InputJsonValue,
      },
    });
    return;
  }

  if (view.status === AnalysisStatus.Done) {
    const detail = await checkSystem.getTaskDetail(task.id, video.id);
    const rows = mapResult(detail.result, video.start_time);
    await prisma.yjTask.update({
      where: { id: task.id },
      data: {
        status: AppTaskStatus.Detected,
        resultDetail: rows as Prisma.InputJsonValue,
        videos: patchVideos(task.videos, {
          checkStatus: view.status,
          message: view.message,
          progress: null,
          settled: true,
        }) as Prisma.InputJsonValue,
        logs: appendLog(
          task.logs,
          view.message || "检测完成",
        ) as Prisma.InputJsonValue,
      },
    });
    console.log(`[sync] task ${task.id} detected (${rows.length})`);
    return;
  }

  await settle(task, video.id, view, view.message || "检测结束");
}

async function syncOnce() {
  const tasks = await prisma.yjTask.findMany({
    where: { status: AppTaskStatus.Ongoing },
    select: { id: true, videos: true, logs: true },
  });
  for (const task of tasks) {
    try {
      await syncTask(task);
    } catch (error) {
      console.error(`[sync] task ${task.id}:`, error);
    }
  }
}

async function tick() {
  if (ticking) {
    return;
  }
  ticking = true;
  try {
    await syncOnce();
  } catch (error) {
    console.error("[sync]", error);
  } finally {
    ticking = false;
  }
}

const timer = setInterval(() => {
  void tick();
}, INTERVAL_MS);

async function shutdown() {
  clearInterval(timer);
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown();
});
process.on("SIGTERM", () => {
  void shutdown();
});

console.log(`[sync] watching tasks every ${INTERVAL_MS / 1000}s`);
void tick();
