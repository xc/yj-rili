"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";

function Splash() {
  return <div className="min-h-screen bg-paper" />;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  if (!ready || !user) return <Splash />;
  return children;
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const allowed = isAdmin(user?.roles);

  useEffect(() => {
    if (ready && user && !allowed) {
      router.replace("/");
    }
  }, [ready, user, allowed, router]);

  if (!ready || !user || !allowed) return <Splash />;
  return children;
}

export function GuestGuard({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) {
      router.replace("/");
    }
  }, [ready, user, router]);

  if (ready && user) return <Splash />;
  return children;
}
