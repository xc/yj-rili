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

  let body: { name?: string; maintainerId?: number; templateId?: number };
  try {
    body = (await request.json()) as {
      name?: string;
      maintainerId?: number;
      templateId?: number;
    };
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

  const task = await prisma.yjTask.create({
    data: {
      name,
      status: TaskStatus.Ongoing,
      creator: creator.id,
      branchId: creator.branchId,
      templateId: template.id,
      maintainerId: maintainer.id,
      videos: [],
      comment: "",
      resultDetail: [],
      logs: [],
    },
  });

  return writeResponse({
    task: {
      id: task.id,
      name: task.name,
      status: task.status,
      creator: task.creator,
      branchId: task.branchId,
      maintainerId: task.maintainerId,
      templateId: task.templateId,
      createdAt: task.createdAt.toISOString(),
    },
  });
}
