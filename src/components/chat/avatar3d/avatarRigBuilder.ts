import * as THREE from 'three';
import { createAvatarTextureSet, type AvatarTextureSet } from './avatarTextures';
import type { CustomFaceTraits } from '../../../utils/hologramAvatar';

export interface AvatarPoseInput {
  elapsed: number;
  dt: number;
  speakEnergy: number;
  listenEnergy: number;
  lookX: number;
  lookY: number;
  blinkAmount: number;
  jawOpen: number;
  visemeOh: number;
  smileAmount: number;
  browRaise: number;
  browAsym: number;
  browKnit?: number;
  eyeSquint?: number;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  bodyBreath: number;
  accentColor: THREE.Color;
  isMuted: boolean;
  isConnecting: boolean;
}

export interface ArticulatedAvatarRig {
  root: THREE.Group;
  applyPose: (pose: AvatarPoseInput) => void;
  dispose: () => void;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / Math.max(1e-5, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Builds a tapered 3D tube along a CatmullRomCurve3 so lips & eyebrows have
 * organic thick centers and finely tapered tips/corners instead of uniform sausages.
 */
function createTaperedTubeGeometry(
  points: THREE.Vector3[],
  tubularSegments: number,
  radialSegments: number,
  radiusFn: (t: number) => number
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const vertexCount = (tubularSegments + 1) * (radialSegments + 1);
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices: number[] = [];

  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3();
  const normal = new THREE.Vector3();

  let vIdx = 0;
  let uvIdx = 0;

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    curve.getPointAt(t, P);
    N.copy(frames.normals[i]);
    B.copy(frames.binormals[i]);
    const r = Math.max(0.0005, radiusFn(t));

    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(v);
      const cos = -Math.cos(v);

      normal.x = cos * N.x + sin * B.x;
      normal.y = cos * N.y + sin * B.y;
      normal.z = cos * N.z + sin * B.z;
      normal.normalize();

      positions[vIdx] = P.x + r * normal.x;
      positions[vIdx + 1] = P.y + r * normal.y;
      positions[vIdx + 2] = P.z + r * normal.z;

      normals[vIdx] = normal.x;
      normals[vIdx + 1] = normal.y;
      normals[vIdx + 2] = normal.z;

      uvs[uvIdx] = t;
      uvs[uvIdx + 1] = j / radialSegments;

      vIdx += 3;
      uvIdx += 2;
    }
  }

  for (let j = 1; j <= tubularSegments; j++) {
    for (let i = 1; i <= radialSegments; i++) {
      const a = (radialSegments + 1) * (j - 1) + (i - 1);
      const b = (radialSegments + 1) * j + (i - 1);
      const c = (radialSegments + 1) * j + i;
      const d = (radialSegments + 1) * (j - 1) + i;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setIndex(indices);
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return geo;
}

/**
 * Sculpts the head sphere into realistic human cranial proportions with:
 * - tapered jawline & chin (female softer V-taper vs male defined mandible)
 * - brow ridge & cheekbones
 * - carved orbital eye sockets so 3D spherical eyeballs nestle cleanly inside
 * - sculpted nasal bridge, tip & wings
 * - recessed 3D oral cavity pocket behind the lips
 * Plus 3 vertex morph targets: [0]=jawOpen, [1]=smile, [2]=visemeOh
 */
function buildSculptedHeadGeometry(isFemale: boolean): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 88, 68);
  // Orient SphereGeometry so u=0.5 faces +Z (forward)
  geo.rotateY(-Math.PI / 2);

  const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
  const count = posAttr.count;

  const jawDelta = new Float32Array(count * 3);
  const smileDelta = new Float32Array(count * 3);
  const ohDelta = new Float32Array(count * 3);

  const scaleX = isFemale ? 0.445 : 0.472;
  const scaleY = 0.552;
  const scaleZ = 0.492;

