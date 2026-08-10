"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Space, Typography, Alert } from "antd";
import { useAuth, apiFetch } from "../../../context/auth";
import { useAntdMessage } from "../../../hooks/useAntdMessage";
import FaceCamera, { type FaceInfo } from "../../../../components/FaceCamera";

const { Title, Text } = Typography;

interface StatusData {
  hasFace: boolean;
  faceRegisteredAt: string | null;
}

export default function RegisterFacePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const msg = useAntdMessage();
  const [face, setFace] = useState<FaceInfo>({ hasFace: false, descriptor: null, blinks: 0, livenessPassed: false });
  const [hasFace, setHasFace] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    apiFetch<{ data: StatusData }>("/api/attendance/status")
      .then((r) => setHasFace(r.data.hasFace))
      .catch(() => setHasFace(false));
  }, [loading, user]);

  const submit = async () => {
    if (!face.descriptor) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/attendance/register-face", {
        method: "POST",
        body: JSON.stringify({ descriptor: face.descriptor }),
      });
      msg.success("Wajah berhasil didaftarkan");
      router.push("/dashboard/attendance");
    } catch (e: any) {
      msg.error(e.message || "Gagal mendaftarkan wajah");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;
  if (!user) return null;

  if (user.role === "superadmin") {
    return (
      <Card>
        <Alert type="info" showIcon message="Superadmin tidak perlu absensi wajah." />
      </Card>
    );
  }

  return (
    <Card>
      <Title level={4}>Daftarkan Wajah</Title>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {hasFace && (
          <Alert
            type="warning"
            showIcon
            message="Kamu sudah punya wajah terdaftar. Mendaftarkan ulang akan menggantikan wajah lama."
          />
        )}
        <Text type="secondary">
          Arahkan wajah ke kamera, pastikan pencahayaan cukup dan wajah terlihat jelas. Wajah ini dipakai untuk
          verifikasi saat absen masuk/pulang.
        </Text>
        <FaceCamera requireBlink={false} onFaceChange={setFace} />
        <Button type="primary" size="large" disabled={!face.hasFace} loading={submitting} onClick={submit}>
          {face.hasFace ? "Daftarkan Wajah Ini" : "Tunggu wajah terdeteksi..."}
        </Button>
      </Space>
    </Card>
  );
}
