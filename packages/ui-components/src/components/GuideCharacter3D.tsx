"use client";

/**
 * **STATUS: rewritten to raw `three.js`, no `@react-three/fiber` and
 * no `react-reconciler` — a different class of fix from the three
 * `resolve.alias` attempts already tried and confirmed not to work
 * (see git history / BUILD_PLAN for that full account).** The
 * underlying crash (`Cannot read properties of undefined (reading
 * 'ReactCurrentBatchConfig')`) was traced, with real browser
 * verification, to react-reconciler ending up bound to a different
 * physical React module instance than the rest of the app — and three
 * different webpack alias attempts, each verified in a real headless
 * Chrome instance, failed to fix it (one reproduced the exact original
 * crash even with a provably-correct alias target). The conclusion
 * drawn from that debugging session was that `@react-three/fiber`'s
 * own bundled dependency on `react-reconciler` was the real,
 * unreachable-from-this-app's-webpack-config culprit.
 *
 * This version removes that dependency entirely instead of continuing
 * to work around it: there is no reconciler here, so there is no
 * possible React-instance mismatch for one to have — this file talks
 * to the DOM and WebGL directly via `useRef`/`useEffect`, the same way
 * any other imperative browser API (a chart library, a map library)
 * gets wrapped for use inside React, rather than declaring the 3D
 * scene as JSX. `@react-three/fiber` has been removed from
 * `package.json`'s dependencies (`three` itself is kept — it has no
 * reconciler, and is the thing actually doing the WebGL rendering).
 *
 * All model/material/lighting/animation decisions below are the same
 * ones from the realism pass (atmosphere glow shader, PBR/clearcoat
 * materials, three-point lighting, rounded hands/feet, a responsive
 * contact shadow) — only *how* the scene is built changed (imperative
 * `new THREE.Mesh(...)` calls instead of JSX), not *what* it looks
 * like.
 *
 * **Still must be verified in a real browser before being deployed —
 * this status note will be updated once that's actually done, the
 * same discipline the previous (failed) attempts were held to.**
 *
 * **Critical: this component must never be server-rendered.** Three.js
 * touches browser globals during module import (`document`, `window`),
 * which throws during Next.js's SSR pass even for a component marked
 * `"use client"` — `"use client"` alone does not prevent server-side
 * evaluation of the initial render. The caller (`apps/web`'s login
 * page) MUST load this via `next/dynamic(() => import(...), { ssr:
 * false })`; this package itself stays framework-agnostic and cannot
 * enforce that from inside `packages/ui-components`.
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { GuideCharacterMood } from "./GuideCharacter.js";

export interface GuideCharacter3DProps {
  name?: string;
  mood?: GuideCharacterMood;
  size?: number;
  wave?: boolean;
  className?: string;
}

interface ThemeColors {
  ocean: THREE.Color;
  land: THREE.Color;
  body: THREE.Color;
  face: THREE.Color;
  accent: THREE.Color;
  atmosphere: THREE.Color;
}

/**
 * Reads this design system's real CSS custom properties and parses
 * them into THREE.Color instances — Three.js materials need actual
 * color values, not `var(--wv-...)` strings, so this is how the 3D
 * character stays in sync with the same tokens (`theme.css`) every
 * other component uses, including dark mode, rather than a second,
 * hardcoded, driftable copy of the same colors. Called once at mount
 * (client-side only — `getComputedStyle`/`document` don't exist
 * during SSR, but this file is never server-rendered at all).
 */
function readThemeColors(): ThemeColors {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => new THREE.Color(style.getPropertyValue(name).trim());
  return {
    ocean: read("--wv-color-neutral-100"),
    land: read("--wv-color-accent-400"),
    body: read("--wv-color-neutral-200"),
    face: read("--wv-color-neutral-900"),
    accent: read("--wv-color-accent-500"),
    atmosphere: read("--wv-color-accent-300"),
  };
}

/** Simple procedurally-drawn "continents on an ocean" texture, mirroring
 *  the same blob shapes the 2D GuideCharacter draws as SVG paths — kept
 *  visually consistent between the 2D (still used elsewhere) and 3D
 *  (login page) versions rather than inventing an unrelated look. */
function buildGlobeTexture(ocean: THREE.Color, land: THREE.Color): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = `#${ocean.getHexString()}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = `#${land.getHexString()}`;
  ctx.globalAlpha = 0.85;
  // Two rough continent blobs, echoing the 2D SVG's two <path> shapes.
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

