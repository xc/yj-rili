"use client";

import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, message } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Post } from "@/lib/clientUtil";

export function CreateListButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<{ key: string; value: string }>();
  const router = useRouter();

  const close = () => {
    if (loading) {
      return;
    }
    setOpen(false);
  };

  const onCreate = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await Post("/api/lists", {
        key: values.key.trim(),
        value: values.value ?? "",
      });
      message.success("创建成功");
      setOpen(false);
      form.resetFields();
      router.refresh();
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
        创建
      </Button>
      <Modal
        title={
          <span className="inline-flex items-center gap-2">
            <PlusOutlined />
            创建字典
          </span>
        }
        open={open}
        onOk={onCreate}
        onCancel={close}
        confirmLoading={loading}
        destroyOnHidden
        okText="创建"
        cancelText="取消"
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="key"
            label="键"
            rules={[{ required: true, message: "请输入键" }]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item name="value" label="值">
            <Input.TextArea
              autoSize={{ minRows: 8, maxRows: 18 }}
              spellCheck={false}
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
