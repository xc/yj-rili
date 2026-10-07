"use client";

import { PlusOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, message } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateMaintainerButton } from "@/components/CreateMaintainerButton";
import { Get, Post } from "@/lib/clientUtil";
import { TASKS_CHANGED_EVENT } from "./taskListQuery";

type ServerVideo = {
  name: string;
  path: string;
  url: string;
};

export function CreateTaskButton({
  maintainers,
  templates,
}: {
  maintainers: { id: number; name: string }[];
  templates: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videosOpen, setVideosOpen] = useState(false);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videos, setVideos] = useState<ServerVideo[]>([]);
  const [maintainerOptions, setMaintainerOptions] = useState(maintainers);
  const [form] = Form.useForm<{
    name: string;
    maintainerId: number;
    templateId: number;
    videoPath?: string;
    videoStartTime?: string;
  }>();
  const videoPath = Form.useWatch("videoPath", form);
  const router = useRouter();

  const close = () => {
    setOpen(false);
    setVideosOpen(false);
  };

  const onChooseVideo = async () => {
    setVideos([]);
    setVideosOpen(true);
    setVideosLoading(true);
    try {
      const data = await Get<{ videos: ServerVideo[] }>("/api/videos");
      setVideos(data.videos);
    } catch (error) {
      setVideos([]);
      message.error(error instanceof Error ? error.message : "读取视频失败");
    } finally {
      setVideosLoading(false);
    }
  };

  const onPickVideo = (video: ServerVideo) => {
    form.setFieldValue("videoPath", video.path);
    void form.validateFields(["videoPath"]);
    setVideosOpen(false);
  };

  const onCreate = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await Post("/api/tasks", {
        name: values.name.trim(),
        maintainerId: values.maintainerId,
        templateId: values.templateId,
        video: {
          path: values.videoPath?.trim() || null,
          start_time: values.videoStartTime?.trim() || null,
        },
      });
      message.success("创建成功");
      close();
      form.resetFields();
      window.dispatchEvent(new Event(TASKS_CHANGED_EVENT));
      router.push("/tasks?page=1");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
        创建
      </Button>
      <Modal
        title={
          <span className="inline-flex items-center gap-2">
            <PlusOutlined />
            创建任务
          </span>
        }
        open={open}
        onOk={onCreate}
        onCancel={close}
        confirmLoading={loading}
        destroyOnHidden
        okText="创建"
        cancelText="取消"
        okButtonProps={{ icon: <PlusOutlined /> }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="templateId"
            label="模板"
            rules={[{ required: true, message: "请选择模板" }]}
          >
            <Select
              placeholder="请选择模板"
              options={templates.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
            />
          </Form.Item>
          <Form.Item label="维保员" required>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Form.Item
                  name="maintainerId"
                  noStyle
                  rules={[{ required: true, message: "请选择维保员" }]}
                >
                  <Select
                    placeholder="请选择维保员"
                    options={maintainerOptions.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </div>
              <CreateMaintainerButton
                onCreated={(item) => {
                  setMaintainerOptions((current) =>
                    current.some((option) => option.id === item.id)
                      ? current
                      : [...current, item],
                  );
                  form.setFieldValue("maintainerId", item.id);
                }}
              >
                创建维保员
              </CreateMaintainerButton>
            </div>
          </Form.Item>
          <Form.Item label="视频" required>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {videoPath ? <span style={{ color: "#595959" }}>{videoPath}</span> : null}
              <Button icon={<VideoCameraOutlined />} onClick={onChooseVideo}>
                选择视频
              </Button>
            </div>
            <Form.Item
              name="videoPath"
              noStyle
              rules={[{ required: true, message: "请选择视频" }]}
            >
              <input type="hidden" />
            </Form.Item>
          </Form.Item>
          <Form.Item
            name="videoStartTime"
            label="视频起始时间"
            rules={[
              {
                validator(_, value) {
                  const text = String(value ?? "").trim();
                  if (!text || /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/.test(text)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("格式应为 YYYY/MM/DD HH:MM:SS"));
                },
              },
            ]}
          >
            <Input autoComplete="off" placeholder="可选，YYYY/MM/DD HH:MM:SS" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="选择视频"
        open={videosOpen}
        onCancel={() => setVideosOpen(false)}
        footer={null}
        destroyOnHidden
        width={960}
      >
        {videosLoading ? (
          <div className="py-6 text-center text-neutral-500">加载中</div>
        ) : videos.length > 0 ? (
          <div className="grid max-h-[70vh] grid-cols-3 gap-4 overflow-auto">
            {videos.map((video) => (
              <div key={video.path}>
                <video
                  src={video.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full rounded bg-black object-contain"
                />
                <button
                  type="button"
                  title={video.name}
                  className="mt-1 block w-full truncate rounded px-2 py-2 text-left hover:bg-neutral-50"
                  onClick={() => onPickVideo(video)}
                >
                  {video.name}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-neutral-500">暂无视频</div>
        )}
      </Modal>
    </>
  );
}
