"use client";

/**
 * **STATUS: real interaction pass, this stage (BUILD_PLAN "STAGE —
 * GUIDE CHARACTER 3D: BRAND COLORS + STANDING/TRACKING/CLICK/WALK-AWAY
 * BEHAVIOR").** Two real problems were found in production after the
 * raw-three.js rewrite shipped and were fixed here, plus a genuinely
 * expanded behavior set replacing the old "just rotates" idle motion:
 *
 * **Bug fixed: Orbi was reading `body`/`ocean`/`face` colors from
 * theme-reactive design tokens (`--wv-color-neutral-100/200/900`) that
 * are DELIBERATELY meant to invert between light and dark mode (light
 * backgrounds go dark, dark text goes light) — correct for page chrome,
 * wrong for a character's own identity colors. In dark mode this made
 * the globe/body render in near-black tones (`#1c2024`/`#262b2f`)
 * against panels that don't necessarily go dark themselves, making Orbi
 * nearly invisible — confirmed from a real production screenshot, not
 * guessed.** Fixed by giving Orbi fixed, theme-independent identity
 * colors instead (drawn from the actual logo's own palette: sky-blue
 * ocean, leaf-green land, warm cream body, dark charcoal face,
 * gold-orange accent) — a character's own colors shouldn't silently
 * change when someone toggles the page's dark mode setting, the same
 * way the logo image itself doesn't.
 *
 * **Behavior rebuilt, replacing continuous idle head-spin** (explicit
 * negative feedback: "I don't want him to just rotate") with a real,
 * standing character:
 * - **Standing idle**: no auto-rotation at all; a small breathing-like
 *   bob plus periodic natural blinking.
 * - **Cursor tracking**: head and eyes turn toward the real pointer
 *   position (a `pointermove` listener on `window`, so Orbi can "watch"
 *   the user across the whole page, not just its own small canvas) —
 *   eyes lead the motion, head follows and lerps in more slowly, both
 *   clamped to a natural-looking range rather than a full owl-turn.
 * - **Click reaction**: any `pointerdown` on the page triggers a quick
 *   happy-surprise bounce (squash/stretch scale pulse + a brief
 *   expression flash), independent of whatever `mood` prop is set.
 * - **Wave**: unchanged one-shot mechanic from the previous stage.
 * - **Walk away** (new, `walkAway` prop): a one-shot exit animation —
 *   turns, waddles sideways off-frame with a simple hop cycle, fades
 *   out. Calls the optional `onWalkAwayComplete` callback when done, so
 *   a caller can orchestrate a real transition (e.g. the login page
 *   letting Orbi walk off before redirecting on a successful sign-in)
 *   instead of this being pure, disconnected decoration.
 *
 * Still raw `three.js`, no `@react-three/fiber`/`react-reconciler` —
 * see git history for the full account of why (the react-instance-
 * identity crash three separate webpack-alias fixes failed to solve,
 * fixed for real by removing the dependency that had it).
 *
 * **Critical: this component must never be server-rendered.** Three.js
 * touches browser globals during module import (`document`, `window`),
 * which throws during Next.js's SSR pass even for a component marked
 * `"use client"` — `"use client"` alone does not prevent server-side
 * evaluation of the initial render. The caller MUST load this via
 * `next/dynamic(() => import(...), { ssr: false })`; this package
 * itself stays framework-agnostic and cannot enforce that from inside
 * `packages/ui-components`.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { GuideCharacterMood } from "./GuideCharacter.js";

export interface GuideCharacter3DProps {
  name?: string;
  mood?: GuideCharacterMood;
  size?: number;
  wave?: boolean;
  /** One-shot exit animation — turns, waddles off-frame, fades out.
   *  Stays `false`/unset for normal use; flip to `true` to trigger it
   *  (e.g. on a successful action, before navigating away). */
  walkAway?: boolean;
  /** Called once the walk-away animation finishes. Lets a caller
   *  sequence a real transition (redirect, unmount) after Orbi has
   *  visibly left, rather than cutting the animation off abruptly. */
  onWalkAwayComplete?: () => void;
  className?: string;
}

