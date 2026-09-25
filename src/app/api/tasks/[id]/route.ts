import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/requestAuth";
import { canAccessTask } from "@/lib/taskAccess";
import {
  formatDateTime,
  TaskStatus,
  writeError,
  writeResponse,
} from "@/lib/util";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getRequestUser(request);
  if (!user) {
    return writeError("未登录", 401);
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return writeError("请选择任务");
  }

  const task = await prisma.yjTask.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      comment: true,
      createdAt: true,
      creator: true,
      branchId: true,
      resultDetail: true,
      logs: true,
      template: {
        select: {
          id: true,
          name: true,
          rule: true,
        },
      },
    },
  });

  if (!task) {
    return writeError("任务不存在", 404);
  }
  if (!canAccessTask(user, task)) {
    return writeError("无权限", 403);
  }

  return writeResponse({
    task: {
      id: task.id,
      name: task.name,
      status: task.status,
      comment: task.comment,
      createdAt: formatDateTime(task.createdAt),
      resultDetail: task.resultDetail,
      logs: task.logs,
      template: task.template,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getRequestUser(request);
  if (!user) {
    return writeError("未登录", 401);
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return writeError("请选择任务");
  }

  let body: { status?: number; comment?: string };
  try {
    body = (await request.json()) as { status?: number; comment?: string };
  } catch {
    return writeError("请求无效");
  }

  const status = Number(body.status);
  if (status !== TaskStatus.Done && status !== TaskStatus.Cancelled) {
    return writeError("状态无效");
  }

  const comment = typeof body.comment === "string" ? body.comment : "";

  const existing = await prisma.yjTask.findUnique({
    where: { id },
    select: { id: true, status: true, creator: true, branchId: true },
  });
  if (!existing) {
    return writeError("任务不存在", 404);
  }
  if (!canAccessTask(user, existing)) {
    return writeError("无权限", 403);
  }
  if (existing.status !== TaskStatus.Detected) {
    return writeError("当前状态不可审核");
  }

  const task = await prisma.yjTask.update({
    where: { id },
    data: { status, comment },
    select: { id: true, status: true, comment: true },
  });

  return writeResponse({ task });
}
