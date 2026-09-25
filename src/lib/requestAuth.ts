import { getBearerToken, verifyAuthToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";

export type RequestUser = {
  id: number;
  branchId: number;
  roles: string[];
};

export async function getRequestUser(
  request: Request,
): Promise<RequestUser | null> {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  try {
    const payload = await verifyAuthToken(token);
    const user = await prisma.yjUser.findUnique({
      where: { id: Number(payload.sub) },
      select: {
        id: true,
        branchId: true,
        roles: {
          select: { role: true },
        },
      },
    });
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      branchId: user.branchId,
      roles: user.roles.map((item) => item.role),
    };
  } catch {
    return null;
  }
}

export async function getRequestAdmin(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return { user: null, forbidden: false } as const;
  }
  if (!isAdmin(user.roles)) {
    return { user, forbidden: true } as const;
  }
  return { user, forbidden: false } as const;
}
