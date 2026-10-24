import { prisma } from "@/lib/prisma";
import { CreateListButton } from "./CreateListButton";
import { DictionaryTable } from "./DictionaryTable";

export const dynamic = "force-dynamic";

export default async function DictionaryPage() {
  const items = await prisma.yjList.findMany({
    orderBy: { id: "desc" },
    select: { id: true, key: true, value: true },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">数据字典</h1>
        <CreateListButton />
      </div>
      <div className="mt-4">
        <DictionaryTable items={items} />
      </div>
    </div>
  );
}
