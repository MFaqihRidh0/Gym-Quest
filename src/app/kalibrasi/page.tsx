'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CameraStage } from '@/components/CameraStage';
import { ConfidenceBar } from '@/components/ConfidenceBar';
import { StatusDot } from '@/components/StatusDot';
import { evaluateCalibration } from '@/modules/cv-engine/calibration';
import { usePoseDetection } from '@/modules/cv-engine/usePoseDetection';

export default function KalibrasiPage() {
  const { videoRef, liveLandmarksRef, landmarks, status, error, fps, start, stop } =
    usePoseDetection();
  const calibration = useMemo(() => evaluateCalibration(landmarks), [landmarks]);
  const running = status === 'running';

  return (
    <main className="flex h-dvh flex-col">
      <header className="glass-panel flex items-center justify-between border-x-0 border-t-0 px-5 py-3">
        <span className="font-display text-sm tracking-wide">
          GYMQUEST <span className="text-muted">· Kalibrasi</span>
        </span>
        <Link href="/" className="font-body text-sm text-muted hover:text-cyan">
          ← Kembali
        </Link>
      </header>

      <CameraStage videoRef={videoRef} landmarksRef={liveLandmarksRef} scanning={running}>
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
          <div className="flex justify-end">
            <section className="glass-panel clip-corner pointer-events-auto w-full max-w-[15rem] space-y-3 p-5">
              <h2 className="font-mono text-[11px] tracking-widest text-cyan uppercase">
                Status scan
              </h2>
              <div className="divide-y divide-white/5">
                {calibration.regions.map((region) => (
                  <StatusDot
                    key={region.id}
                    label={region.label}
                    state={!running ? 'neutral' : region.detected ? 'active' : 'pending'}
                  />
                ))}
              </div>
              <ConfidenceBar value={running ? calibration.confidence : 0} />
              <p className="font-mono text-[11px] text-muted">FPS {running ? fps : '—'}</p>
            </section>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <p
              role="status"
              className="glass-panel clip-corner min-w-0 flex-1 px-4 py-3 font-body text-sm text-primary sm:max-w-lg sm:flex-none"
            >
              {error
                ? error.message
                : running
                  ? calibration.guidance
                  : 'Nyalakan kamera untuk memulai kalibrasi. Video diproses sepenuhnya di perangkatmu dan tidak pernah dikirim ke server.'}
            </p>

            <div className="pointer-events-auto flex flex-wrap gap-3">
              {running ? (
                <button
                  onClick={stop}
                  className="clip-corner border border-muted px-5 py-2.5 font-body text-sm font-semibold transition-colors duration-[var(--dur-fast)] hover:border-cyan hover:text-cyan"
                >
                  Hentikan kamera
                </button>
              ) : (
                <button
                  onClick={start}
                  disabled={status === 'loading'}
                  className="clip-corner bg-cyan px-5 py-2.5 font-body text-sm font-semibold text-void transition-shadow duration-[var(--dur-fast)] hover:shadow-[var(--glow-cyan)] disabled:opacity-60"
                >
                  {status === 'loading' ? 'Memuat model…' : 'Mulai kalibrasi'}
                </button>
              )}
            </div>
          </div>
        </div>
      </CameraStage>
    </main>
  );
}
