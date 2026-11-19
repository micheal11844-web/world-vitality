"use client";

import { useMemo, type CSSProperties, type MutableRefObject } from "react";
import {
  rankFires,
  rankFloods,
  type GlobeFire,
  type GlobeFlood,
} from "@world-vitality/hazard-feeds";
import { useI18n } from "../../lib/i18n/i18n-provider";
import { floodPlace } from "./globe-flood-place";
import type { GlobeSelection } from "./globe-types";

/** How many heat detections the list shows (a day can bring thousands; the strongest come first). */
export const EVENT_LIST_MAX_FIRES = 15;

const summaryStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  minHeight: "2.75rem",
  cursor: "pointer",
  fontWeight: 600,
};
const listStyle: CSSProperties = { listStyle: "none", margin: 0, padding: 0 };
const buttonStyle: CSSProperties = {
  display: "block",
  width: "100%",
  minHeight: "2.75rem",
  padding: "var(--wv-space-xs) 0",
  background: "none",
  border: "none",
  color: "var(--wv-accent)",
  font: "inherit",
  textAlign: "start",
  textDecoration: "underline",
  cursor: "pointer",
};

/**
 * The Globe's events as a plain list of buttons, for a person who cannot pick a dot drawn on
 * the 3D canvas (keyboard, screen reader, switch device) and for anyone who prefers reading
 * to hunting for dots. Every flood event is listed (red alerts first) and the strongest heat
 * detections; each button opens the same details panel as the dot does and flies the globe
 * there. Public cameras are reached from a heat detection's details, as they are on the map.
 *
 * Collapsed by default so it costs one line of room. `openerRef` receives the button that was
 * used, so the page can hand keyboard focus back to it when the details panel is closed.
 */
export function GlobeEventList({
  floods,
  fires,
  onSelect,
  openerRef,
}: {
  floods: readonly GlobeFlood[];
  fires: readonly GlobeFire[];
  onSelect: (selection: GlobeSelection) => void;
  openerRef: MutableRefObject<HTMLElement | null>;
}) {
  const { t, locale } = useI18n();
  const rankedFloods = useMemo(() => rankFloods(floods), [floods]);
  const rankedFires = useMemo(() => rankFires(fires, EVENT_LIST_MAX_FIRES), [fires]);
  const total = rankedFloods.length + rankedFires.length;
  if (total === 0) return null;

  const open = (selection: GlobeSelection) => (event: { currentTarget: HTMLElement }) => {
    openerRef.current = event.currentTarget;
    onSelect(selection);
  };

  return (
    <details data-testid="globe-event-list" style={{ marginTop: "var(--wv-space-xs)" }}>
      <summary style={summaryStyle}>{t("globe.list.summary", { count: total })}</summary>
      <div style={{ maxHeight: "40vh", overflowY: "auto" }}>
        <p style={{ margin: "0 0 var(--wv-space-xs)", opacity: 0.85 }}>{t("globe.list.note")}</p>
        {rankedFloods.length > 0 && (
          <>
            <strong id="globe-list-floods">{t("globe.list.floods")}</strong>
            <ul aria-labelledby="globe-list-floods" style={listStyle}>
              {rankedFloods.map((flood) => (
                <li key={flood.id}>
                  <button
                    type="button"
                    data-testid="globe-list-flood"
                    onClick={open({ kind: "flood", id: flood.id })}
                    style={buttonStyle}
                  >
                    {floodPlace(flood, locale)} · {t(`globe.panel.flood.alert.${flood.alert}`)}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        {rankedFires.length > 0 && (
          <>
            <strong id="globe-list-fires">{t("globe.list.fires")}</strong>
            <ul aria-labelledby="globe-list-fires" style={listStyle}>
              {rankedFires.map((fire) => (
                <li key={fire.id}>
                  <button
                    type="button"
                    data-testid="globe-list-fire"
                    onClick={open({ kind: "fire", id: fire.id })}
                    style={buttonStyle}
                  >
                    {t("globe.list.fire", {
                      latitude: fire.latitude.toFixed(2),
                      longitude: fire.longitude.toFixed(2),
                      count: fire.count,
                    })}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </details>
  );
}
