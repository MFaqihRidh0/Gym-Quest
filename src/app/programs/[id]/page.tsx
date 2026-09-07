'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DEFAULT_PROGRAMS } from '@/modules/program-engine/defaultPrograms';
import { EXERCISE_CATALOG } from '@/modules/program-engine/exerciseCatalog';
import { deleteCustomProgram, getCustomPrograms } from '@/modules/program-engine/storage';
import type { WorkoutProgram } from '@/modules/program-engine/types';
import { ExerciseVisual } from '@/components/ExerciseVisual';

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;

  const [program, setProgram] = useState<WorkoutProgram | null>(null);

  useEffect(() => {
    if (!programId) return;
    const defaults = DEFAULT_PROGRAMS.find((p) => p.id === programId);
    if (defaults) {
      setProgram(defaults);
    } else {
      const customs = getCustomPrograms();
      const customFound = customs.find((p) => p.id === programId);
      if (customFound) setProgram(customFound);
    }
  }, [programId]);

  if (!program) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-void text-primary p-5">
        <div className="text-center space-y-3">
          <p className="font-mono text-sm text-muted">Program tidak ditemukan atau sedang dimuat…</p>
          <Link href="/programs" className="text-xs text-cyan hover:underline">
            ← Kembali ke daftar program
          </Link>
        </div>
      </main>
    );
  }

  const handleDelete = () => {
    if (confirm(`Hapus program kustom "${program.title}"?`)) {
      deleteCustomProgram(program.id);
      router.push('/programs');
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-void text-primary pb-16">
      {/* HEADER */}
      <header className="glass-panel sticky top-0 z-20 flex items-center justify-between border-x-0 border-t-0 px-5 py-3">
        <Link href="/programs" className="text-xs font-mono text-muted hover:text-cyan transition-colors">
          ← Kembali ke Program
        </Link>
        <div className="flex items-center gap-3">
          {program.isCustom && (
            <button
              onClick={handleDelete}
              className="text-xs text-red-400 hover:text-red-300 font-mono transition-colors"
            >
              Hapus Program
            </button>
          )}
          <Link
            href={`/workout?programId=${program.id}`}
            className="clip-corner bg-cyan px-4 py-1.5 font-body text-xs font-bold text-void hover:shadow-[var(--glow-cyan)] transition-shadow"
          >
            Mulai Latihan ▸
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-5 py-8 space-y-8">
        {/* PROGRAM HERO */}
        <div className="glass-panel clip-corner border-white/15 p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded uppercase tracking-wider bg-cyan/15 text-cyan border border-cyan/40">
              {program.badge}
            </span>
            <span className="text-xs font-mono text-muted">Level: {program.level.toUpperCase()}</span>
            <span className="text-xs font-mono text-muted">· Target: {program.goal.toUpperCase()}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
            {program.title}
          </h1>
          <p className="text-sm text-muted max-w-2xl leading-relaxed mb-6">
            {program.description}
          </p>

          <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4 max-w-md">
            <div>
              <div className="text-xs text-muted font-mono">Estimasi Waktu</div>
              <div className="text-lg font-bold text-cyan mt-0.5">{program.estimatedMinutes} Menit</div>
            </div>
            <div>
              <div className="text-xs text-muted font-mono">Total Gerakan</div>
              <div className="text-lg font-bold text-white mt-0.5">{program.exercises.length} Gerakan</div>
            </div>
            <div>
              <div className="text-xs text-muted font-mono">Peralatan</div>
              <div className="text-lg font-bold text-magenta mt-0.5">Tanpa Alat</div>
            </div>
          </div>
        </div>

        {/* EXERCISE LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-white">Urutan Rangkaian Gerakan</h2>
            <span className="text-xs font-mono text-muted">{program.exercises.length} Gerakan Terencana</span>
          </div>

          <div className="space-y-4">
            {program.exercises.map((ref, idx) => {
              const item = EXERCISE_CATALOG[ref.exerciseId];
              if (!item) return null;

              return (
                <div
                  key={`${ref.exerciseId}-${idx}`}
                  className="glass-panel clip-corner border-white/10 p-5 sm:p-6 transition-all hover:border-white/20 flex flex-col md:flex-row gap-5 items-start"
                >
                  {/* Visual Preview */}
                  <div className="w-full md:w-48 shrink-0">
                    <ExerciseVisual visualKey={item.visualKey} className="w-full h-36" isAnimated={false} />
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
                          <span>◉</span> AI Rep Counting Siap
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-muted border border-white/10">
                          ⏱ Timer Terpandu
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted leading-relaxed">{item.description}</p>

                    {/* Sets, Reps & Rest badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white font-semibold">
                        {ref.sets} Set
                      </span>
                      {ref.reps ? (
                        <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 text-cyan font-semibold">
                          {ref.reps} Repetisi / Set
                        </span>
                      ) : (
                        <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 text-cyan font-semibold">
                          {ref.durationSeconds} Detik / Set
                        </span>
                      )}
                      {ref.restSeconds > 0 && (
                        <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 text-muted">
                          Istirahat {ref.restSeconds}s
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
            <h3 className="font-display text-lg font-bold text-white">Siap untuk memulai sesi ini?</h3>
            <p className="text-xs text-muted">
              Siapkan air minum dan ruang bergerak selebar rentangan tanganmu.
            </p>
          </div>
          <Link
            href={`/workout?programId=${program.id}`}
            className="clip-corner bg-gradient-to-r from-cyan to-magenta px-8 py-3 font-body text-sm font-bold text-void hover:shadow-[var(--glow-cyan)] transition-shadow shrink-0"
          >
            Mulai Sesi Latihan Sekarang ▸
          </Link>
        </div>
      </div>
    </main>
  );
}
