import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getRequestAdmin } from "@/lib/requestAuth";
import { HQ_BRANCH_ID, isHqRole, Role, roleOptions } from "@/lib/roles";
import { writeError, writeResponse } from "@/lib/util";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  const { user, forbidden } = await getRequestAdmin(request);
  if (!user) {
    return writeError("未登录", 401);
  }
  if (forbidden) {
    return writeError("无权限", 403);
  }

  let body: {
    username?: string;
    firstname?: string;
    lastname?: string;
    password?: string;
    branchId?: number;
    role?: string;
  };
  try {
    body = (await request.json()) as {
      username?: string;
      firstname?: string;
      lastname?: string;
      password?: string;
      branchId?: number;
      role?: string;
    };
  } catch {
    return writeError("请求无效");
  }

  const username = body.username?.trim() ?? "";
  if (!username) {
    return writeError("请输入用户名");
  }

  const lastname = body.lastname?.trim() ?? "";
  if (!lastname) {
    return writeError("请输入姓");
  }

  const firstname = body.firstname?.trim() ?? "";
  if (!firstname) {
    return writeError("请输入名");
  }

  const password = body.password ?? "";
  if (!password) {
    return writeError("请输入密码");
  }

  const branchId = Number(body.branchId);
  if (!Number.isInteger(branchId) || branchId <= 0) {
    return writeError("请选择分公司");
  }

  const role = body.role?.trim() ?? "";
  if (!roleOptions.includes(role as Role)) {
    return writeError("请选择角色");
  }

  if (isHqRole(role) && branchId !== HQ_BRANCH_ID) {
    return writeError("该角色仅限总部");
  }

  const branch = await prisma.yjBranch.findUnique({
    where: { id: branchId },
    select: { id: true },
  });
  if (!branch) {
    return writeError("分公司不存在");
  }

  try {
    const user = await prisma.yjUser.create({
      data: {
        username,
        password: await hashPassword(password),
        firstname,
        lastname,
        branchId,
        roles: {
          create: { role },
        },
      },
      select: {
        id: true,
        username: true,
        branchId: true,
      },
    });

    return writeResponse({ user });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return writeError("用户名已存在");
    }
    throw error;
  }
}
