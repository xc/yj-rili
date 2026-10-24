"use client";

import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Select, Space, Table, message } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Post } from "@/lib/clientUtil";
import {
  templateTypeName,
  type TemplateTypeOption,
} from "@/lib/templateType";

type TemplateRow = {
  id: number;
  name: string;
  type: string;
  rule: unknown;
};

function jsonText(rule: unknown) {
  return JSON.stringify(rule ?? {}, null, 2);
}

export function TemplatesTable({
  templates,
  typeOptions,
}: {
  templates: TemplateRow[];
  typeOptions: TemplateTypeOption[];
}) {
  const router = useRouter();
  const [viewing, setViewing] = useState<TemplateRow | null>(null);
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [draft, setDraft] = useState("");
  const [editType, setEditType] = useState("");
  const [saving, setSaving] = useState(false);

  const openEdit = (record: TemplateRow) => {
    setDraft(jsonText(record.rule));
    setEditType(record.type);
    setEditing(record);
  };

  const closeEdit = () => {
    if (saving) {
      return;
    }
    setEditing(null);
  };

  const onSave = async () => {
    if (!editing) {
      return;
    }
    let rule: unknown;
    try {
      rule = JSON.parse(draft);
    } catch {
      message.error("JSON 格式无效");
      return;
    }
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
      message.error("JSON 须为对象");
      return;
    }
    if (!typeOptions.some((item) => item.value === editType)) {
      message.error("请选择类型");
      return;
    }

    setSaving(true);
    try {
      await Post("/api/templates/update", {
        id: editing.id,
        type: editType,
        rule,
      });
      message.success("已保存");
      setEditing(null);
      router.refresh();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Table
        className="rili-task-table"
        columns={[
          { title: "ID", dataIndex: "id", key: "id", width: 80 },
          { title: "名称", dataIndex: "name", key: "name" },
          {
            title: "类型",
            dataIndex: "type",
            key: "type",
            width: 120,
            render: (type: string) => templateTypeName(type, typeOptions),
          },
          {
            title: "操作",
            key: "actions",
            width: 180,
            render: (_: unknown, record: TemplateRow) => (
              <Space size="small">
                <Button
                  size="small"
                  color="green"
                  variant="solid"
                  icon={<EyeOutlined />}
                  onClick={() => setViewing(record)}
                >
                  查看
                </Button>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEdit(record)}
                >
                  编辑
                </Button>
              </Space>
            ),
          },
        ]}
        rowClassName={(_, index) =>
          index % 2 === 0 ? "rili-task-row-odd" : "rili-task-row-even"
        }
        dataSource={templates}
        rowKey="id"
        pagination={false}
      />
      <Modal
        title={viewing?.name ?? "模板"}
        open={viewing !== null}
        onCancel={() => setViewing(null)}
        footer={null}
        destroyOnHidden
      >
        <pre className="max-h-[60vh] overflow-auto rounded bg-neutral-50 p-3 text-sm whitespace-pre-wrap">
          {jsonText(viewing?.rule)}
        </pre>
      </Modal>
      <Modal
        title={editing ? `编辑：${editing.name}` : "编辑"}
        open={editing !== null}
        onOk={onSave}
        onCancel={closeEdit}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
        width={720}
        destroyOnHidden
      >
        <div className="mb-4">
          <div className="mb-2">类型</div>
          <Select
            className="w-full"
            placeholder="请选择类型"
            value={editType || undefined}
            onChange={setEditType}
            options={typeOptions.map((item) => ({
              value: item.value,
              label: item.name,
            }))}
          />
        </div>
        <Input.TextArea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          autoSize={{ minRows: 12, maxRows: 24 }}
          spellCheck={false}
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
        />
      </Modal>
    </>
  );
}
