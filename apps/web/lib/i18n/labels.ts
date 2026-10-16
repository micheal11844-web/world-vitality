import { translateOr, type Translate } from "@world-vitality/i18n";

/**
 * Names for things that live in data (a persona, a workspace role, a
 * workspace) rendered in the reader's language. Each is looked up as
 * `<group>.<id>` in the catalog; an id the catalog doesn't know — a new
 * persona added without a translation, say — falls back to the English
 * text it already has (or the bare id) rather than showing a raw key.
 */

function lookup(key: string, t: Translate, fallback: string): string {
  return translateOr(t, key, fallback);
}

export function personaLabel(id: string, t: Translate, fallback: string = id): string {
  return lookup(`persona.${id}.label`, t, fallback);
}

export function personaDescription(id: string, t: Translate, fallback = ""): string {
  return lookup(`persona.${id}.description`, t, fallback);
}

export function roleLabel(roleId: string, t: Translate, fallback: string = roleId): string {
  return lookup(`role.${roleId}`, t, fallback);
}

export function workspaceName(workspaceId: string, t: Translate, fallback: string = workspaceId) {
  return lookup(`workspace.${workspaceId}.name`, t, fallback);
}