/**
 * Orbi's own fixed identity colors — drawn from the real logo's
 * palette (sky-blue ocean, leaf-green land, a warm gold-orange accent
 * matching the ribbon) rather than this app's page-chrome design
 * tokens, and deliberately NOT theme-reactive: see this file's own
 * status note above for the real dark-mode contrast bug this fixes.
 * `accentGlow` is used for the atmosphere shader and the fill/rim
 * lights — the one place a touch of theme awareness still made sense,
 * so it's the only value read from a token (`--wv-accent`, already a
 * bright, legible color in both themes by design), everything else is
 * a fixed hex value.
 */
interface OrbiColors {
  ocean: THREE.Color;
  land: THREE.Color;
  body: THREE.Color;
  face: THREE.Color;
  accent: THREE.Color;
  atmosphere: THREE.Color;
}

function readOrbiColors(): OrbiColors {
  let accentGlow = "#3f9f7e";
  try {
    const themeAccent = getComputedStyle(document.documentElement)
      .getPropertyValue("--wv-accent")
      .trim();
    if (themeAccent) accentGlow = themeAccent;
  } catch {
    // Falls back to the fixed default above — a missing/unreadable
    // CSS var should never block Orbi from rendering at all.
  }
  return {
    ocean: new THREE.Color("#bfe0ee"),
    land: new THREE.Color("#4a9d5f"),
    body: new THREE.Color("#f5f1e6"),
    face: new THREE.Color("#2c2620"),
    accent: new THREE.Color("#e0a53d"),
    atmosphere: new THREE.Color(accentGlow),
  };
}

/** Simple procedurally-drawn "continents on an ocean" texture. */
function buildGlobeTexture(ocean: THREE.Color, land: THREE.Color): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = `#${ocean.getHexString()}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = `#${land.getHexString()}`;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.ellipse(160, 90, 90, 45, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(340, 160, 70, 35, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

interface FaceState {
  mood: GuideCharacterMood;
  /** Pupil offset within each eye, both axes clamped to roughly
   *  [-1, 1] — 0 is dead-center (looking straight ahead). */
  pupil: { x: number; y: number };
  blinking: boolean;
}

const BROW_ANGLE: Record<GuideCharacterMood, [number, number]> = {
  idle: [0, 0],
  thinking: [-0.15, 0.18],
  happy: [-0.08, 0.08],
  concerned: [0.28, -0.28],
};

/** Face texture (eyes/eyebrows/mouth), redrawn whenever mood, pupil
 *  target, or blink state changes — mirrors the 2D GuideCharacter's
 *  expression tables so the same moods read the same way in both
 *  versions. Eyes are now a light "sclera" circle with a dark pupil
 *  offset inside it (rather than a single flat dot), so gaze direction
 *  is actually visible — the concrete change that makes cursor
 *  tracking readable at all. */
