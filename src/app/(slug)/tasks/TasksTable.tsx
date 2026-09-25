"use client";

import { ArrowRightOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Modal, Space, Table, message } from "antd";
import type { TablePaginationConfig } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Post } from "@/lib/clientUtil";
import { TaskDetailModal } from "./TaskDetailModal";
import { taskListQuery } from "./taskListQuery";

export type TaskRow = {
  id: number;
  name: string;
  status: string;
  template: string;
  maintainer: string;
  creator: string;
  createdAt: string;
};

const statusTone: Record<string, { color: string; background: string }> = {
  待处理: { color: "#d46b08", background: "#fff7e6" },
  完成: { color: "#389e0d", background: "#f6ffed" },
  进行中: { color: "#1677ff", background: "#e6f4ff" },
  取消: { color: "#cf1322", background: "#fff2f0" },
  未通过: { color: "#cf1322", background: "#fff2f0" },
  已检测: { color: "#08979c", background: "#e6fffb" },
};

export function TasksTable({
  tasks,
  page,
  pageSize,
  branchId,
  total,
  loading,
  onChanged,
}: {
  tasks: TaskRow[];
  page: number;
  pageSize: number;
  branchId: number | null;
  total: number;
  loading?: boolean;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [detail, setDetail] = useState<TaskRow | null>(null);

  const onChange = (pagination: TablePaginationConfig) => {
    const nextPage = pagination.current ?? 1;
    const nextSize = pagination.pageSize ?? pageSize;
    router.push(
      `${pathname}?${taskListQuery({
        page: nextPage,
        pageSize: nextSize,
        branchId,
      })}`,
    );
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
        onChanged?.();
      },
    });
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "名称", dataIndex: "name", key: "name" },
    { title: "模板", dataIndex: "template", key: "template", width: 140 },
    { title: "维保员", dataIndex: "maintainer", key: "maintainer", width: 140 },
    { title: "创建人", dataIndex: "creator", key: "creator", width: 140 },
    { title: "创建时间", dataIndex: "createdAt", key: "createdAt", width: 200 },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const tone = statusTone[status] ?? {
          color: "#595959",
          background: "#f5f5f5",
        };
        return (
          <span
            style={{
              display: "inline-block",
              padding: "2px 10px",
              borderRadius: 4,
              fontSize: 13,
              color: tone.color,
              background: tone.background,
            }}
          >
            {status}
          </span>
        );
      },
    },
    {
      title: "操作",
      key: "actions",
      width: 160,
      render: (_: unknown, record: TaskRow) => (
        <Space size="small">
          <Button
            size="small"
            color={record.status === "已检测" ? "primary" : "green"}
            variant="solid"
            icon={
              record.status === "已检测" ? (
                <ArrowRightOutlined />
              ) : (
                <EyeOutlined />
              )
            }
            onClick={() => setDetail(record)}
          >
            {record.status === "已检测" ? "处理" : "查看"}
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
    <>
      <Table
        className="rili-task-table"
        columns={columns}
        rowClassName={(_, index) =>
          index % 2 === 0 ? "rili-task-row-odd" : "rili-task-row-even"
        }
        dataSource={tasks}
        loading={loading}
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
      <TaskDetailModal
        taskId={detail?.id ?? null}
        open={detail !== null}
        onClose={() => setDetail(null)}
        onChanged={onChanged}
      />
    </>
  );
}
