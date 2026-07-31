"use client";

import { Row, Col, InputNumber, Typography, Card } from "antd";

const { Text } = Typography;

// ──────────────────────────────────────────
// Pemeriksaan Fisik — Objective (extensible)
// Tambah parameter baru cukup tambah item di PHYSICAL_EXAM_FIELDS,
// TANPA perubahan database.
// ──────────────────────────────────────────
export const PHYSICAL_EXAM_FIELDS = [
  { key: "weight", label: "Berat Badan", unit: "kg" },
  { key: "temperature", label: "Suhu Tubuh", unit: "°C" },
  // Future: heartRate (HR), respiratoryRate (RR), CRT, BCS, dll
] as const;

interface PhysicalExamEditorProps {
  value?: { key: string; label: string; value?: number; unit?: string }[];
  onChange?: (items: { key: string; label: string; value?: number; unit?: string }[]) => void;
}

export default function PhysicalExamEditor({ value = [], onChange }: PhysicalExamEditorProps) {
  const items = value.length > 0 ? value : PHYSICAL_EXAM_FIELDS.map((f) => ({ key: f.key, label: f.label, unit: f.unit }));

  const updateValue = (key: string, val?: number) => {
    onChange?.(items.map((i) => (i.key === key ? { ...i, value: val } : i)));
  };

  return (
    <Row gutter={16}>
      {items.map((item) => (
        <Col span={8} key={item.key}>
          <Text strong>{item.label}</Text>
          <InputNumber
            style={{ width: "100%", marginTop: 4 }}
            min={0}
            placeholder={item.unit || ""}
            value={item.value}
            onChange={(v) => updateValue(item.key, v ?? undefined)}
            addonAfter={item.unit}
          />
        </Col>
      ))}
    </Row>
  );
}
