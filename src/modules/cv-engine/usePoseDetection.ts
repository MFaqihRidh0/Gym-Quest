'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadPoseLandmarker } from './poseLandmarker';
import { PoseSmoother } from './smoothing';
import type { CvEngineError, DetectionStatus, PoseLandmarks } from './types';

function describeCameraError(error: unknown): CvEngineError {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return {
      kind: 'insecure-context',
      message: 'Kamera hanya bisa diakses lewat HTTPS atau localhost.',
    };
  }
  if (error instanceof DOMException || (error && typeof error === 'object' && 'name' in error)) {
    const err = error as DOMException;
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return {
        kind: 'denied',
        message: 'Izin webcam belum diberikan. Klik ikon gembok di sebelah URL browser dan izinkan akses kamera, lalu coba lagi.',
      };
    }
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return {
        kind: 'not-found',
        message: 'Webcam tidak terdeteksi. Sambungkan kamera atau gunakan perangkat berkamera.',
      };
    }
    if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      return {
        kind: 'unknown',
        message: 'Kamera sedang dipakai oleh aplikasi lain (seperti Zoom, Google Meet, OBS, atau tab lain). Tutup aplikasi tersebut lalu coba lagi.',
      };
    }
    if (err.name === 'OverconstrainedError') {
      return {
        kind: 'unknown',
        message: 'Resolusi kamera yang diminta tidak didukung oleh perangkat Anda.',
      };
    }
    if (err.name === 'AbortError') {
      return {
        kind: 'unknown',
        message: 'Proses pembukaan kamera diinterupsi. Silakan klik tombol coba lagi.',
      };
    }
  }
  const detail = error instanceof Error ? error.message : String(error);
  return { kind: 'unknown', message: `Kamera gagal dinyalakan: ${detail}. Coba klik tombol sambungkan kamera lagi.` };
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
  stream: MediaStream | null;
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
  const isCancelledRef = useRef(false);

  const [landmarks, setLandmarks] = useState<PoseLandmarks | null>(null);
  const [status, setStatus] = useState<DetectionStatus>('idle');
  const [error, setError] = useState<CvEngineError | null>(null);
  const [fps, setFps] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const stop = useCallback(() => {
    isCancelledRef.current = true;
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
    setStream(null);
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    isCancelledRef.current = false;
    setError(null);
    setStatus('loading');

    let landmarker;
    try {
      landmarker = await loadPoseLandmarker();
    } catch {
      if (isCancelledRef.current) return;
      setStatus('error');
      setError({
        kind: 'model-load',
        message:
          'Model deteksi pose gagal dimuat. Jalankan "npm run setup:mediapipe" lalu muat ulang halaman.',
      });
      return;
    }

    if (isCancelledRef.current) return;

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 960 }, height: { ideal: 540 }, facingMode: 'user' },
        audio: false,
      });
    } catch (primaryError) {
      console.warn('Initial getUserMedia constraints failed, trying fallback:', primaryError);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
      } catch (secondaryError) {
        console.warn('Secondary getUserMedia constraints failed, trying simple video:', secondaryError);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (finalError) {
          if (isCancelledRef.current) return;
          setStatus('error');
          setError(describeCameraError(finalError));
          return;
        }
      }
    }

    if (isCancelledRef.current) {
      stream?.getTracks().forEach((t) => t.stop());
      return;
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.muted = true;
    video.setAttribute('playsinline', 'true');

    try {
      await video.play();
    } catch (playError) {
      console.warn('Video play was delayed or blocked, waiting for metadata:', playError);
    }

    if (isCancelledRef.current) {
      stream?.getTracks().forEach((t) => t.stop());
      return;
    }

    setStatus('running');
    setStream(stream);

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

  // Pastikan elemen video selalu tersambung dengan stream aktif (misal saat berganti stage DOM)
  useEffect(() => {
    if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  });

  useEffect(() => stop, [stop]);

  return { videoRef, liveLandmarksRef, landmarks, status, error, fps, stream, start, stop };
}
