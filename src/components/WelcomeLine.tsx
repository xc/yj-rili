"use client";

import { useAuth } from "@/lib/auth";

export function WelcomeLine() {
  const { user } = useAuth();

  return (
    <p className="max-w-xs text-right text-sm leading-relaxed text-ink/50">
      Good day, {user?.username}. The desk is set.
    </p>
  );
}
