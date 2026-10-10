"use client";

import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Spin, Table, Tabs, message } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Get, Post } from "@/lib/clientUtil";
import { getDetectTypeLabel } from "@/lib/detectType";

type CheckRow = {
  id: string;
  start_time: string;
  end_time: string;
  type: "behavior" | "part";
  labels: string[];
  area?: string;
  part_id?: string;
};

/**
 * 
 * 
 *  id: crypto.randomUUID(),
      type: "behavior",
      area: item.区域 ?? "",
      analystics: item.分析 ?? "",
      behavior: item.行为 ?? "",
      _start_time: toClock(item.开始时间, startTime),
      _end_time: toClock(item.结束时间, startTime),
 */

type BehaviorRow = {
  _id: string;
  _start_time: string;
  _end_time: string;
  analystics: string;
  behavior: string;
  area: string;
};

/*

Example:
{
      "track_id": 3,
      "cls": 0,
      "name": "轿门",
      "start": 12.333,
      "end": 18.667,
      "duration": 6.334,
      "max_conf": 0.87,
      "frames": 20,
      "boxes": [
        { "time": 12.333, "conf": 0.81, "xyxy": [412.5, 233.0, 560.75, 402.25] },
        { "time": 12.667, "conf": 0.87, "xyxy": [415.0, 234.5, 562.0, 404.0] }
      ]
    }
*/

type ComponentRow = {
  _id: string;
  _start_time: string;
  _end_time: string;
  track_id: string;
  name: string;
  duration: number;
  max_conf: number;
  frames: number;
  boxes: {
    time: string;
    conf: number;
    xyxy: [number, number, number, number];
  }[];
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
  detectType: string;
  createdAt: string;
  resultDetail: (BehaviorRow | ComponentRow)[];
  logs: LogRow[];
  template: TaskTemplate;
  videoUrl: string | null;
};

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

function requiredNames(rule: TaskTemplate["rule"] | undefined) {
  const mandatory = rule?.required;
  return {
    behaviors: Array.isArray(mandatory?.behavior) ? mandatory.behavior : [],
    components: Array.isArray(mandatory?.component) ? mandatory.component : [],
  };
}

function isRequiredHit(
  type: "behavior" | "component",
  record: BehaviorRow | ComponentRow,
  behaviors: string[],
  components: string[],
) {
  const name = type === "behavior" ? record.behavior : record.name;

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
  onChanged,
}: {
  taskId: number | null;
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
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
        const resultDetail = data.task.resultDetail.map((item) => ({
          ...item,
          _id: crypto.randomUUID(),
        }));
        setDetail({
          ...data.task,
          resultDetail,
        });
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
  console.log(detail);

  const results = Array.isArray(detail?.resultDetail)
    ? detail.resultDetail
    : [];
  const logs = Array.isArray(detail?.logs) ? detail.logs : [];
  const canReview = detail?.status === 4;
  const { behaviors: requiredBehaviors, components: requiredComponents } =
    requiredNames(detail?.template?.rule);
  // const missingRequired = [
  //   ...requiredBehaviors.filter(
  //     (name) =>
  //       !results.some(
  //         (row) => row.type === "behavior" && row.labels.includes(name),
  //       ),
  //   ),
  //   ...requiredComponents.filter(
  //     (name) =>
  //       !results.some(
  //         (row) => row.type === "part" && row.labels.includes(name),
  //       ),
  //   ),
  // ];

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
      onChanged?.();
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
            <span className="mx-2">·</span>
            检测类型：
            {detail ? getDetectTypeLabel(detail.detectType) || "—" : "—"}
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
          {detail?.videoUrl ? (
            <video
              ref={videoRef}
              className="mx-auto block bg-black"
              style={{ width: "100%", maxWidth: 720, height: "auto" }}
              src={detail.videoUrl}
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="py-10 text-center text-neutral-500">暂无视频</div>
          )}
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
                      {/* <>
                        {requiredBehaviors.length > 0 ? (
                          <div className="mb-2 text-sm" style={{ color: "#cf1322" }}>
                            缺失必检：{requiredBehaviors.join("、")}
                          </div>
                        ) : null}
                        {requiredComponents.length > 0 ? (
                          <div className="mb-2 text-sm" style={{ color: "#cf1322" }}>
                            缺失必检：{requiredComponents.join("、")}
                          </div>
                        ) : null}
                      </> */}
                      <Table
                        className="rili-task-table"
                        size="small"
                        pagination={false}
                        dataSource={results}
                        rowKey="_id"
                        columns={[
                          {
                            title: "开始时间",
                            dataIndex: "_start_time",
                            width: 50,
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
                            dataIndex: "_end_time",
                            width: 90,
                          },
                          ...(detail?.detectType === "action"
                            ? [
                                {
                                  title: "行为",
                                  dataIndex: "behavior",
                                  width: 120,
                                },
                                {
                                  title: "分析",
                                  dataIndex: "analystics",
                                  width: 120,
                                },
                              ]
                            : [
                                {
                                  title: "零件",
                                  dataIndex: "name",
                                  width: 120,
                                },
                              ]),
                          {
                            title: "匹配?",
                            key: "required",
                            width: 72,
                            align: "center" as const,
                            render: (_: unknown, record: CheckRow) =>
                              isRequiredHit(
                                detail?.detectType,
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
