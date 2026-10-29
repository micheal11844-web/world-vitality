import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  STAFF_PERMISSIONS,
  STAFF_ROLES,
  SupabaseStaffService,
  escapeLikeExact,
  isStaffRole,
  parseSupportQuery,
  staffCan,
  staffPermissionsFor,
  type StaffActor,
  type StaffPermission,
} from "../staff.js";

const ACTOR: StaffActor = {
  userId: "11111111-1111-4111-8111-111111111111",
  email: "sam@team.test",
};
const TARGET = "22222222-2222-4222-8222-222222222222";

/* ---------- permissions ---------- */

test("a person with no staff role can do nothing", () => {
  for (const permission of [
    "overview:view",
    "users:lookup",
    "sources:view",
    "audit:view",
  ] as const) {
    assert.equal(staffCan(null, permission), false);
    assert.equal(staffCan(undefined, permission), false);
  }
  assert.deepEqual(staffPermissionsFor(null), []);
});

test("an unknown role string is denied, not treated as the nearest known role", () => {
  assert.equal(isStaffRole("superuser"), false);
  assert.equal(isStaffRole("Support"), false);
  // @ts-expect-error — proving a bad value from the database grants nothing
  assert.equal(staffCan("superuser", "overview:view"), false);
});

test("support can look users up but cannot see data sources or the audit log", () => {
  assert.equal(staffCan("support", "users:lookup"), true);
  assert.equal(staffCan("support", "overview:view"), true);
  assert.equal(staffCan("support", "sources:view"), false);
  assert.equal(staffCan("support", "audit:view"), false);
});

test("operations can see data sources but cannot look anyone up", () => {
  assert.equal(staffCan("operations", "sources:view"), true);
  assert.equal(staffCan("operations", "users:lookup"), false);
  assert.equal(staffCan("operations", "audit:view"), false);
});

test("only a platform admin can open the staff audit log", () => {
  const withAudit = STAFF_ROLES.filter((r) => staffCan(r, "audit:view"));
  assert.deepEqual(withAudit, ["platform_admin"]);
});

test("every role can see the overview, and platform admin holds every permission", () => {
  for (const role of STAFF_ROLES) assert.equal(staffCan(role, "overview:view"), true);
  const all = new Set<StaffPermission>(Object.values(STAFF_PERMISSIONS).flat());
  for (const permission of all) assert.equal(staffCan("platform_admin", permission), true);
});

/* ---------- what was typed ---------- */

test("an email address or a user id is accepted; surrounding spaces are ignored", () => {
  assert.deepEqual(parseSupportQuery("  Ada@Example.com "), {
    kind: "email",
    email: "Ada@Example.com",
  });
  assert.deepEqual(parseSupportQuery(TARGET.toUpperCase()), { kind: "userId", userId: TARGET });
});

test("an email with an underscore or plus is a normal email", () => {
  assert.equal(parseSupportQuery("first_last+tag@example.co.uk").kind, "email");
});

test("partial or wildcard searches are refused, so the lookup cannot browse users", () => {
  for (const text of [
    "",
    "   ",
    "ada",
    "ada@",
    "@example.com",
    "%@example.com",
    "a%@example.com",
    "ada*@example.com",
    "ada@exam%ple.com",
    "a,b@example.com",
  ]) {
    assert.equal(parseSupportQuery(text).kind, "invalid", text);
  }
});

test("an over-long email is refused", () => {
  assert.equal(parseSupportQuery(`${"a".repeat(250)}@example.com`).kind, "invalid");
});

test("escaping makes LIKE wildcards match themselves", () => {
  assert.equal(escapeLikeExact("a_b%c\\d"), "a\\_b\\%c\\\\d");
  assert.equal(escapeLikeExact("plain@example.com"), "plain@example.com");
});

/* ---------- the service, against a fake client ---------- */

interface Call {
  table: string;
  op: string;
  args: unknown[];
}

type Result = { data?: unknown; error?: { message: string } | null; count?: number | null };

