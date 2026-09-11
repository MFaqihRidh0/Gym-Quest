'use client';

import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  getActiveUser,
  signOutUser,
  syncCloudToLocal,
  syncLocalToCloud,
} from '@/modules/auth/syncManager';
import { getUserProfile } from '@/modules/program-engine/storage';
import { AuthModal } from './AuthModal';
import { soundEngine } from '@/modules/game-engine/audio';
import type { User } from '@supabase/supabase-js';

export function UserNavButton() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState(getUserProfile());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const isConfigured = isSupabaseConfigured();

  // Load user on mount
  useEffect(() => {
    let mounted = true;
    getActiveUser().then((u) => {
      if (mounted) {
        setUser(u);
        setProfile(getUserProfile());
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleAuthSuccess = (u: User) => {
    setUser(u);
    setProfile(getUserProfile());
  };

  const handleLogout = async () => {
    soundEngine.playCountdownTick();
    await signOutUser();
    setUser(null);
    setIsDropdownOpen(false);
    setSyncToast('Berhasil keluar akun.');
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleManualSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    soundEngine.playCountdownTick();
    const ok = await syncLocalToCloud(user.id);
    if (ok) {
      await syncCloudToLocal(user.id);
      setProfile(getUserProfile());
      soundEngine.playPoint();
      setSyncToast('Sinkronisasi cloud berhasil!');
    } else {
      setSyncToast('Gagal menyinkronkan data.');
    }
    setIsSyncing(false);
    setTimeout(() => setSyncToast(null), 3000);
  };

  return (
    <>
      {syncToast && (
        <div className="fixed top-16 right-5 z-50 bg-cyan text-void font-bold font-mono text-xs px-4 py-2 rounded-lg shadow-[0_0_20px_rgba(0,229,255,0.4)] animate-fade-in">
          ⚡ {syncToast}
        </div>
      )}

      {user ? (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan/30 bg-cyan/10 hover:border-cyan hover:bg-cyan/15 transition-all text-xs font-mono"
          >
            <span className="text-base">{profile.avatar || '⚔️'}</span>
            <span className="text-white font-bold max-w-[100px] truncate">
              {profile.username || user.email?.split('@')[0] || 'Knight'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isConfigured ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-500'
              }`}
              title={isConfigured ? 'Tersambung ke Supabase Cloud' : 'Mode Offline'}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 glass-panel clip-corner border-white/20 bg-[#070c1e]/98 p-3 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50 space-y-3">
              <div className="border-b border-white/10 pb-2">
                <div className="text-[10px] font-mono text-muted uppercase">Akun Masuk</div>
                <div className="text-xs font-bold text-white truncate">{user.email}</div>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-cyan">
                  <span>Level: {profile.level}</span>
                  <span>•</span>
                  <span>🔥 {profile.streakDays}h</span>
                </div>
              </div>

              <div className="space-y-1 text-xs font-mono">
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/5 text-white flex items-center justify-between transition-colors disabled:opacity-50"
                >
                  <span>{isSyncing ? 'Menyinkronkan…' : 'Sinkronkan Cloud'}</span>
                  <span>🔄</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-rose-500/10 text-rose-400 flex items-center justify-between transition-colors"
                >
                  <span>Keluar Akun</span>
                  <span>🚪</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => {
            soundEngine.playCountdownTick();
            setShowAuthModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 hover:border-cyan hover:text-cyan text-white transition-colors text-xs font-mono"
        >
          <span>👤</span>
          <span>Masuk / Daftar</span>
        </button>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
