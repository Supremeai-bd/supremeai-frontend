import type { FaceLandmarksDetector } from '@tensorflow-models/face-landmarks-detection';

export interface NormalizedFaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ClientFaceDetectionResult {
  detected: boolean;
  unavailable?: boolean;
  box: NormalizedFaceBox | null;
  landmarksCount: number;
  faceCount: number;
  source: 'tfjs-face-landmarks' | 'browser-face-detector' | 'unavailable';
  reason?: string;
}

let detectorPromise: Promise<FaceLandmarksDetector> | null = null;

async function initFaceLandmarksDetector(): Promise<FaceLandmarksDetector> {
  const [tf, faceLandmarksDetection] = await Promise.all([
    import('@tensorflow/tfjs-core'),
    import('@tensorflow-models/face-landmarks-detection'),
    import('@tensorflow/tfjs-backend-webgl'),
    import('@tensorflow/tfjs-backend-cpu'),
  ]);

  await tf.ready();
  if (tf.getBackend() !== 'webgl') {
    try {
      await tf.setBackend('webgl');
    } catch {
      await tf.setBackend('cpu');
    }
  }

  return faceLandmarksDetection.createDetector(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
    {
      runtime: 'tfjs',
      refineLandmarks: false,
      maxFaces: 3,
    }
  );
}

async function getFaceLandmarksDetector(): Promise<FaceLandmarksDetector> {
  if (!detectorPromise) {
    detectorPromise = initFaceLandmarksDetector().catch((err) => {
      detectorPromise = null;
      throw err;
    });
  }
  return detectorPromise;
}

/**
 * Computes how well-formed and clearly visible a detected face is inside the image composition.
 * Rejects tiny background faces or severely clipped partial-edge detections.
 */
function validateFaceGeometry(
  box: NormalizedFaceBox,
  landmarksCount: number
): { valid: boolean; reason?: string } {
  const minRatio = Math.min(box.width, box.height);
  const maxRatio = Math.max(box.width, box.height);

  if (!Number.isFinite(minRatio) || minRatio < 0.06 || maxRatio < 0.07) {
    return {
      valid: false,
      reason:
        'Detected face is too small in the frame. Please upload a closer portrait where the face is clearly visible.',
    };
  }

  if (landmarksCount > 0 && landmarksCount < 50) {
    return {
      valid: false,
      reason:
        'Facial features could not be clearly resolved. Please upload a sharper, front-facing photo.',
    };
  }

  const aspect = box.width / Math.max(1e-4, box.height);
  if (aspect < 0.42 || aspect > 2.1) {
    return {
      valid: false,
      reason:
        'Face proportions appear distorted or heavily occluded. Please upload an unobstructed portrait.',
    };
  }

  return { valid: true };
}

/**
 * Client-side face detection helper powered by `@tensorflow-models/face-landmarks-detection`
 * (with native Chrome/Edge `FaceDetector` fallback if TFJS model weights cannot be fetched).
 */
export async function detectClientFaceInCanvas(
  canvas: HTMLCanvasElement
): Promise<ClientFaceDetectionResult> {
  const width = Math.max(1, canvas.width);
  const height = Math.max(1, canvas.height);

  // 1. Primary: TensorFlow.js Face Landmarks Detection (MediaPipeFaceMesh)
  try {
    const detector = await getFaceLandmarksDetector();
    const faces = await detector.estimateFaces(canvas, {
      flipHorizontal: false,
      staticImageMode: true,
    });

    if (!faces || faces.length === 0) {
      return {
        detected: false,
        box: null,
        landmarksCount: 0,
        faceCount: 0,
        source: 'tfjs-face-landmarks',
        reason:
          'No human face was detected in this image. Please upload a clear portrait photo showing a human face.',
      };
    }

    // Pick the most prominent face in composition
    const primary = [...faces].sort((a, b) => {
      const areaA = (a.box?.width || 0) * (a.box?.height || 0);
      const areaB = (b.box?.width || 0) * (b.box?.height || 0);
      return areaB - areaA;
    })[0];

    const normalizedBox: NormalizedFaceBox = {
      x: Math.max(0, Math.min(1, (primary.box?.xMin || 0) / width)),
      y: Math.max(0, Math.min(1, (primary.box?.yMin || 0) / height)),
      width: Math.max(0, Math.min(1, (primary.box?.width || 0) / width)),
      height: Math.max(0, Math.min(1, (primary.box?.height || 0) / height)),
    };

    const landmarksCount = Array.isArray(primary.keypoints) ? primary.keypoints.length : 0;
    const geometryCheck = validateFaceGeometry(normalizedBox, landmarksCount);

    if (!geometryCheck.valid) {
      return {
        detected: false,
        box: normalizedBox,
        landmarksCount,
        faceCount: faces.length,
        source: 'tfjs-face-landmarks',
        reason: geometryCheck.reason,
      };
    }

    return {
      detected: true,
      box: normalizedBox,
      landmarksCount,
      faceCount: faces.length,
      source: 'tfjs-face-landmarks',
    };
  } catch {
    // Fall through to native Shape Detection API if offline / WebGL weights blocked
  }

  // 2. Secondary: Native browser FaceDetector API (Chromium / Edge)
  const BrowserFaceDetector = (window as unknown as { FaceDetector?: any }).FaceDetector;
  if (typeof BrowserFaceDetector === 'function') {
    try {
      const detector = new BrowserFaceDetector({ fastMode: false, maxDetectedFaces: 3 });
      const faces = await detector.detect(canvas);
      if (!Array.isArray(faces) || faces.length === 0) {
        return {
          detected: false,
          box: null,
          landmarksCount: 0,
          faceCount: 0,
          source: 'browser-face-detector',
          reason:
            'No human face was detected in this image. Please upload a clear portrait photo showing a human face.',
        };
      }

      const primary = [...faces].sort((a, b) => {
        const areaA = (a.boundingBox?.width || 0) * (a.boundingBox?.height || 0);
        const areaB = (b.boundingBox?.width || 0) * (b.boundingBox?.height || 0);
        return areaB - areaA;
      })[0];

      const b = primary.boundingBox;
      const normalizedBox: NormalizedFaceBox = {
        x: Math.max(0, Math.min(1, (b?.x || 0) / width)),
        y: Math.max(0, Math.min(1, (b?.y || 0) / height)),
        width: Math.max(0, Math.min(1, (b?.width || 0) / width)),
        height: Math.max(0, Math.min(1, (b?.height || 0) / height)),
      };

      const geometryCheck = validateFaceGeometry(normalizedBox, 0);
      if (!geometryCheck.valid) {
        return {
          detected: false,
          box: normalizedBox,
          landmarksCount: 0,
          faceCount: faces.length,
          source: 'browser-face-detector',
          reason: geometryCheck.reason,
        };
      }

      return {
        detected: true,
        box: normalizedBox,
        landmarksCount: 0,
        faceCount: faces.length,
        source: 'browser-face-detector',
      };
    } catch {
      // Proceed to unavailable marker
    }
  }

  return {
    detected: false,
    unavailable: true,
    box: null,
    landmarksCount: 0,
    faceCount: 0,
    source: 'unavailable',
  };
}
