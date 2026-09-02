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
} as const;

export enum TaskStatus {
  Pending = 0,
  Done = 1,
  Ongoing = 2,
  Cancelled = 3,
  Detected = 4,
}

export function getTaskStatusLabel(status: number | string) {
  const key = String(status) as keyof typeof taskStatus;
  return taskStatus[key] ?? String(status);
}

export function formatDateTime(date: Date) {
  return dayjs(date).format("YYYY-MM-DD HH:mm");
}
