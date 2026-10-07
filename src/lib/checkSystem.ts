/**
 * Client for the elevator detection service described in frontend/portocal.md.
 *
 * Every known route returns HTTP 200 with `{ error, message, data }`.
 * `error` / the outer `message` describe this HTTP call. A task that failed
 * analysis still comes back as `error: false`; its outcome is `data.status`
 * and `data.message`.
 */

export const AnalysisType = {
  Yolo: "yolo",
  Minicpm: "minicpm",
} as const;

export type AnalysisType = (typeof AnalysisType)[keyof typeof AnalysisType];

/** Detection-service status. Distinct from the app task status in `@/lib/util`. */
export const AnalysisStatus = {
  Queued: 0,
  Running: 1,
  Done: 2,
  Failed: 3,
  Terminated: 4,
} as const;

export type AnalysisStatus = (typeof AnalysisStatus)[keyof typeof AnalysisStatus];

export const ActionMessage = {
  Started: "任务已开始",
  Terminated: "任务已终止",
  TerminatedAndDeleted: "任务已终止并删除",
  Deleted: "任务已删除",
} as const;

export type TaskId = string | number;

export type TaskProgress = {
  current: number;
  total: number;
  stage: string;
};

export type TaskView = {
  id: string;
  video_id: string;
  type: AnalysisType;
  status: AnalysisStatus;
  /** Execution note for this task. Empty while queued or running. */
  message: string;
  /** Present only while `status` is running. */
  progress?: TaskProgress;
};

export type YoloBox = {
  time: number;
  conf: number;
  /** `[left, top, right, bottom]` in source-frame pixels. */
  xyxy: [number, number, number, number];
};

export type YoloInterval = {
  track_id: number;
  cls: number;
  name: string;
  start: number;
  end: number;
  duration: number;
  max_conf: number;
  frames: number;
  boxes: YoloBox[];
};

export type MinicpmAnnotation = {
  开始时间: string;
  结束时间: string;
  分析: string;
  区域: string;
  行为: string;
};

export type AnalysisResult = { yolo: YoloInterval[] } | { GPT: MinicpmAnnotation[] };

export type TaskDetail = TaskView & {
  /** `null` unless `status` is done. Terminated and failed tasks stay `null`. */
  result: AnalysisResult | null;
};

export type VideoRef = {
  id: TaskId;
  uid?: string | null;
  /** Wins over `uid` when the file exists. */
  path?: string | null;
  /** `YYYY/MM/DD HH:MM:SS`. MiniCPM only; burns a time watermark before analysis. */
  start_time?: string | null;
};

export type AnalysisOptions = {
  detect_fps?: number;
  conf_threshold?: number;
  gap_track_tolerance?: number;
  min_track_duration?: number;
  filter_negative_track_id?: boolean;
  segment_duration?: number;
  drop_second?: number;
  llm_model?: string;
  yolo_model?: string;
};

export type StartTaskRequest = {
  id: TaskId;
  type: AnalysisType;
  video: VideoRef;
  options?: AnalysisOptions;
};

export type ActionAck = {
  message: string;
};

export class CheckSystemRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "CheckSystemRequestError";
    this.status = status;
  }
}

type Envelope<T> = {
  error: boolean;
  message: string;
  data: T;
};

export function resolveCheckSystemBaseUrl(explicit?: string) {
  const configured = explicit ?? process.env.CheckSystemURL ?? "http://localhost:2000";
  return configured.replace(/\/$/, "");
}

function taskPath(
  action: "status" | "detail" | "terminate" | "delete",
  taskId: TaskId,
  videoId: TaskId,
) {
  return `/task/${action}/${encodeURIComponent(String(taskId))}/${encodeURIComponent(String(videoId))}`;
}

async function request<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init?.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...init?.headers,
      },
    });
  } catch (cause) {
    throw new CheckSystemRequestError("无法连接检测服务", 0, { cause });
  }

  let body: Envelope<T> | null = null;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new CheckSystemRequestError(
      body?.message || `检测服务返回 HTTP ${response.status}`,
      response.status,
    );
  }

  if (!body || typeof body.error !== "boolean") {
    throw new CheckSystemRequestError("检测服务返回了无法识别的响应", response.status);
  }

  if (body.error) {
    throw new CheckSystemRequestError(body.message || "请求失败", response.status);
  }

  return body.data;
}

export type CheckSystemClient = {
  /** `GET /`. Field names of the payload are not fixed by the protocol. */
  getServiceInfo: () => Promise<unknown>;
  startTask: (body: StartTaskRequest) => Promise<ActionAck>;
  getTaskStatus: (taskId: TaskId, videoId: TaskId) => Promise<TaskView>;
  listTasks: () => Promise<TaskView[]>;
  getTaskDetail: (taskId: TaskId, videoId: TaskId) => Promise<TaskDetail>;
  terminateTask: (taskId: TaskId, videoId: TaskId) => Promise<ActionAck>;
  deleteTask: (taskId: TaskId, videoId: TaskId) => Promise<ActionAck>;
};

export function createCheckSystemClient(options?: { baseUrl?: string }): CheckSystemClient {
  const baseUrl = resolveCheckSystemBaseUrl(options?.baseUrl);

  return {
    getServiceInfo() {
      return request<unknown>(baseUrl, "/");
    },
    startTask(body) {
      return request<ActionAck>(baseUrl, "/task/start", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    getTaskStatus(taskId, videoId) {
      return request<TaskView>(baseUrl, taskPath("status", taskId, videoId));
    },
    listTasks() {
      return request<TaskView[]>(baseUrl, "/task/status");
    },
    getTaskDetail(taskId, videoId) {
      return request<TaskDetail>(baseUrl, taskPath("detail", taskId, videoId));
    },
    terminateTask(taskId, videoId) {
      return request<ActionAck>(baseUrl, taskPath("terminate", taskId, videoId), {
        method: "POST",
      });
    },
    deleteTask(taskId, videoId) {
      return request<ActionAck>(baseUrl, taskPath("delete", taskId, videoId), {
        method: "POST",
      });
    },
  };
}
