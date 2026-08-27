'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatCountdown, useCountdown } from '@/lib/useCountdown';
import { usePoseDetection } from '@/modules/cv-engine/usePoseDetection';
import { useArenaGame } from '@/modules/game-engine/useArenaGame';
import { useKangarooGame } from '@/modules/game-engine/useKangarooGame';
import type { ArenaControlMode } from '@/modules/game-engine/verticalControl';

const SESSION_SECONDS = 60;

type ArenaGame = 'pony' | 'kangaroo';

const GAMES: { code: ArenaGame; label: string; description: string }[] = [
  {
    code: 'pony',
    label: 'Kuda Poni Terbang',
    description:
      'Terbang naik-turun menghindari rintangan, dikendalikan push-up atau angkat barbel.',
  },
  {
    code: 'kangaroo',
    label: 'Kangguru Lari',
    description: 'Lari tanpa henti — jongkok untuk menunduk, berdiri untuk melompati rintangan.',
  },
];

const CONTROL_MODES: { code: ArenaControlMode; label: string; description: string }[] = [
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

function SelectScreen({
  game,
  onSelectGame,
  controlMode,
  onSelectControlMode,
  onStart,
  loading,
}: {
  game: ArenaGame;
  onSelectGame: (game: ArenaGame) => void;
  controlMode: ArenaControlMode;
  onSelectControlMode: (mode: ArenaControlMode) => void;
  onStart: () => void;
  loading: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-16">
      <div>
        <p className="font-mono text-xs tracking-widest text-magenta uppercase">Arena mode</p>
        <h1 className="mt-2 font-display text-2xl font-bold">Pilih game</h1>
      </div>

      <div className="flex flex-col gap-3">
        {GAMES.map((item) => {
          const active = item.code === game;
          return (
            <button
              key={item.code}
              onClick={() => onSelectGame(item.code)}
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

      {game === 'pony' ? (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] tracking-widest text-muted uppercase">
            Cara kendalikan
          </p>
          {CONTROL_MODES.map((item) => {
            const active = item.code === controlMode;
            return (
              <button
                key={item.code}
                onClick={() => onSelectControlMode(item.code)}
                aria-pressed={active}
                className={`glass-panel clip-corner flex flex-col gap-0.5 p-3 text-left transition-colors duration-[var(--dur-fast)] ${
                  active ? 'border-cyan/60' : ''
                }`}
              >
                <span className={`font-body text-sm font-semibold ${active ? 'text-cyan' : ''}`}>
                  {item.label}
                </span>
                <span className="font-body text-xs text-muted">{item.description}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="font-body text-sm text-muted">
          Dikendalikan otomatis lewat gerakan squat: jongkok untuk menunduk di bawah rintangan
          terbang, berdiri kembali untuk melompati rintangan di tanah.
        </p>
      )}

      <button
        onClick={onStart}
        disabled={loading}
        className="clip-corner bg-magenta px-5 py-3 font-body text-sm font-semibold text-void transition-shadow duration-[var(--dur-fast)] hover:shadow-[var(--glow-magenta)] disabled:opacity-60"
      >
        {loading ? 'Memuat model…' : 'Mulai main ▸'}
      </button>

      <p className="font-body text-xs text-muted">
        Sesi berlangsung {SESSION_SECONDS} detik. Tiap repetisi valid memberi bonus skor.
      </p>
    </div>
  );
}

function ScoreHud({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-5 flex justify-center gap-3">
      <div className="glass-panel clip-corner flex items-center gap-4 px-5 py-2.5 font-mono text-sm">
        {children}
      </div>
    </div>
  );
}

function EndOverlay({
  title,
  score,
  detail,
  onPlayAgain,
  onBackToMenu,
}: {
  title: string;
  score: number;
  detail: string;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-void/70">
      <div className="glass-panel clip-corner flex flex-col items-center gap-3 px-8 py-7 text-center">
        <p className="font-mono text-xs tracking-widest text-magenta uppercase">{title}</p>
        <p className="font-display text-4xl font-bold text-primary">{score}</p>
        <p className="font-body text-sm text-muted">{detail}</p>
        <div className="mt-2 flex gap-3">
          <button
            onClick={onPlayAgain}
            className="clip-corner bg-magenta px-5 py-2.5 font-body text-sm font-semibold text-void transition-shadow duration-[var(--dur-fast)] hover:shadow-[var(--glow-magenta)]"
          >
            Main lagi
          </button>
          <button
            onClick={onBackToMenu}
            className="clip-corner border border-muted px-5 py-2.5 font-body text-sm font-semibold hover:border-cyan hover:text-cyan"
          >
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ArenaPage() {
  const [game, setGame] = useState<ArenaGame>('pony');
  const [controlMode, setControlMode] = useState<ArenaControlMode>('push_up');
  const [started, setStarted] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const { videoRef, liveLandmarksRef, status, error, start, stop } = usePoseDetection();
  const running = status === 'running';
  const active = started && running;

  const ponyActive = active && game === 'pony';
  const kangarooActive = active && game === 'kangaroo';

  const pony = useArenaGame(controlMode, liveLandmarksRef, ponyActive);
  const kangaroo = useKangarooGame(liveLandmarksRef, kangarooActive);

  // Dipisah dari canvasRef masing-masing hook secara sengaja: menyatukan
  // keduanya dalam satu objek membuat linter refs menganggap seluruh objek
  // "tercemar ref" dan menolak akses .state di render.
  const currentState = game === 'pony' ? pony.state : kangaroo.state;
  const currentCanvasRef = game === 'pony' ? pony.canvasRef : kangaroo.canvasRef;
  const currentRestart = game === 'pony' ? pony.restart : kangaroo.restart;
  const currentEndSession = game === 'pony' ? pony.endSession : kangaroo.endSession;
  const sessionEnded = currentState.gameOver || currentState.timeUp;

  const remaining = useCountdown(SESSION_SECONDS, active, currentEndSession, sessionKey);

  function handleStart() {
    setStarted(true);
    start();
  }

  function handlePlayAgain() {
    currentRestart();
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
        <SelectScreen
          game={game}
          onSelectGame={setGame}
          controlMode={controlMode}
          onSelectControlMode={setControlMode}
          onStart={handleStart}
          loading={status === 'loading'}
        />
      </main>
    );
  }

  const gameLabel =
    game === 'pony'
      ? `Kuda Poni — ${controlMode === 'push_up' ? 'Push-up' : 'Angkat Barbel'}`
      : 'Kangguru Lari';

  return (
    <main className="flex h-dvh flex-col">
      <header className="glass-panel flex items-center justify-between border-x-0 border-t-0 px-5 py-3">
        <span className="font-display text-sm tracking-wide">
          GYMQUEST <span className="text-muted">· Arena — {gameLabel}</span>
        </span>
        <button onClick={handleBackToMenu} className="font-body text-sm text-muted hover:text-cyan">
          ← Kembali
        </button>
      </header>

      <div className="relative flex-1 overflow-hidden bg-void">
        <canvas ref={currentCanvasRef} className="absolute inset-0 h-full w-full" />

        <video
          ref={videoRef}
          playsInline
          muted
          className="glass-panel clip-corner absolute top-5 right-5 h-28 w-20 -scale-x-100 object-cover sm:h-36 sm:w-28"
        />

        <ScoreHud>
          <span className="text-magenta">SCORE {currentState.score}</span>
          <span className="text-cyan">REPS {currentState.reps}</span>
          <span className="text-primary">{formatCountdown(Math.max(remaining, 0))}</span>
          {game === 'pony' && (
            <span aria-label={`${pony.state.lives} nyawa tersisa`}>
              {'♥'.repeat(Math.max(pony.state.lives, 0))}
              {'♡'.repeat(Math.max(3 - pony.state.lives, 0))}
            </span>
          )}
        </ScoreHud>

        {error && (
          <p
            role="status"
            className="glass-panel clip-corner pointer-events-none absolute bottom-5 left-5 max-w-md px-4 py-3 font-body text-sm text-primary"
          >
            {error.message}
          </p>
        )}

        {sessionEnded && (
          <EndOverlay
            title={
              currentState.timeUp
                ? 'Waktu habis'
                : game === 'pony'
                  ? 'Kehabisan nyawa'
                  : 'Menabrak rintangan'
            }
            score={currentState.score}
            detail={`Skor akhir · ${currentState.reps} repetisi valid`}
            onPlayAgain={handlePlayAgain}
            onBackToMenu={handleBackToMenu}
          />
        )}
      </div>
    </main>
  );
}
