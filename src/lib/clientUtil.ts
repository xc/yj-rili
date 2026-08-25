"use client";

import { AUTH_TOKEN_KEY } from "@/lib/token";

type ApiEnvelope<T> = {
  error: boolean;
  data: T;
};

function withToken(headers?: HeadersInit) {
  const next = new Headers(headers);
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    next.set("Authorization", `Bearer ${token}`);
  }
  return next;
}

async function parse<T>(response: Response) {
  const body = (await response.json()) as ApiEnvelope<T & { message?: string }>;
  if (body.error) {
    throw new Error(body.data?.message ?? "请求失败");
  }
  return body.data;
}

export async function Get<T>(url: string) {
  const response = await fetch(url, {
    method: "GET",
    headers: withToken(),
  });
  return parse<T>(response);
}

export async function Post<T>(url: string, data?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: withToken({ "Content-Type": "application/json" }),
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  return parse<T>(response);
}
