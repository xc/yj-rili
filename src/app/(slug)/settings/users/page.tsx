import { prisma } from "@/lib/prisma";
import { UsersTable } from "./UsersTable";

export default async function UsersPage() {
  const users = await prisma.yjUser.findMany({
    orderBy: { id: "desc" },
    select: {
      id: true,
      username: true,
      firstname: true,
      lastname: true,
      roles: {
        select: { role: true },
      },
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-xl">用户管理</h1>
      <div className="mt-4">
        <UsersTable
          users={users.map((user) => ({
            id: user.id,
            username: user.username,
            name: `${user.firstname} ${user.lastname}`,
            roles: user.roles.map((item) => item.role).join("、"),
          }))}
        />
      </div>
    </div>
  );
}
