'use client';

import React, { useState } from 'react';
import { EXERCISE_ARRAY, EXERCISE_CATALOG } from '@/modules/program-engine/exerciseCatalog';
import { saveCustomProgram } from '@/modules/program-engine/storage';
import type { ProgramExerciseRef, WorkoutProgram } from '@/modules/program-engine/types';

interface CustomWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (program: WorkoutProgram) => void;
}

export function CustomWorkoutModal({ isOpen, onClose, onSaved }: CustomWorkoutModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>(['push_up', 'squat', 'plank']);
  const [configs, setConfigs] = useState<Record<string, { sets: number; reps?: number; duration?: number; rest: number }>>({
    push_up: { sets: 3, reps: 10, rest: 30 },
    squat: { sets: 3, reps: 12, rest: 25 },
    plank: { sets: 3, duration: 30, rest: 30 },
  });

  if (!isOpen) return null;

  const toggleExercise = (id: string) => {
    if (selectedExerciseIds.includes(id)) {
      if (selectedExerciseIds.length <= 1) return; // minimal 1
      setSelectedExerciseIds(selectedExerciseIds.filter((item) => item !== id));
    } else {
      setSelectedExerciseIds([...selectedExerciseIds, id]);
      if (!configs[id]) {
        const item = EXERCISE_CATALOG[id];
        setConfigs({
          ...configs,
          [id]: {
            sets: item?.defaultSets || 3,
            reps: item?.defaultReps || 10,
            duration: item?.defaultDurationSeconds || 30,
            rest: 25,
          },
        });
      }
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const exerciseRefs: ProgramExerciseRef[] = selectedExerciseIds.map((id) => {
      const cfg = configs[id] || { sets: 3, reps: 10, rest: 25 };
      const item = EXERCISE_CATALOG[id];
      return {
        exerciseId: id,
        sets: cfg.sets,
        reps: item.defaultReps ? cfg.reps : undefined,
        durationSeconds: item.defaultDurationSeconds ? cfg.duration : undefined,
        restSeconds: cfg.rest,
      };
    });

    const estMinutes = Math.max(5, Math.round(exerciseRefs.length * 3.2));

    const program: WorkoutProgram = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Program kustom yang dibuat sendiri tanpa alat.',
      category: 'custom',
      level: 'menengah',
      goal: 'otot',
      badge: 'Rutinitas Mandiri',
      estimatedMinutes: estMinutes,
      exercises: exerciseRefs,
      isCustom: true,
    };

    saveCustomProgram(program);
    onSaved(program);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel clip-corner my-8 w-full max-w-2xl border-magenta/40 p-6 sm:p-8 bg-void/95 shadow-[0_0_40px_rgba(255,61,154,0.15)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              Custom Workout Builder
            </h2>
            <p className="text-xs text-muted mt-0.5">Rancang rutinitas latihan rumahan sesuai preferensimu</p>
          </div>
          <button onClick={onClose} className="text-sm font-mono text-muted hover:text-white transition-colors">
            ✕ Tutup
          </button>
        </div>

        <div className="space-y-5 pt-4">
          {/* Judul & Deskripsi */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-cyan mb-1.5">
              Nama Program *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Morning Power Burn, Latihan Dada & Paha..."
              className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5">
              Deskripsi Singkat
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan tujuan atau fokus latihan..."
              className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan focus:outline-none"
            />
          </div>

          {/* Pilih Gerakan */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-magenta mb-2">
              Pilih Gerakan ({selectedExerciseIds.length} Terpilih)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {EXERCISE_ARRAY.map((ex) => {
                const selected = selectedExerciseIds.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => toggleExercise(ex.id)}
                    className={`text-left p-2.5 rounded border text-xs transition-all ${
                      selected
                        ? 'border-magenta bg-magenta/15 text-white font-medium'
                        : 'border-white/10 bg-white/5 text-muted hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{ex.name}</span>
                      {selected && <span className="text-magenta font-bold">✓</span>}
                    </div>
                    <span className="text-[10px] text-muted capitalize block mt-0.5">{ex.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Konfigurasi Per Gerakan Terpilih */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-cyan mb-2">
              Atur Repetisi / Durasi & Istirahat
            </label>
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {selectedExerciseIds.map((id) => {
                const item = EXERCISE_CATALOG[id];
                if (!item) return null;
                const cfg = configs[id] || { sets: 3, reps: 10, rest: 25 };

                return (
                  <div
                    key={id}
                    className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg border border-white/10 bg-white/5 text-xs"
                  >
                    <span className="font-semibold text-white min-w-[120px]">{item.name}</span>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted">Set:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={cfg.sets}
                          onChange={(e) =>
                            setConfigs({
                              ...configs,
                              [id]: { ...cfg, sets: Math.max(1, parseInt(e.target.value) || 1) },
                            })
                          }
                          className="w-12 rounded border border-white/15 bg-black/40 px-1.5 py-1 text-center text-white"
                        />
                      </div>

                      {item.defaultReps ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted">Rep:</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={cfg.reps || 10}
                            onChange={(e) =>
                              setConfigs({
                                ...configs,
                                [id]: { ...cfg, reps: Math.max(1, parseInt(e.target.value) || 1) },
                              })
                            }
                            className="w-14 rounded border border-white/15 bg-black/40 px-1.5 py-1 text-center text-white"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted">Detik:</span>
                          <input
                            type="number"
                            min="5"
                            max="300"
                            step="5"
                            value={cfg.duration || 30}
                            onChange={(e) =>
                              setConfigs({
                                ...configs,
                                [id]: { ...cfg, duration: Math.max(5, parseInt(e.target.value) || 5) },
                              })
                            }
                            className="w-14 rounded border border-white/15 bg-black/40 px-1.5 py-1 text-center text-white"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <span className="text-muted">Jeda:</span>
                        <input
                          type="number"
                          min="5"
                          max="120"
                          step="5"
                          value={cfg.rest}
                          onChange={(e) =>
                            setConfigs({
                              ...configs,
                              [id]: { ...cfg, rest: Math.max(5, parseInt(e.target.value) || 5) },
                            })
                          }
                          className="w-14 rounded border border-white/15 bg-black/40 px-1.5 py-1 text-center text-white"
                        />
                        <span className="text-muted">s</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-body text-sm text-muted hover:text-white transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            className="clip-corner bg-magenta px-6 py-2.5 font-body text-sm font-semibold text-void hover:shadow-[var(--glow-magenta)] transition-shadow disabled:opacity-40"
          >
            Simpan Program ▸
          </button>
        </div>
      </div>
    </div>
  );
}
