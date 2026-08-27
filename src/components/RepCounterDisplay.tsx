'use client';

import { useEffect, useRef, useState } from 'react';

interface RepCounterDisplayProps {
  reps: number;
  holdSeconds?: number;
  isDuration: boolean;
}

export function RepCounterDisplay({ reps, holdSeconds, isDuration }: RepCounterDisplayProps) {
  const [bump, setBump] = useState(false);
  const prevReps = useRef(reps);

  useEffect(() => {
    if (reps > prevReps.current) {
      setBump(true);
      const timeout = setTimeout(() => setBump(false), 200);
      prevReps.current = reps;
      return () => clearTimeout(timeout);
    }
    prevReps.current = reps;
  }, [reps]);

  const value = isDuration ? Math.floor(holdSeconds ?? 0) : reps;
  const unit = isDuration ? 'DETIK' : 'REPS';

  return (
    <div
      className={`glass-panel clip-corner flex flex-col items-center px-8 py-5 transition-transform duration-200 ${
        bump ? 'scale-[1.15]' : 'scale-100'
      }`}
      style={{ transitionTimingFunction: 'var(--ease-out)' }}
    >
      <span className="font-display text-6xl leading-none font-bold text-cyan">{value}</span>
      <span className="mt-1 font-mono text-xs tracking-widest text-muted">{unit}</span>
    </div>
  );
}
