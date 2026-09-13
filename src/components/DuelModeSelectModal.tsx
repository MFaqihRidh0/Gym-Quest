'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/modules/i18n';
import { generateRoomCode, normalizeRoomCode } from '@/modules/multiplayer/roomManager';
import {
  IconCyberBot,
  IconCombat,
  IconBurst,
  IconBolt,
  IconUsers,
  DifficultyBadge,
} from '@/components/ui/CyberIcons';
import type { BotDifficulty } from '@/modules/game-engine/usePushUpBattle';

interface DuelModeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DuelModeSelectModal({ isOpen, onClose }: DuelModeSelectModalProps) {
  const { language } = useLanguage();
  const router = useRouter();

  // Selected duel target: 'bot' | 'online'
  const [selectedTarget, setSelectedTarget] = useState<'bot' | 'online'>('bot');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');

  // Online Room tab: 'generate' | 'enter'
  const [onlineTab, setOnlineTab] = useState<'generate' | 'enter'>('generate');
  const [generatedCode, setGeneratedCode] = useState<string>(() => generateRoomCode());
  const [inputCode, setInputCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const shareLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/arena/battle?mode=online_pvp&action=join&room=${generatedCode}`
      : `https://gymquest.vercel.app/arena/battle?mode=online_pvp&action=join&room=${generatedCode}`;

  const copyText = (text: string, type: 'code' | 'link') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    }
  };

  const handleStartBot = () => {
    onClose();
    router.push(`/arena/battle?mode=ai_bot&difficulty=${botDifficulty}`);
  };

  const handleCreateOnlineRoom = () => {
    onClose();
    router.push(`/arena/battle?mode=online_pvp&action=create&room=${generatedCode}`);
  };

  const handleJoinOnlineRoom = () => {
    const clean = normalizeRoomCode(inputCode);
    if (!clean) return;
    onClose();
    router.push(`/arena/battle?mode=online_pvp&action=join&room=${clean}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel clip-corner border-2 border-cyan/50 bg-[#08112c]/98 p-6 sm:p-8 rounded-2xl w-full max-w-2xl space-y-6 shadow-[0_0_60px_rgba(0,229,255,0.25)] relative max-h-[92vh] overflow-y-auto">
        {/* Tombol Tutup */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 border border-white/15 text-muted hover:text-white hover:border-cyan transition-colors flex items-center justify-center font-mono text-xs"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 text-center sm:text-left pr-8">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="text-xl">⚔️</span>
            <span className="text-xs font-mono tracking-widest text-cyan uppercase font-bold">
              {language === 'en' ? 'PUSH-UP ARENA LOBBY' : 'LOBBY ARENA DUEL'}
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            {language === 'en' ? 'Choose Your Opponent' : 'Pilih Lawan Duel Push-Up'}
          </h2>
          <p className="text-xs text-muted leading-relaxed">
            {language === 'en'
              ? 'Select whether to train against an AI Bot or duel another player in real-time.'
              : 'Tentukan apakah kamu ingin bertanding melawan AI Bot atau duel langsung dengan pemain lain.'}
          </p>
        </div>

        {/* 2 PILIHAN UTAMA: LAWAN BOT VS LAWAN PLAYER LAIN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* PILIHAN 1: LAWAN AI BOT */}
          <button
            type="button"
            onClick={() => setSelectedTarget('bot')}
            className={`p-5 rounded-xl text-left transition-all border-2 flex flex-col justify-between space-y-3 relative overflow-hidden ${
              selectedTarget === 'bot'
                ? 'border-cyan bg-cyan/15 shadow-[0_0_25px_rgba(0,229,255,0.25)] scale-[1.01]'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-cyan/15 border border-cyan/40 flex items-center justify-center text-cyan shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                <IconCyberBot size={26} className="text-cyan" glow />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan text-void uppercase tracking-wider">
                {language === 'en' ? 'Solo AI' : 'Lawan Bot'}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-1.5">
                <span>{language === 'en' ? 'vs Cyber AI Bot' : 'Lawan Cyber Bot'}</span>
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {language === 'en'
                  ? 'Battle a virtual sparring partner with calibrated rep cadences.'
                  : 'Tantang bot virtual cerdas dengan target repetisi terukur.'}
              </p>
            </div>

            <div className="flex items-center text-xs font-mono font-bold text-cyan">
              <span>{selectedTarget === 'bot' ? '● Dipilih' : 'Pilih Mode Ini'}</span>
            </div>
          </button>

          {/* PILIHAN 2: LAWAN PLAYER LAIN */}
          <button
            type="button"
            onClick={() => setSelectedTarget('online')}
            className={`p-5 rounded-xl text-left transition-all border-2 flex flex-col justify-between space-y-3 relative overflow-hidden ${
              selectedTarget === 'online'
                ? 'border-magenta bg-magenta/15 shadow-[0_0_25px_rgba(255,0,122,0.25)] scale-[1.01]'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-magenta/15 border border-magenta/40 flex items-center justify-center text-magenta shadow-[0_0_15px_rgba(255,0,122,0.2)]">
                <IconUsers size={26} className="text-magenta" glow />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-magenta text-white uppercase tracking-wider">
                {language === 'en' ? 'Online PvP' : 'Multiplayer'}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-1.5">
                <span>{language === 'en' ? 'vs Another Player' : 'Lawan Player Lain'}</span>
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {language === 'en'
                  ? 'Real-time 1v1 duel against a friend on any device using room codes.'
                  : 'Duel 1v1 real-time melawan teman via kode room dan kamera masing-masing.'}
              </p>
            </div>

            <div className="flex items-center text-xs font-mono font-bold text-magenta">
              <span>{selectedTarget === 'online' ? '● Dipilih' : 'Pilih Mode Ini'}</span>
            </div>
          </button>
        </div>

        {/* KONTEN DETAIL SESUAI PILIHAN */}

        {/* 1. KONTEN PILIHAN BOT */}
        {selectedTarget === 'bot' && (
          <div className="p-5 rounded-2xl bg-cyan/5 border border-cyan/30 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono uppercase tracking-wider text-cyan font-bold">
                {language === 'en' ? 'Select Bot Difficulty:' : 'Pilih Tingkat Kesulitan Bot:'}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setBotDifficulty('easy')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  botDifficulty === 'easy'
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'border-white/10 bg-white/5 text-muted hover:text-white'
                }`}
              >
                <div className="font-display text-sm font-bold">Novice</div>
                <div className="text-[10px] text-muted mt-0.5">10 Push-Up</div>
              </button>

              <button
                type="button"
                onClick={() => setBotDifficulty('medium')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  botDifficulty === 'medium'
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'border-white/10 bg-white/5 text-muted hover:text-white'
                }`}
              >
                <div className="font-display text-sm font-bold">Knight</div>
                <div className="text-[10px] text-muted mt-0.5">15 Push-Up</div>
              </button>

              <button
                type="button"
                onClick={() => setBotDifficulty('hard')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  botDifficulty === 'hard'
                    ? 'border-red-500 bg-red-500/20 text-red-300 font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : 'border-white/10 bg-white/5 text-muted hover:text-white'
                }`}
              >
                <div className="font-display text-sm font-bold">Master</div>
                <div className="text-[10px] text-muted mt-0.5">20 Push-Up</div>
              </button>
            </div>

            <button
              onClick={handleStartBot}
              className="w-full py-3.5 rounded-xl bg-cyan text-void font-bold text-sm font-display hover:bg-cyan/90 transition-all shadow-[var(--glow-cyan)] flex items-center justify-center gap-2"
            >
              <span>⚡</span>
              <span>{language === 'en' ? 'Start Battle vs AI Bot ▸' : 'Mulai Lawan Cyber Bot ▸'}</span>
            </button>
          </div>
        )}

        {/* 2. KONTEN PILIHAN LAWAN PLAYER LAIN */}
        {selectedTarget === 'online' && (
          <div className="p-5 rounded-2xl bg-magenta/5 border border-magenta/30 space-y-5 animate-fade-in">
            {/* Tab: Generate Kode vs Masukkan Kode */}
            <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-magenta/20 text-xs font-mono">
              <button
                type="button"
                onClick={() => setOnlineTab('generate')}
                className={`py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                  onlineTab === 'generate'
                    ? 'bg-magenta text-white shadow-[var(--glow-magenta)]'
                    : 'text-muted hover:text-white'
                }`}
              >
                <span>⚡</span>
                <span>{language === 'en' ? 'Generate Room Code' : 'Generate Kode (Host)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setOnlineTab('enter')}
                className={`py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                  onlineTab === 'enter'
                    ? 'bg-magenta text-white shadow-[var(--glow-magenta)]'
                    : 'text-muted hover:text-white'
                }`}
              >
                <span>🔑</span>
                <span>{language === 'en' ? 'Enter Room Code' : 'Masukkan Kode (Guest)'}</span>
              </button>
            </div>

            {/* SUB-TAB 1: GENERATE KODE */}
            {onlineTab === 'generate' && (
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-xl bg-black/60 border border-magenta/30 space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-muted">
                    {language === 'en' ? 'Your Duel Room Code' : 'Kode Room Duel Kamu'}
                  </span>
                  <div className="font-display text-4xl sm:text-5xl font-extrabold tracking-widest text-white drop-shadow-[0_0_20px_rgba(255,0,122,0.6)]">
                    {generatedCode}
                  </div>
                  <p className="text-[11px] font-mono text-muted">
                    {language === 'en'
                      ? 'Share this code with your friend to connect instantly.'
                      : 'Bagikan kode ini kepada temanmu agar bisa langsung terhubung.'}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => copyText(generatedCode, 'code')}
                      className="px-3.5 py-1.5 rounded-lg bg-magenta/15 border border-magenta/40 text-magenta text-xs font-mono font-bold hover:bg-magenta/25 transition-all flex items-center gap-1"
                    >
                      <span>📋</span>
                      <span>{copiedCode ? (language === 'en' ? 'Code Copied!' : 'Kode Disalin!') : (language === 'en' ? 'Copy Code' : 'Salin Kode')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(shareLink, 'link')}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan/15 border border-cyan/40 text-cyan text-xs font-mono font-bold hover:bg-cyan/25 transition-all flex items-center gap-1"
                    >
                      <span>🔗</span>
                      <span>{copiedLink ? (language === 'en' ? 'Link Copied!' : 'Link Disalin!') : (language === 'en' ? 'Copy Duel Link' : 'Salin Link Duel')}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateOnlineRoom}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan to-magenta text-void font-bold text-sm font-display hover:shadow-[var(--glow-cyan)] transition-all flex items-center justify-center gap-2"
                >
                  <span>🚀</span>
                  <span>{language === 'en' ? 'Create Room & Enter Arena ▸' : 'Buat Room & Masuk Arena ▸'}</span>
                </button>
              </div>
            )}

            {/* SUB-TAB 2: MASUKKAN KODE */}
            {onlineTab === 'enter' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted block">
                    {language === 'en' ? 'Enter Duel Room Code from Host:' : 'Masukkan Kode Room dari Host:'}
                  </label>
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="GQ-8821"
                    maxLength={10}
                    className="w-full bg-black/60 border-2 border-magenta/40 rounded-xl px-4 py-3 font-display text-2xl text-white tracking-widest uppercase focus:outline-none focus:border-magenta text-center"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleJoinOnlineRoom}
                  disabled={!inputCode.trim()}
                  className="w-full py-3.5 rounded-xl bg-magenta text-white font-bold text-sm font-display hover:bg-magenta/80 transition-all shadow-[var(--glow-magenta)] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>⚔️</span>
                  <span>{language === 'en' ? 'Join Room Duel ▸' : 'Masuk Room Duel ▸'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
