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
  private smoothed = 0.5;

  private readonly relax = 0.005;
  private readonly minSpan = 0.45; // Rentang lebih lebar agar pergerakan tidak terlalu agresif melompat

  update(value: number) {
    if (this.min === null || this.max === null) {
      this.min = value - this.minSpan / 2;
      this.max = value + this.minSpan / 2;
      this.smoothed = value;
      return;
    }

    // Filter pergerakan dengan redaman halus
    this.smoothed += (value - this.smoothed) * 0.18;

    this.min = this.smoothed < this.min ? this.smoothed : this.min + (this.smoothed - this.min) * this.relax;
    this.max = this.smoothed > this.max ? this.smoothed : this.max + (this.smoothed - this.max) * this.relax;
  }

  /** 0 = posisi terendah (jongkok/bawah), 1 = posisi tertinggi (berdiri/atas). */
  normalize(value: number): number {
    if (this.min === null || this.max === null) return 0.5;

    const center = (this.min + this.max) / 2;
    const span = Math.max(this.max - this.min, this.minSpan);
    const halfSpan = span / 2;

    // Hitung simpangan dari titik tengah (-1 s.d. +1) menggunakan nilai yang telah dihaluskan (smoothed)
    // agar fluktuasi gerakan tidak membuat karakter melompat terlalu liar
    const delta = (center - this.smoothed) / halfSpan;
    
    // Kurangi sensitivitas ekstrem: terapkan redaman skala 0.85 dengan kurva lembut
    const dampedDelta = Math.max(-1, Math.min(1, delta * 0.85));

    // Konversi ke 0..1
    return 0.5 + dampedDelta * 0.5;
  }

  reset() {
    this.min = null;
    this.max = null;
    this.smoothed = 0.5;
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
