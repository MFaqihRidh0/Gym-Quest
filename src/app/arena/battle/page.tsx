'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePoseDetection } from '@/modules/cv-engine/usePoseDetection';
import { drawBioScan } from '@/modules/cv-engine/drawBioScan';
import { usePushUpBattle, type OpponentMode } from '@/modules/game-engine/usePushUpBattle';
import { ShareAchievementModal } from '@/components/ShareAchievementModal';
import { UserNavButton } from '@/components/UserNavButton';
import { getUserProfile } from '@/modules/program-engine/storage';
import { soundEngine } from '@/modules/game-engine/audio';

export default function PushUpBattlePage() {
  const [opponentMode, setOpponentMode] = useState<OpponentMode>('ai_bot');
  const [showShareModal, setShowShareModal] = useState(false);
  const [cameraLarge, setCameraLarge] = useState(false);
  const profile = getUserProfile();

  // Canvas ref for battle stage
  const battleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live webcam for Player 1
  const { videoRef, liveLandmarksRef, status, error, start, stop } = usePoseDetection();
  const p1OverlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
    triggerAttack,
    triggerKiCharge,
    restartGame,
  } = usePushUpBattle(
    battleCanvasRef,
    liveLandmarksRef,
    profile.username || 'Kamu (P1)',
    opponentMode === 'ai_bot' ? 'Mecha-Vegeta' : 'Pemain 2 (P2)',
    opponentMode,
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
    <main className="min-h-screen flex flex-col bg-void text-primary pb-12">
      {/* HEADER */}
      <header className="glass-panel sticky top-0 z-20 flex items-center justify-between border-x-0 border-t-0 px-5 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/arena"
            className="font-display text-sm tracking-wide text-white hover:text-magenta transition-colors"
          >
            GYMQUEST <span className="text-muted">· Kamehameha Push-Up Battle</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Selector */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1 text-xs font-mono">
            <button
              onClick={() => {
                setOpponentMode('ai_bot');
                restartGame();
              }}
              className={`px-3 py-1 rounded transition-colors ${
                opponentMode === 'ai_bot' ? 'bg-cyan text-void font-bold' : 'text-muted hover:text-white'
              }`}
            >
              vs AI Bot 🤖
            </button>
            <button
              onClick={() => {
                setOpponentMode('local_pvp');
                restartGame();
              }}
              className={`px-3 py-1 rounded transition-colors ${
                opponentMode === 'local_pvp' ? 'bg-magenta text-white font-bold' : 'text-muted hover:text-white'
              }`}
            >
              2 Pemain (PVP) 👥
            </button>
          </div>

          <UserNavButton />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6 flex-1 flex flex-col justify-center">
        {/* TOP STATUS BAR: MATCH INFO */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-pulse">⚡</span>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                Adu Push-Up: KAMEHAMEHA CLASH!
              </h1>
              <p className="text-xs text-muted font-mono">
                Turun ke lantai untuk charge Ki. Dorong push-up untuk tembakkan gelombang Kamehameha!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

              {/* CAMERA ERROR OVERLAY */}
              {status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-void/95 p-4 text-center space-y-2.5 z-20">
                  <span className="text-2xl">📷</span>
                  <p className="font-display text-xs font-bold text-rose-400">Kamera Belum Aktif</p>
                  <p className="text-[10px] text-muted max-w-xs">
                    {error?.message || 'Webcam tidak terdeteksi atau izin belum diberikan.'}
                  </p>
                  <button
                    onClick={() => start()}
                    className="px-3 py-1 rounded bg-cyan text-void font-bold text-[11px] hover:bg-cyan/80 transition-colors"
                  >
                    🔄 Coba Sambungkan Lagi
                  </button>
                  <p className="text-[9px] text-muted font-mono">
                    Bisa tetap bermain via tombol <strong>+1 Rep</strong> atau tekan <strong>[SPASI]</strong>
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

              {/* REP BADGE */}
              <div className="absolute bottom-2 right-2 z-10 px-3 py-1 rounded-lg bg-cyan text-void font-display font-extrabold text-lg shadow-[0_0_15px_rgba(0,229,255,0.6)]">
                {p1Reps} REPS
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-between gap-2 text-xs font-mono pt-1">
              <button
                onClick={() => triggerKiCharge('p1')}
                title="Charge Ki (posisi bawah push-up) [Tombol S]"
                className="flex-1 px-3 py-2 rounded bg-amber-400/15 border border-amber-400/40 hover:bg-amber-400/25 text-amber-300 text-xs font-bold transition-colors text-center"
              >
                ⚡ Charge Ki [S]
              </button>
              <button
                onClick={() => triggerAttack('p1')}
                title="Tembakkan Kamehameha! [Tombol Spasi / A]"
                className="flex-2 px-3 py-2 rounded bg-cyan/20 border border-cyan/50 hover:bg-cyan/30 text-cyan text-xs font-bold transition-colors text-center shadow-[0_0_12px_rgba(0,229,255,0.25)]"
              >
                💥 +1 KAMEHAMEHA! [Spasi]
              </button>
            </div>
          </div>

          {/* SISI KANAN: PLAYER 2 (MAGENTA GLADIATOR - AI / LOCAL PVP) */}
          <div className="glass-panel clip-corner border-2 border-magenta/50 p-4 bg-magenta/5 space-y-3 relative overflow-hidden shadow-[0_0_20px_rgba(255,0,122,0.15)]">
            <div className="flex items-center justify-between border-b border-magenta/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <span className="font-display font-bold text-base text-magenta">
                  {opponentMode === 'ai_bot' ? 'PLAYER 2 (CYBER AI BOT)' : 'PLAYER 2 (TEMAN KAMU)'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-magenta">HP: {p2Hp}/100</span>
            </div>

            {/* OPPONENT AVATAR / FEED */}
            <div className="relative aspect-video w-full rounded-xl bg-gradient-to-br from-[#1b0a23] via-[#0b0816] to-[#070c1e] overflow-hidden border border-magenta/30 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-20 h-20 rounded-2xl bg-magenta/20 border-2 border-magenta flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(255,0,122,0.5)] animate-pulse">
                {opponentMode === 'ai_bot' ? '🤖' : '🥊'}
              </div>

              <div>
                <div className="font-display font-bold text-white text-lg">
                  {opponentMode === 'ai_bot' ? 'Mecha-Gladiator v2.0' : 'Challenger Lokal'}
                </div>
                <div className="text-xs font-mono text-muted">
                  {opponentMode === 'ai_bot'
                    ? 'Menembakkan serangan api setiap 2-3 detik'
                    : 'Adu push-up berdua di ruangan yang sama!'}
                </div>
              </div>

              {/* REP BADGE */}
              <div className="absolute bottom-2 right-2 z-10 px-3 py-1 rounded-lg bg-magenta text-white font-display font-extrabold text-lg shadow-[0_0_15px_rgba(255,0,122,0.6)]">
                {p2Reps} REPS
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-between gap-2 text-xs font-mono pt-1">
              <button
                onClick={() => triggerKiCharge('p2')}
                title="Charge Ki P2 [Tombol K]"
                className="flex-1 px-3 py-2 rounded bg-amber-400/15 border border-amber-400/40 hover:bg-amber-400/25 text-amber-300 text-xs font-bold transition-colors text-center"
              >
                🔥 Charge Ki [K]
              </button>
              <button
                onClick={() => triggerAttack('p2')}
                title="Tembakkan Final Flash! [Tombol Enter / L]"
                className="flex-2 px-3 py-2 rounded bg-magenta/20 border border-magenta/50 hover:bg-magenta/30 text-magenta text-xs font-bold transition-colors text-center shadow-[0_0_12px_rgba(255,0,122,0.25)]"
              >
                💥 +1 FINAL FLASH! [Enter]
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GAME OVER CELEBRATION MODAL */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel clip-corner w-full max-w-md border-cyan p-6 sm:p-8 text-center bg-void/98 space-y-6 shadow-[0_0_60px_rgba(0,229,255,0.3)]">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-4xl border border-cyan/40 bg-cyan/15">
              {winner === 'p1' ? '🏆' : winner === 'p2' ? '💥' : '⚡'}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan font-bold">
                Duel Selesai!
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {winner === 'p1' && 'Kamu Menang KO! 🎉'}
                {winner === 'p2' && 'Lawan Menang! Bangkit Lagi! 🔥'}
                {winner === 'draw' && 'Pertarungan Imbang! ⚡'}
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
                <span>📤</span>
                <span>Bagikan Kemenangan (WhatsApp & IG)</span>
              </button>

              <button
                onClick={restartGame}
                className="w-full clip-corner bg-gradient-to-r from-cyan to-magenta py-3 font-mono text-xs font-bold text-void hover:opacity-90 transition-opacity"
              >
                Tanding Ulang (Rematch) ⚔️
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
