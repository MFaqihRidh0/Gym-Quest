'use client';

import { EXERCISE_LIST, type ExerciseCode } from '@/modules/rep-counter/exercises';

interface ExerciseDockProps {
  active: ExerciseCode;
  onSelect: (code: ExerciseCode) => void;
}

export function ExerciseDock({ active, onSelect }: ExerciseDockProps) {
  return (
    <nav
      aria-label="Pilih exercise"
      className="glass-panel clip-corner pointer-events-auto flex w-full max-w-[13rem] flex-col gap-1 p-3"
    >
      {EXERCISE_LIST.map((exercise) => {
        const isActive = exercise.code === active;
        return (
          <button
            key={exercise.code}
            onClick={() => onSelect(exercise.code)}
            aria-pressed={isActive}
            className={`flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left font-body text-sm transition-colors duration-[var(--dur-fast)] ${
              isActive ? 'bg-cyan/15 text-cyan' : 'text-muted hover:text-primary'
            }`}
          >
            <span aria-hidden>{isActive ? '▸' : ' '}</span>
            {exercise.label}
          </button>
        );
      })}
    </nav>
  );
}
