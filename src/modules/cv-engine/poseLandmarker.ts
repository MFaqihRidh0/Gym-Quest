import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

let instancePromise: Promise<PoseLandmarker> | null = null;

/**
 * WASM & model di-host sendiri (bukan CDN) supaya deteksi tetap jalan di
 * koneksi lambat dan tidak ada permintaan pihak ketiga saat latihan.
 */
export function loadPoseLandmarker(): Promise<PoseLandmarker> {
  if (!instancePromise) {
    instancePromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
      try {
        return await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: '/mediapipe/models/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.35,
          minPosePresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });
      } catch (gpuError) {
        console.warn('GPU delegate failed for PoseLandmarker, falling back to CPU:', gpuError);
        return await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: '/mediapipe/models/pose_landmarker_lite.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.35,
          minPosePresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });
      }
    })().catch((error) => {
      instancePromise = null;
      throw error;
    });
  }
  return instancePromise;
}
