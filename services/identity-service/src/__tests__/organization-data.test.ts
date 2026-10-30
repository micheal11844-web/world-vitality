import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseOrganizationData } from "../organization-data.js";

/**
 * `SupabaseOrganizationData` talks to the database with the service-role
 * key, which bypasses row-level security — so the organisation filter in
 * that class IS the tenant boundary. These tests record every query it
 * makes and check that each one is confined to the organisation, and that
 * a write is never attempted on something that is not the organisation's.
 *
 * (The same behaviour against a real Postgres engine is covered separately
 * by running the migrations; this file is about the query shapes.)
 */

const ORG = "org-A";

type Call = { table: string; ops: Array<[string, unknown[]]> };
type Reply = { data?: unknown; error?: { message: string } | null; count?: number | null };

function makeClient(reply: (call: Call) => Reply = () => ({ data: [] })) {
  const calls: Call[] = [];
  const client = {
    from(table: string) {
      const call: Call = { table, ops: [] };
      calls.push(call);
      const builder: Record<string, unknown> = {};
      for (const method of [
        "select",
        "insert",
        "update",
        "delete",
        "upsert",
        "eq",
        "in",
        "contains",
        "order",
        "single",
        "maybeSingle",
      ]) {
        builder[method] = (...args: unknown[]) => {
          call.ops.push([method, args]);
          return builder;
        };
      }
      builder.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
        const r = reply(call);
        try {
          return Promise.resolve({
            data: r.data ?? null,
            error: r.error ?? null,
            count: r.count ?? null,
          }).then(resolve, reject);
        } catch (e) {
          return Promise.reject(e).then(resolve, reject);
        }
      };
      return builder;
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}

const has = (call: Call, method: string, ...args: unknown[]) =>
  call.ops.some(([m, a]) => m === method && JSON.stringify(a) === JSON.stringify(args));
const first = (call: Call, method: string) => call.ops.find(([m]) => m === method)?.[1];
const onTable = (calls: Call[], table: string) => calls.filter((c) => c.table === table);

const FIELD_ROW = {
  id: "f1",
  workspace_id: "agriculture",
  name: "N",
  latitude: 1,
  longitude: 2,
  created_by: "u1",
  created_at: "t",
};
const PROPERTY_ROW = {
  id: "p1",
  workspace_id: "insurance",
  policy_number: "POL",
  property_address: "addr",
  latitude: 1,
  longitude: 2,
  created_by: "u1",
  created_at: "t",
};
const LOCATION_ROW = {
  id: "l1",
  workspace_id: "government-ngos",
  label: "L",
  latitude: 1,
  longitude: 2,
  created_by: "u1",
  created_at: "t",
};

test("every list is confined to the organisation as well as the workspace", async () => {
  const { client, calls } = makeClient();
  const data = new SupabaseOrganizationData(client, ORG);
  await data.listFields("agriculture");
  await data.listProperties("insurance");
  await data.listLocations("government-ngos");
  assert.equal(calls.length, 3);
  for (const call of calls) {
    assert.ok(
      has(call, "eq", "organization_id", ORG),
      `${call.table} list must filter by organisation`,
    );
  }
});

test("every create stamps the organisation on the row", async () => {
  const { client, calls } = makeClient((c) => ({
    data:
      c.table === "fields"
        ? FIELD_ROW
        : c.table === "insurance_properties"
          ? PROPERTY_ROW
          : LOCATION_ROW,
  }));
  const data = new SupabaseOrganizationData(client, ORG);
  await data.createField({
    workspaceId: "agriculture",
    name: "N",
    latitude: 1,
    longitude: 2,
    createdBy: "u1",
  });
  await data.createProperty({
    workspaceId: "insurance",
    policyNumber: "POL",
    propertyAddress: "addr",
    latitude: 1,
    longitude: 2,
    createdBy: "u1",
  });
  await data.createLocation({
    workspaceId: "government-ngos",
    label: "L",
    latitude: 1,
    longitude: 2,
    createdBy: "u1",
  });
  for (const call of calls) {
    const payload = first(call, "insert")?.[0] as Record<string, unknown>;
    assert.equal(payload.organization_id, ORG, `${call.table} insert must carry the organisation`);
  }
});

test("updates carry the organisation on the write itself, so another organisation's id changes nothing", async () => {
  const { client, calls } = makeClient((c) => ({
    data:
      c.table === "fields"
        ? FIELD_ROW
        : c.table === "insurance_properties"
          ? PROPERTY_ROW
          : LOCATION_ROW,
  }));
  const data = new SupabaseOrganizationData(client, ORG);
  await data.updateField("f1", { name: "x" });
  await data.updateProperty("p1", { policyNumber: "y" });
  await data.updateLocation("l1", { label: "z" });
  for (const call of calls) {
    assert.ok(has(call, "update") || call.ops.some(([m]) => m === "update"));
    assert.ok(
      has(call, "eq", "organization_id", ORG),
      `${call.table} update must filter by organisation`,
    );
  }
});

test("an update that matches nothing in this organisation fails instead of pretending", async () => {
  const { client } = makeClient(() => ({ data: null, error: { message: "no rows" } }));
  const data = new SupabaseOrganizationData(client, ORG);
  await assert.rejects(
    () => data.updateField("someone-elses", { name: "x" }),
    /Failed to update field/,
  );
  await assert.rejects(
    () => data.updateProperty("someone-elses", {}),
    /Failed to update insured property/,
  );
  await assert.rejects(
    () => data.updateLocation("someone-elses", {}),
    /Failed to update monitored location/,
  );
});

test("a delete carries the organisation, cleans only this organisation's member scopes, and fails if nothing was deleted", async () => {
  const { client, calls } = makeClient((c) => {
    if (c.table === "workspace_members" && c.ops.some(([m]) => m === "contains")) {
      return {
        data: [{ workspace_id: "agriculture", user_id: "u2", scoped_resource_ids: ["f1", "f9"] }],
      };
    }
    return { data: [{ id: "f1" }] };
  });
  const data = new SupabaseOrganizationData(client, ORG);
  await data.deleteField("f1");

  for (const call of onTable(calls, "workspace_members")) {
    assert.ok(
      has(call, "eq", "organization_id", ORG),
      "scope cleanup must stay inside the organisation",
    );
  }
  const update = onTable(calls, "workspace_members").find((c) =>
    c.ops.some(([m]) => m === "update"),
  );
  assert.deepEqual(first(update!, "update"), [{ scoped_resource_ids: ["f9"] }]);
  const del = onTable(calls, "fields").find((c) => c.ops.some(([m]) => m === "delete"))!;
  assert.ok(has(del, "eq", "organization_id", ORG));

  // Nothing matched (an id from another organisation): not silent success.
  const none = makeClient(() => ({ data: [] }));
  const other = new SupabaseOrganizationData(none.client, ORG);
  await assert.rejects(() => other.deleteField("theirs"), /not found/);
  await assert.rejects(() => other.deleteProperty("theirs"), /not found/);
  await assert.rejects(() => other.deleteLocation("theirs"), /not found/);
});

test("the saved-item count is one query per table, each confined to the organisation", async () => {
  const { client, calls } = makeClient(() => ({ data: null, count: 2 }));
  const total = await new SupabaseOrganizationData(client, ORG).countSavedItems();
  assert.equal(total, 6);
  assert.deepEqual(calls.map((c) => c.table).sort(), [
    "fields",
    "government_ngos_locations",
    "insurance_properties",
  ]);
  for (const call of calls) assert.ok(has(call, "eq", "organization_id", ORG));
});

test("reading comments on another organisation's field returns nothing and never touches the comments table", async () => {
  const { client, calls } = makeClient((c) =>
    c.table === "fields" ? { data: null } : { data: [] },
  );
  const out = await new SupabaseOrganizationData(client, ORG).listFieldComments("theirs");
  assert.deepEqual(out, []);
  assert.equal(onTable(calls, "field_comments").length, 0);
  const check = onTable(calls, "fields")[0]!;
  assert.ok(has(check, "eq", "organization_id", ORG));
});

test("commenting on another organisation's field is refused before any insert", async () => {
  const { client, calls } = makeClient((c) =>
    c.table === "fields" ? { data: null } : { data: [] },
  );
  await assert.rejects(
    () =>
      new SupabaseOrganizationData(client, ORG).createFieldComment({
        fieldId: "theirs",
        userId: "u",
        body: "hi",
      }),
    /field not found/,
  );
  assert.equal(onTable(calls, "field_comments").length, 0);
});

test("editing or deleting a comment needs the author AND a field in this organisation", async () => {
  // Author matches but the field belongs to someone else.
  const { client, calls } = makeClient((c) => {
    if (c.table === "field_comments") return { data: { field_id: "theirs" } };
    return { data: null }; // fields lookup: not in this organisation
  });
  const data = new SupabaseOrganizationData(client, ORG);
  await assert.rejects(() => data.updateFieldComment("c1", "u", "new"), /not the author/);
  await assert.rejects(() => data.deleteFieldComment("c1", "u"), /not the author/);
  // Only the read-only lookup of the comment ran; no update or delete was attempted.
  for (const call of onTable(calls, "field_comments")) {
    assert.ok(!call.ops.some(([m]) => m === "update" || m === "delete"));
  }

  // Comment lookup finds nothing for this author at all.
  const missing = makeClient(() => ({ data: null }));
  await assert.rejects(
    () =>
      new SupabaseOrganizationData(missing.client, ORG).updateFieldComment(
        "c1",
        "someone-else",
        "x",
      ),
    /not the author/,
  );
  const lookup = onTable(missing.calls, "field_comments")[0]!;
  assert.ok(has(lookup, "eq", "user_id", "someone-else"));
});

test("the member list always includes the owner exactly once, flagged, and filters by organisation", async () => {
  const { client, calls } = makeClient((c) => {
    if (c.table === "organizations") return { data: { owner_id: "u-owner" } };
    if (c.table === "workspace_members") {
      return {
        data: [
          { user_id: "u-owner", role: "viewer_external", scoped_resource_ids: null }, // stray row
          { user_id: "u2", role: "operational_user", scoped_resource_ids: ["f1"] },
        ],
      };
    }
    return {
      data: [
        { user_id: "u-owner", email: "owner@x", display_name: "Owner" },
        { user_id: "u2", email: "two@x", display_name: null },
      ],
    };
  });
  const members = await new SupabaseOrganizationData(client, ORG).listWorkspaceMembers(
    "agriculture",
  );
  assert.deepEqual(
    members.map((m) => [m.userId, m.role, m.isOrganizationOwner ?? false]),
    [
      ["u-owner", "admin_owner", true],
      ["u2", "operational_user", false],
    ],
  );
  assert.deepEqual(members[1]!.scopedResourceIds, ["f1"]);
  const rowsCall = onTable(calls, "workspace_members")[0]!;
  assert.ok(has(rowsCall, "eq", "organization_id", ORG));
  assert.ok(has(rowsCall, "eq", "workspace_id", "agriculture"));
});

test("adding a member writes the organisation, so a person from another organisation cannot be pulled in", async () => {
  const { client, calls } = makeClient();
  await new SupabaseOrganizationData(client, ORG).addMember({
    workspaceId: "agriculture",
    userId: "u2",
    role: "operational_user",
    scopedResourceIds: ["f1"],
  });
  const payload = first(calls[0]!, "upsert")?.[0] as Record<string, unknown>;
  assert.equal(payload.organization_id, ORG);
  assert.equal(payload.user_id, "u2");
  assert.deepEqual(payload.scoped_resource_ids, ["f1"]);
});

function removeSetup(remainingRoles: number) {
  return makeClient((c) => {
    if (c.table === "organizations") return { data: { owner_id: "u-owner" } };
    if (c.table === "workspace_members" && c.ops.some(([m]) => m === "delete"))
      return { data: null };
    if (
      c.table === "workspace_members" &&
      c.ops.some(([, a]) => JSON.stringify(a).includes("count"))
    ) {
      return { data: null, count: remainingRoles };
    }
    if (c.table === "workspace_members") {
      return {
        data: [
          { user_id: "u2", role: "operational_user", scoped_resource_ids: null },
          { user_id: "u3", role: "admin_owner", scoped_resource_ids: null },
        ],
      };
    }
    if (c.table === "profiles") return { data: [] };
    return { data: null };
  });
}

test("the organisation's owner can never be removed", async () => {
  const { client, calls } = removeSetup(0);
  await assert.rejects(
    () => new SupabaseOrganizationData(client, ORG).removeMember("agriculture", "u-owner"),
    /owner can't be removed/,
  );
  assert.ok(!calls.some((c) => c.ops.some(([m]) => m === "delete")));
});

test("removing someone's last role also frees their seat; removing one of several does not", async () => {
  const last = removeSetup(0);
  await new SupabaseOrganizationData(last.client, ORG).removeMember("agriculture", "u2");
  const roleDelete = onTable(last.calls, "workspace_members").find((c) =>
    c.ops.some(([m]) => m === "delete"),
  )!;
  assert.ok(has(roleDelete, "eq", "organization_id", ORG));
  const seat = onTable(last.calls, "organization_members").find((c) =>
    c.ops.some(([m]) => m === "delete"),
  )!;
  assert.ok(seat, "the seat should be freed");
  assert.ok(has(seat, "eq", "organization_id", ORG));
  assert.ok(has(seat, "eq", "user_id", "u2"));
  assert.ok(has(seat, "eq", "role", "member"), "an owner row can never be deleted this way");

  const several = removeSetup(2);
  await new SupabaseOrganizationData(several.client, ORG).removeMember("agriculture", "u2");
  assert.equal(onTable(several.calls, "organization_members").length, 0);
});

test("counting members is confined to the organisation", async () => {
  const { client, calls } = makeClient(() => ({ data: null, count: 4 }));
  assert.equal(await new SupabaseOrganizationData(client, ORG).countMembers(), 4);
  assert.ok(has(calls[0]!, "eq", "organization_id", ORG));
});

test("renaming writes the owner condition into the update itself and trims the name", async () => {
  const { client, calls } = makeClient(() => ({ data: [{ id: ORG }] }));
  const result = await new SupabaseOrganizationData(client, ORG).renameOrganization(
    "owner-1",
    "  Acme   Farms ",
  );
  assert.equal(result, "renamed");
  assert.equal(calls.length, 1);
  const call = calls[0]!;
  assert.equal(call.table, "organizations");
  assert.deepEqual(first(call, "update"), [{ name: "Acme Farms" }]);
  assert.ok(has(call, "eq", "id", ORG));
  assert.ok(has(call, "eq", "owner_id", "owner-1"), "the owner condition is on the write");
});

test("renaming by someone who is not the owner changes nothing and says so", async () => {
  const { client } = makeClient(() => ({ data: [] }));
  assert.equal(
    await new SupabaseOrganizationData(client, ORG).renameOrganization("not-owner", "Acme"),
    "not_owner",
  );
});

test("an invalid name never reaches the database", async () => {
  const { client, calls } = makeClient();
  const data = new SupabaseOrganizationData(client, ORG);
  assert.equal(await data.renameOrganization("owner-1", "   "), "invalid_name");
  assert.equal(await data.renameOrganization("owner-1", "x".repeat(101)), "invalid_name");
  assert.equal(calls.length, 0);
});

test("a rename database error is thrown, not reported as success", async () => {
  const { client } = makeClient(() => ({ error: { message: "boom" } }));
  await assert.rejects(
    () => new SupabaseOrganizationData(client, ORG).renameOrganization("owner-1", "Acme"),
    /Failed to rename organisation/,
  );
});

test("listing people is confined to the organisation, owner first, owner with no role rows", async () => {
  const { client, calls } = makeClient((call) => {
    if (call.table === "organization_members") {
      return {
        data: [
          { user_id: "m1", role: "member", joined_at: "2026-10-02" },
          { user_id: "o1", role: "owner", joined_at: "2026-10-01" },
        ],
      };
    }
    if (call.table === "profiles") {
      return {
        data: [
          { user_id: "o1", email: "owner@example.com", display_name: "Olu" },
          { user_id: "m1", email: "member@example.com", display_name: null },
        ],
      };
    }
    return {
      data: [
        { user_id: "m1", workspace_id: "weather", role: "operational_user" },
        { user_id: "m1", workspace_id: "agriculture", role: "operational_user" },
        // a stray row for the owner must not be listed against them
        { user_id: "o1", workspace_id: "agriculture", role: "admin_owner" },
      ],
    };
  });
  const people = await new SupabaseOrganizationData(client, ORG).listPeople();
  assert.deepEqual(
    people.map((p) => [p.userId, p.role, p.email, p.workspaces.map((w) => w.workspaceId)]),
    [
      ["o1", "owner", "owner@example.com", []],
      ["m1", "member", "member@example.com", ["agriculture", "weather"]],
    ],
  );
  for (const table of ["organization_members", "workspace_members"]) {
    const call = onTable(calls, table)[0]!;
    assert.ok(has(call, "eq", "organization_id", ORG), `${table} is filtered by organisation`);
  }
  const profileCall = onTable(calls, "profiles")[0]!;
  assert.deepEqual(first(profileCall, "in"), ["user_id", ["m1", "o1"]]);
});

test("listing people for an organisation with nobody in it asks for nothing else", async () => {
  const { client, calls } = makeClient(() => ({ data: [] }));
  assert.deepEqual(await new SupabaseOrganizationData(client, ORG).listPeople(), []);
  assert.equal(calls.length, 1);
});
