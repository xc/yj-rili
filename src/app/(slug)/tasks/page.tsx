import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CreateTaskButton } from "./CreateTaskButton";
import { TasksList } from "./TasksList";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [maintainers, templates, branches] = await Promise.all([
    prisma.yjMaintainer.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    }),
    prisma.yjTaskTemplate.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    }),
    prisma.yjBranch.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">任务管理</h1>
        <CreateTaskButton maintainers={maintainers} templates={templates} />
      </div>
      <Suspense>
        <TasksList branches={branches} />
      </Suspense>
    </div>
  );
}
