"use client";

import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, message } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Post } from "@/lib/clientUtil";
import { roleLabels, rolesForBranch } from "@/lib/roles";

export function CreateUserButton({
  branches,
}: {
  branches: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<{
    username: string;
    firstname: string;
    lastname: string;
    password: string;
    branchId: number;
    role: string;
  }>();
  const router = useRouter();
  const branchId = Form.useWatch("branchId", form);
  const allowedRoles = rolesForBranch(branchId);

  const onCreate = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await Post("/api/users", {
        username: values.username.trim(),
        firstname: values.firstname.trim(),
        lastname: values.lastname.trim(),
        password: values.password,
        branchId: values.branchId,
        role: values.role,
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
            创建用户
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
            name="username"
            label="用户名"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="lastname"
            label="姓"
            rules={[{ required: true, message: "请输入姓" }]}
          >
            <Input autoComplete="family-name" />
          </Form.Item>
          <Form.Item
            name="firstname"
            label="名"
            rules={[{ required: true, message: "请输入名" }]}
          >
            <Input autoComplete="given-name" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="branchId"
            label="分公司"
            rules={[{ required: true, message: "请选择分公司" }]}
          >
            <Select
              placeholder="请选择分公司"
              options={branches.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onChange={(value: number) => {
                const currentRole = form.getFieldValue("role") as
                  | string
                  | undefined;
                if (
                  currentRole &&
                  !rolesForBranch(value).some((role) => role === currentRole)
                ) {
                  form.setFieldValue("role", undefined);
                }
              }}
            />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: "请选择角色" }]}
          >
            <Select
              placeholder="请选择角色"
              options={allowedRoles.map((role) => ({
                value: role,
                label: roleLabels[role],
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
