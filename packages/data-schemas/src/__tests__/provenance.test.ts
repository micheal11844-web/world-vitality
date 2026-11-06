import { test } from "node:test";
import assert from "node:assert/strict";
import { IngestionGapSchema, ProvenanceSchema } from "../index.js";

// These pin the behaviours the connectors rely on, so a change of the
// validation library (zod 3 to 4) cannot quietly loosen or tighten them.

const PROVENANCE = {
  source: "nasa-power",
  sourceName: "NASA POWER",
  license: "public-domain",
  retrievedAt: "2026-11-06T09:00:00.000Z",
  knownLimitations: [],
};

test("provenance: licence, source and the limitations list are all required", () => {
  assert.equal(ProvenanceSchema.safeParse(PROVENANCE).success, true);
  assert.equal(ProvenanceSchema.safeParse({ ...PROVENANCE, license: "" }).success, false);
  assert.equal(ProvenanceSchema.safeParse({ ...PROVENANCE, source: "" }).success, false);
  const withoutLimitations: Partial<typeof PROVENANCE> = { ...PROVENANCE };
  delete withoutLimitations.knownLimitations;
  assert.equal(ProvenanceSchema.safeParse(withoutLimitations).success, false);
});

test("provenance: timestamps must be full UTC date-times; the attribution link must be a URL", () => {
  assert.equal(
    ProvenanceSchema.safeParse({ ...PROVENANCE, retrievedAt: "2026-11-06" }).success,
    false,
  );
  assert.equal(
    ProvenanceSchema.safeParse({ ...PROVENANCE, retrievedAt: "2026-11-06T09:00:00" }).success,
    false,
    "no time zone",
  );
  assert.equal(
    ProvenanceSchema.safeParse({ ...PROVENANCE, observedAt: "2026-11-06T09:00:00Z" }).success,
    true,
  );
  assert.equal(
    ProvenanceSchema.safeParse({ ...PROVENANCE, attributionUrl: "https://power.larc.nasa.gov/" })
      .success,
    true,
  );
  assert.equal(
    ProvenanceSchema.safeParse({ ...PROVENANCE, attributionUrl: "not a url" }).success,
    false,
  );
});

test("ingestion gap: the reason must be one of the known categories", () => {
  const gap = {
    description: "No wind speed for the last hour",
    reason: "provider-unavailable",
    occurredAt: "2026-11-06T09:00:00Z",
    transient: true,
  };
  assert.equal(IngestionGapSchema.safeParse(gap).success, true);
  assert.equal(IngestionGapSchema.safeParse({ ...gap, reason: "made-up" }).success, false);
  assert.equal(IngestionGapSchema.safeParse({ ...gap, description: "" }).success, false);
  assert.equal(IngestionGapSchema.safeParse({ ...gap, transient: "yes" }).success, false);
});
