'use client';

import { useEffect, useRef, useState } from 'react';
import type { PoseLandmarks } from '../cv-engine/types';
import type { ExerciseCode } from './exercises';
import { RepCounter, initialRepCounterState, type RepCounterState } from './repCounter';

const UI_SYNC_INTERVAL_MS = 100;

export function useRepCounter(
  exerciseCode: ExerciseCode,
  liveLandmarksRef: React.RefObject<PoseLandmarks | null>,
) {
  const counterRef = useRef(new RepCounter(exerciseCode));
  const [state, setState] = useState<RepCounterState>(initialRepCounterState);
  const formOkRef = useRef<boolean | null>(null);

  useEffect(() => {
    counterRef.current.reset(exerciseCode);
    setState(counterRef.current.getState());
  }, [exerciseCode]);

  useEffect(() => {
    let raf = 0;
    let lastSync = 0;

    const tick = () => {
      const now = performance.now();
      const next = counterRef.current.update(liveLandmarksRef.current, now);
      formOkRef.current = next.angle === null ? null : next.formOk;
      if (now - lastSync >= UI_SYNC_INTERVAL_MS) {
        lastSync = now;
        setState(next);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [liveLandmarksRef]);

  const reset = () => {
    counterRef.current.reset();
    setState(counterRef.current.getState());
  };

  return { state, reset, formOkRef };
}
