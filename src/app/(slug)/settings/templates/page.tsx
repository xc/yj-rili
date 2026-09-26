import { prisma } from "@/lib/prisma";
import { TemplatesTable } from "./TemplatesTable";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await prisma.yjTaskTemplate.findMany({
    orderBy: { id: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="p-8">
      <h1 className="text-xl">模板管理</h1>
      <div className="mt-4">
        <TemplatesTable templates={templates} />
      </div>
    </div>
  );
}
