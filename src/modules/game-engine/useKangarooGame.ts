'use client';

import { useEffect, useRef, useState } from 'react';
import type { PoseLandmarks } from '../cv-engine/types';
import { RepCounter } from '../rep-counter/repCounter';
import { KangarooGame, type KangarooGameState } from './kangarooGame';

const UI_SYNC_INTERVAL_MS = 100;

export interface KangarooArenaState extends KangarooGameState {
  reps: number;
  timeUp: boolean;
}

export function useKangarooGame(
  liveLandmarksRef: React.RefObject<PoseLandmarks | null>,
  active: boolean,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef(new KangarooGame());
  const repCounterRef = useRef(new RepCounter('squat'));
  const repsRef = useRef(0);
  const forceEndRef = useRef(false);

  const [state, setState] = useState<KangarooArenaState>({
    score: 0,
    gameOver: false,
    reps: 0,
    timeUp: false,
  });
  const [restartSignal, setRestartSignal] = useState(0);

  const [trackedActive, setTrackedActive] = useState(active);
  if (trackedActive !== active) {
    setTrackedActive(active);
    if (!active) setState({ score: 0, gameOver: false, reps: 0, timeUp: false });
  }

  useEffect(() => {
    if (!active) {
      gameRef.current.reset();
      repCounterRef.current.reset('squat');
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
      const repState = repCounterRef.current.update(landmarks, now);

      const jumpTriggered = repState.reps > repsRef.current;
      if (jumpTriggered) repsRef.current = repState.reps;
      const ducking = repState.phase === 'down';

      const gameState = gameRef.current.update(dt, jumpTriggered, ducking);
      gameRef.current.draw(ctx);

      if (now - lastSync >= UI_SYNC_INTERVAL_MS || gameState.gameOver || forceEndRef.current) {
        lastSync = now;
        setState({
          score: Math.round(gameRef.current.score),
          gameOver: gameState.gameOver,
          reps: repsRef.current,
          timeUp: forceEndRef.current,
        });
      }

      if (!gameRef.current.gameOver && !forceEndRef.current) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, liveLandmarksRef, restartSignal]);

  const restart = () => {
    gameRef.current.reset();
    repCounterRef.current.reset('squat');
    repsRef.current = 0;
    forceEndRef.current = false;
    setState({ score: 0, gameOver: false, reps: 0, timeUp: false });
    setRestartSignal((n) => n + 1);
  };

  const endSession = () => {
    forceEndRef.current = true;
  };

  return { canvasRef, state, restart, endSession };
}
