"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card, Button, Space, Typography, Alert, Table, Tag, Spin, Row, Col, Statistic, Tabs,
} from "antd";
import { useAuth, apiFetch } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";
import FaceCamera, { type FaceInfo } from "../../../components/FaceCamera";
import QRScanner from "../../../components/QRScanner";

const { Title, Text } = Typography;

interface StatusData {
  hasFace: boolean;
  faceRegisteredAt: string | null;
  today: string;
  todayIn: { type: "in"; method: "face" | "qr"; timestamp: string } | null;
  todayOut: { type: "out"; method: "face" | "qr"; timestamp: string } | null;
}

interface ConfigData {
  mode: "face" | "qr" | "both";
  faceEnabled: boolean;
  qrEnabled: boolean;
  locationEnabled: boolean;
  officeLat: number | null;
  officeLng: number | null;
  radiusMeters: number;
  faceThreshold: number;
}

interface AttendanceRow {
  _id: string;
  method: "face" | "qr";
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

const METHOD_LABEL: Record<string, string> = { face: "Wajah", qr: "QR" };

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
  const [locErrorMsg, setLocErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // QR: qrPending = tombol scan ditekan, menunggu decode kamera
  const [qrPending, setQrPending] = useState<"in" | "out" | null>(null);

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

  // User tanpa wajah terdaftar (dan mode wajah aktif) → arahkan daftar wajah dulu
  useEffect(() => {
    if (!loadingData && status && config && config.faceEnabled && !status.hasFace) {
      router.replace("/dashboard/attendance/register");
    }
  }, [loadingData, status, config, router]);

  // Minta lokasi GPS — DIPANGGIL DARI TOMBOL (user gesture), supaya prompt izin lokasi
  // muncul andal di semua browser (termasuk iOS Safari yang mengabaikan request tanpa gesture).
  const requestLocation = useCallback(() => {
    if (!config?.locationEnabled) return;
    if (!navigator.geolocation) {
      // http://IP (bukan localhost) = non-secure context → geolocation TIDAK tersedia
      setLoc(null);
      setLocState("error");
      setLocErrorMsg(
        "Geolocation tidak tersedia di browser ini. Lokasi hanya jalan lewat HTTPS atau localhost — akses via IP http tidak didukung browser. Gunakan https://wedi-animal-care.ahlabs.my.id (atau localhost) untuk absen."
      );
      return;
    }
    setLocErrorMsg(null);
    setLoc(null); // reset lokasi lama — request fresh
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
      () => {
        setLoc(null); // GPS gagal (deny/timeout) — tidak ada lokasi valid
        setLocState("error");
        setLocErrorMsg(
          "Lokasi tidak terdeteksi — periksa GPS aktif & izin lokasi browser diizinkan, lalu coba lagi."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [config]);

  const locationOk = !config?.locationEnabled || locState === "ok";

  const postCheckIn = async (body: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      await apiFetch("/api/attendance/check-in", { method: "POST", body: JSON.stringify(body) });
      msg.success("Absen berhasil ✓");
      setLoadingData(true);
      await fetchAll();
      setLoadingData(false);
    } catch (e: any) {
      msg.error(e.message || "Absen gagal");
    } finally {
      setSubmitting(false);
    }
  };

  const doAbsenFace = async (type: "in" | "out") => {
    if (!face.descriptor) return;
    if (!locationOk) {
      msg.error("Lokasi di luar area kantor atau belum terdeteksi");
      return;
    }
    if (!face.livenessPassed) {
      msg.error("Verifikasi liveness belum lolos — kedipkan mata dulu");
      return;
    }
    await postCheckIn({
      method: "face",
      type,
      descriptor: face.descriptor,
      livenessPassed: face.livenessPassed,
      lat: loc?.lat,
      lng: loc?.lng,
      accuracy: loc?.accuracy,
    });
  };

  const doAbsenQr = async (type: "in" | "out", qrSecret: string) => {
    if (!locationOk) {
      setQrPending(null);
      msg.error("Lokasi di luar area kantor atau belum terdeteksi — scan diblokir");
      return;
    }
    setQrPending(null);
    await postCheckIn({
      method: "qr",
      type,
      qrSecret,
      lat: loc?.lat,
      lng: loc?.lng,
      accuracy: loc?.accuracy,
    });
  };

  if (loading) return null;
  if (!user) return null;

  if (user.role === "superadmin") {
    return (
      <Card>
        <Space direction="vertical" size="middle">
          <Alert type="info" showIcon message="Superadmin dikecualikan dari absensi." />
          <Button type="primary" onClick={() => router.push("/dashboard/attendance/qr")}>
            Cetak QR Absensi
          </Button>
        </Space>
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

  const canAbsenIn = !status.todayIn;
  const canAbsenOut = !!status.todayIn && !status.todayOut;

  const facePanel = (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Text type="secondary">
        Arahkan wajah ke kamera lalu kedipkan mata. Absen hanya diproses jika wajah cocok dengan wajah terdaftar.
      </Text>
      <FaceCamera requireBlink onFaceChange={setFace} />
      <Space wrap>
        <Button
          type="primary"
          size="large"
          disabled={!canAbsenIn || !face.hasFace || !face.livenessPassed || !locationOk}
          loading={submitting}
          onClick={() => doAbsenFace("in")}
        >
          Absen Masuk (Wajah)
        </Button>
        <Button
          size="large"
          disabled={!canAbsenOut || !face.hasFace || !face.livenessPassed || !locationOk}
          loading={submitting}
          onClick={() => doAbsenFace("out")}
        >
          Absen Pulang (Wajah)
        </Button>
        <Button size="large" onClick={() => router.push("/dashboard/attendance/register")}>
          Daftar Ulang Wajah
        </Button>
      </Space>
    </Space>
  );

  const qrPanel = (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Text type="secondary">
        Scan QR statis yang ditempel di tempat absen. Lokasi device dicek terhadap titik kantor — absen hanya
        diproses jika kamu berada di tempat.
      </Text>
      {!qrPending && (
        <Space wrap>
          <Button
            type="primary"
            size="large"
            disabled={!canAbsenIn || !locationOk}
            loading={submitting}
            onClick={() => setQrPending("in")}
          >
            Scan QR — Absen Masuk
          </Button>
          <Button
            size="large"
            disabled={!canAbsenOut || !locationOk}
            loading={submitting}
            onClick={() => setQrPending("out")}
          >
            Scan QR — Absen Pulang
          </Button>
        </Space>
      )}
      {qrPending && (
        <QRScanner
          onDecode={(text) => doAbsenQr(qrPending, text)}
          onError={() => setQrPending(null)}
        />
      )}
    </Space>
  );

  const columns = [
    { title: "Waktu", dataIndex: "timestamp", render: (v: string) => fmtTime(v) },
    {
      title: "Tipe",
      dataIndex: "type",
      render: (v: string) => (v === "in" ? <Tag color="green">Masuk</Tag> : <Tag color="orange">Pulang</Tag>),
    },
    { title: "Metode", dataIndex: "method", render: (v: string) => METHOD_LABEL[v] || v },
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
              title="Metode Terakhir"
              value={
                status.todayOut ? METHOD_LABEL[status.todayOut.method] :
                status.todayIn ? METHOD_LABEL[status.todayIn.method] : "-"
              }
            />
          </Col>
        </Row>
      </Card>

      {config.locationEnabled && (
        <Card size="small">
          <Space direction="vertical" size={8}>
            {locState === "idle" && (
              <Space direction="vertical" size={8}>
                <Alert
                  type="warning"
                  showIcon
                  message="Lokasi dibutuhkan untuk absen. Klik tombol untuk mengaktifkan izin lokasi browser."
                />
                <Button type="primary" onClick={requestLocation}>
                  Aktifkan Lokasi
                </Button>
              </Space>
            )}
            {locState === "getting" && <Text type="secondary">Mendeteksi lokasi GPS...</Text>}
            {locState === "ok" && loc && (
              <Text type="success">
                ✓ Di dalam area kantor (jarak {Math.round(loc.distance)} m dari titik kantor, akurasi ±
                {Math.round(loc.accuracy)} m)
              </Text>
            )}
            {locState === "error" && (
              <Space direction="vertical" size={8}>
                <Alert
                  type="error"
                  showIcon
                  message={
                    locErrorMsg ||
                    (loc
                      ? `Di luar area kantor (jarak ${Math.round(loc.distance)} m dari titik kantor, maks ${config.radiusMeters} m)`
                      : "Lokasi tidak terdeteksi — aktifkan GPS & izin lokasi browser, lalu coba lagi.")
                  }
                />
                <Button size="small" onClick={requestLocation}>
                  Deteksi Ulang Lokasi
                </Button>
              </Space>
            )}
          </Space>
        </Card>
      )}

      <Card title="Verifikasi Absen" size="small">
        {config.mode === "both" ? (
          <Tabs
            destroyInactiveTabPane
            defaultActiveKey="qr"
            items={[
              { key: "face", label: "Absen Wajah", children: facePanel },
              { key: "qr", label: "Absen QR", children: qrPanel },
            ]}
          />
        ) : config.mode === "qr" ? (
          qrPanel
        ) : (
          facePanel
        )}
      </Card>

      {["superadmin"].includes(user.role) && config.qrEnabled && (
        <Card size="small">
          <Space>
            <Text type="secondary">QR statis untuk dipajang di tempat absen:</Text>
            <Button onClick={() => router.push("/dashboard/attendance/qr")}>Lihat / Cetak QR</Button>
          </Space>
        </Card>
      )}

      <Card title="Riwayat Hari Ini" size="small">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={history}
          pagination={false}
          scroll={{ x: 600 }}
          locale={{ emptyText: "Belum ada catatan absensi hari ini" }}
        />
      </Card>
    </Space>
  );
}
