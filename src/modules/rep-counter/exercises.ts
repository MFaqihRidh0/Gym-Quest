import { POSE_LANDMARK as L } from '../cv-engine/landmarks';
import type { PoseLandmarks } from '../cv-engine/types';
import { angleBetween, angleFromHorizontal, averageJointAngle } from './angles';

export type ExerciseCode = 'push_up' | 'squat' | 'sit_up' | 'plank' | 'arm_raise';
export type CountType = 'rep' | 'duration';
export type MuscleGroup = 'dada' | 'kaki' | 'perut' | 'core' | 'bahu';

export interface FormRule {
  /** Sudut sendi pembanding, mis. kelurusan pinggul saat push-up. */
  measure: (landmarks: PoseLandmarks) => number | null;
  min?: number;
  max?: number;
  /** Pesan koreksi: jelaskan yang terjadi + cara memperbaiki. */
  message: string;
}

export interface ExerciseDefinition {
  code: ExerciseCode;
  label: string;
  muscleGroup: MuscleGroup;
  countType: CountType;
  /** Sudut sendi kunci yang menggerakkan state machine repetisi. */
  primaryAngle: (landmarks: PoseLandmarks) => number | null;
  /** Sudut di bawah ini = posisi "bawah"/kontraksi. */
  downThreshold: number;
  /** Sudut di atas ini = posisi "atas"/ekstensi. */
  upThreshold: number;
  /** Untuk plank: sudut dianggap sah selama ditahan. */
  holdRule?: FormRule;
  formRules: FormRule[];
  /** Petunjuk penempatan kamera — akurasi sangat bergantung sudut pandang. */
  cameraHint: string;
}

const elbowAngle = (landmarks: PoseLandmarks) =>
  averageJointAngle(
    landmarks,
    { a: L.LEFT_SHOULDER, b: L.LEFT_ELBOW, c: L.LEFT_WRIST },
    { a: L.RIGHT_SHOULDER, b: L.RIGHT_ELBOW, c: L.RIGHT_WRIST },
  );

const kneeAngle = (landmarks: PoseLandmarks) =>
  averageJointAngle(
    landmarks,
    { a: L.LEFT_HIP, b: L.LEFT_KNEE, c: L.LEFT_ANKLE },
    { a: L.RIGHT_HIP, b: L.RIGHT_KNEE, c: L.RIGHT_ANKLE },
  );

const hipAngle = (landmarks: PoseLandmarks) =>
  averageJointAngle(
    landmarks,
    { a: L.LEFT_SHOULDER, b: L.LEFT_HIP, c: L.LEFT_KNEE },
    { a: L.RIGHT_SHOULDER, b: L.RIGHT_HIP, c: L.RIGHT_KNEE },
  );

const shoulderAngle = (landmarks: PoseLandmarks) =>
  averageJointAngle(
    landmarks,
    { a: L.LEFT_ELBOW, b: L.LEFT_SHOULDER, c: L.LEFT_HIP },
    { a: L.RIGHT_ELBOW, b: L.RIGHT_SHOULDER, c: L.RIGHT_HIP },
  );

/** Kemiringan garis bahu→pinggul terhadap horizontal — tubuh lurus saat plank. */
const bodyTilt = (landmarks: PoseLandmarks) => {
  const shoulder = landmarks[L.LEFT_SHOULDER] ?? landmarks[L.RIGHT_SHOULDER];
  const hip = landmarks[L.LEFT_HIP] ?? landmarks[L.RIGHT_HIP];
  if (!shoulder || !hip) return null;
  if (shoulder.visibility < 0.5 || hip.visibility < 0.5) return null;
  return angleFromHorizontal(shoulder, hip);
};

/**
 * Sudut elevasi angkat barbel overhead press (0–180°).
 * Mengukur sudut antara pergelangan tangan (wrist) → bahu (shoulder) → anchor tubuh bawah (hip / virtual hip).
 * Saat barbel di dada / bawah: tangan di dekat bahu/bawah -> sudut ~35° - 60°.
 * Saat barbel diangkat ke atas kepala: tangan lurus tinggi di atas kepala -> sudut ~130° - 175°.
 * Menggunakan fallback virtual hip bila pinggul terpotong oleh framing webcam laptop/HP.
 */
