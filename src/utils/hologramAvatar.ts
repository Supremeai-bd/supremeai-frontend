import maleHologramImg from '../assets/images/avatar_hologram_male_1794610533388.jpg';
import type { LiveVoiceName } from '../hooks/useLiveVoiceSession';
import { detectClientFaceInCanvas, type NormalizedFaceBox } from './clientFaceDetection';

export type AvatarPresetId = 'female' | 'male' | 'custom';

export interface CustomFaceTraits {
  skinHex?: string;
  hairHex?: string;
  eyeHex?: string;
  lipHex?: string;
  genderCue?: 'female' | 'male';
  hairStyle?: 'short' | 'medium' | 'long';
  hasGlasses?: boolean;
  faceFound?: boolean;
}

export interface AvatarPreference {
  preset: AvatarPresetId;
  customImageDataUrl: string | null;
  customImageName?: string;
  customTraits?: CustomFaceTraits;
}

export interface AvatarPresetMeta {
  id: Exclude<AvatarPresetId, 'custom'>;
  label: string;
  subtitle: string;
  imageSrc: string;
}

export const AVATAR_PRESETS: AvatarPresetMeta[] = [
  {
    id: 'female',
    label: 'Aria (Female)',
    subtitle: '3D avatar with eye gaze, blinking & lip sync',
    imageSrc: '/assets/aistudio/image_b5b290a6.png',
  },
  {
    id: 'male',
    label: 'Orion (Male)',
    subtitle: '3D avatar with eye gaze, blinking & lip sync',
    imageSrc: maleHologramImg,
  },
];

const STORAGE_KEY = 'supremeai_voice_avatar_pref_v1';
const VOICE_STORAGE_KEY = 'supremeai_live_voice_name_v1';
export const VOICE_AVATAR_SYNC_EVENT = 'supremeai:voice-avatar-updated';

const VALID_VOICES: LiveVoiceName[] = ['Zephyr', 'Puck', 'Kore', 'Charon', 'Fenrir'];

export function loadVoicePreference(): LiveVoiceName {
  try {
    const raw = localStorage.getItem(VOICE_STORAGE_KEY) as LiveVoiceName | null;
    if (raw && VALID_VOICES.includes(raw)) return raw;
  } catch {
    // Ignore storage issues
  }
  return 'Zephyr';
}

export function saveVoicePreference(voice: LiveVoiceName): void {
  try {
    localStorage.setItem(VOICE_STORAGE_KEY, voice);
    window.dispatchEvent(new CustomEvent(VOICE_AVATAR_SYNC_EVENT));
  } catch {
    // Ignore storage issues
  }
}

export function loadAvatarPreference(): AvatarPreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { preset: 'female', customImageDataUrl: null };
    }
    const parsed = JSON.parse(raw) as Partial<AvatarPreference>;
    const preset: AvatarPresetId =
      parsed.preset === 'male' || parsed.preset === 'custom' || parsed.preset === 'female'
        ? parsed.preset
        : 'female';
    const customImageDataUrl =
      typeof parsed.customImageDataUrl === 'string' && parsed.customImageDataUrl.startsWith('data:image/')
        ? parsed.customImageDataUrl
        : null;
    if (preset === 'custom' && !customImageDataUrl) {
      return { preset: 'female', customImageDataUrl: null };
    }
    return {
      preset,
      customImageDataUrl,
      customImageName: typeof parsed.customImageName === 'string' ? parsed.customImageName : undefined,
      customTraits: parsed.customTraits,
    };
  } catch {
    return { preset: 'female', customImageDataUrl: null };
  }
}

export function saveAvatarPreference(pref: AvatarPreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
    window.dispatchEvent(new CustomEvent(VOICE_AVATAR_SYNC_EVENT));
  } catch {
    // Ignore storage quota issues gracefully
  }
}

