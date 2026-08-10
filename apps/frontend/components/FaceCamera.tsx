"use client";

import { useEffect, useRef, useState } from "react";
import { Alert } from "antd";
import {
  getFaceApi,
  startCamera,
  stopCamera,
  detectBestFace,
  eyeAspectRatio,
  EAR_CLOSED_THRESHOLD,
} from "../lib/face";

export interface FaceInfo {
  hasFace: boolean;
  descriptor: number[] | null;
  blinks: number;
  livenessPassed: boolean;
}

interface FaceCameraProps {
  /** true = wajib liveness (kedip ≥1x) — dipakai saat absen; false = cukup wajah terdeteksi (daftar wajah) */
  requireBlink?: boolean;
  onFaceChange?: (info: FaceInfo) => void;
}

export default function FaceCamera({ requireBlink = false, onFaceChange }: FaceCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Memuat model wajah...");

  // onFaceChange lewat ref supaya effect kamera tidak restart saat parent re-render
  const onFaceChangeRef = useRef(onFaceChange);
  useEffect(() => {
    onFaceChangeRef.current = onFaceChange;
  });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let faceapi: any = null;
    let busy = false;
    let wasClosed = false;
    let blinks = 0;
    let noFaceFrames = 0;
    let lastInfo: FaceInfo = { hasFace: false, descriptor: null, blinks: 0, livenessPassed: false };

    const emit = () => onFaceChangeRef.current?.({ ...lastInfo });

    const tick = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (busy || !faceapi || !video || video.readyState < 2) return;
      busy = true;
      try {
        const result = await detectBestFace(faceapi, video);
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (result && faceapi.draw) {
            faceapi.draw.drawDetections(canvas, [result.detection]);
            faceapi.draw.drawFaceLandmarks(canvas, [result.landmarks]);
          }
        }
        if (!result) {
          noFaceFrames++;
          if (noFaceFrames > 2) wasClosed = false;
          lastInfo = { hasFace: false, descriptor: null, blinks, livenessPassed: false };
          setStatus("Tidak ada wajah terdeteksi. Arahkan wajah ke kamera.");
          emit();
          return;
        }
        noFaceFrames = 0;
        const descriptor = Array.from(result.descriptor as number[]);
        let livenessPassed = false;
        if (requireBlink) {
          const ear = eyeAspectRatio(result.landmarks);
          if (ear < EAR_CLOSED_THRESHOLD) {
            wasClosed = true;
            setStatus("Mata tertutup — kedipkan mata...");
          } else if (wasClosed) {
            blinks += 1;
            wasClosed = false;
            setStatus(`Kedipan terdeteksi: ${blinks}`);
          } else {
            setStatus("Kedipkan mata untuk verifikasi liveness");
          }
          livenessPassed = blinks >= 1;
          if (livenessPassed) setStatus("Liveness terverifikasi ✓");
        } else {
          setStatus("Wajah terdeteksi");
        }
        lastInfo = { hasFace: true, descriptor, blinks, livenessPassed };
        emit();
      } catch {
        // frame gagal — coba lagi tick berikutnya
      } finally {
        busy = false;
      }
    };

    (async () => {
      try {
        const [fa, s] = await Promise.all([getFaceApi(), startCamera()]);
        faceapi = fa;
        stream = s;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = s;
        await video.play();
        if (canvasRef.current) {
          canvasRef.current.width = video.videoWidth || 640;
          canvasRef.current.height = video.videoHeight || 480;
        }
        setReady(true);
        setStatus(requireBlink ? "Kedipkan mata untuk verifikasi liveness" : "Cari wajah di depan kamera...");
        timer = setInterval(tick, 180);
      } catch (e: any) {
        setError(e?.message || "Kamera tidak bisa diakses — izinkan akses kamera lalu coba lagi.");
      }
    })();

    return () => {
      if (timer) clearInterval(timer);
      stopCamera(stream);
    };
  }, [requireBlink]);

  return (
    <div>
      <div style={{ position: "relative", width: "100%", maxWidth: 480 }}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: "100%", borderRadius: 8, display: "block", background: "#000" }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: 8 }}
        />
      </div>
      {error ? (
        <Alert type="error" showIcon message={error} style={{ marginTop: 8 }} />
      ) : (
        <Alert
          type={requireBlink ? "info" : "success"}
          showIcon
          message={ready ? status : "Memuat model wajah (sekali, ±2 MB)... "}
          style={{ marginTop: 8 }}
        />
      )}
    </div>
  );
}
