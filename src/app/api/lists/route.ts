import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRequestAdmin } from "@/lib/requestAuth";
import { writeError, writeResponse } from "@/lib/util";

function readEntry(body: { key?: string; value?: string }) {
  const key = body.key?.trim() ?? "";
  const value = body.value ?? "";
  if (!key) {
    return { error: "请输入键" as const };
  }
  if (key.length > 64) {
    return { error: "键过长" as const };
  }
  return { key, value };
}

export async function POST(request: Request) {
  const { user, forbidden } = await getRequestAdmin(request);
  if (!user) {
    return writeError("未登录", 401);
  }
  if (forbidden) {
    return writeError("无权限", 403);
  }

  let body: { key?: string; value?: string };
  try {
    body = (await request.json()) as { key?: string; value?: string };
  } catch {
    return writeError("请求无效");
  }

  const entry = readEntry(body);
  if ("error" in entry) {
    return writeError(entry.error);
  }

  try {
    const item = await prisma.yjList.create({
      data: { key: entry.key, value: entry.value },
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