/** Face texture (eyes/eyebrows/mouth), regenerated per mood — mirrors
 *  the 2D component's MOUTH_PATH/EYEBROW_TRANSFORM tables so the same
 *  four moods read as the same expressions in both versions. */
function buildFaceTexture(mood: GuideCharacterMood, faceColor: THREE.Color): THREE.CanvasTexture {
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

  // Eyes
  ctx.beginPath();
  ctx.arc(90, 110, 12, 0, Math.PI * 2);
  ctx.arc(166, 110, 12, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows — angle per mood, mirroring EYEBROW_TRANSFORM
  const browAngle: Record<GuideCharacterMood, [number, number]> = {
    idle: [0, 0],
    thinking: [-0.15, 0.18],
    happy: [-0.08, 0.08],
    concerned: [0.28, -0.28],
  };
  const [leftAngle, rightAngle] = browAngle[mood];
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

  // Mouth — shape per mood, mirroring MOUTH_PATH
  ctx.beginPath();
  if (mood === "happy") {
    ctx.moveTo(70, 155);
    ctx.quadraticCurveTo(128, 200, 186, 155);
  } else if (mood === "concerned") {
    ctx.moveTo(90, 175);
    ctx.quadraticCurveTo(128, 155, 166, 175);
  } else if (mood === "thinking") {
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

/**
 * Fresnel-style "atmosphere glow" shader — the classic cheap trick for
 * making a sphere read as a real planet/globe rather than a flat-lit
 * ball: brighter at the silhouette edge (grazing angle), fading to
 * nothing head-on. Written directly rather than reaching for a new
 * dependency, since it's a handful of lines of standard, well-known
 * GLSL (the same technique used in most "earth in space" three.js
 * examples), not project-specific logic worth a package for.
 */
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

/** Mutable handles to the parts of the scene that change after
 *  creation (per-mood face texture, thinking-mode satellite, the
 *  waving arm, the idle-bob root, the responsive contact shadow) —
 *  populated once by the init effect, read/written by the other
 *  effects and the render loop. Kept as one ref object rather than
 *  several, since these all come from the same single scene-build
 *  pass and are never meaningfully independent. */
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
  waveStart: number | null;
  animationFrame: number;
}

const PBR_MATERIAL_PROPS = { roughness: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.25 } as const;

function buildScene(
  container: HTMLDivElement,
  size: number,
  mood: GuideCharacterMood,
  colors: ThemeColors,
): SceneHandles {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  // Capped pixel ratio — a small docked/hero character doesn't need
  // full retina resolution, and uncapped dpr is a real, documented
  // performance cost on high-density mobile screens.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(size, size);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 3.4);

  // Three-point lighting — key/fill/rim, not a single flat directional
  // light: key light establishes the main highlight and the
  // atmosphere-shader's brightest edge; the cooler, dimmer fill
  // softens the shadow side; the rim light (from behind/above) catches
  // the back edge of the head and shoulders for separation from the
  // background, the same standard product-photography three-point
  // setup used for the original @react-three/fiber version.
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

  // Contact shadow — a soft, semi-transparent disc on the ground plane
  // beneath the character. Cheap (no real-time shadow maps) but a
  // genuine, standard technique for making a floating 3D character
  // read as physically grounded rather than pasted on.
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(new THREE.CircleGeometry(0.75, 32), shadowMaterial);
  shadowMesh.position.set(0, -1.75, 0);
  shadowMesh.rotation.x = -Math.PI / 2;
  rootGroup.add(shadowMesh);

  // Body
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: colors.body,
    ...PBR_MATERIAL_PROPS,
  });
  const bodyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 0.5, 8, 16), bodyMaterial);
  bodyMesh.position.set(0, -1.1, 0);
  rootGroup.add(bodyMesh);

  // Rounded feet
  for (const x of [-0.24, 0.24]) {
    const footMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 16),
      new THREE.MeshPhysicalMaterial({ color: colors.body, ...PBR_MATERIAL_PROPS }),
    );
    footMesh.position.set(x, -1.68, 0.05);
    rootGroup.add(footMesh);
  }

  // Waving arm (group, so the hand rotates with the forearm)
  const armGroup = new THREE.Group();
  armGroup.position.set(-0.7, -0.7, 0);
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

  // Still arm (opposite side), for visual symmetry when not waving
  const stillArmMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.09, 0.5, 6, 12),
    new THREE.MeshPhysicalMaterial({ color: colors.body, ...PBR_MATERIAL_PROPS }),
  );
  stillArmMesh.position.set(0.7, -0.7, 0);
  rootGroup.add(stillArmMesh);
  const stillHandMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 16),
    new THREE.MeshPhysicalMaterial({ color: colors.body, ...PBR_MATERIAL_PROPS }),
  );
  stillHandMesh.position.set(0.7, -0.4, 0);
  rootGroup.add(stillHandMesh);

  // Thinking-mode satellite
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

  // Head — the globe, with a canvas-texture "continents on ocean" map,
  // a separate face-texture plane in front for the expression, and an
  // atmosphere-glow shell for a real "planet" read.
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.15, 0);

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
    map: buildFaceTexture(mood, colors.face),
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
    waveStart: null,
    animationFrame: 0,
  };
}

