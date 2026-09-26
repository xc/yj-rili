import { prisma } from "@/lib/prisma";
import { roleLabels } from "@/lib/roles";
import { CreateUserButton } from "@/components/CreateUserButton";
import { UsersTable } from "./UsersTable";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [users, branches] = await Promise.all([
    prisma.yjUser.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        roles: {
          select: { role: true },
        },
        branch: {
          select: { name: true },
        },
      },
    }),
    prisma.yjBranch.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">用户管理</h1>
        <CreateUserButton branches={branches} />
      </div>
      <div className="mt-4">
        <UsersTable
          users={users.map((user) => ({
            id: user.id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            branch: user.branch.name,
            roles: user.roles
              .map((item) => roleLabels[item.role] ?? item.role)
              .join("、"),
          }))}
        />
      </div>
    </div>
  );
}
