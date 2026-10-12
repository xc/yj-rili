import { prisma } from "@/lib/prisma";
import { getRequestAdmin } from "@/lib/requestAuth";
import { writeError, writeResponse } from "@/lib/util";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  const { user, forbidden } = await getRequestAdmin(request);
  if (!user) {
    return writeError("未登录", 401);
  }
  if (forbidden) {
    return writeError("无权限", 403);
  }

  let body: { id?: number };
  try {
    body = (await request.json()) as { id?: number };
  } catch {
    return writeError("请求无效");
  }

  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return writeError("请选择维保员");
  }

  const existing = await prisma.yjMaintainer.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return writeError("维保员不存在", 404);
  }

  const taskCount = await prisma.yjTask.count({
    where: { maintainerId: id },
  });
  if (taskCount > 0) {
    return writeError("该维保员仍有关联任务，无法删除");
  }

  try {
    await prisma.yjMaintainer.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return writeError("该维保员仍有关联任务，无法删除");
    }
    throw error;
  }

  return writeResponse({ ok: true });
}
