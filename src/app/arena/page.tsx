'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { UserNavButton } from '@/components/UserNavButton';
import { GymQuestLogo } from '@/components/GymQuestLogo';
import { AppNavbar } from '@/components/AppNavbar';
import { useLanguage } from '@/modules/i18n';
import { soundEngine } from '@/modules/game-engine/audio';
import { formatCountdown, useCountdown } from '@/lib/useCountdown';
import { drawBioScan } from '@/modules/cv-engine/drawBioScan';
import type { PoseLandmarks } from '@/modules/cv-engine/types';
import { usePoseDetection } from '@/modules/cv-engine/usePoseDetection';
import { useArenaGame } from '@/modules/game-engine/useArenaGame';
import { useKangarooGame } from '@/modules/game-engine/useKangarooGame';
import type { ArenaControlMode } from '@/modules/game-engine/verticalControl';
import { DuelModeSelectModal } from '@/components/DuelModeSelectModal';

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
  const { t } = useLanguage();
  const [showDuelModal, setShowDuelModal] = useState(false);

  const gamesList: { code: ArenaGame; label: string; description: string }[] = [
    {
      code: 'pony',
      label: t.arena.ponyLabel,
      description: t.arena.ponyDesc,
    },
    {
      code: 'kangaroo',
      label: t.arena.kangarooLabel,
      description: t.arena.kangarooDesc,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-12">
      {/* TOMBOL KEMBALI KE BERANDA */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-xl bg-white/5 border border-white/15 hover:bg-cyan/10 hover:border-cyan/40 hover:text-cyan text-muted transition-all duration-200 text-xs font-mono tracking-wide backdrop-blur-sm shadow-sm group"
      >
        <span className="text-base group-hover:-translate-x-1 transition-transform">←</span>
        <span>{t.common.backToHome}</span>
      </Link>

      <div>
        <p className="font-mono text-xs tracking-widest text-magenta uppercase">{t.nav.arena}</p>
        <h1 className="mt-2 font-display text-2xl font-bold">{t.arena.chooseOpponentTitle}</h1>
      </div>

      {/* CARD KHUSUS 1v1 PUSH-UP BATTLE (MEMBUKA HALAMAN PILIHAN LAWAN DUEL) */}
      <Link
        href="/arena/battle"
        className="glass-panel clip-corner border-2 border-magenta/60 bg-gradient-to-r from-cyan/15 via-magenta/15 to-void p-5 text-left transition-all hover:scale-[1.01] hover:border-magenta relative overflow-hidden group shadow-[0_0_30px_rgba(255,0,122,0.25)] block w-full cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚔️</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-white group-hover:text-magenta transition-colors">
                  {t.arena.pageTitle}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-magenta text-white uppercase tracking-wider">
                  PvP / AI Bot
                </span>
              </div>
              <p className="font-body text-xs text-muted mt-1">
                {t.arena.pageSubtitle}
              </p>
            </div>
          </div>
          <span className="text-magenta font-mono text-xl font-bold group-hover:translate-x-1 transition-transform">➔</span>
        </div>
      </Link>

      <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-wider">
        <span>{t.arena.otherSoloGames}</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <div className="flex flex-col gap-3">
        {gamesList.map((item) => {
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
            {t.arena.pushUpMovement}
          </p>
          <div className="glass-panel clip-corner p-3 text-left border-cyan/60">
            <span className="font-body text-sm font-semibold text-cyan">
              {t.arena.verticalPushUp}
            </span>
            <p className="mt-1 font-body text-xs text-muted">
              {t.arena.ponyInstructions}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] tracking-widest text-muted uppercase">
            {t.arena.overheadMovement}
          </p>
          <div className="glass-panel clip-corner p-3 text-left border-magenta/60">
            <span className="font-body text-sm font-semibold text-magenta">
              {t.arena.overheadPress}
            </span>
            <p className="mt-1 font-body text-xs text-muted">
              {t.arena.kangarooInstructions}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={onStart}
        disabled={loading}
        className="clip-corner bg-magenta px-5 py-3 font-body text-sm font-semibold text-void transition-shadow duration-[var(--dur-fast)] hover:shadow-[var(--glow-magenta)] disabled:opacity-60"
      >
        {loading ? t.arena.loadingModel : t.arena.startGame}
      </button>

      <p className="font-body text-xs text-muted">
        {t.arena.sessionDurationNotice}
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
  const { t } = useLanguage();
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
        {large ? t.arena.shrinkCamera : t.arena.enlargeCamera}
      </button>
    </div>
  );
}

function ScoreHud({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 sm:top-5 flex justify-center px-2 z-10">
      <div className="glass-panel clip-corner flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-3 sm:px-5 py-1.5 sm:py-2.5 font-mono text-xs sm:text-sm">
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
  const { t } = useLanguage();
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
            {t.arena.playAgain}
          </button>
          <button
            onClick={onBackToMenu}
            className="clip-corner border border-muted px-5 py-2.5 font-body text-sm font-semibold hover:border-cyan hover:text-cyan"
          >
            {t.arena.mainMenu}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ArenaPage() {
  const { t, language } = useLanguage();
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
      <main className="min-h-screen flex flex-col bg-transparent overflow-x-hidden">
        <AppNavbar
          activePage="arena"
          subtitle={`· ${t.nav.arena}`}
        />
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
      ? `${t.arena.ponyLabel} (${t.arena.verticalPushUp})`
      : t.arena.kangarooLabel;

  return (
    <main className="flex h-dvh flex-col bg-transparent overflow-x-hidden">
      <header className="glass-panel sticky top-2 sm:top-3 z-20 mx-2 sm:mx-3 rounded-2xl flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 shadow-[0_8px_40px_rgba(0,0,0,0.55)]">
        <Link href="/" className="flex items-center gap-2 group min-w-0">
          <GymQuestLogo size="xs" variant="emblem" />
          <span className="font-display font-bold text-sm tracking-wide text-white group-hover:text-cyan transition-colors truncate">
            GYMQUEST
          </span>
          <span className="text-muted text-xs font-mono truncate hidden sm:inline">· {t.nav.arena} — {gameLabel}</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={toggleSound}
            className="clip-corner border border-muted/50 px-2 sm:px-2.5 py-1 font-mono text-xs text-muted hover:border-magenta hover:text-magenta transition-colors"
            aria-label={isMuted ? 'Nyalakan audio' : 'Matikan audio'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={handleBackToMenu}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 hover:bg-cyan/10 hover:border-cyan/40 hover:text-cyan text-muted transition-all duration-200 text-xs font-mono tracking-wide"
          >
            {t.arena.switchGame}
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
            aria-label={`${currentState.lives} lives`}
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
                ? t.arena.timeUp
                : t.arena.gameOver
            }
            score={currentState.score}
            detail={`${t.workout.summaryTitle}: ${currentState.score} · ${currentState.reps} ${t.programs.repsPerSet}`}
            onPlayAgain={handlePlayAgain}
            onBackToMenu={handleBackToMenu}
          />
        )}
      </div>
    </main>
  );
}
