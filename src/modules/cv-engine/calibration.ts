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
    hint: 'Hadapkan badan ke kamera agar kedua bahu terlihat.',
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
      guidance: 'Berdiri menghadap kamera sampai seluruh tubuh masuk ke dalam frame.',
    };
  }

  const regions = REGIONS.map((region) => {
    const scores = region.landmarks.map((index) => landmarks[index]?.visibility ?? 0);
    const confidence = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    return {
      id: region.id,
      label: region.label,
      detected: confidence >= VISIBILITY_THRESHOLD,
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
