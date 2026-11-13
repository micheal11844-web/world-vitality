"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Text, AppShell } from "@world-vitality/ui-components";
import { distanceKm, thinCameras, type GlobeFocus } from "@world-vitality/hazard-feeds";
import { useI18n } from "../../lib/i18n/i18n-provider";
import { AppBrand } from "../app-brand";
import { buildAppSidebar } from "../workspaces/workspace-nav";
import { GlobeErrorBoundary } from "./globe-error-boundary";
import { GlobePanel } from "./globe-panel";
import { GlobePreview } from "./globe-preview";
import { hasWebGL, loadCesium } from "./globe-loader";
import {
  CAMERA_COLOR,
  FIRE_COLOR,
  type GlobeFire,
  type GlobePin,
  type GlobeSelection,
  type PublicCamera,
} from "./globe-types";

/** A heat alert opens the fire area within this distance of the point it names. */
const FOCUS_MATCH_KM = 6;

// `ssr: false` is required, not a performance nicety — Cesium needs
// `window`/WebGL, both entirely absent during server rendering. Next.js
// dynamic imports are the documented, supported way to exclude a
// component from the server render pass entirely rather than letting it
// crash during SSR and papering over that with a try/catch. There is no
// `loading` fallback here on purpose: the page draws its own instant flat
// map (`GlobePreview`) and keeps it up until the globe has drawn a frame.
const GlobeViewer = dynamic(() => import("./globe-viewer").then((m) => m.GlobeViewer), {
  ssr: false,
});

// Start downloading the 3D engine the moment this page's script runs —
// while React is still hydrating — instead of after the viewer mounts. It is
// by far the biggest thing this page fetches. Skipped on devices that cannot
// run WebGL (they keep the flat map and never need the download). Errors are
// handled where the engine is actually used.
if (typeof window !== "undefined" && hasWebGL()) {
  loadCesium().catch(() => undefined);
}

interface LiveLayersResponse {
  pins?: GlobePin[];
  failed?: string[];
}

interface FiresResponse {
  fires?: GlobeFire[];
  totalClusters?: number;
  notConfigured?: boolean;
  failed?: boolean;
  camerasFailed?: boolean;
}

interface CamerasResponse {
  cameras?: PublicCamera[];
  failed?: string[];
}

type LayerState<T> = { status: "loading" } | { status: "done"; data: T } | { status: "failed" };

/**
 * Fetches one of the Globe's background layers. Each layer has its own
 * request, so a slow one (the worldwide fire day is a large download) never
 * holds back the others. `giveUpMs` is a backstop so a status line can never
 * say "loading" forever; the server has its own, shorter deadlines.
 */
function useLayer<T>(url: string, giveUpMs: number): LayerState<T> {
  const [state, setState] = useState<LayerState<T>>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const giveUp = setTimeout(() => controller.abort(), giveUpMs);
    fetch(url, { signal: controller.signal, credentials: "same-origin" })
      .then((res) => (res.ok ? (res.json() as Promise<T>) : Promise.reject()))
      .then((data) => {
        if (!cancelled) setState({ status: "done", data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "failed" });
      })
      .finally(() => clearTimeout(giveUp));
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(giveUp);
    };
  }, [url, giveUpMs]);
  return state;
}

/** At most this many fire areas and standalone cameras become buttons on the flat map. */
const PREVIEW_MAX_FIRES = 500;

/**
 * Client half of the "God's Eye" global view (BUILD_PLAN "STAGE —
 * GOD'S EYE GLOBE VIEW") — `AppShell` wrapper plus the 3D globe.
 *
 * **What the person sees, in order:** the page frame and a flat world map
 * with their own locations as clickable dots, immediately; then the live
 * hazard points, satellite fire detections and public cameras join the map
 * as they arrive (each comes from outside services and used to hold the
 * whole page back, so each loads separately); then the 3D globe fades
 * in over the flat map once its first frame is drawn. On a device without
 * WebGL, or if the 3D engine fails to load, the flat map simply stays.
 *
 * Split from `page.tsx` (a Server Component) because Cesium is
 * unconditionally browser-only; `page.tsx` reads and permission-filters
 * the person's own locations and hands this component a plain `pins` array.
 *
 * Same "Workspaces" sidebar every other cross-workspace page
 * (`dashboard-view.tsx`, `explore-shell.tsx`) uses, with no
 * `currentWorkspaceKey` — the globe isn't "inside" any one workspace,
 * so every workspace starts collapsed here too.
 */
