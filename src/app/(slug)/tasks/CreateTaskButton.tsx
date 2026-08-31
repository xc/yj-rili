"use client";

import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, Upload, message } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateMaintainerButton } from "@/components/CreateMaintainerButton";
import { Post } from "@/lib/clientUtil";

export function CreateTaskButton({
  maintainers,
  templates,
}: {
  maintainers: { id: number; name: string }[];
  templates: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [maintainerOptions, setMaintainerOptions] = useState(maintainers);
  const [form] = Form.useForm<{
    name: string;
    maintainerId: number;
    templateId: number;
  }>();
  const router = useRouter();

  const onCreate = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await Post("/api/tasks", {
        name: values.name.trim(),
        maintainerId: values.maintainerId,
        templateId: values.templateId,
      });
      message.success("创建成功");
      setOpen(false);
      form.resetFields();
      router.push("/tasks?page=1");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
        创建
      </Button>
      <Modal
        title={
          <span className="inline-flex items-center gap-2">
            <PlusOutlined />
            创建任务
          </span>
        }
        open={open}
        onOk={onCreate}
        onCancel={() => setOpen(false)}
        confirmLoading={loading}
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
          <Form.Item
            name="templateId"
            label="模板"
            rules={[{ required: true, message: "请选择模板" }]}
          >
            <Select
              placeholder="请选择模板"
              options={templates.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
            />
          </Form.Item>
          <Form.Item label="维保员" required>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Form.Item
                  name="maintainerId"
                  noStyle
                  rules={[{ required: true, message: "请选择维保员" }]}
                >
                  <Select
                    placeholder="请选择维保员"
                    options={maintainerOptions.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </div>
              <CreateMaintainerButton
                onCreated={(item) => {
                  setMaintainerOptions((current) =>
                    current.some((option) => option.id === item.id)
                      ? current
                      : [...current, item],
                  );
                  form.setFieldValue("maintainerId", item.id);
                }}
              >
                创建维保员
              </CreateMaintainerButton>
            </div>
          </Form.Item>
          <Form.Item label="视频">
            <Upload beforeUpload={() => false} accept="video/*">
              <Button icon={<UploadOutlined />}>选择视频</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
