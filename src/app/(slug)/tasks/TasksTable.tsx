"use client";

import { DeleteOutlined } from "@ant-design/icons";
import { Button, Modal, Space, Table, message } from "antd";
import type { TablePaginationConfig } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { Post } from "@/lib/clientUtil";

type TaskRow = {
  id: number;
  name: string;
  status: string;
  template: string;
  maintainer: string;
  creator: string;
  createdAt: string;
};

export function TasksTable({
  tasks,
  page,
  pageSize,
  total,
}: {
  tasks: TaskRow[];
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const onChange = (pagination: TablePaginationConfig) => {
    const nextPage = pagination.current ?? 1;
    const nextSize = pagination.pageSize ?? pageSize;
    router.push(`${pathname}?page=${nextPage}&pageSize=${nextSize}`);
  };

  const onDelete = (record: TaskRow) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定删除任务「${record.name}」吗？`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        await Post("/api/tasks/delete", { id: record.id });
        message.success("已删除");
        router.refresh();
      },
    });
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "名称", dataIndex: "name", key: "name" },
    { title: "状态", dataIndex: "status", key: "status", width: 120 },
    { title: "模板", dataIndex: "template", key: "template", width: 140 },
    { title: "维保员", dataIndex: "maintainer", key: "maintainer", width: 140 },
    { title: "创建人", dataIndex: "creator", key: "creator", width: 140 },
    { title: "创建时间", dataIndex: "createdAt", key: "createdAt", width: 200 },
    {
      title: "操作",
      key: "actions",
      width: 160,
      render: (_: unknown, record: TaskRow) => (
        <Space size="small">
          <Button size="small" type="primary">
            审核
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      className="rili-task-table"
      columns={columns}
      rowClassName={(_, index) =>
        index % 2 === 0 ? "rili-task-row-odd" : "rili-task-row-even"
      }
      dataSource={tasks}
      rowKey="id"
      onChange={onChange}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50],
        showTotal: (count) => `共 ${count} 条`,
      }}
    />
  );
}
