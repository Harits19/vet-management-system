"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Space } from "antd";
import jsQR from "jsqr";
import { startCameraWithRetry, stopCamera } from "../lib/face";

interface QRScannerProps {
  onDecode: (text: string) => void;
  onError?: (msg: string) => void;
}

export default function QRScanner({ onDecode, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Memulai kamera...");
  const [attempt, setAttempt] = useState(0);

  const onDecodeRef = useRef(onDecode);
  useEffect(() => {
    onDecodeRef.current = onDecode;
  });
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let done = false;
    // cancelled = komponen unmount → stream yang resolve belakangan langsung di-stop
    // (mencegah kamera terkunci / NotReadableError pada scan berikutnya).
    let cancelled = false;

    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const tick = () => {
      const video = videoRef.current;
      if (done || !video || video.readyState < 2 || !ctx) return;
      ctx.drawImage(video, 0, 0, 320, 240);
      const img = ctx.getImageData(0, 0, 320, 240);
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
      if (code?.data) {
        done = true;
        setStatus("QR terdeteksi — memproses absen...");
        if (timer) clearInterval(timer);
        stopCamera(stream);
        onDecodeRef.current(code.data);
      } else {
        setStatus("Arahkan kamera ke QR yang ditempel di tempat absen");
      }
    };

    setError(null);
    setStatus("Memulai kamera...");

    (async () => {
      try {
        stream = await startCameraWithRetry("environment");
        if (cancelled) {
          stopCamera(stream);
          return;
        }
        const video = videoRef.current;
        if (!video) {
          stopCamera(stream);
          return;
        }
        video.srcObject = stream;
        await video.play();
        if (cancelled) {
          stopCamera(stream);
          return;
        }
        timer = setInterval(tick, 200);
      } catch (e: any) {
        if (cancelled) return;
        const name = e?.name;
        const msg =
          name === "NotAllowedError" || name === "PermissionDeniedError"
            ? "Izin kamera ditolak. Klik ikon kamera/lock di address bar browser → pilih Izinkan, lalu klik Coba Lagi."
            : name === "NotReadableError"
              ? "Kamera sedang dipakai aplikasi lain atau masih tersangkut dari izin sebelumnya. Tutup aplikasi lain / reload halaman, lalu klik Coba Lagi."
              : `Kamera tidak bisa diakses: ${e?.message || "unknown error"}. Klik Coba Lagi.`;
        setError(msg);
        onErrorRef.current?.(msg);
      }
    })();

    return () => {
      done = true;
      cancelled = true;
      if (timer) clearInterval(timer);
      const video = videoRef.current;
      if (video) video.srcObject = null;
      stopCamera(stream);
    };
  }, [attempt]);

  return (
    <div>
      <div style={{ position: "relative", width: "100%", maxWidth: 480 }}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: "100%", borderRadius: 8, display: "block", background: "#000" }}
        />
      </div>
      {error ? (
        <Space direction="vertical" size={8} style={{ width: "100%", marginTop: 8 }}>
          <Alert type="error" showIcon message={error} />
          <Button onClick={() => setAttempt((a) => a + 1)}>Coba Lagi</Button>
        </Space>
      ) : (
        <Alert type="info" showIcon message={status} style={{ marginTop: 8 }} />
      )}
    </div>
  );
}
