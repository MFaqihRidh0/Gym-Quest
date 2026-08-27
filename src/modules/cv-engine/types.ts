export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export type PoseLandmarks = Landmark[];

export type DetectionStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error';

export type CameraErrorKind = 'denied' | 'not-found' | 'insecure-context' | 'unknown';

export interface CvEngineError {
  kind: CameraErrorKind | 'model-load';
  message: string;
}
