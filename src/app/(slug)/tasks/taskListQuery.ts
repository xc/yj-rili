export const TASKS_CHANGED_EVENT = "rili-tasks-changed";

export function taskListQuery({
  page,
  pageSize,
  branchId,
}: {
  page: number;
  pageSize: number;
  branchId: number | null;
}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (branchId) {
    params.set("branch", String(branchId));
  }
  return params.toString();
}
