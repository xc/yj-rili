"use client";

import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Spin, Table, Tabs, message } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Get, Post } from "@/lib/clientUtil";

type CheckRow = {
  id: string;
  start_time: string;
  end_time: string;
  type: "behavior" | "part";
  area?: string;
  behavior_name?: string;
  part_name?: string;
  part_id?: string;
};

type LogRow = {
  key?: number;
  time: string;
  offset?: string;
  message: string;
};

type TaskTemplate = {
  id: number;
  name: string;
  rule: {
    required?: {
      behavior?: string[];
      component?: string[];
    };
  };
};

type TaskDetail = {
  id: number;
  name: string;
  status: number;
  comment: string;
  createdAt: string;
  resultDetail: CheckRow[];
  logs: LogRow[];
  template: TaskTemplate;
};

const SAMPLE_VIDEO = "/video_subtitle.mp4";

const resultTypeLabel: Record<string, string> = {
  part: "零件",
  behavior: "行为",
};

const taskStatusLabel: Record<number, string> = {
  0: "待处理",
  1: "完成",
  2: "进行中",
  3: "未通过",
  4: "已检测",
};

const statusTone: Record<string, { color: string; background: string }> = {
  待处理: { color: "#d46b08", background: "#fff7e6" },
  完成: { color: "#389e0d", background: "#f6ffed" },
  进行中: { color: "#1677ff", background: "#e6f4ff" },
  取消: { color: "#cf1322", background: "#fff2f0" },
  未通过: { color: "#cf1322", background: "#fff2f0" },
  已检测: { color: "#08979c", background: "#e6fffb" },
};

function resultName(record: CheckRow) {
  return record.type === "behavior" ? record.behavior_name : record.part_name;
}

function requiredNames(rule: TaskTemplate["rule"] | undefined) {
  const mandatory = rule?.required;
  return {
    behaviors: Array.isArray(mandatory?.behavior) ? mandatory.behavior : [],
    components: Array.isArray(mandatory?.component) ? mandatory.component : [],
  };
}

function isRequiredHit(
  record: CheckRow,
  behaviors: string[],
  components: string[],
) {
  const name = resultName(record);
  if (!name) {
    return false;
  }
  if (record.type === "behavior") {
    return behaviors.includes(name);
  }
  return components.includes(name);
}

function timeToSeconds(value: string) {
  const parts = value.split(":").map(Number);
  if (parts.some((part) => Number.isNaN(part))) {
    return 0;
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] ?? 0;
}

