'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { soundEngine } from '@/modules/game-engine/audio';
import { formatCountdown, useCountdown } from '@/lib/useCountdown';
import { drawBioScan } from '@/modules/cv-engine/drawBioScan';
import type { PoseLandmarks } from '@/modules/cv-engine/types';
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
      'Terbang naik-turun menembus celah laser, dikendalikan gerakan push-up.',
  },
  {
    code: 'kangaroo',
    label: 'Kangguru Angkat Barbel',
    description:
      'Lari melompati rintangan trapesium panjang — angkat tangan/barbel ke atas untuk melompat & melayang.',
  },
];

function SelectScreen({
  game,
  onSelectGame,
  onStart,
  loading,
}: {
  game: ArenaGame;
  onSelectGame: (game: ArenaGame) => void;
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
            Gerakan push-up
          </p>
          <div className="glass-panel clip-corner p-3 text-left border-cyan/60">
            <span className="font-body text-sm font-semibold text-cyan">
              Push-up Vertikal
            </span>
            <p className="mt-1 font-body text-xs text-muted">
              Kuda poni naik saat Anda mendorong badan ke atas, dan turun saat dada mendekati lantai. Sesuaikan ritme dengan celah laser!
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] tracking-widest text-muted uppercase">
            Gerakan angkat barbel
          </p>
          <div className="glass-panel clip-corner p-3 text-left border-magenta/60">
            <span className="font-body text-sm font-semibold text-magenta">
              Angkat Barbel (Overhead Press)
            </span>
            <p className="mt-1 font-body text-xs text-muted">
              Kangguru melompat saat kedua tangan diangkat ke atas, dan mendarat saat tangan diturunkan. <strong>Tahan tangan di atas</strong> sampai rintangan trapesium panjang berhasil dilewati!
            </p>
          </div>
        </div>
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

function PipCamera({
  videoRef,
  landmarksRef,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarksRef: React.RefObject<PoseLandmarks | null>;
}) {
  const [large, setLarge] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const render = () => {
      const w = video.clientWidth;
      const h = video.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawBioScan(ctx, landmarksRef.current, {
        width: w,
        height: h,
        sourceWidth: video.videoWidth,
        sourceHeight: video.videoHeight,
      });
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [videoRef, landmarksRef]);

  return (
    <div
      className={`glass-panel clip-corner absolute top-5 right-5 z-20 overflow-hidden transition-all duration-300 shadow-[var(--glow-cyan)] border border-cyan/40 ${
        large
          ? 'w-72 h-52 sm:w-96 sm:h-64 md:w-[26rem] md:h-72'
          : 'w-48 h-36 sm:w-64 sm:h-48 md:w-72 md:h-52'
      }`}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
      />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      <button
        onClick={() => setLarge((v) => !v)}
        className="clip-corner absolute bottom-1.5 right-1.5 z-30 bg-void/85 px-2 py-0.5 font-mono text-[10px] text-cyan border border-cyan/30 hover:border-cyan transition-colors"
        title="Ubah ukuran kamera"
      >
        {large ? 'Kecilkan ↘' : 'Perbesar ↖'}
      </button>
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

  const [isMuted, setIsMuted] = useState(soundEngine.muted);

  useEffect(() => {
    if (active && !sessionEnded) {
      soundEngine.startBgm();
    } else {
      soundEngine.stopBgm();
    }
    return () => soundEngine.stopBgm();
  }, [active, sessionEnded]);

  const toggleSound = () => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  };

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
    soundEngine.stopBgm();
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
          onStart={handleStart}
          loading={status === 'loading'}
        />
      </main>
    );
  }

  const gameLabel =
    game === 'pony'
      ? 'Kuda Poni Terbang (Push-up)'
      : 'Kangguru Angkat Barbel';

  return (
    <main className="flex h-dvh flex-col">
      <header className="glass-panel flex items-center justify-between border-x-0 border-t-0 px-5 py-3">
        <span className="font-display text-sm tracking-wide">
          GYMQUEST <span className="text-muted">· Arena — {gameLabel}</span>
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            className="clip-corner border border-muted/50 px-2.5 py-1 font-mono text-xs text-muted hover:border-magenta hover:text-magenta transition-colors"
            aria-label={isMuted ? 'Nyalakan audio' : 'Matikan audio'}
          >
            {isMuted ? '🔇 Audio Off' : '🔊 Audio On'}
          </button>
          <button onClick={handleBackToMenu} className="font-body text-sm text-muted hover:text-cyan">
            ← Kembali
          </button>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden bg-void">
        <canvas ref={currentCanvasRef} className="absolute inset-0 h-full w-full" />

        <PipCamera videoRef={videoRef} landmarksRef={liveLandmarksRef} />

        <ScoreHud>
          <span className="text-magenta font-bold">SCORE {currentState.score}</span>
          <span className="text-cyan font-bold">REPS {currentState.reps}</span>
          <span className="text-primary">{formatCountdown(Math.max(remaining, 0))}</span>
          <span
            className="flex items-center gap-1 font-mono text-xs text-magenta font-bold"
            aria-label={`${currentState.lives} nyawa tersisa`}
          >
            {'♥ '.repeat(Math.max(currentState.lives, 0))}
            <span className="text-muted/30">{'♡ '.repeat(Math.max(3 - currentState.lives, 0))}</span>
          </span>
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
                ? 'WAKTU HABIS!'
                : '3 NYAWA HABIS! 💥'
            }
            score={currentState.score}
            detail={`Skor akhir: ${currentState.score} · Berhasil ${currentState.reps} repetisi valid`}
            onPlayAgain={handlePlayAgain}
            onBackToMenu={handleBackToMenu}
          />
        )}
      </div>
    </main>
  );
}
