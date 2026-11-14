import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { LiveSessionStatus, LiveVoiceName } from '../../hooks/useLiveVoiceSession';
import type { AvatarExpression } from '../../hooks/useAvatarExpression';
import {
  buildHologramTextures,
  type AvatarPresetId,
  type AvatarRenderQuality,
  type CustomFaceTraits,
} from '../../utils/hologramAvatar';
import { createParticleSpriteTexture } from './avatar3d/avatarTextures';
import {
  createArticulatedAvatarRig,
  type ArticulatedAvatarRig,
  type AvatarPoseInput,
} from './avatar3d/avatarRigBuilder';

interface LiveVoiceAvatarCanvasProps {
  status: LiveSessionStatus;
  voiceName: LiveVoiceName;
  levelsRef: React.MutableRefObject<{ input: number; output: number }>;
  avatarSrc: string;
  isPrestyledHologram: boolean;
  avatarPreset?: AvatarPresetId;
  customTraits?: CustomFaceTraits;
  renderingQuality?: AvatarRenderQuality;
  expression?: AvatarExpression;
  expressionIntensity?: number;
  isStreaming?: boolean;
  isDark?: boolean;
  resetViewCounter?: number;
}

const STATUS_ACCENT_COLORS: Record<LiveSessionStatus, number> = {
  idle: 0x38bdf8,
  connecting: 0xfbbf24,
  listening: 0x10b981,
  speaking: 0x22d3ee,
  muted: 0x818cf8,
  error: 0x60a5fa,
};

// Pre-allocated expression accent targets (zero GC inside animation loop)
const EXPRESSION_JOYFUL_COLOR = new THREE.Color(0x10b981);
const EXPRESSION_ANALYTICAL_COLOR = new THREE.Color(0x6366f1);
const EXPRESSION_THINKING_COLOR = new THREE.Color(0xfbbf24);

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

