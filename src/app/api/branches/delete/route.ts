import { prisma } from "@/lib/prisma";
import { getRequestAdmin } from "@/lib/requestAuth";
import { HQ_BRANCH_ID } from "@/lib/roles";
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
    return writeError("请选择分公司");
  }

  if (id === HQ_BRANCH_ID) {
    return writeError("总部不可删除");
  }

  const existing = await prisma.yjBranch.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return writeError("分公司不存在", 404);
  }

  const [userCount, taskCount] = await Promise.all([
    prisma.yjUser.count({ where: { branchId: id } }),
    prisma.yjTask.count({ where: { branchId: id } }),
  ]);
  if (userCount > 0 || taskCount > 0) {
    return writeError("该分公司仍有用户或任务，无法删除");
  }

  try {
    await prisma.yjBranch.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return writeError("该分公司仍有关联数据，无法删除");
    }
    throw error;
  }

  return writeResponse({ ok: true });
}
