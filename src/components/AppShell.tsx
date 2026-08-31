"use client";

import {
  ControlOutlined,
  DashboardOutlined,
  LogoutOutlined,
  ProfileOutlined,
  SettingOutlined,
  SnippetsOutlined,
  TeamOutlined,
  ToolOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Menu } from "antd";
import type { MenuProps } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

const items: MenuProps["items"] = [
  {
    key: "/",
    icon: <DashboardOutlined />,
    label: "面板",
  },
  {
    key: "tasks",
    icon: <UnorderedListOutlined />,
    label: "任务",
    children: [{ key: "/tasks", icon: <ProfileOutlined />, label: "任务管理" }],
  },
  {
    key: "settings",
    icon: <SettingOutlined />,
    label: "设置",
    children: [
      { key: "/settings/users", icon: <TeamOutlined />, label: "用户管理" },
      {
        key: "/settings/templates",
        icon: <SnippetsOutlined />,
        label: "模板管理",
      },
      {
        key: "/settings/maintainers",
        icon: <ToolOutlined />,
        label: "维保员管理",
      },
      { key: "/settings/system", icon: <ControlOutlined />, label: "系统设置" },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const onMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key.startsWith("/")) {
      router.push(key);
    }
  };

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="flex w-[15.5rem] shrink-0 flex-col border-r border-rule bg-ink text-white">
        <div className="flex h-14 items-center px-5">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="logo" className="h-12 w-auto" />
          </Link>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={["tasks", "settings"]}
          items={items}
          onClick={onMenuClick}
          className="rili-sider-menu flex-1"
        />

        <div className="mt-auto border-t border-white/10 px-4 py-4">
          <p className="truncate px-2 text-xs text-white">已登录</p>
          <p className="truncate px-2 pt-1 text-white">{user?.username}</p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm text-white transition-colors hover:bg-ink-soft"
          >
            <LogoutOutlined />
            退出
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
