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

test("an ownership notice is re-written in the reader's language, with Someone supplied when the name is unknown", () => {
  const n = {
    title: "Chidi made you the owner of Acme Farms",
    body: "You now manage its plan and team. Open Settings to see the people in it.",
    messageKey: "ownership_received",
    messageParams: { who: "Chidi", organisation: "Acme Farms" },
  };
  for (const locale of ["en", "es", "fr", "pt", "ar"] as const) {
    const t = createTranslator(locale);
    const out = localizeNotificationText(n, t);
    assert.ok(out.title.includes("Chidi") && out.title.includes("Acme Farms"), locale);
    assert.equal(out.body, t.t("notifications.msg.ownershipReceived.body"), locale);
  }
  const es = createTranslator("es");
  assert.equal(
    localizeNotificationText({ ...n, messageParams: { who: "", organisation: "Acme" } }, es).title,
    "Alguien te ha hecho propietario de Acme",
  );
  // Without the organisation it degrades to the stored English text.
  assert.deepEqual(
    localizeNotificationText({ ...n, messageParams: { who: "Chidi" } }, createTranslator("fr")),
    { title: n.title, body: n.body },
  );
});

test("a failed-payment notice is re-written in the reader's language with the plan name translated", () => {
  const n = {
    title: "Your payment didn't go through",
    body: "We couldn't renew your Standard plan. Update your card to keep it.",
    messageKey: "payment_failed",
    messageParams: { plan: "standard", planLabel: "Standard" },
  };
  const es = localizeNotificationText(n, createTranslator("es"));
  assert.equal(es.title, "No se pudo procesar tu pago");
  assert.equal(
    es.body,
    createTranslator("es").t("notifications.msg.paymentFailed.body", {
      plan: createTranslator("es").t("billing.plan.standard"),
    }),
    "the plan is named the way the plan screen names it",
  );
  const ar = localizeNotificationText(n, createTranslator("ar"));
  assert.ok(ar.title.includes("الدفع"));
  assert.equal(
    localizeNotificationText(n, createTranslator("en")).title,
    "Your payment didn’t go through",
  );
  // Without the plan it degrades to the stored English text.
  assert.deepEqual(localizeNotificationText({ ...n, messageParams: {} }, createTranslator("fr")), {
    title: n.title,
    body: n.body,
  });
});

test("a refund notice is re-written in the reader's language, naming the plan when it is one of ours", () => {
  const n = {
    title: "Your refund has been processed",
    body: "We processed a refund for your Standard plan payment.",
    messageKey: "payment_refunded",
    messageParams: { plan: "standard", planLabel: "Standard" },
  };
  for (const locale of ["en", "es", "fr", "pt", "ar"] as const) {
    const tr = createTranslator(locale);
    const out = localizeNotificationText(n, tr);
    assert.equal(out.title, tr.t("notifications.msg.paymentRefunded.title"), locale);
    assert.equal(
      out.body,
      tr.t("notifications.msg.paymentRefunded.body", { plan: tr.t("billing.plan.standard") }),
      locale,
    );
  }
  // A payment whose plan is not one of ours gets the wording without a plan name.
  const none = localizeNotificationText(
    { ...n, messageParams: { plan: "", planLabel: "" } },
    createTranslator("es"),
  );
  assert.equal(none.body, createTranslator("es").t("notifications.msg.paymentRefunded.bodyNoPlan"));
});

test("a heat-near-a-place notification reads in the reader's language, with distance and time", () => {
  const now = Date.now();
  const n = {
    title: "Satellite heat near North field",
    body: "English fallback",
    messageKey: "heat_near_place",
    messageParams: {
      place: "North field",
      km: "4",
      detections: "1",
      passAt: new Date(now - 2 * 3_600_000).toISOString(),
    },
  };
  const en = localizeNotificationText(n, createTranslator("en"));
  assert.equal(en.title, "Satellite heat near North field");
  assert.match(en.body ?? "", /about 4 km from North field, .*ago\. This is not a confirmed fire/);
  const es = localizeNotificationText(n, createTranslator("es"));
  assert.match(es.title, /^Calor detectado por satélite cerca de North field$/);
  assert.match(es.body ?? "", /No es un incendio confirmado/);
  assert.match(
    localizeNotificationText(n, createTranslator("fr")).body ?? "",
    /pas un incendie confirmé/,
  );
  assert.match(
    localizeNotificationText(n, createTranslator("pt")).body ?? "",
    /Não é um incêndio confirmado/,
  );
  assert.match(localizeNotificationText(n, createTranslator("ar")).body ?? "", /ليس حريقًا مؤكدًا/);
});

test("several detections are counted in the sentence, one is not", () => {
  const passAt = new Date(Date.now() - 3_600_000).toISOString();
  const base = { title: "t", body: "b", messageKey: "heat_near_place" };
  const many = localizeNotificationText(
    { ...base, messageParams: { place: "Farm", km: "2", detections: "5", passAt } },
    createTranslator("en"),
  );
  assert.match(many.body ?? "", /\(5 detections\)/);
  const one = localizeNotificationText(
    { ...base, messageParams: { place: "Farm", km: "2", detections: "1", passAt } },
    createTranslator("en"),
  );
  assert.doesNotMatch(one.body ?? "", /detections\)/);
});

test("a heat notification with a missing or broken parameter keeps its stored text", () => {
  const base = { title: "stored title", body: "stored body", messageKey: "heat_near_place" };
  const cases: (Record<string, string> | null)[] = [
    null,
    { place: "", km: "4", passAt: new Date().toISOString() },
    { place: "Farm", km: "far", passAt: new Date().toISOString() },
    { place: "Farm", km: "4", passAt: "not a time" },
    { place: "Farm", km: "4" },
  ];
  for (const messageParams of cases) {
    assert.deepEqual(localizeNotificationText({ ...base, messageParams }, createTranslator("es")), {
      title: "stored title",
      body: "stored body",
    });
  }
});
