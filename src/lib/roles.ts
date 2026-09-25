export enum Role {
  Admin = "admin",
  HqManager = "hq-manager",
  HqAdmin = "hq-admin",
  BranchManager = "branch-manager",
  BranchAdmin = "branch-admin",
  Checker = "checker",
}

export const roleLabels: Record<string, string> = {
  [Role.Admin]: "管理员",
  [Role.HqManager]: "总部经理",
  [Role.HqAdmin]: "总部管理员",
  [Role.BranchManager]: "分公司经理",
  [Role.BranchAdmin]: "分公司管理员",
  [Role.Checker]: "检测员",
};

export const roleOptions = [
  Role.Admin,
  Role.HqManager,
  Role.BranchManager,
  Role.Checker,
] as const;

export const HQ_BRANCH_ID = 1;

export const hqRoles = [Role.Admin, Role.HqManager, Role.HqAdmin] as const;

export function isHqRole(role: string) {
  return (hqRoles as readonly string[]).includes(role);
}

export function rolesForBranch(branchId: number | undefined) {
  if (branchId === HQ_BRANCH_ID) {
    return roleOptions;
  }
  return roleOptions.filter((role) => !isHqRole(role));
}

export function getRoleLabel(role: string) {
  return roleLabels[role] ?? role;
}

export function isAdmin(roles: string[] | undefined) {
  return roles?.includes(Role.Admin) ?? false;
}

export function hasAnyRole(roles: string[] | undefined, wanted: readonly string[]) {
  return wanted.some((role) => roles?.includes(role));
}

export function canViewAllTasks(roles: string[] | undefined) {
  return hasAnyRole(roles, [Role.Admin, Role.HqManager, Role.HqAdmin]);
}

export function isBranchAdmin(roles: string[] | undefined) {
  return hasAnyRole(roles, [Role.BranchManager, Role.BranchAdmin]);
}
