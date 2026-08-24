"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { theme } from "@/lib/theme";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={theme}>
        <AuthProvider>{children}</AuthProvider>
      </ConfigProvider>
    </AntdRegistry>
  );
}
