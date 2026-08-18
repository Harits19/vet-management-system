"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Button, Space, Typography, Alert, Spin } from "antd";
import { useAuth, apiFetch, API_URL } from "../../../context/auth";
import { useAntdMessage } from "../../../hooks/useAntdMessage";
import { useAntdModal } from "../../../hooks/useAntdModal";

const { Title, Text } = Typography;

export default function AttendanceQrPage() {
  const { user, loading } = useAuth();
  const msg = useAntdMessage();
  const modal = useAntdModal();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const loadQr = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/attendance/qr`, { credentials: "include" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || `Gagal memuat QR (${res.status})`);
      }
      const blob = await res.blob();
      setQrUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
    } catch (e: any) {
      setError(e.message || "Gagal memuat QR");
    }
  }, []);

  useEffect(() => {
    if (!loading && user) loadQr();
  }, [loading, user, loadQr]);

  const regenerate = () => {
    modal.confirm({
      title: "Generate Ulang QR Absensi?",
      content:
        "QR lama akan langsung tidak berlaku setelah ini. Cetak QR baru dan ganti yang ditempel di tempat absen.",
      okText: "Generate Ulang",
      okType: "danger",
      cancelText: "Batal",
      onOk: async () => {
        setRegenerating(true);
        try {
          await apiFetch("/api/attendance/qr/regenerate", { method: "POST" });
          msg.success("QR baru berhasil dibuat — QR lama tidak berlaku lagi");
          await loadQr();
        } catch (e: any) {
          msg.error(e.message || "Gagal generate ulang QR");
        } finally {
          setRegenerating(false);
        }
      },
    });
  };

  if (loading) return null;
  if (!user) return null;

  if (user.role !== "superadmin") {
    return (
      <Card>
        <Alert type="error" showIcon message="Halaman ini hanya untuk superadmin." />
      </Card>
    );
  }

  return (
    <Card>
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Title level={4}>QR Absensi (Statis)</Title>
        <Text type="secondary">
          Cetak QR ini lalu tempel di tempat absensi (resepsionis / pintu masuk). Karyawan membuka
          menu Absensi di HP lalu memindai QR ini untuk absen masuk/pulang. Secret QR disimpan di
          database — generate ulang membuat QR baru dan QR lama langsung mati (hanya superadmin).
        </Text>

        <div
          className="qr-print-area"
          style={{
            textAlign: "center",
            padding: 24,
            border: "1px dashed #d9d9d9",
            borderRadius: 8,
          }}
        >
          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
          {!qrUrl && !error && (
            <Spin tip="Memuat QR..." style={{ display: "block", padding: 40 }} />
          )}
          {qrUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="QR Absensi"
                style={{ width: 320, height: 320, maxWidth: "100%" }}
              />
              <div style={{ marginTop: 12 }}>
                <Title level={5} style={{ marginBottom: 0 }}>
                  SCAN UNTUK ABSEN
                </Title>
                <Text type="secondary">Wedi Animal Care — Klinik Hewan</Text>
              </div>
            </>
          )}
        </div>

        <Space className="no-print" wrap>
          <Button type="primary" onClick={() => window.print()}>
            Cetak QR
          </Button>
          <Button onClick={loadQr}>Muat Ulang</Button>
          <Button danger loading={regenerating} onClick={regenerate}>
            Generate Ulang QR
          </Button>
        </Space>
      </Space>

      <style>{`
        @media print {
          html, body { height: auto !important; }
          .ant-layout { min-height: 0 !important; height: auto !important; }
          .ant-layout-sider, .ant-layout-header, .no-print { display: none !important; }
          .ant-layout-content { min-height: 0 !important; }
          .ant-card { box-shadow: none !important; }
          .qr-print-area { border: none !important; padding: 0 !important; }
          * { color: #000 !important; background: #fff !important; }
        }
      `}</style>
    </Card>
  );
}
