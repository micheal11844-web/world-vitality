import { test } from "node:test";
import assert from "node:assert/strict";
import { can, permissionsFor, ROLE_PERMISSIONS, type Role } from "../roles.js";

const ALL_ROLES: Role[] = [
  "admin_owner",
  "operational_user",
  "scoped_field_user",
  "viewer_external",
];

test("admin_owner holds every defined permission", () => {
  const allPermissions = new Set(Object.values(ROLE_PERMISSIONS).flat());
  for (const permission of allPermissions) {
    assert.equal(can("admin_owner", permission), true, `admin_owner should hold ${permission}`);
  }
});

test("viewer_external is strictly read-only", () => {
  const editPermissions = [
    "data:edit",
    "workspace:manage_settings",
    "workspace:manage_team",
    "billing:manage",
    "workspace:delete",
    "reports:create",
    "alerts:manage",
  ] as const;
  for (const permission of editPermissions) {
    assert.equal(
      can("viewer_external", permission),
      false,
      `viewer_external must not hold ${permission}`,
    );
  }
  assert.equal(can("viewer_external", "data:view"), true);
});

test("only admin_owner can delete a workspace or manage billing", () => {
  for (const role of ALL_ROLES) {
    const expected = role === "admin_owner";
    assert.equal(can(role, "workspace:delete"), expected, `workspace:delete for ${role}`);
    assert.equal(can(role, "billing:manage"), expected, `billing:manage for ${role}`);
  }
});

test("can() with no scope argument is unchanged from before scoping existed", () => {
  for (const role of ALL_ROLES) {
    for (const permission of new Set(Object.values(ROLE_PERMISSIONS).flat())) {
      // Calling with vs. without the new third argument must agree —
      // this is the additive-not-breaking guarantee for every existing
      // caller that doesn't know about resource scoping.
      assert.equal(can(role, permission), can(role, permission, undefined));
    }
  }
});

test("undefined or empty scopedResourceIds means workspace-wide access, not deny-all", () => {
  assert.equal(
    can("scoped_field_user", "data:view", {
      resourceId: "field-1",
      scopedResourceIds: undefined,
    }),
    true,
  );
  assert.equal(
    can("scoped_field_user", "data:view", {
      resourceId: "field-1",
      scopedResourceIds: [],
    }),
    true,
  );
});

test("a configured scope restricts access to only the listed resource IDs", () => {
  const scope = { resourceId: "field-1", scopedResourceIds: ["field-1", "field-2"] };
  assert.equal(can("scoped_field_user", "data:view", scope), true);
  assert.equal(can("scoped_field_user", "data:view", { ...scope, resourceId: "field-99" }), false);
});

test("resource scoping never grants a permission the role doesn't hold", () => {
  // scoped_field_user has no reports:create permission at all — being
  // "in scope" for a resource must not bypass the base permission check.
  assert.equal(
    can("scoped_field_user", "reports:create", {
      resourceId: "field-1",
      scopedResourceIds: ["field-1"],
    }),
    false,
  );
});

test("permissionsFor matches can() for every role/permission pair", () => {
  const allPermissions = new Set(Object.values(ROLE_PERMISSIONS).flat());
  for (const role of ALL_ROLES) {
    const granted = new Set(permissionsFor(role));
    for (const permission of allPermissions) {
      assert.equal(
        granted.has(permission),
        can(role, permission),
        `${role}/${permission} mismatch`,
      );
    }
  }
});
