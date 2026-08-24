"use client";

import {
  BookOutlined,
  CalendarOutlined,
  LogoutOutlined,
  SunOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

const navItems = [
  { href: "/", label: "Today", icon: SunOutlined, end: true },
  { href: "/calendar", label: "Calendar", icon: CalendarOutlined, end: false },
  { href: "/notes", label: "Notes", icon: BookOutlined, end: false },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="flex w-[15.5rem] shrink-0 flex-col border-r border-rule bg-ink text-paper">
        <div className="px-6 pt-8 pb-6">
          <p className="font-sans text-[11px] tracking-[0.38em] uppercase text-cinnabar">
            Rili
          </p>
          <p className="mt-3 font-display text-2xl leading-none">Desk</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.end
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm tracking-wide transition-colors",
                  isActive
                    ? "bg-cinnabar text-paper"
                    : "text-paper/65 hover:bg-ink-soft hover:text-paper",
                ].join(" ")}
              >
                <Icon />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 px-4 py-4">
          <p className="truncate px-2 text-xs tracking-[0.16em] uppercase text-paper/40">
            Signed in
          </p>
          <p className="truncate px-2 pt-1 font-display text-lg">
            {user?.username}
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm text-paper/60 transition-colors hover:bg-ink-soft hover:text-paper"
          >
            <LogoutOutlined />
            Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
