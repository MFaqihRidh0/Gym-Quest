'use client';

import { useEffect, useRef, useState } from 'react';
import type { PoseLandmarks } from '../cv-engine/types';
import { RepCounter } from '../rep-counter/repCounter';
import { soundEngine } from './audio';
import { PonyGame, type PonyGameState } from './ponyGame';
import { VerticalControlTracker, type ArenaControlMode } from './verticalControl';

const REP_BONUS_SCORE = 2;
const UI_SYNC_INTERVAL_MS = 100;

export interface ArenaState extends PonyGameState {
  reps: number;
  timeUp: boolean;
}

/** exercises.ts memakai kode 'arm_raise'; Arena menyebutnya 'Angkat Barbel' di UI saja. */
const REP_EXERCISE_CODE: Record<ArenaControlMode, 'push_up' | 'arm_raise'> = {
  push_up: 'push_up',
  arm_raise: 'arm_raise',
};

export function useArenaGame(
  mode: ArenaControlMode,
  liveLandmarksRef: React.RefObject<PoseLandmarks | null>,
  active: boolean,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef(new PonyGame());
  const controlRef = useRef(new VerticalControlTracker(mode));
  const repCounterRef = useRef(new RepCounter(REP_EXERCISE_CODE[mode]));
  const repsRef = useRef(0);

  const [state, setState] = useState<ArenaState>({
    score: 0,
    lives: 3,
    gameOver: false,
    reps: 0,
    timeUp: false,
  });
  const forceEndRef = useRef(false);
  const [restartSignal, setRestartSignal] = useState(0);

  // Saat sesi berhenti (active -> false), tampilan skor/reps disetel ulang
  // di sini (bukan di dalam effect di bawah) — pola resmi React untuk
  // "menyesuaikan state saat prop berubah": https://react.dev/learn/you-might-not-need-an-effect
  const [trackedActive, setTrackedActive] = useState(active);
  if (trackedActive !== active) {
    setTrackedActive(active);
    if (!active) setState({ score: 0, lives: 3, gameOver: false, reps: 0, timeUp: false });
  }

  useEffect(() => {
    controlRef.current.setMode(mode);
    repCounterRef.current.reset(REP_EXERCISE_CODE[mode]);
    repsRef.current = 0;
  }, [mode]);

  useEffect(() => {
    if (!active) {
      gameRef.current.reset();
      controlRef.current.setMode(mode);
      repCounterRef.current.reset(REP_EXERCISE_CODE[mode]);
      repsRef.current = 0;
      forceEndRef.current = false;
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let raf = 0;
    let lastFrame = performance.now();
    let lastSync = 0;

    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;

      const dpr = window.devicePixelRatio || 1;
      const cssWidth = canvas.clientWidth;
      const cssHeight = canvas.clientHeight;
      if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gameRef.current.resize(cssWidth, cssHeight);

      const landmarks = liveLandmarksRef.current;
      const control = controlRef.current.read(landmarks);
      const gameState = gameRef.current.update(dt, control);

      const repState = repCounterRef.current.update(landmarks, now);
      if (repState.reps > repsRef.current) {
        repsRef.current = repState.reps;
        gameRef.current.score += REP_BONUS_SCORE;
        soundEngine.playRepBonus();
      }

      gameRef.current.draw(ctx);

      if (now - lastSync >= UI_SYNC_INTERVAL_MS || gameState.gameOver || forceEndRef.current) {
        lastSync = now;
        setState({
          ...gameState,
          score: gameRef.current.score,
          reps: repsRef.current,
          timeUp: forceEndRef.current,
        });
      }

      if (!gameRef.current.gameOver && !forceEndRef.current) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, mode, liveLandmarksRef, restartSignal]);

  const restart = () => {
    gameRef.current.reset();
    repCounterRef.current.reset(REP_EXERCISE_CODE[mode]);
    repsRef.current = 0;
    forceEndRef.current = false;
    setState({ score: 0, lives: 3, gameOver: false, reps: 0, timeUp: false });
    setRestartSignal((n) => n + 1);
  };

  const endSession = () => {
    forceEndRef.current = true;
  };

  return { canvasRef, state, restart, endSession };
}
