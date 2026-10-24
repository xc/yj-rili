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

  let body: { id?: number; type?: string; rule?: unknown };
  try {
    body = (await request.json()) as { id?: number; type?: string; rule?: unknown };
  } catch {
    return writeError("请求无效");
  }

  const id = Number(body.id);
  const type = body.type?.trim() ?? "";
  if (!Number.isInteger(id) || id <= 0) {
    return writeError("请选择模板");
  }
  if (!isJsonObject(body.rule)) {
    return writeError("JSON 须为对象");
  }

  const [existing, list] = await Promise.all([
    prisma.yjTaskTemplate.findUnique({
      where: { id },
      select: { id: true },
    }),
    prisma.yjList.findUnique({
      where: { key: "template_type" },
      select: { value: true },
    }),
  ]);
  if (!existing) {
    return writeError("模板不存在", 404);
  }
  const typeOptions = parseTemplateTypes(list?.value);
  if (!typeOptions.some((item) => item.value === type)) {
    return writeError("请选择类型");
  }

  const template = await prisma.yjTaskTemplate.update({
    where: { id },
    data: { type, rule: body.rule },
    select: { id: true, name: true, type: true, rule: true },
  });

  return writeResponse({ template });
}
