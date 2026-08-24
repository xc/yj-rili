"use client";

import { Button, Form, Input } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

type LoginValues = {
  username: string;
  password: string;
};

function formatPanelDate(date: Date) {
  return {
    day: date.getDate().toString().padStart(2, "0"),
    weekday: date.toLocaleDateString("en-GB", { weekday: "long" }),
    monthYear: date.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    }),
  };
}

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const panel = formatPanelDate(new Date());

  const onFinish = async (values: LoginValues) => {
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 420));
    login(values.username.trim());
    router.replace("/");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
      <section className="relative hidden overflow-hidden bg-ink text-paper lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -right-16 top-24 size-72 rounded-full border border-cinnabar/40" />
        <div className="pointer-events-none absolute -right-8 top-32 size-56 rounded-full border border-cinnabar/70" />

        <div className="reveal flex items-start justify-between">
          <p className="font-sans text-xs tracking-[0.35em] uppercase text-paper/70">
            Rili
          </p>
          <p className="writing-vertical font-display text-lg text-cinnabar">
            日曆
          </p>
        </div>

        <div className="reveal relative z-10" style={{ animationDelay: "120ms" }}>
          <p className="mb-3 font-sans text-sm tracking-[0.28em] uppercase text-paper/55">
            {panel.weekday}
          </p>
          <p className="font-display text-[9.5rem] leading-[0.8] font-semibold tracking-tight">
            {panel.day}
          </p>
          <p className="mt-6 font-display text-3xl text-paper/85">
            {panel.monthYear}
          </p>
        </div>

        <div
          className="reveal flex items-end justify-between"
          style={{ animationDelay: "220ms" }}
        >
          <p className="max-w-xs text-sm leading-relaxed text-paper/55">
            A quiet ledger for the days you intend to keep.
          </p>
          <div className="grid size-[4.5rem] rotate-6 place-items-center rounded-full border-2 border-cinnabar font-display text-3xl text-cinnabar">
            日
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-paper px-6 py-16">
        <div className="w-full max-w-[22rem]">
          <div className="reveal mb-10 lg:hidden">
            <p className="font-sans text-xs tracking-[0.35em] uppercase text-cinnabar">
              Rili
            </p>
            <p className="mt-3 font-display text-4xl">
              {panel.weekday} {panel.day}
            </p>
          </div>

          <div className="reveal" style={{ animationDelay: "80ms" }}>
            <h1 className="font-display text-4xl leading-tight">Sign in</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink/55">
              Enter a username and password to open today&apos;s desk.
            </p>
          </div>

          <Form
            className="reveal mt-10"
            style={{ animationDelay: "160ms" }}
            layout="vertical"
            requiredMark={false}
            onFinish={onFinish}
          >
            <Form.Item
              name="username"
              label={
                <span className="text-[11px] tracking-[0.18em] uppercase">
                  Username
                </span>
              }
              rules={[{ required: true, message: "Please enter a username" }]}
            >
              <Input
                className="rili-input"
                size="large"
                autoComplete="username"
                spellCheck={false}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <span className="text-[11px] tracking-[0.18em] uppercase">
                  Password
                </span>
              }
              rules={[{ required: true, message: "Please enter a password" }]}
            >
              <Input.Password
                className="rili-input"
                size="large"
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
              Enter
            </Button>
          </Form>
        </div>
      </section>
    </div>
  );
}
