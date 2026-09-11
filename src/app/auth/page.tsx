'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { signInUser, signUpUser, getActiveUser } from '@/modules/auth/syncManager';
import { soundEngine } from '@/modules/game-engine/audio';
import {
  IconBolt,
  IconShield,
  IconCrown,
  IconCombat,
  IconLock,
  IconTrophy,
  IconDumbbell,
} from '@/components/ui/CyberIcons';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const redirectTarget = searchParams.get('redirect') || '/';

  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isConfigured = isSupabaseConfigured();

  // Kriteria Validasi Kata Sandi Real-time
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);
  const isPasswordStrong = hasMinLength && hasUpperCase && hasSymbol;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Jika sudah login, redirect langsung
  useEffect(() => {
    getActiveUser().then((user) => {
      if (user) {
        router.push(redirectTarget);
      }
    });
  }, [router, redirectTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Harap isi alamat email dan kata sandi.');
      return;
    }

    if (tab === 'register') {
      if (!hasMinLength) {
        setErrorMsg('Kata sandi harus terdiri dari minimal 8 karakter.');
        return;
      }
      if (!hasUpperCase) {
        setErrorMsg('Kata sandi harus mengandung minimal 1 huruf besar (A-Z).');
        return;
      }
      if (!hasSymbol) {
        setErrorMsg('Kata sandi harus mengandung minimal 1 karakter simbol khusus (misal: !@#$%^&*).');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.');
        return;
      }
    } else {
      if (password.length < 6) {
        setErrorMsg('Kata sandi minimal terdiri dari 6 karakter.');
        return;
      }
    }

    setLoading(true);

    if (tab === 'login') {
      const { user, error } = await signInUser(email, password);
      setLoading(false);

      if (error) {
        setErrorMsg(error);
      } else if (user) {
        soundEngine.playPoint();
        setSuccessMsg('Berhasil masuk! Menyinkronkan data cloud...');
        setTimeout(() => {
          router.push(redirectTarget);
        }, 800);
      }
    } else {
      const { user, error } = await signUpUser(email, password, username || 'Knight-01');
      setLoading(false);

      if (error) {
        setErrorMsg(error);
      } else if (user) {
        soundEngine.playPoint();
        setSuccessMsg('Pendaftaran berhasil! Selamat datang di GymQuest.');
        setTimeout(() => {
          router.push(redirectTarget);
        }, 1000);
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* TOP NAVIGATION / TOMBOL KEMBALI */}
      <div className="flex items-center justify-between">
        <Link
          href={redirectTarget === '/' ? '/' : redirectTarget}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:border-cyan hover:bg-cyan/10 text-xs font-mono text-muted hover:text-white transition-all group shadow-sm"
        >
          <span className="text-base group-hover:-translate-x-1 transition-transform">←</span>
          <span>Kembali ke Beranda</span>
        </Link>

        {/* ONLINE/OFFLINE CLOUD PILL */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono ${
            isConfigured
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'
            }`}
          />
          <span>{isConfigured ? 'Supabase Cloud Online' : 'Mode Offline Lokal'}</span>
        </div>
      </div>

      {/* MAIN AUTH CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-white/10 bg-[#070c1e]/90 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        {/* LEFT COLUMN: BRANDING & PERKS SHOWCASE */}
        <div className="lg:col-span-5 p-8 sm:p-10 bg-gradient-to-br from-cyan/15 via-void to-magenta/15 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between space-y-8 relative overflow-hidden">
          {/* AMBIENT GLOW */}
          <div className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 bg-cyan/20 blur-3xl rounded-full" />
          <div className="pointer-events-none absolute -bottom-12 -right-12 w-48 h-48 bg-magenta/20 blur-3xl rounded-full" />

          <div className="space-y-4 relative z-10">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan via-blue-600 to-magenta p-0.5 shadow-[0_0_20px_rgba(0,229,255,0.4)] group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-void rounded-[10px] flex items-center justify-center">
                  <IconBolt size={24} className="text-cyan" glow />
                </div>
              </div>
              <div>
                <div className="font-display font-black text-2xl tracking-wider bg-gradient-to-r from-white via-cyan to-magenta bg-clip-text text-transparent">
                  GYMQUEST
                </div>
                <div className="font-mono text-[9px] tracking-widest text-muted uppercase">
                  CYBER-FITNESS RPG
                </div>
              </div>
            </Link>

            <div className="space-y-1.5 pt-2">
              <h2 className="font-display text-2xl font-bold text-white leading-tight">
                {tab === 'login' ? 'Selamat Datang Kembali!' : 'Mulai Petualangan Kebugaranmu'}
              </h2>
              <p className="text-xs text-muted leading-relaxed font-body">
                Sinkronkan rekor repetisi, streak harian, dan pertarungan Arena Mode ke akun cloud kamu.
              </p>
            </div>
          </div>

          {/* PERKS LIST */}
          <div className="space-y-3 relative z-10 text-xs font-mono">
            <div className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.03]">
              <div className="p-1.5 rounded-lg bg-cyan/15 border border-cyan/30 text-cyan shrink-0">
                <IconCombat size={16} glow />
              </div>
              <div>
                <div className="font-bold text-white">Akses Penuh Arena Mode</div>
                <div className="text-[11px] text-muted">Duel push-up 1v1 Kamehameha Clash & mini-game</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.03]">
              <div className="p-1.5 rounded-lg bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 shrink-0">
                <IconCrown size={16} glow />
              </div>
              <div>
                <div className="font-bold text-white">5 Kasta Liga Global</div>
                <div className="text-[11px] text-muted">Naik peringkat dari Iron ke Titan Colossus</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.03]">
              <div className="p-1.5 rounded-lg bg-emerald-400/15 border border-emerald-400/30 text-emerald-400 shrink-0">
                <IconShield size={16} glow />
              </div>
              <div>
                <div className="font-bold text-white">100% Aman & Terenkripsi</div>
                <div className="text-[11px] text-muted">Kamera diproses lokal di browser. Database diamankan Row Level Security (RLS).</div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-cyan/20 bg-cyan/5 relative z-10 space-y-1">
            <div className="flex items-center gap-2 text-cyan font-bold text-xs font-mono">
              <IconShield size={14} />
              <span>Standar Keamanan Data Pengguna</span>
            </div>
            <p className="text-[11px] text-muted font-body leading-relaxed">
              Kata sandi Anda diamankan dengan enkripsi hash Bcrypt. Kamera AI MediaPipe berjalan sepenuhnya di perangkat lokal Anda tanpa pernah mengunggah rekaman video ke server.
            </p>
          </div>

          <div className="text-[11px] font-mono text-muted/80 relative z-10 border-t border-white/10 pt-4">
            Karya Mahasiswa Tim <strong>Semoga Kami Beruntung</strong>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE AUTH FORM */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center space-y-6">
          {/* TAB SELECTOR: LOGIN VS REGISTER */}
          <div className="grid grid-cols-2 gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
                soundEngine.playCountdownTick();
              }}
              className={`py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                tab === 'login'
                  ? 'bg-cyan text-void shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'text-muted hover:text-white'
              }`}
            >
              <IconLock size={14} className={tab === 'login' ? 'text-void' : 'text-cyan'} />
              <span>Masuk (Login)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMsg(null);
                setSuccessMsg(null);
                soundEngine.playCountdownTick();
              }}
              className={`py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                tab === 'register'
                  ? 'bg-magenta text-white shadow-[0_0_15px_rgba(255,0,122,0.4)]'
                  : 'text-muted hover:text-white'
              }`}
            >
              <IconCrown size={14} className={tab === 'register' ? 'text-white' : 'text-magenta'} />
              <span>Daftar Akun Baru</span>
            </button>
          </div>

          {/* ERROR ALERT */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs text-rose-300 font-mono flex items-start gap-2 animate-shake">
              <span className="text-rose-400 font-bold shrink-0">✕</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SUCCESS ALERT */}
          {successMsg && (
            <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs text-emerald-300 font-mono flex items-start gap-2 animate-fade-in">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* USERNAME (HANYA MUNCUL DI TAB REGISTER) */}
            {tab === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-muted uppercase tracking-wider">
                  Nama Panggilan / Gamertag
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="misal: PendekarPushUp"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-magenta focus:outline-none focus:ring-1 focus:ring-magenta font-body transition-all"
                  />
                  <span className="absolute right-3.5 top-3.5 text-muted pointer-events-none text-xs">
                    🏷️
                  </span>
                </div>
              </div>
            )}

            {/* EMAIL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-muted uppercase tracking-wider">
                Alamat Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan font-body transition-all"
                />
                <span className="absolute right-3.5 top-3.5 text-muted pointer-events-none text-xs">
                  ✉️
                </span>
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono text-muted uppercase tracking-wider">
                  Kata Sandi
                </label>
                {tab === 'register' ? (
                  <span className="text-[10px] font-mono text-magenta">Min 8 karakter, 1 huruf besar, 1 simbol</span>
                ) : (
                  <span className="text-[10px] font-mono text-muted">Minimal 6 karakter</span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none font-mono transition-all pr-16 ${
                    tab === 'register' && password
                      ? isPasswordStrong
                        ? 'border-emerald-500/60 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                        : 'border-white/15 focus:border-cyan focus:ring-1 focus:ring-cyan'
                      : 'border-white/15 focus:border-cyan focus:ring-1 focus:ring-cyan'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-muted hover:text-white text-xs font-mono transition-colors"
                >
                  {showPassword ? 'Sembunyi' : 'Lihat'}
                </button>
              </div>

              {/* REALTIME REQUIREMENTS & STRENGTH INDICATOR (REGISTER TAB) */}
              {tab === 'register' && (
                <div className="space-y-2 pt-1">
                  {/* STRENGTH PROGRESS BAR */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-muted">Kekuatan Kata Sandi:</span>
                      <span
                        className={`font-bold ${
                          !password
                            ? 'text-muted'
                            : isPasswordStrong
                              ? 'text-emerald-400'
                              : (hasMinLength ? 1 : 0) + (hasUpperCase ? 1 : 0) + (hasSymbol ? 1 : 0) >= 2
                                ? 'text-amber-400'
                                : 'text-rose-400'
                        }`}
                      >
                        {!password
                          ? 'Belum diisi'
                          : isPasswordStrong
                            ? 'Kuat & Aman ✓'
                            : (hasMinLength ? 1 : 0) + (hasUpperCase ? 1 : 0) + (hasSymbol ? 1 : 0) >= 2
                              ? 'Sedang'
                              : 'Lemah'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full flex-1 rounded-full transition-all ${
                          hasMinLength
                            ? 'bg-emerald-400'
                            : password.length > 0
                              ? 'bg-rose-500'
                              : 'bg-transparent'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 rounded-full transition-all ${
                          hasUpperCase
                            ? 'bg-emerald-400'
                            : password.length > 0
                              ? 'bg-white/10'
                              : 'bg-transparent'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 rounded-full transition-all ${
                          hasSymbol
                            ? 'bg-emerald-400'
                            : password.length > 0
                              ? 'bg-white/10'
                              : 'bg-transparent'
                        }`}
                      />
                    </div>
                  </div>

                  {/* CHECKLIST RULES */}
                  <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] grid grid-cols-1 gap-1.5 text-[11px] font-mono">
                    <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-400 font-bold' : 'text-muted'}`}>
                      <span>{hasMinLength ? '✓' : '○'}</span>
                      <span>Minimal 8 karakter {password.length > 0 && `(${password.length}/8)`}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${hasUpperCase ? 'text-emerald-400 font-bold' : 'text-muted'}`}>
                      <span>{hasUpperCase ? '✓' : '○'}</span>
                      <span>Minimal 1 huruf besar (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-2 ${hasSymbol ? 'text-emerald-400 font-bold' : 'text-muted'}`}>
                      <span>{hasSymbol ? '✓' : '○'}</span>
                      <span>Minimal 1 simbol khusus (!@#$%^&*...)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CONFIRM PASSWORD (HANYA DI TAB REGISTER) */}
            {tab === 'register' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono text-muted uppercase tracking-wider">
                    Ulangi Kata Sandi
                  </label>
                  {confirmPassword && (
                    <span
                      className={`text-[10px] font-mono ${
                        passwordsMatch ? 'text-emerald-400 font-bold' : 'text-rose-400'
                      }`}
                    >
                      {passwordsMatch ? '✓ Cocok' : '✕ Tidak Cocok'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi"
                    required
                    className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none font-mono transition-all pr-16 ${
                      confirmPassword
                        ? passwordsMatch
                          ? 'border-emerald-500/60 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                          : 'border-rose-500/60 focus:border-rose-400 focus:ring-1 focus:ring-rose-400'
                        : 'border-white/15 focus:border-magenta focus:ring-1 focus:ring-magenta'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-muted hover:text-white text-xs font-mono transition-colors"
                  >
                    {showConfirmPassword ? 'Sembunyi' : 'Lihat'}
                  </button>
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full clip-corner py-3.5 font-display font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 mt-2 ${
                tab === 'login'
                  ? 'bg-cyan hover:bg-cyan/90 text-void shadow-[0_0_25px_rgba(0,229,255,0.4)]'
                  : 'bg-magenta hover:bg-magenta/90 text-white shadow-[0_0_25px_rgba(255,0,122,0.4)]'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  <span>Memproses...</span>
                </span>
              ) : tab === 'login' ? (
                <>
                  <span>Masuk ke Akun</span>
                  <IconBolt size={16} className="text-void" />
                </>
              ) : (
                <>
                  <span>Daftarkan Akun Sekarang</span>
                  <IconCrown size={16} className="text-white" />
                </>
              )}
            </button>
          </form>

          {/* TOGGLE ALTERNATIVE */}
          <div className="pt-2 border-t border-white/10 text-center">
            {tab === 'login' ? (
              <p className="text-xs text-muted font-body">
                Belum memiliki akun GymQuest?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-magenta font-bold hover:underline font-mono ml-1"
                >
                  Daftar Sekarang →
                </button>
              </p>
            ) : (
              <p className="text-xs text-muted font-body">
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-cyan font-bold hover:underline font-mono ml-1"
                >
                  Masuk di Sini →
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <main className="min-h-screen flex flex-col justify-center px-4 py-12 bg-transparent text-primary relative overflow-hidden">
      {/* BACKGROUND ACCENTS */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[600px] h-[300px] bg-cyan/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-magenta/10 blur-[130px] rounded-full" />

      <Suspense
        fallback={
          <div className="mx-auto flex items-center justify-center p-12 text-sm font-mono text-muted animate-pulse">
            Memuat formulir autentikasi...
          </div>
        }
      >
        <AuthContent />
      </Suspense>
    </main>
  );
}
