import { prisma } from "@/lib/prisma";
import { CreateMaintainerButton } from "@/components/CreateMaintainerButton";
import { MaintainersTable } from "./MaintainersTable";

export default async function MaintainersPage() {
  const maintainers = await prisma.yjMaintainer.findMany({
    orderBy: { id: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">维保员管理</h1>
        <CreateMaintainerButton />
      </div>
      <div className="mt-4">
        <MaintainersTable maintainers={maintainers} />
      </div>
    </div>
  );
}
