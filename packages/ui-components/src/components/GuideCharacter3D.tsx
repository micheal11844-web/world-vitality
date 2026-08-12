"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GuideCharacterMood } from "./GuideCharacter.js";

export interface GuideCharacter3DProps {
  name?: string;
  mood?: GuideCharacterMood;
  /** Pixel size of the character's bounding box (square). */
  size?: number;
  /** Plays a single wave gesture once, e.g. on first mount of a page. */
  wave?: boolean;
  className?: string;
}

/**
 * Reads this design system's real CSS custom properties at mount time
 * and parses them into THREE.Color instances — Three.js materials need
 * actual color values, not `var(--wv-...)` strings, so this is how the
 * 3D character stays in sync with the same tokens (`theme.css`) every
 * other component uses, including dark mode, rather than a second,
 * hardcoded, driftable copy of the same colors.
 */
function useThemeColors() {
  const [colors, setColors] = useState<{
    ocean: THREE.Color;
    land: THREE.Color;
    body: THREE.Color;
    face: THREE.Color;
    accent: THREE.Color;
  } | null>(null);

  useEffect(() => {
    // Only ever runs client-side (inside a "use client" component,
    // after mount) — getComputedStyle/document don't exist during SSR,
    // but this file is never server-rendered at all (see the doc
    // comment on the exported component below for why).
    const style = getComputedStyle(document.documentElement);
    const read = (name: string) => new THREE.Color(style.getPropertyValue(name).trim());
    setColors({
      ocean: read("--wv-color-neutral-100"),
      land: read("--wv-color-accent-400"),
      body: read("--wv-color-neutral-200"),
      face: read("--wv-color-neutral-900"),
      accent: read("--wv-color-accent-500"),
    });
  }, []);

  return colors;
}

/** Simple procedurally-drawn "continents on an ocean" texture, mirroring
 *  the same blob shapes the 2D GuideCharacter draws as SVG paths — kept
 *  visually consistent between the 2D (still used elsewhere) and 3D
 *  (login page) versions rather than inventing an unrelated look. */
function useGlobeTexture(ocean: THREE.Color, land: THREE.Color) {
  return useMemo(() => {
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
  }, [ocean, land]);
}

/** Face texture (eyes/eyebrows/mouth), regenerated per mood — mirrors
 *  the 2D component's MOUTH_PATH/EYEBROW_TRANSFORM tables so the same
 *  four moods read as the same expressions in both versions. */
function useFaceTexture(mood: GuideCharacterMood, faceColor: THREE.Color) {
  return useMemo(() => {
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
  }, [mood, faceColor]);
}

