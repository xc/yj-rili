"use client";

import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, message } from "antd";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Post } from "@/lib/clientUtil";

type Maintainer = {
  id: number;
  name: string;
};

export function CreateMaintainerButton({
  onCreated,
  children = "创建",
}: {
  onCreated?: (maintainer: Maintainer) => void;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<{ name: string }>();
  const router = useRouter();

  const onCreate = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const data = await Post<{ maintainer: Maintainer }>("/api/maintainers", {
        name: values.name.trim(),
      });
      message.success("创建成功");
      setOpen(false);
      form.resetFields();
      if (onCreated) {
        onCreated(data.maintainer);
      } else {
        router.refresh();
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="primary"
        htmlType="button"
        icon={<PlusOutlined />}
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>
      <Modal
        title={
          <span className="inline-flex items-center gap-2">
            <PlusOutlined />
            创建维保员
          </span>
        }
        open={open}
        onOk={onCreate}
        onCancel={() => setOpen(false)}
        confirmLoading={loading}
        zIndex={2000}
        destroyOnHidden
        okText="创建"
        cancelText="取消"
        okButtonProps={{ icon: <PlusOutlined /> }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input autoComplete="off" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
