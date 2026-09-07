import { POSE_LANDMARK as L } from './landmarks';
import type { PoseLandmarks } from './types';

const VISIBILITY_THRESHOLD = 0.5;

interface BodyRegion {
  id: string;
  label: string;
  landmarks: number[];
  /** Saran spesifik saat region ini tidak terlihat — nada membantu, bukan menyalahkan. */
  hint: string;
}

const REGIONS: BodyRegion[] = [
  {
    id: 'head',
    label: 'Kepala',
    landmarks: [L.NOSE],
    hint: 'Naikkan kamera sedikit agar kepala masuk frame.',
  },
  {
    id: 'shoulders',
    label: 'Bahu',
    landmarks: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER],
    hint: 'Mundur sedikit agar bahu dan dada terlihat di kamera.',
  },
  {
    id: 'arms',
    label: 'Lengan',
    landmarks: [L.LEFT_ELBOW, L.RIGHT_ELBOW, L.LEFT_WRIST, L.RIGHT_WRIST],
    hint: 'Rentangkan sedikit lengan agar tidak tertutup badan.',
  },
  {
    id: 'hips',
    label: 'Pinggul',
    landmarks: [L.LEFT_HIP, L.RIGHT_HIP],
    hint: 'Mundur sedikit agar pinggul terlihat.',
  },
  {
    id: 'legs',
    label: 'Kaki',
    landmarks: [L.LEFT_KNEE, L.RIGHT_KNEE, L.LEFT_ANKLE, L.RIGHT_ANKLE],
    hint: 'Mundur beberapa langkah agar seluruh kaki masuk frame.',
  },
];

export interface RegionStatus {
  id: string;
  label: string;
  detected: boolean;
  confidence: number;
}

export interface CalibrationState {
  regions: RegionStatus[];
  confidence: number;
  complete: boolean;
  guidance: string;
}

export function evaluateCalibration(landmarks: PoseLandmarks | null): CalibrationState {
  if (!landmarks) {
    return {
      regions: REGIONS.map((region) => ({
        id: region.id,
        label: region.label,
        detected: false,
        confidence: 0,
      })),
      confidence: 0,
      complete: false,
      guidance: 'Tubuh belum terdeteksi. Mundur 2–3 langkah dan pastikan kepala hingga badan terlihat di kamera.',
    };
  }

    const inBounds = (p: { x: number; y: number } | undefined, maxY = 0.94) => {
      if (!p) return false;
      return p.x >= 0.02 && p.x <= 0.98 && p.y >= 0.02 && p.y <= maxY;
    };

    const leftShoulder = landmarks[L.LEFT_SHOULDER];
    const rightShoulder = landmarks[L.RIGHT_SHOULDER];
    const leftElbow = landmarks[L.LEFT_ELBOW];
    const rightElbow = landmarks[L.RIGHT_ELBOW];
    const leftWrist = landmarks[L.LEFT_WRIST];
    const rightWrist = landmarks[L.RIGHT_WRIST];
    const leftHip = landmarks[L.LEFT_HIP];
    const rightHip = landmarks[L.RIGHT_HIP];

    // Cek apakah ada bagian lengan atau torso/pinggul yang terlihat
    const hasArms =
      (leftElbow?.visibility ?? 0) > 0.45 ||
      (rightElbow?.visibility ?? 0) > 0.45 ||
      (leftWrist?.visibility ?? 0) > 0.45 ||
      (rightWrist?.visibility ?? 0) > 0.45;

    const hasTorso =
      (leftHip?.visibility ?? 0) > 0.45 ||
      (rightHip?.visibility ?? 0) > 0.45;

    const avgShoulderY =
      leftShoulder && rightShoulder ? (leftShoulder.y + rightShoulder.y) / 2 : 1;

    // Murni wajah close-up (head only):
    // Jika TIDAK ada lengan dan TIDAK ada pinggul, dan posisi bahu tertekan di 18% terbawah frame (> 0.82),
    // maka tubuh sebenarnya berada di bawah meja/layar (hanya wajah yang tampak).
    const isHeadOnlyCloseUp = !hasArms && !hasTorso && avgShoulderY > 0.82;

    const regions = REGIONS.map((region) => {
      // Validasi bahu:
      if (region.id === 'shoulders') {
        if (!leftShoulder || !rightShoulder) {
          return { id: region.id, label: region.label, detected: false, confidence: 0 };
        }

        // Jika hanya kepala close-up tanpa lengan/badan di bagian bawah, tolak
        if (isHeadOnlyCloseUp) {
          return { id: region.id, label: region.label, detected: false, confidence: 0.15 };
        }

        const shouldersInBounds = inBounds(leftShoulder) && inBounds(rightShoulder);
        if (!shouldersInBounds) {
          return { id: region.id, label: region.label, detected: false, confidence: 0.2 };
        }

        const avgVis = (leftShoulder.visibility + rightShoulder.visibility) / 2;
        // Jika lengan terlihat (seperti angkat tangan atau tangan terbuka), bahu pasti valid
        const threshold = hasArms ? 0.50 : 0.65;
        const detected = avgVis >= threshold;

        return {
          id: region.id,
          label: region.label,
          detected,
          confidence: avgVis,
        };
      }

      // Region lainnya:
      const scores = region.landmarks.map((index) => {
        const p = landmarks[index];
        if (!p || !inBounds(p)) return 0;
        return p.visibility;
      });

      const confidence = scores.reduce((sum, value) => sum + value, 0) / scores.length;
      const threshold = region.id === 'hips' ? 0.65 : VISIBILITY_THRESHOLD;

      return {
        id: region.id,
        label: region.label,
        detected: confidence >= threshold,
        confidence,
      };
    });

  const confidence = regions.reduce((sum, region) => sum + region.confidence, 0) / regions.length;
  const missing = REGIONS.find((region) => !regions.find((r) => r.id === region.id)?.detected);

  return {
    regions,
    confidence,
    complete: !missing,
    guidance: missing ? missing.hint : 'Posisi sudah pas. Kamu siap mulai latihan.',
  };
}