  for (let i = 0; i < count; i++) {
    const ux = posAttr.getX(i);
    const uy = posAttr.getY(i);
    const uz = posAttr.getZ(i);

    // Base human oval proportions
    let x = ux * scaleX;
    let y = uy * scaleY;
    let z = uz * scaleZ;

    // Jawline & chin taper below midline
    if (y < -0.04) {
      const jawFactor = smoothstep(-0.04, -0.55, y);
      const taperX = isFemale ? 1 - jawFactor * 0.34 : 1 - jawFactor * 0.21;
      x *= taperX;

      if (uz > 0.05) {
        // Gentle forward chin prominence
        const chinSpot = Math.exp(
          -(x * x / (isFemale ? 0.018 : 0.025) + Math.pow(y + 0.37, 2) / 0.015)
        );
        z += chinSpot * (isFemale ? 0.032 : 0.046);
      }
      // Subtle under-chin tuck
      if (uz < 0.25 && y < -0.26) {
        y += smoothstep(-0.26, -0.55, y) * 0.055 * (1 - Math.max(0, uz));
      }
    }

    // Cranial temple hollow for sculpted cheekbones
    if (uz > -0.15) {
      const templeL = Math.exp(-(Math.pow(x + 0.31, 2) / 0.014 + Math.pow(y - 0.14, 2) / 0.022));
      const templeR = Math.exp(-(Math.pow(x - 0.31, 2) / 0.014 + Math.pow(y - 0.14, 2) / 0.022));
      x -= Math.sign(x) * (templeL + templeR) * 0.022;
    }

    if (uz > 0.12) {
      // Zygomatic cheekbones
      const cheekL = Math.exp(-(Math.pow(x + 0.21, 2) / 0.014 + Math.pow(y + 0.03, 2) / 0.014));
      const cheekR = Math.exp(-(Math.pow(x - 0.21, 2) / 0.014 + Math.pow(y + 0.03, 2) / 0.014));
      z += (cheekL + cheekR) * (isFemale ? 0.028 : 0.024);

      // Brow ridge prominence
      const browBar = Math.exp(-(x * x / 0.055 + Math.pow(y - 0.175, 2) / 0.0045));
      z += browBar * (isFemale ? 0.02 : 0.034);

      // Carved Orbital Eye Sockets centered at (±0.156, 0.077)
      const dEyeL = Math.hypot((x + 0.156) / 0.088, (y - 0.077) / 0.072);
      const dEyeR = Math.hypot((x - 0.156) / 0.088, (y - 0.077) / 0.072);
      const socketMask = Math.max(
        1 - smoothstep(0.32, 1.08, dEyeL),
        1 - smoothstep(0.32, 1.08, dEyeR)
      );
      z -= socketMask * 0.078;

      // Sculpted Nasal Bridge + Nasal Tip + Nostril Wings
      const bridgeProfile =
        Math.exp(-(x * x / 0.0028)) *
        smoothstep(0.15, 0.02, y) *
        smoothstep(-0.115, -0.02, y);
      const tipProfile = Math.exp(
        -(x * x / 0.0036 + Math.pow(y + 0.048, 2) / 0.0028)
      );
      const nostrilL = Math.exp(
        -(Math.pow(x + 0.04, 2) / 0.0011 + Math.pow(y + 0.068, 2) / 0.0012)
      );
      const nostrilR = Math.exp(
        -(Math.pow(x - 0.04, 2) / 0.0011 + Math.pow(y + 0.068, 2) / 0.0012)
      );
      z +=
        bridgeProfile * 0.056 +
        tipProfile * (isFemale ? 0.078 : 0.088) +
        (nostrilL + nostrilR) * 0.032;

      // Subtle philtrum groove below nose
      const philtrum = Math.exp(-(x * x / 0.0005 + Math.pow(y + 0.122, 2) / 0.0014));
      z -= philtrum * 0.012;

      // Subtle recessed mouth seam centered at (0, -0.178)
      const mouthDist = Math.hypot(x / 0.082, (y + 0.178) / 0.018);
      const mouthPocket = 1 - smoothstep(0.45, 1.05, mouthDist);
      z -= mouthPocket * 0.045;

      // --- Morph Target 0: jawOpen (drops lower lip border, mandible & chin smoothly) ---
      const chinDropMask =
        smoothstep(-0.168, -0.225, y) *
        smoothstep(0.12, 0.45, uz) *
        (1 - smoothstep(0.18, 0.34, Math.abs(x)));
      jawDelta[i * 3] = 0;
      jawDelta[i * 3 + 1] = -0.095 * chinDropMask;
      jawDelta[i * 3 + 2] = -0.022 * chinDropMask;

      // --- Morph Target 1: smile (lifts lateral mouth corners & cheek apples) ---
      const cornerZone =
        Math.exp(-(Math.pow(Math.abs(x) - 0.095, 2) / 0.0032 + Math.pow(y + 0.176, 2) / 0.0022));
      const cheekApple =
        Math.exp(-(Math.pow(Math.abs(x) - 0.18, 2) / 0.007 + Math.pow(y + 0.05, 2) / 0.005));
      smileDelta[i * 3] = Math.sign(x) * (cornerZone * 0.016);
      smileDelta[i * 3 + 1] = cornerZone * 0.022 + cheekApple * 0.016;
      smileDelta[i * 3 + 2] = cornerZone * 0.01 + cheekApple * 0.014;

      // --- Morph Target 2: visemeOh (purses perioral region slightly forward & inward) ---
      const ohZone = Math.exp(-(x * x / 0.012 + Math.pow(y + 0.178, 2) / 0.004));
      ohDelta[i * 3] = -x * ohZone * 0.22;
      ohDelta[i * 3 + 1] = 0;
      ohDelta[i * 3 + 2] = ohZone * 0.024;
    }

    posAttr.setXYZ(i, x, y, z);
  }

