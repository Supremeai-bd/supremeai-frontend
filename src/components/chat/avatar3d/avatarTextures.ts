import * as THREE from 'three';

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

/**
 * Generates an equirectangular UV skin texture aligned for SphereGeometry
 * after `rotateY(-Math.PI / 2)` so u=0.5, v=0.5 faces +Z (front of face).
 */
export function createSkinTexture(
  isFemale: boolean,
  anisotropy = 4
): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const { canvas, ctx } = makeCanvas(w, h);

  // Base warm-natural translucent skin tone with subtle cool rim depth
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

  // Gentle facial center luminance glow (u ~ 0.5, v ~ 0.48)
  const faceGlow = ctx.createRadialGradient(w * 0.5, h * 0.48, 12, w * 0.5, h * 0.48, w * 0.24);
  faceGlow.addColorStop(0, 'rgba(255, 245, 238, 0.34)');
  faceGlow.addColorStop(0.6, 'rgba(255, 236, 224, 0.14)');
  faceGlow.addColorStop(1, 'rgba(220, 185, 175, 0)');
  ctx.fillStyle = faceGlow;
  ctx.fillRect(0, 0, w, h);

  // Rosy cheek blush gradients aligned symmetrically around center front
  const drawCheekBlush = (cx: number, cy: number) => {
    const blush = ctx.createRadialGradient(cx, cy, 4, cx, cy, 56);
    blush.addColorStop(0, isFemale ? 'rgba(236, 118, 128, 0.24)' : 'rgba(216, 118, 112, 0.15)');
    blush.addColorStop(0.6, 'rgba(232, 125, 130, 0.08)');
    blush.addColorStop(1, 'rgba(232, 125, 130, 0)');
    ctx.fillStyle = blush;
    ctx.beginPath();
    ctx.arc(cx, cy, 56, 0, Math.PI * 2);
    ctx.fill();
  };
  drawCheekBlush(w * 0.435, h * 0.545);
  drawCheekBlush(w * 0.565, h * 0.545);

  // Soft orbital eye socket shading so eyes sit naturally framed
  const drawSocketShade = (cx: number, cy: number) => {
    const shade = ctx.createRadialGradient(cx, cy, 6, cx, cy, 34);
    shade.addColorStop(0, 'rgba(130, 92, 92, 0.26)');
    shade.addColorStop(0.65, 'rgba(155, 112, 108, 0.12)');
    shade.addColorStop(1, 'rgba(155, 112, 108, 0)');
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();
  };
  drawSocketShade(w * 0.456, h * 0.466);
  drawSocketShade(w * 0.544, h * 0.466);

  // Subtle nasal bridge highlight
  const noseGrad = ctx.createLinearGradient(w * 0.5, h * 0.44, w * 0.5, h * 0.56);
  noseGrad.addColorStop(0, 'rgba(255, 250, 245, 0.18)');
  noseGrad.addColorStop(0.8, 'rgba(255, 248, 240, 0.28)');
  noseGrad.addColorStop(1, 'rgba(255, 248, 240, 0)');
  ctx.fillStyle = noseGrad;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.505, 10, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle lip-zone natural warmth (lips themselves have dedicated 3D geometry, this blends border)
  const lipBorder = ctx.createRadialGradient(w * 0.5, h * 0.615, 4, w * 0.5, h * 0.615, 38);
  lipBorder.addColorStop(0, 'rgba(195, 92, 98, 0.22)');
  lipBorder.addColorStop(1, 'rgba(195, 92, 98, 0)');
  ctx.fillStyle = lipBorder;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.615, 38, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ultra-fine organic skin micro-variation (deterministic pseudo-noise)
  ctx.fillStyle = 'rgba(160, 120, 105, 0.035)';
  for (let i = 0; i < 1600; i++) {
    const px = ((i * 733) % 997) / 997 * w;
    const py = ((i * 419 + 17) % 509) / 509 * h;
    ctx.fillRect(px, py, 1.5, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates an eye sphere texture calibrated so u=0.5, v=0.5 (+Z after rotateY(-PI/2))
 * renders a crisp, detailed human iris, radial fibers, collarette, dark limbus, and sclera.
 */
export function createEyeTexture(
  irisPrimaryHex: string,
  irisInnerHex: string,
  anisotropy = 4
): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const { canvas, ctx } = makeCanvas(w, h);

  // Sclera base with warm realistic outer shading
  const scleraGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 38, w * 0.5, h * 0.5, w * 0.48);
  scleraGrad.addColorStop(0, '#fcfdfd');
  scleraGrad.addColorStop(0.5, '#f2f5f8');
  scleraGrad.addColorStop(0.85, '#dde3eb');
  scleraGrad.addColorStop(1, '#c5cfdb');
  ctx.fillStyle = scleraGrad;
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.5;
  const cy = h * 0.5;
  // Because equirectangular SphereGeometry stretches horizontally near equator (2:1 aspect),
  // draw iris slightly narrower in X (rx/ry ~ 0.62) so it projects as a crisp circle onto the sphere.
  const rx = 44;
  const ry = 70;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(rx / ry, 1);

  // Dark outer limbal ring
  const limbusGrad = ctx.createRadialGradient(0, 0, ry * 0.35, 0, 0, ry * 1.04);
  limbusGrad.addColorStop(0, irisInnerHex);
  limbusGrad.addColorStop(0.68, irisPrimaryHex);
  limbusGrad.addColorStop(0.9, '#0f172a');
  limbusGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = limbusGrad;
  ctx.beginPath();
  ctx.arc(0, 0, ry * 1.04, 0, Math.PI * 2);
  ctx.fill();

  // 72 Radial Iris Fibers for lifelike depth
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

  // Luminous iris collarette ring around pupil
  ctx.strokeStyle = irisInnerHex;
  ctx.lineWidth = 3.2;
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.arc(0, 0, ry * 0.44, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Deep pupil
  const pupilGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, ry * 0.36);
  pupilGrad.addColorStop(0, '#020409');
  pupilGrad.addColorStop(0.85, '#070b14');
  pupilGrad.addColorStop(1, 'rgba(7, 11, 20, 0)');
  ctx.fillStyle = pupilGrad;
  ctx.beginPath();
  ctx.arc(0, 0, ry * 0.36, 0, Math.PI * 2);
  ctx.fill();

  // Subtle baked corneal micro-catchlights (augmented in 3D by real physical clearcoat cornea)
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
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createHairTexture(
  baseHex: string,
  highlightHex: string,
  anisotropy = 4
): THREE.CanvasTexture {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size, size);

  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, baseHex);
  grad.addColorStop(0.45, highlightHex);
  grad.addColorStop(1, baseHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  for (let x = 0; x < size; x += 2) {
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
  tex.anisotropy = anisotropy;
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
  anisotropy = 4
): AvatarTextureSet {
  return {
    skin: createSkinTexture(isFemale, anisotropy),
    eye: createEyeTexture(
      isFemale ? '#0ea5e9' : '#2563eb',
      isFemale ? '#67e8f9' : '#93c5fd',
      anisotropy
    ),
    hair: createHairTexture(
      isFemale ? '#1a233a' : '#1b2234',
      isFemale ? '#2d3f63' : '#2a3754',
      anisotropy
    ),
    mouthInterior: createMouthInteriorTexture(),
    particle: createParticleSpriteTexture(),
  };
}
