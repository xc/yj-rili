"use client";

import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, message } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Post } from "@/lib/clientUtil";
import type { TemplateTypeOption } from "@/lib/templateType";

const emptyRule = "{\n}";

export function CreateTemplateButton({
  types,
}: {
  types: TemplateTypeOption[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<{ name: string; type: string; rule: string }>();
  const router = useRouter();

  const close = () => {
    if (loading) {
      return;
    }
    setOpen(false);
  };

  const onCreate = async () => {
    const values = await form.validateFields();
    let rule: unknown;
    try {
      rule = JSON.parse(values.rule);
    } catch {
      message.error("JSON 格式无效");
      return;
    }
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
      message.error("JSON 须为对象");
      return;
    }

    setLoading(true);
    try {
      await Post("/api/templates", {
        name: values.name.trim(),
        type: values.type,
        rule,
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
            创建模板
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
        <Form
          form={form}
          layout="vertical"
          initialValues={{ rule: emptyRule }}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: "请选择类型" }]}
          >
            <Select
              placeholder="请选择类型"
              options={types.map((item) => ({
                value: item.value,
                label: item.name,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="rule"
            label="JSON"
            rules={[{ required: true, message: "请输入 JSON" }]}
          >
            <Input.TextArea
              autoSize={{ minRows: 12, maxRows: 24 }}
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
