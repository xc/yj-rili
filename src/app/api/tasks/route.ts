import { getBearerToken, verifyAuthToken, type AuthTokenPayload } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { writeError, writeResponse } from "@/lib/util";

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

  let body: { name?: string; maintainerId?: number };
  try {
    body = (await request.json()) as { name?: string; maintainerId?: number };
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

  const [template, maintainer] = await Promise.all([
    prisma.yjTaskTemplate.findFirst({
      orderBy: { id: "asc" },
      select: { id: true },
    }),
    prisma.yjMaintainer.findUnique({
      where: { id: maintainerId },
      select: { id: true },
    }),
  ]);
  if (!template) {
    return writeError("请先创建模板");
  }
  if (!maintainer) {
    return writeError("维保员不存在");
  }

  const task = await prisma.yjTask.create({
    data: {
      name,
      status: 0,
      creator: Number(payload.sub),
      templateId: template.id,
      maintainerId: maintainer.id,
      videos: [],
    },
  });

  return writeResponse({
    task: {
      id: task.id,
      name: task.name,
      status: task.status,
      creator: task.creator,
      maintainerId: task.maintainerId,
      createdAt: task.createdAt.toISOString(),
    },
  });
}
