import { FilesetResolver, FaceDetector as MPFaceDetector } from '@mediapipe/tasks-vision';
import { DetectedHead } from '../types';

let faceDetectorInstance: MPFaceDetector | null = null;
let isLoadingDetector = false;

/**
 * Initialize MediaPipe FaceDetector WASM module asynchronously.
 */
export async function getFaceDetector(): Promise<MPFaceDetector | null> {
  if (faceDetectorInstance) return faceDetectorInstance;
  if (isLoadingDetector) {
    let checkCount = 0;
    while (isLoadingDetector && checkCount < 30) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      checkCount++;
      if (faceDetectorInstance) return faceDetectorInstance;
    }
  }

  try {
    isLoadingDetector = true;
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    faceDetectorInstance = await MPFaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      minDetectionConfidence: 0.4,
    });
    return faceDetectorInstance;
  } catch (error) {
    console.warn('MediaPipe WASM failed to initialize, falling back to heuristic saliency detector:', error);
    return null;
  } finally {
    isLoadingDetector = false;
  }
}

/**
 * Detect subject head within an HTMLImageElement using ML or Fallback Saliency
 */
export async function detectHeadInImage(img: HTMLImageElement): Promise<DetectedHead> {
  const detector = await getFaceDetector();

  if (detector) {
    try {
      const detections = detector.detect(img);
      if (detections && detections.detections.length > 0) {
        // Find largest face or main subject
        let mainDetection = detections.detections[0];
        let maxArea = 0;

        for (const d of detections.detections) {
          if (d.boundingBox) {
            const area = d.boundingBox.width * d.boundingBox.height;
            if (area > maxArea) {
              maxArea = area;
              mainDetection = d;
            }
          }
        }

        if (mainDetection.boundingBox) {
          const bb = mainDetection.boundingBox;
          // Normalize coordinates
          const x = Math.max(0, bb.originX / img.naturalWidth);
          const y = Math.max(0, bb.originY / img.naturalHeight);
          const width = Math.min(1 - x, bb.width / img.naturalWidth);
          const height = Math.min(1 - y, bb.height / img.naturalHeight);

          // Expand bounding box slightly upward to encompass full head/hair
          const headY = Math.max(0, y - height * 0.25);
          const headHeight = Math.min(1 - headY, height * 1.35);

          return {
            x,
            y: headY,
            width,
            height: headHeight,
            confidence: mainDetection.categories?.[0]?.score || 0.9,
            source: 'mediapipe',
          };
        }
      }
    } catch (e) {
      console.warn('Error during MediaPipe detection execution:', e);
    }
  }

  // Fallback: Smart Canvas Skin-tone & Saliency Head Detector
  return fallbackSaliencyHeadDetector(img);
}

/**
 * Fallback browser-side algorithm using Canvas pixel luminosity & upper body skin-tone detection
 */
function fallbackSaliencyHeadDetector(img: HTMLImageElement): DetectedHead {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const w = Math.min(300, img.naturalWidth || 300);
  const h = Math.min(300, img.naturalHeight || 300);
  canvas.width = w;
  canvas.height = h;

  if (!ctx) {
    return { x: 0.35, y: 0.15, width: 0.3, height: 0.3, confidence: 0.5, source: 'saliency' };
  }

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let minX = w, maxX = 0, minY = h, maxY = 0;
  let skinPixelCount = 0;
  let weightedXSum = 0;
  let weightedYSum = 0;

  // Scan top 65% of the image (where heads/portraits usually reside)
  const maxScanY = Math.floor(h * 0.7);

  for (let y = 0; y < maxScanY; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Skin tone heuristic in RGB / YCbCr bounds
      const isSkin =
        r > 65 &&
        g > 40 &&
        b > 20 &&
        r > g &&
        r > b &&
        Math.abs(r - g) > 12 &&
        r - Math.min(g, b) > 15;

      if (isSkin) {
        skinPixelCount++;
        weightedXSum += x;
        weightedYSum += y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (skinPixelCount > 30) {
    const avgX = weightedXSum / skinPixelCount;
    const avgY = weightedYSum / skinPixelCount;

    const boxW = Math.max(w * 0.2, (maxX - minX) * 0.9);
    const boxH = Math.max(h * 0.25, (maxY - minY) * 1.1);

    const normX = Math.max(0, Math.min(1 - boxW / w, (avgX - boxW / 2) / w));
    const normY = Math.max(0, Math.min(1 - boxH / h, (avgY - boxH * 0.4) / h));

    return {
      x: normX,
      y: normY,
      width: Math.min(1 - normX, boxW / w),
      height: Math.min(1 - normY, boxH / h),
      confidence: 0.65,
      source: 'saliency',
    };
  }

  // Default centered upper-body head focus if no strong skin signature found
  return {
    x: 0.35,
    y: 0.12,
    width: 0.3,
    height: 0.32,
    confidence: 0.5,
    source: 'saliency',
  };
}