const overheadPressAngle = (landmarks: PoseLandmarks): number | null => {
  const getSideElevation = (side: 'left' | 'right') => {
    const shoulder = landmarks[side === 'left' ? L.LEFT_SHOULDER : L.RIGHT_SHOULDER];
    const wrist = landmarks[side === 'left' ? L.LEFT_WRIST : L.RIGHT_WRIST];
    const elbow = landmarks[side === 'left' ? L.LEFT_ELBOW : L.RIGHT_ELBOW];
    const hip = landmarks[side === 'left' ? L.LEFT_HIP : L.RIGHT_HIP];

    if (!shoulder || !wrist) return null;
    const shoulderVis = shoulder.visibility ?? 1;
    const wristVis = wrist.visibility ?? 1;
    if (shoulderVis < 0.35 || wristVis < 0.35) return null;

    // Anchor tubuh bagian bawah: jika hip terlihat jelas gunakan hip, jika di luar frame gunakan garis vertikal ke bawah
    const hipVis = hip?.visibility ?? 0;
    const anchor = (hip && hipVis >= 0.35)
      ? hip
      : { x: shoulder.x, y: shoulder.y + 0.45, z: shoulder.z ?? 0, visibility: shoulderVis };

    // Sudut elevasi tangan (wrist - shoulder - anchor)
    const armAngle = angleBetween(wrist, shoulder, anchor);

    // Tambahan kontribusi ekstensi siku jika siku terdeteksi
    let compositeAngle = armAngle;
    const elbowVis = elbow?.visibility ?? 0;
    if (elbow && elbowVis >= 0.35) {
      const elbowExt = angleBetween(shoulder, elbow, wrist);
      compositeAngle = armAngle * 0.75 + elbowExt * 0.25;
    }

    return {
      angle: compositeAngle,
      visibility: Math.min(shoulderVis, wristVis),
    };
  };

  const left = getSideElevation('left');
  const right = getSideElevation('right');

  if (!left && !right) return null;
  if (left && !right) return left.angle;
  if (!left && right) return right.angle;
  return (left!.angle + right!.angle) / 2;
};

export const EXERCISES: Record<ExerciseCode, ExerciseDefinition> = {
  push_up: {
    code: 'push_up',
    label: 'Push-up',
    muscleGroup: 'dada',
    countType: 'rep',
    primaryAngle: elbowAngle,
    downThreshold: 108,
    upThreshold: 145,
    cameraHint: 'Letakkan kamera di samping tubuh sejajar lantai agar tekukan siku terlihat jelas.',
    formRules: [
      {
        measure: hipAngle,
        min: 135,
        message: 'Pinggul turun terlalu rendah. Kencangkan perut agar badan tetap lurus.',
      },
    ],
  },
  squat: {
    code: 'squat',
    label: 'Squat',
    muscleGroup: 'kaki',
    countType: 'rep',
    primaryAngle: kneeAngle,
    downThreshold: 115,
    upThreshold: 148,
    cameraHint: 'Berdiri menyamping atau serong agar lutut dan pinggul terlihat kamera.',
    formRules: [
      {
        measure: hipAngle,
        min: 55,
        message: 'Badan terlalu membungkuk ke depan. Angkat dada dan dorong pinggul ke belakang.',
      },
    ],
  },
  sit_up: {
    code: 'sit_up',
    label: 'Sit-up',
    muscleGroup: 'perut',
    countType: 'rep',
    primaryAngle: hipAngle,
    downThreshold: 85,
    upThreshold: 115,
    cameraHint: 'Letakkan kamera di samping, sejajar tubuh saat berbaring di lantai.',
    formRules: [],
  },
  plank: {
    code: 'plank',
    label: 'Plank',
    muscleGroup: 'core',
    countType: 'duration',
    primaryAngle: bodyTilt,
    downThreshold: 0,
    upThreshold: 0,
    cameraHint: 'Letakkan kamera di samping agar garis bahu–pinggul–kaki terlihat.',
    holdRule: {
      measure: bodyTilt,
      max: 26,
      message: 'Pinggul terlalu naik atau turun. Sejajarkan bahu, pinggul, dan tumit.',
    },
    formRules: [],
  },
  arm_raise: {
    code: 'arm_raise',
    label: 'Overhead Barbell / Arm Raise',
    muscleGroup: 'bahu',
    countType: 'rep',
    primaryAngle: overheadPressAngle,
    downThreshold: 70,
    upThreshold: 118,
    cameraHint: 'Hadap kamera, angkat kedua tangan dari dada lurus ke atas kepala seperti mengangkat barbel.',
    formRules: [],
  },
};

export const EXERCISE_LIST = Object.values(EXERCISES);
