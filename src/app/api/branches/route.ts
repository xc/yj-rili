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

  const branch = await prisma.yjBranch.create({
    data: { name },
  });

  return writeResponse({
    branch: {
      id: branch.id,
      name: branch.name,
    },
  });
}
