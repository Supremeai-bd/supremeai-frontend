import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { LiveSessionStatus, LiveVoiceName } from '../../hooks/useLiveVoiceSession';
import { buildHologramTextures } from '../../utils/hologramAvatar';

interface LiveVoiceAvatarCanvasProps {
  status: LiveSessionStatus;
  voiceName: LiveVoiceName;
  levelsRef: React.MutableRefObject<{ input: number; output: number }>;
  avatarSrc: string;
  isPrestyledHologram: boolean;
  isDark?: boolean;
}

const STATUS_ACCENT_COLORS: Record<LiveSessionStatus, number> = {
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

function createParticleSpriteTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.28, 'rgba(125, 211, 252, 0.85)');
    grad.addColorStop(0.65, 'rgba(139, 92, 246, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPlaceholderTexture(fillHex: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 4;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = fillHex;
    ctx.fillRect(0, 0, 4, 4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const HOLOGRAM_VERTEX_SHADER = /* glsl */ `
  uniform sampler2D uDepthMap;
  uniform float uTime;
  uniform float uSpeakEnergy;
  uniform float uDepthScale;

  varying vec2 vUv;
  varying float vDepth;
  varying vec3 vViewPos;

  void main() {
    vUv = uv;
    float depth = texture2D(uDepthMap, uv).r;
    vDepth = depth;

    vec3 pos = position;
    // Gentle cylindrical wrap so the portrait reads as a true 3D bust from side angles
    pos.z -= (pos.x * pos.x) * 0.22;
    // Extrude facial anatomy forward along Z from depth map
    pos.z += depth * uDepthScale;

    // Subtle speaking holographic micro-wave across contours
    float voiceWave = sin(uv.y * 22.0 - uTime * 8.5) * 0.009 * uSpeakEnergy * depth;
    pos.z += voiceWave;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    vViewPos = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const HOLOGRAM_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uColorMap;
  uniform sampler2D uDepthMap;
  uniform float uTime;
  uniform float uSpeakEnergy;
  uniform float uListenEnergy;
  uniform vec3 uAccentColor;
  uniform float uIsDarkBg;

  varying vec2 vUv;
  varying float vDepth;
  varying vec3 vViewPos;

  void main() {
    vec4 tex = texture2D(uColorMap, vUv);
    if (tex.a < 0.015) discard;

    // Derive surface normal from depth map gradient for 3D Fresnel rim highlights
    float eps = 0.004;
    float dL = texture2D(uDepthMap, vUv - vec2(eps, 0.0)).r;
    float dR = texture2D(uDepthMap, vUv + vec2(eps, 0.0)).r;
    float dD = texture2D(uDepthMap, vUv - vec2(0.0, eps)).r;
    float dU = texture2D(uDepthMap, vUv + vec2(0.0, eps)).r;
    vec3 surfNormal = normalize(vec3((dL - dR) * 2.8, (dD - dU) * 2.8, 0.65));
    vec3 viewDir = normalize(vViewPos);
    float fresnel = pow(1.0 - clamp(abs(dot(surfNormal, viewDir)), 0.0, 1.0), 2.1);

    // Fine horizontal holographic scanlines + slow vertical scan sweep
    float fineScan = 0.91 + 0.09 * sin(vUv.y * 340.0 - uTime * 3.5);
    float sweepY = fract(uTime * 0.19);
    float sweepBand = exp(-pow((vUv.y - sweepY) * 14.0, 2.0)) * (0.28 + uSpeakEnergy * 0.45);

    // Subtle vocal shimmer near lips/chin when assistant speaks
    float mouthMask = exp(-((vUv.x - 0.48) * (vUv.x - 0.48) / 0.014 + (vUv.y - 0.36) * (vUv.y - 0.36) / 0.009));
    float voicePulse = mouthMask * uSpeakEnergy * (0.35 + 0.35 * sin(uTime * 22.0));

    // Blend base hologram color with Fresnel cyan/violet aura & status accent
    vec3 violetTint = vec3(0.56, 0.38, 1.0);
    vec3 rimGlow = mix(uAccentColor, violetTint, fresnel * 0.45) * (fresnel * (0.68 + uSpeakEnergy * 0.65));

    vec3 color = tex.rgb * fineScan;
    color += rimGlow;
    color += uAccentColor * (sweepBand * 0.48 + voicePulse * 0.55 + uListenEnergy * 0.14);

    // On light backgrounds, enrich deep cyan-blue contrast slightly so hologram stays vivid
    if (uIsDarkBg < 0.5) {
      color = mix(color * vec3(0.72, 0.88, 1.04), color, 0.55);
    }

    // Soft outer UV feathering to eliminate any rectangular edge
    float edgeX = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
    float edgeY = smoothstep(0.0, 0.14, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
    float alpha = clamp(tex.a * edgeX * edgeY * (0.94 + fresnel * 0.25 + sweepBand * 0.2), 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`;

const RING_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RING_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uOffset;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uEnergy;
  varying vec2 vUv;

  void main() {
    float angle = fract(vUv.x - uTime * uSpeed + uOffset);
    // Bright orbiting light arc + secondary comet trail
    float arc1 = smoothstep(0.0, 0.12, angle) * smoothstep(0.68, 0.16, angle);
    float arc2 = smoothstep(0.52, 0.64, angle) * smoothstep(0.95, 0.68, angle) * 0.6;
    float baseTrail = 0.16;
    float intensity = baseTrail + arc1 * (0.85 + uEnergy * 0.8) + arc2 * (0.65 + uEnergy * 0.6);

    vec3 col = mix(uColorA, uColorB, 0.5 + 0.5 * sin(vUv.x * 6.28318 + uTime));
    // Core glow across tube cross-section
    float core = 1.0 - abs(vUv.y - 0.5) * 2.0;
    core = pow(clamp(core, 0.0, 1.0), 1.4);

    float alpha = clamp(intensity * core * (0.72 + uEnergy * 0.35), 0.0, 1.0);
    gl_FragColor = vec4(col * (1.05 + intensity * 0.45), alpha);
  }
`;

export const LiveVoiceAvatarCanvas: React.FC<LiveVoiceAvatarCanvasProps> = ({
  status,
  voiceName,
  levelsRef,
  avatarSrc,
  isPrestyledHologram,
  isDark = true,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<LiveSessionStatus>(status);
  const voiceRef = useRef<LiveVoiceName>(voiceName);
  const isDarkRef = useRef<boolean>(isDark);
  const [contextLost, setContextLost] = useState(false);

  statusRef.current = status;
  voiceRef.current = voiceName;
  isDarkRef.current = isDark;

  const hologramMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const activeTexturesRef = useRef<{
    color: THREE.CanvasTexture | null;
    depth: THREE.CanvasTexture | null;
  }>({ color: null, depth: null });

  // Initialize transparent Three.js hologram stage once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = Math.max(container.clientWidth, 120);
    const height = Math.max(container.clientHeight, 120);

    const scene = new THREE.Scene();
    scene.background = null; // Pure transparent background

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 30);
    camera.position.set(0, 0.08, 3.05);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.background = 'transparent';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.04, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 2.2;
    controls.maxDistance = 4.2;
    controls.minPolarAngle = Math.PI * 0.3;
    controls.maxPolarAngle = Math.PI * 0.68;
    controls.minAzimuthAngle = -Math.PI * 0.34;
    controls.maxAzimuthAngle = Math.PI * 0.34;
    controls.update();

    const hologramGroup = new THREE.Group();
    scene.add(hologramGroup);

    // Placeholder 4x4 textures until real image finishes converting
    const initColorTex = createPlaceholderTexture('#000000');
    const initDepthTex = createPlaceholderTexture('#808080');
    activeTexturesRef.current = { color: initColorTex, depth: initDepthTex };

    const hologramMat = new THREE.ShaderMaterial({
      uniforms: {
        uColorMap: { value: initColorTex },
        uDepthMap: { value: initDepthTex },
        uTime: { value: 0 },
        uSpeakEnergy: { value: 0 },
        uListenEnergy: { value: 0 },
        uDepthScale: { value: 0.34 },
        uAccentColor: { value: new THREE.Color(STATUS_ACCENT_COLORS.idle) },
        uIsDarkBg: { value: isDarkRef.current ? 1.0 : 0.0 },
      },
      vertexShader: HOLOGRAM_VERTEX_SHADER,
      fragmentShader: HOLOGRAM_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    hologramMatRef.current = hologramMat;

    const bustGeo = new THREE.PlaneGeometry(1.78, 1.78, 96, 96);
    const bustMesh = new THREE.Mesh(bustGeo, hologramMat);
    bustMesh.position.set(0, 0.06, 0);
    hologramGroup.add(bustMesh);

    // 3D Orbiting Holographic Energy Rings (matching the luminous rings around the head & shoulders)
    const ringConfigs = [
      { radius: 0.88, tube: 0.0085, rx: 1.32, rz: 0.24, y: 0.28, speed: 0.24, offset: 0.0 },
      { radius: 0.96, tube: 0.0075, rx: 1.44, rz: -0.32, y: -0.02, speed: -0.19, offset: 0.38 },
      { radius: 0.82, tube: 0.0065, rx: 1.24, rz: 0.42, y: -0.34, speed: 0.28, offset: 0.72 },
    ];

    const ringMaterials: THREE.ShaderMaterial[] = [];
    const ringMeshes: THREE.Mesh[] = [];
    const ringAnchor = new THREE.Group();
    hologramGroup.add(ringAnchor);

    ringConfigs.forEach((cfg) => {
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: cfg.speed },
          uOffset: { value: cfg.offset },
          uColorA: { value: new THREE.Color(0x22d3ee) },
          uColorB: { value: new THREE.Color(0x8b5cf6) },
          uEnergy: { value: 0 },
        },
        vertexShader: RING_VERTEX_SHADER,
        fragmentShader: RING_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(cfg.radius, cfg.tube, 10, 96), mat);
      mesh.rotation.x = cfg.rx;
      mesh.rotation.z = cfg.rz;
      mesh.position.y = cfg.y;
      ringAnchor.add(mesh);
      ringMaterials.push(mat);
      ringMeshes.push(mesh);
    });

    // Subtle Holographic Emitter Base Ring
    const baseEmitterGeo = new THREE.RingGeometry(0.46, 0.51, 64);
    const baseEmitterMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const baseEmitter = new THREE.Mesh(baseEmitterGeo, baseEmitterMat);
    baseEmitter.rotation.x = -Math.PI / 2;
    baseEmitter.position.y = -0.82;
    hologramGroup.add(baseEmitter);

    // Swirling 3D Hologram Micro-Particles
    const particleCount = 150;
    const pPositions = new Float32Array(particleCount * 3);
    const pPhases = new Float32Array(particleCount);
    const pRadii = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 * 3;
      const r = 0.55 + (i % 9) * 0.085;
      pRadii[i] = r;
      pPhases[i] = angle;
      pPositions[i * 3] = Math.cos(angle) * r;
      pPositions[i * 3 + 1] = -0.72 + ((i * 13) % 41) * 0.036;
      pPositions[i * 3 + 2] = Math.sin(angle) * r * 0.65;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const particleSpriteTex = createParticleSpriteTexture();
    const particleMat = new THREE.PointsMaterial({
      map: particleSpriteTex,
      color: 0x38bdf8,
      size: 0.055,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particleCloud = new THREE.Points(particleGeo, particleMat);
    hologramGroup.add(particleCloud);

    // Cursor Look-Tracking
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
    let disposed = false;
    let rafId = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const targetAccent = new THREE.Color(STATUS_ACCENT_COLORS.idle);
    const currentAccent = new THREE.Color(STATUS_ACCENT_COLORS.idle);

    const afterDraw = (fn: () => void) => {
      if (disposed) return;
      if (isSoftwareGl) {
        timerId = setTimeout(() => {
          if (!disposed) rafId = requestAnimationFrame(fn);
        }, 42);
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
      targetAccent.setHex(STATUS_ACCENT_COLORS[curStatus] ?? STATUS_ACCENT_COLORS.idle);
      currentAccent.lerp(targetAccent, Math.min(1, dt * 5));

      const rawOutput = levelsRef.current.output || 0;
      const rawInput = levelsRef.current.input || 0;
      smoothOutput = THREE.MathUtils.damp(smoothOutput, rawOutput, 14, dt);
      smoothInput = THREE.MathUtils.damp(smoothInput, rawInput, 12, dt);

      const speakEnergy = curStatus === 'speaking' ? Math.max(0.14, smoothOutput) : smoothOutput;
      const listenEnergy = curStatus === 'listening' ? Math.max(0.15, smoothInput) : smoothInput;

      // Update hologram shader uniforms
      hologramMat.uniforms.uTime.value = elapsed;
      hologramMat.uniforms.uSpeakEnergy.value = speakEnergy;
      hologramMat.uniforms.uListenEnergy.value = listenEnergy;
      hologramMat.uniforms.uAccentColor.value.copy(currentAccent);
      hologramMat.uniforms.uIsDarkBg.value = isDarkRef.current ? 1.0 : 0.0;

      // Subtle breathing float + natural cursor parallax + speaking nods
      hologramGroup.position.y = Math.sin(elapsed * 1.45) * 0.022;

      const targetYaw =
        pointerNdc.x * 0.24 +
        (curStatus === 'speaking' ? Math.sin(elapsed * 1.9) * 0.075 : Math.sin(elapsed * 0.55) * 0.035);
      const targetPitch =
        -pointerNdc.y * 0.14 +
        (curStatus === 'speaking'
          ? Math.sin(elapsed * 4.6) * (0.025 + speakEnergy * 0.045)
          : curStatus === 'listening'
          ? -0.03 + Math.sin(elapsed * 1.6) * 0.015
          : Math.sin(elapsed * 0.7) * 0.012);

      bustMesh.rotation.y = THREE.MathUtils.damp(bustMesh.rotation.y, targetYaw, 5.0, dt);
      bustMesh.rotation.x = THREE.MathUtils.damp(bustMesh.rotation.x, targetPitch, 5.5, dt);

      // Orbiting light rings respond dynamically to speech & listening
      const ringEnergy = Math.max(speakEnergy, listenEnergy * 0.65);
      ringAnchor.rotation.y += dt * (0.14 + ringEnergy * 0.55);
      for (let i = 0; i < ringMaterials.length; i++) {
        ringMaterials[i].uniforms.uTime.value = elapsed;
        ringMaterials[i].uniforms.uEnergy.value = ringEnergy;
        ringMaterials[i].uniforms.uColorA.value.copy(currentAccent);
        const pulseScale = 1 + ringEnergy * (0.05 + i * 0.02) * Math.sin(elapsed * 4 + i);
        ringMeshes[i].scale.setScalar(pulseScale);
      }

      baseEmitterMat.color.copy(currentAccent);
      baseEmitterMat.opacity = 0.22 + ringEnergy * 0.35;

      particleMat.color.copy(currentAccent);
      particleMat.opacity = 0.52 + ringEnergy * 0.4;
      particleCloud.rotation.y += dt * (0.18 + ringEnergy * 0.45);

      const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        const yOff = Math.sin(elapsed * 1.2 + pPhases[i]) * 0.03;
        const rPulse = pRadii[i] * (1 + ringEnergy * 0.09);
        const ang = pPhases[i] + elapsed * 0.12;
        posAttr.setX(i, Math.cos(ang) * rPulse);
        posAttr.setZ(i, Math.sin(ang) * rPulse * 0.68);
        posAttr.setY(i, posAttr.getY(i) + yOff * dt);
      }
      posAttr.needsUpdate = true;

      controls.update();
      renderer.render(scene, camera);
      afterDraw(tick);
    };

    afterDraw(tick);

    return () => {
      disposed = true;
      hologramMatRef.current = null;
      if (rafId) cancelAnimationFrame(rafId);
      if (timerId) clearTimeout(timerId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
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

      activeTexturesRef.current.color?.dispose();
      activeTexturesRef.current.depth?.dispose();
      particleSpriteTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [levelsRef]);

  // Rebuild holographic RGBA + 3D relief depth textures whenever avatarSrc changes (no WebGL teardown!)
  useEffect(() => {
    let cancelled = false;
    buildHologramTextures(avatarSrc, isPrestyledHologram)
      .then(({ colorCanvas, depthCanvas }) => {
        if (cancelled) return;
        const mat = hologramMatRef.current;
        if (!mat) return;

        const nextColorTex = new THREE.CanvasTexture(colorCanvas);
        nextColorTex.colorSpace = THREE.SRGBColorSpace;
        nextColorTex.needsUpdate = true;

        const nextDepthTex = new THREE.CanvasTexture(depthCanvas);
        nextDepthTex.needsUpdate = true;

        const prevColor = activeTexturesRef.current.color;
        const prevDepth = activeTexturesRef.current.depth;

        mat.uniforms.uColorMap.value = nextColorTex;
        mat.uniforms.uDepthMap.value = nextDepthTex;
        mat.uniforms.uDepthScale.value = isPrestyledHologram ? 0.36 : 0.32;

        activeTexturesRef.current = { color: nextColorTex, depth: nextDepthTex };
        prevColor?.dispose();
        prevDepth?.dispose();
      })
      .catch(() => {
        // Fallback keeps previous active texture safely
      });

    return () => {
      cancelled = true;
    };
  }, [avatarSrc, isPrestyledHologram]);

  return (
    <div
      ref={mountRef}
      data-testid="live-voice-3d-canvas"
      className="w-full h-full relative select-none touch-none cursor-grab active:cursor-grabbing bg-transparent"
    >
      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-cyan-300 pointer-events-none">
          Restoring 3D hologram viewport...
        </div>
      )}
    </div>
  );
};
