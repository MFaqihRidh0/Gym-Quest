import { POSE_LANDMARK as L } from '../cv-engine/landmarks';
import type { PoseLandmarks } from '../cv-engine/types';
import { angleFromHorizontal, averageJointAngle } from './angles';

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
    label: 'Angkat lengan',
    muscleGroup: 'bahu',
    countType: 'rep',
    primaryAngle: shoulderAngle,
    downThreshold: 35,
    upThreshold: 75,
    cameraHint: 'Hadap kamera, pastikan kedua lengan tidak keluar frame saat diangkat ke samping.',
    formRules: [
      {
        measure: elbowAngle,
        min: 130,
        message: 'Siku terlalu menekuk. Jaga lengan tetap lurus saat diangkat.',
      },
    ],
  },
};

export const EXERCISE_LIST = Object.values(EXERCISES);
