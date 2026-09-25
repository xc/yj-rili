"use client";

import { Select } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { taskListQuery } from "./taskListQuery";

export function TasksBranchFilter({
  branches,
  branchId,
  pageSize,
}: {
  branches: { id: number; name: string }[];
  branchId: number | null;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-sm text-black/65">分公司</span>
      <Select
        allowClear
        placeholder="全部"
        value={branchId ?? undefined}
        style={{ width: 200 }}
        options={branches.map((item) => ({
          value: item.id,
          label: item.name,
        }))}
        onChange={(value: number | undefined) => {
          router.push(
            `${pathname}?${taskListQuery({
              page: 1,
              pageSize,
              branchId: value ?? null,
            })}`,
          );
        }}
      />
    </div>
  );
}