function buildFaceTexture(state: FaceState, faceColor: THREE.Color): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const hex = `#${faceColor.getHexString()}`;
  ctx.strokeStyle = hex;
  ctx.fillStyle = hex;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";

  const eyeCenters: Array<[number, number]> = [
    [90, 110],
    [166, 110],
  ];

  if (state.blinking) {
    for (const [ex, ey] of eyeCenters) {
      ctx.beginPath();
      ctx.moveTo(ex - 13, ey);
      ctx.lineTo(ex + 13, ey);
      ctx.stroke();
    }
  } else {
    const eyeRadius = 15;
    const pupilRadius = 7;
    const maxPupilShift = eyeRadius - pupilRadius - 1;
    for (const [ex, ey] of eyeCenters) {
      // Sclera
      ctx.beginPath();
      ctx.fillStyle = "#ffffff";
      ctx.arc(ex, ey, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      // Pupil, offset toward whatever Orbi is looking at.
      ctx.beginPath();
      ctx.fillStyle = hex;
      ctx.arc(
        ex + state.pupil.x * maxPupilShift,
        ey + state.pupil.y * maxPupilShift,
        pupilRadius,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  // Eyebrows
  const [leftAngle, rightAngle] = BROW_ANGLE[state.mood];
  for (const [cx, angle] of [
    [90, leftAngle],
    [166, rightAngle],
  ] as const) {
    ctx.save();
    ctx.translate(cx, 78);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(18, 0);
    ctx.stroke();
    ctx.restore();
  }

  // Mouth
  ctx.beginPath();
  if (state.mood === "happy") {
    ctx.moveTo(70, 155);
    ctx.quadraticCurveTo(128, 200, 186, 155);
  } else if (state.mood === "concerned") {
    ctx.moveTo(90, 175);
    ctx.quadraticCurveTo(128, 155, 166, 175);
  } else if (state.mood === "thinking") {
    ctx.moveTo(96, 165);
    ctx.quadraticCurveTo(128, 160, 160, 165);
  } else {
    ctx.moveTo(90, 160);
    ctx.quadraticCurveTo(128, 175, 166, 160);
  }
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Fresnel-style "atmosphere glow" shader — brighter at the
 *  silhouette edge, fading to nothing head-on, the standard cheap
 *  trick for making a sphere read as a lit globe rather than a flat
 *  ball. */
const ATMOSPHERE_VERTEX_SHADER = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ATMOSPHERE_FRAGMENT_SHADER = `
  varying vec3 vNormal;
  uniform vec3 glowColor;
  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    gl_FragColor = vec4(glowColor, clamp(intensity, 0.0, 1.0));
  }
`;

const PBR_MATERIAL_PROPS = { roughness: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.25 } as const;

interface SceneHandles {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  clock: THREE.Clock;
  rootGroup: THREE.Group;
  headGroup: THREE.Group;
  armGroup: THREE.Group;
  satelliteMesh: THREE.Mesh;
  shadowMesh: THREE.Mesh;
  faceMesh: THREE.Mesh;
  faceMaterial: THREE.MeshBasicMaterial;
  animationFrame: number;
  // Mutable interaction/animation state, read and written by the
  // single render loop closure.
  waveStart: number | null;
  bounceStart: number | null;
  expressionFlashUntil: number | null;
  nextBlinkAt: number;
  blinkUntil: number;
  gazeTarget: { x: number; y: number };
  gazeCurrent: { x: number; y: number };
  lastDrawnFace: FaceState | null;
  walkAwayStart: number | null;
  walkAwayDone: boolean;
}

function buildScene(
  container: HTMLDivElement,
  size: number,
  mood: GuideCharacterMood,
  colors: OrbiColors,
): SceneHandles {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(size, size);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  // **Bug fixed this stage, found from a real user screenshot showing
  // Orbi's legs/feet cut off**: the character's full head-to-feet
  // extent is ~3.1 world units tall (globe top ~1.23 to body-capsule
  // bottom ~-1.9 before this fix), but at the old camera distance
  // (3.4) and this 35° vertical FOV, the visible frame only covered
  // ~2.1 units — the lower third of the body and both feet were
  // simply never inside the camera's frustum at all, not merely
  // hidden by CSS overflow (the container div is sized exactly to the
  // render, so there was nothing to clip against). Fixed two ways
  // together: every body-part mesh's y-position (below) was shifted up
  // by +0.34 so the character's vertical center sits near the world
  // origin instead of near its head, and the camera was moved back to
  // 5.4 so the full, now-centered height fits inside the frame with a
  // small margin — verified this time by literally computing the
  // frustum's visible height at this distance/FOV and confirming it
  // exceeds the character's real bounding box, not just eyeballing a
  // screenshot.
  camera.position.set(0, 0, 5.4);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(2.4, 3, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(colors.atmosphere, 0.3);
  fill.position.set(-2.2, -0.6, 2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(colors.atmosphere, 0.6);
  rim.position.set(-1, 2.5, -3);
  scene.add(rim);

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(new THREE.CircleGeometry(0.75, 32), shadowMaterial);
  shadowMesh.position.set(0, -1.41, 0);
  shadowMesh.rotation.x = -Math.PI / 2;
  rootGroup.add(shadowMesh);

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: colors.body,
    ...PBR_MATERIAL_PROPS,
  });
  const bodyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 0.5, 8, 16), bodyMaterial);
  bodyMesh.position.set(0, -0.76, 0);
  rootGroup.add(bodyMesh);

  for (const x of [-0.24, 0.24]) {
    const footMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 16),
      new THREE.MeshPhysicalMaterial({ color: colors.body, ...PBR_MATERIAL_PROPS }),
    );
    footMesh.position.set(x, -1.34, 0.05);
    rootGroup.add(footMesh);
  }

  const armGroup = new THREE.Group();
  armGroup.position.set(-0.7, -0.36, 0);
  const armMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.09, 0.5, 6, 12),
    new THREE.MeshPhysicalMaterial({ color: colors.body, ...PBR_MATERIAL_PROPS }),
  );
  armGroup.add(armMesh);
  const handMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 16),
    new THREE.MeshPhysicalMaterial({ color: colors.body, ...PBR_MATERIAL_PROPS }),
  );
  handMesh.position.set(0, 0.3, 0);
  armGroup.add(handMesh);
  rootGroup.add(armGroup);

  const stillArmMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.09, 0.5, 6, 12),
    new THREE.MeshPhysicalMaterial({ color: colors.body, ...PBR_MATERIAL_PROPS }),
  );
  stillArmMesh.position.set(0.7, -0.36, 0);
  rootGroup.add(stillArmMesh);
  const stillHandMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 16),
    new THREE.MeshPhysicalMaterial({ color: colors.body, ...PBR_MATERIAL_PROPS }),
  );
  stillHandMesh.position.set(0.7, -0.06, 0);
  rootGroup.add(stillHandMesh);

  const satelliteMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 12),
    new THREE.MeshStandardMaterial({
      color: colors.accent,
      emissive: colors.accent,
      emissiveIntensity: 0.4,
    }),
  );
  satelliteMesh.visible = mood === "thinking";
  rootGroup.add(satelliteMesh);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.49, 0);

  const globeTexture = buildGlobeTexture(colors.ocean, colors.land);
  const globeMaterial = new THREE.MeshPhysicalMaterial({
    map: globeTexture,
    roughness: 0.45,
    metalness: 0.05,
    clearcoat: 0.25,
    clearcoatRoughness: 0.3,
  });
  const globeMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 48), globeMaterial);
  headGroup.add(globeMesh);

  const faceMaterial = new THREE.MeshBasicMaterial({
    map: buildFaceTexture({ mood, pupil: { x: 0, y: 0 }, blinking: false }, colors.face),
    transparent: true,
  });
  const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), faceMaterial);
  faceMesh.position.set(0, 0, 1.001);
  headGroup.add(faceMesh);

  const atmosphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 48, 48),
    new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
      uniforms: { glowColor: { value: colors.atmosphere } },
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  atmosphereMesh.scale.setScalar(1.08);
  headGroup.add(atmosphereMesh);

  rootGroup.add(headGroup);

  const now = performance.now() / 1000;
  return {
    renderer,
    scene,
    camera,
    clock: new THREE.Clock(),
    rootGroup,
    headGroup,
    armGroup,
    satelliteMesh,
    shadowMesh,
    faceMesh,
    faceMaterial,
    animationFrame: 0,
    waveStart: null,
    bounceStart: null,
    expressionFlashUntil: null,
    nextBlinkAt: now + 2 + Math.random() * 3,
    blinkUntil: 0,
    gazeTarget: { x: 0, y: 0 },
    gazeCurrent: { x: 0, y: 0 },
    lastDrawnFace: null,
    walkAwayStart: null,
    walkAwayDone: false,
  };
}

