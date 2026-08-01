import type { NormalizedDataRecord, IngestionGap } from "@world-vitality/data-schemas";

/**
 * The result of one ingestion run.
 *
 * Both `records` and `gaps` are returned together, deliberately — a
 * connector that retrieved some data but not all of what it expected
 * must report both, not just the part that succeeded. Silently
 * returning only `records` on a partial failure is exactly the
 * "silent omission" ADR-0003 prohibits.
 */
export interface IngestionResult {
  records: NormalizedDataRecord[];
  gaps: IngestionGap[];
}

/**
 * What triggered this ingestion run — useful for logging/monitoring
 * and for connectors whose retrieval strategy differs by trigger type.
 */
export type IngestionTrigger =
  | { type: "scheduled"; scheduledFor: string }
  | { type: "manual"; requestedBy: string }
  | { type: "webhook"; sourceEvent: string };

/**
 * The contract any data-provider connector must implement.
 *
 * Per ADR-0003 (Data Ingestion Interface): a connector must retrieve data
 * on a defined schedule or trigger, normalize it into the shared schema
 * (including provenance), report gaps/failures explicitly, and expose
 * nothing provider-specific beyond this boundary.
 *
 * No provider is implemented against this interface yet — that's
 * BUILD_PLAN Stage 2 (the first connector, NASA). This interface is
 * provisional until that implementation, and a second, deliberately
 * different connector, have both validated it (ADR-0003 Standing Action
 * Item).
 */
export interface DataIngestionConnector {
  /**
   * Stable identifier for this connector, used as `provenance.source`
   * on every record it produces (e.g. "nasa-power").
   */
  readonly id: string;

  /**
   * Human-readable name, used as `provenance.sourceName`.
   */
  readonly displayName: string;

  /**
   * Retrieve and normalize data for this run.
   *
   * Implementations must:
   * - Normalize all output into `NormalizedDataRecord` — no
   *   provider-specific fields or formats may leak past this method's
   *   return value.
   * - Attach complete `provenance` (source, license, retrieval time,
   *   known limitations) to every record — never partial.
   * - Report anything expected but not retrievable as an `IngestionGap`
   *   rather than omitting it or substituting a fabricated value.
   * - Never throw for expected failure modes (provider downtime, rate
   *   limits, partial coverage) — those belong in `gaps`. Reserve thrown
   *   errors for truly unexpected conditions the caller cannot reason
   *   about (e.g. programming errors, malformed connector configuration).
   */
  ingest(trigger: IngestionTrigger): Promise<IngestionResult>;

  /**
   * Report this connector's current health without performing a full
   * ingestion run — used for monitoring/alerting (Engineering Blueprint
   * Section 11: API failures) independent of the ingestion schedule.
   */
  checkHealth(): Promise<{ healthy: boolean; detail?: string }>;
}
