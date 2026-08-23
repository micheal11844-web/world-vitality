/**
 * Disaster Monitoring workspace's one real capability (BUILD_PLAN
 * "STAGE — DISASTER MONITORING WORKSPACE"): live official alerts from
 * the U.S. National Weather Service's public API. Chosen deliberately
 * over building any AI-derived "risk status" from temperature/wind
 * data (the pattern every other workspace uses) — the Constitution's
 * own language for this workspace is explicit: "zero tolerance" for
 * anything resembling false precision or engagement-optimization,
 * this being "the single highest-stakes application of the
 * Constitution's AI honesty principles." A threshold-based "disaster
 * risk score" invented from weather data this app happens to already
 * have would look like real hazard monitoring in exactly the moment
 * someone's life-safety decision depends on it being real. Relaying an
 * actual government agency's own already-official alert, unmodified,
 * doesn't have that problem.
 *
 * No API key required — `api.weather.gov` is free, open U.S.
 * government data (NOAA/NWS), documented at
 * https://www.weather.gov/documentation/services-web-api. A descriptive
 * `User-Agent` header is NWS's documented requirement (not optional),
 * included below.
 *
 * **Deliberately NOT a `DataIngestionConnector`** (unlike
 * `NasaPowerConnector`/`OpenMeteoConnector`): that interface's contract
 * requires normalizing output into `NormalizedDataRecord` — a single
 * numeric metric/value/unit/timestamp — and an alert is a structured
 * event (headline, severity, urgency, description, effective/expires
 * window), not a numeric reading. Forcing it into that shape would mean
 * either fabricating a fake metric/value or losing the actual alert
 * content. Same reasoning already applied to `geocode.ts` and
 * `password-breach-check.ts` — a real external data need that
 * genuinely doesn't fit the ingestion layer's shape, not a shortcut
 * around it.
 */

const NWS_ALERTS_API_BASE = "https://api.weather.gov/alerts/active";

export interface NwsAlert {
  id: string;
  event: string;
  headline: string;
  severity: string;
  urgency: string;
  certainty: string;
  description: string;
  instruction: string | null;
  areaDesc: string;
  effective: string;
  expires: string;
  senderName: string;
}

interface NwsAlertsApiResponse {
  features?: {
    properties: {
      id: string;
      event: string;
      headline: string;
      severity: string;
      urgency: string;
      certainty: string;
      description: string;
      instruction: string | null;
      areaDesc: string;
      effective: string;
      expires: string;
      senderName: string;
    };
  }[];
}

/**
 * Fetches currently active NWS alerts for a point. **U.S. and
 * territories only** — the National Weather Service has no coverage
 * outside U.S. jurisdiction, stated here rather than left implicit,
 * since every other workspace's demo location is deliberately outside
 * the U.S. (Nigeria) and this one deliberately cannot reuse it.
 *
 * Returns an empty array for "no active alerts at this point" — a
 * normal, good-news outcome, not an error. Throws only on an actual
 * network/API failure, left for the caller to present.
 */
export async function fetchActiveAlerts(latitude: number, longitude: number): Promise<NwsAlert[]> {
  const url = new URL(NWS_ALERTS_API_BASE);
  url.searchParams.set("point", `${latitude},${longitude}`);

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent":
        "World-Vitality-Disaster-Monitoring (github.com/micheal11844-web/world-vitality)",
      Accept: "application/geo+json",
    },
  });

  if (!response.ok) {
    throw new Error(`National Weather Service Alerts API returned ${response.status}`);
  }

  const data = (await response.json()) as NwsAlertsApiResponse;
  return (data.features ?? []).map((feature) => ({
    id: feature.properties.id,
    event: feature.properties.event,
    headline: feature.properties.headline,
    severity: feature.properties.severity,
    urgency: feature.properties.urgency,
    certainty: feature.properties.certainty,
    description: feature.properties.description,
    instruction: feature.properties.instruction,
    areaDesc: feature.properties.areaDesc,
    effective: feature.properties.effective,
    expires: feature.properties.expires,
    senderName: feature.properties.senderName,
  }));
}
