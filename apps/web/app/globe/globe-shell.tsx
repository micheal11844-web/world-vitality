"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Text, AppShell } from "@world-vitality/ui-components";
import { useI18n } from "../../lib/i18n/i18n-provider";
import { AppBrand } from "../app-brand";
import { buildAppSidebar } from "../workspaces/workspace-nav";
import { GlobeErrorBoundary } from "./globe-error-boundary";
import { GlobePreview } from "./globe-preview";
import { hasWebGL, loadCesium } from "./globe-loader";
import type { GlobePin } from "./globe-types";

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

type LiveState =
  | { status: "loading" }
  | { status: "done"; pins: GlobePin[]; failed: number }
  | { status: "failed" };

/**
 * Client half of the "God's Eye" global view (BUILD_PLAN "STAGE —
 * GOD'S EYE GLOBE VIEW") — `AppShell` wrapper plus the 3D globe.
 *
 * **What the person sees, in order:** the page frame and a flat world map
 * with their own locations as clickable dots, immediately; then the live
 * hazard points join the map as they arrive (they come from outside
 * services and used to hold the whole page back); then the 3D globe fades
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
export function GlobeShell({ pins }: { pins: GlobePin[] }) {
  // Required by AppShellProps, but this page has no AI panel content —
  // same "no AI-adjacent side-panel summary" reasoning
  // education/workspace-shell.tsx already documented for itself; the
  // globe is a visualization, not an interpretation result to
  // summarize.
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const { t } = useI18n();
  const sidebar = buildAppSidebar({ t });

  const [live, setLive] = useState<LiveState>({ status: "loading" });
  // `null` until we have asked the browser (it cannot be known on the server).
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [engineFailed, setEngineFailed] = useState(false);
  const [globeDrawn, setGlobeDrawn] = useState(false);
  const [previewGone, setPreviewGone] = useState(false);

  useEffect(() => {
    setWebgl(hasWebGL());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    // The route has its own per-source deadline; this is a backstop so the
    // status line can never say "loading" forever.
    const giveUp = setTimeout(() => controller.abort(), 20_000);
    fetch("/api/globe/live-layers", { signal: controller.signal, credentials: "same-origin" })
      .then((res) => (res.ok ? (res.json() as Promise<LiveLayersResponse>) : Promise.reject()))
      .then((body) => {
        if (cancelled) return;
        setLive({
          status: "done",
          pins: Array.isArray(body.pins) ? body.pins : [],
          failed: Array.isArray(body.failed) ? body.failed.length : 0,
        });
      })
      .catch(() => {
        if (!cancelled) setLive({ status: "failed" });
      })
      .finally(() => clearTimeout(giveUp));
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(giveUp);
    };
  }, []);

  // Retire the flat map shortly after the globe has drawn, so it can fade out.
  useEffect(() => {
    if (!globeDrawn) return;
    const timer = setTimeout(() => setPreviewGone(true), 500);
    return () => clearTimeout(timer);
  }, [globeDrawn]);

  const livePins = useMemo(() => (live.status === "done" ? live.pins : []), [live]);
  const allPins = useMemo(() => [...pins, ...livePins], [pins, livePins]);
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
                    live.failed > 0 ? t("globe.live.partial") : null,
                  ]
                    .filter(Boolean)
                    .join(" ")}
          </Text>
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
              <GlobePreview pins={allPins} />
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
        </div>
      </div>
    </AppShell>
  );
}
