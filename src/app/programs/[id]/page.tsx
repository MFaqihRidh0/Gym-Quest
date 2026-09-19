'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DEFAULT_PROGRAMS } from '@/modules/program-engine/defaultPrograms';
import { deleteCustomProgram, getCustomPrograms } from '@/modules/program-engine/storage';
import type { WorkoutProgram } from '@/modules/program-engine/types';
import { ExerciseVisual } from '@/components/ExerciseVisual';
import { GymQuestLogo } from '@/components/GymQuestLogo';
import { AppNavbar } from '@/components/AppNavbar';
import {
  useLanguage,
  getLocalizedProgram,
  getLocalizedExerciseCatalog,
  getLocalizedLevel,
  getLocalizedGoal,
} from '@/modules/i18n';
import { IconTimer, IconPlay } from '@/components/ui/CyberIcons';

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;
  const { t, language } = useLanguage();
  const localizedCatalog = getLocalizedExerciseCatalog(language);

  const [rawProgram, setRawProgram] = useState<WorkoutProgram | null>(null);

  useEffect(() => {
    if (!programId) return;
    const defaults = DEFAULT_PROGRAMS.find((p) => p.id === programId);
    if (defaults) {
      setRawProgram(defaults);
    } else {
      const customs = getCustomPrograms();
      const customFound = customs.find((p) => p.id === programId);
      if (customFound) setRawProgram(customFound);
    }
  }, [programId]);

  const program = rawProgram ? getLocalizedProgram(rawProgram, language) : null;

  if (!program) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-transparent text-primary p-5">
        <div className="text-center space-y-3">
          <p className="font-mono text-sm text-muted">{t.programs.notFoundOrLoading}</p>
          <Link href="/programs" className="text-xs text-cyan hover:underline">
            ← {t.programs.backToProgramList}
          </Link>
        </div>
      </main>
    );
  }

  const handleDelete = () => {
    if (confirm(`${t.programs.confirmDelete} "${program.title}"?`)) {
      deleteCustomProgram(program.id);
      router.push('/programs');
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-transparent text-primary pb-16 overflow-x-hidden">
      {/* HEADER */}
      <AppNavbar
        activePage="programs"
        subtitle={`· ${t.programs.detail}`}
      />

      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* TOMBOL KEMBALI KE DAFTAR PROGRAM */}
        <div>
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/15 hover:bg-cyan/10 hover:border-cyan/40 hover:text-cyan text-muted transition-all duration-200 text-xs font-mono tracking-wide backdrop-blur-sm shadow-sm group"
          >
            <span className="text-base group-hover:-translate-x-1 transition-transform">←</span>
            <span>{t.programs.backToProgramList}</span>
          </Link>
        </div>

        {/* PROGRAM HERO */}
        <div className="glass-panel clip-corner border-white/15 p-5 sm:p-8 relative overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded uppercase tracking-wider bg-cyan/15 text-cyan border border-cyan/40">
              {program.badge}
            </span>
            <span className="text-xs font-mono text-muted">{t.common.level}: {getLocalizedLevel(program.level, language).toUpperCase()}</span>
            <span className="text-xs font-mono text-muted">· Target: {getLocalizedGoal(program.goal, language).toUpperCase()}</span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl font-bold text-white mb-3">
            {program.title}
          </h1>
          <p className="text-sm text-muted max-w-2xl leading-relaxed mb-6">
            {program.description}
          </p>

          <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4 max-w-md">
            <div>
              <div className="text-xs text-muted font-mono">{t.programs.estimatedDuration}</div>
              <div className="text-lg font-bold text-cyan mt-0.5">{program.estimatedMinutes} {t.common.minutes}</div>
            </div>
            <div>
              <div className="text-xs text-muted font-mono">{t.programs.exerciseCount}</div>
              <div className="text-lg font-bold text-white mt-0.5">{program.exercises.length} {t.programs.exerciseCount}</div>
            </div>
            <div>
              <div className="text-xs text-muted font-mono">{t.programs.equipmentLabel}</div>
              <div className="text-lg font-bold text-magenta mt-0.5">{t.programs.noEquipment}</div>
            </div>
          </div>

          {/* ACTION BUTTONS (Start Workout & Delete) */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
            <Link
              href={`/workout?programId=${program.id}`}
              className="clip-corner bg-cyan px-6 py-2.5 font-body text-xs font-bold text-void hover:shadow-[var(--glow-cyan)] transition-shadow inline-flex items-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.4)]"
            >
              <span>{t.common.start}</span>
              <IconPlay size={12} className="fill-current" />
            </Link>
            {program.isCustom && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 hover:bg-red-500/20 font-mono transition-colors"
              >
                {t.programs.deleteProgram}
              </button>
            )}
          </div>
        </div>

        {/* EXERCISE LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-white">{t.programs.sequenceOrder}</h2>
            <span className="text-xs font-mono text-muted">{program.exercises.length} {t.programs.plannedExercises}</span>
          </div>

          <div className="space-y-4">
            {program.exercises.map((ref, idx) => {
              const item = localizedCatalog[ref.exerciseId];
              if (!item) return null;

              return (
                <div
                  key={`${ref.exerciseId}-${idx}`}
                  className="glass-panel clip-corner border-white/10 p-5 sm:p-6 transition-all hover:border-white/20 flex flex-col md:flex-row gap-5 items-start"
                >
                  {/* Visual Preview */}
                  <div className="w-full md:w-48 shrink-0">
                    <ExerciseVisual visualKey={item.visualKey} className="w-full h-36" isAnimated={false} showControls={false} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-cyan">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <h3 className="font-display text-lg font-bold text-white">{item.name}</h3>
                      </div>

                      {item.supportedAiCode ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan/15 text-cyan border border-cyan/30">
                          <span>◉</span> {t.programs.autoRepCountingReady}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-muted border border-white/10">
                          <IconTimer size={11} className="text-cyan" />
                          <span>{t.programs.guidedTimer}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted leading-relaxed">{item.description}</p>

                    {/* Sets, Reps & Rest badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white font-semibold">
                        {ref.sets} {t.common.sets}
                      </span>
                      {ref.reps ? (
                        <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 text-cyan font-semibold">
                          {ref.reps} {t.programs.repsPerSet}
                        </span>
                      ) : (
                        <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 text-cyan font-semibold">
                          {ref.durationSeconds} {t.programs.secondsPerSet}
                        </span>
                      )}
                      {ref.restSeconds > 0 && (
                        <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 text-muted">
                          {t.programs.restSeconds} {ref.restSeconds}s
                        </span>
                      )}
                    </div>

                    {/* Target Muscles */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.targetMuscles.map((m) => (
                        <span key={m} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-muted">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div className="glass-panel clip-corner border-cyan/40 bg-gradient-to-r from-cyan/15 to-magenta/15 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-white">{t.programs.readyToStart}</h3>
            <p className="text-xs text-muted">
              {t.programs.readyToStartDesc}
            </p>
          </div>
          <Link
            href={`/workout?programId=${program.id}`}
            className="clip-corner bg-gradient-to-r from-cyan to-magenta px-8 py-3 font-body text-sm font-bold text-void hover:shadow-[var(--glow-cyan)] transition-shadow shrink-0"
          >
            {t.programs.startSessionNow}
          </Link>
        </div>
      </div>
    </main>
  );
}
