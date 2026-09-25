import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/requestAuth";
import { canAccessTask } from "@/lib/taskAccess";
import { writeError, writeResponse } from "@/lib/util";

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return writeError("未登录", 401);
  }

  let body: { id?: number };
  try {
    body = (await request.json()) as { id?: number };
  } catch {
    return writeError("请求无效");
  }

  const id = Number(body.id);
  if (!id) {
    return writeError("请选择任务");
  }

  const existing = await prisma.yjTask.findUnique({
    where: { id },
    select: { id: true, creator: true, branchId: true },
  });
  if (!existing) {
    return writeError("任务不存在", 404);
  }
  if (!canAccessTask(user, existing)) {
    return writeError("无权限", 403);
  }

  await prisma.yjTask.delete({ where: { id } });
  return writeResponse({ ok: true });
}
