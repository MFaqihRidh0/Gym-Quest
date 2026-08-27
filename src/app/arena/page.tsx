'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePoseDetection } from '@/modules/cv-engine/usePoseDetection';
import { useArenaGame } from '@/modules/game-engine/useArenaGame';
import type { ArenaControlMode } from '@/modules/game-engine/verticalControl';
import { formatCountdown, useCountdown } from '@/lib/useCountdown';

const SESSION_SECONDS = 60;

const MODES: { code: ArenaControlMode; label: string; description: string }[] = [
  {
    code: 'push_up',
    label: 'Push-up',
    description: 'Kuda poni naik-turun mengikuti gerakan wajahmu saat push-up.',
  },
  {
    code: 'arm_raise',
    label: 'Angkat Barbel',
    description: 'Kuda poni naik-turun mengikuti gerakan lenganmu saat mengangkat barbel.',
  },
];

function ModeSelectScreen({
  mode,
  onSelect,
  onStart,
  loading,
}: {
  mode: ArenaControlMode;
  onSelect: (mode: ArenaControlMode) => void;
  onStart: () => void;
  loading: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-16">
      <div>
        <p className="font-mono text-xs tracking-widest text-magenta uppercase">Arena mode</p>
        <h1 className="mt-2 font-display text-2xl font-bold">Pilih cara main</h1>
      </div>

      <div className="flex flex-col gap-3">
        {MODES.map((item) => {
          const active = item.code === mode;
          return (
            <button
              key={item.code}
              onClick={() => onSelect(item.code)}
              aria-pressed={active}
              className={`glass-panel clip-corner flex flex-col gap-1 p-4 text-left transition-colors duration-[var(--dur-fast)] ${
                active ? 'border-magenta/60' : ''
              }`}
            >
              <span
                className={`font-display text-lg font-semibold ${active ? 'text-magenta' : ''}`}
              >
                {item.label}
              </span>
              <span className="font-body text-sm text-muted">{item.description}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onStart}
        disabled={loading}
        className="clip-corner bg-magenta px-5 py-3 font-body text-sm font-semibold text-void transition-shadow duration-[var(--dur-fast)] hover:shadow-[var(--glow-magenta)] disabled:opacity-60"
      >
        {loading ? 'Memuat model…' : 'Mulai main ▸'}
      </button>

      <p className="font-body text-xs text-muted">
        Sesi berlangsung {SESSION_SECONDS} detik. Lewati rintangan dengan gerakanmu — tiap repetisi
        valid memberi bonus skor.
      </p>
    </div>
  );
}

export default function ArenaPage() {
  const [mode, setMode] = useState<ArenaControlMode>('push_up');
  const [started, setStarted] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const { videoRef, liveLandmarksRef, status, error, start, stop } = usePoseDetection();
  const running = status === 'running';
  const active = started && running;

  const { canvasRef, state, restart, endSession } = useArenaGame(mode, liveLandmarksRef, active);
  const sessionEnded = state.gameOver || state.timeUp;

  const remaining = useCountdown(SESSION_SECONDS, active, endSession, sessionKey);

  function handleStart() {
    setStarted(true);
    start();
  }

  function handlePlayAgain() {
    restart();
    setSessionKey((n) => n + 1);
  }

  function handleBackToMenu() {
    stop();
    setStarted(false);
  }

  if (!started) {
    return (
      <main className="flex h-dvh flex-col">
        <header className="glass-panel flex items-center justify-between border-x-0 border-t-0 px-5 py-3">
          <span className="font-display text-sm tracking-wide">
            GYMQUEST <span className="text-muted">· Arena</span>
          </span>
          <Link href="/" className="font-body text-sm text-muted hover:text-cyan">
            ← Kembali
          </Link>
        </header>
        <ModeSelectScreen
          mode={mode}
          onSelect={setMode}
          onStart={handleStart}
          loading={status === 'loading'}
        />
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-col">
      <header className="glass-panel flex items-center justify-between border-x-0 border-t-0 px-5 py-3">
        <span className="font-display text-sm tracking-wide">
          GYMQUEST{' '}
          <span className="text-muted">
            · Arena — {mode === 'push_up' ? 'Push-up' : 'Angkat Barbel'}
          </span>
        </span>
        <button onClick={handleBackToMenu} className="font-body text-sm text-muted hover:text-cyan">
          ← Kembali
        </button>
      </header>

      <div className="relative flex-1 overflow-hidden bg-void">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        <video
          ref={videoRef}
          playsInline
          muted
          className="glass-panel clip-corner absolute top-5 right-5 h-28 w-20 -scale-x-100 object-cover sm:h-36 sm:w-28"
        />

        <div className="pointer-events-none absolute inset-x-0 top-5 flex justify-center gap-3">
          <div className="glass-panel clip-corner flex items-center gap-4 px-5 py-2.5 font-mono text-sm">
            <span className="text-magenta">SCORE {state.score}</span>
            <span className="text-cyan">REPS {state.reps}</span>
            <span className="text-primary">{formatCountdown(Math.max(remaining, 0))}</span>
            <span aria-label={`${state.lives} nyawa tersisa`}>
              {'♥'.repeat(Math.max(state.lives, 0))}
              {'♡'.repeat(Math.max(3 - state.lives, 0))}
            </span>
          </div>
        </div>

        {error && (
          <p
            role="status"
            className="glass-panel clip-corner pointer-events-none absolute bottom-5 left-5 max-w-md px-4 py-3 font-body text-sm text-primary"
          >
            {error.message}
          </p>
        )}

        {sessionEnded && (
          <div className="absolute inset-0 flex items-center justify-center bg-void/70">
            <div className="glass-panel clip-corner flex flex-col items-center gap-3 px-8 py-7 text-center">
              <p className="font-mono text-xs tracking-widest text-magenta uppercase">
                {state.timeUp ? 'Waktu habis' : 'Kehabisan nyawa'}
              </p>
              <p className="font-display text-4xl font-bold text-primary">{state.score}</p>
              <p className="font-body text-sm text-muted">
                Skor akhir · {state.reps} repetisi valid
              </p>
              <div className="mt-2 flex gap-3">
                <button
                  onClick={handlePlayAgain}
                  className="clip-corner bg-magenta px-5 py-2.5 font-body text-sm font-semibold text-void transition-shadow duration-[var(--dur-fast)] hover:shadow-[var(--glow-magenta)]"
                >
                  Main lagi
                </button>
                <button
                  onClick={handleBackToMenu}
                  className="clip-corner border border-muted px-5 py-2.5 font-body text-sm font-semibold hover:border-cyan hover:text-cyan"
                >
                  Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
