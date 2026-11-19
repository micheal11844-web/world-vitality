// Stand-in for Supabase auth + PostgREST so the signed-in pages can be opened without a real
// project: any session cookie is accepted and a few tables answer with small canned rows.
// Test-only; it is started by tools/e2e/run.cjs and never touches a real database.
const http = require("http");
const USER = {
  id: "00000000-0000-0000-0000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "tester@example.com",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};
const store = { notifications: [], settings: null };
http
  .createServer(async (req, res) => {
    const u = new URL(req.url, "http://x");
    let raw = "";
    if (req.method !== "GET") {
      for await (const c of req) raw += c;
    }
    const send = (code, body) => {
      res.writeHead(code, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (u.pathname === "/auth/v1/user") return send(200, USER);
    const ORG = "11111111-1111-1111-1111-111111111111";
    const rows = {
      organization_members: { organization_id: ORG, role: "owner" },
      organizations: { id: ORG, name: "Test Org", owner_id: USER.id },
      profiles: {
        user_id: USER.id,
        email: USER.email,
        display_name: "Tester",
        created_at: "2026-01-01T00:00:00Z",
      },
      fields: process.env.MOCK_NO_PINS
        ? []
        : [
            {
              id: "f1",
              workspace_id: "agriculture",
              name: "Ibadan Maize Plot",
              latitude: 7.38,
              longitude: 3.95,
              created_by: USER.id,
              created_at: "2026-01-01",
            },
            {
              id: "f2",
              workspace_id: "agriculture",
              name: "Nakuru Tea Estate",
              latitude: -0.3,
              longitude: 36.07,
              created_by: USER.id,
              created_at: "2026-01-02",
            },
          ],
    };
    const tbl = u.pathname.split("/")[3];
    if (
      u.pathname.startsWith("/rest/v1/") &&
      (tbl === "notifications" || tbl === "notification_settings") &&
      process.env.MOCK_STATEFUL
    ) {
      const single = /vnd\.pgrst\.object/.test(req.headers.accept || "");
      const body = raw ? JSON.parse(raw) : null;
      if (tbl === "notification_settings") {
        if (req.method === "POST" || req.method === "PATCH") {
          store.settings = {
            official_min_tier: "info",
            collaboration_enabled: true,
            heat_watch_enabled: true,
            alerts_synced_at: null,
            heat_synced_at: null,
            ...(store.settings || {}),
            ...body,
          };
          return send(single ? 200 : 201, single ? store.settings : [store.settings]);
        }
        if (store.settings) return send(200, single ? store.settings : [store.settings]);
        return single
          ? send(406, { code: "PGRST116", message: "0 rows", details: "", hint: null })
          : send(200, []);
      }
      if (req.method === "POST") {
        for (const row of Array.isArray(body) ? body : [body]) {
          if (
            store.notifications.some(
              (n) => n.user_id === row.user_id && n.dedupe_key === row.dedupe_key,
            )
          )
            continue;
          store.notifications.push({
            id: "n" + (store.notifications.length + 1),
            detail: null,
            read_at: null,
            dismissed_at: null,
            ...row,
          });
        }
        return send(201, []);
      }
      if (req.method === "GET") return send(200, store.notifications);
      return send(200, []);
    }
    if (tbl === "billing_payments" && u.pathname.startsWith("/rest/v1/")) {
      if (process.env.MOCK_PAYMENTS_FAIL) return send(500, { message: "mock payments failure" });
      const OWNER = USER.id,
        STRANGER = "99999999-9999-4999-8999-999999999999";
      let list = process.env.MOCK_NO_PAYMENTS
        ? []
        : [
            {
              reference: "ref_new",
              user_id: OWNER,
              amount_minor: 750000,
              currency: "NGN",
              plan: "standard",
              paid_at: "2026-11-10T14:05:00+00:00",
              refund_status: null,
            },
            {
              reference: "ref_refunded",
              user_id: OWNER,
              amount_minor: "1999",
              currency: "USD",
              plan: "premium",
              paid_at: "2026-10-10T00:30:00+00:00",
              refund_status: "processed",
            },
            {
              reference: "ref_pending",
              user_id: OWNER,
              amount_minor: 2500000,
              currency: "NGN",
              plan: null,
              paid_at: "2026-09-10T09:00:00+00:00",
              refund_status: "pending",
            },
            {
              reference: "ref_foreign",
              user_id: STRANGER,
              amount_minor: 500000,
              currency: "NGN",
              plan: "standard",
              paid_at: "2026-11-01T00:00:00+00:00",
              refund_status: null,
            },
          ];
      for (const [k, v] of u.searchParams) {
        if (typeof v === "string" && v.startsWith("eq.") && ["reference", "user_id"].includes(k))
          list = list.filter((r) => String(r[k]) === v.slice(3));
      }
      list.sort((a, b) => Date.parse(b.paid_at) - Date.parse(a.paid_at));
      const single = /vnd\.pgrst\.object/.test(req.headers.accept || "");
      if (single)
        return list.length
          ? send(200, list[0])
          : send(406, { code: "PGRST116", message: "0 rows", details: "", hint: null });
      return send(200, list);
    }
    if (u.pathname.startsWith("/rest/v1/") && rows[tbl] !== undefined) {
      const single = /vnd\.pgrst\.object/.test(req.headers.accept || "");
      const v = rows[tbl];
      return send(200, single ? (Array.isArray(v) ? v[0] : v) : Array.isArray(v) ? v : [v]);
    }
    if (u.pathname.startsWith("/rest/v1/")) {
      const single = /vnd\.pgrst\.object/.test(req.headers.accept || "");
      if (single)
        return send(406, {
          code: "PGRST116",
          message: "The result contains 0 rows",
          details: "",
          hint: null,
        });
      return send(200, []);
    }
    send(200, {});
  })
  .listen(54321, "127.0.0.1", () => console.log("mock supabase on 54321"));
