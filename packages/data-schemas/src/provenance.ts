import { z } from "zod";

/**
 * Provenance metadata required on every piece of normalized data.
 *
 * Per Constitution Section 24 (Data Ethics): every data source must have
 * documented licensing terms, attribution requirements, and known
 * limitations. This is not optional metadata a connector can choose to
 * omit — ADR-0003 requires it as part of normalization, not as an
 * afterthought bolted on before display.
 */
export const ProvenanceSchema = z.object({
  /** Identifier of the originating provider (e.g. "nasa-power", "noaa-ndbc"). */
  source: z.string().min(1),

  /** Human-readable name of the source, for display and attribution. */
  sourceName: z.string().min(1),

  /**
   * License under which this data is provided (e.g. "public-domain",
   * "CC-BY-4.0"). Required — a connector must not ingest data whose
   * license is unknown or undocumented (Constitution Section 24).
   */
  license: z.string().min(1),

  /** URL or citation for attribution requirements, if any apply. */
  attributionUrl: z.string().url().optional(),

  /** When this specific value/record was retrieved from the source. */
  retrievedAt: z.string().datetime(),

  /**
   * When the underlying observation/measurement itself occurred or was
   * published by the source, if distinct from retrieval time (e.g. a
   * satellite pass timestamp vs. when we polled the API for it).
   */
  observedAt: z.string().datetime().optional(),

  /**
   * Known limitations of this source or this specific data point —
   * spatial/temporal resolution caveats, instrument error margins,
   * processing-level notes, etc. Required per Constitution Section 24;
   * an empty array is an explicit statement of "none known", not the
   * same as omitting the field.
   */
  knownLimitations: z.array(z.string()),
});

export type Provenance = z.infer<typeof ProvenanceSchema>;
