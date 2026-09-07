'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CameraStage } from '@/components/CameraStage';
import { ExerciseDock } from '@/components/ExerciseDock';
import { RepCounterDisplay } from '@/components/RepCounterDisplay';
import { usePoseDetection } from '@/modules/cv-engine/usePoseDetection';
import { EXERCISES, type ExerciseCode } from '@/modules/rep-counter/exercises';
import { useRepCounter } from '@/modules/rep-counter/useRepCounter';
import { formatCountdown, useCountdown } from '@/lib/useCountdown';

const SESSION_SECONDS = 60;

export default function ExercisePage() {
  const [exerciseCode, setExerciseCode] = useState<ExerciseCode>('push_up');
  const [sessionKey, setSessionKey] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const { videoRef, liveLandmarksRef, status, error, start, stop } = usePoseDetection();
  const { state, reset, formOkRef } = useRepCounter(exerciseCode, liveLandmarksRef);

  const running = status === 'running';
  const definition = EXERCISES[exerciseCode];
  const detected = state.angle !== null;

  function handleExpire() {
    setTimeUp(true);
    stop();
  }

  const remaining = useCountdown(SESSION_SECONDS, running, handleExpire, sessionKey);

  function handleReset() {
    reset();
    setTimeUp(false);
    setSessionKey((n) => n + 1);
  }

  function handleStart() {
    setTimeUp(false);
    start();
  }

  function handleRestartSession() {
    reset();
    setTimeUp(false);
    setSessionKey((n) => n + 1);
    start();
  }

  return (
    <main className="flex h-dvh flex-col">
      <header className="glass-panel flex items-center justify-between border-x-0 border-t-0 px-5 py-3">
        <span className="font-display text-sm tracking-wide">
          GYMQUEST <span className="text-muted">· Exercise Tracker</span>
        </span>
        <Link href="/" className="font-body text-sm text-muted hover:text-cyan">
          ← Kembali
        </Link>
      </header>

      <CameraStage
        videoRef={videoRef}
        landmarksRef={liveLandmarksRef}
        formOkRef={formOkRef}
        scanning={running}
      >
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
          <div className="flex justify-end gap-3">
            {running && (
              <div className="glass-panel clip-corner pointer-events-auto flex items-center px-4 py-2">
                <span className="font-mono text-sm text-primary">
                  {formatCountdown(Math.max(remaining, 0))}
                </span>
              </div>
            )}
            <ExerciseDock active={exerciseCode} onSelect={setExerciseCode} />
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-3">
              <RepCounterDisplay
                reps={state.reps}
                holdSeconds={state.holdSeconds}
                isDuration={definition.countType === 'duration'}
              />
              <div className="pointer-events-auto flex flex-wrap gap-3">
                <button
                  onClick={handleReset}
                  className="clip-corner border border-muted px-4 py-2 font-body text-sm font-semibold transition-colors duration-[var(--dur-fast)] hover:border-cyan hover:text-cyan"
                >
                  Reset
                </button>
                {running ? (
                  <button
                    onClick={stop}
                    className="clip-corner border border-muted px-4 py-2 font-body text-sm font-semibold transition-colors duration-[var(--dur-fast)] hover:border-cyan hover:text-cyan"
                  >
                    Hentikan kamera
                  </button>
                ) : (
                  <button
                    onClick={handleStart}
                    disabled={status === 'loading'}
                    className="clip-corner bg-cyan px-4 py-2 font-body text-sm font-semibold text-void transition-shadow duration-[var(--dur-fast)] hover:shadow-[var(--glow-cyan)] disabled:opacity-60"
                  >
                    {status === 'loading' ? 'Memuat model…' : 'Nyalakan kamera'}
                  </button>
                )}
              </div>
            </div>

            <div className="glass-panel clip-corner min-w-0 max-w-md space-y-2.5 px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[11px] tracking-widest text-cyan uppercase">
                  {definition.label}
                </p>
                {running && detected && state.angle !== null && (
                  <span className="font-mono text-xs text-primary bg-cyan/15 px-2 py-0.5 clip-corner">
                    {Math.round(state.angle)}°
                  </span>
                )}
              </div>

              <p className="font-body text-sm text-primary">
                {error
                  ? error.message
                  : !running
                    ? definition.cameraHint
                    : !detected
                      ? 'Posisikan tubuh agar sendi kunci terlihat kamera.'
                      : state.formOk
                        ? `Fase: ${state.phase === 'up' ? 'Atas (Ekstensi)' : 'Bawah (Kontraksi)'} · Form: Bagus`
                        : (state.formMessage ?? 'Perbaiki posisi tubuh.')}
              </p>

              {running && detected && definition.countType === 'rep' && (
                <div className="border-t border-white/10 pt-2 flex items-center justify-between font-mono text-[11px] text-muted">
                  <span>Bawah: ≤{definition.downThreshold}°</span>
                  <span className={`px-1.5 py-0.5 rounded ${state.phase === 'down' ? 'text-magenta font-bold bg-magenta/20' : 'text-muted'}`}>
                    {state.phase === 'down' ? '● Siap Naik' : '○ Turunkan'}
                  </span>
                  <span>Atas: ≥{definition.upThreshold}°</span>
                </div>
              )}
            </div>
          </div>

          {timeUp && (
            <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-void/70">
              <div className="glass-panel clip-corner flex flex-col items-center gap-3 px-8 py-7 text-center">
                <p className="font-mono text-xs tracking-widest text-cyan uppercase">Waktu habis</p>
                <p className="font-display text-4xl font-bold text-primary">
                  {definition.countType === 'duration' ? Math.floor(state.holdSeconds) : state.reps}
                </p>
                <p className="font-body text-sm text-muted">
                  {definition.label} ·{' '}
                  {definition.countType === 'duration' ? 'detik tertahan' : 'repetisi'}
                </p>
                <button
                  onClick={handleRestartSession}
                  className="clip-corner mt-2 bg-cyan px-5 py-2.5 font-body text-sm font-semibold text-void transition-shadow duration-[var(--dur-fast)] hover:shadow-[var(--glow-cyan)]"
                >
                  Ulangi sesi
                </button>
              </div>
            </div>
          )}
        </div>
      </CameraStage>
    </main>
  );
}
