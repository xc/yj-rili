import { prisma } from "@/lib/prisma";
import { parseTemplateTypes } from "@/lib/templateType";
import { CreateTemplateButton } from "./CreateTemplateButton";
import { TemplatesTable } from "./TemplatesTable";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const [templates, typeList] = await Promise.all([
    prisma.yjTaskTemplate.findMany({
      orderBy: { id: "desc" },
      select: { id: true, name: true, type: true, rule: true },
    }),
    prisma.yjList.findUnique({
      where: { key: "template_type" },
      select: { value: true },
    }),
  ]);
  const typeOptions = parseTemplateTypes(typeList?.value);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">模板管理</h1>
        <CreateTemplateButton types={typeOptions} />
      </div>
      <div className="mt-4">
        <TemplatesTable templates={templates} typeOptions={typeOptions} />
      </div>
    </div>
  );
}