  geo.morphAttributes.position = [
    new THREE.BufferAttribute(jawDelta, 3),
    new THREE.BufferAttribute(smileDelta, 3),
    new THREE.BufferAttribute(ohDelta, 3),
  ];
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds one articulated 3D eye assembly (rotatable eyeball + clearcoat cornea +
 * upper/lower closing eyelids + delicate upper lash rim).
 */
function buildEyeAssembly(
  side: -1 | 1,
  eyeMat: THREE.MeshStandardMaterial,
  corneaMat: THREE.MeshPhysicalMaterial,
  eyelidMat: THREE.MeshStandardMaterial,
  lashMat: THREE.MeshStandardMaterial,
  disposables: { geometries: THREE.BufferGeometry[] }
) {
  const eyeSocketGroup = new THREE.Group();
  eyeSocketGroup.position.set(side * 0.156, 0.077, 0.405);

  // Inner gaze pivot rotates for cursor tracking & natural saccades
  const gazePivot = new THREE.Group();
  eyeSocketGroup.add(gazePivot);

  const eyeballGeo = new THREE.SphereGeometry(0.068, 36, 28);
  // Orient eyeball so iris at u=0.5, v=0.5 points straight +Z
  eyeballGeo.rotateY(-Math.PI / 2);
  disposables.geometries.push(eyeballGeo);
  const eyeballMesh = new THREE.Mesh(eyeballGeo, eyeMat);
  gazePivot.add(eyeballMesh);

  // Glossy clearcoat cornea dome over eyeball
  const corneaGeo = new THREE.SphereGeometry(0.0702, 32, 24);
  disposables.geometries.push(corneaGeo);
  const corneaMesh = new THREE.Mesh(corneaGeo, corneaMat);
  gazePivot.add(corneaMesh);

  // Upper eyelid hemispherical shell (rotates downward around X to close eye cleanly)
  const upperLidPivot = new THREE.Group();
  eyeSocketGroup.add(upperLidPivot);

  const upperLidGeo = new THREE.SphereGeometry(
    0.0735,
    32,
    18,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.52
  );
  disposables.geometries.push(upperLidGeo);
  const upperLidMesh = new THREE.Mesh(upperLidGeo, eyelidMat);
  upperLidPivot.add(upperLidMesh);

  // Subtle dark eyelash rim along lower edge of upper eyelid
  const lashGeo = new THREE.TorusGeometry(0.0742, 0.0032, 8, 28, Math.PI * 0.84);
  disposables.geometries.push(lashGeo);
  const lashMesh = new THREE.Mesh(lashGeo, lashMat);
  lashMesh.rotation.x = Math.PI / 2;
  lashMesh.rotation.z = -Math.PI * 0.92;
  lashMesh.position.y = -0.002;
  upperLidPivot.add(lashMesh);

  // Lower eyelid shell (subtle lift during blinks & Duchenne smiles)
  const lowerLidPivot = new THREE.Group();
  eyeSocketGroup.add(lowerLidPivot);

  const lowerLidGeo = new THREE.SphereGeometry(
    0.0728,
    32,
    14,
    0,
    Math.PI * 2,
    Math.PI * 0.56,
    Math.PI * 0.44
  );
  disposables.geometries.push(lowerLidGeo);
  const lowerLidMesh = new THREE.Mesh(lowerLidGeo, eyelidMat);
  lowerLidPivot.add(lowerLidMesh);

  return {
    socketGroup: eyeSocketGroup,
    gazePivot,
    upperLidPivot,
    lowerLidPivot,
  };
}

export interface AvatarRigOptions {
  isFemale?: boolean;
  maxAnisotropy?: number;
  customFaceImg?: HTMLImageElement | null;
  customTraits?: CustomFaceTraits;
}

function sanitizeColorHex(hex: string | undefined, fallback: number): number {
  if (!hex) return fallback;
  const cleaned = hex.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(cleaned)) return fallback;
  return parseInt(cleaned.slice(1), 16);
}

/**
 * Creates a complete, expressive, animated 3D humanoid avatar bust with:
 * - Sculpted head, cheekbones, nose, ears, hair silhouette, anatomical torso & collar
 * - Moving 3D eyeballs with radial irises & clearcoat corneas tracking pointer + saccades
 * - Natural blinking upper & lower 3D eyelids + eyelashes
 * - Articulated 3D eyebrows reacting to speech stress, listening, & thinking
 * - Pivoted 3D jaw + Cupid's-bow upper lip + lower lip + inner teeth/tongue + morph targets
 * - Optional 3D glasses and face-matched custom portrait skin projection
 */
