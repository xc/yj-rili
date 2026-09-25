"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import { Get } from "@/lib/clientUtil";
import { useAuth } from "@/lib/auth";
import { canViewAllTasks } from "@/lib/roles";
import { TasksBranchFilter } from "./TasksBranchFilter";
import { TasksTable, type TaskRow } from "./TasksTable";
import { TASKS_CHANGED_EVENT, taskListQuery } from "./taskListQuery";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export function TasksList({
  branches,
}: {
  branches: { id: number; name: string }[];
}) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const showBranchFilter = canViewAllTasks(user?.roles);
  const page = Math.max(Number(searchParams.get("page")) || DEFAULT_PAGE, 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE, 1),
    50,
  );
  const parsedBranch = Number(searchParams.get("branch"));
  const branchId =
    showBranchFilter && Number.isInteger(parsedBranch) && parsedBranch > 0
      ? parsedBranch
      : null;

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Get<{ tasks: TaskRow[]; total: number }>(
      `/api/tasks?${taskListQuery({ page, pageSize, branchId })}`,
    )
      .then((data) => {
        setTasks(data.tasks);
        setTotal(data.total);
      })
      .catch((error) => {
        setTasks([]);
        setTotal(0);
        message.error(error instanceof Error ? error.message : "加载失败");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, pageSize, branchId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onChanged = () => load();
    window.addEventListener(TASKS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(TASKS_CHANGED_EVENT, onChanged);
  }, [load]);

  return (
    <>
      {showBranchFilter ? (
        <div className="mt-4 flex items-center">
          <TasksBranchFilter
            branches={branches}
            branchId={branchId}
            pageSize={pageSize}
          />
        </div>
      ) : null}
      <div className="mt-4">
        <TasksTable
          loading={loading}
          page={page}
          pageSize={pageSize}
          branchId={branchId}
          total={total}
          tasks={tasks}
          onChanged={load}
        />
      </div>
    </>
  );
}
