'use client';

import React, { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_PROGRAMS } from '@/modules/program-engine/defaultPrograms';
import { EXERCISE_CATALOG } from '@/modules/program-engine/exerciseCatalog';
import { getCustomPrograms, getUserProfile, recordWorkoutSession } from '@/modules/program-engine/storage';
import type { ExerciseItem, ProgramExerciseRef, WorkoutProgram, WorkoutSessionLog } from '@/modules/program-engine/types';
import { soundEngine } from '@/modules/game-engine/audio';
import { usePoseDetection } from '@/modules/cv-engine/usePoseDetection';
import { RepCounter, type RepCounterState } from '@/modules/rep-counter/repCounter';
import { drawBioScan } from '@/modules/cv-engine/drawBioScan';
import { ExerciseVisual } from '@/components/ExerciseVisual';
import { ShareAchievementModal } from '@/components/ShareAchievementModal';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { GymQuestLogo } from '@/components/GymQuestLogo';
import { useLanguage, getLocalizedExercise, getLocalizedProgram } from '@/modules/i18n';
import {
  IconBolt,
  IconFlame,
  IconTrophy,
  IconTimer,
  IconWarning,
  IconPlay,
  IconPause,
  IconSkip,
  IconCheckmark,
  IconLightbulb,
  IconTarget,
} from '@/components/ui/CyberIcons';

type WorkoutPhase = 'countdown' | 'work' | 'rest' | 'finished';

