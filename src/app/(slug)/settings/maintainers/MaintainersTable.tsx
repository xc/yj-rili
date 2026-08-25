"use client";

import { Table } from "antd";

type MaintainerRow = {
  id: number;
  name: string;
};

export function MaintainersTable({
  maintainers,
}: {
  maintainers: MaintainerRow[];
}) {
  return (
    <Table
      className="rili-task-table"
      columns={[
        { title: "ID", dataIndex: "id", key: "id", width: 80 },
        { title: "名称", dataIndex: "name", key: "name" },
      ]}
      rowClassName={(_, index) =>
        index % 2 === 0 ? "rili-task-row-odd" : "rili-task-row-even"
      }
      dataSource={maintainers}
      rowKey="id"
      pagination={false}
    />
  );
}
