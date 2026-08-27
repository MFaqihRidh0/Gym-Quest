'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadPoseLandmarker } from './poseLandmarker';
import { PoseSmoother } from './smoothing';
import type { CvEngineError, DetectionStatus, PoseLandmarks } from './types';

function describeCameraError(error: unknown): CvEngineError {
  if (!window.isSecureContext) {
    return {
      kind: 'insecure-context',
      message: 'Kamera hanya bisa diakses lewat HTTPS atau localhost.',
    };
  }
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return {
        kind: 'denied',
        message: 'Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser, lalu coba lagi.',
      };
    }
    if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
      return {
        kind: 'not-found',
        message: 'Kamera tidak terdeteksi. Sambungkan webcam atau gunakan perangkat berkamera.',
      };
    }
  }
  return { kind: 'unknown', message: 'Kamera gagal dinyalakan. Coba muat ulang halaman.' };
}

/** ~12 Hz: cukup responsif untuk panel status, jauh lebih murah dari 30 Hz. */
const UI_SYNC_INTERVAL_MS = 80;

export interface PoseDetectionResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Hasil terbaru setiap frame — dipakai kanvas overlay agar tetap mulus. */
  liveLandmarksRef: React.RefObject<PoseLandmarks | null>;
  /** Versi ter-throttle untuk komponen React (panel status, dsb). */
  landmarks: PoseLandmarks | null;
  status: DetectionStatus;
  error: CvEngineError | null;
  fps: number;
  start: () => void;
  stop: () => void;
}

export function usePoseDetection(): PoseDetectionResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const smootherRef = useRef(new PoseSmoother());
  const lastVideoTimeRef = useRef(-1);
  const fpsWindowRef = useRef<number[]>([]);
  const liveLandmarksRef = useRef<PoseLandmarks | null>(null);
  const lastUiSyncRef = useRef(0);

  const [landmarks, setLandmarks] = useState<PoseLandmarks | null>(null);
  const [status, setStatus] = useState<DetectionStatus>('idle');
  const [error, setError] = useState<CvEngineError | null>(null);
  const [fps, setFps] = useState(0);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    smootherRef.current.reset();
    lastVideoTimeRef.current = -1;
    fpsWindowRef.current = [];
    liveLandmarksRef.current = null;
    lastUiSyncRef.current = 0;
    setLandmarks(null);
    setFps(0);
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setStatus('loading');

    let landmarker;
    try {
      landmarker = await loadPoseLandmarker();
    } catch {
      setStatus('error');
      setError({
        kind: 'model-load',
        message:
          'Model deteksi pose gagal dimuat. Jalankan "npm run setup:mediapipe" lalu muat ulang halaman.',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // 960x540 sudah cukup: model lite menskalakan ulang input secara
        // internal, jadi resolusi lebih tinggi hanya menambah biaya upload.
        video: { width: { ideal: 960 }, height: { ideal: 540 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
    } catch (cameraError) {
      setStatus('error');
      setError(describeCameraError(cameraError));
      return;
    }

    setStatus('running');

    const detect = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        const now = performance.now();
        const result = landmarker.detectForVideo(video, now);
        const pose = result.landmarks?.[0];
        const smoothed = pose ? smootherRef.current.smooth(pose, now) : null;

        // Kanvas menggambar dari ref ini setiap frame — tidak lewat React.
        liveLandmarksRef.current = smoothed;

        const window = fpsWindowRef.current;
        window.push(now);
        while (window.length > 0 && now - window[0] > 1000) window.shift();

        /**
         * Panel status hanya butuh update secukupnya untuk dibaca mata. Tanpa
         * throttle ini seluruh halaman re-render tiap frame dan menyita
         * main-thread dari inference MediaPipe.
         */
        if (now - lastUiSyncRef.current >= UI_SYNC_INTERVAL_MS) {
          lastUiSyncRef.current = now;
          setLandmarks(smoothed);
          setFps(window.length);
        }
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);
  }, []);

  useEffect(() => stop, [stop]);

  return { videoRef, liveLandmarksRef, landmarks, status, error, fps, start, stop };
}
