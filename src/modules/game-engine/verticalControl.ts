import { POSE_LANDMARK as L } from '../cv-engine/landmarks';
import type { PoseLandmarks } from '../cv-engine/types';

export type ArenaControlMode = 'push_up' | 'arm_raise';

const VISIBILITY_THRESHOLD = 0.5;

/** Nilai Y mentah (0 = atas frame, 1 = bawah frame) dari bagian tubuh yang mengendalikan karakter. */
function extractRawY(mode: ArenaControlMode, landmarks: PoseLandmarks): number | null {
  if (mode === 'push_up') {
    const nose = landmarks[L.NOSE];
    return nose && nose.visibility >= VISIBILITY_THRESHOLD ? nose.y : null;
  }

  const wrists = [landmarks[L.LEFT_WRIST], landmarks[L.RIGHT_WRIST]].filter(
    (point) => point && point.visibility >= VISIBILITY_THRESHOLD,
  );
  if (wrists.length === 0) return null;
  return wrists.reduce((sum, point) => sum + point!.y, 0) / wrists.length;
}

/**
 * Auto-kalibrasi rentang gerak: kontraksi instan saat rekor baru ditemukan,
 * relaksasi perlahan agar rentang tetap mengikuti jika user berpindah posisi.
 * Tanpa ini, jarak user ke kamera akan sangat memengaruhi seberapa jauh
 * karakter bisa naik/turun.
 */
class AdaptiveRange {
  private min: number | null = null;
  private max: number | null = null;

  private readonly relax = 0.01;

  update(value: number) {
    if (this.min === null || this.max === null) {
      this.min = value;
      this.max = value;
      return;
    }
    this.min = value < this.min ? value : this.min + (value - this.min) * this.relax;
    this.max = value > this.max ? value : this.max + (value - this.max) * this.relax;
  }

  /** 0 = posisi terendah yang pernah tercatat, 1 = posisi tertinggi. */
  normalize(value: number): number {
    if (this.min === null || this.max === null) return 0.5;
    const span = this.max - this.min;
    if (span < 1e-4) return 0.5;
    const t = (this.max - value) / span;
    return Math.min(Math.max(t, 0), 1);
  }

  reset() {
    this.min = null;
    this.max = null;
  }
}

export class VerticalControlTracker {
  private range = new AdaptiveRange();

  constructor(private mode: ArenaControlMode) {}

  setMode(mode: ArenaControlMode) {
    if (mode !== this.mode) {
      this.mode = mode;
      this.range.reset();
    }
  }

  /** Mengembalikan posisi 0 (bawah) – 1 (atas), atau null jika bagian tubuh tak terlihat. */
  read(landmarks: PoseLandmarks | null): number | null {
    if (!landmarks) return null;
    const raw = extractRawY(this.mode, landmarks);
    if (raw === null) return null;
    this.range.update(raw);
    return this.range.normalize(raw);
  }
}
