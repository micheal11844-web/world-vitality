import { test } from "node:test";
import assert from "node:assert/strict";
import { buildUserDataExport } from "../data-export.js";
import type { AccountService } from "../account.js";

const ME = "user-me";
const OTHER = "user-other";

function fakeAccount(): AccountService {
  const fake = {
    getProfile: async () => ({
      userId: ME,
      email: "me@example.com",
      displayName: "Me",
      createdAt: "2026-01-01T00:00:00Z",
    }),
    getWorkspaceMemberships: async () => [
      { workspaceId: "agriculture", role: "operational_user" },
      { workspaceId: "insurance", role: "viewer_external" },
    ],
    listFields: async () => [
      {
        id: "f1",
        workspaceId: "agriculture",
        name: "Mine",
        latitude: 1,
        longitude: 2,
        createdBy: ME,
        createdAt: "t",
      },
      {
        id: "f2",
        workspaceId: "agriculture",
        name: "Theirs",
        latitude: 3,
        longitude: 4,
        createdBy: OTHER,
        createdAt: "t",
      },
    ],
    listProperties: async () => [
      { id: "p1", createdBy: OTHER },
      { id: "p2", createdBy: ME },
    ],
    listLocations: async () => {
      throw new Error("must not be called: user has no government-ngos membership");
    },
    listFieldComments: async (fieldId: string) =>
      fieldId === "f1"
        ? [{ id: "c1", fieldId, userId: OTHER, body: "not mine" }]
        : [
            { id: "c2", fieldId, userId: ME, body: "mine, on someone else's field" },
            { id: "c3", fieldId, userId: OTHER, body: "theirs" },
          ],
  };
  return fake as unknown as AccountService;
}

test("exports only what the user created or wrote, scoped to their memberships", async () => {
  const out = await buildUserDataExport(fakeAccount(), ME, new Date("2026-10-10T00:00:00Z"));
  assert.equal(out.exportedAt, "2026-10-10T00:00:00.000Z");
  assert.equal(out.profile.email, "me@example.com");
  assert.equal(out.memberships.length, 2);
  assert.deepEqual(
    out.createdResources.fields.map((f) => f.id),
    ["f1"],
  );
  assert.deepEqual(
    out.createdResources.insuredProperties.map((p) => p.id),
    ["p2"],
  );
  assert.deepEqual(out.createdResources.monitoredLocations, []);
  assert.deepEqual(
    out.commentsWritten.map((c) => c.id),
    ["c2"],
  );
});

test("states plainly what is not included", async () => {
  const out = await buildUserDataExport(fakeAccount(), ME);
  assert.ok(out.notIncluded.length >= 2);
  assert.ok(out.notIncluded.some((line) => /audit/i.test(line)));
});

test("a listing failure fails the export instead of silently producing a partial one", async () => {
  const account = fakeAccount();
  (account as unknown as { listFields: () => Promise<never> }).listFields = async () => {
    throw new Error("db down");
  };
  await assert.rejects(() => buildUserDataExport(account, ME), /db down/);
});