// Upgraded Custom Photo Hologram Shaders: supports Ultra high-detail vs Performance simplified shading
const HOLOGRAM_VERTEX_SHADER = /* glsl */ `
  uniform sampler2D uDepthMap;
  uniform float uTime;
  uniform float uSpeakEnergy;
  uniform float uJawOpen;
  uniform float uVisemeOh;
  uniform float uDepthScale;
  uniform float uQuality;

  varying vec2 vUv;
  varying float vDepth;
  varying vec3 vViewPos;

  void main() {
    vUv = uv;
    float depth = texture2D(uDepthMap, uv).r;
    vDepth = depth;

    vec3 pos = position;
    pos.z -= (pos.x * pos.x) * 0.24;
    pos.z += depth * uDepthScale;

    // Lower jaw & lower lip vertex articulation when avatar speaks
    float lowerLipMask = exp(-((uv.x - 0.5) * (uv.x - 0.5) / 0.012 + (uv.y - 0.34) * (uv.y - 0.34) / 0.005));
    float chinMask = smoothstep(0.41, 0.27, uv.y) * smoothstep(0.28, 0.44, uv.x) * smoothstep(0.72, 0.56, uv.x);
    pos.y -= (lowerLipMask * 0.055 + chinMask * 0.025) * uJawOpen;
    pos.z += lowerLipMask * 0.018 * uVisemeOh;

    if (uQuality > 0.5) {
      float voiceWave = sin(uv.y * 22.0 - uTime * 8.5) * 0.007 * uSpeakEnergy * depth;
      pos.z += voiceWave;
    }

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
  uniform float uJawOpen;
  uniform float uBlink;
  uniform float uLookX;
  uniform float uLookY;
  uniform vec3 uAccentColor;
  uniform float uIsDarkBg;
  uniform float uQuality;

  varying vec2 vUv;
  varying float vDepth;
  varying vec3 vViewPos;

  void main() {
    vec4 tex = texture2D(uColorMap, vUv);
    if (tex.a < 0.015) discard;

    vec3 viewDir = normalize(vViewPos);
    vec3 surfNormal = vec3(0.0, 0.0, 1.0);
    float fineScan = 1.0;
    float sweepBand = 0.0;
    float glintL = 0.0;
    float glintR = 0.0;

    // Eye & mouth masks (always active so blinks & speech stay responsive in both modes)
    vec2 eyeL = vec2(0.425, 0.565);
    vec2 eyeR = vec2(0.575, 0.565);
    float eyeMaskL = exp(-((vUv.x - eyeL.x) * (vUv.x - eyeL.x) / 0.0014 + (vUv.y - eyeL.y) * (vUv.y - eyeL.y) / 0.0007));
    float eyeMaskR = exp(-((vUv.x - eyeR.x) * (vUv.x - eyeR.x) / 0.0014 + (vUv.y - eyeR.y) * (vUv.y - eyeR.y) / 0.0007));
    float eyesMask = clamp(eyeMaskL + eyeMaskR, 0.0, 1.0);
    float mouthOpenMask = exp(-((vUv.x - 0.5) * (vUv.x - 0.5) / 0.0055 + (vUv.y - 0.36) * (vUv.y - 0.36) / 0.0018));

    if (uQuality > 0.5) {
      float eps = 0.004;
      float dL = texture2D(uDepthMap, vUv - vec2(eps, 0.0)).r;
      float dR = texture2D(uDepthMap, vUv + vec2(eps, 0.0)).r;
      float dD = texture2D(uDepthMap, vUv - vec2(0.0, eps)).r;
      float dU = texture2D(uDepthMap, vUv + vec2(0.0, eps)).r;
      surfNormal = normalize(vec3((dL - dR) * 2.8, (dD - dU) * 2.8, 0.65));

      fineScan = 0.93 + 0.07 * sin(vUv.y * 320.0 - uTime * 3.2);
      float sweepY = fract(uTime * 0.19);
      sweepBand = exp(-pow((vUv.y - sweepY) * 14.0, 2.0)) * (0.24 + uSpeakEnergy * 0.4);

      vec2 gazeShift = vec2(uLookX * 0.011, uLookY * 0.007);
      glintL = exp(-length((vUv - (eyeL + gazeShift)) * vec2(85.0, 110.0)));
      glintR = exp(-length((vUv - (eyeR + gazeShift)) * vec2(85.0, 110.0)));
    }

    float fresnel = pow(1.0 - clamp(abs(dot(surfNormal, viewDir)), 0.0, 1.0), 2.1);
    vec3 violetTint = vec3(0.56, 0.38, 1.0);
    vec3 rimGlow = mix(uAccentColor, violetTint, fresnel * 0.45) * (fresnel * (0.62 + uSpeakEnergy * 0.6));

    vec3 color = tex.rgb * fineScan;
    color = mix(color, color * 0.24 + vec3(0.05, 0.12, 0.22), eyesMask * uBlink * 0.85);
    if (uQuality > 0.5) {
      color += vec3(0.65, 0.92, 1.0) * (glintL + glintR) * (1.0 - uBlink) * 0.42;
    }
    color = mix(color, vec3(0.03, 0.07, 0.16), mouthOpenMask * uJawOpen * 0.72);
    color += rimGlow;
    color += uAccentColor * (sweepBand * 0.42 + uListenEnergy * 0.14);

    if (uIsDarkBg < 0.5) {
      color = mix(color * vec3(0.75, 0.9, 1.04), color, 0.55);
    }

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
  uniform float uQuality;
  varying vec2 vUv;

  void main() {
    float core = 1.0 - abs(vUv.y - 0.5) * 2.0;
    core = clamp(core, 0.0, 1.0);

    if (uQuality <= 0.5) {
      float simpleAlpha = core * (0.28 + uEnergy * 0.25);
      gl_FragColor = vec4(uColorA, simpleAlpha);
      return;
    }

    float angle = fract(vUv.x - uTime * uSpeed + uOffset);
    float arc1 = smoothstep(0.0, 0.12, angle) * smoothstep(0.68, 0.16, angle);
    float arc2 = smoothstep(0.52, 0.64, angle) * smoothstep(0.95, 0.68, angle) * 0.6;
    float baseTrail = 0.14;
    float intensity = baseTrail + arc1 * (0.75 + uEnergy * 0.8) + arc2 * (0.55 + uEnergy * 0.55);

    vec3 col = mix(uColorA, uColorB, 0.5 + 0.5 * sin(vUv.x * 6.28318 + uTime));
    core = pow(core, 1.4);

    float alpha = clamp(intensity * core * (0.62 + uEnergy * 0.35), 0.0, 1.0);
    gl_FragColor = vec4(col * (1.0 + intensity * 0.42), alpha);
  }
`;

