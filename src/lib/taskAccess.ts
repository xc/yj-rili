import { canViewAllTasks, isBranchAdmin } from "@/lib/roles";

export type TaskActor = {
  id: number;
  branchId: number;
  roles: string[];
};

export function tasksWhereForUser(
  user: TaskActor,
  branchId: number | null,
) {
  if (canViewAllTasks(user.roles)) {
    return branchId ? { branchId } : {};
  }
  if (isBranchAdmin(user.roles)) {
    return { branchId: user.branchId };
  }
  return { creator: user.id };
}

export function canAccessTask(
  user: TaskActor,
  task: { creator: number; branchId: number },
) {
  if (canViewAllTasks(user.roles)) {
    return true;
  }
  if (isBranchAdmin(user.roles)) {
    return task.branchId === user.branchId;
  }
  return task.creator === user.id;
}
