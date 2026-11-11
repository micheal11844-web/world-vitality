"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Button, ButtonLink, Text } from "@world-vitality/ui-components";
import {
  CAMERA_PROVIDERS,
  autoRefreshMinutes,
  cacheBustedImageUrl,
  compassPoint,
  emergencyNumberFor,
  type CameraNearPoint,
  type CompassPoint,
} from "@world-vitality/hazard-feeds";
import { useI18n } from "../../lib/i18n/i18n-provider";
import { FIRE_COLOR, type GlobeFire, type GlobeSelection, type PublicCamera } from "./globe-types";

const COMPASS_KEY = {
  N: "globe.compass.n",
  NE: "globe.compass.ne",
  E: "globe.compass.e",
  SE: "globe.compass.se",
  S: "globe.compass.s",
  SW: "globe.compass.sw",
  W: "globe.compass.w",
  NW: "globe.compass.nw",
} as const satisfies Record<CompassPoint, string>;

const PANEL_CSS = `
.wv-globe-panel {
  position: absolute;
  inset-block: 0;
  inset-inline-end: 0;
  width: min(24rem, 100%);
  z-index: 5;
  overflow-y: auto;
  box-sizing: border-box;
  padding: var(--wv-space-md);
  background: var(--wv-surface);
  color: var(--wv-text-primary);
  border-inline-start: 1px solid var(--wv-border);
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.35);
  font-family: var(--wv-font-sans);
}
@media (max-width: 40rem) {
  .wv-globe-panel {
    inset-block-start: auto;
    inset-inline: 0;
    width: auto;
    max-height: 70%;
    border-inline-start: 0;
    border-block-start: 1px solid var(--wv-border);
  }
}
`;

const sectionStyle: CSSProperties = { marginTop: "var(--wv-space-md)" };
const mutedStyle: CSSProperties = { color: "var(--wv-text-secondary)" };

/**
 * The details panel for whatever the person opened on the Globe: a satellite
 * heat detection (with the public cameras nearest to it) or a single public
 * camera. It is also where the "call the fire service" button lives, so the
 * answer to "is this real?" and the way to act on it are on one screen.
 *
 * Honesty is part of the panel, not fine print: a heat detection is shown as
 * *possibly* a fire; a camera picture is labelled as a still that may be
 * minutes old; the emergency text says to call only for a real, current fire
 * and that this is not an official alert. Pictures are loaded straight from
 * the agency by this browser, only once a camera is open here, and carry the
 * agency's credit and licence.
 */
export function GlobePanel({
  selection,
  fire,
  camera,
  camerasFailed,
  onSelect,
  onClose,
}: {
  selection: GlobeSelection;
  fire: GlobeFire | null;
  camera: PublicCamera | null;
  camerasFailed: boolean;
  onSelect: (selection: GlobeSelection) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Bring keyboard focus into the panel when something is opened, and let Escape close it.
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, [selection.kind, selection.id]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // A camera opened from a fire's list remembers that fire, to show the distance and to go back.
  const parentFire = selection.kind === "camera" && selection.fromFireId ? fire : null;
  const nearEntry =
    parentFire && camera ? parentFire.nearby.find((n) => n.camera.id === camera.id) : undefined;

  return (
    <aside
      className="wv-globe-panel"
      role="dialog"
      aria-modal="false"
      aria-label={t("globe.panel.label")}
      data-testid="globe-panel"
      dir="auto"
    >
      <style>{PANEL_CSS}</style>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--wv-space-sm)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {selection.kind === "camera" && parentFire && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect({ kind: "fire", id: parentFire.id })}
              style={{ marginBlockEnd: "var(--wv-space-xs)", paddingInline: 0 }}
            >
              ← {t("globe.panel.back")}
            </Button>
          )}
          <Text variant="sectionTitle" as="h2" style={{ margin: 0, fontSize: "1.125rem" }}>
            {selection.kind === "fire"
              ? t("globe.panel.fire.title")
              : t("globe.panel.camera.title")}
          </Text>
        </div>
        <Button
          ref={closeRef}
          variant="secondary"
          size="sm"
          onClick={onClose}
          aria-label={t("globe.panel.close")}
        >
          ✕
        </Button>
      </div>

      {selection.kind === "fire" && fire && (
        <FireDetails fire={fire} camerasFailed={camerasFailed} onSelect={onSelect} />
      )}
      {selection.kind === "camera" && camera && (
        <CameraDetails key={camera.id} camera={camera} near={nearEntry} />
      )}
    </aside>
  );
}