/**
 * A just-enough chainable fake: every method records itself in `calls`,
 * and awaiting the chain (or `.maybeSingle()`) resolves to whatever
 * `results(table, calls-so-far)` returns.
 */
function fakeClient(
  results: (table: string, calls: Call[]) => Result,
  opts: { authUser?: Record<string, unknown> | null; authError?: string } = {},
) {
  const calls: Call[] = [];
  function chain(table: string): Record<string, unknown> {
    const mine: Call[] = [];
    const resolve = () => {
      const r = results(table, mine);
      return { data: r.data ?? null, error: r.error ?? null, count: r.count ?? null };
    };
    const c: Record<string, unknown> = {
      then: (ok: (v: unknown) => unknown, bad?: (e: unknown) => unknown) =>
        Promise.resolve(resolve()).then(ok, bad),
      maybeSingle: async () => resolve(),
    };
    for (const op of [
      "select",
      "insert",
      "eq",
      "ilike",
      "is",
      "not",
      "gte",
      "lt",
      "order",
      "limit",
    ]) {
      c[op] = (...args: unknown[]) => {
        const call = { table, op, args };
        mine.push(call);
        calls.push(call);
        return c;
      };
    }
    return c;
  }
  const client = {
    from: (table: string) => chain(table),
    auth: {
      admin: {
        getUserById: async () =>
          opts.authError
            ? { data: { user: null }, error: { message: opts.authError } }
            : { data: { user: opts.authUser ?? null }, error: null },
      },
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

const tableCalls = (calls: Call[], table: string, op: string) =>
  calls.filter((c) => c.table === table && c.op === op);

test("getStaffMember returns the role for an active staff row", async () => {
  const { client, calls } = fakeClient(() => ({
    data: { user_id: ACTOR.userId, role: "support", granted_at: "2026-10-01T00:00:00Z" },
  }));
  const member = await new SupabaseStaffService(client).getStaffMember(ACTOR.userId);
  assert.deepEqual(member, {
    userId: ACTOR.userId,
    role: "support",
    grantedAt: "2026-10-01T00:00:00Z",
  });
  // Only rows that have not been revoked count.
  assert.deepEqual(tableCalls(calls, "platform_staff", "is")[0]?.args, ["revoked_at", null]);
});

test("getStaffMember returns null for no row, and for a row with a role it does not know", async () => {
  const none = fakeClient(() => ({ data: null }));
  assert.equal(await new SupabaseStaffService(none.client).getStaffMember("x"), null);
  const odd = fakeClient(() => ({ data: { user_id: "x", role: "root", granted_at: "t" } }));
  assert.equal(await new SupabaseStaffService(odd.client).getStaffMember("x"), null);
});

test("getStaffMember throws on a database error, so an outage never reads as 'not staff, allow'", async () => {
  const { client } = fakeClient(() => ({ error: { message: "boom" } }));
  await assert.rejects(() => new SupabaseStaffService(client).getStaffMember("x"), /boom/);
});

test("the overview counts accounts, recent sign-ups, onboarding, memberships and staff", async () => {
  const counts: Record<string, number> = {
    profiles: 120,
    user_preferences: 70,
    workspace_members: 200,
    platform_staff: 3,
  };
  const { client, calls } = fakeClient((table, mine) => {
    // The two sign-up windows are the profiles queries with a date filter.
    const gte = mine.find((c) => c.op === "gte");
    if (table === "profiles" && gte) {
      const days = Math.round(
        (Date.parse("2026-10-22T00:00:00Z") - Date.parse(String(gte.args[1]))) / 86_400_000,
      );
      return { count: days === 7 ? 9 : 31 };
    }
    return { count: counts[table] };
  });
  const overview = await new SupabaseStaffService(client).getPlatformOverview(
    new Date("2026-10-22T00:00:00Z"),
  );
  assert.deepEqual(overview, {
    accounts: 120,
    newLast7Days: 9,
    newLast30Days: 31,
    onboarded: 70,
    workspaceMemberships: 200,
    activeStaff: 3,
    asOf: "2026-10-22T00:00:00.000Z",
  });
  // Counting, never reading rows.
  for (const c of tableCalls(calls, "profiles", "select")) {
    assert.deepEqual(c.args[1], { count: "exact", head: true });
  }
});

test("an invalid search is refused without touching the database or the log", async () => {
  const { client, calls } = fakeClient(() => ({}));
  const result = await new SupabaseStaffService(client).lookupUserForSupport(ACTOR, "ada");
  assert.equal(result.kind, "invalid");
  assert.equal(calls.length, 0);
});

test("a lookup is written to the audit log before any of the person's details are read", async () => {
  const order: string[] = [];
  const { client, calls } = fakeClient(
    (table, mine) => {
      const op = mine.map((c) => c.op);
      if (table === "profiles" && op.includes("ilike")) {
        order.push("resolve-id");
        return { data: { user_id: TARGET } };
      }
      if (table === "staff_audit_log") {
        order.push("audit");
        return {};
      }
      if (table === "profiles") {
        order.push("read-profile");
        return {
          data: {
            email: "ada@example.com",
            display_name: "Ada",
            created_at: "2026-09-01T00:00:00Z",
          },
        };
      }
      if (table === "workspace_members") {
        order.push("read-memberships");
        return {
          data: [{ workspace_id: "agriculture", role: "admin_owner", scoped_resource_ids: null }],
        };
      }
      if (table === "user_preferences") {
        order.push("read-prefs");
        return { data: { onboarded_at: "2026-09-02T00:00:00Z", language: "es" } };
      }
      if (table === "organization_members") {
        order.push("read-organisation");
        return { data: { role: "owner", organizations: { name: "Acme Farms" } } };
      }
      return {};
    },
    {
      authUser: {
        email_confirmed_at: "2026-09-01T00:01:00Z",
        last_sign_in_at: "2026-10-20T10:00:00Z",
      },
    },
  );

  const result = await new SupabaseStaffService(client).lookupUserForSupport(
    ACTOR,
    "Ada@Example.com",
  );

  assert.equal(result.kind, "found");
  assert.deepEqual(order.slice(0, 2), ["resolve-id", "audit"]);
  assert.ok(order.indexOf("audit") < order.indexOf("read-profile"));
  assert.ok(order.indexOf("audit") < order.indexOf("read-memberships"));
  assert.ok(order.indexOf("audit") < order.indexOf("read-prefs"));
  assert.ok(order.indexOf("audit") < order.indexOf("read-organisation"));

  if (result.kind !== "found") return;
  assert.deepEqual(result.user, {
    userId: TARGET,
    email: "ada@example.com",
    displayName: "Ada",
    createdAt: "2026-09-01T00:00:00Z",
    emailConfirmed: true,
    lastSignInAt: "2026-10-20T10:00:00Z",
    onboarded: true,
    language: "es",
    memberships: [{ workspaceId: "agriculture", role: "admin_owner", scoped: false }],
    organization: { name: "Acme Farms", role: "owner" },
  });

  // What was recorded: who, what, and which account — not what was typed.
  const inserted = tableCalls(calls, "staff_audit_log", "insert")[0]?.args[0] as Record<
    string,
    unknown
  >;
  assert.deepEqual(inserted, {
    staff_user_id: ACTOR.userId,
    staff_email: ACTOR.email,
    action: "user.lookup",
    target_user_id: TARGET,
    detail: "Looked up by email address",
  });
  assert.ok(!JSON.stringify(inserted).includes("Ada@Example.com"));
});

test("the email search can only ever match that exact address", async () => {
  const { client, calls } = fakeClient((table, mine) => {
    if (table === "profiles" && mine.some((c) => c.op === "ilike")) return { data: null };
    return {};
  });
  await new SupabaseStaffService(client).lookupUserForSupport(ACTOR, "first_last@example.com");
  assert.deepEqual(tableCalls(calls, "profiles", "ilike")[0]?.args, [
    "email",
    "first\\_last@example.com",
  ]);
});

test("a search with no match is logged as such and returns not_found, reading nothing else", async () => {
  const { client, calls } = fakeClient((table) => (table === "profiles" ? { data: null } : {}));
  const result = await new SupabaseStaffService(client).lookupUserForSupport(ACTOR, TARGET);
  assert.deepEqual(result, { kind: "not_found" });
  const inserted = tableCalls(calls, "staff_audit_log", "insert")[0]?.args[0] as Record<
    string,
    unknown
  >;
  assert.equal(inserted.target_user_id, null);
  assert.equal(inserted.detail, "No account matched");
  assert.equal(tableCalls(calls, "workspace_members", "select").length, 0);
  assert.equal(tableCalls(calls, "user_preferences", "select").length, 0);
});

test("if the audit entry cannot be written, nothing about the person is read or returned", async () => {
  const { client, calls } = fakeClient((table, mine) => {
    if (table === "profiles" && mine.some((c) => c.op === "eq"))
      return { data: { user_id: TARGET } };
    if (table === "staff_audit_log") return { error: { message: "log is down" } };
    return {};
  });
  await assert.rejects(
    () => new SupabaseStaffService(client).lookupUserForSupport(ACTOR, TARGET),
    /log is down/,
  );
  assert.equal(tableCalls(calls, "workspace_members", "select").length, 0);
  assert.equal(tableCalls(calls, "user_preferences", "select").length, 0);
  // The only profile query was the id lookup; the details were never fetched.
  assert.deepEqual(
    tableCalls(calls, "profiles", "select").map((c) => c.args[0]),
    ["user_id"],
  );
});

test("if the sign-in system cannot be reached, those fields are unknown but the lookup still works", async () => {
  const { client } = fakeClient(
    (table, mine) => {
      if (table === "profiles" && mine.some((c) => c.args[0] === "user_id" && c.op === "select")) {
        return { data: { user_id: TARGET } };
      }
      if (table === "profiles")
        return { data: { email: "a@b.co", display_name: null, created_at: "t" } };
      if (table === "workspace_members") return { data: [] };
      if (table === "user_preferences") return { data: null };
      return {};
    },
    { authError: "auth unreachable" },
  );
  const result = await new SupabaseStaffService(client).lookupUserForSupport(ACTOR, TARGET);
  assert.equal(result.kind, "found");
  if (result.kind !== "found") return;
  assert.equal(result.user.emailConfirmed, null);
  assert.equal(result.user.lastSignInAt, null);
  assert.equal(result.user.onboarded, false);
  assert.equal(result.user.language, null);
});

test("the support view carries no home place, persona or notification text", async () => {
  const { client } = fakeClient(
    (table, mine) => {
      if (table === "profiles" && mine.some((c) => c.args[0] === "user_id" && c.op === "select")) {
        return { data: { user_id: TARGET } };
      }
      if (table === "profiles")
        return { data: { email: "a@b.co", display_name: "A", created_at: "t" } };
      if (table === "workspace_members") return { data: [] };
      if (table === "user_preferences") {
        return {
          data: { onboarded_at: "t", language: "fr", persona: "farmer", home_name: "Ibadan" },
        };
      }
      return {};
    },
    { authUser: {} },
  );
  const result = await new SupabaseStaffService(client).lookupUserForSupport(ACTOR, TARGET);
  if (result.kind !== "found") return assert.fail("expected a match");
  assert.deepEqual(Object.keys(result.user).sort(), [
    "createdAt",
    "displayName",
    "email",
    "emailConfirmed",
    "language",
    "lastSignInAt",
    "memberships",
    "onboarded",
    "organization",
    "userId",
  ]);
  assert.ok(!JSON.stringify(result.user).includes("Ibadan"));
});

test("recordStaffAction stores the actor snapshot and throws if the write fails", async () => {
  const ok = fakeClient(() => ({}));
  await new SupabaseStaffService(ok.client).recordStaffAction({
    actor: ACTOR,
    action: "audit.view",
  });
  assert.deepEqual(tableCalls(ok.calls, "staff_audit_log", "insert")[0]?.args[0], {
    staff_user_id: ACTOR.userId,
    staff_email: ACTOR.email,
    action: "audit.view",
    target_user_id: null,
    detail: null,
  });
  const bad = fakeClient(() => ({ error: { message: "nope" } }));
  await assert.rejects(
    () =>
      new SupabaseStaffService(bad.client).recordStaffAction({
        actor: ACTOR,
        action: "audit.view",
      }),
    /nope/,
  );
});

test("the audit log is read newest first, capped, and can page to older entries", async () => {
  const row = {
    id: "e1",
    staff_user_id: ACTOR.userId,
    staff_email: ACTOR.email,
    action: "user.lookup",
    target_user_id: TARGET,
    detail: null,
    created_at: "2026-10-21T10:00:00Z",
  };
  const { client, calls } = fakeClient(() => ({ data: [row] }));
  const service = new SupabaseStaffService(client);

  const entries = await service.listStaffAuditLog({
    limit: 100_000,
    before: "2026-10-22T00:00:00Z",
  });
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0], {
    id: "e1",
    staffUserId: ACTOR.userId,
    staffEmail: ACTOR.email,
    action: "user.lookup",
    targetUserId: TARGET,
    detail: null,
    createdAt: "2026-10-21T10:00:00Z",
  });
  assert.deepEqual(tableCalls(calls, "staff_audit_log", "order")[0]?.args, [
    "created_at",
    { ascending: false },
  ]);
  assert.deepEqual(tableCalls(calls, "staff_audit_log", "limit")[0]?.args, [200]);
  assert.deepEqual(tableCalls(calls, "staff_audit_log", "lt")[0]?.args, [
    "created_at",
    "2026-10-22T00:00:00Z",
  ]);

  await service.listStaffAuditLog();
  assert.deepEqual(tableCalls(calls, "staff_audit_log", "limit").at(-1)?.args, [50]);
  await service.listStaffAuditLog({ limit: -5 });
  assert.deepEqual(tableCalls(calls, "staff_audit_log", "limit").at(-1)?.args, [1]);
});

const organisationFake = (organizationMembers: { data?: unknown; error?: { message: string } }) =>
  fakeClient((table, mine) => {
    if (table === "profiles" && mine.some((c) => c.args[0] === "user_id" && c.op === "select")) {
      return { data: { user_id: TARGET } };
    }
    if (table === "profiles") {
      return { data: { email: "a@b.c", display_name: null, created_at: "t" } };
    }
    if (table === "workspace_members") return { data: [] };
    if (table === "organization_members") return organizationMembers;
    return {};
  }).client;

test("the support view shows the organisation (member, or none), tolerating either embedded shape", async () => {
  const lookup = async (data: unknown) => {
    const result = await new SupabaseStaffService(organisationFake({ data })).lookupUserForSupport(
      ACTOR,
      TARGET,
    );
    if (result.kind !== "found") return assert.fail("expected a match");
    return result.user.organization;
  };
  assert.deepEqual(await lookup({ role: "member", organizations: [{ name: "Acme" }] }), {
    name: "Acme",
    role: "member",
  });
  assert.deepEqual(await lookup({ role: "owner", organizations: { name: "Acme" } }), {
    name: "Acme",
    role: "owner",
  });
  assert.equal(await lookup(null), null);
  assert.equal(await lookup({ role: "member", organizations: null }), null);
});

test("an error reading the organisation fails the lookup rather than showing a half picture", async () => {
  await assert.rejects(
    () =>
      new SupabaseStaffService(
        organisationFake({ error: { message: "no such table" } }),
      ).lookupUserForSupport(ACTOR, TARGET),
    /organisation/,
  );
});
