"use client";

/**
 * **STATUS: still NOT wired into the app, still a real, unresolved
 * production crash — this stage made real progress on diagnosis, not
 * a fix.** The model itself (`OrbiModel`, below) DID get a genuine
 * realism pass this stage (atmosphere glow shader, PBR/clearcoat
 * materials, three-point lighting, rounded hands/feet, a contact
 * shadow) — that code is correct and independent of the crash. The
 * crash itself was not resolved, despite three different real,
 * browser-verified fix attempts.
 *
 * **What actually changed this stage, stated precisely**: for the
 * first time, a real headless Chrome instance (Google Chrome for
 * Testing 131, via Playwright's cache) was available in the build
 * environment, closing the exact gap the previous status note flagged
 * ("needs... verified in a real browser before being wired back in").
 * That let three different webpack `resolve.alias` fix attempts each
 * be tested against the real production build, not just assumed
 * correct from a successful `next build` (which, notably, all three
 * attempts achieved — the crash is purely a runtime/browser-side
 * failure, invisible to `tsc`, lint, tests, or the build step alone):
 *
 * 1. Alias `react`/`react-dom` to their bare package directory — build
 *    succeeded, but real-browser test showed a DIFFERENT crash
 *    (`TypeError: (0 , s.use) is not a function` during hydration).
 * 2. Alias to the exact `require.resolve()`'d file, bare key — broke
 *    the BUILD itself (`Module not found: 'react/jsx-runtime'`
 *    everywhere), because a bare alias key is a webpack prefix match
 *    and also captured every subpath import.
 * 3. Same target, exact-match `"react$"` key — clean build, passed
 *    every other check, but real-browser test reproduced the EXACT
 *    ORIGINAL crash (`ReactCurrentBatchConfig`), unchanged.
 *
 * Conclusion: a `react`/`react-dom` webpack alias, however precisely
 * targeted, does not fix this. The duplicate-React-instance problem is
 * most likely inside `@react-three/fiber`'s own bundled dependency on
 * `react-reconciler` in a way this app's webpack config can't reach —
 * a different class of fix (a specific known-compatible
 * `react-reconciler` version pin, or dropping `@react-three/fiber` for
 * raw `three.js` with no reconciler at all) is the honest next
 * direction, not a variant of the alias approach already tried three
 * times. See `next.config.mjs`'s own doc comment for the same account
 * kept where the next attempt will actually look for it.
 *
 * All wiring (`AuthIllustration`'s `guideCharacter` override prop,
 * `apps/web/app/login/orbi-3d.tsx`'s `next/dynamic(..., { ssr: false
 * })` wrapper) was reverted from the login page after this real
 * verification, rather than deployed on the strength of a passing
 * build alone — the whole reason a real browser check mattered this
 * time was to NOT repeat that mistake.
 *
 * The reasoning below (deployment strategy, colors-from-theme, model
 * design) all remains accurate; see `OrbiModel`'s own doc comment for
 * the realism-pass changes.
 */

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
    /** Cool tone for the atmosphere rim glow and fill light —
     *  distinct from `accent` so the glow doesn't compete visually
     *  with the thinking-mode satellite, which is already `accent`-
     *  colored. */
    atmosphere: THREE.Color;
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
      atmosphere: read("--wv-color-accent-300"),
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
  const armRef = useRef<THREE.Group>(null);
  const satelliteRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const waveStartRef = useRef<number | null>(null);

  const globeTexture = useGlobeTexture(colors.ocean, colors.land);
  const faceTexture = useFaceTexture(mood, colors.face);

  const atmosphereUniforms = useMemo(
    () => ({ glowColor: { value: colors.atmosphere } }),
    [colors.atmosphere],
  );

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
    const bob = Math.sin(t * 0.7) * 0.08;
    if (groupRef.current) {
      groupRef.current.position.y = bob;
    }
    // Contact shadow shrinks/softens slightly as the body "lifts" on
    // the upswing of the float, and vice versa — a cheap but real cue
    // that the character has weight and is grounded, not just pasted
    // on top of a flat background.
    if (shadowRef.current) {
      const lift = 1 - bob * 2.2; // bob is small (~±0.08); keeps this near 1
      shadowRef.current.scale.set(lift, lift, 1);
      const material = shadowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.22 * lift;
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
      {/* Contact shadow — a soft, semi-transparent disc on the ground
          plane beneath the character. Cheap (no real-time shadow maps,
          no extra light needed) but a genuine, standard technique for
          making a floating 3D character read as physically grounded
          rather than pasted on. */}
      <mesh ref={shadowRef} position={[0, -1.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.75, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {/* Body — meshPhysicalMaterial's clearcoat gives a smooth,
          slightly glossy "friendly toy/device" finish (a thin lacquer
          layer on top of the base material) instead of the flatter
          meshStandardMaterial look the first version used — a real,
          visible difference on a rounded shape like this, not a
          no-op setting. */}
      <mesh position={[0, -1.1, 0]}>
        <capsuleGeometry args={[0.55, 0.5, 8, 16]} />
        <meshPhysicalMaterial
          color={colors.body}
          roughness={0.55}
          clearcoat={0.4}
          clearcoatRoughness={0.25}
        />
      </mesh>

      {/* Rounded feet — small spheres at the base, partially embedded
          in the body capsule. A bare capsule reads as a lozenge with
          no grounding; two small rounded feet give it a simple,
          recognizable stance without adding real leg-joint complexity
          this character doesn't need. */}
      {[-0.24, 0.24].map((x) => (
        <mesh key={x} position={[x, -1.68, 0.05]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshPhysicalMaterial
            color={colors.body}
            roughness={0.55}
            clearcoat={0.4}
            clearcoatRoughness={0.25}
          />
        </mesh>
      ))}

      {/* Waving arm, with a rounded hand at the end — same clearcoat
          material as the body so the whole character reads as one
          consistent material, not mismatched parts. */}
      <group ref={armRef} position={[-0.7, -0.7, 0]}>
        <mesh>
          <capsuleGeometry args={[0.09, 0.5, 6, 12]} />
          <meshPhysicalMaterial
            color={colors.body}
            roughness={0.55}
            clearcoat={0.4}
            clearcoatRoughness={0.25}
          />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshPhysicalMaterial
            color={colors.body}
            roughness={0.55}
            clearcoat={0.4}
            clearcoatRoughness={0.25}
          />
        </mesh>
      </group>

      {/* Still arm (opposite side), for visual symmetry when not
          waving — the first version only had one arm at all, which
          read as lopsided once the body gained real volume from the
          feet/hand additions above. */}
      <mesh position={[0.7, -0.7, 0]}>
        <capsuleGeometry args={[0.09, 0.5, 6, 12]} />
        <meshPhysicalMaterial
          color={colors.body}
          roughness={0.55}
          clearcoat={0.4}
          clearcoatRoughness={0.25}
        />
      </mesh>
      <mesh position={[0.7, -0.4, 0]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshPhysicalMaterial
          color={colors.body}
          roughness={0.55}
          clearcoat={0.4}
          clearcoatRoughness={0.25}
        />
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
          map (matching the 2D version's two blob shapes), a separate
          face-texture plane in front for the expression, and an
          atmosphere-glow shell for a real "planet" read instead of a
          flat-lit ball. meshPhysicalMaterial (clearcoat) replaces the
          globe's own material too, for a subtle wet/glossy "ocean"
          highlight consistent with the body. */}
      <group ref={headRef} position={[0, 0.15, 0]}>
        <mesh>
          <sphereGeometry args={[1, 48, 48]} />
          <meshPhysicalMaterial
            map={globeTexture}
            roughness={0.45}
            metalness={0.05}
            clearcoat={0.25}
            clearcoatRoughness={0.3}
          />
        </mesh>
        <mesh position={[0, 0, 1.001]}>
          <planeGeometry args={[1.15, 1.15]} />
          <meshBasicMaterial map={faceTexture} transparent />
        </mesh>
        {/* Atmosphere shell — larger than the globe, back-side only
            (so it doesn't occlude the face from the front) with the
            Fresnel glow shader above. */}
        <mesh scale={1.08}>
          <sphereGeometry args={[1, 48, 48]} />
          <shaderMaterial
            vertexShader={ATMOSPHERE_VERTEX_SHADER}
            fragmentShader={ATMOSPHERE_FRAGMENT_SHADER}
            uniforms={atmosphereUniforms}
            transparent
            side={THREE.BackSide}
            depthWrite={false}
          />
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
        {/* Three-point lighting — a real, standard character-lighting
            setup (key/fill/rim), not the single flat directional light
            the first version used. Key light establishes the main
            highlight and the atmosphere-shader's brightest edge; the
            cooler, dimmer fill softens the shadow side so it never
            reads as pure black; the rim light (from behind/above)
            catches the back edge of the head and shoulders, the same
            separation-from-background trick real product-photography
            three-point setups use. */}
        <ambientLight intensity={0.35} />
        <directionalLight position={[2.4, 3, 4]} intensity={1.3} />
        <directionalLight position={[-2.2, -0.6, 2]} intensity={0.3} color={colors.atmosphere} />
        <directionalLight position={[-1, 2.5, -3]} intensity={0.6} color={colors.atmosphere} />
        <OrbiModel mood={mood} wave={wave} colors={colors} />
      </Canvas>
    </div>
  );
}
