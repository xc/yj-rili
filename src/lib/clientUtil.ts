"use client";

import { timeToSeconds } from "@/app/(slug)/tasks/detectionBoxes";
import type {
  ExistRule,
  RuleContent,
  RuleItem,
  SequenceRule,
} from "@/lib/detectType";
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

export type MatchBehavior = {
  area?: string;
  behavior?: string;
  _start_time?: string;
  _end_time?: string;
};

export type FailedRule = {
  id: string;
  kind: "存在" | "序列";
  ruleName: string;
  rule: RuleItem;
};

function sameStep(
  row: MatchBehavior,
  step: { area: string; objectName: string },
) {
  return row.area === step.area && row.behavior === step.objectName;
}

function existPasses(rule: ExistRule, rows: MatchBehavior[]) {
  const condition = rule.condition;
  const minTime = condition?.minTime;
  return rows.some((row) => {
    if (!condition || !sameStep(row, condition)) {
      return false;
    }
    if (minTime == null) {
      return true;
    }
    const duration =
      timeToSeconds(row._end_time ?? "") - timeToSeconds(row._start_time ?? "");
    return duration > minTime;
  });
}

function sequencePasses(rule: SequenceRule, rows: MatchBehavior[]) {
  let from = 0;
  for (const step of rule.condition ?? []) {
    const found = rows.findIndex(
      (row, index) => index >= from && sameStep(row, step),
    );
    if (found < 0) {
      return false;
    }
    from = found + 1;
  }
  return true;
}

export function failedRuleMessages(
  rule: { ruleContent?: RuleContent } | null | undefined,
  rows: MatchBehavior[],
) {
  const items = rule?.ruleContent ?? [];
  const failed: FailedRule[] = [];
  for (const item of items) {
    if (item.type === "exist" && !existPasses(item, rows)) {
      failed.push({
        id: item.id,
        kind: "存在",
        ruleName: item.ruleName,
        rule: item,
      });
    }
    if (item.type === "sequence" && !sequencePasses(item, rows)) {
      failed.push({
        id: item.id,
        kind: "序列",
        ruleName: item.ruleName,
        rule: item,
      });
    }
  }
  console.log(failed);
  return failed;
}
