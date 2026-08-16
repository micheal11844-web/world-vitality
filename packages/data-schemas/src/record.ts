import { z } from "zod";
import { ProvenanceSchema } from "./provenance.js";

/**
 * A geospatial point or bounding region a record applies to.
 * Kept minimal at Stage 1 — extend as real connectors (Stage 2) reveal
 * what shapes are actually needed (point vs. polygon vs. grid cell).
 */
export const GeoLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  /** Optional radius in meters, for area-representative point data
   *  (e.g. a grid-cell centroid standing in for the whole cell). */
  approximateRadiusMeters: z.number().nonnegative().optional(),
});

export type GeoLocation = z.infer<typeof GeoLocationSchema>;

/**
 * One normalized, provider-agnostic data record.
 *
 * This is the contract referenced throughout ADR-0003: every ingestion
 * connector must normalize into this shape, and every interpretation
 * provider must accept this shape as input — never a provider-specific
 * format on either side of the boundary.
 *
 * Deliberately generic at Stage 1 (no provider is wired in yet, per
 * BUILD_PLAN 1.1–1.3). `metric` and `value` are intentionally loose;
 * tighten with a discriminated union of known metric types once the
 * first real connector (Stage 2, NASA) shows what's actually needed —
 * per ADR-0003's Standing Action Item, this is provisional until then.
 */
export const NormalizedDataRecordSchema = z
  .object({
    /** Stable identifier for this record, unique within its source. */
    id: z.string().min(1),

    /** What this record measures (e.g. "soil-moisture", "sea-surface-temp").
     *  A free-form string at Stage 1, deliberately — see note above. */
    metric: z.string().min(1),

    /** The measured value. */
    value: z.number(),

    /** Unit the value is expressed in (e.g. "percent", "celsius", "mm"). */
    unit: z.string().min(1),

    /** Where this record applies. Optional: some metrics are non-spatial. */
    location: GeoLocationSchema.optional(),

    /** When the measurement is valid for (distinct from provenance.retrievedAt,
     *  which is when *we* fetched it). */
    timestamp: z.string().datetime(),

    /**
     * Whether this is a directly observed/measured value, or a model-
     * predicted forecast for a future `timestamp`. Added for the Weather
     * & Climate workspace's forecast capability (BUILD_PLAN Stage 10
     * ticket 10.6) — every record before this had an implicit "observed"
     * nature that was never worth naming until a genuinely different kind
     * of record (a forecast) needed distinguishing from it. Omitted/
     * undefined means "observed" — the default every existing record
     * (NASA POWER) already satisfies, so this is purely additive, not a
     * breaking change to any existing connector, provider, or test.
     */
    recordType: z.enum(["observed", "forecast"]).optional(),

    /**
     * Required when `recordType` is `"forecast"`: when the forecast was
     * generated/issued, distinct from `timestamp` (the future moment it
     * predicts) and `provenance.retrievedAt` (when we fetched it — often
     * the same instant for a live forecast, but conceptually different,
     * since a cached or replayed forecast could have a `retrievedAt` far
     * from its original `forecastIssuedAt`). This is what makes an
     * honest lead-time-based confidence gradient possible at all:
     * `timestamp` minus `forecastIssuedAt` is how far ahead a given
     * forecast value is predicting, and confidence should genuinely
     * decrease as that gap grows — a real meteorological principle, not
     * a stylistic choice (see `WeatherForecastProvider`).
     */
    forecastIssuedAt: z.string().datetime().optional(),

    /** Required on every record — never optional. See provenance.ts. */
    provenance: ProvenanceSchema,
  })
  .refine((record) => record.recordType !== "forecast" || record.forecastIssuedAt !== undefined, {
    message: 'forecastIssuedAt is required when recordType is "forecast"',
    path: ["forecastIssuedAt"],
  });

export type NormalizedDataRecord = z.infer<typeof NormalizedDataRecordSchema>;