export function resolveAvatarSource(pref: AvatarPreference): {
  src: string;
  isPrestyledHologram: boolean;
  traits?: CustomFaceTraits;
} {
  if (pref.preset === 'custom' && pref.customImageDataUrl) {
    return {
      src: pref.customImageDataUrl,
      isPrestyledHologram: false,
      traits: pref.customTraits,
    };
  }
  const preset = AVATAR_PRESETS.find((p) => p.id === pref.preset) || AVATAR_PRESETS[0];
  return { src: preset.imageSrc, isPrestyledHologram: true };
}

function readImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a PNG, JPG, or WebP image file.'));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error('Image must be smaller than 12 MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid or unsupported image format.'));
      img.onload = () => resolve(img);
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Validates that an uploaded image contains a clearly visible human face using
 * client-side TensorFlow.js Face Landmarks Detection first (rejecting non-face or
 * unclear compositions immediately), then enriches skin/hair/eye/lip traits via
 * `/api/avatar/analyze-face` and crops tightly around ONLY the face.
 */
export async function processCustomFaceUpload(file: File): Promise<{
  dataUrl: string;
  traits: CustomFaceTraits;
  faceDetected: boolean;
}> {
  const img = await readImageFromFile(file);

  // Prepare an analysis JPEG at <= 800px for fast client TFJS + server inspection
  const maxSide = 800;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const aw = Math.max(64, Math.round(img.naturalWidth * scale));
  const ah = Math.max(64, Math.round(img.naturalHeight * scale));
  const analysisCanvas = document.createElement('canvas');
  analysisCanvas.width = aw;
  analysisCanvas.height = ah;
  const aCtx = analysisCanvas.getContext('2d');
  if (!aCtx) {
    throw new Error('2D canvas unavailable.');
  }
  aCtx.drawImage(img, 0, 0, aw, ah);
  const analysisDataUrl = analysisCanvas.toDataURL('image/jpeg', 0.9);

  // Step 1: Client-side face & landmark detection (@tensorflow-models/face-landmarks-detection)
  const clientCheck = await detectClientFaceInCanvas(analysisCanvas);
  if (!clientCheck.unavailable && !clientCheck.detected) {
    throw new Error(
      clientCheck.reason ||
        'No human face was clearly detected in this image. Please upload a clear portrait photo showing a human face.'
    );
  }

  let detectedBox: NormalizedFaceBox | null = clientCheck.detected ? clientCheck.box : null;
  let serverChecked = false;
  let serverFaceFound = false;
  let traits: CustomFaceTraits = {
    genderCue: 'male',
    hairStyle: 'short',
    hasGlasses: false,
    faceFound: clientCheck.detected,
  };

  // Step 2: Server-side trait extraction (skin/hair/eye/lip colors, hair length, glasses) + cross-check
  try {
    const res = await fetch('/api/avatar/analyze-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageData: analysisDataUrl,
        mimeType: 'image/jpeg',
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (!json.fallback) {
        serverChecked = true;
        serverFaceFound = Boolean(json.faceFound);
      }

      if (!detectedBox && json.faceFound && json.faceBox && Number(json.faceBox.width) > 0.05) {
        detectedBox = {
          x: Number(json.faceBox.x) || 0,
          y: Number(json.faceBox.y) || 0,
          width: Number(json.faceBox.width) || 0.3,
          height: Number(json.faceBox.height) || 0.3,
        };
      }
      traits = {
        skinHex: typeof json.skinHex === 'string' ? json.skinHex : undefined,
        hairHex: typeof json.hairHex === 'string' ? json.hairHex : undefined,
        eyeHex: typeof json.eyeHex === 'string' ? json.eyeHex : undefined,
        lipHex: typeof json.lipHex === 'string' ? json.lipHex : undefined,
        genderCue: json.genderCue === 'female' ? 'female' : 'male',
        hairStyle:
          json.hairStyle === 'long' || json.hairStyle === 'medium' ? json.hairStyle : 'short',
        hasGlasses: Boolean(json.hasGlasses),
        faceFound: clientCheck.detected || Boolean(json.faceFound),
      };
    }
  } catch {
    // Client detection result stands if network call fails
  }

  // Step 3: Strict validation gate — reject any image where no human face was verified
  if (serverChecked && !serverFaceFound && !clientCheck.detected) {
    throw new Error(
      'No human face was clearly detected in this image. Please upload a photo with a clear, front-facing human face.'
    );
  }

  if (!detectedBox || (!clientCheck.detected && !serverFaceFound)) {
    throw new Error(
      'Unable to confirm a clear human face in this image. Please upload a well-lit portrait with a visible face.'
    );
  }

  // Convert normalized face box -> tight padded square crop focused ONLY on the face
  const boxCx = (detectedBox.x + detectedBox.width * 0.5) * img.naturalWidth;
  const boxCy = (detectedBox.y + detectedBox.height * 0.5) * img.naturalHeight;
  const faceMaxDim = Math.max(
    detectedBox.width * img.naturalWidth,
    detectedBox.height * img.naturalHeight
  );
  // Generous enough for forehead & chin, tight enough to exclude chest/arms/scenery
  const cropSide = Math.max(
    96,
    Math.min(Math.min(img.naturalWidth, img.naturalHeight), faceMaxDim * 1.28)
  );
  const sx = Math.max(0, Math.min(img.naturalWidth - cropSide, boxCx - cropSide * 0.5));
  const sy = Math.max(0, Math.min(img.naturalHeight - cropSide, boxCy - cropSide * 0.5));

  const outSize = 512;
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = outSize;
  cropCanvas.height = outSize;
  const cCtx = cropCanvas.getContext('2d');
  if (!cCtx) {
    return { dataUrl: analysisDataUrl, traits, faceDetected: true };
  }
  cCtx.drawImage(img, sx, sy, cropSide, cropSide, 0, 0, outSize, outSize);

  // Sample natural skin tone from central cheek area if trait extraction omitted skinHex
  if (!traits.skinHex) {
    const sample = cCtx.getImageData(Math.round(outSize * 0.38), Math.round(outSize * 0.54), 12, 12).data;
    let sr = 0;
    let sg = 0;
    let sb = 0;
    const pixels = sample.length / 4;
    for (let i = 0; i < sample.length; i += 4) {
      sr += sample[i];
      sg += sample[i + 1];
      sb += sample[i + 2];
    }
    if (pixels > 0) {
      const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
      traits.skinHex = `#${toHex(sr / pixels)}${toHex(sg / pixels)}${toHex(sb / pixels)}`;
    }
  }

  return {
    dataUrl: cropCanvas.toDataURL('image/jpeg', 0.92),
    traits: { ...traits, faceFound: true },
    faceDetected: true,
  };
}