export function createArticulatedAvatarRig(
  isFemaleOrOptions: boolean | AvatarRigOptions,
  maxAnisotropyArg = 4
): ArticulatedAvatarRig {
  const options: AvatarRigOptions =
    typeof isFemaleOrOptions === 'boolean'
      ? { isFemale: isFemaleOrOptions, maxAnisotropy: maxAnisotropyArg }
      : isFemaleOrOptions;

  const customTraits = options.customTraits;
  const customFaceImg = options.customFaceImg ?? null;
  const isFemale =
    options.isFemale ?? (customTraits?.genderCue === 'female');
  const maxAnisotropy = options.maxAnisotropy ?? maxAnisotropyArg;

  const disposables = {
    geometries: [] as THREE.BufferGeometry[],
    materials: [] as THREE.Material[],
    textures: [] as THREE.Texture[],
  };

  const textures: AvatarTextureSet = createAvatarTextureSet(
    isFemale,
    maxAnisotropy,
    customFaceImg,
    customTraits
  );
  disposables.textures.push(
    textures.skin,
    textures.eye,
    textures.hair,
    textures.mouthInterior,
    textures.particle
  );

  // --- Shared PBR Materials ---
  const skinMat = new THREE.MeshPhysicalMaterial({
    map: textures.skin,
    roughness: 0.46,
    metalness: 0.02,
    clearcoat: 0.14,
    clearcoatRoughness: 0.48,
    sheen: 0.35,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color(isFemale ? 0xffe4e6 : 0xe0f2fe),
  });

  const eyeMat = new THREE.MeshStandardMaterial({
    map: textures.eye,
    roughness: 0.16,
    metalness: 0.02,
  });

  const corneaMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.24,
    roughness: 0.03,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    reflectivity: 1.0,
    depthWrite: false,
  });

  const lashMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.65,
    metalness: 0.05,
  });

  const browMat = new THREE.MeshStandardMaterial({
    color: sanitizeColorHex(customTraits?.hairHex, isFemale ? 0x1e293b : 0x172033),
    roughness: 0.58,
    metalness: 0.08,
  });

  const upperLipMat = new THREE.MeshPhysicalMaterial({
    color: sanitizeColorHex(customTraits?.lipHex, isFemale ? 0xc85d6c : 0xb36c6c),
    roughness: 0.32,
    metalness: 0.02,
    clearcoat: 0.38,
    clearcoatRoughness: 0.26,
  });

  const lowerLipMat = new THREE.MeshPhysicalMaterial({
    color: sanitizeColorHex(customTraits?.lipHex, isFemale ? 0xd46a79 : 0xbd7676),
    roughness: 0.28,
    metalness: 0.02,
    clearcoat: 0.45,
    clearcoatRoughness: 0.22,
  });

  const teethMat = new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    roughness: 0.18,
    metalness: 0.02,
    clearcoat: 0.7,
    clearcoatRoughness: 0.15,
  });

  const tongueMat = new THREE.MeshStandardMaterial({
    color: 0xb95360,
    roughness: 0.42,
    metalness: 0.0,
  });

  const mouthInnerMat = new THREE.MeshStandardMaterial({
    map: textures.mouthInterior,
    roughness: 0.85,
    metalness: 0.0,
  });

  const hairMat = new THREE.MeshPhysicalMaterial({
    map: textures.hair,
    roughness: 0.34,
    metalness: 0.12,
    clearcoat: 0.42,
    clearcoatRoughness: 0.28,
    sheen: 0.65,
    sheenColor: new THREE.Color(0x38bdf8),
    sheenRoughness: 0.4,
  });

  const suitMat = new THREE.MeshPhysicalMaterial({
    color: isFemale ? 0x13203b : 0x111c33,
    roughness: 0.34,
    metalness: 0.28,
    clearcoat: 0.35,
    clearcoatRoughness: 0.28,
  });

  const accentGlowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: new THREE.Color(0x22d3ee),
    emissiveIntensity: 1.35,
    roughness: 0.2,
    metalness: 0.2,
  });

  disposables.materials.push(
    skinMat,
    eyeMat,
    corneaMat,
    lashMat,
    browMat,
    upperLipMat,
    lowerLipMat,
    teethMat,
    tongueMat,
    mouthInnerMat,
    hairMat,
    suitMat,
    accentGlowMat
  );

  // --- Root Rig Hierarchy ---
  const root = new THREE.Group();
  root.position.set(0, -0.05, 0);

  // 1. Torso & Shoulders
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, -0.62, -0.02);
  root.add(torsoGroup);

  const shoulderWidth = isFemale ? 0.68 : 0.79;
  const torsoProfile = [
    new THREE.Vector2(0.01, -0.42),
    new THREE.Vector2(shoulderWidth * 0.72, -0.40),
    new THREE.Vector2(shoulderWidth * 0.84, -0.18),
    new THREE.Vector2(shoulderWidth, -0.02),
    new THREE.Vector2(shoulderWidth * 0.56, 0.14),
    new THREE.Vector2(0.24, 0.20),
    new THREE.Vector2(0.01, 0.20),
  ];
  const torsoGeo = new THREE.LatheGeometry(torsoProfile, 48);
  torsoGeo.scale(1.0, 1.0, 0.52);
  disposables.geometries.push(torsoGeo);
  const torsoMesh = new THREE.Mesh(torsoGeo, suitMat);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torsoGroup.add(torsoMesh);

  // Sleek illuminated collar ring framing neck
  const collarGeo = new THREE.TorusGeometry(0.235, 0.014, 14, 48);
  collarGeo.rotateX(Math.PI / 2 - 0.12);
  collarGeo.scale(1.05, 1.0, 0.86);
  disposables.geometries.push(collarGeo);
  const collarTrim = new THREE.Mesh(collarGeo, accentGlowMat);
  collarTrim.position.set(0, 0.19, 0.03);
  torsoGroup.add(collarTrim);

  // Luminous holographic core emblem on chest
  const chestCoreGeo = new THREE.TorusGeometry(0.052, 0.007, 12, 32);
  disposables.geometries.push(chestCoreGeo);
  const chestCore = new THREE.Mesh(chestCoreGeo, accentGlowMat);
  chestCore.position.set(0, -0.06, isFemale ? 0.345 : 0.39);
  chestCore.rotation.x = -0.18;
  torsoGroup.add(chestCore);

  // 2. Neck Pivot
  const neckGroup = new THREE.Group();
  neckGroup.position.set(0, 0.16, 0.01);
  torsoGroup.add(neckGroup);

  const neckRadiusTop = isFemale ? 0.155 : 0.182;
  const neckRadiusBottom = isFemale ? 0.185 : 0.215;
  const neckGeo = new THREE.CylinderGeometry(neckRadiusTop, neckRadiusBottom, 0.34, 36);
  neckGeo.scale(1.0, 1.0, 0.92);
  disposables.geometries.push(neckGeo);
  const neckMesh = new THREE.Mesh(neckGeo, skinMat);
  neckMesh.position.set(0, 0.16, -0.02);
  neckMesh.castShadow = true;
  neckMesh.receiveShadow = true;
  neckGroup.add(neckMesh);

  // 3. Head Pivot (at C1 skull base)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.54, 0.02);
  neckGroup.add(headGroup);

  const headGeo = buildSculptedHeadGeometry(isFemale);
  disposables.geometries.push(headGeo);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  headGroup.add(headMesh);

  // Dark inner mouth backing shell tucked neatly behind closed lips
  const oralBackingGeo = new THREE.SphereGeometry(0.11, 20, 16);
  oralBackingGeo.scale(0.82, 0.44, 0.35);
  disposables.geometries.push(oralBackingGeo);
  const oralBackingMesh = new THREE.Mesh(oralBackingGeo, mouthInnerMat);
  oralBackingMesh.position.set(0, -0.178, 0.335);
  headGroup.add(oralBackingMesh);

  // 4. Sculpted Ears
  const earGeo = new THREE.SphereGeometry(0.082, 20, 16);
  earGeo.scale(0.36, 1.05, 0.65);
  disposables.geometries.push(earGeo);
  const leftEar = new THREE.Mesh(earGeo, skinMat);
  leftEar.position.set(isFemale ? -0.435 : -0.46, -0.01, -0.01);
  leftEar.rotation.z = 0.14;
  leftEar.rotation.y = -0.22;
  headGroup.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, skinMat);
  rightEar.position.set(isFemale ? 0.435 : 0.46, -0.01, -0.01);
  rightEar.rotation.z = -0.14;
  rightEar.rotation.y = 0.22;
  headGroup.add(rightEar);

  // 5. Eyes (moving eyeballs + clearcoat cornea + blinking eyelids + lashes)
  const leftEye = buildEyeAssembly(-1, eyeMat, corneaMat, skinMat, lashMat, disposables);
  const rightEye = buildEyeAssembly(1, eyeMat, corneaMat, skinMat, lashMat, disposables);
  headGroup.add(leftEye.socketGroup, rightEye.socketGroup);

  // 6. Articulated 3D Eyebrows
  const buildBrowMesh = (side: -1 | 1): THREE.Mesh => {
    const pts = [
      new THREE.Vector3(side * -0.072, -0.008, -0.012),
      new THREE.Vector3(side * -0.025, 0.012, 0.008),
      new THREE.Vector3(side * 0.028, 0.014, 0.006),
      new THREE.Vector3(side * 0.076, -0.01, -0.022),
    ];
    const geo = createTaperedTubeGeometry(pts, 20, 8, (t) => {
      const taper = Math.sin(Math.pow(t, 0.85) * Math.PI);
      return (isFemale ? 0.0095 : 0.0135) * (0.35 + 0.65 * taper);
    });
    disposables.geometries.push(geo);
    const mesh = new THREE.Mesh(geo, browMat);
    mesh.position.set(side * 0.158, 0.172, 0.456);
    mesh.rotation.y = side * 0.22;
    return mesh;
  };
  const leftBrow = buildBrowMesh(-1);
  const rightBrow = buildBrowMesh(1);
  headGroup.add(leftBrow, rightBrow);

  // 7. Articulated 3D Lips, Jaw Pivot, Upper/Lower Teeth & Tongue
  const upperLipGeo = createTaperedTubeGeometry(
    [
      new THREE.Vector3(-0.086, -0.007, -0.028),
      new THREE.Vector3(-0.048, 0.001, -0.008),
      new THREE.Vector3(-0.019, 0.006, 0.004), // Left Cupid's peak
      new THREE.Vector3(0.0, 0.002, 0.006), // Central bow dip
      new THREE.Vector3(0.019, 0.006, 0.004), // Right Cupid's peak
      new THREE.Vector3(0.048, 0.001, -0.008),
      new THREE.Vector3(0.086, -0.007, -0.028),
    ],
    32,
    12,
    (t) => {
      const env = Math.sin(t * Math.PI);
      return (isFemale ? 0.0125 : 0.011) * (0.24 + 0.76 * Math.pow(env, 0.75));
    }
  );
  disposables.geometries.push(upperLipGeo);
  const upperLipPivot = new THREE.Group();
  upperLipPivot.position.set(0, -0.171, 0.456);
  headGroup.add(upperLipPivot);
  const upperLipMesh = new THREE.Mesh(upperLipGeo, upperLipMat);
  upperLipMesh.scale.set(1, 0.86, 0.85);
  upperLipPivot.add(upperLipMesh);

  // Upper teeth arc tucked cleanly behind upper lip
  const upperTeethGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.022, 24, 1, true, -0.76, 1.52);
  disposables.geometries.push(upperTeethGeo);
  const upperTeethMesh = new THREE.Mesh(upperTeethGeo, teethMat);
  upperTeethMesh.position.set(0, -0.171, 0.362);
  headGroup.add(upperTeethMesh);

  // Pivoted Jaw Group at condyle axis
  const jawGroup = new THREE.Group();
  jawGroup.position.set(0, -0.11, 0.14);
  headGroup.add(jawGroup);

  const lowerLipGeo = createTaperedTubeGeometry(
    [
      new THREE.Vector3(-0.082, 0.005, -0.026),
      new THREE.Vector3(-0.044, -0.004, -0.004),
      new THREE.Vector3(0.0, -0.007, 0.005),
      new THREE.Vector3(0.044, -0.004, -0.004),
      new THREE.Vector3(0.082, 0.005, -0.026),
    ],
    28,
    12,
    (t) => {
      const env = Math.sin(t * Math.PI);
      return (isFemale ? 0.0145 : 0.013) * (0.22 + 0.78 * Math.pow(env, 0.7));
    }
  );
  disposables.geometries.push(lowerLipGeo);
  const lowerLipPivot = new THREE.Group();
  lowerLipPivot.position.set(0, -0.069, 0.314);
  jawGroup.add(lowerLipPivot);
  const lowerLipMesh = new THREE.Mesh(lowerLipGeo, lowerLipMat);
  lowerLipMesh.scale.set(1, 0.86, 0.88);
  lowerLipPivot.add(lowerLipMesh);

  // Lower teeth & tongue inside jaw
  const lowerTeethGeo = new THREE.CylinderGeometry(0.066, 0.066, 0.022, 22, 1, true, -0.74, 1.48);
  disposables.geometries.push(lowerTeethGeo);
  const lowerTeethMesh = new THREE.Mesh(lowerTeethGeo, teethMat);
  lowerTeethMesh.position.set(0, -0.072, 0.228);
  jawGroup.add(lowerTeethMesh);

  const tongueGeo = new THREE.SphereGeometry(0.048, 20, 14);
  tongueGeo.scale(1.0, 0.38, 1.25);
  disposables.geometries.push(tongueGeo);
  const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
  tongueMesh.position.set(0, -0.088, 0.24);
  jawGroup.add(tongueMesh);

  // 8. Architectural Hair Silhouette (Female layered swept bob vs Male modern crest)
  const hairGroup = new THREE.Group();
  headGroup.add(hairGroup);

  const useLongHair = customTraits?.hairStyle
    ? customTraits.hairStyle === 'long'
    : isFemale;

  if (useLongHair) {
    // Sleek crown cap tilted BACKWARD (-0.42 rad) so front hairline sits high above forehead
    const hairCapGeo = new THREE.SphereGeometry(1, 56, 40, 0, Math.PI * 2, 0, Math.PI * 0.5);
    hairCapGeo.scale(0.482, 0.575, 0.525);
    disposables.geometries.push(hairCapGeo);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.position.set(0, 0.065, -0.055);
    hairCap.rotation.x = -0.42;
    hairCap.castShadow = true;
    hairGroup.add(hairCap);

    // Swept side-locks framing outer temples, cheeks & jawline cleanly
    [-1, 1].forEach((side) => {
      const lockPts = [
        new THREE.Vector3(side * 0.16, 0.54, 0.02),
        new THREE.Vector3(side * 0.44, 0.35, 0.08),
        new THREE.Vector3(side * 0.48, 0.02, 0.06),
        new THREE.Vector3(side * 0.44, -0.34, 0.01),
        new THREE.Vector3(side * 0.34, -0.6, -0.08),
      ];
      const lockGeo = createTaperedTubeGeometry(lockPts, 28, 12, (t) => 0.084 * (0.45 + 0.55 * Math.sin(t * Math.PI * 0.92)));
      disposables.geometries.push(lockGeo);
      const lockMesh = new THREE.Mesh(lockGeo, hairMat);
      lockMesh.scale.set(0.55, 1.0, 1.15);
      lockMesh.castShadow = true;
      hairGroup.add(lockMesh);
    });

    // High swept side-parted hairline fringe well above eyebrows
    const fringePts = [
      new THREE.Vector3(-0.36, 0.32, 0.2),
      new THREE.Vector3(-0.14, 0.39, 0.31),
      new THREE.Vector3(0.08, 0.36, 0.33),
      new THREE.Vector3(0.3, 0.3, 0.25),
      new THREE.Vector3(0.42, 0.2, 0.12),
    ];
    const fringeGeo = createTaperedTubeGeometry(fringePts, 26, 10, (t) => 0.058 * (0.35 + 0.65 * Math.sin(t * Math.PI)));
    disposables.geometries.push(fringeGeo);
    const fringeMesh = new THREE.Mesh(fringeGeo, hairMat);
    hairGroup.add(fringeMesh);
  } else {
    // Sharp sculpted male crown tilted backward (-0.40 rad) + swept architectural crest
    const crownGeo = new THREE.SphereGeometry(1, 52, 36, 0, Math.PI * 2, 0, Math.PI * 0.48);
    crownGeo.scale(0.49, 0.572, 0.52);
    disposables.geometries.push(crownGeo);
    const crown = new THREE.Mesh(crownGeo, hairMat);
    crown.position.set(0, 0.075, -0.052);
    crown.rotation.x = -0.4;
    crown.castShadow = true;
    hairGroup.add(crown);

    // Sculpted swept front hair wave above forehead
    const crestPts = [
      new THREE.Vector3(-0.36, 0.34, 0.14),
      new THREE.Vector3(-0.14, 0.44, 0.27),
      new THREE.Vector3(0.08, 0.48, 0.29),
      new THREE.Vector3(0.28, 0.41, 0.21),
      new THREE.Vector3(0.4, 0.28, 0.08),
    ];
    const crestGeo = createTaperedTubeGeometry(crestPts, 26, 12, (t) => 0.072 * (0.35 + 0.65 * Math.sin(t * Math.PI)));
    disposables.geometries.push(crestGeo);
    const crestMesh = new THREE.Mesh(crestGeo, hairMat);
    crestMesh.castShadow = true;
    hairGroup.add(crestMesh);

    // Tapered temple sideburns
    [-1, 1].forEach((side) => {
      const sbPts = [
        new THREE.Vector3(side * 0.46, 0.22, 0.04),
        new THREE.Vector3(side * 0.47, 0.08, 0.06),
        new THREE.Vector3(side * 0.44, -0.04, 0.04),
      ];
      const sbGeo = createTaperedTubeGeometry(sbPts, 14, 8, (t) => 0.032 * (1 - t * 0.6));
      disposables.geometries.push(sbGeo);
      const sbMesh = new THREE.Mesh(sbGeo, hairMat);
      sbMesh.scale.set(0.45, 1, 1.2);
      hairGroup.add(sbMesh);
    });
  }

  // 9. Optional 3D Eyewear if detected on custom uploaded portrait
  if (customTraits?.hasGlasses) {
    const glassesMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.22,
      metalness: 0.72,
      clearcoat: 0.6,
    });
    disposables.materials.push(glassesMat);

    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.077, 0.486);
    headGroup.add(glassesGroup);

    const rimGeo = new THREE.TorusGeometry(0.086, 0.0085, 12, 36);
    rimGeo.scale(1.12, 0.88, 1);
    disposables.geometries.push(rimGeo);

    const leftRim = new THREE.Mesh(rimGeo, glassesMat);
    leftRim.position.set(-0.156, 0, -0.014);
    leftRim.rotation.y = -0.14;
    glassesGroup.add(leftRim);

    const rightRim = new THREE.Mesh(rimGeo, glassesMat);
    rightRim.position.set(0.156, 0, -0.014);
    rightRim.rotation.y = 0.14;
    glassesGroup.add(rightRim);

    const bridgeGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.125, 10);
    bridgeGeo.rotateZ(Math.PI / 2);
    disposables.geometries.push(bridgeGeo);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, glassesMat);
    bridgeMesh.position.set(0, 0.012, 0.004);
    glassesGroup.add(bridgeMesh);

    const armGeo = new THREE.CylinderGeometry(0.0055, 0.005, 0.44, 10);
    armGeo.rotateX(Math.PI / 2);
    disposables.geometries.push(armGeo);
    [-1, 1].forEach((side) => {
      const armMesh = new THREE.Mesh(armGeo, glassesMat);
      armMesh.position.set(side * 0.268, 0.012, -0.23);
      armMesh.rotation.y = side * -0.18;
      glassesGroup.add(armMesh);
    });
  }

  // Reusable morph targets array reference
  const morphs = headMesh.morphTargetInfluences || [0, 0, 0];

  const applyPose = (pose: AvatarPoseInput) => {
    const {
      speakEnergy,
      listenEnergy,
      lookX,
      lookY,
      blinkAmount,
      jawOpen,
      visemeOh,
      smileAmount,
      browRaise,
      browAsym,
      browKnit = 0,
      eyeSquint = 0,
      headYaw,
      headPitch,
      headRoll,
      bodyBreath,
      accentColor,
      isMuted,
      isConnecting,
    } = pose;

    // 1. Update status accent luminescence on collar trim & chest core
    accentGlowMat.color.copy(accentColor);
    accentGlowMat.emissive.copy(accentColor);
    accentGlowMat.emissiveIntensity = 0.85 + Math.max(speakEnergy, listenEnergy * 0.7) * 1.65;

    // 2. Subtle breathing torso & neck balance
    root.position.y = -0.05 + bodyBreath * 0.016;
    torsoGroup.rotation.y = headYaw * 0.22;
    torsoGroup.rotation.x = headPitch * 0.14;

    neckGroup.rotation.y = headYaw * 0.35;
    neckGroup.rotation.x = headPitch * 0.32;
    neckGroup.rotation.z = headRoll * 0.35;

    headGroup.rotation.y = headYaw * 0.65;
    headGroup.rotation.x = headPitch * 0.68;
    headGroup.rotation.z = headRoll * 0.65;

    // 3. Moving 3D Eyes & Eyelids (blinking, smile squint, muted rest)
    const eyeYaw = THREE.MathUtils.clamp(lookX * 0.38, -0.42, 0.42);
    const eyePitch = THREE.MathUtils.clamp(-lookY * 0.28, -0.32, 0.32);

    leftEye.gazePivot.rotation.y = eyeYaw;
    leftEye.gazePivot.rotation.x = eyePitch;
    rightEye.gazePivot.rotation.y = eyeYaw;
    rightEye.gazePivot.rotation.x = eyePitch;

    const effectiveBlink = isMuted ? Math.max(blinkAmount, 0.62) : blinkAmount;
    // Natural relaxed upper lid sits slightly over top iris edge (-0.46 rad), closed = +0.34 rad
    const gazeLidFollow = -eyePitch * 0.35;
    const upperOpenAngle =
      -0.46 + gazeLidFollow - listenEnergy * 0.08 + clamp01(eyeSquint) * 0.14;
    const upperClosedAngle = 0.34;
    const upperLidAngle = THREE.MathUtils.lerp(upperOpenAngle, upperClosedAngle, clamp01(effectiveBlink));

    const lowerOpenAngle =
      0.08 + gazeLidFollow * 0.25 - smileAmount * 0.12 - clamp01(eyeSquint) * 0.08;
    const lowerClosedAngle = -0.18;
    const lowerLidAngle = THREE.MathUtils.lerp(lowerOpenAngle, lowerClosedAngle, clamp01(effectiveBlink));

    leftEye.upperLidPivot.rotation.x = upperLidAngle;
    rightEye.upperLidPivot.rotation.x = upperLidAngle;
    leftEye.lowerLidPivot.rotation.x = lowerLidAngle;
    rightEye.lowerLidPivot.rotation.x = lowerLidAngle;

    // 4. Articulated Eyebrows (expressive raise + inquisitive/analytical knit)
    const browYBase = 0.172;
    const connectKnit = (isConnecting ? -0.008 : 0) - clamp01(browKnit) * 0.007;
    const analyticTilt = clamp01(browKnit) * 0.075;
    leftBrow.position.y = browYBase + browRaise * 0.022 + browAsym * 0.008 + connectKnit;
    rightBrow.position.y = browYBase + browRaise * 0.022 - browAsym * 0.008 + connectKnit;
    leftBrow.rotation.z =
      -browRaise * 0.08 - browAsym * 0.09 + (isConnecting ? -0.08 : 0) - analyticTilt;
    rightBrow.rotation.z =
      browRaise * 0.08 - browAsym * 0.09 + (isConnecting ? 0.08 : 0) + analyticTilt;

    // 5. Articulated Jaw, Lips, Teeth & Head Facial Morph Targets
    const safeJaw = clamp01(jawOpen);
    const safeOh = clamp01(visemeOh);
    const safeSmile = clamp01(smileAmount);

    if (morphs.length >= 3) {
      morphs[0] = safeJaw;
      morphs[1] = safeSmile;
      morphs[2] = safeOh;
    }

    // Jaw rotates smoothly open around condyle pivot
    jawGroup.rotation.x = safeJaw * 0.25;

    // Upper lip lifts subtly when speaking wide/smiling and rounds/protrudes on Oh
    upperLipPivot.position.y = -0.171 + safeJaw * 0.011 + safeSmile * 0.005;
    upperLipPivot.position.z = 0.456 + safeOh * 0.016;
    upperLipMesh.scale.set(
      1 + safeSmile * 0.09 - safeOh * 0.24,
      0.86 + safeOh * 0.18,
      0.85 + safeOh * 0.24
    );

    // Lower lip widens/smiles or purses into rounded O shape
    lowerLipPivot.position.z = 0.314 + safeOh * 0.016 - safeJaw * 0.006;
    lowerLipMesh.scale.set(
      1 + safeSmile * 0.08 - safeOh * 0.24,
      0.86 + safeOh * 0.16 + safeJaw * 0.12,
      0.88 + safeOh * 0.24
    );
  };

  const dispose = () => {
    disposables.geometries.forEach((g) => g.dispose());
    disposables.materials.forEach((m) => m.dispose());
    disposables.textures.forEach((t) => t.dispose());
  };

  return {
    root,
    applyPose,
    dispose,
  };
}
