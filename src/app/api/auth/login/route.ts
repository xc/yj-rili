import { signAuthToken } from "@/lib/jwt";
import { hashPassword, isHashedPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { writeError, writeResponse } from "@/lib/util";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = (await request.json()) as { username?: string; password?: string };
  } catch {
    return writeError("请求无效");
  }

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!username || !password) {
    return writeError("请输入用户名和密码");
  }

  const user = await prisma.yjUser.findUnique({
    where: { username },
    include: { roles: true, branch: { select: { name: true } } },
  });
  if (!user || !(await verifyPassword(password, user.password))) {
    return writeError("用户名或密码错误", 401);
  }

  if (!isHashedPassword(user.password)) {
    await prisma.yjUser.update({
      where: { id: user.id },
      data: { password: await hashPassword(password) },
    });
  }

  const token = await signAuthToken({
    sub: String(user.id),
    username: user.username,
  });

  return writeResponse({
    token,
    user: {
      id: user.id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      roles: user.roles.map((item) => item.role),
      branch: user.branch.name,
    },
  });
}
