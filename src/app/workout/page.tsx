'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_PROGRAMS } from '@/modules/program-engine/defaultPrograms';
import { EXERCISE_CATALOG } from '@/modules/program-engine/exerciseCatalog';
import { getCustomPrograms, recordWorkoutSession } from '@/modules/program-engine/storage';
import type { ExerciseItem, ProgramExerciseRef, WorkoutProgram, WorkoutSessionLog } from '@/modules/program-engine/types';
import { soundEngine } from '@/modules/game-engine/audio';
import { usePoseDetection } from '@/modules/cv-engine/usePoseDetection';
import { RepCounter, type RepCounterState } from '@/modules/rep-counter/repCounter';
import { drawBioScan } from '@/modules/cv-engine/drawBioScan';
import { ExerciseVisual } from '@/components/ExerciseVisual';

type WorkoutPhase = 'countdown' | 'work' | 'rest' | 'finished';

function WorkoutRunner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const programId = searchParams.get('programId') || 'full-body-starter';

  const [program, setProgram] = useState<WorkoutProgram | null>(null);

  // Index latihan & set
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<WorkoutPhase>('countdown');
  const [countdownSeconds, setCountdownSeconds] = useState(3);

  // Timer & Reps
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(25);
  const [repsDone, setRepsDone] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Mode: AI Camera vs Manual Timer
  const [mode, setMode] = useState<'ai_camera' | 'manual'>('manual');

  // Metrik sesi
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);
  const [totalRepsCompleted, setTotalRepsCompleted] = useState(0);
  const [estimatedCalories, setEstimatedCalories] = useState(0);

  // Selesai log
  const [finishedResult, setFinishedResult] = useState<{ log: WorkoutSessionLog; newStreak: number } | null>(null);

  // MediaPipe AI CV
  const { videoRef, liveLandmarksRef, status, start, stop } = usePoseDetection();
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const repCounterRef = useRef<RepCounter | null>(null);
  const lastRepStateRef = useRef<RepCounterState | null>(null);
  const [aiFormFeedback, setAiFormFeedback] = useState<string | null>(null);
  const [aiAngle, setAiAngle] = useState<number | null>(null);

  // Muat program
  useEffect(() => {
    const defaults = DEFAULT_PROGRAMS.find((p) => p.id === programId);
    if (defaults) {
      setProgram(defaults);
    } else {
      const customs = getCustomPrograms();
      const customFound = customs.find((p) => p.id === programId);
      if (customFound) setProgram(customFound);
    }
  }, [programId]);

  const currentExerciseRef: ProgramExerciseRef | undefined = program?.exercises[exerciseIndex];
  const currentExerciseItem: ExerciseItem | undefined = currentExerciseRef
    ? EXERCISE_CATALOG[currentExerciseRef.exerciseId]
    : undefined;

  // Inisialisasi AI Rep Counter saat gerakan berubah
  useEffect(() => {
    if (currentExerciseItem?.supportedAiCode) {
      repCounterRef.current = new RepCounter(currentExerciseItem.supportedAiCode);
    } else {
      repCounterRef.current = null;
    }
    setRepsDone(0);
  }, [exerciseIndex, currentExerciseItem]);

  // Handle kamera start/stop sesuai mode
  useEffect(() => {
    if (mode === 'ai_camera' && status === 'idle') {
      start();
    } else if (mode === 'manual' && status === 'running') {
      stop();
    }
  }, [mode, status, start, stop]);

  // Bersihkan saat unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // AI CV Pose loop
  useEffect(() => {
    if (mode !== 'ai_camera' || phase !== 'work' || isPaused) return;

    let raf = 0;
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const ctx = canvas?.getContext('2d');

    const loop = () => {
      if (canvas && video && ctx) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const landmarks = liveLandmarksRef.current;
        if (landmarks) {
          drawBioScan(ctx, landmarks, {
            width: canvas.width,
            height: canvas.height,
            sourceWidth: video.videoWidth || canvas.width,
            sourceHeight: video.videoHeight || canvas.height,
            mirrored: true,
            formOk: lastRepStateRef.current?.formOk ?? true,
          });

          if (repCounterRef.current && currentExerciseRef) {
            const state = repCounterRef.current.update(landmarks, performance.now());
            setAiAngle(state.angle);
            setAiFormFeedback(state.formMessage);

            // Cek repetisi baru
            const prevReps = lastRepStateRef.current?.reps || 0;
            if (state.reps > prevReps) {
              const diff = state.reps - prevReps;
              setRepsDone((r) => {
                const updated = r + diff;
                const targetReps = currentExerciseRef.reps || 10;
                if (updated >= targetReps) {
                  // Selesai target repetisi!
                  setTimeout(() => handleSetComplete(), 300);
                }
                return updated;
              });
              setTotalRepsCompleted((tr) => tr + diff);
              soundEngine.playPoint();
            }
            lastRepStateRef.current = state;
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode, phase, isPaused, currentExerciseRef, liveLandmarksRef, videoRef]);

  // TIMER UTAMA SESI
  useEffect(() => {
    if (phase === 'finished' || isPaused) return;
    const timer = setInterval(() => {
      setSessionElapsedSeconds((s) => s + 1);

      // Hitung estimasi kalori
      if (currentExerciseItem && phase === 'work') {
        const calPerSec = currentExerciseItem.caloriesPerMinute / 60;
        setEstimatedCalories((c) => c + calPerSec);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, isPaused, currentExerciseItem]);

  // COUNTDOWN 3, 2, 1 SEBELUM GERAKAN
  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdownSeconds > 0) {
      soundEngine.playBeep(false);
      const t = setTimeout(() => {
        setCountdownSeconds((c) => c - 1);
      }, 1000);
      return () => clearTimeout(t);
    } else {
      soundEngine.playBeep(true);
      setPhase('work');
      // Set initial duration jika latihan berbasis waktu
      if (currentExerciseRef?.durationSeconds) {
        setTimerSeconds(currentExerciseRef.durationSeconds);
      }
    }
  }, [phase, countdownSeconds, currentExerciseRef]);

  // COUNTDOWN WAKTU GERAKAN (Jika berbasis durasi)
  useEffect(() => {
    if (phase !== 'work' || isPaused || !currentExerciseRef?.durationSeconds) return;

    if (timerSeconds > 0) {
      const interval = setInterval(() => {
        setTimerSeconds((ts) => {
          if (ts <= 4 && ts > 1) {
            soundEngine.playBeep(false);
          } else if (ts === 1) {
            soundEngine.playBeep(true);
          }
          return ts - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      handleSetComplete();
    }
  }, [phase, isPaused, timerSeconds, currentExerciseRef]);

  // COUNTDOWN FASE ISTIRAHAT (REST INTERVAL)
  useEffect(() => {
    if (phase !== 'rest' || isPaused) return;

    if (restSecondsRemaining > 0) {
      const interval = setInterval(() => {
        setRestSecondsRemaining((r) => {
          if (r <= 4 && r > 1) {
            soundEngine.playBeep(false);
          } else if (r === 1) {
            soundEngine.playBeep(true);
          }
          return r - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      // Istirahat selesai, mulai set berikutnya
      handleStartNext();
    }
  }, [phase, isPaused, restSecondsRemaining]);

  // Fungsi saat 1 set selesai
  const handleSetComplete = () => {
    if (!program || !currentExerciseRef) return;
    soundEngine.playRestTransition();

    const isLastSetOfExercise = currentSet >= currentExerciseRef.sets;
    const isLastExercise = exerciseIndex >= program.exercises.length - 1;

    if (isLastSetOfExercise && isLastExercise) {
      // Seluruh workout selesai!
      finishWorkout();
    } else {
      // Masuk fase istirahat
      setPhase('rest');
      setRestSecondsRemaining(currentExerciseRef.restSeconds || 20);
    }
  };

  // Mulai set atau gerakan selanjutnya setelah istirahat
  const handleStartNext = () => {
    if (!program || !currentExerciseRef) return;

    if (currentSet < currentExerciseRef.sets) {
      // Lanjut ke set berikutnya pada gerakan yang sama
      setCurrentSet((s) => s + 1);
    } else {
      // Pindah ke gerakan berikutnya
      setExerciseIndex((i) => i + 1);
      setCurrentSet(1);
    }

    setRepsDone(0);
    if (repCounterRef.current) repCounterRef.current.reset();
    setCountdownSeconds(3);
    setPhase('countdown');
  };

  // Skip istirahat
  const handleSkipRest = () => {
    handleStartNext();
  };

  // Manual rep increment
  const handleManualAddRep = () => {
    setRepsDone((r) => {
      const next = r + 1;
      setTotalRepsCompleted((tr) => tr + 1);
      soundEngine.playPoint();
      const targetReps = currentExerciseRef?.reps || 10;
      if (next >= targetReps) {
        setTimeout(() => handleSetComplete(), 200);
      }
      return next;
    });
  };

  // Selesaikan dan simpan log sesi latihan
  const finishWorkout = () => {
    if (!program) return;
    setPhase('finished');
    soundEngine.playWorkoutComplete();

    const record = recordWorkoutSession({
      programId: program.id,
      programTitle: program.title,
      timestamp: Date.now(),
      durationSeconds: sessionElapsedSeconds,
      completedExercisesCount: program.exercises.length,
      totalExercisesCount: program.exercises.length,
      totalRepsCompleted,
      caloriesBurned: Math.round(estimatedCalories),
    });

    setFinishedResult(record);
  };

  if (!program) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-void text-primary p-5">
        <p className="font-mono text-sm text-muted">Memuat program latihan…</p>
      </main>
    );
  }

  // LAYAR SELESAI (CELEBRATION FINISHED)
  if (phase === 'finished' && finishedResult) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-void text-primary p-5">
        <div className="glass-panel clip-corner w-full max-w-lg border-cyan/50 p-8 text-center bg-void/95 space-y-6 shadow-[0_0_50px_rgba(0,229,255,0.2)]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan/20 border border-cyan/50 text-3xl">
            🏆
          </div>

          <div>
            <span className="text-xs font-mono tracking-widest text-cyan uppercase font-bold">
              Workout Completed!
            </span>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-white">
              Latihan Selesai!
            </h1>
            <p className="mt-2 text-sm text-muted">
              Kerja luar biasa! Kamu telah menuntaskan program <strong>{program.title}</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 border-y border-white/10">
            <div className="p-2">
              <div className="text-[11px] font-mono text-muted">Total Waktu</div>
              <div className="text-lg font-bold text-cyan mt-0.5">
                {Math.round(finishedResult.log.durationSeconds / 60)} Menit
              </div>
            </div>
            <div className="p-2">
              <div className="text-[11px] font-mono text-muted">Kalori</div>
              <div className="text-lg font-bold text-magenta mt-0.5">
                ~{finishedResult.log.caloriesBurned} kkal
              </div>
            </div>
            <div className="p-2">
              <div className="text-[11px] font-mono text-muted">Total Repetisi</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {finishedResult.log.totalRepsCompleted}
              </div>
            </div>
            <div className="p-2">
              <div className="text-[11px] font-mono text-muted">Streak Harian</div>
              <div className="text-lg font-bold text-yellow-400 mt-0.5">
                🔥 {finishedResult.newStreak} Hari
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/progress"
              className="flex-1 clip-corner bg-gradient-to-r from-cyan to-magenta py-3 font-body text-xs font-bold text-void hover:opacity-90 transition-opacity text-center"
            >
              Lihat Riwayat & Kalender ▸
            </Link>
            <Link
              href="/programs"
              className="flex-1 clip-corner border border-white/20 bg-white/5 py-3 font-body text-xs font-semibold text-white hover:border-white/40 transition-colors text-center"
            >
              Daftar Program
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // LAYAR ISTIRAHAT (REST INTERVAL)
  if (phase === 'rest') {
    const nextExerciseIndex =
      currentSet < (currentExerciseRef?.sets || 1) ? exerciseIndex : exerciseIndex + 1;
    const nextSet =
      currentSet < (currentExerciseRef?.sets || 1) ? currentSet + 1 : 1;
    const nextExerciseRef = program.exercises[nextExerciseIndex];
    const nextExerciseItem = nextExerciseRef ? EXERCISE_CATALOG[nextExerciseRef.exerciseId] : null;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-void text-primary p-5">
        <div className="glass-panel clip-corner w-full max-w-md border-magenta/40 p-8 text-center bg-void/95 space-y-6 shadow-[0_0_40px_rgba(255,61,154,0.15)]">
          <span className="text-xs font-mono uppercase tracking-widest text-magenta font-bold">
            Jeda Istirahat (Rest Interval)
          </span>

          <div className="relative flex items-center justify-center my-4">
            <div className="w-32 h-32 rounded-full border-4 border-magenta/30 border-t-magenta flex items-center justify-center animate-spin">
              <span className="text-transparent">.</span>
            </div>
            <div className="absolute font-display text-5xl font-bold text-white">
              {restSecondsRemaining}s
            </div>
          </div>

          <p className="text-xs text-muted">Tarik napas dalam, regangkan otot, dan minum air secukupnya.</p>

          {nextExerciseItem && (
            <div className="border-t border-white/10 pt-4 text-left">
              <span className="text-[10px] font-mono uppercase text-cyan block mb-1">
                Gerakan Selanjutnya (Up Next):
              </span>
              <div className="flex items-center justify-between">
                <span className="font-display text-base font-bold text-white">{nextExerciseItem.name}</span>
                <span className="text-xs font-mono text-muted">
                  Set {nextSet} dari {nextExerciseRef?.sets}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleSkipRest}
            className="w-full clip-corner bg-magenta py-3 font-body text-xs font-bold text-void hover:shadow-[var(--glow-magenta)] transition-all"
          >
            Lewati Istirahat ⏭
          </button>
        </div>
      </main>
    );
  }

  // LAYAR AKTIF WORKOUT
  return (
    <main className="min-h-screen flex flex-col bg-void text-primary">
      {/* HEADER HUD */}
      <header className="glass-panel sticky top-0 z-20 flex items-center justify-between border-x-0 border-t-0 px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/programs/${program.id}`} className="text-xs font-mono text-muted hover:text-white">
            ✕ Keluar
          </Link>
          <span className="text-xs text-muted">|</span>
          <span className="font-display text-sm font-bold text-white truncate max-w-[200px] sm:max-w-none">
            {program.title}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-5 text-xs font-mono">
          <span className="text-muted">
            ⏱ {Math.floor(sessionElapsedSeconds / 60)}:
            {String(sessionElapsedSeconds % 60).padStart(2, '0')}
          </span>
          <span className="text-magenta font-bold">~{Math.round(estimatedCalories)} kkal</span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="clip-corner border border-white/20 bg-white/5 px-2.5 py-1 text-[11px] text-white hover:border-cyan"
          >
            {isPaused ? '▶ Lanjut' : '❚❚ Jeda'}
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6 flex flex-col justify-between space-y-6">
        {/* PROGRES BAR GERAKAN */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span>
              Gerakan {exerciseIndex + 1} dari {program.exercises.length}
            </span>
            <span>
              Set {currentSet} dari {currentExerciseRef?.sets}
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan to-magenta transition-all duration-300"
              style={{
                width: `${((exerciseIndex + (currentSet - 1) / (currentExerciseRef?.sets || 1)) / program.exercises.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* WORKOUT INTERFACE (DUAL MODE) */}
        <div className="grid md:grid-cols-2 gap-6 items-center">
          {/* SISI KIRI: DISPLAY KAMERA ATAU VISUALISASI GERAKAN */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/15 bg-black/60 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            {mode === 'ai_camera' ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none -scale-x-100"
                />

                {/* AI HUD Telemetry */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/70 border border-cyan/40 text-[10px] font-mono text-cyan">
                    <span className="animate-pulse">●</span> AI Bio-Scan Aktif
                  </span>
                  {aiAngle !== null && (
                    <span className="px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white">
                      Sudut: {Math.round(aiAngle)}°
                    </span>
                  )}
                </div>

                {/* Form Warning Alert */}
                {aiFormFeedback && (
                  <div className="absolute bottom-3 inset-x-3 rounded bg-red-950/90 border border-red-500/60 p-2 text-center text-xs text-red-200">
                    ⚠ {aiFormFeedback}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                {currentExerciseItem && (
                  <ExerciseVisual visualKey={currentExerciseItem.visualKey} className="w-full h-full" isAnimated={phase === 'work' && !isPaused} />
                )}
              </div>
            )}

            {/* COUNTDOWN OVERLAY DI AWAL */}
            {phase === 'countdown' && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                <span className="text-xs font-mono text-cyan uppercase tracking-wider mb-2">Bersiap!</span>
                <div className="font-display text-7xl font-bold text-cyan animate-ping">
                  {countdownSeconds}
                </div>
              </div>
            )}
          </div>

          {/* SISI KANAN: METRIK HITUNGAN REPETISI / TIMER */}
          <div className="glass-panel clip-corner border-white/10 p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-cyan">
                  {currentExerciseItem?.category}
                </span>
                {currentExerciseItem?.supportedAiCode && (
                  <button
                    onClick={() => setMode(mode === 'ai_camera' ? 'manual' : 'ai_camera')}
                    className="text-[11px] font-mono px-2.5 py-1 rounded border border-cyan/40 text-cyan hover:bg-cyan/15 transition-all"
                  >
                    {mode === 'ai_camera' ? '📷 Mode AI Kamera' : '⏱ Mode Timer'}
                  </button>
                )}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
                {currentExerciseItem?.name}
              </h2>
            </div>

            {/* REPS ATAU TIMER COUNT */}
            <div className="flex flex-col items-center justify-center py-4 rounded-xl bg-white/5 border border-white/10">
              {currentExerciseRef?.durationSeconds ? (
                // Mode Durasi Waktu
                <div className="text-center">
                  <div className="font-display text-5xl sm:text-6xl font-bold text-cyan">
                    {timerSeconds}s
                  </div>
                  <span className="text-xs font-mono text-muted mt-1 block">
                    Tahan posisi hingga waktu habis
                  </span>
                </div>
              ) : (
                // Mode Repetisi
                <div className="text-center space-y-1">
                  <div className="font-display text-5xl sm:text-6xl font-bold text-magenta">
                    {repsDone}
                    <span className="text-2xl text-muted font-normal"> / {currentExerciseRef?.reps || 10}</span>
                  </div>
                  <span className="text-xs font-mono text-cyan block">
                    {mode === 'ai_camera' ? 'Dihitung otomatis lewat kamera' : 'Repetisi tercapai'}
                  </span>
                </div>
              )}
            </div>

            {/* KONTROL REPETISI / SELESAI SET */}
            <div className="space-y-3">
              {!currentExerciseRef?.durationSeconds && mode === 'manual' && (
                <button
                  onClick={handleManualAddRep}
                  className="w-full clip-corner bg-cyan py-3.5 font-body text-sm font-bold text-void hover:shadow-[var(--glow-cyan)] transition-all"
                >
                  + Tambah Repetisi (Hitung)
                </button>
              )}

              <button
                onClick={handleSetComplete}
                className="w-full clip-corner border border-white/20 bg-white/5 py-3 font-body text-xs font-semibold text-white hover:border-magenta hover:text-magenta transition-colors"
              >
                Selesaikan Set Ini ▸
              </button>
            </div>

            {/* PETUNJUK GERAKAN */}
            {currentExerciseItem && (
              <div className="space-y-1.5 border-t border-white/10 pt-4">
                <span className="text-[10px] font-mono uppercase text-muted tracking-wider block">
                  Instruksi Form:
                </span>
                <p className="text-xs text-muted leading-relaxed">
                  {currentExerciseItem.instructions[0]}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-void text-primary">
          <p className="font-mono text-sm text-muted">Memuat sesi latihan…</p>
        </main>
      }
    >
      <WorkoutRunner />
    </Suspense>
  );
}
