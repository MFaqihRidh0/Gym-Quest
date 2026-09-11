'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePoseDetection } from '@/modules/cv-engine/usePoseDetection';
import { drawBioScan } from '@/modules/cv-engine/drawBioScan';
import { usePushUpBattle, type OpponentMode, type BotDifficulty } from '@/modules/game-engine/usePushUpBattle';
import { ShareAchievementModal } from '@/components/ShareAchievementModal';
import { UserNavButton } from '@/components/UserNavButton';
import { getUserProfile } from '@/modules/program-engine/storage';
import { soundEngine } from '@/modules/game-engine/audio';
import {
  IconBolt,
  IconFlame,
  IconCyberBot,
  IconCombat,
  IconTrophy,
  IconTarget,
  IconBurst,
  IconUsers,
  DifficultyBadge,
} from '@/components/ui/CyberIcons';

export default function PushUpBattlePage() {
  const [opponentMode, setOpponentMode] = useState<OpponentMode>('ai_bot');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [showShareModal, setShowShareModal] = useState(false);
  const [cameraLarge, setCameraLarge] = useState(false);
  const profile = getUserProfile();

  // Canvas ref for battle stage
  const battleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live webcam for Player 1
  const { videoRef, liveLandmarksRef, status, error, start, stop } = usePoseDetection();
  const p1OverlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic Bot Name based on difficulty & target reps
  const botName =
    botDifficulty === 'easy'
      ? 'CyberBot Trainee (Easy · 10 Push-Up)'
      : botDifficulty === 'hard'
        ? 'Super Android-Omega (Hard · 20 Push-Up)'
        : 'Mecha-Vegeta (Medium · 15 Push-Up)';

  // Hook for battle logic
  const {
    p1Reps,
    p2Reps,
    p1Hp,
    p2Hp,
    timeLeft,
    isGameOver,
    winner,
    p1FormCorrect,
    depthPercent,
    currentPhase,
    targetReps,
    triggerAttack,
    triggerKiCharge,
    restartGame,
  } = usePushUpBattle(
    battleCanvasRef,
    liveLandmarksRef,
    profile.username || 'Kamu (P1)',
    opponentMode === 'ai_bot' ? botName : 'Pemain 2 (P2)',
    opponentMode,
    botDifficulty,
  );

  // Start webcam on mount
  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, [start, stop]);

  // Keyboard shortcut listener for active battle controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space' || e.code === 'KeyA') {
        e.preventDefault();
        triggerAttack('p1');
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        triggerKiCharge('p1');
      } else if (e.code === 'Enter' || e.code === 'KeyL') {
        e.preventDefault();
        triggerAttack('p2');
      } else if (e.code === 'KeyK') {
        e.preventDefault();
        triggerKiCharge('p2');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerAttack, triggerKiCharge]);

  // Draw Player 1 Skeleton overlay
  useEffect(() => {
    let animId: number;

    const renderOverlay = () => {
      const video = videoRef.current;
      const canvas = p1OverlayCanvasRef.current;

      if (video && canvas && video.videoWidth > 0) {
        const w = video.clientWidth;
        const h = video.clientHeight;
        const dpr = window.devicePixelRatio || 1;

        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
          canvas.width = w * dpr;
          canvas.height = h * dpr;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, w, h);
          const landmarks = liveLandmarksRef.current;
          if (landmarks) {
            drawBioScan(ctx, landmarks, {
              width: w,
              height: h,
              sourceWidth: video.videoWidth,
              sourceHeight: video.videoHeight,
              mirrored: true,
              formOk: p1FormCorrect,
            });
          }
        }
      }

      animId = requestAnimationFrame(renderOverlay);
    };

    animId = requestAnimationFrame(renderOverlay);
    return () => cancelAnimationFrame(animId);
  }, [videoRef, liveLandmarksRef, p1FormCorrect]);

  return (
    <main className="min-h-screen flex flex-col bg-transparent text-primary pb-12">
      {/* HEADER */}
      <header className="glass-panel sticky top-3 z-20 mx-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 px-5 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.55)]">
        <div className="flex items-center gap-3">
          <Link
            href="/arena"
            className="font-display text-sm tracking-wide text-white hover:text-magenta transition-colors"
          >
            GYMQUEST <span className="text-muted">· Kamehameha Push-Up Battle</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Selector */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1 text-xs font-mono">
            <button
              onClick={() => {
                setOpponentMode('ai_bot');
                restartGame();
              }}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                opponentMode === 'ai_bot' ? 'bg-cyan text-void font-bold' : 'text-muted hover:text-white'
              }`}
            >
              <IconCyberBot size={14} className={opponentMode === 'ai_bot' ? 'text-void' : 'text-cyan'} />
              <span>vs AI Bot</span>
            </button>
            <button
              onClick={() => {
                setOpponentMode('local_pvp');
                restartGame();
              }}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                opponentMode === 'local_pvp' ? 'bg-magenta text-white font-bold' : 'text-muted hover:text-white'
              }`}
            >
              <IconUsers size={14} className={opponentMode === 'local_pvp' ? 'text-white' : 'text-magenta'} />
              <span>2 Pemain (PVP)</span>
            </button>
          </div>

          {/* AI Bot Level Selector (Easy 10, Medium 15, Hard 20 Push-Up) */}
          {opponentMode === 'ai_bot' && (
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1 text-xs font-mono gap-1">
              <span className="text-[10px] text-muted px-2 hidden sm:inline">Bot Level:</span>
              <button
                onClick={() => {
                  setBotDifficulty('easy');
                  restartGame();
                }}
                title="Level Easy: 10 Push-Up untuk K.O (1 rep / 6 detik)"
              >
                <DifficultyBadge level="easy" active={botDifficulty === 'easy'} />
              </button>
              <button
                onClick={() => {
                  setBotDifficulty('medium');
                  restartGame();
                }}
                title="Level Medium: 15 Push-Up untuk K.O (1 rep / 4 detik)"
              >
                <DifficultyBadge level="medium" active={botDifficulty === 'medium'} />
              </button>
              <button
                onClick={() => {
                  setBotDifficulty('hard');
                  restartGame();
                }}
                title="Level Hard: 20 Push-Up untuk K.O (1 rep / 3 detik)"
              >
                <DifficultyBadge level="hard" active={botDifficulty === 'hard'} />
              </button>
            </div>
          )}

          <UserNavButton />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6 flex-1 flex flex-col justify-center">
        {/* TOP STATUS BAR: MATCH INFO */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan/10 border border-cyan/30 text-cyan">
              <IconBolt size={26} className="text-cyan animate-pulse" glow />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>Adu Push-Up: KAMEHAMEHA CLASH!</span>
                <IconBurst size={22} className="text-amber-400" glow />
              </h1>
              <p className="text-xs text-muted font-mono">
                Turun ke lantai untuk charge Ki. Dorong push-up untuk tembakkan gelombang Kamehameha!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan/30 bg-cyan/10 text-cyan text-xs font-mono font-bold shadow-[0_0_10px_rgba(0,229,255,0.15)]">
              <IconTarget size={14} className="text-cyan" />
              <span>Target K.O:</span>
              <span className="text-white">{targetReps} Push-Up</span>
            </div>
            <button
              onClick={() => {
                soundEngine.playCountdownTick();
                restartGame();
              }}
              className="px-3 py-1.5 rounded border border-white/20 bg-white/5 hover:border-cyan text-xs font-mono text-white transition-colors"
            >
              🔄 Ulang Ronde
            </button>
            <Link
              href="/arena"
              className="px-3 py-1.5 rounded border border-white/20 bg-white/5 hover:border-magenta text-xs font-mono text-muted hover:text-white transition-colors"
            >
              ← Keluar Arena
            </Link>
          </div>
        </div>

        {/* 2D CANVAS BATTLE VIEW (CENTER STAGE) */}
        <div className="relative w-full rounded-2xl border-2 border-cyan/40 bg-void/90 overflow-hidden shadow-[0_0_40px_rgba(0,229,255,0.2)]">
          <canvas
            ref={battleCanvasRef}
            width={800}
            height={380}
            className="w-full h-auto max-h-[380px] block"
          />
        </div>

        {/* SPLIT-SCREEN CONTROLLERS (PLAYER 1 VS PLAYER 2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SISI KIRI: PLAYER 1 (CYAN WARRIOR - REAL WEBCAM) */}
          <div className="glass-panel clip-corner border-2 border-cyan/50 p-4 bg-cyan/5 space-y-3 relative overflow-hidden shadow-[0_0_20px_rgba(0,229,255,0.15)]">
            <div className="flex items-center justify-between border-b border-cyan/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <span className="font-display font-bold text-base text-cyan">
                  PLAYER 1 (KAMU - SUPER SAIYAN)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCameraLarge((v) => !v)}
                  className="px-2 py-0.5 rounded border border-cyan/30 text-[10px] font-mono text-cyan hover:bg-cyan/10 transition-colors"
                >
                  {cameraLarge ? 'Perkecil ↘' : 'Perbesar ↖'}
                </button>
                <span className="text-xs font-mono font-bold text-cyan">HP: {p1Hp}/100</span>
              </div>
            </div>

            {/* LIVE WEBCAM CAMERA CONTAINER */}
            <div
              className={`relative w-full rounded-xl bg-black/80 overflow-hidden border border-cyan/30 flex items-center justify-center transition-all duration-300 ${
                cameraLarge ? 'aspect-4/3' : 'aspect-video'
              }`}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover -scale-x-100"
              />
              <canvas
                ref={p1OverlayCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* LOADING CAMERA OVERLAY */}
              {status === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-void/90 p-4 text-center space-y-2 z-20">
                  <span className="text-3xl animate-spin">🌀</span>
                  <p className="font-mono text-xs text-cyan font-bold">Menghubungkan Kamera AI…</p>
                  <p className="text-[10px] text-muted max-w-xs">
                    Memuat pose tracking untuk mendeteksi posisi push-up dan charge Ki Kamehameha.
                  </p>
                </div>
              )}

              {/* CAMERA ERROR / IDLE OVERLAY */}
              {(status === 'error' || status === 'idle') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-void/95 p-4 text-center space-y-2.5 z-20">
                  <div className="w-11 h-11 rounded-full bg-cyan/15 border border-cyan/40 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,229,255,0.25)]">
                    📷
                  </div>
                  <p className="font-display text-sm font-bold text-white">
                    {status === 'error' ? 'Kamera Belum Aktif' : 'Aktifkan Kamera AI'}
                  </p>
                  <p className="text-[11px] text-muted max-w-xs leading-relaxed">
                    {error?.message ||
                      'Izinkan akses webcam di browser Anda untuk mendeteksi repetisi push-up dan charge Ki otomatis.'}
                  </p>
                  <button
                    onClick={() => start()}
                    className="px-4 py-2 rounded-lg bg-cyan text-void font-bold text-xs hover:bg-cyan/80 transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:scale-105"
                  >
                    🔄 Sambungkan Kamera Sekarang
                  </button>
                  <p className="text-[10px] text-muted font-mono pt-1">
                    Atau gunakan tombol <strong className="text-cyan">+1 Rep</strong> / tekan <strong className="text-white">[SPASI]</strong>
                  </p>
                </div>
              )}

              {/* LIVE FORM INDICATOR PILL */}
              {status === 'running' && (
                <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded bg-black/70 border border-white/20 text-[10px] font-mono flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      p1FormCorrect ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span className={p1FormCorrect ? 'text-emerald-400' : 'text-rose-400'}>
                    {p1FormCorrect ? 'Form Sah · Kamera Aktif' : 'Koreksi: Tekuk Siku 90°'}
                  </span>
                </div>
              )}

              {/* LIVE DEPTH GAUGE & SENSOR BAR (FLAPPY BIRD MOTION TRACKER) */}
              {status === 'running' && (
                <div className="absolute bottom-2 left-2 z-10 p-2 rounded-lg bg-black/80 border border-cyan/40 backdrop-blur-sm flex flex-col gap-1 w-48 sm:w-56 shadow-lg">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted">Sensor Gerak AI:</span>
                    {currentPhase === 'down' ? (
                      <span className="flex items-center gap-1 font-bold text-amber-300 animate-pulse">
                        <IconBolt size={12} className="text-amber-300" />
                        <span>CHARGING KI</span>
                      </span>
                    ) : (
                      <span className="font-bold text-cyan">POSISI ATAS</span>
                    )}
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-75 ${
                        currentPhase === 'down' ? 'bg-amber-400' : 'bg-cyan'
                      }`}
                      style={{ width: `${Math.max(8, depthPercent)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-muted">
                    <span>Turun (Bawah)</span>
                    <span className="text-white font-bold">{depthPercent}%</span>
                    <span>Dorong (Atas)</span>
                  </div>
                </div>
              )}

              {/* REP BADGE */}
              <div className="absolute bottom-2 right-2 z-10 px-3 py-1 rounded-lg bg-cyan text-void font-display font-extrabold text-lg shadow-[0_0_15px_rgba(0,229,255,0.6)]">
                {p1Reps} / {targetReps} REPS
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-between gap-2 text-xs font-mono pt-1">
              <button
                onClick={() => triggerKiCharge('p1')}
                title="Charge Ki (posisi bawah push-up) [Tombol S]"
                className="flex-1 px-3 py-2 rounded bg-amber-400/15 border border-amber-400/40 hover:bg-amber-400/25 text-amber-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <IconBolt size={14} className="text-amber-300" glow />
                <span>Charge Ki [S]</span>
              </button>
              <button
                onClick={() => triggerAttack('p1')}
                title="Tembakkan Kamehameha! [Tombol Spasi / A]"
                className="flex-2 px-3 py-2 rounded bg-cyan/20 border border-cyan/50 hover:bg-cyan/30 text-cyan text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,229,255,0.25)]"
              >
                <IconBurst size={15} className="text-cyan" glow />
                <span>+1 KAMEHAMEHA! [Spasi]</span>
              </button>
            </div>
          </div>

          {/* SISI KANAN: PLAYER 2 (MAGENTA GLADIATOR - AI / LOCAL PVP) */}
          <div className="glass-panel clip-corner border-2 border-magenta/50 p-4 bg-magenta/5 space-y-3 relative overflow-hidden shadow-[0_0_20px_rgba(255,0,122,0.15)]">
            <div className="flex items-center justify-between border-b border-magenta/20 pb-2">
              <div className="flex items-center gap-2">
                <IconFlame size={18} className="text-magenta" glow />
                <span className="font-display font-bold text-base text-magenta">
                  {opponentMode === 'ai_bot' ? 'PLAYER 2 (CYBER AI BOT)' : 'PLAYER 2 (TEMAN KAMU)'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-magenta">HP: {p2Hp}/100</span>
            </div>

            {/* OPPONENT AVATAR / FEED */}
            <div className="relative aspect-video w-full rounded-xl bg-gradient-to-br from-[#1b0a23] via-[#0b0816] to-[#070c1e] overflow-hidden border border-magenta/30 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-20 h-20 rounded-2xl bg-magenta/20 border-2 border-magenta flex items-center justify-center shadow-[0_0_25px_rgba(255,0,122,0.5)] animate-pulse">
                {opponentMode === 'ai_bot' ? (
                  <IconCyberBot size={42} className="text-magenta" glow />
                ) : (
                  <IconCombat size={42} className="text-magenta" glow />
                )}
              </div>

              <div>
                <div className="font-display font-bold text-white text-lg">
                  {opponentMode === 'ai_bot' ? botName : 'Challenger Lokal'}
                </div>
                <div className="text-xs font-mono text-muted">
                  {opponentMode === 'ai_bot'
                    ? botDifficulty === 'easy'
                      ? 'Level Easy · Target 10 Push-Up (1 rep / 6 detik)'
                      : botDifficulty === 'medium'
                        ? 'Level Medium · Target 15 Push-Up (1 rep / 4 detik)'
                        : 'Level Hard · Target 20 Push-Up (1 rep / 3 detik)'
                    : `Adu push-up berdua · Target K.O: ${targetReps} Repetisi!`}
                </div>
              </div>

              {/* REP BADGE */}
              <div className="absolute bottom-2 right-2 z-10 px-3 py-1 rounded-lg bg-magenta text-white font-display font-extrabold text-lg shadow-[0_0_15px_rgba(255,0,122,0.6)]">
                {p2Reps} / {targetReps} REPS
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-between gap-2 text-xs font-mono pt-1">
              <button
                onClick={() => triggerKiCharge('p2')}
                title="Charge Ki P2 [Tombol K]"
                className="flex-1 px-3 py-2 rounded bg-amber-400/15 border border-amber-400/40 hover:bg-amber-400/25 text-amber-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <IconFlame size={14} className="text-amber-300" glow />
                <span>Charge Ki [K]</span>
              </button>
              <button
                onClick={() => triggerAttack('p2')}
                title="Tembakkan Final Flash! [Tombol Enter / L]"
                className="flex-2 px-3 py-2 rounded bg-magenta/20 border border-magenta/50 hover:bg-magenta/30 text-magenta text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(255,0,122,0.25)]"
              >
                <IconBurst size={15} className="text-magenta" glow />
                <span>+1 FINAL FLASH! [Enter]</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GAME OVER CELEBRATION MODAL */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel clip-corner w-full max-w-md border-cyan p-6 sm:p-8 text-center bg-void/98 space-y-6 shadow-[0_0_60px_rgba(0,229,255,0.3)]">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center border border-cyan/40 bg-cyan/15">
              {winner === 'p1' ? (
                <IconTrophy size={36} className="text-cyan" glow />
              ) : winner === 'p2' ? (
                <IconFlame size={36} className="text-magenta" glow />
              ) : (
                <IconBolt size={36} className="text-amber-400" glow />
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan font-bold">
                Duel Selesai!
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {winner === 'p1' && 'Kamu Menang KO!'}
                {winner === 'p2' && 'Lawan Menang! Bangkit Lagi!'}
                {winner === 'draw' && 'Pertarungan Imbang!'}
              </h2>
              <p className="text-xs text-muted">
                Total push-up yang kamu hasilkan: <strong>{p1Reps} Repetisi</strong> vs Lawan:{' '}
                <strong>{p2Reps} Repetisi</strong>.
              </p>
            </div>

            {/* STATS COMPARISON */}
            <div className="grid grid-cols-2 gap-3 py-2 border-y border-white/10 text-xs font-mono">
              <div className="p-2 bg-cyan/10 rounded-lg border border-cyan/30">
                <div className="text-[10px] text-muted">Push-up Kamu (P1)</div>
                <div className="font-bold text-cyan text-lg mt-0.5">{p1Reps} Reps</div>
                <div className="text-[10px] text-muted mt-0.5">Sisa HP: {p1Hp}</div>
              </div>
              <div className="p-2 bg-magenta/10 rounded-lg border border-magenta/30">
                <div className="text-[10px] text-muted">Push-up Lawan (P2)</div>
                <div className="font-bold text-magenta text-lg mt-0.5">{p2Reps} Reps</div>
                <div className="text-[10px] text-muted mt-0.5">Sisa HP: {p2Hp}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              {/* TOMBOL BAGIKAN HASIL KE WA & INSTAGRAM */}
              <button
                onClick={() => setShowShareModal(true)}
                className="w-full flex items-center justify-center gap-2 clip-corner bg-emerald-500 py-3 font-mono text-xs font-bold text-void hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <span>Bagikan Rekor Latihan (WhatsApp & IG)</span>
                <IconBurst size={14} className="text-void" />
              </button>

              <button
                onClick={restartGame}
                className="w-full clip-corner bg-gradient-to-r from-cyan to-magenta py-3 font-mono text-xs font-bold text-void hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <IconCombat size={15} className="text-void" />
                <span>Tanding Ulang (Rematch)</span>
              </button>

              <Link
                href="/arena"
                className="w-full clip-corner border border-white/20 bg-white/5 py-2.5 font-mono text-xs font-semibold text-muted hover:text-white transition-colors"
              >
                Kembali ke Arena Mode
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* SHARE ACHIEVEMENT MODAL */}
      <ShareAchievementModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        data={{
          title: 'Push-Up Battle 1v1 Arena',
          reps: p1Reps,
          durationMinutes: Math.max(1, Math.round((60 - timeLeft) / 60)),
          calories: Math.round(p1Reps * 0.8 + 15),
          streakDays: profile.streakDays || 1,
          leagueName: 'Arena Gladiator',
          username: profile.username || 'Knight-01',
        }}
      />
    </main>
  );
}
