import { prisma } from "@/lib/prisma";
import { formatDateTime, getTaskStatusLabel } from "@/lib/util";
import { CreateTaskButton } from "./CreateTaskButton";
import { TasksTable } from "./TasksTable";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(Number(params.page) || DEFAULT_PAGE, 1);
  const pageSize = Math.min(
    Math.max(Number(params.pageSize) || DEFAULT_PAGE_SIZE, 1),
    50,
  );

  const [total, tasks, maintainers] = await Promise.all([
    prisma.yjTask.count(),
    prisma.yjTask.findMany({
      orderBy: { id: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        creatorUser: {
          select: { firstname: true, lastname: true },
        },
        maintainer: {
          select: { name: true },
        },
      },
    }),
    prisma.yjMaintainer.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">任务管理</h1>
        <CreateTaskButton maintainers={maintainers} />
      </div>
      <div className="mt-4">
        <TasksTable
          page={page}
          pageSize={pageSize}
          total={total}
          tasks={tasks.map((task) => ({
            id: task.id,
            name: task.name,
            status: getTaskStatusLabel(task.status),
            maintainer: task.maintainer.name,
            creator: `${task.creatorUser.firstname} ${task.creatorUser.lastname}`,
            createdAt: formatDateTime(task.createdAt),
          }))}
        />
      </div>
    </div>
  );
}
