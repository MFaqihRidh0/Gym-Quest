'use client';

import React, { useState } from 'react';
import type { FitnessGoal, FitnessLevel, SessionDuration, UserProfile } from '@/modules/program-engine/types';
import { saveUserProfile } from '@/modules/program-engine/storage';

interface OnboardingModalProps {
  initialProfile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (updated: UserProfile) => void;
}

export function OnboardingModal({ initialProfile, isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [level, setLevel] = useState<FitnessLevel>(initialProfile.level || 'pemula');
  const [goal, setGoal] = useState<FitnessGoal>(initialProfile.goal || 'otot');
  const [duration, setDuration] = useState<SessionDuration>(initialProfile.targetDurationMinutes || 15);

  if (!isOpen) return null;

  const handleFinish = () => {
    const updated: UserProfile = {
      ...initialProfile,
      level,
      goal,
      targetDurationMinutes: duration,
      hasCompletedOnboarding: true,
    };
    saveUserProfile(updated);
    onComplete(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel clip-corner relative w-full max-w-lg border-cyan/40 p-6 sm:p-8 bg-void/95 shadow-[0_0_40px_rgba(0,229,255,0.15)]">
        {/* Progress indicator */}
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-cyan uppercase tracking-wider">
              Onboarding Profil
            </span>
            <span className="text-xs text-muted">· Langkah {step} dari 3</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-muted hover:text-white transition-colors"
          >
            Lewati ✕
          </button>
        </div>

        {/* STEP 1: LEVEL */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Apa level kebugaranmu?</h2>
              <p className="mt-1 text-sm text-muted">
                Kami akan menyesuaikan jumlah repetisi dan waktu istirahat agar sesuai dengan kemampuanmu.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                {
                  id: 'pemula',
                  title: 'Pemula (Beginner)',
                  desc: 'Baru mulai latihan fisik, butuh gerakan dasar yang aman dan ramah sendi.',
                },
                {
                  id: 'menengah',
                  title: 'Menengah (Intermediate)',
                  desc: 'Sudah terbiasa berolahraga 1-2 kali seminggu, siap untuk variasi gerakan.',
                },
                {
                  id: 'mahir',
                  title: 'Mahir (Advanced)',
                  desc: 'Mencari intensitas tinggi, repetisi padat, dan durasi istirahat minimal.',
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setLevel(item.id as FitnessLevel)}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                    level === item.id
                      ? 'border-cyan bg-cyan/10 shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                      : 'border-white/10 hover:border-white/30 bg-white/5'
                  }`}
                >
                  <div className="font-display font-semibold text-white flex items-center justify-between">
                    <span>{item.title}</span>
                    {level === item.id && <span className="text-cyan text-sm">● Terpilih</span>}
                  </div>
                  <p className="mt-1 text-xs text-muted leading-relaxed">{item.desc}</p>
                </button>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="clip-corner bg-cyan px-6 py-2.5 font-body text-sm font-semibold text-void hover:shadow-[var(--glow-cyan)] transition-shadow"
              >
                Lanjut ▸
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GOAL */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Apa target utamamu?</h2>
              <p className="mt-1 text-sm text-muted">
                Program harian akan diprioritaskan sesuai hasil yang paling ingin kamu capai.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                {
                  id: 'kurus',
                  title: 'Bakar Lemak & Kurus',
                  badge: '🔥 Cardio & Fat Loss',
                  desc: 'Dominan gerakan kardio dinamis untuk membakar kalori tinggi secara efisien.',
                },
                {
                  id: 'otot',
                  title: 'Bangun Otot & Kekuatan',
                  badge: '💪 Hypertrophy & Strength',
                  desc: 'Fokus gerakan tahanan tubuh seperti push-up, squat, dan core untuk kekencangan otot.',
                },
                {
                  id: 'stamina',
                  title: 'Tingkatkan Stamina & Fleksibilitas',
                  badge: '⚡ Endurance & Mobility',
                  desc: 'Meningkatkan kapasitas paru-paru, kebugaran kardiovaskular, dan kelenturan sendi.',
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setGoal(item.id as FitnessGoal)}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                    goal === item.id
                      ? 'border-magenta bg-magenta/10 shadow-[0_0_15px_rgba(255,61,154,0.25)]'
                      : 'border-white/10 hover:border-white/30 bg-white/5'
                  }`}
                >
                  <div className="font-display font-semibold text-white flex items-center justify-between">
                    <span>{item.title}</span>
                    <span className="text-[10px] font-mono uppercase text-magenta px-2 py-0.5 rounded bg-magenta/20">
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted leading-relaxed">{item.desc}</p>
                </button>
              ))}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 font-body text-sm text-muted hover:text-white transition-colors"
              >
                ◂ Kembali
              </button>
              <button
                onClick={() => setStep(3)}
                className="clip-corner bg-cyan px-6 py-2.5 font-body text-sm font-semibold text-void hover:shadow-[var(--glow-cyan)] transition-shadow"
              >
                Lanjut ▸
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DURATION */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Berapa lama waktu per sesi?</h2>
              <p className="mt-1 text-sm text-muted">
                Pilih durasi yang paling realistis untuk kamu jalani secara konsisten setiap hari di rumah.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { min: 10, label: '10 Menit', subtitle: 'Kilat & Padat' },
                { min: 15, label: '15 Menit', subtitle: 'Paling Ideal' },
                { min: 20, label: '20 Menit', subtitle: 'Maksimal' },
              ].map((item) => (
                <button
                  key={item.min}
                  onClick={() => setDuration(item.min as SessionDuration)}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    duration === item.min
                      ? 'border-cyan bg-cyan/15 shadow-[0_0_15px_rgba(0,229,255,0.3)] text-white'
                      : 'border-white/10 hover:border-white/30 bg-white/5 text-muted'
                  }`}
                >
                  <div className="font-display text-xl font-bold">{item.min}m</div>
                  <div className="text-[11px] font-mono mt-1 text-cyan">{item.subtitle}</div>
                </button>
              ))}
            </div>

            <div className="rounded-lg bg-white/5 border border-white/10 p-3 mt-4 text-xs text-muted flex items-start gap-2.5">
              <span className="text-cyan text-base">ℹ</span>
              <span>
                Pengaturan ini dapat kamu ubah kapan saja di halaman profil/program. GymQuest akan merekomendasikan program latihan yang cocok dengan pilihanmu.
              </span>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 font-body text-sm text-muted hover:text-white transition-colors"
              >
                ◂ Kembali
              </button>
              <button
                onClick={handleFinish}
                className="clip-corner bg-gradient-to-r from-cyan to-magenta px-7 py-2.5 font-body text-sm font-bold text-void hover:opacity-90 transition-opacity"
              >
                Selesai & Mulai Latihan ▸
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
