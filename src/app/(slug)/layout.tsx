import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/Guards";

export default function DeskLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