function OrbiModel({
  mood,
  wave,
  colors,
}: {
  mood: GuideCharacterMood;
  wave: boolean;
  colors: NonNullable<ReturnType<typeof useThemeColors>>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Mesh>(null);
  const satelliteRef = useRef<THREE.Mesh>(null);
  const waveStartRef = useRef<number | null>(null);

  const globeTexture = useGlobeTexture(colors.ocean, colors.land);
  const faceTexture = useFaceTexture(mood, colors.face);

  useEffect(() => {
    // Reset the one-shot wave animation's clock whenever `wave` flips
    // true, same trigger semantics as the 2D version's CSS animation.
    if (wave) waveStartRef.current = null;
  }, [wave]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Idle motion: slow continuous head rotation + gentle body float —
    // deliberately calm (matches theme.css's "purposeful, calm motion
    // only" principle already applied to the 2D version), and doubles
    // as the actual justification for going 3D: continents rotating
    // into and out of view is an effect flat SVG cannot produce.
    if (headRef.current) {
      headRef.current.rotation.y = t * 0.15;
    }
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.7) * 0.08;
    }

    // Thinking mood: small satellite orbiting the head, same concept as
    // the 2D version's orbiting dot (reusing the wv-spin idea in 3D).
    if (satelliteRef.current) {
      satelliteRef.current.visible = mood === "thinking";
      if (mood === "thinking") {
        satelliteRef.current.position.set(Math.cos(t * 1.4) * 1.3, 1.1, Math.sin(t * 1.4) * 1.3);
      }
    }

    // One-shot wave: a short, timed arm rotation, not a continuous
    // loop — mirrors the 2D version's single-play wv-guide-wave
    // animation rather than waving forever.
    if (armRef.current) {
      if (wave) {
        if (waveStartRef.current === null) waveStartRef.current = t;
        const elapsed = t - waveStartRef.current;
        const duration = 1.4;
        if (elapsed < duration) {
          armRef.current.rotation.z = Math.sin((elapsed / duration) * Math.PI * 2.5) * 0.5;
        } else {
          armRef.current.rotation.z = 0;
        }
      } else {
        armRef.current.rotation.z = 0;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, -1.1, 0]}>
        <capsuleGeometry args={[0.55, 0.5, 8, 16]} />
        <meshStandardMaterial color={colors.body} roughness={0.7} />
      </mesh>

      {/* Waving arm */}
      <mesh ref={armRef} position={[-0.7, -0.7, 0]}>
        <capsuleGeometry args={[0.09, 0.5, 6, 12]} />
        <meshStandardMaterial color={colors.body} roughness={0.7} />
      </mesh>

      {/* Thinking-mode satellite */}
      <mesh ref={satelliteRef} visible={false}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial
          color={colors.accent}
          emissive={colors.accent}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Head — the globe, with a canvas-texture "continents on ocean"
          map (matching the 2D version's two blob shapes) and a
          separate face-texture plane in front for the expression. */}
      <group ref={headRef} position={[0, 0.15, 0]}>
        <mesh>
          <sphereGeometry args={[1, 48, 48]} />
          <meshStandardMaterial map={globeTexture} roughness={0.55} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0, 1.001]}>
          <planeGeometry args={[1.15, 1.15]} />
          <meshBasicMaterial map={faceTexture} transparent />
        </mesh>
      </group>
    </group>
  );
}

/**
 * The real, WebGL-rendered version of the Guide Character — same
 * `mood`/`wave`/`name`/`size` contract as the flat-SVG `GuideCharacter`,
 * so callers can treat them as interchangeable. Built after
 * `GuideCharacter` (kept, unmodified, still used in `AppShell`'s
 * docked corner presence and `GuideTutorial`) rather than replacing it
 * everywhere — running a live WebGL canvas continuously on every page
 * load has a real performance/battery cost this project didn't want to
 * pay everywhere without a deliberate look at it first; the login page
 * (the flagship moment originally described — "interacting with the
 * auth card") is where that cost is judged worth it. See BUILD_PLAN for
 * the full scoping note.
 *
 * **Critical: this component must never be server-rendered.** Three.js
 * touches browser globals during module import (`document`, `window`),
 * which throws during Next.js's SSR pass even for a component marked
 * `"use client"` — `"use client"` alone does not prevent server-side
 * evaluation of the initial render. The caller (`apps/web`'s login
 * page) MUST load this via `next/dynamic(() => import(...), { ssr:
 * false })`; this package itself stays framework-agnostic and cannot
 * enforce that from inside `packages/ui-components` — verified against
 * multiple independent, current sources before writing any of this,
 * given the CSP incident's lesson about not guessing at framework
 * integration details a second time.
 *
 * Verified compatible versions for this project's React 18:
 * `@react-three/fiber@8.18.0` + `three@0.185.1` (`@react-three/fiber@9`
 * requires React 19 and would silently misbehave or fail to install
 * cleanly here).
 */
export function GuideCharacter3D({
  mood = "idle",
  size = 96,
  wave = false,
  className,
}: GuideCharacter3DProps) {
  const colors = useThemeColors();

  if (!colors) {
    // First-paint gap before useEffect reads the theme colors — a
    // transparent placeholder of the right size avoids a layout jump,
    // shown for at most one frame in practice.
    return <div className={className} style={{ width: size, height: size }} />;
  }

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={className}
      style={{ width: size, height: size }}
    >
      <Canvas
        // Capped pixel ratio — a small docked/hero character doesn't
        // need full retina resolution, and uncapped dpr is a real,
        // documented performance cost on high-density mobile screens.
        dpr={[1, 2]}
        camera={{ position: [0, 0, 3.4], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 4]} intensity={1.1} />
        <OrbiModel mood={mood} wave={wave} colors={colors} />
      </Canvas>
    </div>
  );
}
