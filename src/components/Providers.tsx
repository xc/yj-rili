"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import zh_CN from "antd/locale/zh_CN";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { theme } from "@/lib/theme";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider locale={zh_CN} theme={theme}>
        <AuthProvider>{children}</AuthProvider>
      </ConfigProvider>
    </AntdRegistry>
  );
}
