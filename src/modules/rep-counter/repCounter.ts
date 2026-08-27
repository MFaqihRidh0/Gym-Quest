import type { PoseLandmarks } from '../cv-engine/types';
import { EXERCISES, type ExerciseCode } from './exercises';

/**
 * State machine naik→turun→naik. Rep baru dihitung hanya saat kembali ke
 * "atas" setelah sempat menyentuh "bawah" — mencegah double-count dari
 * jitter di sekitar satu threshold saja.
 */
type RepPhase = 'up' | 'down';

export interface RepCounterState {
  reps: number;
  phase: RepPhase;
  formOk: boolean;
  formMessage: string | null;
  /** Untuk exercise berbasis durasi (plank): detik tertahan pada sesi ini. */
  holdSeconds: number;
  angle: number | null;
}

export function initialRepCounterState(): RepCounterState {
  return {
    reps: 0,
    phase: 'up',
    formOk: true,
    formMessage: null,
    holdSeconds: 0,
    angle: null,
  };
}

export class RepCounter {
  private state: RepCounterState = initialRepCounterState();
  private lastTimestamp: number | null = null;

  constructor(private exerciseCode: ExerciseCode) {}

  reset(exerciseCode?: ExerciseCode) {
    if (exerciseCode) this.exerciseCode = exerciseCode;
    this.state = initialRepCounterState();
    this.lastTimestamp = null;
  }

  private evaluateForm(landmarks: PoseLandmarks): { ok: boolean; message: string | null } {
    const definition = EXERCISES[this.exerciseCode];
    for (const rule of definition.formRules) {
      const value = rule.measure(landmarks);
      if (value === null) continue;
      if (rule.min !== undefined && value < rule.min) return { ok: false, message: rule.message };
      if (rule.max !== undefined && value > rule.max) return { ok: false, message: rule.message };
    }
    return { ok: true, message: null };
  }

  update(landmarks: PoseLandmarks | null, timestamp: number): RepCounterState {
    const definition = EXERCISES[this.exerciseCode];
    const dt = this.lastTimestamp !== null ? (timestamp - this.lastTimestamp) / 1000 : 0;
    this.lastTimestamp = timestamp;

    if (!landmarks) {
      this.state = { ...this.state, angle: null };
      return this.state;
    }

    const angle = definition.primaryAngle(landmarks);

    if (definition.countType === 'duration') {
      const holdRule = definition.holdRule;
      const value = holdRule?.measure(landmarks) ?? null;
      const withinHold = value !== null && (holdRule?.max === undefined || value <= holdRule.max);

      this.state = {
        ...this.state,
        angle: value,
        holdSeconds: withinHold ? this.state.holdSeconds + dt : this.state.holdSeconds,
        formOk: withinHold,
        formMessage: withinHold ? null : (holdRule?.message ?? null),
      };
      return this.state;
    }

    if (angle === null) {
      this.state = { ...this.state, angle: null };
      return this.state;
    }

    const { ok, message } = this.evaluateForm(landmarks);
    let { reps, phase } = this.state;

    if (phase === 'up' && angle <= definition.downThreshold) {
      phase = 'down';
    } else if (phase === 'down' && angle >= definition.upThreshold) {
      phase = 'up';
      reps += 1;
    }

    this.state = { ...this.state, angle, phase, reps, formOk: ok, formMessage: message };
    return this.state;
  }

  getState(): RepCounterState {
    return this.state;
  }
}
