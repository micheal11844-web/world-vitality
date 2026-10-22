import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { DATA_SOURCES, sourcesRestrictingCommercialUse } from "../source-catalog.js";
import { NasaPowerConnector } from "../connectors/nasa-power-connector.js";
import { OpenMeteoConnector } from "../connectors/open-meteo-connector.js";
import { UsgsStreamflowConnector } from "../connectors/usgs-streamflow-connector.js";

// From services/data-ingestion/dist/__tests__ up to the repository root.
const PROVENANCE_DIR = new URL("../../../../docs/data-provenance/", import.meta.url);

const documented = () =>
  readdirSync(PROVENANCE_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""))
    .sort();

test("every provenance document has a catalogue entry, and every entry has a document", () => {
  const catalogued = DATA_SOURCES.map((s) => s.id).sort();
  assert.deepEqual(catalogued, documented());
});

test("ids are unique", () => {
  const ids = DATA_SOURCES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("a source documented as non-commercial is catalogued as restricted, with a reason", () => {
  for (const source of DATA_SOURCES) {
    const doc = readFileSync(new URL(`${source.id}.md`, PROVENANCE_DIR), "utf8");
    const saysNonCommercial = /non-commercial/i.test(doc);
    assert.equal(
      source.commercialUse === "restricted",
      saysNonCommercial,
      `${source.id}: catalogue says ${source.commercialUse}, document ${saysNonCommercial ? "mentions" : "does not mention"} a non-commercial restriction`,
    );
    if (source.commercialUse === "restricted") {
      assert.ok(
        source.commercialNote && source.commercialNote.length > 20,
        `${source.id} needs a note`,
      );
    }
  }
});

test("Open-Meteo is the one source that blocks charging today", () => {
  assert.deepEqual(
    sourcesRestrictingCommercialUse().map((s) => s.id),
    ["open-meteo"],
  );
});

test("a catalogued connector id is the id the real connector reports", () => {
  const real = new Set([
    new NasaPowerConnector({ locations: [], parameters: ["T2M"], community: "AG", lookbackDays: 1 })
      .id,
    new OpenMeteoConnector({ locations: [] }).id,
    new UsgsStreamflowConnector({ stations: [] }).id,
  ]);
  const claimed = DATA_SOURCES.flatMap((s) => (s.connectorId ? [s.connectorId] : []));
  assert.deepEqual([...claimed].sort(), [...real].sort());
});
