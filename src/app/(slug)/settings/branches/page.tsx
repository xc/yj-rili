import { prisma } from "@/lib/prisma";
import { CreateBranchButton } from "@/components/CreateBranchButton";
import { BranchesTable } from "./BranchesTable";

export default async function BranchesPage() {
  const branches = await prisma.yjBranch.findMany({
    orderBy: { id: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">分公司管理</h1>
        <CreateBranchButton />
      </div>
      <div className="mt-4">
        <BranchesTable branches={branches} />
      </div>
    </div>
  );
}
