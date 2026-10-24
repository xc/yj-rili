import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRequestAdmin } from "@/lib/requestAuth";
import { parseTemplateTypes } from "@/lib/templateType";
import { writeError, writeResponse } from "@/lib/util";

function isJsonObject(value: unknown): value is Prisma.InputJsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const { user, forbidden } = await getRequestAdmin(request);
  if (!user) {
    return writeError("未登录", 401);
  }
  if (forbidden) {
    return writeError("无权限", 403);
  }

  let body: { name?: string; type?: string; rule?: unknown };
  try {
    body = (await request.json()) as { name?: string; type?: string; rule?: unknown };
  } catch {
    return writeError("请求无效");
  }

  const name = body.name?.trim() ?? "";
  const type = body.type?.trim() ?? "";
  if (!name) {
    return writeError("请输入名称");
  }
  if (name.length > 128) {
    return writeError("名称过长");
  }
  if (!isJsonObject(body.rule)) {
    return writeError("JSON 须为对象");
  }

  const list = await prisma.yjList.findUnique({
    where: { key: "template_type" },
    select: { value: true },
  });
  const typeOptions = parseTemplateTypes(list?.value);
  if (!typeOptions.some((item) => item.value === type)) {
    return writeError("请选择类型");
  }

  const template = await prisma.yjTaskTemplate.create({
    data: { name, type, rule: body.rule },
    select: { id: true, name: true, type: true, rule: true },
  });

  return writeResponse({ template });
}
