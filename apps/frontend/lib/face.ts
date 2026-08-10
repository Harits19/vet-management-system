// Face engine — @vladmandic/face-api (TensorFlow.js, jalan di browser).
// Model weights offline di /models/face-api (public) — tanpa internet saat runtime.
export const FACE_MODELS_URI = "/models/face-api";

export const TINY_FACE_OPTIONS = { inputSize: 320, scoreThreshold: 0.5 };

// Ambang kedipan: EAR di bawah ini = mata tertutup (face-api 68 landmark)
export const EAR_CLOSED_THRESHOLD = 0.2;

let faceApiPromise: Promise<any> | null = null;

export function getFaceApi(): Promise<any> {
  if (!faceApiPromise) {
    faceApiPromise = (async () => {
      const faceapi = await import("@vladmandic/face-api");
      const tf = (faceapi as any).tf;
      try {
        await tf.setBackend("webgl");
      } catch {
        await tf.setBackend("cpu");
      }
      await tf.ready();
      await faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODELS_URI);
      await faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODELS_URI);
      await faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODELS_URI);
      return faceapi;
    })();
  }
  return faceApiPromise;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Eye Aspect Ratio — rata-rata dua mata. EAR < 0.2 = mata tertutup (kedip).
export function eyeAspectRatio(landmarks: any): number {
  const p = landmarks.positions;
  const left = (dist(p[37], p[41]) + dist(p[38], p[40])) / (2 * dist(p[36], p[39]));
  const right = (dist(p[43], p[47]) + dist(p[44], p[46])) / (2 * dist(p[42], p[45]));
  return (left + right) / 2;
}

// Deteksi wajah terbaik (terbesar) + landmark + descriptor 128-d.
export async function detectBestFace(
  faceapi: any,
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
) {
  const results = await faceapi
    .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions(TINY_FACE_OPTIONS))
    .withFaceLandmarks()
    .withFaceDescriptors();
  if (!results.length) return null;
  results.sort((a: any, b: any) => b.detection.box.area - a.detection.box.area);
  return results[0];
}

// Ambil stream kamera. facingMode: user = depan (wajah), environment = belakang (scan QR fisik).
export async function startCamera(facingMode: "user" | "environment" = "user"): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480, facingMode },
    audio: false,
  });
}

// Retry getUserMedia beberapa kali — error sementara (kamera baru dilepas tab lain / masih
// tersangkut setelah reset izin) biasanya sembuh dengan retry. NotAllowedError TIDAK di-retry
// (user harus allow manual di address bar).
export async function startCameraWithRetry(
  facingMode: "user" | "environment" = "user",
  attempts = 3,
  delayMs = 500
): Promise<MediaStream> {
  let lastError: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await startCamera(facingMode);
    } catch (e) {
      lastError = e;
      const name = (e as DOMException)?.name;
      if (name === "NotAllowedError" || name === "PermissionDeniedError") break;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

export function stopCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}
