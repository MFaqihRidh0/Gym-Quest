import type { Landmark, PoseLandmarks } from './types';

/**
 * One Euro filter: meredam jitter saat tubuh diam tanpa menambah lag terasa
 * saat gerakan cepat — penting karena rep-counter membaca sudut sendi dari
 * nilai yang sudah dihaluskan ini.
 */
class OneEuroFilter {
  private prevValue: number | null = null;
  private prevDerivative = 0;
  private prevTimestamp: number | null = null;

  constructor(
    private minCutoff: number,
    private beta: number,
    private derivativeCutoff: number,
  ) {}

  private static alpha(cutoff: number, dt: number) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }

  filter(value: number, timestamp: number): number {
    if (this.prevValue === null || this.prevTimestamp === null) {
      this.prevValue = value;
      this.prevTimestamp = timestamp;
      return value;
    }

    const dt = Math.max((timestamp - this.prevTimestamp) / 1000, 1e-3);
    const derivative = (value - this.prevValue) / dt;
    const smoothedDerivative =
      OneEuroFilter.alpha(this.derivativeCutoff, dt) * derivative +
      (1 - OneEuroFilter.alpha(this.derivativeCutoff, dt)) * this.prevDerivative;

    const cutoff = this.minCutoff + this.beta * Math.abs(smoothedDerivative);
    const a = OneEuroFilter.alpha(cutoff, dt);
    const smoothed = a * value + (1 - a) * this.prevValue;

    this.prevValue = smoothed;
    this.prevDerivative = smoothedDerivative;
    this.prevTimestamp = timestamp;
    return smoothed;
  }
}

export interface SmoothingOptions {
  minCutoff?: number;
  beta?: number;
  derivativeCutoff?: number;
}

export class PoseSmoother {
  private filters = new Map<string, OneEuroFilter>();

  constructor(private options: SmoothingOptions = {}) {}

  private filterFor(key: string) {
    let filter = this.filters.get(key);
    if (!filter) {
      const { minCutoff = 1.2, beta = 0.02, derivativeCutoff = 1 } = this.options;
      filter = new OneEuroFilter(minCutoff, beta, derivativeCutoff);
      this.filters.set(key, filter);
    }
    return filter;
  }

  smooth(landmarks: PoseLandmarks, timestamp: number): PoseLandmarks {
    return landmarks.map((landmark, index): Landmark => {
      return {
        x: this.filterFor(`${index}:x`).filter(landmark.x, timestamp),
        y: this.filterFor(`${index}:y`).filter(landmark.y, timestamp),
        z: this.filterFor(`${index}:z`).filter(landmark.z, timestamp),
        visibility: landmark.visibility,
      };
    });
  }

  reset() {
    this.filters.clear();
  }
}
