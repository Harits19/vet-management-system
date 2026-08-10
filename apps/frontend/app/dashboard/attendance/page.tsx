"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Space, Typography, Alert, Table, Tag, Spin, Row, Col, Statistic } from "antd";
import { useAuth, apiFetch } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";
import FaceCamera, { type FaceInfo } from "../../../components/FaceCamera";

const { Title, Text } = Typography;

interface StatusData {
  hasFace: boolean;
  faceRegisteredAt: string | null;
  today: string;
  todayIn: { type: "in"; timestamp: string } | null;
  todayOut: { type: "out"; timestamp: string } | null;
}

interface ConfigData {
  locationEnabled: boolean;
  officeLat: number | null;
  officeLng: number | null;
  radiusMeters: number;
  faceThreshold: number;
}

interface AttendanceRow {
  _id: string;
  type: "in" | "out";
  timestamp: string;
  date: string;
  faceDistance?: number;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const fmtTime = (ts: string) =>
  new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export default function AttendancePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const msg = useAntdMessage();

  const [status, setStatus] = useState<StatusData | null>(null);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [history, setHistory] = useState<AttendanceRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [face, setFace] = useState<FaceInfo>({ hasFace: false, descriptor: null, blinks: 0, livenessPassed: false });
  const [locState, setLocState] = useState<"idle" | "getting" | "ok" | "error">("idle");
  const [loc, setLoc] = useState<{ lat: number; lng: number; accuracy: number; distance: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    const [s, c] = await Promise.all([
      apiFetch<{ data: StatusData }>("/api/attendance/status"),
      apiFetch<{ data: ConfigData }>("/api/attendance/config"),
    ]);
    setStatus(s.data);
    setConfig(c.data);
    const today = s.data.today;
    const h = await apiFetch<{ data: AttendanceRow[] }>(`/api/attendance/me?date=${today}`);
    setHistory(h.data);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    fetchAll().catch((e: any) => msg.error(e.message || "Gagal memuat data absensi"));
  }, [loading, user, fetchAll, msg]);

  // User tanpa wajah terdaftar → arahkan daftar wajah dulu
  useEffect(() => {
    if (!loadingData && status && !status.hasFace) {
      router.replace("/dashboard/attendance/register");
    }
  }, [loadingData, status, router]);

  // Minta lokasi GPS begitu config siap
  useEffect(() => {
    if (!config?.locationEnabled || locState !== "idle") return;
    setLocState("getting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const distance = haversineMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          config.officeLat as number,
          config.officeLng as number
        );
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, distance });
        setLocState(distance <= config.radiusMeters ? "ok" : "error");
      },
      () => setLocState("error"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [config, locState]);

  const doAbsen = async (type: "in" | "out") => {
    if (!face.descriptor) return;
    if (config?.locationEnabled && (!loc || loc.distance > config.radiusMeters)) {
      msg.error("Lokasi di luar area kantor atau belum terdeteksi");
      return;
    }
    if (!face.livenessPassed) {
      msg.error("Verifikasi liveness belum lolos — kedipkan mata dulu");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/attendance/check-in", {
        method: "POST",
        body: JSON.stringify({
          type,
          descriptor: face.descriptor,
          livenessPassed: face.livenessPassed,
          lat: loc?.lat,
          lng: loc?.lng,
          accuracy: loc?.accuracy,
        }),
      });
      msg.success(type === "in" ? "Absen masuk berhasil ✓" : "Absen pulang berhasil ✓");
      setLoadingData(true);
      await fetchAll();
      setLoadingData(false);
    } catch (e: any) {
      msg.error(e.message || "Absen gagal");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;
  if (!user) return null;

  if (user.role === "superadmin") {
    return (
      <Card>
        <Alert type="info" showIcon message="Superadmin dikecualikan dari absensi." />
      </Card>
    );
  }

  if (loadingData || !status || !config) {
    return (
      <Card>
        <Spin tip="Memuat..." style={{ display: "block", textAlign: "center", padding: 40 }} />
      </Card>
    );
  }

  const locationOk = !config.locationEnabled || locState === "ok";
  const canAbsenIn = !status.todayIn && face.livenessPassed && locationOk && face.hasFace;
  const canAbsenOut = !!status.todayIn && !status.todayOut && face.livenessPassed && locationOk && face.hasFace;

  const columns = [
    { title: "Waktu", dataIndex: "timestamp", render: (v: string) => fmtTime(v) },
    {
      title: "Tipe",
      dataIndex: "type",
      render: (v: string) => (v === "in" ? <Tag color="green">Masuk</Tag> : <Tag color="orange">Pulang</Tag>),
    },
    {
      title: "Kecocokan Wajah",
      dataIndex: "faceDistance",
      render: (v?: number) => (typeof v === "number" ? v.toFixed(2) : "-"),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Card>
        <Title level={4}>Absensi — {status.today}</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Statistic
              title="Absen Masuk"
              value={status.todayIn ? fmtTime(status.todayIn.timestamp) : "Belum"}
              valueStyle={status.todayIn ? { color: "#3f8600" } : undefined}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="Absen Pulang"
              value={status.todayOut ? fmtTime(status.todayOut.timestamp) : "Belum"}
              valueStyle={status.todayOut ? { color: "#cf1322" } : undefined}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="Verifikasi"
              value={face.livenessPassed ? "Wajah Cocok ✓" : "Menunggu"}
              valueStyle={face.livenessPassed ? { color: "#3f8600" } : undefined}
            />
          </Col>
        </Row>
      </Card>

      {config.locationEnabled && (
        <Card size="small">
          <Space direction="vertical" size={4}>
            {locState === "getting" && <Text type="secondary">Mendeteksi lokasi GPS...</Text>}
            {locState === "ok" && loc && (
              <Text type="success">
                ✓ Di dalam area kantor (jarak {Math.round(loc.distance)} m dari titik kantor, akurasi ±
                {Math.round(loc.accuracy)} m)
              </Text>
            )}
            {locState === "error" && (
              <Alert
                type="error"
                showIcon
                message="Lokasi di luar area kantor atau tidak terdeteksi — absen diblokir."
              />
            )}
          </Space>
        </Card>
      )}

      <Card title="Verifikasi Wajah" size="small">
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Text type="secondary">
            Arahkan wajah ke kamera lalu kedipkan mata. Absen hanya diproses jika wajah cocok dengan wajah terdaftar.
          </Text>
          <FaceCamera requireBlink onFaceChange={setFace} />
          <Space wrap>
            <Button
              type="primary"
              size="large"
              disabled={!canAbsenIn}
              loading={submitting}
              onClick={() => doAbsen("in")}
            >
              Absen Masuk
            </Button>
            <Button
              size="large"
              disabled={!canAbsenOut}
              loading={submitting}
              onClick={() => doAbsen("out")}
            >
              Absen Pulang
            </Button>
            <Button size="large" onClick={() => router.push("/dashboard/attendance/register")}>
              Daftar Ulang Wajah
            </Button>
          </Space>
          {status.todayIn && !status.todayOut && (
            <Text type="secondary">Kamu sudah absen masuk. Absen pulang untuk menyelesaikan hari ini.</Text>
          )}
        </Space>
      </Card>

      <Card title="Riwayat Hari Ini" size="small">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={history}
          pagination={false}
          scroll={{ x: 500 }}
          locale={{ emptyText: "Belum ada catatan absensi hari ini" }}
        />
      </Card>
    </Space>
  );
}
