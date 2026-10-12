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
    return writeError("请选择用户");
  }

  if (id === user.id) {
    return writeError("不能删除当前登录用户");
  }

  const existing = await prisma.yjUser.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return writeError("用户不存在", 404);
  }

  const [taskCount, libraryCount] = await Promise.all([
    prisma.yjTask.count({ where: { creator: id } }),
    prisma.yjVerificationLibrary.count({ where: { creatorId: id } }),
  ]);
  if (taskCount > 0 || libraryCount > 0) {
    return writeError("该用户仍有关联任务或检测记录，无法删除");
  }

  try {
    await prisma.yjUser.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return writeError("该用户仍有关联数据，无法删除");
    }
    throw error;
  }

  return writeResponse({ ok: true });
}
