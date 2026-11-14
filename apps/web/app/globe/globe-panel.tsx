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
import { floodPlace } from "./globe-flood-place";
import {
  FIRE_COLOR,
  FLOOD_COLOR,
  type GlobeFire,
  type GlobeFlood,
  type GlobeSelection,
  type PublicCamera,
} from "./globe-types";

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
 * heat detection (with the public cameras nearest to it), a flood event from
 * GDACS or a single public camera. It is also where the "call the fire service" button lives, so the
 * answer to "is this real?" and the way to act on it are on one screen.
 *
 * Honesty is part of the panel, not fine print: a heat detection is shown as
 * *possibly* a fire; a camera picture is labelled as a still that may be
 * minutes old; a flood event says it is a model estimate over a large area, not
 * an official warning, and that a smaller flood may not be listed; the emergency
 * text says to call only for a real, current fire and that this is not an
 * official alert. Pictures are loaded straight from
 * the agency by this browser, only once a camera is open here, and carry the
 * agency's credit and licence.
 */
export function GlobePanel({
  selection,
  fire,
  flood,
  camera,
  camerasFailed,
  onSelect,
  onClose,
}: {
  selection: GlobeSelection;
  fire: GlobeFire | null;
  flood: GlobeFlood | null;
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
              : selection.kind === "flood"
                ? t("globe.panel.flood.title")
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
      {selection.kind === "flood" && flood && <FloodDetails key={flood.id} flood={flood} />}
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

const FLOOD_ALERT_KEY = {
  red: "globe.panel.flood.alert.red",
  orange: "globe.panel.flood.alert.orange",
  green: "globe.panel.flood.alert.green",
} as const satisfies Record<GlobeFlood["alert"], string>;

const FLOOD_DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

/**
 * One GDACS flood event. It says plainly what it is (a model estimate over a
 * large area, not a street and not an official warning), shows GDACS's own alert
 * level and dates, links to GDACS's page for the event, and offers the emergency
 * number for someone who is in danger.
 */
function FloodDetails({ flood }: { flood: GlobeFlood }) {
  const { t, date, locale, number } = useI18n();
  const from = date(flood.startedAt, FLOOD_DATE);
  const period = flood.ongoing
    ? t("globe.panel.flood.ongoing", { from })
    : flood.endedAt
      ? t("globe.panel.flood.period", { from, to: date(flood.endedAt, FLOOD_DATE) })
      : t("globe.panel.flood.started", { from });
  return (
    <>
      <Text
        variant="body"
        data-testid="globe-flood-place"
        style={{ ...sectionStyle, fontWeight: 600 }}
        dir="auto"
      >
        {floodPlace(flood, locale)}
      </Text>
      <Text variant="body" style={{ display: "block", marginTop: "var(--wv-space-xs)" }}>
        {t("globe.panel.flood.what")}
      </Text>
      <ul style={{ margin: "var(--wv-space-sm) 0 0", paddingInlineStart: "1.25rem" }}>
        <li>
          <Text variant="body" data-testid="globe-flood-alert">
            {t(FLOOD_ALERT_KEY[flood.alert])}
          </Text>
        </li>
        <li>
          <Text variant="body" data-testid="globe-flood-period">
            {period}
          </Text>
        </li>
        <li>
          <Text variant="caption" style={mutedStyle} dir="ltr">
            {t("globe.panel.flood.position", {
              latitude: number(Math.round(flood.latitude * 100) / 100),
              longitude: number(Math.round(flood.longitude * 100) / 100),
            })}
          </Text>
        </li>
      </ul>
      <div style={sectionStyle}>
        <ButtonLink
          href={flood.reportUrl}
          variant="secondary"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="globe-flood-report"
        >
          {t("globe.panel.flood.report")} ↗
        </ButtonLink>
      </div>
      <EmergencyBlock kind="flood" countryCode={flood.countryCode} />
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
        {entry.camera.freshAddress && (
          <Text
            variant="caption"
            style={{ color: "#fff", display: "block", padding: "var(--wv-space-xs)" }}
          >
            {t("globe.panel.camera.openForLatest")}
          </Text>
        )}
        {!failed && !entry.camera.freshAddress && (
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

/**
 * The latest picture address of a camera whose address changes with every
 * picture (Singapore), or `null` when it cannot be had right now. Never throws:
 * the picture already on screen simply stays.
 */
async function fetchLatestPicture(
  id: string,
): Promise<{ imageUrl: string; takenAt: string | null } | null> {
  try {
    const response = await fetch(`/api/globe/camera-picture?id=${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    const imageUrl = (body as { imageUrl?: unknown } | null)?.imageUrl;
    const takenAt = (body as { takenAt?: unknown } | null)?.takenAt;
    return typeof imageUrl === "string"
      ? { imageUrl, takenAt: typeof takenAt === "string" ? takenAt : null }
      : null;
  } catch {
    return null;
  }
}

function CameraDetails({ camera, near }: { camera: PublicCamera; near?: CameraNearPoint }) {
  const { t, locale, date } = useI18n();
  const [failed, setFailed] = useState(false);
  // When this picture was fetched, in the person's own clock; "Reload" fetches it again.
  const [loadedAt, setLoadedAt] = useState(() => Date.now());
  // Singapore puts every new picture at a new address, so the address in the
  // camera list is already out of date: ask the server for the latest one.
  const [latest, setLatest] = useState<{ imageUrl: string; takenAt: string | null } | null>(null);
  const provider = CAMERA_PROVIDERS[camera.providerId];
  const autoMinutes = autoRefreshMinutes(camera.refreshMinutes);
  const imageSrc = camera.freshAddress
    ? (latest?.imageUrl ?? camera.imageUrl)
    : cacheBustedImageUrl(camera.imageUrl, loadedAt);
  const takenAt = latest?.takenAt ?? camera.takenAt ?? null;
  useEffect(() => {
    if (!camera.freshAddress) return;
    let cancelled = false;
    void fetchLatestPicture(camera.id).then((picture) => {
      if (picture && !cancelled) {
        setLatest(picture);
        setLoadedAt(Date.now());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [camera.id, camera.freshAddress]);
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
      const preload = (url: string, onLoaded: () => void) => {
        const probe = new window.Image();
        probe.referrerPolicy = "no-referrer";
        probe.onload = () => {
          if (!cancelled) onLoaded();
        };
        probe.src = url;
      };
      if (camera.freshAddress) {
        void fetchLatestPicture(camera.id).then((picture) => {
          if (!picture || cancelled) return;
          preload(picture.imageUrl, () => {
            setLatest(picture);
            setLoadedAt(next);
          });
        });
        return;
      }
      preload(cacheBustedImageUrl(camera.imageUrl, next), () => setLoadedAt(next));
    }, autoMinutes * 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [autoMinutes, camera.id, camera.imageUrl, camera.freshAddress]);
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
            src={imageSrc}
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
        {takenAt && Number.isFinite(Date.parse(takenAt)) && (
          <li>
            {t("globe.panel.camera.takenAt", {
              time: date(Date.parse(takenAt), { hour: "2-digit", minute: "2-digit" }),
            })}
          </li>
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
            if (camera.freshAddress) {
              void fetchLatestPicture(camera.id).then((picture) => {
                if (picture) setLatest(picture);
                setLoadedAt(Date.now());
              });
              return;
            }
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

function EmergencyBlock({
  countryCode,
  kind = "fire",
}: {
  countryCode: string | null;
  kind?: "fire" | "flood";
}) {
  const { t } = useI18n();
  const emergency = emergencyNumberFor(countryCode);
  const flood = kind === "flood";
  return (
    <section
      style={{
        ...sectionStyle,
        padding: "var(--wv-space-sm)",
        border: `1px solid ${flood ? FLOOD_COLOR : FIRE_COLOR}`,
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
        {flood ? t("globe.panel.flood.emergencyTitle") : t("globe.panel.emergency.title")}
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
        {emergency.specific && !flood
          ? t("globe.panel.emergency.callSpecific", { number: emergency.number })
          : t("globe.panel.emergency.callGeneral", { number: emergency.number })}
      </ButtonLink>
      <Text variant="caption" style={{ ...mutedStyle, display: "block" }}>
        {flood ? t("globe.panel.flood.emergencyAdvice") : t("globe.panel.emergency.advice")}
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
