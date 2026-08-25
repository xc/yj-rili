"use client";

import { Button, ConfigProvider, Form, Input, message } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

type LoginValues = {
  username: string;
  password: string;
};

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      await login(values.username.trim(), values.password);
      router.replace("/");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-6"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      <div className="w-full max-w-[22rem] rounded-sm bg-paper/90 p-8">
        <h1 className="mb-8 text-center text-2xl">电梯检测系统</h1>
        <ConfigProvider
          theme={{
            components: {
              Form: {
                labelFontSize: 16,
              },
            },
          }}
        >
          <Form
            className="rili-login-form"
            layout="vertical"
            requiredMark={false}
            onFinish={onFinish}
            styles={{ label: { fontSize: 16, height: "auto" } }}
          >
            <Form.Item
              name="username"
              label={<span style={{ fontSize: 16 }}>用户名</span>}
              rules={[{ required: true, message: "请输入用户名" }]}
            >
              <Input
                className="rili-input"
                autoComplete="username"
                spellCheck={false}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ fontSize: 16 }}>密码</span>}
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password
                className="rili-input"
                autoComplete="current-password"
              />
            </Form.Item>

            <Button
              className="rili-login-btn mt-2"
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
            >
              登录
            </Button>
          </Form>
        </ConfigProvider>
      </div>
    </div>
  );
}
