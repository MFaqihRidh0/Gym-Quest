'use client';

import React, { useRef, useState } from 'react';
import { soundEngine } from '@/modules/game-engine/audio';
import { useLanguage } from '@/modules/i18n';

export interface AchievementShareData {
  title?: string;
  reps: number;
  durationMinutes: number;
  calories: number;
  streakDays: number;
  leagueName?: string;
  username?: string;
}

interface ShareAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AchievementShareData;
}

export function ShareAchievementModal({ isOpen, onClose, data }: ShareAchievementModalProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  const username = data.username || 'Knight-01';
  const league = data.leagueName || 'Iron Initiate';
  const workoutTitle = data.title || 'GymQuest Workout';

  // Format teks untuk WhatsApp / Clipboard
  const shareText = `${t.shareModal.whatsappMessageHeader}%0A%0A` +
    `👤 ${t.shareModal.athlete}: *${username}*%0A` +
    `🏆 ${t.shareModal.league}: *${league}*%0A` +
    `🎯 ${t.shareModal.exercise}: *${workoutTitle}*%0A` +
    `━━━━━━━━━━━━━━━━━━%0A` +
    `💪 ${t.shareModal.totalReps}: *${data.reps} Rep*%0A` +
    `⏱️ ${t.shareModal.totalTime}: *${data.durationMinutes} ${t.shareModal.minutesUnit}*%0A` +
    `🔥 ${t.shareModal.burnedCalories}: *~${data.calories} kcal*%0A` +
    `⚡ ${t.shareModal.dailyStreak}: *${data.streakDays} ${t.shareModal.streakDays}*%0A` +
    `━━━━━━━━━━━━━━━━━━%0A` +
    `${t.shareModal.callToAction}: ${typeof window !== 'undefined' ? window.location.origin : 'https://gymquest.app'}`;

  const cleanCopyText = `${t.shareModal.whatsappMessageHeader.replace(/\*/g, '')}\n\n` +
    `👤 ${t.shareModal.athlete}: ${username}\n` +
    `🏆 ${t.shareModal.league}: ${league}\n` +
    `🎯 ${t.shareModal.exercise}: ${workoutTitle}\n` +
    `──────────────────\n` +
    `💪 ${t.shareModal.totalReps}: ${data.reps} Rep\n` +
    `⏱️ ${t.shareModal.totalTime}: ${data.durationMinutes} ${t.shareModal.minutesUnit}\n` +
    `🔥 ${t.shareModal.burnedCalories}: ~${data.calories} kcal\n` +
    `⚡ ${t.shareModal.dailyStreak}: ${data.streakDays} ${t.shareModal.streakDays}\n` +
    `──────────────────\n` +
    `${t.shareModal.callToAction}!`;

  const handleShareWhatsApp = () => {
    soundEngine.playPoint();
    const url = `https://api.whatsapp.com/send?text=${shareText}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    soundEngine.playPoint();
    navigator.clipboard.writeText(cleanCopyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Render poster 9:16 resolusi tinggi ke Canvas dan unduh PNG
  const handleDownloadStoryImage = () => {
    setDownloading(true);
    soundEngine.playPoint();

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setDownloading(false);
      return;
    }

    // 1. Background Gradient (Dark Navy Cyberpunk)
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGrad.addColorStop(0, '#070c1e');
    bgGrad.addColorStop(0.5, '#0c163b');
    bgGrad.addColorStop(1, '#050814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Cyberpunk Grid Lines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
    ctx.lineWidth = 2;
    for (let x = 0; x < 1080; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1920);
      ctx.stroke();
    }
    for (let y = 0; y < 1920; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }

    // 3. Glowing Neon Corner Accents
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 30;
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(60, 60, 960, 1800);
    ctx.shadowBlur = 0;

    // 4. Header Brand
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('◈ GYMQUEST QUEST LOG ◈', 540, 160);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText('WORKOUT COMPLETED!', 540, 260);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '32px sans-serif';
    ctx.fillText(workoutTitle, 540, 320);

    // 5. Athlete Card Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(120, 390, 840, 220);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(120, 390, 840, 220);

    ctx.font = '100px sans-serif';
    ctx.fillText('⚔️', 240, 535);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(username, 340, 480);

    ctx.fillStyle = '#ffd600';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(`🏆 ${league}`, 340, 540);

    // 6. Big Stats Grid
    const statBoxes = [
      { label: 'TOTAL REPETISI', value: `${data.reps}`, unit: 'REPS', color: '#00e5ff' },
      { label: 'WAKTU LATIHAN', value: `${data.durationMinutes}`, unit: 'MENIT', color: '#38bdf8' },
      { label: 'KALORI TERBAKAR', value: `~${data.calories}`, unit: 'KKAL', color: '#ff007a' },
      { label: 'DAILY STREAK', value: `${data.streakDays}`, unit: 'HARI 🔥', color: '#ffd600' },
    ];

    statBoxes.forEach((box, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = 120 + col * 440;
      const by = 670 + row * 260;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(bx, by, 400, 220);
      ctx.strokeStyle = box.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, by, 400, 220);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(box.label, bx + 200, by + 55);

      ctx.fillStyle = box.color;
      ctx.font = 'bold 76px sans-serif';
      ctx.fillText(box.value, bx + 200, by + 140);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(box.unit, bx + 200, by + 185);
    });

    // 7. Motivational Banner
    ctx.fillStyle = 'rgba(0, 229, 255, 0.1)';
    ctx.fillRect(120, 1250, 840, 180);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(120, 1250, 840, 180);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('“Disiplin hari ini adalah tahta hari esok.”', 540, 1330);
    ctx.fillStyle = '#00e5ff';
    ctx.font = '28px monospace';
    ctx.fillText('100% Latihan Rumahan Terpandu AI', 540, 1385);

    // 8. Footer Badge
    ctx.fillStyle = '#94a3b8';
    ctx.font = '28px monospace';
    ctx.fillText('Mainkan sekarang di: GYMQUEST', 540, 1720);

    // Convert to Image and trigger download
    setTimeout(() => {
      const imageUri = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imageUri;
      a.download = `GymQuest-Story-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloading(false);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-panel clip-corner w-full max-w-lg border-cyan/40 bg-[#070c1e]/98 p-6 sm:p-8 space-y-6 shadow-[0_0_60px_rgba(0,229,255,0.25)]">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📤</span>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-wide">
                {t.shareModal.title}
              </h2>
              <p className="text-xs font-mono text-muted">{t.shareModal.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-muted hover:text-white hover:border-white/30 text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* POSTER CARD PREVIEW */}
        <div className="rounded-xl border border-cyan/40 bg-gradient-to-br from-[#0c163b] to-[#050814] p-5 space-y-4 shadow-[0_0_30px_rgba(0,229,255,0.15)] relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-cyan font-bold">◈ GYMQUEST QUEST CARD ◈</span>
            <span className="text-yellow-400 font-bold">🔥 {data.streakDays} {t.shareModal.streakDays}</span>
          </div>

          <div className="flex items-center gap-3 py-1">
            <div className="w-12 h-12 rounded-xl bg-cyan/20 border border-cyan/50 flex items-center justify-center text-2xl">
              ⚔️
            </div>
            <div>
              <div className="font-display text-base font-bold text-white">{username}</div>
              <div className="text-xs text-yellow-400 font-mono">🏆 {league}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/10">
            <div className="bg-white/5 p-2 rounded-lg border border-white/10">
              <div className="text-[10px] font-mono text-muted uppercase">{t.shareModal.reps}</div>
              <div className="font-display text-lg font-bold text-cyan">{data.reps}</div>
            </div>
            <div className="bg-white/5 p-2 rounded-lg border border-white/10">
              <div className="text-[10px] font-mono text-muted uppercase">{t.shareModal.time}</div>
              <div className="font-display text-lg font-bold text-white">{data.durationMinutes} {t.shareModal.minutesUnit}</div>
            </div>
            <div className="bg-white/5 p-2 rounded-lg border border-white/10">
              <div className="text-[10px] font-mono text-muted uppercase">{t.shareModal.calories}</div>
              <div className="font-display text-lg font-bold text-magenta">~{data.calories}</div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-2.5">
          <button
            onClick={handleShareWhatsApp}
            className="w-full flex items-center justify-center gap-2 clip-corner bg-emerald-500 py-3 font-mono text-xs font-bold text-void hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <span className="text-base">💬</span>
            <span>{t.shareModal.shareToWhatsapp}</span>
          </button>

          <button
            onClick={handleDownloadStoryImage}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 clip-corner bg-gradient-to-r from-cyan to-magenta py-3 font-mono text-xs font-bold text-void hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50"
          >
            <span className="text-base">📸</span>
            <span>{downloading ? t.shareModal.generatingPoster : t.shareModal.downloadPoster}</span>
          </button>

          <button
            onClick={handleCopyText}
            className="w-full flex items-center justify-center gap-2 clip-corner border border-white/20 bg-white/5 py-2.5 font-mono text-xs font-semibold text-white hover:border-white/40 transition-colors"
          >
            <span>📋</span>
            <span>{copied ? t.shareModal.copiedToast : t.shareModal.copySummary}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
