"use client";

import {
  BankOutlined,
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
import { isAdmin } from "@/lib/roles";

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
      {
        key: "/settings/branches",
        icon: <BankOutlined />,
        label: "分公司管理",
      },
      { key: "/settings/system", icon: <ControlOutlined />, label: "系统设置" },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const admin = isAdmin(user?.roles);
  const menuItems = admin
    ? items ?? []
    : (items ?? []).filter(
        (item) => item && "key" in item && item.key !== "settings",
      );

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
      <aside className="sticky top-0 flex h-screen w-[15.5rem] shrink-0 flex-col overflow-hidden border-r border-rule bg-ink text-white">
        <div className="flex h-14 shrink-0 items-center px-5">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="logo" className="h-12 w-auto" />
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            defaultOpenKeys={admin ? ["tasks", "settings"] : ["tasks"]}
            items={menuItems}
            onClick={onMenuClick}
            className="rili-sider-menu"
          />
        </div>

        <div className="shrink-0 border-t border-white/10 px-4 pb-4 pt-2">
          <p className="flex items-baseline justify-between gap-2 px-2">
            <span className="min-w-0 truncate text-white">{user?.username}</span>
            {user?.branch ? (
              <span className="shrink-0 text-xs text-white/55">
                {user.branch}
              </span>
            ) : null}
          </p>
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
