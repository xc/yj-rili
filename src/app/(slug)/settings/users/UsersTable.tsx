"use client";

import { Table } from "antd";

type UserRow = {
  id: number;
  username: string;
  name: string;
  roles: string;
};

export function UsersTable({ users }: { users: UserRow[] }) {
  return (
    <Table
      className="rili-task-table"
      columns={[
        { title: "ID", dataIndex: "id", key: "id", width: 80 },
        { title: "用户名", dataIndex: "username", key: "username", width: 160 },
        { title: "姓名", dataIndex: "name", key: "name" },
        { title: "角色", dataIndex: "roles", key: "roles", width: 160 },
      ]}
      rowClassName={(_, index) =>
        index % 2 === 0 ? "rili-task-row-odd" : "rili-task-row-even"
      }
      dataSource={users}
      rowKey="id"
      pagination={false}
    />
  );
}
