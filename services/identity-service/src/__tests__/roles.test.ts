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
