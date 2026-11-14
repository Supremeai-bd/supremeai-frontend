import * as THREE from 'three';
import type { AvatarRenderQuality, CustomFaceTraits } from '../../../utils/hologramAvatar';

export interface AvatarTextureSet {
  skin: THREE.CanvasTexture;
  eye: THREE.CanvasTexture;
  hair: THREE.CanvasTexture;
  mouthInterior: THREE.CanvasTexture;
  particle: THREE.CanvasTexture;
}

function makeCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D canvas context unavailable for avatar texture generation.');
  }
  return { canvas, ctx };
}

function sanitizeHex(hex: string | undefined, fallback: string): string {
  if (!hex) return fallback;
  const cleaned = hex.trim();
  return /^#[0-9a-fA-F]{6}$/.test(cleaned) ? cleaned : fallback;
}

/**
 * Generates an equirectangular UV skin texture aligned for SphereGeometry
 * after `rotateY(-Math.PI / 2)` so u=0.5, v=0.5 faces +Z (front of face).
 */
export function createSkinTexture(
  isFemale: boolean,
  anisotropy = 4,
  customSkinHex?: string,
  quality: AvatarRenderQuality = 'ultra'
): THREE.CanvasTexture {
  const texScale = quality === 'performance' ? 0.5 : 1;
  const w = Math.round(1024 * texScale);
  const h = Math.round(512 * texScale);
  const { canvas, ctx } = makeCanvas(w, h);

  const skinBase = sanitizeHex(customSkinHex, isFemale ? '#f3d4c4' : '#e8bfa7');
  if (customSkinHex) {
    ctx.fillStyle = skinBase;
    ctx.fillRect(0, 0, w, h);
  } else {
    const baseGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (isFemale) {
      baseGrad.addColorStop(0, '#f3d4c4');
      baseGrad.addColorStop(0.5, '#fae0d2');
      baseGrad.addColorStop(1, '#e7bfb0');
    } else {
      baseGrad.addColorStop(0, '#e5bfa8');
      baseGrad.addColorStop(0.5, '#efc9b2');
      baseGrad.addColorStop(1, '#d4a68e');
    }
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // Gentle facial center luminance glow (u ~ 0.5, v ~ 0.48)
  const faceGlow = ctx.createRadialGradient(w * 0.5, h * 0.48, 12 * texScale, w * 0.5, h * 0.48, w * 0.24);
  faceGlow.addColorStop(0, 'rgba(255, 245, 238, 0.28)');
  faceGlow.addColorStop(0.6, 'rgba(255, 236, 224, 0.12)');
  faceGlow.addColorStop(1, 'rgba(220, 185, 175, 0)');
  ctx.fillStyle = faceGlow;
  ctx.fillRect(0, 0, w, h);

  // Rosy cheek blush gradients aligned symmetrically around center front
  const drawCheekBlush = (cx: number, cy: number) => {
    const r = 56 * texScale;
    const blush = ctx.createRadialGradient(cx, cy, 4 * texScale, cx, cy, r);
    blush.addColorStop(0, isFemale ? 'rgba(236, 118, 128, 0.22)' : 'rgba(216, 118, 112, 0.13)');
    blush.addColorStop(0.6, 'rgba(232, 125, 130, 0.07)');
    blush.addColorStop(1, 'rgba(232, 125, 130, 0)');
    ctx.fillStyle = blush;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };
  drawCheekBlush(w * 0.435, h * 0.545);
  drawCheekBlush(w * 0.565, h * 0.545);

  // Soft orbital eye socket shading so eyes sit naturally framed
  const drawSocketShade = (cx: number, cy: number) => {
    const r = 34 * texScale;
    const shade = ctx.createRadialGradient(cx, cy, 6 * texScale, cx, cy, r);
    shade.addColorStop(0, 'rgba(130, 92, 92, 0.24)');
    shade.addColorStop(0.65, 'rgba(155, 112, 108, 0.1)');
    shade.addColorStop(1, 'rgba(155, 112, 108, 0)');
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };
  drawSocketShade(w * 0.456, h * 0.466);
  drawSocketShade(w * 0.544, h * 0.466);

  // Subtle nasal bridge highlight
  const noseGrad = ctx.createLinearGradient(w * 0.5, h * 0.44, w * 0.5, h * 0.56);
  noseGrad.addColorStop(0, 'rgba(255, 250, 245, 0.16)');
  noseGrad.addColorStop(0.8, 'rgba(255, 248, 240, 0.24)');
  noseGrad.addColorStop(1, 'rgba(255, 248, 240, 0)');
  ctx.fillStyle = noseGrad;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.505, 10 * texScale, 28 * texScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle lip-zone natural warmth
  const lipBorder = ctx.createRadialGradient(w * 0.5, h * 0.615, 4 * texScale, w * 0.5, h * 0.615, 38 * texScale);
  lipBorder.addColorStop(0, 'rgba(195, 92, 98, 0.2)');
  lipBorder.addColorStop(1, 'rgba(195, 92, 98, 0)');
  ctx.fillStyle = lipBorder;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.615, 38 * texScale, 18 * texScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ultra-fine organic skin micro-variation (skipped in Performance mode for faster texture generation)
  if (quality === 'ultra') {
    ctx.fillStyle = 'rgba(160, 120, 105, 0.035)';
    for (let i = 0; i < 1600; i++) {
      const px = (((i * 733) % 997) / 997) * w;
      const py = (((i * 419 + 17) % 509) / 509) * h;
      ctx.fillRect(px, py, 1.5, 1.5);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = quality === 'performance' ? 1 : anisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Composites a tightly cropped human face photo smoothly onto the front UV face
 * region of the 3D head texture while feathering edges into matched skin tone so
 * zero background scenery leaks onto the head.
 */
export function createCustomFaceSkinTexture(
  faceImg: HTMLImageElement,
  traits: CustomFaceTraits | undefined,
  anisotropy = 4,
  quality: AvatarRenderQuality = 'ultra'
): THREE.CanvasTexture {
  const isFemale = traits?.genderCue === 'female';
  const baseTex = createSkinTexture(isFemale, anisotropy, traits?.skinHex, quality);
  const canvas = baseTex.image as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return baseTex;

  const w = canvas.width;
  const h = canvas.height;

  // Prepare an elliptical feathered overlay from the face-only portrait
  const patchW = Math.round(w * 0.24);
  const patchH = Math.round(h * 0.44);
  const { canvas: patchCanvas, ctx: pCtx } = makeCanvas(patchW, patchH);

  // Draw inner 78% of face crop centered vertically to align eyebrows/nose/chin onto 3D skull
  const iw = faceImg.naturalWidth || faceImg.width || 512;
  const ih = faceImg.naturalHeight || faceImg.height || 512;
  const cropMarginX = iw * 0.12;
  const cropMarginY = ih * 0.1;
  pCtx.drawImage(
    faceImg,
    cropMarginX,
    cropMarginY,
    Math.max(32, iw - cropMarginX * 2),
    Math.max(32, ih - cropMarginY * 2),
    0,
    0,
    patchW,
    patchH
  );

  // Smooth elliptical alpha mask so temples/cheeks/chin feather invisibly into skin tone
  pCtx.globalCompositeOperation = 'destination-in';
  const maskGrad = pCtx.createRadialGradient(
    patchW * 0.5,
    patchH * 0.48,
    patchW * 0.18,
    patchW * 0.5,
    patchH * 0.48,
    patchW * 0.54
  );
  maskGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
  maskGrad.addColorStop(0.68, 'rgba(255, 255, 255, 0.72)');
  maskGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  pCtx.fillStyle = maskGrad;
  pCtx.fillRect(0, 0, patchW, patchH);
  pCtx.globalCompositeOperation = 'source-over';

  // Composite feathered face onto front UV window centered at (u=0.5, v=0.49)
  ctx.save();
  ctx.globalAlpha = 0.86;
  ctx.drawImage(patchCanvas, Math.round(w * 0.5 - patchW * 0.5), Math.round(h * 0.5 - patchH * 0.48));
  ctx.restore();

  baseTex.needsUpdate = true;
  return baseTex;
}

/**
 * Generates an eye sphere texture calibrated so u=0.5, v=0.5 (+Z after rotateY(-PI/2))
 * renders a crisp, detailed human iris, radial fibers, collarette, dark limbus, and sclera.
 */
export function createEyeTexture(
  irisPrimaryHex: string,
  irisInnerHex: string,
  anisotropy = 4,
  quality: AvatarRenderQuality = 'ultra'
): THREE.CanvasTexture {
  const texScale = quality === 'performance' ? 0.5 : 1;
  const w = Math.round(512 * texScale);
  const h = Math.round(512 * texScale);
  const { canvas, ctx } = makeCanvas(w, h);

  // Sclera base with warm realistic outer shading
  const scleraGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 38 * texScale, w * 0.5, h * 0.5, w * 0.48);
  scleraGrad.addColorStop(0, '#fcfdfd');
  scleraGrad.addColorStop(0.5, '#f2f5f8');
  scleraGrad.addColorStop(0.85, '#dde3eb');
  scleraGrad.addColorStop(1, '#c5cfdb');
  ctx.fillStyle = scleraGrad;
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.5;
  const cy = h * 0.5;
  const rx = 44 * texScale;
  const ry = 70 * texScale;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(rx / ry, 1);

  const limbusGrad = ctx.createRadialGradient(0, 0, ry * 0.35, 0, 0, ry * 1.04);
  limbusGrad.addColorStop(0, irisInnerHex);
  limbusGrad.addColorStop(0.68, irisPrimaryHex);
  limbusGrad.addColorStop(0.9, '#0f172a');
  limbusGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = limbusGrad;
  ctx.beginPath();
  ctx.arc(0, 0, ry * 1.04, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 72; i++) {
    const angle = (i / 72) * Math.PI * 2;
    const len = ry * (0.8 + ((i * 7) % 5) * 0.035);
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.22)' : 'rgba(12, 24, 48, 0.25)';
    ctx.lineWidth = i % 3 === 0 ? 1.8 : 1.0;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * (ry * 0.34), Math.sin(angle) * (ry * 0.34));
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.stroke();
  }

  ctx.strokeStyle = irisInnerHex;
  ctx.lineWidth = 3.2;
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.arc(0, 0, ry * 0.44, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const pupilGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, ry * 0.36);
  pupilGrad.addColorStop(0, '#020409');
  pupilGrad.addColorStop(0.85, '#070b14');
  pupilGrad.addColorStop(1, 'rgba(7, 11, 20, 0)');
  ctx.fillStyle = pupilGrad;
  ctx.beginPath();
  ctx.arc(0, 0, ry * 0.36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.beginPath();
  ctx.arc(-ry * 0.24, -ry * 0.24, ry * 0.11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(186, 230, 253, 0.55)';
  ctx.beginPath();
  ctx.arc(ry * 0.22, ry * 0.2, ry * 0.055, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = quality === 'performance' ? 1 : anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createHairTexture(
  baseHex: string,
  highlightHex: string,
  anisotropy = 4,
  quality: AvatarRenderQuality = 'ultra'
): THREE.CanvasTexture {
  const size = quality === 'performance' ? 128 : 256;
  const { canvas, ctx } = makeCanvas(size, size);

  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, baseHex);
  grad.addColorStop(0.45, highlightHex);
  grad.addColorStop(1, baseHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const step = quality === 'performance' ? 4 : 2;
  for (let x = 0; x < size; x += step) {
    ctx.strokeStyle = x % 4 === 0 ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.sin(x * 0.1) * 4, size);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.anisotropy = quality === 'performance' ? 1 : anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createMouthInteriorTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(128, 128);
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
  grad.addColorStop(0, '#180509');
  grad.addColorStop(0.55, '#3b0e18');
  grad.addColorStop(1, '#5d1c27');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createParticleSpriteTexture(): THREE.CanvasTexture {
  const size = 64;
  const { canvas, ctx } = makeCanvas(size, size);
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.28, 'rgba(125, 211, 252, 0.85)');
  grad.addColorStop(0.65, 'rgba(139, 92, 246, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createAvatarTextureSet(
  isFemale: boolean,
  anisotropy = 4,
  customFaceImg?: HTMLImageElement | null,
  customTraits?: CustomFaceTraits,
  quality: AvatarRenderQuality = 'ultra'
): AvatarTextureSet {
  const hairBase = sanitizeHex(customTraits?.hairHex, isFemale ? '#1a233a' : '#1b2234');
  const eyePrimary = sanitizeHex(customTraits?.eyeHex, isFemale ? '#0ea5e9' : '#2563eb');
  const eyeInner = customTraits?.eyeHex ? '#94a3b8' : isFemale ? '#67e8f9' : '#93c5fd';

  return {
    skin: customFaceImg
      ? createCustomFaceSkinTexture(customFaceImg, customTraits, anisotropy, quality)
      : createSkinTexture(isFemale, anisotropy, customTraits?.skinHex, quality),
    eye: createEyeTexture(eyePrimary, eyeInner, anisotropy, quality),
    hair: createHairTexture(
      hairBase,
      customTraits?.hairHex ? '#334155' : isFemale ? '#2d3f63' : '#2a3754',
      anisotropy,
      quality
    ),
    mouthInterior: createMouthInteriorTexture(),
    particle: createParticleSpriteTexture(),
  };
}
