"use client";

import { DeleteOutlined } from "@ant-design/icons";
import { Button, Modal, Table, message } from "antd";
import { useRouter } from "next/navigation";
import { Post } from "@/lib/clientUtil";
import { HQ_BRANCH_ID } from "@/lib/roles";

type BranchRow = {
  id: number;
  name: string;
};

export function BranchesTable({ branches }: { branches: BranchRow[] }) {
  const router = useRouter();

  const onDelete = (record: BranchRow) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定删除分公司「${record.name}」吗？`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          await Post("/api/branches/delete", { id: record.id });
          message.success("已删除");
          router.refresh();
        } catch (error) {
          message.error(error instanceof Error ? error.message : "删除失败");
        }
      },
    });
  };

  return (
    <Table
      className="rili-task-table"
      columns={[
        { title: "ID", dataIndex: "id", key: "id", width: 80 },
        { title: "名称", dataIndex: "name", key: "name" },
        {
          title: "操作",
          key: "actions",
          width: 120,
          render: (_: unknown, record: BranchRow) =>
            record.id === HQ_BRANCH_ID ? null : (
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(record)}
              >
                删除
              </Button>
            ),
        },
      ]}
      rowClassName={(_, index) =>
        index % 2 === 0 ? "rili-task-row-odd" : "rili-task-row-even"
      }
      dataSource={branches}
      rowKey="id"
      pagination={false}
    />
  );
}
