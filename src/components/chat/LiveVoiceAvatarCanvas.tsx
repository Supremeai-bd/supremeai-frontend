import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { LiveSessionStatus, LiveVoiceName } from '../../hooks/useLiveVoiceSession';

interface LiveVoiceAvatarCanvasProps {
  status: LiveSessionStatus;
  voiceName: LiveVoiceName;
  levelsRef: React.MutableRefObject<{ input: number; output: number }>;
  isDark?: boolean;
}

// Calibrated calming iris & aura colors (never bloodshot red on eyes)
const EYE_COLORS: Record<LiveSessionStatus, number> = {
  idle: 0x38bdf8,
  connecting: 0xfbbf24,
  listening: 0x10b981,
  speaking: 0x22d3ee,
  muted: 0x818cf8,
  error: 0x60a5fa,
};

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const debugExt = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = debugExt
      ? String(gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) || '')
      : String(gl.getParameter(gl.RENDERER) || '');
    const loseExt = gl.getExtension('WEBGL_lose_context');
    if (loseExt) loseExt.loseContext();
    return /SwiftShader|llvmpipe|Software|Mesa OffScreen/i.test(rendererStr);
  } catch {
    return true;
  }
}

function createRadialShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.05,
      size / 2,
      size / 2,
      size * 0.48
    );
    grad.addColorStop(0, 'rgba(2, 6, 23, 0.6)');
    grad.addColorStop(0.55, 'rgba(2, 6, 23, 0.22)');
    grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const LiveVoiceAvatarCanvas: React.FC<LiveVoiceAvatarCanvasProps> = ({
  status,
  voiceName,
  levelsRef,
  isDark = true,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<LiveSessionStatus>(status);
  const voiceRef = useRef<LiveVoiceName>(voiceName);
  const isDarkRef = useRef<boolean>(isDark);

  statusRef.current = status;
  voiceRef.current = voiceName;
  isDarkRef.current = isDark;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = Math.max(container.clientWidth, 120);
    const height = Math.max(container.clientHeight, 120);

    const scene = new THREE.Scene();
    const bgDarkColor = new THREE.Color(0x060b16);
    const bgLightColor = new THREE.Color(0x0b1324);
    scene.background = (isDarkRef.current ? bgDarkColor : bgLightColor).clone();
    scene.fog = new THREE.FogExp2(isDarkRef.current ? 0x060b16 : 0x0b1324, 0.09);

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 40);
    camera.position.set(0, 0.34, 3.05);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // Studio environment IBL
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();

    // Soft Three-Point Sculptural Lighting
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 0.65);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5eb, 1.75);
    keyLight.position.set(2.4, 3.0, 3.8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.78);
    fillLight.position.set(-3.0, 0.8, 2.2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x22d3ee, 2.4, 9, 1.5);
    rimLight.position.set(0, 1.35, -2.0);
    scene.add(rimLight);

    // Smooth Damped Orbit Controls around center of head/bust
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.28, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 2.1;
    controls.maxDistance = 4.2;
    controls.minPolarAngle = Math.PI * 0.28;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.minAzimuthAngle = -Math.PI * 0.38;
    controls.maxAzimuthAngle = Math.PI * 0.38;
    controls.update();

    // Harmonized Satin Ceramic & Anodized Titanium PBR Materials
    const faceCeramicMat = new THREE.MeshPhysicalMaterial({
      color: 0xe8edf5,
      roughness: 0.44,
      metalness: 0.04,
      clearcoat: 0.32,
      clearcoatRoughness: 0.32,
    });

    const craniumBackMat = new THREE.MeshPhysicalMaterial({
      color: 0xcbd5e1,
      roughness: 0.36,
      metalness: 0.14,
      clearcoat: 0.35,
      clearcoatRoughness: 0.28,
    });

    const darkTitaniumMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.32,
      metalness: 0.86,
    });

    const slateTrimMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.28,
      metalness: 0.75,
    });

    const lipMat = new THREE.MeshPhysicalMaterial({
      color: 0x64748b,
      roughness: 0.34,
      metalness: 0.22,
      clearcoat: 0.45,
      clearcoatRoughness: 0.24,
    });

    const scleraMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      roughness: 0.14,
      metalness: 0.02,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
    });

    const irisMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.15,
      roughness: 0.18,
      metalness: 0.2,
    });

    const pupilMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      roughness: 0.08,
      metalness: 0.1,
    });

    const mouthInteriorMat = new THREE.MeshStandardMaterial({
      color: 0x070b14,
      roughness: 0.94,
      metalness: 0.05,
    });

    const accentEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.4,
      roughness: 0.22,
      metalness: 0.4,
    });

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // Grounded Radial Contact Shadow + Holographic Halo Ring
    const shadowTex = createRadialShadowTexture();
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 2.4),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.68,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.68;
    stageGroup.add(shadowPlane);

    const floorRingGeo = new THREE.RingGeometry(0.62, 0.655, 64);
    const floorRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
    });
    const floorRing = new THREE.Mesh(floorRingGeo, floorRingMat);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = -0.675;
    stageGroup.add(floorRing);

    // Sculpted Shoulder / Bust Pedestal (smooth anatomical clavicle & shoulder sweep)
    const bustPoints = [
      new THREE.Vector2(0.0, -0.67),
      new THREE.Vector2(0.58, -0.67),
      new THREE.Vector2(0.55, -0.57),
      new THREE.Vector2(0.42, -0.43),
      new THREE.Vector2(0.22, -0.31),
      new THREE.Vector2(0.16, -0.18),
      new THREE.Vector2(0.135, 0.0),
    ];
    const bustMesh = new THREE.Mesh(new THREE.LatheGeometry(bustPoints, 48), darkTitaniumMat);
    bustMesh.scale.set(1.1, 1, 0.72);
    stageGroup.add(bustMesh);

    // Collar Accent Ring
    const collarRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.215, 0.011, 14, 48),
      accentEmissiveMat
    );
    collarRing.rotation.x = Math.PI / 2 + 0.14;
    collarRing.position.set(0, -0.315, 0.02);
    collarRing.scale.set(1.12, 0.88, 1);
    stageGroup.add(collarRing);

    // Segmented Metallic Neck Column
    const neckCol = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.132, 0.32, 28),
      slateTrimMat
    );
    neckCol.position.set(0, -0.10, -0.02);
    stageGroup.add(neckCol);

    // Head Pivot (Atlas Cervical Joint)
    const headRoot = new THREE.Group();
    headRoot.position.set(0, 0.42, 0.02);
    stageGroup.add(headRoot);

    // Sculpted Anatomical Head Shell (Spline-smoothed Upper Cranium + Contoured Face)
    const rawHeadSpline = new THREE.SplineCurve([
      new THREE.Vector2(0.0, -0.43),
      new THREE.Vector2(0.16, -0.405),
      new THREE.Vector2(0.28, -0.31),
      new THREE.Vector2(0.365, -0.16),
      new THREE.Vector2(0.415, 0.01),
      new THREE.Vector2(0.43, 0.18),
      new THREE.Vector2(0.39, 0.34),
      new THREE.Vector2(0.27, 0.455),
      new THREE.Vector2(0.12, 0.51),
      new THREE.Vector2(0.0, 0.52),
    ]);
    const smoothHeadProfile = rawHeadSpline.getPoints(36);
    const upperHeadMesh = new THREE.Mesh(
      new THREE.LatheGeometry(smoothHeadProfile, 64),
      faceCeramicMat
    );
    upperHeadMesh.scale.set(0.91, 1.0, 0.99);
    upperHeadMesh.position.set(0, 0.03, 0.0);
    headRoot.add(upperHeadMesh);

    // Sleek Back-Skull Titanium Tech Shell (frames the ceramic face cleanly from behind & temples)
    const backShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.445, 32, 24, Math.PI * 0.12, Math.PI * 0.76, 0.15, Math.PI * 0.78),
      craniumBackMat
    );
    backShell.rotation.y = Math.PI;
    backShell.scale.set(0.94, 1.12, 1.04);
    backShell.position.set(0, 0.06, -0.04);
    headRoot.add(backShell);

    // Subtle Centerline Cranial Seam
    const browBridgeBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.015, 0.03),
      slateTrimMat
    );
    browBridgeBar.position.set(0, 0.14, 0.405);
    headRoot.add(browBridgeBar);

    // Refined Sculpted Nose (narrow bridge + soft tip, seamlessly integrated)
    const noseBridge = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.019, 0.145, 8, 16),
      faceCeramicMat
    );
    noseBridge.rotation.x = -0.22;
    noseBridge.position.set(0, 0.015, 0.438);
    headRoot.add(noseBridge);

    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.029, 18, 14), faceCeramicMat);
    noseTip.scale.set(1.05, 0.85, 0.95);
    noseTip.position.set(0, -0.065, 0.462);
    headRoot.add(noseTip);

    // Expressive Recessed Eyes + Eyelids + Brows
    interface EyeRig {
      gazePivot: THREE.Group;
      upperLid: THREE.Mesh;
      lowerLid: THREE.Mesh;
      brow: THREE.Mesh;
      side: number;
    }
    const eyeRigs: EyeRig[] = [];

    [-1, 1].forEach((side) => {
      const socketGroup = new THREE.Group();
      socketGroup.position.set(side * 0.152, 0.11, 0.372);
      socketGroup.rotation.y = side * 0.18;
      headRoot.add(socketGroup);

      // Subtle dark inner eye frame seated flush in front of sclera
      const eyeRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.068, 0.0085, 12, 32),
        darkTitaniumMat
      );
      eyeRim.scale.set(1.18, 0.84, 1);
      eyeRim.position.z = 0.022;
      socketGroup.add(eyeRim);

      // Clean bright sclera globe
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.063, 24, 18), scleraMat);
      sclera.scale.set(1.12, 0.88, 0.8);
      socketGroup.add(sclera);

      const gazePivot = new THREE.Group();
      socketGroup.add(gazePivot);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.036, 24, 16), irisMat);
      iris.scale.set(1, 1, 0.38);
      iris.position.set(0, 0, 0.041);
      gazePivot.add(iris);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 12), pupilMat);
      pupil.scale.set(1, 1, 0.42);
      pupil.position.set(0, 0, 0.051);
      gazePivot.add(pupil);

      const catchlight = new THREE.Mesh(
        new THREE.SphereGeometry(0.0065, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      catchlight.position.set(0.012, 0.013, 0.055);
      gazePivot.add(catchlight);

      // Smooth articulated upper & lower eyelids
      const upperLidGeo = new THREE.SphereGeometry(
        0.067,
        24,
        14,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.52
      );
      const upperLid = new THREE.Mesh(upperLidGeo, faceCeramicMat);
      upperLid.scale.set(1.15, 0.92, 0.86);
      upperLid.rotation.x = -0.38;
      socketGroup.add(upperLid);

      const lowerLidGeo = new THREE.SphereGeometry(
        0.066,
        24,
        12,
        0,
        Math.PI * 2,
        Math.PI * 0.48,
        Math.PI * 0.52
      );
      const lowerLid = new THREE.Mesh(lowerLidGeo, faceCeramicMat);
      lowerLid.scale.set(1.15, 0.9, 0.85);
      lowerLid.rotation.x = 0.24;
      socketGroup.add(lowerLid);

      // Symmetrical expressive eyebrow curve
      const brow = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.011, 0.095, 8, 16),
        darkTitaniumMat
      );
      brow.rotation.z = Math.PI / 2 - side * 0.1;
      brow.position.set(side * 0.155, 0.215, 0.398);
      brow.rotation.y = side * 0.18;
      headRoot.add(brow);

      eyeRigs.push({ gazePivot, upperLid, lowerLid, brow, side });
    });

    // Sleek Acoustic Temple Pods (Left & Right)
    const earRingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.75,
      roughness: 0.2,
      metalness: 0.5,
    });

    [-1, 1].forEach((side) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(side * 0.395, 0.05, -0.02);
      earGroup.rotation.z = Math.PI / 2;
      headRoot.add(earGroup);

      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.088, 0.1, 0.05, 24),
        darkTitaniumMat
      );
      earGroup.add(cup);

      const earHalo = new THREE.Mesh(
        new THREE.TorusGeometry(0.068, 0.0085, 10, 28),
        earRingMat
      );
      earHalo.rotation.x = Math.PI / 2;
      earHalo.position.y = side * -0.028;
      earGroup.add(earHalo);
    });

    // Symmetrical Smiling Lip Curves & Articulated Jaw Cavity
    const mouthCavity = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.032, 0.085, 8, 16),
      mouthInteriorMat
    );
    mouthCavity.rotation.z = Math.PI / 2;
    mouthCavity.scale.set(0.65, 1, 0.45);
    mouthCavity.position.set(0, -0.185, 0.365);
    headRoot.add(mouthCavity);

    // 5 Micro Vocal Resonance Bars inside the mouth cavity
    const vocalBars: THREE.Mesh[] = [];
    const barGeo = new THREE.BoxGeometry(0.011, 0.018, 0.01);
    for (let i = 0; i < 5; i++) {
      const bar = new THREE.Mesh(barGeo, accentEmissiveMat);
      bar.position.set((i - 2) * 0.022, -0.185, 0.378);
      headRoot.add(bar);
      vocalBars.push(bar);
    }

    // Upper Lip: symmetric subtle Cupid's-bow smile curve using CatmullRomCurve3
    const upperLipCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.082, -0.172, 0.358),
      new THREE.Vector3(-0.036, -0.172, 0.394),
      new THREE.Vector3(0.0, -0.178, 0.402),
      new THREE.Vector3(0.036, -0.172, 0.394),
      new THREE.Vector3(0.082, -0.172, 0.358),
    ]);
    const upperLip = new THREE.Mesh(
      new THREE.TubeGeometry(upperLipCurve, 24, 0.0115, 10, false),
      lipMat
    );
    headRoot.add(upperLip);

    // Hinged Lower Jaw Pivot (TMJ joint)
    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, -0.12, 0.04);
    headRoot.add(jawPivot);

    // Subtle contoured lower jaw plate (tucked flush into head contour so no clown bump!)
    const lowerChinMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 28, 20),
      faceCeramicMat
    );
    lowerChinMesh.scale.set(0.86, 0.72, 0.94);
    lowerChinMesh.position.set(0, -0.145, 0.145);
    jawPivot.add(lowerChinMesh);

    // Lower Lip: symmetric upward-smiling curve anchored directly to jawPivot
    const lowerLipCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.08, -0.056, 0.318),
      new THREE.Vector3(-0.038, -0.072, 0.352),
      new THREE.Vector3(0.0, -0.077, 0.36),
      new THREE.Vector3(0.038, -0.072, 0.352),
      new THREE.Vector3(0.08, -0.056, 0.318),
    ]);
    const lowerLip = new THREE.Mesh(
      new THREE.TubeGeometry(lowerLipCurve, 24, 0.0125, 10, false),
      lipMat
    );
    jawPivot.add(lowerLip);

    // Subtle Ambient Depth Sparks
    const particleCount = 26;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 0.86 + (i % 3) * 0.2;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = -0.2 + ((i * 7) % 11) * 0.09;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius - 0.18;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.022,
      transparent: true,
      opacity: 0.42,
    });
    const ambientParticles = new THREE.Points(particleGeo, particleMat);
    stageGroup.add(ambientParticles);

    // Pointer Look-Tracking
    const pointerNdc = { x: 0, y: 0 };
    const handlePointerMove = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerNdc.x = THREE.MathUtils.clamp(((ev.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      pointerNdc.y = THREE.MathUtils.clamp(-(((ev.clientY - rect.top) / rect.height) * 2 - 1), -1, 1);
    };
    const handlePointerLeave = () => {
      pointerNdc.x = 0;
      pointerNdc.y = 0;
    };
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);

    // Responsive ResizeObserver (Side Panel <-> Fullscreen)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(Math.floor(entry.contentRect.width), 80);
        const h = Math.max(Math.floor(entry.contentRect.height), 80);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
    });
    resizeObserver.observe(container);

    let lastTime = performance.now();
    let elapsed = 0;
    let smoothOutput = 0;
    let smoothInput = 0;
    let jawAngle = 0;
    let nextBlinkAt = 2.0;
    let blinkProgress = 0;
    let isBlinking = false;
    let disposed = false;
    let rafId = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const targetEyeColor = new THREE.Color(EYE_COLORS.idle);
    const currentEyeColor = new THREE.Color(EYE_COLORS.idle);

    const afterDraw = (fn: () => void) => {
      if (disposed) return;
      if (isSoftwareGl) {
        timerId = setTimeout(() => {
          if (!disposed) rafId = requestAnimationFrame(fn);
        }, 32);
      } else {
        rafId = requestAnimationFrame(fn);
      }
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;
      elapsed += dt;

      const curStatus = statusRef.current;
      targetEyeColor.setHex(EYE_COLORS[curStatus] ?? EYE_COLORS.idle);
      currentEyeColor.lerp(targetEyeColor, Math.min(1, dt * 6));

      const rawOutput = levelsRef.current.output || 0;
      const rawInput = levelsRef.current.input || 0;
      smoothOutput = THREE.MathUtils.damp(smoothOutput, rawOutput, 14, dt);
      smoothInput = THREE.MathUtils.damp(smoothInput, rawInput, 12, dt);

      irisMat.color.copy(currentEyeColor);
      irisMat.emissive.copy(currentEyeColor);
      irisMat.emissiveIntensity =
        curStatus === 'speaking'
          ? 1.35 + smoothOutput * 1.25
          : curStatus === 'listening'
          ? 1.25 + smoothInput * 0.85
          : 0.95;

      accentEmissiveMat.color.copy(currentEyeColor);
      accentEmissiveMat.emissive.copy(currentEyeColor);
      accentEmissiveMat.emissiveIntensity =
        curStatus === 'speaking' ? 1.35 + smoothOutput * 1.6 : 0.85 + smoothInput * 0.7;

      floorRingMat.color.copy(currentEyeColor);
      floorRingMat.opacity = curStatus === 'speaking' ? 0.34 + smoothOutput * 0.42 : 0.24;
      rimLight.color.copy(currentEyeColor);
      rimLight.intensity = curStatus === 'speaking' ? 2.4 + smoothOutput * 2.0 : 1.75;
      particleMat.color.copy(currentEyeColor);
      earRingMat.color.copy(currentEyeColor);
      earRingMat.emissive.copy(currentEyeColor);
      earRingMat.emissiveIntensity =
        curStatus === 'listening' ? 1.2 + smoothInput * 1.8 : 0.55;

      scene.background = isDarkRef.current ? bgDarkColor : bgLightColor;

      // Subtle breathing & orbital ambient drift
      stageGroup.position.y = Math.sin(elapsed * 1.4) * 0.012;
      ambientParticles.rotation.y += dt * (0.12 + smoothOutput * 0.3);

      // Expressive Head Pose: cursor look + natural speaking nods & tilts
      const speakEnergy = curStatus === 'speaking' ? Math.max(smoothOutput, 0.08) : 0;
      const speakNod =
        curStatus === 'speaking'
          ? Math.sin(elapsed * 5.0) * (0.04 + smoothOutput * 0.08)
          : curStatus === 'listening'
          ? -0.028 + Math.sin(elapsed * 1.7) * 0.014
          : curStatus === 'connecting'
          ? Math.sin(elapsed * 2.4) * 0.025
          : Math.sin(elapsed * 0.7) * 0.01;

      const speakTiltZ =
        curStatus === 'speaking'
          ? Math.sin(elapsed * 2.2) * 0.04
          : curStatus === 'listening'
          ? 0.032
          : Math.sin(elapsed * 0.75) * 0.012;

      const targetHeadYaw =
        pointerNdc.x * 0.2 +
        (curStatus === 'speaking' ? Math.sin(elapsed * 1.8) * 0.065 : Math.sin(elapsed * 0.5) * 0.024);
      const targetHeadPitch = -pointerNdc.y * 0.13 + speakNod;

      headRoot.rotation.y = THREE.MathUtils.damp(headRoot.rotation.y, targetHeadYaw, 5.5, dt);
      headRoot.rotation.x = THREE.MathUtils.damp(headRoot.rotation.x, targetHeadPitch, 6.0, dt);
      headRoot.rotation.z = THREE.MathUtils.damp(headRoot.rotation.z, speakTiltZ, 4.5, dt);

      // Natural Periodic Eyelid Blinks
      if (!isBlinking && elapsed >= nextBlinkAt) {
        isBlinking = true;
        blinkProgress = 0;
        nextBlinkAt = elapsed + 2.9 + Math.random() * 2.5;
      }
      let blinkFactor = 0;
      if (isBlinking) {
        blinkProgress += dt / 0.16;
        if (blinkProgress >= 1) {
          isBlinking = false;
          blinkFactor = 0;
        } else {
          blinkFactor = Math.sin(blinkProgress * Math.PI);
        }
      }

      const microSaccadeX = Math.sin(elapsed * 2.5) * 0.02;
      const microSaccadeY = Math.cos(elapsed * 1.8) * 0.012;

      for (const rig of eyeRigs) {
        rig.gazePivot.rotation.y = THREE.MathUtils.damp(
          rig.gazePivot.rotation.y,
          pointerNdc.x * 0.24 + microSaccadeX,
          12,
          dt
        );
        rig.gazePivot.rotation.x = THREE.MathUtils.damp(
          rig.gazePivot.rotation.x,
          -pointerNdc.y * 0.16 + microSaccadeY,
          12,
          dt
        );

        const openBias = curStatus === 'speaking' ? -0.46 - smoothOutput * 0.1 : curStatus === 'listening' ? -0.44 : -0.38;
        const closedAngle = 0.04;
        rig.upperLid.rotation.x = THREE.MathUtils.damp(
          rig.upperLid.rotation.x,
          THREE.MathUtils.lerp(openBias, closedAngle, blinkFactor),
          24,
          dt
        );

        const smileSquint = curStatus === 'speaking' ? 0.16 - smoothOutput * 0.06 : 0.24;
        rig.lowerLid.rotation.x = THREE.MathUtils.damp(
          rig.lowerLid.rotation.x,
          THREE.MathUtils.lerp(smileSquint, -0.01, blinkFactor),
          20,
          dt
        );

        const browLift =
          curStatus === 'speaking'
            ? 0.222 + smoothOutput * 0.028 + Math.sin(elapsed * 4.0) * 0.006
            : curStatus === 'listening'
            ? 0.224 + smoothInput * 0.012
            : 0.215;
        rig.brow.position.y = THREE.MathUtils.damp(rig.brow.position.y, browLift, 8, dt);

        const browTiltZ =
          curStatus === 'connecting'
            ? Math.PI / 2 + rig.side * 0.06
            : curStatus === 'listening'
            ? Math.PI / 2 - rig.side * 0.13
            : Math.PI / 2 - rig.side * (0.1 + smoothOutput * 0.06);
        rig.brow.rotation.z = THREE.MathUtils.damp(rig.brow.rotation.z, browTiltZ, 8, dt);
      }

      // Real-time Articulated Lip Sync & Jaw Motion
      let targetJaw = 0.0;
      if (curStatus === 'speaking' || smoothOutput > 0.025) {
        const syllableWave =
          0.56 + 0.28 * Math.sin(elapsed * 19.0) + 0.16 * Math.cos(elapsed * 11.2);
        targetJaw = THREE.MathUtils.clamp(
          (0.055 + smoothOutput * 0.36) * Math.max(0.28, syllableWave),
          0.02,
          0.34
        );
      }

      jawAngle = THREE.MathUtils.damp(jawAngle, targetJaw, 22, dt);
      jawPivot.rotation.x = jawAngle;
      jawPivot.position.y = -0.12 - jawAngle * 0.05;
      upperLip.position.y = jawAngle * 0.032;

      mouthCavity.visible = jawAngle > 0.025;
      mouthCavity.scale.y = 0.4 + jawAngle * 3.8;

      const barActivity =
        curStatus === 'speaking' ? Math.max(0.18, smoothOutput * 2.1) : smoothInput * 0.6;
      for (let i = 0; i < vocalBars.length; i++) {
        const bar = vocalBars[i];
        const wave = 0.4 + 0.6 * Math.abs(Math.sin(elapsed * 12 + i * 1.15));
        const targetScaleY = 0.25 + barActivity * wave * (1.7 - Math.abs(i - 2) * 0.28);
        bar.scale.y = THREE.MathUtils.damp(bar.scale.y, targetScaleY, 18, dt);
        bar.visible = jawAngle > 0.04 || speakEnergy > 0.04;
      }

      controls.update();
      renderer.render(scene, camera);
      afterDraw(tick);
    };

    afterDraw(tick);

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (timerId) clearTimeout(timerId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      controls.dispose();

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh || (obj as THREE.Points).isPoints) {
          const renderable = obj as THREE.Mesh | THREE.Points;
          renderable.geometry.dispose();
          if (Array.isArray(renderable.material)) {
            renderable.material.forEach((m) => m.dispose());
          } else {
            renderable.material.dispose();
          }
        }
      });

      shadowTex.dispose();
      envRT.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [levelsRef]);

  return (
    <div
      ref={mountRef}
      data-testid="live-voice-3d-canvas"
      className="w-full h-full relative select-none touch-none cursor-grab active:cursor-grabbing"
    />
  );
};
