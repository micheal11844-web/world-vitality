import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PERSONAS,
  homePlaceLabel,
  isPersonaId,
  parseHomePlace,
  personaById,
  personaDestination,
} from "../personas.js";

test("persona ids are unique and every persona has a label and description", () => {
  const ids = PERSONAS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of PERSONAS) {
    assert.ok(p.label.length > 0 && p.description.length > 0, p.id);
  }
});

test("every real workspace has exactly one persona, plus one for Public Explorer", () => {
  const workspaceKeys = PERSONAS.map((p) => p.workspaceKey).filter((k): k is string => k !== null);
  assert.equal(new Set(workspaceKeys).size, workspaceKeys.length);
  assert.deepEqual([...workspaceKeys].sort(), [
    "agriculture",
    "construction",
    "disaster-monitoring",
    "education",
    "government-ngos",
    "insurance",
    "logistics",
    "renewable-energy",
    "research",
    "weather",
  ]);
  assert.equal(PERSONAS.filter((p) => p.workspaceKey === null).length, 1);
});

test("persona lookup and validation", () => {
  assert.equal(isPersonaId("farmer"), true);
  assert.equal(isPersonaId("astronaut"), false);
  assert.equal(isPersonaId(undefined), false);
  assert.equal(isPersonaId({ id: "farmer" }), false);
  assert.equal(personaById("builder")?.workspaceKey, "construction");
  assert.equal(personaById("nope"), null);
  assert.equal(personaById(null), null);
});

test("destinations: a workspace page, or Public Explorer for 'just curious'", () => {
  assert.equal(personaDestination(personaById("farmer")!), "/workspaces/agriculture");
  assert.equal(personaDestination(personaById("curious")!), "/explore");
});

test("each persona's insight is one of the interpretations that really exist", () => {
  const real = new Set(["temperature", "soil-moisture", "wind", "construction-risk"]);
  for (const p of PERSONAS) assert.ok(real.has(p.insight), p.id);
  assert.equal(personaById("farmer")?.insight, "soil-moisture");
  assert.equal(personaById("energy")?.insight, "wind");
  assert.equal(personaById("builder")?.insight, "construction-risk");
});

test("parseHomePlace accepts a complete, in-range place and trims text", () => {
  const place = parseHomePlace({
    name: "  Lagos ",
    region: "Lagos",
    country: "Nigeria",
    latitude: 6.5244,
    longitude: 3.3792,
  });
  assert.deepEqual(place, {
    name: "Lagos",
    region: "Lagos",
    country: "Nigeria",
    latitude: 6.5244,
    longitude: 3.3792,
  });
  assert.equal(parseHomePlace({ name: "X", latitude: 0, longitude: 0 })?.region, null);
});

test("parseHomePlace rejects anything incomplete or out of range", () => {
  const ok = { name: "X", latitude: 1, longitude: 2 };
  assert.equal(parseHomePlace(null), null);
  assert.equal(parseHomePlace("Lagos"), null);
  assert.equal(parseHomePlace({ ...ok, name: "   " }), null);
  assert.equal(parseHomePlace({ ...ok, name: 42 }), null);
  assert.equal(parseHomePlace({ ...ok, latitude: 91 }), null);
  assert.equal(parseHomePlace({ ...ok, longitude: -181 }), null);
  assert.equal(parseHomePlace({ ...ok, latitude: "1" }), null);
  assert.equal(parseHomePlace({ ...ok, latitude: Number.NaN }), null);
  assert.equal(parseHomePlace({ ...ok, longitude: Number.POSITIVE_INFINITY }), null);
  assert.equal(parseHomePlace({ name: "X", longitude: 2 }), null);
});

test("parseHomePlace bounds text length", () => {
  const place = parseHomePlace({ name: "a".repeat(500), latitude: 0, longitude: 0 });
  assert.equal(place?.name.length, 120);
});

test("homePlaceLabel joins parts and skips a repeated one", () => {
  assert.equal(
    homePlaceLabel({
      name: "Lagos",
      region: "Lagos",
      country: "Nigeria",
      latitude: 0,
      longitude: 0,
    }),
    "Lagos, Nigeria",
  );
  assert.equal(
    homePlaceLabel({
      name: "Paris",
      region: "Texas",
      country: "United States",
      latitude: 0,
      longitude: 0,
    }),
    "Paris, Texas, United States",
  );
  assert.equal(
    homePlaceLabel({ name: "Oslo", region: null, country: null, latitude: 0, longitude: 0 }),
    "Oslo",
  );
});
