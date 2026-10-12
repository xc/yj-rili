import { NextResponse } from "next/server";
import dayjs from "dayjs";

export function writeError(message: string, status = 400) {
  return NextResponse.json(
    {
      error: true,
      data: { message },
    },
    { status },
  );
}

export function writeResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      error: false,
      data,
    },
    { status },
  );
}

export const taskStatus = {
  "0": "待处理",
  "1": "完成",
  "2": "进行中",
  "3": "未通过",
  "4": "已检测",
  "5": "失败",
  "6": "已终止",
} as const;

export enum TaskStatus {
  Pending = 0,
  Done = 1,
  Ongoing = 2,
  Cancelled = 3,
  Detected = 4,
  Failed = 5,
  Terminated = 6,
}

export function getTaskStatusLabel(status: number | string) {
  const key = String(status) as keyof typeof taskStatus;
  return taskStatus[key] ?? String(status);
}

export function formatTaskProgress(
  status: number | string,
  progress: string | null | undefined,
) {
  const ongoing =
    status === TaskStatus.Ongoing ||
    status === getTaskStatusLabel(TaskStatus.Ongoing) ||
    String(status) === String(TaskStatus.Ongoing);
  if (!ongoing) {
    return "-";
  }
  const [current, total] = (progress ?? "").split("/");
  if (!current || !total) {
    return "-";
  }
  return `${current}/${total}`;
}

export function formatDateTime(date: Date) {
  return dayjs(date).format("YYYY-MM-DD HH:mm");
}
