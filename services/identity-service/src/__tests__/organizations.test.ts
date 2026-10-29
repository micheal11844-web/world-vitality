import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NoOrganizationError,
  OrganizationHasMembersError,
  emptyOrganizationData,
  resolveWorkspaceMembership,
  type OrganizationMembership,
} from "../organizations.js";
import type { WorkspaceMembership } from "../account.js";

const ORG = "org-1";
const owner: OrganizationMembership = {
  organizationId: ORG,
  name: "Acme",
  ownerId: "u-owner",
  role: "owner",
};
const member: OrganizationMembership = { ...owner, role: "member" };

const rows: WorkspaceMembership[] = [
  { workspaceId: "agriculture", role: "operational_user", organizationId: ORG },
  {
    workspaceId: "insurance",
    role: "scoped_field_user",
    scopedResourceIds: ["p1"],
    organizationId: ORG,
  },
  { workspaceId: "weather", role: "viewer_external", organizationId: "some-other-org" },
];

test("the owner is admin_owner everywhere, with no role row needed", () => {
  const m = resolveWorkspaceMembership(owner, [], "agriculture");
  assert.deepEqual(m, { workspaceId: "agriculture", role: "admin_owner", organizationId: ORG });
});

test("nothing can lower the owner: a stray lower role row is ignored", () => {
  const lowered: WorkspaceMembership[] = [
    { workspaceId: "agriculture", role: "viewer_external", organizationId: ORG },
  ];
  const m = resolveWorkspaceMembership(owner, lowered, "agriculture");
  assert.equal(m.role, "admin_owner");
  assert.equal(m.scopedResourceIds, undefined);
});

test("a member gets exactly the role and scope they were invited with", () => {
  const ag = resolveWorkspaceMembership(member, rows, "agriculture");
  assert.deepEqual(ag, {
    workspaceId: "agriculture",
    role: "operational_user",
    organizationId: ORG,
  });
  const ins = resolveWorkspaceMembership(member, rows, "insurance");
  assert.equal(ins.role, "scoped_field_user");
  assert.deepEqual(ins.scopedResourceIds, ["p1"]);
  assert.equal(ins.organizationId, ORG);
});

test("a member with no role in a workspace sees none of the organisation's items there", () => {
  const m = resolveWorkspaceMembership(member, rows, "government-ngos");
  assert.equal(m.role, "viewer_external");
  assert.equal(m.organizationId, undefined);
});

test("a role row that names a different organisation is ignored", () => {
  const m = resolveWorkspaceMembership(member, rows, "weather");
  assert.equal(m.role, "viewer_external");
  assert.equal(m.organizationId, undefined);
});

test("someone with no organisation at all gets viewer_external and no organisation", () => {
  const m = resolveWorkspaceMembership(null, rows, "agriculture");
  assert.deepEqual(m, { workspaceId: "agriculture", role: "viewer_external" });
});

test("the empty handle reads as empty and refuses every write", async () => {
  const data = emptyOrganizationData();
  assert.equal(data.organizationId, null);
  assert.deepEqual(await data.listFields("agriculture"), []);
  assert.deepEqual(await data.listProperties("insurance"), []);
  assert.deepEqual(await data.listLocations("government-ngos"), []);
  assert.deepEqual(await data.listFieldComments("f1"), []);
  assert.deepEqual(await data.listWorkspaceMembers("agriculture"), []);
  assert.equal(await data.countSavedItems(), 0);
  assert.equal(await data.countMembers(), 0);

  await assert.rejects(
    () =>
      data.createField({
        workspaceId: "agriculture",
        name: "x",
        latitude: 0,
        longitude: 0,
        createdBy: "u",
      }),
    NoOrganizationError,
  );
  await assert.rejects(() => data.updateField("f1", { name: "x" }), NoOrganizationError);
  await assert.rejects(() => data.deleteField("f1"), NoOrganizationError);
  await assert.rejects(() => data.deleteProperty("p1"), NoOrganizationError);
  await assert.rejects(() => data.deleteLocation("l1"), NoOrganizationError);
  await assert.rejects(
    () => data.createFieldComment({ fieldId: "f1", userId: "u", body: "hi" }),
    NoOrganizationError,
  );
  await assert.rejects(
    () => data.addMember({ workspaceId: "agriculture", userId: "u", role: "viewer_external" }),
    NoOrganizationError,
  );
  await assert.rejects(() => data.removeMember("agriculture", "u"), NoOrganizationError);
});

test("the owner-still-has-members error says how many, with correct grammar", () => {
  assert.equal(
    new OrganizationHasMembersError(1).message,
    "Your organisation still has 1 other member.",
  );
  assert.equal(
    new OrganizationHasMembersError(3).message,
    "Your organisation still has 3 other members.",
  );
  assert.equal(new OrganizationHasMembersError(2).otherMembers, 2);
});
