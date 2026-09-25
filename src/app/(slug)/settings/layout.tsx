import type { ReactNode } from "react";
import { AdminGuard } from "@/components/Guards";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