function WorkoutRunner() {
  const { t, language } = useLanguage();
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
  const [finishedResult, setFinishedResult] = useState<{
    log: WorkoutSessionLog;
    newStreak: number;
    earnedExp?: number;
    newWeeklyExp?: number;
    newRank?: number;
  } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

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

  const rawProgram = program;
  const currentProgram = rawProgram ? getLocalizedProgram(rawProgram, language) : null;
  const currentExerciseRef: ProgramExerciseRef | undefined = rawProgram?.exercises[exerciseIndex];
  const rawExerciseItem: ExerciseItem | undefined = currentExerciseRef
    ? EXERCISE_CATALOG[currentExerciseRef.exerciseId]
    : undefined;
  const currentExerciseItem: ExerciseItem | undefined = rawExerciseItem
    ? getLocalizedExercise(rawExerciseItem, language)
    : undefined;

  // Inisialisasi AI Rep Counter saat gerakan berubah & auto-fallback ke Animasi 3D jika tidak ada kamera AI
  useEffect(() => {
    if (currentExerciseItem?.supportedAiCode) {
      repCounterRef.current = new RepCounter(currentExerciseItem.supportedAiCode);
    } else {
      repCounterRef.current = null;
      // Gerakan tidak mendukung kamera AI -> otomatis alihkan ke mode animasi 3D
      if (mode === 'ai_camera') {
        setMode('manual');
      }
    }
    setRepsDone(0);
  }, [exerciseIndex, currentExerciseItem, mode]);

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

    // Catat repetisi set ini ke total akumulasi
    const completedRepsThisSet = repsDone > 0 ? repsDone : (currentExerciseRef.reps || 0);
    if (repsDone === 0 && completedRepsThisSet > 0) {
      setTotalRepsCompleted((prev) => prev + completedRepsThisSet);
    }

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
  const handleManualAddRep = useCallback(() => {
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
  }, [currentExerciseRef]);

  // Auto-Pacing: repetisi bertambah otomatis mengikuti ritme animasi 3D
  const handleAnimationRep = useCallback(() => {
    if (mode === 'manual' && phase === 'work' && !isPaused && !currentExerciseRef?.durationSeconds) {
      handleManualAddRep();
    }
  }, [mode, phase, isPaused, currentExerciseRef, handleManualAddRep]);

  // Skip ke gerakan berikutnya
  const handleSkipExercise = () => {
    if (!program) return;
    soundEngine.playRestTransition();
    if (exerciseIndex >= program.exercises.length - 1) {
      finishWorkout();
    } else {
      setExerciseIndex((i) => i + 1);
      setCurrentSet(1);
      setRepsDone(0);
      setCountdownSeconds(3);
      setPhase('countdown');
    }
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
      <main className="min-h-screen flex items-center justify-center bg-transparent text-primary p-5">
        <p className="font-mono text-sm text-muted">Memuat program latihan…</p>
      </main>
    );
  }

  // LAYAR SELESAI (CELEBRATION FINISHED)
  if (phase === 'finished' && finishedResult) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-transparent text-primary p-5">
        <div className="glass-panel clip-corner w-full max-w-lg border-cyan/50 p-8 text-center bg-void/95 space-y-6 shadow-[0_0_50px_rgba(0,229,255,0.2)]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan/20 border border-cyan/50 text-cyan">
            <IconTrophy size={36} className="text-amber-400" glow />
          </div>

          <div>
            <span className="text-xs font-mono tracking-widest text-cyan uppercase font-bold">
              {t.workout.summaryTitle}
            </span>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-white">
              {t.workout.summaryTitle}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {t.workout.summarySubtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 border-y border-white/10">
            <div className="p-2">
              <div className="text-[11px] font-mono text-muted">{t.workout.totalTime}</div>
              <div className="text-lg font-bold text-cyan mt-0.5">
                {Math.round(finishedResult.log.durationSeconds / 60)} {t.common.minutes}
              </div>
            </div>
            <div className="p-2">
              <div className="text-[11px] font-mono text-muted">{t.common.calories}</div>
              <div className="text-lg font-bold text-magenta mt-0.5">
                ~{finishedResult.log.caloriesBurned} {t.common.calories}
              </div>
            </div>
            <div className="p-2">
              <div className="text-[11px] font-mono text-muted">{t.workout.totalReps}</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {finishedResult.log.totalRepsCompleted}
              </div>
            </div>
            <div className="p-2">
              <div className="text-[11px] font-mono text-muted">{t.workout.currentStreak}</div>
              <div className="text-lg font-bold text-yellow-400 mt-0.5 flex items-center justify-center gap-1">
                <IconFlame size={16} className="text-amber-400 inline" />
                <span>{finishedResult.newStreak} {t.progress.streakDays}</span>
              </div>
            </div>
          </div>

          {finishedResult.earnedExp && (
            <div className="flex items-center justify-between bg-cyan/10 border border-cyan/30 rounded-lg px-4 py-2.5">
              <div className="flex items-center gap-2">
                <IconBolt size={22} className="text-cyan" glow />
                <div className="text-left">
                  <div className="text-[10px] font-mono uppercase text-cyan tracking-wider font-bold">{t.workout.earnedExp}</div>
                  <div className="text-xs text-muted">{t.nav.leaderboard}</div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-display font-bold text-base text-cyan">+{finishedResult.earnedExp} EXP</span>
                {finishedResult.newRank && (
                  <span className="block text-[10px] font-mono text-muted">Rank #{finishedResult.newRank}</span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                soundEngine.playPoint();
                setShowShareModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 clip-corner bg-emerald-500 py-3 font-body text-xs font-bold text-void hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              <span>{t.workout.shareResult}</span>
            </button>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/leaderboard"
                className="flex-1 clip-corner bg-gradient-to-r from-cyan to-magenta py-3 font-body text-xs font-bold text-void hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-1.5"
              >
                <span>{t.nav.leaderboard}</span>
                <IconTrophy size={14} className="text-void" />
              </Link>
              <Link
                href="/progress"
                className="flex-1 clip-corner border border-white/20 bg-white/5 py-3 font-body text-xs font-semibold text-white hover:border-white/40 transition-colors text-center"
              >
                {t.nav.progress} ▸
              </Link>
            </div>
          </div>
        </div>

        <ShareAchievementModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          data={{
            title: program.title,
            reps: finishedResult.log.totalRepsCompleted,
            durationMinutes: Math.round(finishedResult.log.durationSeconds / 60),
            calories: finishedResult.log.caloriesBurned,
            streakDays: finishedResult.newStreak,
            leagueName: 'Liga GymQuest',
            username: getUserProfile().username || 'Knight-01',
          }}
        />
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
    const rawNextItem = nextExerciseRef ? EXERCISE_CATALOG[nextExerciseRef.exerciseId] : null;
    const nextExerciseItem = rawNextItem ? getLocalizedExercise(rawNextItem, language) : null;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-transparent text-primary p-5">
        <div className="glass-panel clip-corner w-full max-w-md border-magenta/40 p-8 text-center bg-void/95 space-y-6 shadow-[0_0_40px_rgba(255,61,154,0.15)]">
          <span className="text-xs font-mono uppercase tracking-widest text-magenta font-bold">
            {language === 'en' ? 'Rest Interval' : 'Jeda Istirahat'}
          </span>

          <div className="relative flex items-center justify-center my-4">
            <div className="w-32 h-32 rounded-full border-4 border-magenta/30 border-t-magenta flex items-center justify-center animate-spin">
              <span className="text-transparent">.</span>
            </div>
            <div className="absolute font-display text-5xl font-bold text-white">
              {restSecondsRemaining}s
            </div>
          </div>

          <p className="text-xs text-muted">
            {language === 'en'
              ? 'Take deep breaths, stretch your muscles, and hydrate.'
              : 'Tarik napas dalam, regangkan otot, dan minum air secukupnya.'}
          </p>

          {nextExerciseItem && (
            <div className="border-t border-white/10 pt-4 text-left">
              <span className="text-[10px] font-mono uppercase text-cyan block mb-1">
                {language === 'en' ? 'Up Next:' : 'Gerakan Selanjutnya:'}
              </span>
              <div className="flex items-center justify-between">
                <span className="font-display text-base font-bold text-white">{nextExerciseItem.name}</span>
                <span className="text-xs font-mono text-muted">
                  {language === 'en'
                    ? `Set ${nextSet} of ${nextExerciseRef?.sets}`
                    : `Set ${nextSet} dari ${nextExerciseRef?.sets}`}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleSkipRest}
            className="w-full clip-corner bg-magenta py-3 font-body text-xs font-bold text-void hover:shadow-[var(--glow-magenta)] transition-all flex items-center justify-center gap-1.5"
          >
            <span>{language === 'en' ? 'Skip Rest' : 'Lewati Istirahat'}</span>
            <IconSkip size={12} className="inline fill-current" />
          </button>
        </div>
      </main>
    );
  }

  // LAYAR AKTIF WORKOUT
  return (
    <main className="min-h-screen flex flex-col bg-transparent text-primary">
      {/* 1. HEADER TOP HUD & TIMELINE COCKPIT */}
      <header className="glass-panel sticky top-3 z-20 mx-3 sm:mx-6 rounded-2xl border border-cyan/30 shadow-[0_8px_40px_rgba(0,0,0,0.55)] overflow-hidden bg-void/90 backdrop-blur-xl">
        {/* ROW 1: TOP HUD STATUS */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Link
              href={`/programs/${program.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 hover:bg-red-500/10 hover:border-red-400/40 hover:text-red-400 text-muted transition-all duration-200 text-xs font-mono tracking-wide backdrop-blur-sm shadow-sm"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              {t.common.close}
            </Link>
            <span className="text-xs text-white/20">|</span>
            <div className="flex items-center gap-2">
              <GymQuestLogo size="xs" variant="emblem" />
              <span className="font-display text-sm font-bold text-white truncate max-w-[180px] sm:max-w-none">
                {currentProgram?.title || program.title}
              </span>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan/15 text-cyan border border-cyan/30">
              {currentProgram?.badge || program.badge}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-muted flex items-center gap-1">
                <IconTimer size={13} className="text-muted" />
                {t.common.duration}:
              </span>
              <span className="text-white font-bold">
                {Math.floor(sessionElapsedSeconds / 60)}:
                {String(sessionElapsedSeconds % 60).padStart(2, '0')}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-muted flex items-center gap-1">
                <IconFlame size={13} className="text-magenta" />
                {t.common.calories}:
              </span>
              <span className="text-magenta font-bold">~{Math.round(estimatedCalories)} {t.common.calories}</span>
            </div>
            <LanguageSwitcher compact />
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`clip-corner px-3 py-1 text-xs font-mono transition-all flex items-center gap-1.5 ${
                isPaused
                  ? 'bg-yellow-400 text-void font-bold shadow-[0_0_10px_rgba(255,214,0,0.5)]'
                  : 'border border-white/20 bg-white/5 text-white hover:border-cyan'
              }`}
            >
              {isPaused ? (
                <>
                  <IconPlay size={11} className="fill-current" />
                  <span>{t.common.resume}</span>
                </>
              ) : (
                <>
                  <IconPause size={11} className="fill-current" />
                  <span>{t.common.pause}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ROW 2: TIMELINE ROADMAP STRIP (Seluruh Gerakan Latihan) */}
        <div className="w-full px-4 sm:px-6 py-2.5 overflow-x-auto scrollbar-none bg-[#08102a]/70">
          <div className="flex items-center gap-2 min-w-max">
            {program.exercises.map((exRef, idx) => {
              const rawItem = EXERCISE_CATALOG[exRef.exerciseId];
              const localizedItem = rawItem ? getLocalizedExercise(rawItem, language) : null;
              const isCurrent = idx === exerciseIndex;
              const isPassed = idx < exerciseIndex;
              return (
                <div
                  key={`${exRef.exerciseId}-${idx}`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 border transition-all ${
                    isCurrent
                      ? 'border-cyan bg-cyan/20 text-cyan font-bold shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                      : isPassed
                        ? 'border-white/10 bg-white/5 text-muted opacity-60'
                        : 'border-white/5 bg-white/[0.02] text-muted'
                  }`}
                >
                  <span className="text-[10px] w-4 h-4 rounded-full flex items-center justify-center bg-black/60">
                    {isPassed ? <IconCheckmark size={10} className="text-cyan" /> : idx + 1}
                  </span>
                  <span className="truncate max-w-[130px]">{localizedItem?.name || (language === 'en' ? 'Exercise' : 'Gerakan')}</span>
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* 3. MAIN STAGE WORKOUT COCKPIT */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col justify-center">
        <div className="grid lg:grid-cols-12 gap-6 items-stretch my-auto">
          {/* SISI KIRI: DISPLAY VISUALISASI BERGERAK / KAMERA (7 Kolom) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div className="relative w-full h-[360px] sm:h-[440px] lg:h-[500px] rounded-2xl overflow-hidden border border-cyan/25 bg-gradient-to-b from-[#0e1942] to-[#070e24] shadow-[0_0_50px_rgba(7,14,38,0.8)] flex items-center justify-center">
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

                  {/* Vision HUD Telemetry */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-black/80 border border-cyan/50 text-xs font-mono text-cyan shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
                      Bio-Scan Vision Tracking
                    </span>
                    {aiAngle !== null && (
                      <span className="px-2.5 py-1 rounded bg-black/80 border border-white/20 text-xs font-mono text-white">
                        {language === 'en' ? 'Joint Angle:' : 'Sudut Sendi:'} <strong className="text-cyan">{Math.round(aiAngle)}°</strong>
                      </span>
                    )}
                  </div>

                  {/* Form Warning Alert */}
                  {aiFormFeedback && (
                    <div className="absolute bottom-4 inset-x-4 rounded-lg bg-red-950/95 border border-red-500/80 p-3 text-center text-xs font-semibold text-red-100 shadow-xl animate-bounce flex items-center justify-center gap-1.5">
                      <IconWarning size={14} className="text-red-400 shrink-0" />
                      <span>{aiFormFeedback}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full p-2 flex items-center justify-center">
                  {currentExerciseItem && (
                    <ExerciseVisual
                      visualKey={currentExerciseItem.visualKey}
                      className="w-full h-full"
                      isAnimated={phase === 'work' && !isPaused}
                      onAnimationRep={handleAnimationRep}
                    />
                  )}
                </div>
              )}

              {/* Tag Info Gerakan di Mode AI Kamera */}
              {mode === 'ai_camera' && (
                <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 border border-white/15 backdrop-blur-sm text-xs font-mono">
                  <span className="text-cyan font-bold">
                    {language === 'en'
                      ? `Exercise ${exerciseIndex + 1}/${program.exercises.length}`
                      : `Gerakan ${exerciseIndex + 1}/${program.exercises.length}`}
                  </span>
                  <span className="text-white/30">·</span>
                  <span className="text-white">
                    {language === 'en'
                      ? `Set ${currentSet} of ${currentExerciseRef?.sets}`
                      : `Set ${currentSet} dari ${currentExerciseRef?.sets}`}
                  </span>
                </div>
              )}

              {/* Floating Quick Mode Switcher on Stage */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-xl">
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
                    mode === 'manual'
                      ? 'bg-cyan text-void font-bold shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  <span>🏃</span>
                  <span className="hidden sm:inline">{language === 'en' ? 'Animation' : 'Animasi'}</span>
                </button>
                {currentExerciseItem?.supportedAiCode ? (
                  <button
                    type="button"
                    onClick={() => setMode('ai_camera')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
                      mode === 'ai_camera'
                        ? 'bg-cyan text-void font-bold shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                        : 'text-muted hover:text-white'
                    }`}
                  >
                    <span>📷</span>
                    <span className="hidden sm:inline">{language === 'en' ? 'Camera' : 'Kamera'}</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-muted/60 px-2 py-0.5">
                    {language === 'en' ? '3D Only' : 'Hanya 3D'}
                  </span>
                )}
              </div>

              {/* COUNTDOWN OVERLAY DI AWAL */}
              {phase === 'countdown' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md">
                  <span className="text-sm font-mono text-cyan uppercase tracking-widest mb-3">
                    {language === 'en' ? 'Get Ready!' : 'Bersiap Mulai!'}
                  </span>
                  <div className="font-display text-8xl font-bold text-cyan animate-ping">
                    {countdownSeconds}
                  </div>
                  <span className="text-xs text-muted mt-6">
                    {language === 'en'
                      ? 'Position your body and follow the motion rhythm'
                      : 'Posisikan tubuhmu dan ikuti ritme animasi gerakan'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SISI KANAN: COCKPIT KONTROL & METRIK (5 Kolom) */}
          <div className="lg:col-span-5 flex flex-col justify-between glass-panel clip-corner border-cyan/25 p-6 sm:p-8 rounded-2xl space-y-6 bg-[#0c1638]/90 shadow-[0_0_40px_rgba(8,16,45,0.6)]">
            <div>
              {/* Kategori & Toggle Mode AI */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan font-bold">
                  {currentExerciseItem?.category} · {t.programs.noEquipment}
                </span>

                {/* Permanent Segmented Mode Switcher */}
                <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setMode('manual')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      mode === 'manual'
                        ? 'bg-cyan text-void font-bold shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                        : 'text-muted hover:text-white'
                    }`}
                  >
                    <span>🏃</span>
                    <span>{language === 'en' ? '3D Animation' : 'Animasi 3D'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={!currentExerciseItem?.supportedAiCode}
                    onClick={() => {
                      if (currentExerciseItem?.supportedAiCode) {
                        setMode('ai_camera');
                      }
                    }}
                    title={
                      !currentExerciseItem?.supportedAiCode
                        ? (language === 'en'
                            ? 'AI Camera tracking is not available for this exercise'
                            : 'Sensor kamera belum mendukung gerakan ini (khusus Animasi 3D)')
                        : ''
                    }
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      mode === 'ai_camera'
                        ? 'bg-cyan text-void font-bold shadow-[0_0_12px_rgba(0,229,255,0.4)] cursor-pointer'
                        : !currentExerciseItem?.supportedAiCode
                          ? 'opacity-40 cursor-not-allowed text-muted'
                          : 'text-muted hover:text-white cursor-pointer'
                    }`}
                  >
                    <span>📷</span>
                    <span>{language === 'en' ? 'AI Camera' : 'Kamera AI'}</span>
                    {!currentExerciseItem?.supportedAiCode && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-white/10 text-white/50 ml-0.5">
                        {language === 'en' ? 'N/A' : 'T/A'}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {currentExerciseItem?.name}
              </h2>

              {/* Target Otot Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {currentExerciseItem?.targetMuscles.map((m) => (
                  <span
                    key={m}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131d45]/70 border border-cyan/20 text-muted"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* METER DISPLAY UTAMA (REPETISI ATAU TIMER) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#13204e]/70 to-[#0b1332]/90 border border-cyan/25 p-6 text-center shadow-inner">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00e5ff_1px,transparent_1px)] [background-size:12px_12px]" />

              {currentExerciseRef?.durationSeconds ? (
                // Mode Durasi Waktu
                <div className="relative z-10 space-y-2">
                  <span className="text-xs font-mono uppercase text-muted tracking-wider">
                    {language === 'en' ? 'Time Remaining' : 'Sisa Waktu Set Ini'}
                  </span>
                  <div className="font-display text-6xl sm:text-7xl font-bold text-cyan tracking-tight drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                    {timerSeconds}s
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden max-w-xs mx-auto mt-2">
                    <div
                      className="h-full bg-cyan transition-all duration-1000"
                      style={{
                        width: `${(timerSeconds / (currentExerciseRef.durationSeconds || 30)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-muted mt-2 block">
                    {language === 'en'
                      ? 'Maintain posture until the timer sounds'
                      : 'Pertahankan postur hingga timer berbunyi'}
                  </span>
                </div>
              ) : (
                // Mode Repetisi
                <div className="relative z-10 space-y-2">
                  <span className="text-xs font-mono uppercase text-muted tracking-wider">
                    {language === 'en' ? 'Rep Progress' : 'Progres Repetisi'}
                  </span>
                  <div className="font-display text-6xl sm:text-7xl font-bold text-magenta tracking-tight drop-shadow-[0_0_20px_rgba(255,61,154,0.4)]">
                    {repsDone}
                    <span className="text-3xl text-muted font-normal">
                      {' '}
                      / {currentExerciseRef?.reps || 10}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden max-w-xs mx-auto mt-2">
                    <div
                      className="h-full bg-magenta transition-all duration-300"
                      style={{
                        width: `${Math.min((repsDone / (currentExerciseRef?.reps || 10)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-cyan mt-2 flex items-center justify-center gap-1">
                    {mode === 'ai_camera'
                      ? (language === 'en'
                        ? 'Auto-counted via Computer Vision camera sensor'
                        : 'Dihitung otomatis lewat sensor kamera Computer Vision')
                      : (
                        <>
                          <IconBolt size={12} className="text-cyan shrink-0 inline" />
                          <span>
                            {language === 'en'
                              ? 'Auto-Pacing: Reps count automatically with 3D animation rhythm'
                              : 'Auto-Pacing: Repetisi dihitung otomatis mengikuti ritme animasi 3D'}
                          </span>
                        </>
                      )}
                  </span>
                </div>
              )}
            </div>

            {/* TOMBOL KONTROL & AKSI */}
            <div className="space-y-2.5">
              <button
                onClick={handleSetComplete}
                className="w-full clip-corner bg-gradient-to-r from-cyan to-magenta py-3.5 px-4 font-body text-sm font-bold text-void hover:shadow-[var(--glow-cyan)] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <IconCheckmark size={15} className="text-void" />
                <span>
                  {language === 'en'
                    ? (currentExerciseRef?.durationSeconds
                        ? 'Finish This Set'
                        : repsDone > 0
                          ? `Finish at Rep ${repsDone}`
                          : 'Finish at Current Reps')
                    : (currentExerciseRef?.durationSeconds
                        ? 'Selesai pada Set Ini'
                        : repsDone > 0
                          ? `Selesai pada Repetisi ${repsDone}`
                          : 'Selesai pada Repetisi Ini')}
                </span>
                <IconPlay size={11} className="text-void fill-current ml-0.5" />
              </button>

              <button
                onClick={handleSkipExercise}
                className="w-full clip-corner border border-cyan/30 bg-[#0d163a]/70 py-2.5 px-4 font-body text-xs font-semibold text-muted hover:text-white hover:border-cyan/50 hover:bg-[#111e4d] transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span>{language === 'en' ? 'Skip Exercise' : 'Lewati Gerakan'}</span>
                <IconSkip size={11} className="text-muted fill-current" />
              </button>
            </div>

            {/* KARTU PANDUAN FORM TIPS */}
            {currentExerciseItem && (
              <div className="rounded-xl border border-cyan/25 bg-[#0b1433]/85 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono text-cyan font-bold">
                  <IconLightbulb size={14} className="text-cyan shrink-0" />
                  <span>{language === 'en' ? 'Perfect Form Tips:' : 'Tips Form Sempurna:'}</span>
                </div>
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
        <main className="min-h-screen flex items-center justify-center bg-transparent text-primary">
          <p className="font-mono text-sm text-muted">Memuat sesi latihan…</p>
        </main>
      }
    >
      <WorkoutRunner />
    </Suspense>
  );
}