function formatKm(km: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(km);
}

function FireDetails({
  fire,
  camerasFailed,
  onSelect,
}: {
  fire: GlobeFire;
  camerasFailed: boolean;
  onSelect: (selection: GlobeSelection) => void;
}) {
  const { t, relativeTime, locale } = useI18n();
  // The country is only known from a camera of a known agency close to the fire.
  const nearest = fire.nearby[0];
  const countryCode = nearest ? CAMERA_PROVIDERS[nearest.camera.providerId].countryCode : null;
  return (
    <>
      <Text variant="body" style={{ ...sectionStyle, display: "block" }}>
        {t("globe.panel.fire.what")}
      </Text>
      <ul
        style={{
          listStyle: "none",
          margin: "var(--wv-space-sm) 0 0",
          padding: 0,
          display: "grid",
          gap: "var(--wv-space-xs)",
        }}
      >
        <li>{t("globe.panel.fire.detections", { count: fire.count })}</li>
        {fire.maxFrp !== null && (
          <li>{t("globe.panel.fire.power", { frp: formatKm(fire.maxFrp, locale) })}</li>
        )}
        <li>
          {fire.confidence === "high"
            ? t("globe.panel.fire.confidenceHigh")
            : t("globe.panel.fire.confidenceNominal")}
        </li>
        <li>{t("globe.panel.fire.latest", { when: relativeTime(fire.latestAcquiredAt) })}</li>
        <li style={mutedStyle}>
          {t("globe.panel.fire.position", {
            latitude: fire.latitude.toFixed(3),
            longitude: fire.longitude.toFixed(3),
          })}
        </li>
      </ul>

      <LookAround latitude={fire.latitude} longitude={fire.longitude} />

      <section style={sectionStyle} aria-labelledby="globe-panel-cameras">
        <Text
          variant="body"
          as="h3"
          id="globe-panel-cameras"
          style={{ margin: "0 0 var(--wv-space-xs)", fontWeight: 600 }}
        >
          {t("globe.panel.cameras.title")}
        </Text>
        {fire.nearby.length > 0 ? (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: "var(--wv-space-sm)",
            }}
          >
            {fire.nearby.map((entry) => (
              <li key={entry.camera.id}>
                <NearbyCamera
                  entry={entry}
                  onOpen={() =>
                    onSelect({ kind: "camera", id: entry.camera.id, fromFireId: fire.id })
                  }
                />
              </li>
            ))}
          </ul>
        ) : (
          <Text variant="caption" style={{ ...mutedStyle, display: "block" }}>
            {camerasFailed ? t("globe.panel.cameras.unavailable") : t("globe.panel.cameras.none")}
          </Text>
        )}
      </section>

      <EmergencyBlock countryCode={countryCode} />
    </>
  );
}

function directionText(
  near: CameraNearPoint,
  t: ReturnType<typeof useI18n>["t"],
  locale: string,
): string {
  return t("globe.panel.camera.distance", {
    distance: formatKm(near.distanceKm, locale),
    direction: t(COMPASS_KEY[compassPoint(near.bearingDegrees)]),
  });
}

