"use client";

import { EditOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Table, message } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Post } from "@/lib/clientUtil";

type ListRow = {
  id: number;
  key: string;
  value: string;
};

export function DictionaryTable({ items }: { items: ListRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<ListRow | null>(null);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const openEdit = (record: ListRow) => {
    setKey(record.key);
    setValue(record.value);
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
    const nextKey = key.trim();
    if (!nextKey) {
      message.error("请输入键");
      return;
    }

    setSaving(true);
    try {
      await Post("/api/lists/update", {
        id: editing.id,
        key: nextKey,
        value,
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
          { title: "键", dataIndex: "key", key: "key", width: 180 },
          {
            title: "值",
            dataIndex: "value",
            key: "value",
            render: (text: string) => (
              <pre className="m-0 max-h-24 overflow-auto whitespace-pre-wrap break-all text-sm">
                {text}
              </pre>
            ),
          },
          {
            title: "操作",
            key: "actions",
            width: 120,
            render: (_: unknown, record: ListRow) => (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
              >
                编辑
              </Button>
            ),
          },
        ]}
        rowClassName={(_, index) =>
          index % 2 === 0 ? "rili-task-row-odd" : "rili-task-row-even"
        }
        dataSource={items}
        rowKey="id"
        pagination={false}
      />
      <Modal
        title={editing ? `编辑：${editing.key}` : "编辑"}
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
          <div className="mb-2">键</div>
          <Input value={key} onChange={(event) => setKey(event.target.value)} />
        </div>
        <div>
          <div className="mb-2">值</div>
          <Input.TextArea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoSize={{ minRows: 8, maxRows: 18 }}
            spellCheck={false}
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          />
        </div>
      </Modal>
    </>
  );
}
