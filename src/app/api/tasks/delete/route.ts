import { getBearerToken, verifyAuthToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { writeError, writeResponse } from "@/lib/util";

export async function POST(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return writeError("未登录", 401);
  }

  try {
    await verifyAuthToken(token);
  } catch {
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

  await prisma.yjTask.delete({ where: { id } });
  return writeResponse({ ok: true });
}
