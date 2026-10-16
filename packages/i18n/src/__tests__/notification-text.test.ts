import { test } from "node:test";
import assert from "node:assert/strict";
import { isMessageKey, localizeNotificationText } from "../notification-text.js";
import { createTranslator } from "../translator.js";

test("isMessageKey only accepts real catalog keys, including inherited-property names", () => {
  assert.ok(isMessageKey("role.admin_owner"));
  assert.ok(isMessageKey("workspace.agriculture.name"));
  assert.ok(!isMessageKey("workspace.nope.name"));
  assert.ok(!isMessageKey("constructor"));
  assert.ok(!isMessageKey("__proto__"));
});

test("a field-comment notification renders in the reader's language; the comment itself is untouched", () => {
  const n = {
    title: "Ada commented on North Field",
    body: "Looks dry — irrigate Friday.",
    messageKey: "field_comment",
    messageParams: { who: "Ada", field: "North Field" },
  };
  assert.deepEqual(localizeNotificationText(n, createTranslator("en")), {
    title: "Ada commented on North Field",
    body: "Looks dry — irrigate Friday.",
  });
  const es = localizeNotificationText(n, createTranslator("es"));
  assert.equal(es.title, "Ada comentó en North Field");
  assert.equal(es.body, "Looks dry — irrigate Friday.");
});

test("an unknown commenter is 'Someone' in the reader's language, not in English", () => {
  const n = {
    title: "Someone commented on North Field",
    body: "x",
    messageKey: "field_comment",
    messageParams: { who: "", field: "North Field" },
  };
  assert.match(localizeNotificationText(n, createTranslator("es")).title, /^Alguien /);
  assert.match(localizeNotificationText(n, createTranslator("fr")).title, /^Quelqu’un /);
});

test("a membership notification translates the workspace and the role", () => {
  const n = {
    title: "You now have access to Agriculture",
    body: "Your role there: Operational user.",
    messageKey: "member_added",
    messageParams: {
      workspaceId: "agriculture",
      workspaceLabel: "Agriculture",
      roleId: "operational_user",
      roleLabel: "Operational user",
    },
  };
  const pt = localizeNotificationText(n, createTranslator("pt"));
  assert.equal(pt.title, "Você agora tem acesso a Agricultura");
  assert.equal(pt.body, "Seu papel lá: Usuário operacional.");
});

test("an unknown workspace or role falls back to the stored label rather than a raw key", () => {
  const n = {
    title: "t",
    body: "b",
    messageKey: "member_added",
    messageParams: {
      workspaceId: "future-workspace",
      workspaceLabel: "Future Workspace",
      roleId: "future_role",
      roleLabel: "Future Role",
    },
  };
  const es = localizeNotificationText(n, createTranslator("es"));
  assert.ok(es.title.includes("Future Workspace"));
  assert.ok(es.body?.includes("Future Role"));
});

test("missing or malformed data degrades to the stored English text", () => {
  const stored = { title: "Stored title", body: "Stored body" };
  assert.deepEqual(
    localizeNotificationText(
      { ...stored, messageKey: "field_comment", messageParams: null },
      createTranslator("es"),
    ),
    stored,
  );
  assert.deepEqual(
    localizeNotificationText(
      { ...stored, messageKey: "member_added", messageParams: { workspaceId: "agriculture" } },
      createTranslator("es"),
    ),
    stored,
  );
  assert.deepEqual(
    localizeNotificationText(
      { ...stored, messageKey: "something_new", messageParams: {} },
      createTranslator("es"),
    ),
    stored,
  );
});

test("an official alert (no message id) is never re-worded in any language", () => {
  const official = {
    title: "Tornado Warning issued for Travis County",
    body: "TAKE COVER NOW. Move to a basement or an interior room.",
    messageKey: null,
    messageParams: null,
  };
  for (const locale of ["en", "es", "fr", "pt", "ar"] as const) {
    assert.deepEqual(localizeNotificationText(official, createTranslator(locale)), {
      title: official.title,
      body: official.body,
    });
  }
});