function disposeScene(handles: SceneHandles, container: HTMLDivElement) {
  cancelAnimationFrame(handles.animationFrame);
  // Dispose every geometry/material/texture reachable from the scene
  // graph — Three.js does not do this automatically, and a character
  // that mounts/unmounts repeatedly (e.g. route changes) would
  // otherwise leak GPU resources.
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

/**
 * The real, WebGL-rendered version of the Guide Character — same
 * `mood`/`wave`/`name`/`size` contract as the flat-SVG `GuideCharacter`,
 * so callers can treat them as interchangeable. Built after
 * `GuideCharacter` (kept, unmodified, still used in `AppShell`'s
 * docked corner presence and `GuideTutorial`) rather than replacing it
 * everywhere — running a live WebGL canvas continuously on every page
 * load has a real performance/battery cost this project didn't want to
 * pay everywhere without a deliberate look at it first.
 */
export function GuideCharacter3D({
  mood = "idle",
  size = 96,
  wave = false,
  className,
}: GuideCharacter3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handlesRef = useRef<SceneHandles | null>(null);
  const moodRef = useRef(mood);
  const [ready, setReady] = useState(false);

  // Scene creation — mount only. Deliberately not re-run on prop
  // changes; `mood`/`wave` are applied to the already-built scene by
  // the effects below, the same way any other imperative-library React
  // wrapper (a chart, a map) updates an existing instance rather than
  // tearing it down and rebuilding for every prop change.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const colors = readThemeColors();
    const handles = buildScene(container, size, mood, colors);
    handlesRef.current = handles;
    setReady(true);

    const animate = () => {
      const t = handles.clock.getElapsedTime();

      // Idle motion: slow continuous head rotation + gentle body float.
      handles.headGroup.rotation.y = t * 0.15;
      const bob = Math.sin(t * 0.7) * 0.08;
      handles.rootGroup.position.y = bob;

      // Contact shadow shrinks/softens slightly as the body "lifts" —
      // a cheap but real grounding cue.
      const lift = 1 - bob * 2.2;
      handles.shadowMesh.scale.set(lift, lift, 1);
      (handles.shadowMesh.material as THREE.MeshBasicMaterial).opacity = 0.22 * lift;

      // Thinking mood: small satellite orbiting the head.
      handles.satelliteMesh.visible = moodRef.current === "thinking";
      if (moodRef.current === "thinking") {
        handles.satelliteMesh.position.set(Math.cos(t * 1.4) * 1.3, 1.1, Math.sin(t * 1.4) * 1.3);
      }

      // One-shot wave: a short, timed arm rotation, driven by
      // `waveStart` (set by the effect below when `wave` flips true),
      // not a continuous loop.
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

      handles.renderer.render(handles.scene, handles.camera);
      handles.animationFrame = requestAnimationFrame(animate);
    };
    handles.animationFrame = requestAnimationFrame(animate);

    return () => {
      disposeScene(handles, container);
      handlesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mood changes: update the ref the render loop reads, and regenerate
  // the face texture (a one-time canvas redraw, not a per-frame cost).
  useEffect(() => {
    moodRef.current = mood;
    const handles = handlesRef.current;
    if (!handles) return;
    const colors = readThemeColors();
    const oldTexture = handles.faceMaterial.map;
    handles.faceMaterial.map = buildFaceTexture(mood, colors.face);
    handles.faceMaterial.needsUpdate = true;
    oldTexture?.dispose();
  }, [mood]);

  // Wave trigger: reset the one-shot animation's start time whenever
  // `wave` flips true, same trigger semantics as the 2D version's CSS
  // animation.
  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || !wave) return;
    handles.waveStart = handles.clock.getElapsedTime();
  }, [wave, ready]);

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
