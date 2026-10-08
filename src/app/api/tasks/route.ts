import { CheckSystemRequestError, createCheckSystemClient } from "@/lib/checkSystem";
import { analysisTypeForDetectType, isDetectType } from "@/lib/detectType";
import { getBearerToken, verifyAuthToken, type AuthTokenPayload } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/requestAuth";
import { tasksWhereForUser } from "@/lib/taskAccess";
import {
  formatDateTime,
  getTaskStatusLabel,
  TaskStatus,
  writeError,
  writeResponse,
} from "@/lib/util";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const START_TIME_PATTERN = /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/;

type StartVideoInput = {
  uid: string | null;
  path: string | null;
  start_time: string | null;
};

function readStartVideo(body: {
  video?: { uid?: unknown; path?: unknown; start_time?: unknown };
}): StartVideoInput | string {
  const video = body.video ?? {};
  const uid = typeof video.uid === "string" ? video.uid.trim() : "";
  const path = typeof video.path === "string" ? video.path.trim() : "";
  const startTime = typeof video.start_time === "string" ? video.start_time.trim() : "";
  if (!uid && !path) {
    return "请提供视频 UID 或路径";
  }
  if (startTime && !START_TIME_PATTERN.test(startTime)) {
    return "视频起始时间格式应为 YYYY/MM/DD HH:MM:SS";
  }

  return {
    uid: uid || null,
    path: path || null,
    start_time: startTime || null,
  };
}

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return writeError("未登录", 401);
  }

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || DEFAULT_PAGE, 1);
  const pageSize = Math.min(
    Math.max(Number(url.searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE, 1),
    50,
  );
  const parsedBranch = Number(url.searchParams.get("branch"));
  const branchId =
    Number.isInteger(parsedBranch) && parsedBranch > 0 ? parsedBranch : null;
  const where = tasksWhereForUser(user, branchId);

  const [total, tasks] = await Promise.all([
    prisma.yjTask.count({ where }),
    prisma.yjTask.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        creatorUser: {
          select: { firstname: true, lastname: true },
        },
        maintainer: {
          select: { name: true },
        },
        template: {
          select: { name: true },
        },
      },
    }),
  ]);

  return writeResponse({
    total,
    page,
    pageSize,
    tasks: tasks.map((task) => ({
      id: task.id,
      name: task.name,
      status: getTaskStatusLabel(task.status),
      template: task.template.name,
      maintainer: task.maintainer.name,
      creator: `${task.creatorUser.firstname} ${task.creatorUser.lastname}`,
      createdAt: formatDateTime(task.createdAt),
      detectType: task.detectType,
    })),
  });
}

export async function POST(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return writeError("未登录", 401);
  }

  let payload: AuthTokenPayload;
  try {
    payload = await verifyAuthToken(token);
  } catch {
    return writeError("未登录", 401);
  }

  let body: {
    name?: string;
    maintainerId?: number;
    templateId?: number;
    detectType?: unknown;
    video?: { uid?: unknown; path?: unknown; start_time?: unknown };
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return writeError("请求无效");
  }

  const name = body.name?.trim() ?? "";
  if (!name) {
    return writeError("请输入名称");
  }

  const maintainerId = Number(body.maintainerId);
  if (!Number.isInteger(maintainerId) || maintainerId <= 0) {
    return writeError("请选择维保员");
  }

  const templateId = Number(body.templateId);
  if (!Number.isInteger(templateId) || templateId <= 0) {
    return writeError("请选择模板");
  }

  if (!isDetectType(body.detectType)) {
    return writeError("请选择检测类型");
  }
  const detectType = body.detectType;
  const analysisType = analysisTypeForDetectType(detectType);

  const [creator, template, maintainer] = await Promise.all([
    prisma.yjUser.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, branchId: true },
    }),
    prisma.yjTaskTemplate.findUnique({
      where: { id: templateId },
      select: { id: true },
    }),
    prisma.yjMaintainer.findUnique({
      where: { id: maintainerId },
      select: { id: true },
    }),
  ]);
  if (!creator) {
    return writeError("未登录", 401);
  }
  if (!template) {
    return writeError("模板不存在");
  }
  if (!maintainer) {
    return writeError("维保员不存在");
  }

  const video = readStartVideo(body);
  if (typeof video === "string") {
    return writeError(video);
  }

  const task = await prisma.yjTask.create({
    data: {
      name,
      status: TaskStatus.Pending,
      creator: creator.id,
      branchId: creator.branchId,
      templateId: template.id,
      maintainerId: maintainer.id,
      detectType,
      videos: [],
      comment: "",
      resultDetail: [],
      logs: [],
    },
  });

  const checkSystem = createCheckSystemClient();
  try {
    await checkSystem.startTask({
      id: task.id,
      type: analysisType,
      video: {
        id: task.id,
        uid: video.uid,
        path: video.path,
        start_time: video.start_time,
      },
    });
  } catch (error) {
    await prisma.yjTask.delete({ where: { id: task.id } }).catch(() => undefined);
    const message =
      error instanceof CheckSystemRequestError ? error.message : "无法连接检测服务";
    return writeError(message, error instanceof CheckSystemRequestError && error.status === 0 ? 502 : 400);
  }

  const started = await prisma.yjTask.update({
    where: { id: task.id },
    data: {
      status: TaskStatus.Ongoing,
      videos: [
        {
          id: task.id,
          uid: video.uid,
          path: video.path,
          start_time: video.start_time,
          type: analysisType,
        },
      ],
    },
  });

  return writeResponse({
    task: {
      id: started.id,
      name: started.name,
      status: started.status,
      creator: task.creator,
      branchId: task.branchId,
      maintainerId: task.maintainerId,
      templateId: task.templateId,
      detectType: started.detectType,
      createdAt: task.createdAt.toISOString(),
    },
  });
}
