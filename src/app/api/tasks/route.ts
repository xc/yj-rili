import { getBearerToken, verifyAuthToken, type AuthTokenPayload } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { TaskStatus, writeError, writeResponse } from "@/lib/util";

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

  const [template, maintainer] = await Promise.all([
    prisma.yjTaskTemplate.findUnique({
      where: { id: templateId },
      select: { id: true },
    }),
    prisma.yjMaintainer.findUnique({
      where: { id: maintainerId },
      select: { id: true },
    }),
  ]);
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
      creator: Number(payload.sub),
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
      maintainerId: task.maintainerId,
      templateId: task.templateId,
      createdAt: task.createdAt.toISOString(),
    },
  });
}
