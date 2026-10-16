import { test } from "node:test";
import assert from "node:assert/strict";
import { CATALOGS, LOCALES, type MessageKey } from "@world-vitality/i18n";
import { PERSONAS } from "../personas.js";
import { ROLE_PERMISSIONS } from "../roles.js";

/**
 * The app labels personas and workspace roles by looking up
 * `persona.<id>.label`, `role.<id>` and `workspace.<key>.name` in the
 * language catalogs, and falls back to English when a key is missing.
 * That fallback is the right behaviour for a user, but it would hide a
 * newly added persona or role that nobody translated — so this test is
 * where the omission shows up, in every language.
 */

function keysFor(): MessageKey[] {
  const keys: string[] = [];
  for (const persona of PERSONAS) {
    keys.push(`persona.${persona.id}.label`, `persona.${persona.id}.description`);
    if (persona.workspaceKey) keys.push(`workspace.${persona.workspaceKey}.name`);
  }
  for (const role of Object.keys(ROLE_PERMISSIONS)) keys.push(`role.${role}`);
  return keys as MessageKey[];
}

test("every persona, persona workspace and role has a message in every language", () => {
  const keys = keysFor();
  assert.ok(keys.length > 0);
  for (const locale of LOCALES) {
    const catalog = CATALOGS[locale.code];
    for (const key of keys) {
      assert.ok(
        typeof catalog[key] === "string" && catalog[key].trim() !== "",
        `${locale.code}: missing "${key}" — add it to the catalog`,
      );
    }
  }
});