export function GlobeShell({
  pins,
  focus = null,
}: {
  pins: GlobePin[];
  focus?: GlobeFocus | null;
}) {
  // Required by AppShellProps, but this page has no AI panel content —
  // same "no AI-adjacent side-panel summary" reasoning
  // education/workspace-shell.tsx already documented for itself; the
  // globe is a visualization, not an interpretation result to
  // summarize.
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const { t, locale } = useI18n();
  const sidebar = buildAppSidebar({ t });

  const live = useLayer<LiveLayersResponse>("/api/globe/live-layers", 20_000);
  const firesLayer = useLayer<FiresResponse>("/api/globe/fires", 32_000);
  const camerasLayer = useLayer<CamerasResponse>("/api/globe/cameras", 22_000);
  // `null` until we have asked the browser (it cannot be known on the server).
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [engineFailed, setEngineFailed] = useState(false);
  const [globeDrawn, setGlobeDrawn] = useState(false);
  const [previewGone, setPreviewGone] = useState(false);
  const [selection, setSelection] = useState<GlobeSelection | null>(null);

  useEffect(() => {
    setWebgl(hasWebGL());
  }, []);

  // Opened from a satellite-heat alert: once the fire areas are in, open the one
  // nearest the point the alert was about (if it is still listed), once. Whatever
  // the person does next is theirs: this never runs again or re-selects.
  const focusHandled = useRef(false);
  useEffect(() => {
    if (!focus || focusHandled.current) return;
    if (firesLayer.status === "loading") return;
    focusHandled.current = true;
    if (firesLayer.status !== "done" || !Array.isArray(firesLayer.data.fires)) return;
    let nearest: { id: string; km: number } | null = null;
    for (const fire of firesLayer.data.fires) {
      const km = distanceKm(focus.latitude, focus.longitude, fire.latitude, fire.longitude);
      if (km <= FOCUS_MATCH_KM && (!nearest || km < nearest.km)) nearest = { id: fire.id, km };
    }
    if (nearest) setSelection({ kind: "fire", id: nearest.id });
  }, [focus, firesLayer]);

  // Retire the flat map shortly after the globe has drawn, so it can fade out.
  useEffect(() => {
    if (!globeDrawn) return;
    const timer = setTimeout(() => setPreviewGone(true), 500);
    return () => clearTimeout(timer);
  }, [globeDrawn]);

  const livePins = useMemo(
    () => (live.status === "done" && Array.isArray(live.data.pins) ? live.data.pins : []),
    [live],
  );
  const allPins = useMemo(() => [...pins, ...livePins], [pins, livePins]);
  const liveFailed = live.status === "done" ? (live.data.failed?.length ?? 0) : 0;

  const fires = useMemo(
    () =>
      firesLayer.status === "done" && Array.isArray(firesLayer.data.fires)
        ? firesLayer.data.fires
        : [],
    [firesLayer],
  );
  // Every camera to draw: the thinned standalone list plus every camera listed under a fire.
  const cameras = useMemo(() => {
    const byId = new Map<string, PublicCamera>();
    if (camerasLayer.status === "done" && Array.isArray(camerasLayer.data.cameras)) {
      for (const camera of camerasLayer.data.cameras) byId.set(camera.id, camera);
    }
    for (const fire of fires) {
      for (const near of fire.nearby) byId.set(near.camera.id, near.camera);
    }
    return [...byId.values()];
  }, [camerasLayer, fires]);
  const fireById = useMemo(() => new Map(fires.map((f) => [f.id, f])), [fires]);
  const cameraById = useMemo(() => new Map(cameras.map((c) => [c.id, c])), [cameras]);

  // The flat map gets a limited set: the strongest fires, and the cameras worth looking at.
  const previewFires = useMemo(() => {
    const withCameras = fires.filter((f) => f.nearby.length > 0);
    const strongest = fires.slice(0, PREVIEW_MAX_FIRES);
    return [...new Map([...strongest, ...withCameras].map((f) => [f.id, f])).values()];
  }, [fires]);
  const previewCameras = useMemo(() => {
    const byId = new Map<string, PublicCamera>();
    for (const camera of thinCameras(cameras, { cellDegrees: 0.5, maxPerProvider: 80 })) {
      byId.set(camera.id, camera);
    }
    for (const fire of previewFires) {
      for (const near of fire.nearby) byId.set(near.camera.id, near.camera);
    }
    return [...byId.values()];
  }, [cameras, previewFires]);

  const watchSettled = firesLayer.status !== "loading" && camerasLayer.status !== "loading";
  const firesNotConfigured = firesLayer.status === "done" && firesLayer.data.notConfigured === true;
  const firesFailed =
    firesLayer.status === "failed" ||
    (firesLayer.status === "done" && firesLayer.data.failed === true);
  const camerasFailed =
    camerasLayer.status === "failed" ||
    (camerasLayer.status === "done" && (camerasLayer.data.failed?.length ?? 0) > 0) ||
    (firesLayer.status === "done" && firesLayer.data.camerasFailed === true);
  const totalClusters =
    firesLayer.status === "done" ? (firesLayer.data.totalClusters ?? fires.length) : fires.length;

  const watchText = (() => {
    if (!watchSettled) return t("globe.watch.loading");
    if (firesFailed && camerasLayer.status === "failed") return t("globe.watch.failed");
    const parts: string[] = [];
    if (fires.length === 0 && cameras.length === 0) {
      parts.push(t("globe.watch.none"));
    } else {
      parts.push(t("globe.watch.summary", { fires: fires.length, cameras: cameras.length }));
      if (totalClusters > fires.length) {
        parts.push(t("globe.watch.capped", { shown: fires.length, total: totalClusters }));
      }
    }
    if (firesNotConfigured) parts.push(t("globe.watch.firesNotConfigured"));
    else if (firesFailed || camerasFailed) parts.push(t("globe.watch.partial"));
    return parts.join(" ");
  })();

  const selectedFire =
    selection?.kind === "fire"
      ? (fireById.get(selection.id) ?? null)
      : selection?.kind === "camera" && selection.fromFireId
        ? (fireById.get(selection.fromFireId) ?? null)
        : null;
  const selectedCamera =
    selection?.kind === "camera" ? (cameraById.get(selection.id) ?? null) : null;
  const panelOpen =
    selection !== null && (selection.kind === "fire" ? selectedFire : selectedCamera) !== null;
  const closePanel = useCallback(() => setSelection(null), []);

  const use3d = webgl === true && !engineFailed;
  const showNo3d = webgl === false || engineFailed;

  return (
    <AppShell
      brand={<AppBrand />}
      aiPanelOpen={aiPanelOpen}
      onToggleAiPanel={() => setAiPanelOpen((v) => !v)}
      sidebarSections={sidebar.sections}
      sidebarDefaultExpandedKeys={sidebar.defaultExpandedKeys}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: "var(--wv-space-sm)",
        }}
      >
        <div>
          <Text variant="pageTitle" as="h1" style={{ marginBottom: "var(--wv-space-xs)" }}>
            {t("globe.title")}
          </Text>
          {pins.length > 0 ? (
            <Text variant="caption" style={{ display: "block", color: "var(--wv-text-secondary)" }}>
              {t("globe.summary", { count: pins.length })}
            </Text>
          ) : (
            <Text variant="caption" style={{ display: "block", color: "var(--wv-text-secondary)" }}>
              {t("globe.empty.title")}. {t("globe.empty.body")}
            </Text>
          )}
          <Text
            variant="caption"
            role="status"
            style={{ display: "block", color: "var(--wv-text-secondary)" }}
          >
            {live.status === "loading"
              ? t("globe.live.loading")
              : live.status === "failed"
                ? t("globe.live.failed")
                : [
                    livePins.length > 0
                      ? t("globe.live.count", { count: livePins.length })
                      : t("globe.live.none"),
                    liveFailed > 0 ? t("globe.live.partial") : null,
                  ]
                    .filter(Boolean)
                    .join(" ")}
          </Text>
          <Text
            variant="caption"
            role="status"
            data-testid="globe-watch-status"
            style={{ display: "block", color: "var(--wv-text-secondary)" }}
          >
            {watchText}
          </Text>
          {(fires.length > 0 || cameras.length > 0) && (
            <Text
              variant="caption"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--wv-space-md)",
                color: "var(--wv-text-secondary)",
              }}
            >
              <LegendDot color={FIRE_COLOR} label={t("globe.legend.fire")} />
              <LegendDot color={CAMERA_COLOR} label={t("globe.legend.camera")} />
            </Text>
          )}
        </div>
        <div
          style={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            borderRadius: "var(--wv-radius-md)",
            overflow: "hidden",
            background: "#050b16",
          }}
        >
          {use3d && (
            <GlobeErrorBoundary onError={() => setEngineFailed(true)}>
              <GlobeViewer
                pins={allPins}
                focusPins={pins}
                fires={fires}
                cameras={cameras}
                selection={selection}
                locale={locale}
                onSelect={setSelection}
                onReady={() => setGlobeDrawn(true)}
                onFailed={() => setEngineFailed(true)}
              />
            </GlobeErrorBoundary>
          )}
          {!previewGone && (
            <div
              data-testid="globe-preview"
              style={{
                position: "absolute",
                inset: 0,
                opacity: globeDrawn ? 0 : 1,
                transition: "opacity 400ms ease",
                pointerEvents: globeDrawn ? "none" : "auto",
              }}
            >
              <GlobePreview
                pins={allPins}
                fires={previewFires}
                cameras={previewCameras}
                selection={selection}
                onSelect={setSelection}
              />
              {(showNo3d || webgl === null || !globeDrawn) && (
                <div
                  role="status"
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: "var(--wv-space-md)",
                    transform: "translateX(-50%)",
                    maxWidth: "calc(100% - 2rem)",
                    padding: "var(--wv-space-xs) var(--wv-space-md)",
                    borderRadius: "var(--wv-radius-md)",
                    background: "rgba(5, 11, 22, 0.82)",
                    color: "#fff",
                    fontFamily: "var(--wv-font-sans)",
                    fontSize: "0.8125rem",
                    textAlign: "center",
                  }}
                >
                  {showNo3d ? t("globe.preview.no3d") : t("globe.preview.loading3d")}
                </div>
              )}
            </div>
          )}
          {selection && panelOpen && (
            <GlobePanel
              selection={selection}
              fire={selectedFire}
              camera={selectedCamera}
              camerasFailed={camerasFailed}
              onSelect={setSelection}
              onClose={closePanel}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--wv-space-xs)" }}>
      <span
        aria-hidden="true"
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          border: "1.5px solid #fff",
          boxShadow: "0 0 0 1px var(--wv-border)",
          boxSizing: "border-box",
        }}
      />
      {label}
    </span>
  );
}
