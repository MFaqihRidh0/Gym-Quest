import type { Landmark, PoseLandmarks } from '../cv-engine/types';

/**
 * Sudut ABC di titik B, dalam derajat (0–180). Dihitung di ruang 2D karena
 * koordinat z MediaPipe jauh lebih berisik daripada x/y pada webcam biasa.
 */
export function angleBetween(a: Landmark, b: Landmark, c: Landmark): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;

  const dot = abx * cbx + aby * cby;
  const magnitude = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (magnitude === 0) return 0;

  const cosine = Math.min(Math.max(dot / magnitude, -1), 1);
  return (Math.acos(cosine) * 180) / Math.PI;
}

/** Sudut garis A→B terhadap sumbu horizontal (0–90). Dipakai untuk plank. */
export function angleFromHorizontal(a: Landmark, b: Landmark): number {
  return (Math.atan2(Math.abs(b.y - a.y), Math.abs(b.x - a.x)) * 180) / Math.PI;
}

export interface JointTriplet {
  a: number;
  b: number;
  c: number;
}

/**
 * Rata-rata sudut sisi kiri & kanan, dengan bobot visibility — sisi yang
 * tertutup badan tidak ikut menarik hasil ke angka yang salah.
 */
export function averageJointAngle(
  landmarks: PoseLandmarks,
  left: JointTriplet,
  right: JointTriplet,
  minVisibility = 0.5,
): number | null {
  const samples: number[] = [];

  for (const triplet of [left, right]) {
    const a = landmarks[triplet.a];
    const b = landmarks[triplet.b];
    const c = landmarks[triplet.c];
    if (!a || !b || !c) continue;
    if (
      a.visibility < minVisibility ||
      b.visibility < minVisibility ||
      c.visibility < minVisibility
    ) {
      continue;
    }
    samples.push(angleBetween(a, b, c));
  }

  if (samples.length === 0) return null;
  return samples.reduce((sum, value) => sum + value, 0) / samples.length;
}
