'use client';

import React, { useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { signInUser, signUpUser } from '@/modules/auth/syncManager';
import { soundEngine } from '@/modules/game-engine/audio';
import type { User } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Harap isi alamat email dan kata sandi.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal terdiri dari 6 karakter.');
      return;
    }

    setLoading(true);

    if (tab === 'login') {
      const { user, error } = await signInUser(email, password);
      setLoading(false);

      if (error) {
        setErrorMsg(error);
      } else if (user) {
        soundEngine.playPoint();
        setSuccessMsg('Berhasil masuk! Data cloud sedang disinkronkan.');
        setTimeout(() => {
          onSuccess(user);
          onClose();
        }, 1000);
      }
    } else {
      const { user, error } = await signUpUser(email, password, username || 'Knight-01');
      setLoading(false);

      if (error) {
        setErrorMsg(error);
      } else if (user) {
        soundEngine.playPoint();
        setSuccessMsg('Akun berhasil didaftarkan! Selamat datang di GymQuest.');
        setTimeout(() => {
          onSuccess(user);
          onClose();
        }, 1200);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="glass-panel clip-corner w-full max-w-md border-cyan/40 bg-[#070c1e]/95 p-6 sm:p-8 space-y-6 shadow-[0_0_50px_rgba(0,229,255,0.2)]">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="font-display text-xl font-bold text-white tracking-wide">
                Akun GymQuest
              </h2>
              <p className="text-[11px] font-mono text-muted">Cloud Sync & Persistence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-muted hover:text-white hover:border-white/30 text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* STATUS BADGE SUPABASE */}
        {!isConfigured && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-yellow-400 font-mono">
              <span>⚠️</span>
              <span>Mode Offline Lokal Aktif</span>
            </div>
            <p className="text-muted text-[11px]">
              Kredensial Supabase di <code>.env.local</code> belum diisi URL & Anon Key aktif. Anda dapat memasukkan kredensial dari Supabase untuk mengaktifkan sinkronisasi cloud real-time.
            </p>
          </div>
        )}

        {/* TABS */}
        <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg font-bold transition-all ${
              tab === 'login'
                ? 'bg-cyan text-void shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'text-muted hover:text-white'
            }`}
          >
            Masuk (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg font-bold transition-all ${
              tab === 'register'
                ? 'bg-cyan text-void shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'text-muted hover:text-white'
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm font-body">
          {tab === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted uppercase">Username / Nama Panggilan</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: ShadowRonin, IronValkyrie"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-white placeholder-muted/50 focus:border-cyan focus:outline-none font-body text-xs"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted uppercase">Alamat Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-white placeholder-muted/50 focus:border-cyan focus:outline-none font-body text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted uppercase">Kata Sandi</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-white placeholder-muted/50 focus:border-cyan focus:outline-none font-body text-xs pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white text-xs"
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-mono">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              ✓ {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full clip-corner bg-gradient-to-r from-cyan to-magenta py-3 font-mono text-xs font-bold text-void hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {loading
              ? 'Memproses…'
              : tab === 'login'
                ? 'Masuk ke Akun ▸'
                : 'Buat Akun GymQuest ▸'}
          </button>
        </form>

        <p className="text-[11px] text-center text-muted">
          Dengan masuk, data latihan, streak, dan posisi liga akan otomatis tersinkronisasi lintas perangkat.
        </p>
      </div>
    </div>
  );
}
