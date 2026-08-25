"use client";

import { Table } from "antd";

type LibraryRow = {
  id: number;
  type: string;
  source: string;
  thumbnail: string;
  context: string;
  creator: string;
  createdAt: string;
};

export function LibraryTable({ items }: { items: LibraryRow[] }) {
  return (
    <Table
      className="rili-task-table"
      columns={[
        { title: "ID", dataIndex: "id", key: "id", width: 80 },
        {
          title: "缩略图",
          dataIndex: "thumbnail",
          key: "thumbnail",
          width: 100,
          render: (src: string) => (
            <img src={src} alt="" className="h-12 w-12 object-contain" />
          ),
        },
        { title: "类型", dataIndex: "type", key: "type", width: 100 },
        { title: "说明", dataIndex: "context", key: "context" },
        { title: "路径", dataIndex: "source", key: "source" },
        { title: "创建人", dataIndex: "creator", key: "creator", width: 140 },
        {
          title: "创建时间",
          dataIndex: "createdAt",
          key: "createdAt",
          width: 180,
        },
      ]}
      rowClassName={(_, index) =>
        index % 2 === 0 ? "rili-task-row-odd" : "rili-task-row-even"
      }
      dataSource={items}
      rowKey="id"
      pagination={false}
    />
  );
}