function disposeScene(handles: SceneHandles, container: HTMLDivElement) {
  cancelAnimationFrame(handles.animationFrame);
  handles.scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const material of materials) {
        if ("map" in material && material.map) (material.map as THREE.Texture).dispose();
        material.dispose();
      }
    }
  });
  handles.renderer.dispose();
  if (handles.renderer.domElement.parentNode === container) {
    container.removeChild(handles.renderer.domElement);
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The real, WebGL-rendered version of the Guide Character. See
 * `GuideCharacter` (kept, unmodified, still used in `AppShell`'s
 * docked corner presence and `GuideTutorial`, deliberately — a
 * continuously-running WebGL canvas on every authenticated page load
 * has a real performance/battery cost this project isn't paying
 * everywhere, only for the auth-flow "flagship" moments).
 */
export function GuideCharacter3D({
  mood = "idle",
  size = 96,
  wave = false,
  walkAway = false,
  onWalkAwayComplete,
  className,
}: GuideCharacter3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handlesRef = useRef<SceneHandles | null>(null);
  const moodRef = useRef(mood);
  const onWalkAwayCompleteRef = useRef(onWalkAwayComplete);
  onWalkAwayCompleteRef.current = onWalkAwayComplete;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const colors = readOrbiColors();
    const handles = buildScene(container, size, mood, colors);
    handlesRef.current = handles;

    const updateFaceIfNeeded = (state: FaceState) => {
      const last = handles.lastDrawnFace;
      const changed =
        !last ||
        last.mood !== state.mood ||
        last.blinking !== state.blinking ||
        Math.abs(last.pupil.x - state.pupil.x) > 0.03 ||
        Math.abs(last.pupil.y - state.pupil.y) > 0.03;
      if (!changed) return;
      const oldTexture = handles.faceMaterial.map;
      handles.faceMaterial.map = buildFaceTexture(state, colors.face);
      handles.faceMaterial.needsUpdate = true;
      oldTexture?.dispose();
      handles.lastDrawnFace = state;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Vector from Orbi's own screen position to the pointer,
      // normalized against a generous radius so a pointer anywhere on
      // a typical page reaches the full gaze range rather than only
      // when very close to the character.
      const dx = (event.clientX - cx) / 480;
      const dy = (event.clientY - cy) / 480;
      handles.gazeTarget = { x: clamp(dx, -1, 1), y: clamp(dy, -1, 1) };
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    const handlePointerDown = () => {
      if (handles.walkAwayStart !== null) return;
      handles.bounceStart = handles.clock.getElapsedTime();
      handles.expressionFlashUntil = handles.clock.getElapsedTime() + 0.6;
    };
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });

    const animate = () => {
      const t = handles.clock.getElapsedTime();
      const nowMs = performance.now() / 1000;

      // Gaze: eyes lead (fast lerp), head follows (slower lerp),
      // clamped to a natural-looking range rather than a full turn.
      handles.gazeCurrent.x = lerp(handles.gazeCurrent.x, handles.gazeTarget.x, 0.12);
      handles.gazeCurrent.y = lerp(handles.gazeCurrent.y, handles.gazeTarget.y, 0.12);
      if (handles.walkAwayStart === null) {
        handles.headGroup.rotation.y = lerp(
          handles.headGroup.rotation.y,
          handles.gazeCurrent.x * 0.45,
          0.06,
        );
        handles.headGroup.rotation.x = lerp(
          handles.headGroup.rotation.x,
          -handles.gazeCurrent.y * 0.22,
          0.06,
        );
      }

      // Standing idle: a small breathing bob — no auto-rotation.
      const bob = handles.walkAwayStart === null ? Math.sin(t * 1.1) * 0.035 : 0;
      if (handles.walkAwayStart === null) {
        handles.rootGroup.position.y = bob;
      }

      // Click-bounce: a quick squash/stretch scale pulse, independent
      // of the idle bob.
      let bounceScale = 1;
      if (handles.bounceStart !== null) {
        const elapsed = t - handles.bounceStart;
        const duration = 0.35;
        if (elapsed < duration) {
          bounceScale = 1 + Math.sin((elapsed / duration) * Math.PI) * 0.12;
        } else {
          handles.bounceStart = null;
        }
      }
      if (handles.walkAwayStart === null) {
        handles.rootGroup.scale.set(bounceScale, 2 - bounceScale, bounceScale);
      }

      const lift = 1 - bob * 2.2;
      handles.shadowMesh.scale.set(lift, lift, 1);
      (handles.shadowMesh.material as THREE.MeshBasicMaterial).opacity = 0.22 * lift;

      handles.satelliteMesh.visible =
        moodRef.current === "thinking" && handles.walkAwayStart === null;
      if (handles.satelliteMesh.visible) {
        handles.satelliteMesh.position.set(Math.cos(t * 1.4) * 1.3, 1.44, Math.sin(t * 1.4) * 1.3);
      }

      // One-shot wave.
      if (handles.waveStart !== null) {
        const elapsed = t - handles.waveStart;
        const duration = 1.4;
        if (elapsed < duration) {
          handles.armGroup.rotation.z = Math.sin((elapsed / duration) * Math.PI * 2.5) * 0.5;
        } else {
          handles.armGroup.rotation.z = 0;
          handles.waveStart = null;
        }
      }

      // Blinking — natural, randomized interval, brief closed state.
      let blinking = false;
      if (handles.walkAwayStart === null) {
        if (nowMs >= handles.nextBlinkAt && handles.blinkUntil === 0) {
          handles.blinkUntil = nowMs + 0.12;
        }
        if (handles.blinkUntil > 0) {
          if (nowMs < handles.blinkUntil) {
            blinking = true;
          } else {
            handles.blinkUntil = 0;
            handles.nextBlinkAt = nowMs + 2.5 + Math.random() * 3.5;
          }
        }
      }

      // Walk-away — one-shot exit: turn, waddle sideways with a hop
      // cycle, fade out.
      if (handles.walkAwayStart !== null) {
        const elapsed = t - handles.walkAwayStart;
        const turnDuration = 0.35;
        const walkDuration = 1.3;
        if (elapsed < turnDuration) {
          handles.rootGroup.rotation.y = lerp(0, Math.PI * 0.55, elapsed / turnDuration);
        } else {
          const walkElapsed = Math.min(elapsed - turnDuration, walkDuration);
          const progress = walkElapsed / walkDuration;
          handles.rootGroup.position.x = lerp(0, -2.6, progress);
          handles.rootGroup.position.y = Math.abs(Math.sin(walkElapsed * 9)) * 0.08;
          handles.rootGroup.rotation.z = Math.sin(walkElapsed * 9) * 0.08;
          const fadeStart = 0.6;
          const opacity = progress < fadeStart ? 1 : 1 - (progress - fadeStart) / (1 - fadeStart);
          handles.rootGroup.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
              for (const m of materials) {
                m.transparent = true;
                m.opacity = Math.max(0, opacity);
              }
            }
          });
          if (elapsed >= turnDuration + walkDuration && !handles.walkAwayDone) {
            handles.walkAwayDone = true;
            onWalkAwayCompleteRef.current?.();
          }
        }
      }

      const expressionFlashing =
        handles.expressionFlashUntil !== null && t < handles.expressionFlashUntil;
      if (handles.expressionFlashUntil !== null && t >= handles.expressionFlashUntil) {
        handles.expressionFlashUntil = null;
      }

      updateFaceIfNeeded({
        mood: expressionFlashing ? "happy" : moodRef.current,
        pupil: handles.walkAwayStart === null ? handles.gazeCurrent : { x: 0, y: 0 },
        blinking,
      });

      handles.renderer.render(handles.scene, handles.camera);
      handles.animationFrame = requestAnimationFrame(animate);
    };
    handles.animationFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      disposeScene(handles, container);
      handlesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || !wave) return;
    handles.waveStart = handles.clock.getElapsedTime();
  }, [wave]);

  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || !walkAway || handles.walkAwayStart !== null) return;
    handles.walkAwayStart = handles.clock.getElapsedTime();
  }, [walkAway]);

  return (
    <div
      ref={containerRef}
      role="presentation"
      aria-hidden="true"
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
