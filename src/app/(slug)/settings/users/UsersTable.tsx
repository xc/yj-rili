"use client";

import { LockOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Table, message } from "antd";
import { useState } from "react";
import { Post } from "@/lib/clientUtil";

type UserRow = {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  branch: string;
  roles: string;
};

export function UsersTable({ users }: { users: UserRow[] }) {
  const [target, setTarget] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<{ password: string }>();

  const close = () => {
    setTarget(null);
    form.resetFields();
  };

  const onSubmit = async () => {
    if (!target) {
      return;
    }
    const values = await form.validateFields();
    setLoading(true);
    try {
      await Post("/api/users/password", {
        id: target.id,
        password: values.password,
      });
      message.success("密码已更新");
      close();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "修改失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Table
        className="rili-task-table"
        columns={[
          { title: "ID", dataIndex: "id", key: "id", width: 80 },
          { title: "用户名", dataIndex: "username", key: "username", width: 160 },
          { title: "姓", dataIndex: "lastname", key: "lastname", width: 120 },
          { title: "名", dataIndex: "firstname", key: "firstname", width: 120 },
          { title: "分公司", dataIndex: "branch", key: "branch", width: 160 },
          { title: "角色", dataIndex: "roles", key: "roles", width: 160 },
          {
            title: "操作",
            key: "actions",
            width: 140,
            render: (_: unknown, record: UserRow) => (
              <Button
                size="small"
                icon={<LockOutlined />}
                onClick={() => {
                  form.resetFields();
                  setTarget(record);
                }}
              >
                修改密码
              </Button>
            ),
          },
        ]}
        rowClassName={(_, index) =>
          index % 2 === 0 ? "rili-task-row-odd" : "rili-task-row-even"
        }
        dataSource={users}
        rowKey="id"
        pagination={false}
      />
      <Modal
        title={
          <span className="inline-flex items-center gap-2">
            <LockOutlined />
            修改密码{target ? `：${target.username}` : ""}
          </span>
        }
        open={target !== null}
        onOk={onSubmit}
        onCancel={close}
        confirmLoading={loading}
        destroyOnHidden
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="password"
            label="新密码"
            rules={[{ required: true, message: "请输入新密码" }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
