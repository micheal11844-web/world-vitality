import { test } from "node:test";
import assert from "node:assert/strict";
import { buildUserDataExport } from "../data-export.js";
import type { AccountService } from "../account.js";

const ME = "user-me";
const OTHER = "user-other";
const ORG = "org-1";

function fakeAccount(): AccountService {
  const fake = {
    getProfile: async () => ({
      userId: ME,
      email: "me@example.com",
      displayName: "Me",
      createdAt: "2026-01-01T00:00:00Z",
    }),
    getPreferences: async () => ({
      userId: ME,
      persona: "farmer",
      homePlace: {
        name: "Ibadan",
        region: "Oyo",
        country: "Nigeria",
        latitude: 7.37,
        longitude: 3.94,
      },
      onboardedAt: "2026-10-01T00:00:00Z",
      language: "es",
    }),
    getNotificationSettings: async () => ({
      officialMinTier: "alert",
      collaborationEnabled: false,
      alertsSyncedAt: null,
    }),
    listNotifications: async (_userId: string, options?: { includeInactive?: boolean }) => [
      {
        id: "n1",
        title: "Flash Flood Warning",
        dismissedAt: options?.includeInactive ? "x" : null,
      },
    ],
    getWorkspaceMemberships: async () => [
      { workspaceId: "agriculture", role: "operational_user" },
      { workspaceId: "insurance", role: "viewer_external" },
    ],
    getOrganizationMembership: async () => ({
      organizationId: ORG,
      name: "Acme Farms",
      ownerId: OTHER,
      role: "member",
    }),
    forOrganization: (organizationId: string) => {
      assert.equal(organizationId, ORG, "must read through the person's own organisation");
      return {
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
        listLocations: async () => [],
        listFieldComments: async (fieldId: string) =>
          fieldId === "f1"
            ? [{ id: "c1", fieldId, userId: OTHER, body: "not mine" }]
            : [
                { id: "c2", fieldId, userId: ME, body: "mine, on someone else's field" },
                { id: "c3", fieldId, userId: OTHER, body: "theirs" },
              ],
      };
    },
  };
  return fake as unknown as AccountService;
}

test("exports only what the user created or wrote, within their organisation", async () => {
  const out = await buildUserDataExport(fakeAccount(), ME, new Date("2026-10-10T00:00:00Z"));
  assert.equal(out.exportedAt, "2026-10-10T00:00:00.000Z");
  assert.equal(out.profile.email, "me@example.com");
  assert.equal(out.memberships.length, 2);
  assert.deepEqual(out.organization, { name: "Acme Farms", role: "member" });
  assert.equal(out.preferences.persona, "farmer");
  assert.equal(out.preferences.homePlace?.name, "Ibadan");
  // Settings and the whole inbox — including dismissed items — are exported.
  assert.equal(out.notificationSettings.officialMinTier, "alert");
  assert.deepEqual(
    out.notifications.map((n) => n.id),
    ["n1"],
  );
  assert.equal(out.notifications[0]?.dismissedAt, "x");
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
  (account as unknown as { forOrganization: () => unknown }).forOrganization = () => ({
    listFields: async () => {
      throw new Error("db down");
    },
    listProperties: async () => [],
    listLocations: async () => [],
    listFieldComments: async () => [],
  });
  await assert.rejects(() => buildUserDataExport(account, ME), /db down/);
});

test("someone with no organisation has nothing saved to export, and nothing is read", async () => {
  const account = fakeAccount();
  const fake = account as unknown as Record<string, unknown>;
  fake.getOrganizationMembership = async () => null;
  fake.forOrganization = () => {
    throw new Error("must not be called: there is no organisation to read from");
  };
  const out = await buildUserDataExport(account, ME);
  assert.equal(out.organization, null);
  assert.deepEqual(out.createdResources, {
    fields: [],
    insuredProperties: [],
    monitoredLocations: [],
  });
  assert.deepEqual(out.commentsWritten, []);
});
