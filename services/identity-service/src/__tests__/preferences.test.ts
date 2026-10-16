import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAccountService } from "../account.js";

/** A just-enough chainable fake of the supabase-js calls preferences use. */
function fakeClient(opts: { row?: Record<string, unknown> | null; error?: string }) {
  const calls: { upsert?: Record<string, unknown>; onConflict?: string } = {};
  const result = {
    data: opts.row ?? null,
    error: opts.error ? { message: opts.error } : null,
  };
  const chain: Record<string, unknown> = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => result,
    single: async () => result,
    // Awaiting a bare upsert (no .select()) resolves to the same result.
    then: (resolve: (value: typeof result) => unknown) => resolve(result),
    upsert: (row: Record<string, unknown>, options: { onConflict: string }) => {
      calls.upsert = row;
      calls.onConflict = options.onConflict;
      return chain;
    },
  };
  const client = { from: () => chain } as unknown as SupabaseClient;
  return { client, calls };
}

test("getPreferences returns the all-null default when the user has no row", async () => {
  const { client } = fakeClient({ row: null });
  const prefs = await new SupabaseAccountService(client).getPreferences("u1");
  assert.deepEqual(prefs, {
    userId: "u1",
    persona: null,
    homePlace: null,
    onboardedAt: null,
    language: null,
  });
});

test("getPreferences maps a stored row, including the home place", async () => {
  const { client } = fakeClient({
    row: {
      persona: "farmer",
      home_name: "Ibadan",
      home_region: "Oyo",
      home_country: "Nigeria",
      home_latitude: 7.37,
      home_longitude: 3.94,
      onboarded_at: "2026-10-10T00:00:00Z",
    },
  });
  const prefs = await new SupabaseAccountService(client).getPreferences("u1");
  assert.equal(prefs.persona, "farmer");
  assert.deepEqual(prefs.homePlace, {
    name: "Ibadan",
    region: "Oyo",
    country: "Nigeria",
    latitude: 7.37,
    longitude: 3.94,
  });
  assert.equal(prefs.onboardedAt, "2026-10-10T00:00:00Z");
});

test("a skipped onboarding reads as onboarded with no persona or place", async () => {
  const { client } = fakeClient({
    row: {
      persona: null,
      home_name: null,
      home_region: null,
      home_country: null,
      home_latitude: null,
      home_longitude: null,
      onboarded_at: "2026-10-10T00:00:00Z",
    },
  });
  const prefs = await new SupabaseAccountService(client).getPreferences("u1");
  assert.equal(prefs.persona, null);
  assert.equal(prefs.homePlace, null);
  assert.notEqual(prefs.onboardedAt, null);
});

test("getPreferences throws on a real database error (callers decide to fail open)", async () => {
  const { client } = fakeClient({ error: "relation does not exist" });
  await assert.rejects(
    () => new SupabaseAccountService(client).getPreferences("u1"),
    /relation does not exist/,
  );
});

test("saveOnboarding upserts on user_id, stamps onboarded_at, and writes the whole place", async () => {
  const stored = {
    persona: "builder",
    home_name: "Lagos",
    home_region: null,
    home_country: "Nigeria",
    home_latitude: 6.5,
    home_longitude: 3.4,
    onboarded_at: "2026-10-11T10:00:00.000Z",
  };
  const { client, calls } = fakeClient({ row: stored });
  const now = new Date("2026-10-11T10:00:00Z");
  const prefs = await new SupabaseAccountService(client).saveOnboarding(
    "u1",
    {
      persona: "builder",
      homePlace: { name: "Lagos", region: null, country: "Nigeria", latitude: 6.5, longitude: 3.4 },
    },
    now,
  );
  assert.equal(calls.onConflict, "user_id");
  assert.equal(calls.upsert?.user_id, "u1");
  assert.equal(calls.upsert?.onboarded_at, "2026-10-11T10:00:00.000Z");
  assert.equal(calls.upsert?.home_latitude, 6.5);
  assert.equal(prefs.persona, "builder");
});

test("saveOnboarding with nothing (a skip) clears persona and place but still stamps onboarded_at", async () => {
  const { client, calls } = fakeClient({
    row: {
      persona: null,
      home_name: null,
      home_region: null,
      home_country: null,
      home_latitude: null,
      home_longitude: null,
      onboarded_at: "2026-10-11T10:00:00.000Z",
    },
  });
  await new SupabaseAccountService(client).saveOnboarding("u1", { persona: null, homePlace: null });
  assert.equal(calls.upsert?.persona, null);
  assert.equal(calls.upsert?.home_name, null);
  assert.equal(calls.upsert?.home_latitude, null);
  assert.ok(typeof calls.upsert?.onboarded_at === "string");
});

test("saveOnboarding surfaces a database failure instead of pretending it saved", async () => {
  const { client } = fakeClient({ error: "boom" });
  await assert.rejects(
    () =>
      new SupabaseAccountService(client).saveOnboarding("u1", { persona: null, homePlace: null }),
    /boom/,
  );
});

test("getPreferences returns the chosen language, and null when none is stored", async () => {
  const withLanguage = fakeClient({
    row: {
      persona: null,
      home_name: null,
      home_region: null,
      home_country: null,
      home_latitude: null,
      home_longitude: null,
      onboarded_at: null,
      language: "ar",
    },
  });
  assert.equal(
    (await new SupabaseAccountService(withLanguage.client).getPreferences("u1")).language,
    "ar",
  );
  // A row written before the column existed (or by a fake that omits it) reads as "never chosen".
  const without = fakeClient({
    row: {
      persona: null,
      home_name: null,
      home_region: null,
      home_country: null,
      home_latitude: null,
      home_longitude: null,
      onboarded_at: null,
    },
  });
  assert.equal(
    (await new SupabaseAccountService(without.client).getPreferences("u1")).language,
    null,
  );
});

test("saveLanguage upserts only the language: it never stamps onboarded_at or touches the place", async () => {
  const { client, calls } = fakeClient({ row: null });
  const now = new Date("2026-10-14T09:00:00Z");
  await new SupabaseAccountService(client).saveLanguage("u1", "es", now);
  assert.equal(calls.onConflict, "user_id");
  assert.deepEqual(calls.upsert, {
    user_id: "u1",
    language: "es",
    updated_at: "2026-10-14T09:00:00.000Z",
  });
});

test("saveLanguage(null) clears the choice, and a database failure is surfaced", async () => {
  const cleared = fakeClient({ row: null });
  await new SupabaseAccountService(cleared.client).saveLanguage("u1", null);
  assert.equal(cleared.calls.upsert?.language, null);
  const broken = fakeClient({ error: "boom" });
  await assert.rejects(
    () => new SupabaseAccountService(broken.client).saveLanguage("u1", "fr"),
    /boom/,
  );
});
