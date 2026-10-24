import { Prisma } from "@prisma/client";
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

  let body: { id?: number; key?: string; value?: string };
  try {
    body = (await request.json()) as { id?: number; key?: string; value?: string };
  } catch {
    return writeError("请求无效");
  }

  const id = Number(body.id);
  const key = body.key?.trim() ?? "";
  const value = body.value ?? "";
  if (!Number.isInteger(id) || id <= 0) {
    return writeError("请选择记录");
  }
  if (!key) {
    return writeError("请输入键");
  }
  if (key.length > 64) {
    return writeError("键过长");
  }

  const existing = await prisma.yjList.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return writeError("记录不存在", 404);
  }

  try {
    const item = await prisma.yjList.update({
      where: { id },
      data: { key, value },
      select: { id: true, key: true, value: true },
    });
    return writeResponse({ item });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return writeError("键已存在");
    }
    throw error;
  }
}
