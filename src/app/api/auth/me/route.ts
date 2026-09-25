import { getBearerToken, verifyAuthToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { writeError, writeResponse } from "@/lib/util";

export async function GET(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return writeError("未登录", 401);
  }

  try {
    const payload = await verifyAuthToken(token);
    const user = await prisma.yjUser.findUnique({
      where: { id: Number(payload.sub) },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        roles: {
          select: { role: true },
        },
        branch: {
          select: { name: true },
        },
      },
    });

    if (!user) {
      return writeError("未登录", 401);
    }

    return writeResponse({
      user: {
        id: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        roles: user.roles.map((item) => item.role),
        branch: user.branch.name,
      },
    });
  } catch {
    return writeError("未登录", 401);
  }
}