export const LiveVoiceAvatarCanvas: React.FC<LiveVoiceAvatarCanvasProps> = ({
  status,
  voiceName,
  levelsRef,
  avatarSrc,
  isPrestyledHologram,
  avatarPreset = 'female',
  customTraits,
  renderingQuality = 'ultra',
  expression = 'neutral',
  expressionIntensity = 0.65,
  isStreaming = false,
  isDark = true,
  resetViewCounter = 0,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<LiveSessionStatus>(status);
  const voiceRef = useRef<LiveVoiceName>(voiceName);
  const presetRef = useRef<AvatarPresetId>(avatarPreset);
  const customTraitsRef = useRef<CustomFaceTraits | undefined>(customTraits);
  const qualityRef = useRef<AvatarRenderQuality>(renderingQuality);
  const expressionRef = useRef<AvatarExpression>(expression);
  const expressionIntensityRef = useRef<number>(expressionIntensity);
  const isStreamingRef = useRef<boolean>(isStreaming);
  const isDarkRef = useRef<boolean>(isDark);
  const [contextLost, setContextLost] = useState(false);

  statusRef.current = status;
  voiceRef.current = voiceName;
  presetRef.current = avatarPreset;
  customTraitsRef.current = customTraits;
  qualityRef.current = renderingQuality;
  expressionRef.current = expression;
  expressionIntensityRef.current = expressionIntensity;
  isStreamingRef.current = isStreaming;
  isDarkRef.current = isDark;

  const sceneRefs = useRef<{
    container: HTMLDivElement;
    isSoftwareGl: boolean;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer | null;
    bloomPass: UnrealBloomPass | null;
    keyLight: THREE.DirectionalLight;
    rigAnchor: THREE.Group;
    customBustMesh: THREE.Mesh;
    hologramMat: THREE.ShaderMaterial;
    ringMaterials: THREE.ShaderMaterial[];
    particleGeo: THREE.BufferGeometry;
    particleCount: number;
    activeRig: ArticulatedAvatarRig | null;
    controls: OrbitControls;
    camera: THREE.PerspectiveCamera;
    reactTrigger: () => void;
  } | null>(null);

  const activeTexturesRef = useRef<{
    color: THREE.CanvasTexture | null;
    depth: THREE.CanvasTexture | null;
  }>({ color: null, depth: null });

  // Reset camera framing when parent increments resetViewCounter
  useEffect(() => {
    if (resetViewCounter === 0 || !sceneRefs.current) return;
    const { camera, controls } = sceneRefs.current;
    camera.position.set(0, 0.14, 2.75);
    controls.target.set(0, 0.02, 0);
    controls.update();
  }, [resetViewCounter]);

  // Initialize Three.js Studio + Hologram Stage once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const initialUltra = qualityRef.current === 'ultra' && !isSoftwareGl;
    const width = Math.max(container.clientWidth, 120);
    const height = Math.max(container.clientHeight, 120);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 30);
    camera.position.set(0, 0.14, 2.75);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(initialUltra ? Math.min(window.devicePixelRatio || 1, 2) : 1);
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = initialUltra;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.background = 'transparent';
    container.appendChild(renderer.domElement);

    // Alpha-preserving EffectComposer pipeline for Ultra mode (skipped on Performance or Software WebGL)
    let composerRenderTarget: THREE.WebGLRenderTarget | null = null;
    let composer: EffectComposer | null = null;
    let renderPass: RenderPass | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    let outputPass: OutputPass | null = null;

    if (!isSoftwareGl) {
      const pr = renderer.getPixelRatio();
      composerRenderTarget = new THREE.WebGLRenderTarget(
        Math.max(1, Math.floor(width * pr)),
        Math.max(1, Math.floor(height * pr)),
        {
          type: THREE.HalfFloatType,
          format: THREE.RGBAFormat,
        }
      );
      composer = new EffectComposer(renderer, composerRenderTarget);
      composer.setPixelRatio(pr);
      composer.setSize(width, height);
      renderPass = new RenderPass(scene, camera, undefined, new THREE.Color(0x000000), 0);
      bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.36, 0.45, 0.84);
      outputPass = new OutputPass();
      composer.addPass(renderPass);
      composer.addPass(bloomPass);
      composer.addPass(outputPass);
    }

    // RoomEnvironment PBR Studio Reflections (identical intensity across GPU & Software WebGL)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.72;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 3-Point Warm/Cool Studio Portrait Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.25);
    keyLight.position.set(1.85, 2.4, 3.1);
    if (!isSoftwareGl) {
      keyLight.castShadow = initialUltra;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 10;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.78);
    fillLight.position.set(-2.3, 0.75, 2.2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x22d3ee, 1.35);
    rimLight.position.set(0.2, 1.6, -2.5);
    scene.add(rimLight);

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
    controls.target.set(0, 0.02, 0);
    controls.enableDamping = initialUltra;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 1.9;
    controls.maxDistance = 3.8;
    controls.minPolarAngle = Math.PI * 0.26;
    controls.maxPolarAngle = Math.PI * 0.68;
    controls.minAzimuthAngle = -Math.PI * 0.48;
    controls.maxAzimuthAngle = Math.PI * 0.48;
    controls.update();

    const hologramGroup = new THREE.Group();
    scene.add(hologramGroup);

    const rigAnchor = new THREE.Group();
    hologramGroup.add(rigAnchor);

    // Custom Uploaded Portrait Shader Mesh (shown only when preset === 'custom')
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
        uJawOpen: { value: 0 },
        uVisemeOh: { value: 0 },
        uBlink: { value: 0 },
        uLookX: { value: 0 },
        uLookY: { value: 0 },
        uDepthScale: { value: 0.34 },
        uAccentColor: { value: new THREE.Color(STATUS_ACCENT_COLORS.idle) },
        uIsDarkBg: { value: isDarkRef.current ? 1.0 : 0.0 },
        uQuality: { value: qualityRef.current === 'ultra' ? 1.0 : 0.0 },
      },
      vertexShader: HOLOGRAM_VERTEX_SHADER,
      fragmentShader: HOLOGRAM_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const customBustGeo = new THREE.PlaneGeometry(1.78, 1.78, 96, 96);
    const customBustMesh = new THREE.Mesh(customBustGeo, hologramMat);
    customBustMesh.position.set(0, 0.04, 0);
    customBustMesh.visible = false;
    hologramGroup.add(customBustMesh);

    // Always mount the articulated 3D avatar rig (custom faces project cleanly onto its 3D head)
    const maxAnisotropy =
      qualityRef.current === 'ultra' ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
    const initTraits = customTraitsRef.current;
    const activeRig: ArticulatedAvatarRig | null = createArticulatedAvatarRig(
      presetRef.current === 'custom'
        ? {
            isFemale: initTraits?.genderCue === 'female',
            maxAnisotropy,
            customTraits: initTraits,
            quality: qualityRef.current,
          }
        : {
            isFemale: presetRef.current !== 'male',
            maxAnisotropy,
            quality: qualityRef.current,
          }
    );
    rigAnchor.add(activeRig.root);

    // Subtle Holographic Orbit Rings framing the 3D avatar
    const ringConfigs = [
      { radius: 0.92, tube: 0.007, rx: 1.38, rz: 0.24, y: 0.2, speed: 0.2, offset: 0.0 },
      { radius: 1.0, tube: 0.006, rx: 1.46, rz: -0.28, y: -0.18, speed: -0.17, offset: 0.42 },
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
          uQuality: { value: qualityRef.current === 'ultra' ? 1.0 : 0.0 },
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

    // Subtle Holographic Pedestal Base Ring
    const baseEmitterGeo = new THREE.RingGeometry(0.46, 0.51, 64);
    const baseEmitterMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const baseEmitter = new THREE.Mesh(baseEmitterGeo, baseEmitterMat);
    baseEmitter.rotation.x = -Math.PI / 2;
    baseEmitter.position.y = -0.98;
    hologramGroup.add(baseEmitter);

    // Ambient Floating Hologram Micro-Particles
    const particleCount = 110;
    const pPositions = new Float32Array(particleCount * 3);
    const pPhases = new Float32Array(particleCount);
    const pRadii = new Float32Array(particleCount);
    const pBaseY = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 * 3;
      const r = 0.62 + (i % 9) * 0.085;
      const y = -0.82 + ((i * 13) % 41) * 0.038;
      pRadii[i] = r;
      pPhases[i] = angle;
      pBaseY[i] = y;
      pPositions[i * 3] = Math.cos(angle) * r;
      pPositions[i * 3 + 1] = y;
      pPositions[i * 3 + 2] = Math.sin(angle) * r * 0.65;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    particleGeo.setDrawRange(0, qualityRef.current === 'performance' ? 36 : particleCount);
    const particleSpriteTex = createParticleSpriteTexture();
    const particleMat = new THREE.PointsMaterial({
      map: particleSpriteTex,
      color: 0x38bdf8,
      size: 0.048,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particleCloud = new THREE.Points(particleGeo, particleMat);
    hologramGroup.add(particleCloud);

    // Facial Reaction State Machine (pointer gaze + blinking + micro-saccades + click smile/nod)
    const pointerNdc = { x: 0, y: 0, active: false };
    let pointerDownPt = { x: 0, y: 0 };
    let reactionTimer = 0;

    const triggerFriendlyReaction = () => {
      reactionTimer = 1.45;
    };

    sceneRefs.current = {
      container,
      isSoftwareGl,
      renderer,
      composer,
      bloomPass,
      keyLight,
      rigAnchor,
      customBustMesh,
      hologramMat,
      ringMaterials,
      particleGeo,
      particleCount,
      activeRig,
      controls,
      camera,
      reactTrigger: triggerFriendlyReaction,
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const handlePointerMove = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerNdc.active = true;
      pointerNdc.x = THREE.MathUtils.clamp(((ev.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      pointerNdc.y = THREE.MathUtils.clamp(-(((ev.clientY - rect.top) / rect.height) * 2 - 1), -1, 1);
    };
    const handlePointerLeave = () => {
      pointerNdc.active = false;
      pointerNdc.x = 0;
      pointerNdc.y = 0;
    };
    const handlePointerDown = (ev: PointerEvent) => {
      pointerDownPt = { x: ev.clientX, y: ev.clientY };
    };
    const handlePointerUp = (ev: PointerEvent) => {
      const moved = Math.hypot(ev.clientX - pointerDownPt.x, ev.clientY - pointerDownPt.y);
      // Clean click/tap without dragging orbits triggers friendly smile + blink + nod
      if (moved < 6) {
        triggerFriendlyReaction();
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(Math.floor(entry.contentRect.width), 80);
        const h = Math.max(Math.floor(entry.contentRect.height), 80);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        if (composer) {
          composer.setSize(w, h);
        }
        if (bloomPass) {
          bloomPass.resolution.set(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    let lastTime = performance.now();
    let elapsed = 0;
    let smoothOutput = 0;
    let smoothInput = 0;
    let smoothLookX = 0;
    let smoothLookY = 0;
    let smoothJaw = 0;
    let smoothOh = 0;
    let smoothSmile = 0.14;
    let smoothBrow = 0;
    let smoothBrowKnit = 0;
    let smoothEyeSquint = 0;
    let smoothYaw = 0;
    let smoothPitch = 0;
    let smoothRoll = 0;

    // Natural randomized blink scheduler
    let nextBlinkAt = 1.4;
    let blinkClock = -1;
    let doubleBlinkQueued = false;

    // Micro-saccade subtle eye life
    let nextSaccadeAt = 0.8;
    let saccadeOffsetX = 0;
    let saccadeOffsetY = 0;

    let disposed = false;
    let rafId = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    const gl = renderer.getContext() as WebGL2RenderingContext;

    const targetAccent = new THREE.Color(STATUS_ACCENT_COLORS.idle);
    const currentAccent = new THREE.Color(STATUS_ACCENT_COLORS.idle);

    // Pre-allocated pose object reused every frame (zero heap GC in tick)
    const poseFrame: AvatarPoseInput = {
      elapsed: 0,
      dt: 0,
      speakEnergy: 0,
      listenEnergy: 0,
      lookX: 0,
      lookY: 0,
      blinkAmount: 0,
      jawOpen: 0,
      visemeOh: 0,
      smileAmount: 0,
      browRaise: 0,
      browAsym: 0,
      browKnit: 0,
      eyeSquint: 0,
      headYaw: 0,
      headPitch: 0,
      headRoll: 0,
      bodyBreath: 0,
      accentColor: currentAccent,
      isMuted: false,
      isConnecting: false,
    };

    const afterDraw = (fn: () => void) => {
      if (disposed) return;
      if (isSoftwareGl) {
        if (typeof gl.fenceSync === 'function') {
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          if (sync) gl.deleteSync(sync);
        }
        timerId = setTimeout(() => {
          if (!disposed) rafId = requestAnimationFrame(fn);
        }, 36);
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
      const curExpression = expressionRef.current;
      const exprStrength = THREE.MathUtils.clamp(expressionIntensityRef.current || 0.65, 0.25, 1);

      targetAccent.setHex(STATUS_ACCENT_COLORS[curStatus] ?? STATUS_ACCENT_COLORS.idle);
      if (curExpression === 'joyful' || curExpression === 'happy') {
        targetAccent.lerp(EXPRESSION_JOYFUL_COLOR, 0.42 * exprStrength);
      } else if (curExpression === 'analytical') {
        targetAccent.lerp(EXPRESSION_ANALYTICAL_COLOR, 0.55 * exprStrength);
      } else if (curExpression === 'thinking') {
        targetAccent.lerp(EXPRESSION_THINKING_COLOR, 0.32 * exprStrength);
      }
      currentAccent.lerp(targetAccent, Math.min(1, dt * 5));
      rimLight.color.copy(currentAccent);

      const streamingActive = isStreamingRef.current;
      const rawOutput = levelsRef.current.output || 0;
      const rawInput = levelsRef.current.input || 0;
      const effectiveOutput = streamingActive ? Math.max(rawOutput, 0.42) : rawOutput;
      smoothOutput = THREE.MathUtils.damp(smoothOutput, effectiveOutput, 18, dt);
      smoothInput = THREE.MathUtils.damp(smoothInput, rawInput, 14, dt);

      const speakEnergy = curStatus === 'speaking' || streamingActive ? Math.max(0.22, smoothOutput) : smoothOutput;
      const listenEnergy = curStatus === 'listening' ? Math.max(0.18, smoothInput) : smoothInput;
      const isSpeaking = speakEnergy > 0.06;

      if (reactionTimer > 0) {
        reactionTimer = Math.max(0, reactionTimer - dt);
      }
      const clickReact = reactionTimer > 0 ? Math.sin((reactionTimer / 1.45) * Math.PI) : 0;

      // --- 1. Natural Blink Timeline (every 2.4 - 5.2s, occasional double blink, or click-triggered) ---
      if (reactionTimer > 1.38 && blinkClock < 0) {
        blinkClock = 0;
        doubleBlinkQueued = false;
      }
      if (blinkClock < 0 && elapsed >= nextBlinkAt) {
        blinkClock = 0;
        doubleBlinkQueued = Math.random() < 0.18;
      }
      let blinkAmount = 0;
      if (blinkClock >= 0) {
        blinkClock += dt;
        const blinkDur = 0.19;
        if (blinkClock < blinkDur) {
          const t = blinkClock / blinkDur;
          // Crisp eyelid snap close (fast down, smooth lift)
          blinkAmount = t < 0.36 ? Math.sin((t / 0.36) * (Math.PI / 2)) : Math.cos(((t - 0.36) / 0.64) * (Math.PI / 2));
        } else {
          blinkClock = -1;
          nextBlinkAt = doubleBlinkQueued
            ? elapsed + 0.14
            : elapsed + 2.3 + Math.random() * 2.9;
          doubleBlinkQueued = false;
        }
      }

      // --- 2. Living Eye Gaze + Micro-Saccades ---
      if (elapsed >= nextSaccadeAt) {
        nextSaccadeAt = elapsed + 0.9 + Math.random() * 1.9;
        saccadeOffsetX = (Math.random() - 0.5) * 0.16;
        saccadeOffsetY = (Math.random() - 0.5) * 0.1;
      }
      let targetLookX = pointerNdc.active ? pointerNdc.x * 0.82 : saccadeOffsetX;
      let targetLookY = pointerNdc.active ? pointerNdc.y * 0.72 : saccadeOffsetY;
      if (curStatus === 'connecting' || curExpression === 'thinking') {
        targetLookX += 0.24;
        targetLookY += 0.2;
      } else if (curExpression === 'analytical' && !pointerNdc.active) {
        // Focused horizontal reading/code-scanning eye saccades
        targetLookX += Math.sin(elapsed * 1.55) * 0.22;
        targetLookY -= 0.14 + Math.cos(elapsed * 0.95) * 0.04;
      } else if (curStatus === 'listening' && !pointerNdc.active) {
        targetLookX *= 0.45;
        targetLookY *= 0.45;
      }
      smoothLookX = THREE.MathUtils.damp(smoothLookX, targetLookX, 11, dt);
      smoothLookY = THREE.MathUtils.damp(smoothLookY, targetLookY, 11, dt);

      // --- 3. Lip & Jaw Speech Articulation (Syllable & Vowel Viseme Modulation) ---
      let targetJaw = 0;
      let targetOh = 0;
      if (isSpeaking) {
        // Blend syllable cadence harmonics with live output amplitude for convincing lip motion
        const syllable =
          0.54 +
          0.32 * Math.sin(elapsed * 14.5) +
          0.18 * Math.sin(elapsed * 22.8 + 1.1) +
          0.12 * Math.cos(elapsed * 8.2);
        targetJaw = THREE.MathUtils.clamp(speakEnergy * syllable * 1.08, 0.08, 0.95);
        const ohCycle = Math.max(0, Math.sin(elapsed * 7.4 + 0.7));
        targetOh = THREE.MathUtils.clamp(speakEnergy * ohCycle * 0.85, 0, 0.8);
      } else if (curStatus === 'listening') {
        targetJaw = 0.02;
      }
      smoothJaw = THREE.MathUtils.damp(smoothJaw, targetJaw, 22, dt);
      smoothOh = THREE.MathUtils.damp(smoothOh, targetOh, 16, dt);

      // --- 4. Smile, Focus & Eyebrow Expression ---
      const isPositiveExpr = curExpression === 'joyful' || curExpression === 'happy';
      const exprSmileBoost = isPositiveExpr
        ? 0.56 * exprStrength
        : curExpression === 'analytical'
        ? -0.09
        : curExpression === 'thinking'
        ? -0.06
        : 0;
      const targetSmile = THREE.MathUtils.clamp(
        0.15 +
          exprSmileBoost +
          (curStatus === 'listening' ? 0.18 : 0) +
          (isSpeaking ? 0.14 * (1 - smoothOh) : 0) +
          clickReact * 0.65 -
          (curStatus === 'muted' ? 0.1 : 0),
        0,
        0.92
      );
      smoothSmile = THREE.MathUtils.damp(smoothSmile, targetSmile, 8, dt);

      const targetBrow =
        (isSpeaking ? Math.max(0, Math.sin(elapsed * 4.2)) * speakEnergy * 0.65 : 0) +
        (curStatus === 'listening' ? 0.22 + listenEnergy * 0.25 : 0) +
        (isPositiveExpr ? 0.28 * exprStrength : 0) +
        clickReact * 0.45;
      smoothBrow = THREE.MathUtils.damp(smoothBrow, targetBrow, 9, dt);

      const targetBrowKnit = curExpression === 'analytical' ? 0.52 * exprStrength : 0;
      const targetEyeSquint = curExpression === 'analytical' ? 0.34 * exprStrength : 0;
      smoothBrowKnit = THREE.MathUtils.damp(smoothBrowKnit, targetBrowKnit, 8, dt);
      smoothEyeSquint = THREE.MathUtils.damp(smoothEyeSquint, targetEyeSquint, 8, dt);

      const browAsym =
        curExpression === 'analytical'
          ? 0.62 * exprStrength + Math.sin(elapsed * 1.15) * 0.14
          : curExpression === 'thinking'
          ? 0.52 + Math.sin(elapsed * 1.4) * 0.18
          : curStatus === 'listening'
          ? Math.sin(elapsed * 1.1) * 0.45
          : Math.sin(elapsed * 0.6) * 0.15;

      // --- 5. Head, Neck & Breathing Motion ---
      const breath = Math.sin(elapsed * 1.65);
      const targetYaw =
        smoothLookX * 0.28 +
        (isSpeaking ? Math.sin(elapsed * 1.9) * 0.095 : Math.sin(elapsed * 0.55) * 0.045);
      const targetPitch =
        -smoothLookY * 0.18 +
        (curExpression === 'analytical' ? 0.045 : isPositiveExpr ? -0.025 : 0) +
        (isSpeaking
          ? Math.sin(elapsed * 4.8) * (0.03 + speakEnergy * 0.06)
          : curStatus === 'listening'
          ? -0.025 + Math.sin(elapsed * 1.8) * 0.022
          : Math.sin(elapsed * 0.7) * 0.015) +
        clickReact * 0.11 * Math.sin(elapsed * 8.0);
      const targetRoll =
        (curExpression === 'analytical' ? -0.065 * exprStrength : 0) +
        (curExpression === 'thinking' ? 0.085 : 0) +
        (isPositiveExpr ? Math.sin(elapsed * 1.8) * 0.04 : 0) +
        (curStatus === 'listening' ? 0.065 : Math.sin(elapsed * 0.48) * 0.028) +
        (isSpeaking ? Math.sin(elapsed * 2.4) * 0.04 : 0);

      smoothYaw = THREE.MathUtils.damp(smoothYaw, targetYaw, 6, dt);
      smoothPitch = THREE.MathUtils.damp(smoothPitch, targetPitch, 6.5, dt);
      smoothRoll = THREE.MathUtils.damp(smoothRoll, targetRoll, 5.5, dt);

      // Apply pose to active articulated 3D rig (if 'female' or 'male')
      const curRig = sceneRefs.current?.activeRig;
      if (curRig) {
        poseFrame.elapsed = elapsed;
        poseFrame.dt = dt;
        poseFrame.speakEnergy = speakEnergy;
        poseFrame.listenEnergy = listenEnergy;
        poseFrame.lookX = smoothLookX;
        poseFrame.lookY = smoothLookY;
        poseFrame.blinkAmount = blinkAmount;
        poseFrame.jawOpen = smoothJaw;
        poseFrame.visemeOh = smoothOh;
        poseFrame.smileAmount = smoothSmile;
        poseFrame.browRaise = smoothBrow;
        poseFrame.browAsym = browAsym;
        poseFrame.browKnit = smoothBrowKnit;
        poseFrame.eyeSquint = smoothEyeSquint;
        poseFrame.headYaw = smoothYaw;
        poseFrame.headPitch = smoothPitch;
        poseFrame.headRoll = smoothRoll;
        poseFrame.bodyBreath = breath;
        poseFrame.accentColor = currentAccent;
        poseFrame.isMuted = curStatus === 'muted';
        poseFrame.isConnecting = curStatus === 'connecting';
        curRig.applyPose(poseFrame);
      }

      // Apply pose to custom photo hologram shader (if preset === 'custom')
      if (customBustMesh.visible) {
        hologramMat.uniforms.uTime.value = elapsed;
        hologramMat.uniforms.uSpeakEnergy.value = speakEnergy;
        hologramMat.uniforms.uListenEnergy.value = listenEnergy;
        hologramMat.uniforms.uJawOpen.value = smoothJaw;
        hologramMat.uniforms.uVisemeOh.value = smoothOh;
        hologramMat.uniforms.uBlink.value = blinkAmount;
        hologramMat.uniforms.uLookX.value = smoothLookX;
        hologramMat.uniforms.uLookY.value = smoothLookY;
        hologramMat.uniforms.uAccentColor.value.copy(currentAccent);
        hologramMat.uniforms.uIsDarkBg.value = isDarkRef.current ? 1.0 : 0.0;

        customBustMesh.rotation.y = smoothYaw * 0.72;
        customBustMesh.rotation.x = smoothPitch * 0.68;
      }

      // Orbiting light rings & particles respond dynamically to speech & listening
      const ringEnergy = Math.max(speakEnergy, listenEnergy * 0.65);
      ringAnchor.rotation.y += dt * (0.14 + ringEnergy * 0.55);
      for (let i = 0; i < ringMaterials.length; i++) {
        ringMaterials[i].uniforms.uTime.value = elapsed;
        ringMaterials[i].uniforms.uEnergy.value = ringEnergy;
        ringMaterials[i].uniforms.uColorA.value.copy(currentAccent);
        const pulseScale = 1 + ringEnergy * (0.045 + i * 0.02) * Math.sin(elapsed * 4 + i);
        ringMeshes[i].scale.setScalar(pulseScale);
      }

      baseEmitterMat.color.copy(currentAccent);
      baseEmitterMat.opacity = 0.22 + ringEnergy * 0.32;

      particleMat.color.copy(currentAccent);
      particleMat.opacity = 0.45 + ringEnergy * 0.38;
      particleCloud.rotation.y += dt * (0.16 + ringEnergy * 0.42);

      const isUltraFrame = qualityRef.current === 'ultra';
      const activeParticleLimit = isUltraFrame ? particleCount : 36;
      const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < activeParticleLimit; i++) {
        const yOff = Math.sin(elapsed * 1.2 + pPhases[i]) * 0.035;
        const rPulse = pRadii[i] * (1 + ringEnergy * 0.09);
        const ang = pPhases[i] + elapsed * 0.12;
        posAttr.setX(i, Math.cos(ang) * rPulse);
        posAttr.setZ(i, Math.sin(ang) * rPulse * 0.68);
        posAttr.setY(i, pBaseY[i] + yOff);
      }
      posAttr.needsUpdate = true;

      controls.update();
      if (composer && isUltraFrame && !isSoftwareGl) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
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
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      controls.dispose();

      if (sceneRefs.current?.activeRig) {
        sceneRefs.current.activeRig.dispose();
        sceneRefs.current.activeRig = null;
      }
      sceneRefs.current = null;

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

      if (renderPass) renderPass.dispose();
      if (bloomPass) bloomPass.dispose();
      if (outputPass) outputPass.dispose();
      if (composer) composer.dispose();
      if (composerRenderTarget) composerRenderTarget.dispose();

      envTarget.dispose();
      activeTexturesRef.current.color?.dispose();
      activeTexturesRef.current.depth?.dispose();
      particleSpriteTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [levelsRef]);

  // Apply Rendering Quality (Performance vs Ultra) live without recreating WebGLRenderer
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const isUltra = renderingQuality === 'ultra';
    const useHighRes = isUltra && !refs.isSoftwareGl;
    const pr = useHighRes ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    refs.renderer.setPixelRatio(pr);
    const w = Math.max(refs.container.clientWidth, 80);
    const h = Math.max(refs.container.clientHeight, 80);
    refs.renderer.setSize(w, h, false);

    if (refs.composer) {
      refs.composer.setPixelRatio(pr);
      refs.composer.setSize(w, h);
    }
    if (refs.bloomPass) {
      refs.bloomPass.resolution.set(w, h);
    }

    refs.renderer.shadowMap.enabled = useHighRes;
    refs.keyLight.castShadow = useHighRes;
    refs.controls.enableDamping = useHighRes;
    refs.particleGeo.setDrawRange(0, isUltra ? refs.particleCount : 36);
    refs.hologramMat.uniforms.uQuality.value = isUltra ? 1.0 : 0.0;
    for (let i = 0; i < refs.ringMaterials.length; i++) {
      refs.ringMaterials[i].uniforms.uQuality.value = isUltra ? 1.0 : 0.0;
    }
  }, [renderingQuality]);

  // Swap cleanly between Female, Male, and Face-Matched Custom 3D rigs without recreating WebGLRenderer
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    let cancelled = false;

    const maxAnisotropy =
      renderingQuality === 'ultra' ? Math.min(8, refs.renderer.capabilities.getMaxAnisotropy()) : 1;
    const mountRig = (nextRig: ArticulatedAvatarRig) => {
      if (refs.activeRig) {
        refs.rigAnchor.remove(refs.activeRig.root);
        refs.activeRig.dispose();
      }
      refs.customBustMesh.visible = false;
      refs.rigAnchor.add(nextRig.root);
      refs.activeRig = nextRig;
    };

    if (avatarPreset !== 'custom') {
      mountRig(
        createArticulatedAvatarRig({
          isFemale: avatarPreset !== 'male',
          maxAnisotropy,
          quality: renderingQuality,
        })
      );
      refs.reactTrigger();
      return;
    }

    // First mount matched trait skeleton immediately while cropped face image decodes
    mountRig(
      createArticulatedAvatarRig({
        isFemale: customTraits?.genderCue === 'female',
        maxAnisotropy,
        customTraits,
        quality: renderingQuality,
      })
    );

    if (avatarSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (cancelled || !sceneRefs.current) return;
        const facedRig = createArticulatedAvatarRig({
          isFemale: customTraits?.genderCue === 'female',
          maxAnisotropy:
            renderingQuality === 'ultra'
              ? Math.min(8, sceneRefs.current.renderer.capabilities.getMaxAnisotropy())
              : 1,
          customFaceImg: img,
          customTraits,
          quality: renderingQuality,
        });
        mountRig(facedRig);
        sceneRefs.current.reactTrigger();
      };
      img.onerror = () => {
        // Fallback keeps trait-matched 3D rig if image decode fails
        void buildHologramTextures(avatarSrc, isPrestyledHologram).catch(() => {});
      };
      img.src = avatarSrc;
    }

    return () => {
      cancelled = true;
    };
  }, [avatarPreset, avatarSrc, customTraits, isPrestyledHologram, renderingQuality]);

  return (
    <div
      ref={mountRef}
      data-testid="live-voice-3d-canvas"
      data-quality={renderingQuality}
      title="Drag to orbit · Move cursor for eye tracking · Click to smile & nod"
      className="w-full h-full relative select-none touch-none cursor-grab active:cursor-grabbing bg-transparent"
    >
      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-cyan-300 pointer-events-none">
          Restoring 3D avatar viewport...
        </div>
      )}
    </div>
  );
};
