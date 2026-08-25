"use client";

import { Button, Form, Input, Switch } from "antd";

export default function SystemSettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-xl">系统设置</h1>
      <Form
        className="mt-6 max-w-md"
        layout="vertical"
        initialValues={{ siteName: "日历", enabled: true }}
      >
        <Form.Item label="启用系统" name="enabled" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Button type="primary">保存</Button>
      </Form>
    </div>
  );
}
