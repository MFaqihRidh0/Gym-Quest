'use client';

import { useEffect, useRef } from 'react';
import { drawBioScan } from '@/modules/cv-engine/drawBioScan';
import type { PoseLandmarks } from '@/modules/cv-engine/types';

interface CameraStageProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Ref agar overlay ikut frame kamera tanpa memicu re-render React. */
  landmarksRef: React.RefObject<PoseLandmarks | null>;
  /** Ref status form exercise — `false` mewarnai skeleton merah. Opsional (kalibrasi tidak pakai ini). */
  formOkRef?: React.RefObject<boolean | null>;
  scanning?: boolean;
  children?: React.ReactNode;
}

function CornerBrackets() {
  const base = 'pointer-events-none absolute h-10 w-10 border-cyan/70';
  return (
    <>
      <span className={`${base} top-5 left-5 border-t-2 border-l-2`} />
      <span className={`${base} top-5 right-5 border-t-2 border-r-2`} />
      <span className={`${base} bottom-5 left-5 border-b-2 border-l-2`} />
      <span className={`${base} right-5 bottom-5 border-r-2 border-b-2`} />
    </>
  );
}

export function CameraStage({
  videoRef,
  landmarksRef,
  formOkRef,
  scanning,
  children,
}: CameraStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    const render = () => {
      const cssWidth = video.clientWidth;
      const cssHeight = video.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;
      }
      // Gambar dalam satuan CSS pixel agar tetap tajam di layar HiDPI.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      drawBioScan(ctx, landmarksRef.current, {
        width: cssWidth,
        height: cssHeight,
        sourceWidth: video.videoWidth,
        sourceHeight: video.videoHeight,
        pulsePhase: reduceMotion ? 0 : (performance.now() / 1000) * Math.PI,
        formOk: formOkRef?.current ?? undefined,
      });
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [videoRef, landmarksRef, formOkRef]);

  return (
    <div className="relative flex-1 overflow-hidden bg-void">
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
      <CornerBrackets />
      {scanning && (
        <div
          aria-hidden
          className="animate-scan-sweep pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-cyan/70 shadow-[var(--glow-cyan)]"
        />
      )}
      {children}
    </div>
  );
}