/**
 * Legacy helper kept for backward compatibility: returns tightly cropped face data URL.
 */
export async function normalizeUploadedAvatarFile(file: File): Promise<string> {
  const result = await processCustomFaceUpload(file);
  return result.dataUrl;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / Math.max(1e-5, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export interface HologramTexturePair {
  colorCanvas: HTMLCanvasElement;
  depthCanvas: HTMLCanvasElement;
}

/**
 * Converts either a pre-styled holographic portrait OR a regular user-uploaded photo
 * into:
 * 1) A transparent-background RGBA luminous cyan-blue-violet hologram texture
 * 2) A grayscale 3D relief depth map for real-time WebGL vertex displacement
 */
export function buildHologramTextures(
  imageSrc: string,
  isPrestyledHologram: boolean
): Promise<HologramTexturePair> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => reject(new Error('Unable to load avatar texture source.'));
    img.onload = () => {
      const size = 512;
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = size;
      srcCanvas.height = size;
      const srcCtx = srcCanvas.getContext('2d');
      if (!srcCtx) {
        reject(new Error('2D canvas unavailable.'));
        return;
      }

      // Center-crop square with a gentle upper bias for portraits so head & shoulders align
      const imgAspect = img.naturalWidth / Math.max(1, img.naturalHeight);
      let sx = 0;
      let sy = 0;
      let sw = img.naturalWidth;
      let sh = img.naturalHeight;
      if (imgAspect > 1) {
        sw = img.naturalHeight;
        sx = (img.naturalWidth - sw) * 0.5;
      } else if (imgAspect < 1) {
        sh = img.naturalWidth;
        sy = (img.naturalHeight - sh) * 0.22;
      }
      srcCtx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);

      const srcData = srcCtx.getImageData(0, 0, size, size);
      const pixels = srcData.data;

      const colorCanvas = document.createElement('canvas');
      colorCanvas.width = size;
      colorCanvas.height = size;
      const colorCtx = colorCanvas.getContext('2d')!;
      const colorOut = colorCtx.createImageData(size, size);

      const depthCanvas = document.createElement('canvas');
      depthCanvas.width = size;
      depthCanvas.height = size;
      const depthCtx = depthCanvas.getContext('2d')!;
      const depthOut = depthCtx.createImageData(size, size);

      // Estimate background color along upper/side border for arbitrary user photos
      let bgR = 0;
      let bgG = 0;
      let bgB = 0;
      let bgSamples = 0;
      if (!isPrestyledHologram) {
        for (let y = 0; y < size; y += 4) {
          for (let x = 0; x < size; x += 4) {
            const isTopBand = y < size * 0.1;
            const isSideCorner = y < size * 0.62 && (x < size * 0.08 || x > size * 0.92);
            if (!isTopBand && !isSideCorner) continue;
            const idx = (y * size + x) * 4;
            bgR += pixels[idx];
            bgG += pixels[idx + 1];
            bgB += pixels[idx + 2];
            bgSamples++;
          }
        }
        if (bgSamples > 0) {
          bgR /= bgSamples * 255;
          bgG /= bgSamples * 255;
          bgB /= bgSamples * 255;
        }
      }

      // Precompute grayscale buffer for Sobel edge detection on custom photos
      const gray = new Float32Array(size * size);
      for (let i = 0; i < size * size; i++) {
        const p = i * 4;
        gray[i] =
          (0.2126 * pixels[p] + 0.7152 * pixels[p + 1] + 0.0722 * pixels[p + 2]) / 255;
      }

      for (let y = 0; y < size; y++) {
        const ny = y / (size - 1);
        for (let x = 0; x < size; x++) {
          const nx = x / (size - 1);
          const i = y * size + x;
          const p = i * 4;

          const r = pixels[p] / 255;
          const g = pixels[p + 1] / 255;
          const b = pixels[p + 2] / 255;
          const lum = gray[i];
          const maxCh = Math.max(r, g, b);

          // Portrait silhouette oval prior (narrower at head, wider at shoulders)
          const shoulderFlare = ny > 0.62 ? (ny - 0.62) * 0.65 : 0;
          const rx = 0.34 + shoulderFlare;
          const dx = (nx - 0.5) / rx;
          const dy = (ny - 0.48) / 0.45;
          const ovalR = Math.sqrt(dx * dx + dy * dy);
          const bottomFade = 1 - smoothstep(0.84, 0.99, ny);
          const topFade = 1 - smoothstep(0.95, 1.32, ovalR);

          if (isPrestyledHologram) {
            // Key out dark background & outer bokeh while preserving crisp glowing hologram portrait
            const keyStrength = smoothstep(0.055, 0.34, maxCh);
            // Stronger core mask keeps face/shoulders sharp, fades distant corner bokeh
            const outerSilhouette = 1 - smoothstep(0.88, 1.38, ovalR);
            const alpha = clamp01(keyStrength * (0.28 + 0.72 * outerSilhouette) * bottomFade);

            // Slight luminance contrast boost so hologram shines crisply even on light themes
            const boost = 1.08;
            colorOut.data[p] = Math.min(255, Math.round(pixels[p] * boost));
            colorOut.data[p + 1] = Math.min(255, Math.round(pixels[p + 1] * boost));
            colorOut.data[p + 2] = Math.min(255, Math.round(pixels[p + 2] * boost));
            colorOut.data[p + 3] = Math.round(alpha * 255);

            // Volumetric 3D depth relief: smooth facial dome + image brightness
            const faceDome = Math.exp(-((nx - 0.5) * (nx - 0.5) / 0.085 + (ny - 0.44) * (ny - 0.44) / 0.11));
            const depthVal = clamp01((0.55 * faceDome + 0.45 * maxCh) * (0.25 + 0.75 * alpha));
            const dByte = Math.round(depthVal * 255);
            depthOut.data[p] = dByte;
            depthOut.data[p + 1] = dByte;
            depthOut.data[p + 2] = dByte;
            depthOut.data[p + 3] = 255;
          } else {
            // Custom user photo -> Luminous Cyan/Blue/Violet Hologram with Transparent Background
            const xL = Math.max(0, x - 1);
            const xR = Math.min(size - 1, x + 1);
            const yU = Math.max(0, y - 1);
            const yD = Math.min(size - 1, y + 1);

            const gx =
              -gray[yU * size + xL] + gray[yU * size + xR] +
              -2 * gray[y * size + xL] + 2 * gray[y * size + xR] +
              -gray[yD * size + xL] + gray[yD * size + xR];
            const gy =
              -gray[yU * size + xL] - 2 * gray[yU * size + x] - gray[yU * size + xR] +
              gray[yD * size + xL] + 2 * gray[yD * size + x] + gray[yD * size + xR];
            const edge = clamp01(Math.sqrt(gx * gx + gy * gy) * 1.45);

            // Background subtraction + portrait silhouette prior
            const dr = r - bgR;
            const dg = g - bgG;
            const db = b - bgB;
            const bgDist = Math.sqrt(dr * dr + dg * dg + db * db) / 1.732;
            const fgFromBg = smoothstep(0.08, 0.3, bgDist);

            // Core portrait region stays intact even if clothing matches background
            const innerCore = 1 - smoothstep(0.58, 0.96, ovalR);
            const subjectMatte = clamp01(
              Math.max(innerCore * 0.94, fgFromBg * topFade) * topFade * bottomFade
            );

            // Fine horizontal holographic scanline + edge-enhanced luminance
            const scanline = 0.88 + 0.12 * Math.sin(y * 1.05);
            const holoSignal = clamp01((lum * 0.72 + edge * 0.78) * scanline);

            // Map into luminous cyan / electric blue / violet-white palette
            let outR: number;
            let outG: number;
            let outB: number;
            if (holoSignal < 0.45) {
              const t = holoSignal / 0.45;
              outR = 12 + t * 24 + edge * 55;
              outG = 58 + t * 142;
              outB = 185 + t * 70;
            } else {
              const t = (holoSignal - 0.45) / 0.55;
              outR = 36 + t * 195 + edge * 35;
              outG = 200 + t * 52;
              outB = 255;
            }

            // Subtle holographic wireframe / grid shimmer along contours
            const alpha = clamp01(subjectMatte * (0.28 + 0.72 * smoothstep(0.06, 0.55, holoSignal)));

            colorOut.data[p] = Math.min(255, Math.round(outR));
            colorOut.data[p + 1] = Math.min(255, Math.round(outG));
            colorOut.data[p + 2] = Math.min(255, Math.round(outB));
            colorOut.data[p + 3] = Math.round(alpha * 255);

            const faceDome = Math.exp(-((nx - 0.5) * (nx - 0.5) / 0.09 + (ny - 0.44) * (ny - 0.44) / 0.12));
            const depthVal = clamp01((0.5 * faceDome + 0.35 * lum + 0.15 * edge) * subjectMatte);
            const dByte = Math.round(depthVal * 255);
            depthOut.data[p] = dByte;
            depthOut.data[p + 1] = dByte;
            depthOut.data[p + 2] = dByte;
            depthOut.data[p + 3] = 255;
          }
        }
      }

      colorCtx.putImageData(colorOut, 0, 0);
      depthCtx.putImageData(depthOut, 0, 0);
      resolve({ colorCanvas, depthCanvas });
    };
    img.src = imageSrc;
  });
}
