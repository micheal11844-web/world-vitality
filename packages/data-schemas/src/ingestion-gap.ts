import { z } from "zod";

/**
 * A single explicit gap or failure in ingestion.
 *
 * ADR-0003 requires connectors to "report ingestion failures and data
 * gaps explicitly to the schema (never silently omit or fabricate missing
 * values)". This type is how a connector says "I don't have this" instead
 * of just leaving a hole a downstream consumer might mistake for zero,
 * null-as-absence, or any other implicit meaning.
 */
export const IngestionGapSchema = z.object({
  /** What was expected but could not be retrieved or normalized. */
  description: z.string().min(1),

  /** Coarse category, useful for aggregate monitoring/alerting. */
  reason: z.enum([
    "provider-unavailable",
    "rate-limited",
    "auth-failure",
    "malformed-response",
    "field-missing-at-source",
    "out-of-coverage-area",
    "other",
  ]),

  /** Free-text detail — error message, HTTP status, etc. */
  detail: z.string().optional(),

  /** When the gap was detected. */
  occurredAt: z.string().datetime(),

  /** Whether this is expected to resolve itself (e.g. transient rate limit)
   *  versus needing intervention (e.g. auth credentials expired). */
  transient: z.boolean(),
});

export type IngestionGap = z.infer<typeof IngestionGapSchema>;
