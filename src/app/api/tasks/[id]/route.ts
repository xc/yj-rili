import { getBearerToken, verifyAuthToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
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
  const token = getBearerToken(request);
  if (!token) {
    return writeError("未登录", 401);
  }

  try {
    await verifyAuthToken(token);
  } catch {
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
  const token = getBearerToken(request);
  if (!token) {
    return writeError("未登录", 401);
  }

  try {
    await verifyAuthToken(token);
  } catch {
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
    select: { id: true, status: true },
  });
  if (!existing) {
    return writeError("任务不存在", 404);
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