function NearbyCamera({ entry, onOpen }: { entry: CameraNearPoint; onOpen: () => void }) {
  const { t, locale } = useI18n();
  const [failed, setFailed] = useState(false);
  // A new look at least once a minute: agencies publish each new still at the same address.
  const [minute] = useState(() => Math.floor(Date.now() / 60_000));
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: "grid",
        gridTemplateColumns: "6.5rem 1fr",
        gap: "var(--wv-space-sm)",
        width: "100%",
        padding: "var(--wv-space-xs)",
        textAlign: "start",
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
        background: "transparent",
        border: "1px solid var(--wv-border)",
        borderRadius: "var(--wv-radius-sm)",
      }}
    >
      <span
        style={{
          display: "block",
          aspectRatio: "4 / 3",
          background: "#0b0f14",
          borderRadius: "var(--wv-radius-sm)",
          overflow: "hidden",
        }}
      >
        {!failed && (
          // eslint-disable-next-line @next/next/no-img-element -- the agency's own live still, loaded straight from its host; next/image would proxy it through this server
          <img
            src={cacheBustedImageUrl(entry.camera.imageUrl, minute)}
            alt={t("globe.panel.camera.alt", { name: entry.camera.name })}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontWeight: 600, overflowWrap: "anywhere" }}>
          {entry.camera.name}
        </span>
        <span style={{ display: "block", fontSize: "0.8125rem", ...mutedStyle }}>
          {directionText(entry, t, locale)}
        </span>
        {failed && (
          <span style={{ display: "block", fontSize: "0.8125rem", ...mutedStyle }}>
            {t("globe.panel.camera.unavailable")}
          </span>
        )}
      </span>
    </button>
  );
}

function CameraDetails({ camera, near }: { camera: PublicCamera; near?: CameraNearPoint }) {
  const { t, locale, date } = useI18n();
  const [failed, setFailed] = useState(false);
  // When this picture was fetched, in the person's own clock; "Reload" fetches it again.
  const [loadedAt, setLoadedAt] = useState(() => Date.now());
  const provider = CAMERA_PROVIDERS[camera.providerId];
  const autoMinutes = autoRefreshMinutes(camera.refreshMinutes);
  // The agencies publish a new still every few minutes, not a video. While the
  // panel is open and the tab is in view, the next picture is fetched in the
  // background on the agency's own rhythm and swapped in only once it has
  // loaded, so a person who keeps the panel open sees it move forward without
  // tapping, and a failed refresh never replaces a good picture with an error.
  useEffect(() => {
    let cancelled = false;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const next = Date.now();
      const probe = new window.Image();
      probe.referrerPolicy = "no-referrer";
      probe.onload = () => {
        if (!cancelled) setLoadedAt(next);
      };
      probe.src = cacheBustedImageUrl(camera.imageUrl, next);
    }, autoMinutes * 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [autoMinutes, camera.imageUrl]);
  return (
    <>
      <div
        style={{
          ...sectionStyle,
          aspectRatio: "4 / 3",
          width: "100%",
          background: "#0b0f14",
          borderRadius: "var(--wv-radius-sm)",
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          position: "relative",
        }}
      >
        {failed ? (
          <Text variant="caption" style={{ color: "#fff", padding: "var(--wv-space-md)" }}>
            {t("globe.panel.camera.unavailable")}
          </Text>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- the agency's own live still, loaded straight from its host; next/image would proxy it through this server
          <img
            src={cacheBustedImageUrl(camera.imageUrl, loadedAt)}
            alt={t("globe.panel.camera.alt", { name: camera.name })}
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
        )}
        <span
          style={{
            position: "absolute",
            insetInlineStart: "var(--wv-space-xs)",
            bottom: "var(--wv-space-xs)",
            padding: "2px 8px",
            borderRadius: "var(--wv-radius-sm)",
            background: "rgba(0, 0, 0, 0.72)",
            color: "#fff",
            fontSize: "0.75rem",
            lineHeight: 1.4,
            pointerEvents: "none",
          }}
        >
          {t("globe.panel.camera.stillBadge")}
        </span>
      </div>
      <Text
        variant="body"
        style={{ display: "block", marginTop: "var(--wv-space-sm)", fontWeight: 600 }}
      >
        {camera.name}
      </Text>
      <ul
        style={{
          listStyle: "none",
          margin: "var(--wv-space-xs) 0 0",
          padding: 0,
          display: "grid",
          gap: "var(--wv-space-xs)",
          fontSize: "0.875rem",
        }}
      >
        {near && <li>{directionText(near, t, locale)}</li>}
        <li>
          {t("globe.panel.camera.source", { provider: camera.credit ?? provider.attribution })}
          {camera.credit && ` · ${provider.attribution}`}
        </li>
        <li>
          <a href={provider.licenceUrl} target="_blank" rel="noopener noreferrer">
            {t("globe.panel.camera.licence", { licence: provider.licenceName })}
          </a>
        </li>
        {camera.refreshMinutes !== null && (
          <li>{t("globe.panel.camera.refresh", { minutes: camera.refreshMinutes })}</li>
        )}
      </ul>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "var(--wv-space-sm)",
          marginTop: "var(--wv-space-sm)",
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setFailed(false);
            setLoadedAt(Date.now());
          }}
        >
          {t("globe.panel.camera.reload")}
        </Button>
        <Text variant="caption" style={{ ...mutedStyle, flex: 1, minWidth: "12rem" }}>
          {t("globe.panel.camera.loadedAt", {
            time: date(loadedAt, { hour: "2-digit", minute: "2-digit" }),
          })}
        </Text>
      </div>
      <Text
        variant="caption"
        style={{ ...mutedStyle, display: "block", marginTop: "var(--wv-space-sm)" }}
      >
        {t("globe.panel.camera.stillNote")}{" "}
        {t("globe.panel.camera.autoRefresh", { minutes: autoMinutes })}
      </Text>
      <LookAround latitude={camera.latitude} longitude={camera.longitude} />
      <EmergencyBlock countryCode={provider.countryCode} />
    </>
  );
}

