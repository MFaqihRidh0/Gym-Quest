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
  minVisibility = 0.45,
): number | null {
  const getSide = (triplet: JointTriplet) => {
    const a = landmarks[triplet.a];
    const b = landmarks[triplet.b];
    const c = landmarks[triplet.c];
    if (!a || !b || !c) return null;
    const minVis = Math.min(a.visibility, b.visibility, c.visibility);
    if (minVis < minVisibility) return null;
    return {
      angle: angleBetween(a, b, c),
      confidence: minVis,
    };
  };

  const leftResult = getSide(left);
  const rightResult = getSide(right);

  if (!leftResult && !rightResult) return null;
  if (leftResult && !rightResult) return leftResult.angle;
  if (!leftResult && rightResult) return rightResult.angle;

  // Jika kedua sisi terlihat:
  // Jika posisi tubuh menyamping (satu sisi jauh lebih jelas dari sisi lain),
  // gunakan sisi yang lebih jelas agar sisi yang terhalang tidak merusak sudut.
  const diff = Math.abs(leftResult!.confidence - rightResult!.confidence);
  if (diff > 0.18) {
    return leftResult!.confidence > rightResult!.confidence
      ? leftResult!.angle
      : rightResult!.angle;
  }

  // Jika kedua sisi seimbang (menghadap depan), rata-ratakan kedua sisi
  return (leftResult!.angle + rightResult!.angle) / 2;
}
