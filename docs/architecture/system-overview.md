# System Overview

The current shape of the system, in one page, as of BUILD_PLAN Stage 14
follow-up. This is a snapshot, not a source of truth — code wins on any
disagreement, and this doc should be updated (not left to drift) as real
things change, same discipline as everything else in `docs/`.

For **why** something is the way it is, see `docs/adr/` and
`docs/Decision-Log.md`. For **what a term means**, see `docs/Glossary.md`.
This doc is only "what exists and how it connects, right now."

## Layers (ADR-0002)

```
┌──────────────────────────────────────────────────────────┐
│  PRESENTATION — apps/web (Next.js App Router, on Vercel)  │
│  5 workspaces + Home Dashboard, one shared AppShell        │
└───────────────────────────┬────────────────────────────────┘
                             │ InterpretationResult
┌───────────────────────────┴────────────────────────────────┐
│  INTERPRETATION — services/interpretation-engine            │
│  7 InterpretationProviders, one per Capability               │
└───────────────────────────┬────────────────────────────────┘
                             │ NormalizedDataRecord (+ Provenance)
┌───────────────────────────┴────────────────────────────────┐
│  INGESTION — services/data-ingestion                        │
│  2 connectors: NasaPowerConnector, OpenMeteoConnector        │
└──────────────────────────────────────────────────────────────┘
```

Nothing above a layer knows about anything provider-specific below it —
that boundary is the whole point of ADR-0002, and it's what let a
structurally different second connector (Open-Meteo) get added without
touching the interpretation or presentation layers at all.

## Data flow: metric → capability → workspace

The authoritative, queryable version of this lives in
`packages/knowledge-graph` (ADR-0004) — this table is a snapshot of it,
not a second source of truth. Query it directly
(`workspacesUsingMetric`, `metricsFeedingWorkspace`) rather than trusting
this table once it's had time to drift.

| Metric                     | Capability(ies)                                                                       | Workspace(s)      |
| -------------------------- | ------------------------------------------------------------------------------------- | ----------------- |
| `GWETROOT` (soil moisture) | `agriculture.soil-moisture-status`                                                    | Agriculture       |
| `T2M` (temperature)        | `weather.temperature-status`, `weather.forecast-trend`                                | Weather & Climate |
| `T2M` + `WS2M`             | `construction.site-risk-status`, `construction.site-risk-timeline`                    | Construction      |
| `WS2M` (wind speed)        | `renewable-energy.wind-generation-status`, `renewable-energy.wind-generation-outlook` | Renewable Energy  |
| `T2M`, `WS2M`              | _(none — displayed raw, by design)_                                                   | Research          |

`WS2M` is the one metric that reaches three completely different
workspaces with three completely different interpretations — real
evidence the ingestion/interpretation split is doing its job, not a
coincidence.

## Connectors (`services/data-ingestion`)

- **`NasaPowerConnector`** — NASA POWER API, public domain, no API key.
  Current-conditions data (`T2M`, `WS2M`, `GWETROOT`). See
  `docs/data-provenance/nasa-power.md`.
- **`OpenMeteoConnector`** — Open-Meteo API, no API key, **free tier is
  non-commercial-use only** (revisit before any commercial launch — see
  `docs/data-provenance/open-meteo.md`). 7-day forecast data (`T2M`,
  `WS2M`), tagged `recordType: "forecast"` with a real `forecastIssuedAt`
  so confidence can genuinely degrade with lead time rather than being
  styled to look uncertain.

## Application surface (`apps/web`)

One Next.js app on Vercel. Five workspaces (Agriculture, Weather &
Climate, Construction, Renewable Energy, Research) plus a Home Dashboard,
sharing:

- **`AppShell`/`Sidebar`** (`packages/ui-components`) — grouped
  sidebar navigation (a cross-workspace switcher section + a
  this-workspace-pages section), Ctrl+B/Cmd+B collapsible, persisted to
  `localStorage`.
- **`AppBrand`** (`apps/web/app/app-brand.tsx`) — shared header
  logo+name, clickable back to `/dashboard`. Currently a placeholder
  mark; a real logo asset is expected but not yet provided.
- **`GuideCharacter`** ("Orbi," provisional name) — docked mascot,
  reacts to page state, present via `AppShell` on every page that uses
  it.

Research is the one workspace with **no** AI interpretation panel — a
deliberate exception (Decision #013), not an inconsistency to fix.

## Identity (Supabase — not Firebase; see Decision #010)

`services/identity-service`'s `SupabaseAuthService`, behind one
`AuthService` interface. Auth methods: magic link (the original/primary
method), password (with a real `PasswordStrengthMeter`), Google OAuth
(the one flow needing `@supabase/ssr` for PKCE — see Decision #005), and
Forgot Password (a genuinely separate flow from magic link — see the
Glossary's "Recovery Session" entry). Session state is two cookies
(`SESSION_COOKIE`/`REFRESH_COOKIE`), set by `setSessionCookies()`
regardless of which auth method was used, so the rest of the app reads
auth state one single way.

**Known real gap, not yet closed:** no page actually requires a valid
session server-side yet — `/dashboard` and every workspace route render
regardless of whether a session cookie is present (surfaced while
building Forgot Password; recorded in BUILD_PLAN's deferred list).

## Observability (`apps/web/lib/logger.ts`)

One structured JSON logging pipeline, three categories:
`"application"`, `"security"` (`logSecurity`), and `"telemetry"`
(`logTelemetry`, added in the Stage 14 follow-up — real events: page
views, dataset fetches, the auth funnel; explicitly no
aggregation/dashboard/vendor yet — that's a real, separate, undecided
question). All three write to the same pipeline, visible in Vercel's
runtime logs today.

## Deployment topology

- **`apps/web`** → Vercel (Root Directory `apps/web`; see the build
  command specifics in project memory/onboarding docs if reconfiguring).
- **Identity + Postgres** → Supabase.
- **External data** → NASA POWER + Open-Meteo APIs, called directly from
  Vercel's serverless functions at request time (`dynamic =
"force-dynamic"` on every page that needs fresh data — a page that's
  missing this will serve stale, build-time-cached data or, as happened
  with the first version of the telemetry work, silently only run its
  server-side logic once, at build time, instead of per request).

## What's explicitly not covered here

Full history and reasoning → `BUILD_PLAN.md`'s changelog and
`docs/Decision-Log.md`. Deep security analysis → `docs/security/`.
Per-provider licensing detail → `docs/data-provenance/`. What to do when
something breaks → `docs/runbooks/incident-response.md`.