/**
 * Links into Google Maps for the same spot, so a person can see what kind of
 * place it is (houses, a forest, a factory) before deciding what to say to a
 * dispatcher. Plain links to Google's own site (its documented "Maps URLs"),
 * opened by the person: nothing from Google is shown or loaded inside the
 * Globe. Google's satellite and Street View pictures are stored photos from
 * earlier dates, never live, and the panel says so.
 */
function LookAround({ latitude, longitude }: { latitude: number; longitude: number }) {
  const { t } = useI18n();
  const place = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  const satellite = `https://www.google.com/maps/@?api=1&map_action=map&center=${place}&zoom=17&basemap=satellite`;
  const street = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${place}`;
  return (
    <section style={sectionStyle} aria-labelledby="globe-panel-look">
      <Text
        variant="body"
        as="h3"
        id="globe-panel-look"
        style={{ margin: "0 0 var(--wv-space-xs)", fontWeight: 600 }}
      >
        {t("globe.panel.look.title")}
      </Text>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gap: "var(--wv-space-xs)",
          fontSize: "0.875rem",
        }}
      >
        <li>
          <a href={satellite} target="_blank" rel="noopener noreferrer">
            {t("globe.panel.look.satellite")}
          </a>
        </li>
        <li>
          <a href={street} target="_blank" rel="noopener noreferrer">
            {t("globe.panel.look.street")}
          </a>
        </li>
      </ul>
      <Text
        variant="caption"
        style={{ ...mutedStyle, display: "block", marginTop: "var(--wv-space-xs)" }}
      >
        {t("globe.panel.look.note")}
      </Text>
    </section>
  );
}

function EmergencyBlock({ countryCode }: { countryCode: string | null }) {
  const { t } = useI18n();
  const emergency = emergencyNumberFor(countryCode);
  return (
    <section
      style={{
        ...sectionStyle,
        padding: "var(--wv-space-sm)",
        border: `1px solid ${FIRE_COLOR}`,
        borderRadius: "var(--wv-radius-sm)",
      }}
      aria-labelledby="globe-panel-emergency"
    >
      <Text
        variant="body"
        as="h3"
        id="globe-panel-emergency"
        style={{ margin: "0 0 var(--wv-space-xs)", fontWeight: 600 }}
      >
        {t("globe.panel.emergency.title")}
      </Text>
      <ButtonLink
        href={`tel:${emergency.number}`}
        variant="primary"
        style={{
          backgroundColor: "var(--wv-color-critical-500)",
          width: "100%",
          marginBottom: "var(--wv-space-xs)",
        }}
      >
        {emergency.specific
          ? t("globe.panel.emergency.callSpecific", { number: emergency.number })
          : t("globe.panel.emergency.callGeneral", { number: emergency.number })}
      </ButtonLink>
      <Text variant="caption" style={{ ...mutedStyle, display: "block" }}>
        {t("globe.panel.emergency.advice")}
      </Text>
      {!emergency.specific && (
        <Text
          variant="caption"
          style={{ ...mutedStyle, display: "block", marginTop: "var(--wv-space-xs)" }}
        >
          {t("globe.panel.emergency.general")}
        </Text>
      )}
    </section>
  );
}
