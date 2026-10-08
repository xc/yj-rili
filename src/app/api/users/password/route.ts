import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getRequestAdmin } from "@/lib/requestAuth";
import { writeError, writeResponse } from "@/lib/util";

export async function POST(request: Request) {
  const { user, forbidden } = await getRequestAdmin(request);
  if (!user) {
    return writeError("未登录", 401);
  }
  if (forbidden) {
    return writeError("无权限", 403);
  }

  let body: { id?: number; password?: string };
  try {
    body = (await request.json()) as { id?: number; password?: string };
  } catch {
    return writeError("请求无效");
  }

  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return writeError("请选择用户");
  }

  const password = body.password ?? "";
  if (!password) {
    return writeError("请输入密码");
  }

  const existing = await prisma.yjUser.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return writeError("用户不存在", 404);
  }

  await prisma.yjUser.update({
    where: { id },
    data: { password: await hashPassword(password) },
  });

  return writeResponse({ ok: true });
}
