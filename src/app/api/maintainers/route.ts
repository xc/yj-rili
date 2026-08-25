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

  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return writeError("请求无效");
  }

  const name = body.name?.trim() ?? "";
  if (!name) {
    return writeError("请输入名称");
  }

  const maintainer = await prisma.yjMaintainer.create({
    data: { name },
  });

  return writeResponse({
    maintainer: {
      id: maintainer.id,
      name: maintainer.name,
    },
  });
}