export function TaskDetailModal({
  taskId,
  open,
  onClose,
}: {
  taskId: number | null;
  open: boolean;
  onClose: () => void;
}) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open || taskId === null) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setDetail(null);
    setComment("");

    Get<{ task: TaskDetail }>(`/api/tasks/${taskId}`)
      .then((data) => {
        if (cancelled) {
          return;
        }
        setDetail(data.task);
        setComment(data.task.comment);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        message.error(error instanceof Error ? error.message : "加载失败");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, taskId]);

  const results = Array.isArray(detail?.resultDetail)
    ? detail.resultDetail
    : [];
  const logs = Array.isArray(detail?.logs) ? detail.logs : [];
  const canReview = detail?.status === 4;
  const { behaviors: requiredBehaviors, components: requiredComponents } =
    requiredNames(detail?.template?.rule);
  const missingRequired = [
    ...requiredBehaviors.filter(
      (name) =>
        !results.some(
          (row) => row.type === "behavior" && row.behavior_name === name,
        ),
    ),
    ...requiredComponents.filter(
      (name) =>
        !results.some((row) => row.type === "part" && row.part_name === name),
    ),
  ];

  const seekTo = (time: string) => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.currentTime = timeToSeconds(time);
    void video.play();
  };

  const resetAndClose = () => {
    setComment("");
    setDetail(null);
    onClose();
  };

  const onDecide = async (passed: boolean) => {
    if (taskId === null) {
      return;
    }
    setSaving(true);
    try {
      await Post(`/api/tasks/${taskId}`, {
        status: passed ? 1 : 3,
        comment,
      });
      message.success(passed ? "已通过" : "已驳回");
      resetAndClose();
      router.refresh();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "操作失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        <div>
          <div className="flex items-center gap-2">
            <span>{detail?.name ?? "任务详情"}</span>
            {detail ? (
              <span
                className="text-sm font-normal"
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: 4,
                  color:
                    statusTone[taskStatusLabel[detail.status]]?.color ??
                    "#595959",
                  background:
                    statusTone[taskStatusLabel[detail.status]]?.background ??
                    "#f5f5f5",
                }}
              >
                {taskStatusLabel[detail.status] ?? String(detail.status)}
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-sm font-normal text-black/45">
            创建时间：{detail?.createdAt ?? "—"}
          </div>
        </div>
      }
      open={open}
      onCancel={resetAndClose}
      footer={null}
      width={1100}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        <div className="mt-2">
          <video
            ref={videoRef}
            className="mx-auto block bg-black"
            style={{ width: "100%", maxWidth: 720, height: "auto" }}
            src={SAMPLE_VIDEO}
            controls
            playsInline
          />
          <div className="mt-4">
            <Tabs
              size="small"
              styles={{
                content: { height: 260, overflow: "auto" },
              }}
              items={[
                {
                  key: "result",
                  label: "结果",
                  children: (
                    <>
                      {missingRequired.length > 0 ? (
                        <div className="mb-2 text-sm" style={{ color: "#cf1322" }}>
                          缺失必检：{missingRequired.join("、")}
                        </div>
                      ) : null}
                      <Table
                      className="rili-task-table"
                      size="small"
                      pagination={false}
                      dataSource={results}
                      rowKey="id"
                      columns={[
                        {
                          title: "开始时间",
                          dataIndex: "start_time",
                          width: 90,
                          render: (time: string) => (
                            <button
                              type="button"
                              style={{ color: "#1677ff" }}
                              className="hover:underline"
                              onClick={() => seekTo(time)}
                            >
                              {time}
                            </button>
                          ),
                        },
                        {
                          title: "结束时间",
                          dataIndex: "end_time",
                          width: 90,
                        },
                        {
                          title: "类型",
                          dataIndex: "type",
                          width: 80,
                          render: (type: CheckRow["type"]) =>
                            resultTypeLabel[type] ?? type,
                        },
                        {
                          title: "名称",
                          key: "name",
                          render: (_: unknown, record: CheckRow) =>
                            resultName(record),
                        },
                        {
                          title: "",
                          key: "required",
                          width: 48,
                          align: "center" as const,
                          render: (_: unknown, record: CheckRow) =>
                            isRequiredHit(
                              record,
                              requiredBehaviors,
                              requiredComponents,
                            ) ? (
                              <CheckOutlined style={{ color: "#389e0d" }} />
                            ) : null,
                        },
                      ]}
                    />
                    </>
                  ),
                },
                {
                  key: "log",
                  label: "日志",
                  children: (
                    <Table
                      className="rili-task-table"
                      size="small"
                      pagination={false}
                      dataSource={logs}
                      columns={[
                        { title: "时间", dataIndex: "time", width: 170 },
                        { title: "内容", dataIndex: "message" },
                      ]}
                    />
                  ),
                },
              ]}
            />
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-2">备注</div>
          {canReview ? (
            <Input.TextArea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              placeholder="请输入备注"
            />
          ) : (
            <div className="min-h-[4.5rem] whitespace-pre-wrap break-words text-black/85">
              {comment || "—"}
            </div>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <Button onClick={resetAndClose} disabled={saving}>
              关闭
            </Button>
            {canReview ? (
              <>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  loading={saving}
                  disabled={loading || !detail}
                  onClick={() => onDecide(false)}
                >
                  驳回
                </Button>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={saving}
                  disabled={loading || !detail}
                  onClick={() => onDecide(true)}
                >
                  通过
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </Spin>
    </Modal>
  );
}
