# THE WORLD VITALITY EXPERIENCE BLUEPRINT

### Governed by the World Vitality Constitution, Engineering Blueprint, and PRD

**Author authority:** Office of the Chief Design Officer
**Status:** 🔒 LOCKED / IMMUTABLE. Amended only via explicit, deliberate instruction and a logged rationale — never silently rewritten.
**Purpose:** The definitive reference for all UI, UX, product design, branding, interaction design, and frontend engineering. This document describes the complete experience in enough detail that another designer or engineer could faithfully build it — without prescribing code, markup, or visual tooling.

---

## PREAMBLE

The Constitution says why we exist. The Engineering Blueprint says how we build. The PRD says what we build. This document says **how it should feel** — because a platform interpreting the health of the planet for millions of people will be judged, ultimately, not on its data pipeline but on whether a person trusts what they see on their screen. Scientific rigor is the platform's skeleton. This document designs its skin, its voice, and its movement — so that the rigor is felt, not seen.

---

# SECTION 1 — PRODUCT PERSONALITY

If World Vitality were a person, it would be the calm, knowledgeable friend who happens to have read every scientific report so you don't have to — and who tells you the truth plainly, even when the truth is "I'm not sure yet."

**Core personality traits:**
- **Calm, not clinical.** It has the steadiness of a good doctor delivering news — serious when the moment calls for it, never cold.
- **Confident, not arrogant.** It states what it knows plainly, and states what it doesn't know just as plainly, without hedging anxiety or false bravado.
- **Warm, not casual.** It respects the user's intelligence and time; it doesn't perform friendliness with excessive exclamation points or forced humor, especially given how often the subject matter (climate, disaster, health) is serious.
- **Precise, not pedantic.** It chooses the exact right word, not the most impressive one. It never uses jargon to sound smart.
- **Patient, not passive.** It never rushes a user toward a decision or a purchase; it also never leaves them stuck without a next step.

**How it communicates:** Short, clear sentences. Plain language first, technical depth available on request, never forced. It never manufactures urgency it doesn't mean. When something is genuinely urgent (an evacuation alert), its tone shifts — noticeably calmer and more direct, not louder — because real urgency is communicated through clarity and brevity, not exclamation.

**How it should make users feel:** Informed, not overwhelmed. Respected, not patronized. Safe, not anxious. Curious, not entertained. A user should leave an interaction with World Vitality feeling like they understand something true about their world — and like the platform was honest with them, even when the news wasn't good.

**The single sentence that defines the personality:** *World Vitality tells you the truth about your planet, as clearly and kindly as it can.*

---

# SECTION 2 — EXPERIENCE PHILOSOPHY

1. **Reduce cognitive load relentlessly.** Every screen should require the least possible mental effort to understand its single most important message.
2. **Never overwhelm.** Depth exists, but it is always one deliberate step away, never dumped on the user by default.
3. **Progressive disclosure everywhere.** Show the headline insight first; let the user pull the underlying data, methodology, or raw numbers only if they want them.
4. **One primary action per screen.** Every screen has one clear "main thing," even when secondary options exist.
5. **Insight over numbers.** A number without interpretation is a burden we've handed to the user instead of doing our job. Numbers appear in service of an insight, not instead of one.
6. **Always explain uncertainty.** No insight is presented without an honest signal of how confident we are in it — this is non-negotiable across every workspace, escalating in rigor with the real-world stakes of the decision (per the PRD's "trust escalation ladder").
7. **Never manufacture urgency.** Urgency is reserved for things that are actually urgent. A platform that cries wolf for engagement forfeits the right to be believed when it matters.
8. **Always earn trust, never assume it.** Every session should reinforce trust through transparency, not rely on trust already granted.
9. **Respect attention as a finite, valuable resource.** Every notification, animation, and screen must justify the attention it asks for.
10. **Consistency builds fluency.** A user who learns one workspace should already understand 80% of any other workspace on first visit.
11. **Design for the worst day, not just the average day.** Systems must remain usable, calm, and clear during outages, disasters, and connectivity failures — this is when the design is tested most.
12. **Delight is a byproduct of clarity, not a separate design goal.** We do not chase delight through decoration; we achieve it by making something genuinely, satisfyingly understandable.

---

# SECTION 3 — THE EMOTIONAL JOURNEY

- **First visit:** Curiosity, quickly rewarded. Within seconds, the user sees something true and specific about a place they know — not a marketing pitch. The feeling is *"oh, that's actually interesting."*
- **First search:** Delight at speed and relevance — the answer feels personal, not generic, and arrives without friction or required sign-up.
- **First AI interaction:** Trust forming — the AI answers plainly, cites its confidence, and feels less like "a chatbot" and more like "a knowledgeable presence." The feeling is *"it actually told me what it doesn't know — that's rare."*
- **First dashboard:** Orientation and relevance — the user immediately recognizes their own context (their field, their site, their city) reflected back to them, not a generic template. The feeling is *"this is mine."*
- **First notification:** Reassurance, not alarm — even a warning notification should feel like it's protecting the user, not manipulating them. The feeling is *"good thing it told me."*
- **First report:** Quiet pride and usefulness — the report feels professional and shareable, something the user is glad to hand to a boss, a client, or an official. The feeling is *"this makes me look good/prepared."*
- **First premium upgrade:** Confidence, not pressure — the user upgrades because they've already felt the value and want more of it, never because they were blocked or nagged into it. The feeling is *"I know exactly what I'm getting, and it's worth it."*
- **One month later:** Quiet dependency — checking World Vitality has become a small, trusted habit, like checking a reliable colleague's advice. The feeling is *"I'd notice if this were gone."*
- **One year later:** Deep trust and advocacy — the user has made real decisions better because of the platform, and recommends it not because they were asked to, but because it genuinely helped. The feeling is *"this understands my world, and I trust it."*

---

# SECTION 4 — INFORMATION ARCHITECTURE

**Public experience (unauthenticated):**
```
Home (Landing Experience)
├── Explore (Public Explorer entry point)
├── Workspaces overview (what World Vitality offers, by industry)
├── Pricing
├── Help Center
├── About / Mission (Constitution-derived narrative)
└── Sign in / Create account
```

**Authenticated core (shared across all workspaces):**
```
Home Dashboard (cross-workspace summary)
├── Workspace Switcher
├── Global Search
├── AI Assistant (persistent, contextual)
├── Notification Center
├── Profile
├── Settings
│   ├── Account
│   ├── Notification Preferences
│   ├── Accessibility Preferences
│   ├── Connected Organizations
│   └── Data & Privacy (export/delete)
├── Billing
│   ├── Current Plan(s)
│   ├── Usage (where usage-based)
│   └── Invoices
├── Help Center (contextual, workspace-aware)
├── Developer Portal (API keys, docs — for Research/Insurance/Government tiers)
└── Admin Portal (organization/user management — role-gated)
```

**Workspace experience (repeated structure per workspace, per PRD Section C framework):**
```
Workspace Home (dashboard)
├── Map
├── AI Panel (workspace-scoped)
├── Reports
├── Alerts
├── Collaboration / Team
├── Exports
└── Workspace Settings
```

**Cross-workspace navigation:** A persistent, lightweight switcher (not a full reload) always visible in the header; switching workspaces preserves the user's global context (profile, notifications) while changing the "world" of dashboard/map/data underneath it.

**Wireframe — the overall authenticated app shell (applies everywhere, every workspace fills the "Main Content" region):**

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo]  [Workspace: Agriculture ▾]      [ Search........ ]  [AI]🔔👤│  ← Header
├───────────┬─────────────────────────────────────────────┬───────────┤
│           │                                             │           │
│ Sidebar   │              Main Content                   │ AI Panel  │
│           │           (Dashboard / Map / Reports /       │ (dockable,│
│ ▸Dashboard│            Alerts / Team / Settings —        │ collapsed │
│  Map      │            whichever sidebar item is active) │ by        │
│  Reports  │                                             │ default)  │
│  Alerts   │                                             │           │
│  Team     │                                             │           │
│  Settings │                                             │           │
│           │                                             │           │
└───────────┴─────────────────────────────────────────────┴───────────┘
```
*Relationships:* Header is global and constant across all workspaces. Sidebar contents are populated per the Workspace Framework template (PRD Section C) but always occupy the same position and order. AI Panel is optional/collapsible — collapsing it lets Main Content expand to full width, never the reverse.

---

# SECTION 5 — COMPLETE USER FLOWS

- **Anonymous visitor:** Lands on Home → sees an immediate, real, local insight without any prompt to sign in → can search, explore map, ask AI freely → sign-up is offered contextually (e.g., "save this location") rather than gating the initial experience.
- **Registration:** Minimal required fields (email, and either magic link or password) → immediately followed by a short, adaptive "who are you / what do you care about" step (not a form — a conversational, single-question-at-a-time flow) → routed directly into a personalized first workspace view.
- **Email verification:** Non-blocking — the user can continue exploring immediately; verification unlocks persistence (saved locations, alerts) with a gentle, dismissible reminder rather than a hard wall.
- **Magic link login:** One tap from email, lands the user exactly back where they left off (deep-linked), not a generic homepage.
- **Password reset:** Simple, calm, reassuring copy ("this happens to everyone") — never punitive tone; clear single-action email.
- **Organization invitation:** Invitee receives a clear, human-toned invite naming who invited them and to what workspace/role; accepting drops them directly into that workspace's relevant context, not a generic account shell.
- **Workspace selection:** Presented as a small set of clear, visually distinct cards (industry icon + one-line mission), not a dropdown list — this is a meaningful choice, and should feel like one.
- **Searching a location:** Type-ahead suggestions appear instantly with visual previews (small map thumbnail); selecting a result transitions directly into the map/dashboard for that location, preserving search context (breadcrumb back to results).
- **Viewing a map:** Loads progressively — base terrain first, then data layers fade in as they resolve, never a blank/frozen map; layer controls are discoverable but not visually dominant by default.
- **Talking to AI:** Always accessible via a persistent, unobtrusive entry point; opens into a focused conversational panel that retains relevant workspace/map context automatically (the user never has to re-explain what they're looking at).
- **Receiving alerts:** Tiered by severity — a routine alert arrives quietly in the Notification Center; a life-safety alert interrupts with a distinct, unmistakable visual/audio treatment reserved exclusively for that tier.
- **Exporting reports:** One clear action from any report view; the user picks format and scope in a single lightweight step, and the export begins immediately with visible progress, never a silent wait.
- **Purchasing a subscription:** Plan comparison is presented plainly (per PRD Billing principles) with no artificial scarcity or countdown pressure; checkout is a short, clear, interruption-free flow; confirmation clearly states what happens next.
- **Joining an organization:** Mirrors the invitation flow — clear naming of the organization and role, immediate relevant access on acceptance.
- **Switching workspaces:** Single click/tap on the persistent switcher; transition uses a brief, meaningful animation (Section 14) signaling "you're in a new world now," not a jarring reload.
- **Deleting an account:** Discoverable in Settings (never hidden), clearly explains consequences, offers export-before-delete, requires explicit confirmation, and is honored promptly and completely — this flow is a direct expression of Constitution's user-first and privacy principles and must never include retention dark patterns.
- **Signing out:** Single, immediate action, no confirmation friction required for this low-risk, easily-reversible action.

**Flow diagram — Anonymous visitor → Registered, personalized user (the platform's most important conversion path):**

```
 [Land on Home]
       │
       ▼
 [See live insight card, no login]
       │
       ▼
 [Search / explore map / ask AI freely] ───────────────┐
       │                                                │
       ▼                                                │
 [Try to "save" something]                               │  (user may loop here
       │                                                 │   indefinitely without
       ▼                                                 │   ever registering)
 [Contextual sign-up prompt: "Save this location?"]       │
       │                                                 │
       ▼                                                │
 [Enter email → magic link OR password] ◄────────────────┘
       │
       ▼
 [Single adaptive question: "Who are you here as?"]
       │
       ▼
 [Routed into personalized first Workspace, pre-populated]
       │
       ▼
 [Optional, non-blocking email verification reminder]
```

**Flow diagram — Switching workspaces (same session, no reload):**

```
[Any screen] → tap [Workspace: Agriculture ▾] in header
       │
       ▼
[Lightweight dropdown/card list of user's workspaces]
       │
       ▼
[Select "Insurance"]
       │
       ▼
[Brief transition animation — "entering a new world"]
       │
       ▼
[Insurance Workspace Home loads — header/profile/notifications persist,
 sidebar + main content swap to Insurance context]
```

---

# SECTION 6 — LANDING EXPERIENCE

The homepage is not a brochure. It is the first "aha" moment.

**Structure:**
1. **Immediate, live demonstration of value** — the first thing a visitor sees is not a headline about the company, but a real, current, beautiful piece of planetary insight (e.g., an auto-detected or default location's live conditions, rendered as a small, gorgeous map-and-insight card) — value before pitch, always.
2. **An invitation to search, not a call to sign up.** The primary interactive element is a search bar: "Explore anywhere on Earth" — action-oriented, not conversion-oriented.
3. **A few more crafted moments of "wow"** as the user scrolls or interacts — a rotating showcase of genuinely interesting global stories (a wildfire's spread, a drought's progression, a coastline's change over a decade), each demonstrating a different workspace's value implicitly, without labeling them as "features."
4. **Workspace discovery, framed as identity, not as a pricing tier list** — "Who are you here as?" (farmer, builder, researcher, curious explorer...) rather than a SaaS-style feature/plan comparison up front.
5. **Mission and trust, told briefly and honestly** — a short, confident statement of what the company will never do (sell your data, manipulate you with fear) rather than generic marketing claims.
6. **A calm, unhurried footer** — company information, help, careers — with no exit-intent popups, no urgency banners, no manipulative retention tactics.

**Tone reference points:** The restraint and confidence of Apple's product pages, the immediate tactile wonder of Google Earth, the conversational directness of a well-designed AI product, and the sense that something important and well-engineered is happening quietly underneath — without needing to shout about it, in the spirit of a confident automotive or aerospace brand.

**Wireframe — public homepage (single scroll, no navigation clutter above the fold):**

```
┌─────────────────────────────────────────────────────────────────────┐
│  World Vitality                          Explore  Workspaces  Sign in│
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│         [ Explore anywhere on Earth..........................🔍]    │
│                                                                       │
│     ┌───────────────────────────────┐                               │
│     │   Live map/insight card for    │   "Powered by Space.         │
│     │   your area (auto-detected     │    Built for Earth."         │
│     │   or curated default)          │                               │
│     └───────────────────────────────┘                               │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│   ◄  [Story 1]   [Story 2]   [Story 3]   [Story 4]  ►   (Discover)   │
├─────────────────────────────────────────────────────────────────────┤
│              "Who are you here as?"                                  │
│   [Farmer]  [Builder]  [Insurer]  [Researcher]  [Just curious]        │
├─────────────────────────────────────────────────────────────────────┤
│        What we will never do (brief, plain trust statement)          │
├─────────────────────────────────────────────────────────────────────┤
│  About   Help   Careers                              (calm footer)   │
└─────────────────────────────────────────────────────────────────────┘
```
*Relationships:* Everything above the story rail is reachable with zero clicks and no account. The identity-selection row is the only "sales" moment on the page, and it reads as a question, not a pricing table.

---

# SECTION 7 — PUBLIC EXPLORER EXPERIENCE

**What appears first:** A living map centered on either the user's detected location or a curated, beautiful default — immediately annotated with one or two genuinely interesting, true insights ("Rainfall here is 40% below the seasonal average" — phrased plainly, sourced honestly).

**How users explore:** Direct manipulation of the map (pan, zoom, tap) is the primary exploration mechanism, supplemented by a "Discover" rail of curated global stories for users who prefer to be guided rather than to navigate themselves.

**How they search:** A single, prominent search bar accepts place names, plain questions ("is it going to flood near me"), and even vague curiosity ("somewhere interesting right now") — the AI assistant interprets intent rather than requiring exact syntax.

**How they discover interesting places:** A continuously refreshed, editorially-curated-plus-AI-surfaced feed of "planetary stories" — real, current, visually strong environmental phenomena worth knowing about, functioning as the platform's version of a front page.

**How AI guides them:** The assistant is present as a quiet, always-available companion — never interrupting unprompted, but immediately responsive when engaged, answering with the same plain-language, confidence-transparent voice used everywhere else on the platform.

**How they naturally transition into an account:** The moment a user tries to do something that benefits from persistence — save a location, set an alert, revisit history — sign-up is offered as the natural unlock for *that specific desire*, framed as "save this" rather than an abstract "create an account" ask.

**Wireframe — Public Explorer main screen:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  [< Back]        [ Search anywhere.....................🔍]     [AI]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                                                                       │
│                     [ Full-bleed interactive map ]                   │
│                                                                       │
│         ┌───────────────────────────────┐                            │
│         │ "Rainfall here is 40% below    │  ← floating insight card  │
│         │  the seasonal average"         │     (dismissible)         │
│         │  Confidence: High  •  Source ⓘ │                            │
│         └───────────────────────────────┘                            │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ Discover:  [Story] [Story] [Story] [Story] [Story]  ►                │
└─────────────────────────────────────────────────────────────────────┘
```
*Relationships:* The map is the dominant, near-full-screen element. The insight card and Discover rail float above it without ever blocking direct map manipulation. AI is one tap away from any state of this screen.

---

# SECTION 8 — WORKSPACE EXPERIENCE (GENERIC FRAMEWORK)

Every workspace shares one structural skeleton, themed but not reinvented per industry:

- **Sidebar:** Persistent, collapsible, containing the workspace's core sections (Dashboard, Map, Reports, Alerts, Team, Settings) — icon-first, label-visible by default, collapsible to icon-only for power users.
- **Header:** Workspace identity (name/context, e.g., a specific farm or project), global search, AI entry point, notification bell, workspace switcher, profile.
- **Dashboard:** The default landing view — a personalized arrangement of widgets (Section 9).
- **Map panel:** Full-featured, workspace-themed map (Section 11), reachable as its own dedicated view or embedded within dashboard widgets.
- **AI panel:** A docked or full-screen conversational surface, contextually aware of whatever the user is currently viewing.
- **Reports:** A library of generated and scheduled reports, organized by recency and type.
- **Alerts:** A dedicated view of active and historical alerts, filterable by severity and type.
- **Widgets & cards:** Modular, self-contained units of insight (a single metric, a small trend chart, a map thumbnail) that compose the dashboard.
- **Tables:** Used for dense, comparative data (portfolio views, dataset browsers) — always paired with an interpretive summary above them, never presented as the primary insight alone.
- **Filters:** Consistently placed, non-modal where possible, always showing the current filter state plainly rather than hidden behind an ambiguous icon.
- **Command bar:** A keyboard-accessible (and voice-accessible, over time) quick-command interface ("go to...", "show me...", "export...") for power users, invoked with a consistent shortcut across the whole platform.
- **Quick actions:** A small, contextual set of the 2-3 most likely next actions surfaced directly on relevant cards (e.g., "Set an alert" directly on a risk widget) rather than buried in menus.
- **Recent activity:** A lightweight, chronological trail of the user's/team's recent views, reports, and alerts — supporting quick resumption of work.

---

# SECTION 9 — DASHBOARD PHILOSOPHY

Rather than one fixed dashboard, World Vitality defines a **universal dashboard system**: a shared grammar of widget types, each workspace populating it differently.

**Core widget types (exist across all workspaces, themed per domain):**
- **Status widget** — one headline metric plus trend and confidence (e.g., "Soil moisture: Adequate, trending down").
- **Map thumbnail widget** — a small live map excerpt linking to the full map view.
- **Alert summary widget** — active alerts, severity-sorted.
- **Trend widget** — a simple, honestly-scaled chart comparing current to historical.
- **Comparison widget** — this location/asset/portfolio vs. a relevant benchmark (regional average, prior season).
- **Recent reports widget** — quick access to recently generated or scheduled reports.
- **Team activity widget** — relevant for collaborative workspaces (who did what, recently).

**Prioritization:** Widgets are ranked by real-time relevance, not fixed position — an active alert always surfaces above routine status, regardless of a user's saved layout, because safety-relevant information overrides personalization.

**Personalization:** Users can reorder, resize, and hide widgets; the system remembers this per-user, per-workspace.

**AI-assisted rearrangement:** AI may *suggest* a rearrangement ("Move drought risk to the top? conditions have changed") but never silently rearranges a user's layout without an explicit, easily-reversible confirmation — the user's sense of control over their own dashboard is itself a trust signal and is never overridden invisibly.

**Customization:** A lightweight "edit dashboard" mode (not a heavy configuration screen) lets users add/remove/rearrange widgets from a visual gallery, with sensible, mission-relevant defaults pre-selected per workspace so no user ever starts from a truly blank canvas.

**Wireframe — example Workspace Home dashboard (Agriculture shown; same grid grammar applies everywhere, per Section 9's shared widget types):**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Field Overview                                    [Edit Dashboard]  │
├───────────────────────┬───────────────────────┬─────────────────────┤
│ Status Widget          │ Alert Summary Widget   │ Map Thumbnail       │
│ Soil moisture: Adequate│ ⚠ Frost risk — 2 days  │ [ small map ]       │
│ Confidence: High ▲     │ (tap to view field)     │ tap → full map      │
├───────────────────────┴───────────┬───────────────┴─────────────────┤
│ Trend Widget                       │ Comparison Widget                 │
│ Moisture vs. last season           │ This field vs. regional average   │
│ [ simple line chart ]              │ [ simple bar comparison ]         │
├─────────────────────────────────────┴───────────────────────────────┤
│ Recent Reports          │ Team Activity                               │
│ • Season summary (PDF)  │ • Agronomist commented on North Field       │
└──────────────────────────────────────────────────────────────────────┘
```
*Relationships:* Alert widgets always render top row regardless of saved layout (Section 9's prioritization rule). All other widgets below follow the user's personalized order. Every widget links through to its full-detail view (Map, Reports, etc.) — nothing here is a dead end.

---

# SECTION 10 — AI EXPERIENCE

World Vitality does not present "a chatbot." It presents **an intelligence layer with a consistent voice, expressed through specialized contexts.**

**Model:** A single underlying AI experience, presented as contextually-specialized "views" of the same trusted intelligence, rather than a menu of separate bot personalities. In an Agriculture workspace, the AI feels like a knowledgeable agronomist companion; in Research, it feels like a rigorous analytical assistant; in Disaster Monitoring, it feels like a calm emergency briefing. The specialization is in tone, context, and depth — not in a fractured, inconsistent set of separate products, which would erode the platform-wide trust the Constitution demands.

**Background AI vs. active AI:** AI operates in two modes: **active** (the user asks something directly) and **ambient** (AI proactively surfaces an anomaly or insight worth knowing, always disclosed as AI-surfaced and always low-frequency, high-relevance — never a constant stream).

**Autonomous agents:** Reserved, carefully, for well-scoped, reversible, explicitly-permissioned actions (e.g., "monitor this field and alert me if conditions change") — never for autonomous action with real-world consequence (no autonomous "decisions" made on the user's behalf without explicit, informed permission, consistent with Constitution Section 9's human-authority principle).

**How AI appears:** A small, calm, consistent presence indicator (not a cartoonish avatar) — present but never dominating the screen, expandable into a focused conversational surface on demand.

**How it explains confidence:** Every substantive AI claim is paired with a plain-language confidence signal (e.g., "high confidence," "limited data available") rendered visually and textually, never buried in a footnote.

**How it requests clarification:** When a query is ambiguous, AI asks one specific, well-scoped clarifying question rather than guessing or returning an overly broad answer — mirroring the platform's "one action at a time" philosophy.

**How it behaves during uncertainty:** It says so, plainly and calmly, and offers the closest thing it *does* know with confidence, rather than either fabricating precision or refusing to help at all.

---

# SECTION 11 — MAPS

The map is the platform's signature surface — the place where "Powered by Space, Built for Earth" becomes tangible.

**Base layers:** Satellite imagery, terrain, and a clean, minimal "insight-first" base map (default) that keeps visual noise low so data layers remain legible.

**Data layers (toggleable, never all-on by default):** Climate, weather (current + forecast), flood risk, wildfire, agriculture/vegetation health, construction-relevant overlays (wind, precipitation), infrastructure context, and workspace-specific specialty layers.

**Timeline / historical playback:** A persistent, unobtrusive time-scrubber beneath the map lets users move through historical data smoothly, with clear labeling of the exact date/period shown — critical for honest interpretation (never letting a user mistake historical data for current).

**Future predictions:** Rendered with a distinct visual treatment (e.g., a clearly different stroke/fill treatment, never identical to observed data) so forecast is never visually confusable with fact, reinforcing the Constitution's AI honesty principle directly in the map itself.

**Layer system:** A clean, categorized layer-control panel, searchable for power users, with sensible workspace-specific defaults pre-enabled so novice users aren't confronted with an empty map.

**Search:** Integrated directly into the map surface — searching flies the map to the result with a smooth, oriented transition, not an abrupt jump.

**Drawing tools:** Simple area-of-interest drawing (for defining a field, site, or region of concern), with drawn shapes persisted and reusable across reports/alerts.

**Bookmarks:** One-tap saving of a specific map view (location + layer configuration + optionally, timeline position) for quick return.

**Sharing:** A shareable link that reconstructs the exact map view (location, layers, time) for a collaborator or external stakeholder — critical for the collaboration needs described throughout the PRD.

**Wireframe — full Map view:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ [< Back]   Field: North Field       [Search location.....🔍]   [AI]  │
├───────────────────────────────────────────────────────┬─────────────┤
│                                                         │ Layers      │
│                                                         │ ☑ Satellite │
│                                                         │ ☑ Moisture  │
│              [ Full map canvas ]                       │ ☐ Vegetation│
│                                                         │ ☐ Weather   │
│                                                         │ ─────────   │
│                                                         │ [Draw area] │
│                                                         │ [Bookmark]  │
│                                                         │ [Share]     │
├─────────────────────────────────────────────────────────┴─────────────┤
│ ◄───────────────●───────────────────────────────────► Now   Forecast │
│  Jan   Feb   Mar   Apr [today]   May   Jun                (dashed)    │
└─────────────────────────────────────────────────────────────────────┘
```
*Relationships:* Layer panel is collapsible and never obscures the map center. The timeline scrubber spans the full width beneath the map; anything to the right of "today" renders in a visually distinct (e.g., dashed/lighter) style to keep forecast unmistakably separate from observed data, per the Constitution's AI-honesty principle applied directly to the map surface.

---

# SECTION 12 — NOTIFICATIONS

**Which notifications deserve interruption:** Only those with genuine, time-sensitive real-world consequence — life-safety alerts (Disaster Monitoring), and workspace-defined critical thresholds the user has explicitly opted into (e.g., frost warning for a farmer who's set that threshold).

**Which stay silent (in-app/center only):** Routine informational updates, non-urgent trend changes, report-ready notifications, and any ambient AI-surfaced insight — these accumulate quietly in the Notification Center without demanding attention.

**How emergency notifications differ:** A distinct visual language (reserved exclusively for this tier, never reused for marketing or lower-stakes alerts, protecting its meaning over time), the ability to break through device Do Not Disturb settings where the user has opted in for life-safety categories, and calm, direct, action-oriented language ("Move to higher ground now" rather than alarmist phrasing).

**User customization:** Full per-alert-type control over channel (push, email, SMS, in-app only) and threshold (e.g., "only alert me above moderate risk"), with sensible, safety-conscious defaults pre-set rather than requiring every user to configure safety-critical alerts manually before they're protected.

**Wireframe — Notification Center (severity tiers stacked, not mixed):**

```
┌─────────────────────────────────────────────────────┐
│  Notifications                          [Preferences]│
├─────────────────────────────────────────────────────┤
│ 🔴 CRITICAL                                          │
│   Evacuation order — North District      [View]      │
├─────────────────────────────────────────────────────┤
│ 🟠 Alerts                                            │
│   Frost risk — North Field, in 2 days     [View]      │
│   High wind — Site B, tomorrow            [View]      │
├─────────────────────────────────────────────────────┤
│ ⚪ Informational                                     │
│   Season report ready                     [View]      │
│   AI noticed: moisture trending down      [View]      │
└─────────────────────────────────────────────────────┘
```
*Relationships:* Tiers are visually and structurally separated (never sorted purely by recency) so a critical item can never be buried beneath routine ones.

---

# SECTION 13 — VISUAL DESIGN LANGUAGE

**Color philosophy:** A calm, confident, Earth-and-space-inspired palette — deep, quiet neutrals as the dominant canvas (letting data and imagery be the color), with a restrained, purposeful accent palette reserved specifically for meaning: one consistent hue family for informational states, a distinct family reserved exclusively for warning/critical states so color itself becomes a trustworthy, consistent signal system across the entire platform, never used decoratively for critical-meaning colors.

**Typography:** A clean, highly legible typeface family prioritizing readability at small sizes and in bright outdoor/mobile-field conditions (relevant given the field-use context of Agriculture, Construction, Disaster Monitoring); a clear, limited type scale (few sizes, used consistently) rather than an expansive, inconsistent hierarchy.

**Spacing:** Generous, consistent spacing that reinforces calm and reduces visual noise — density is earned only in data-dense professional views (Research, Insurance portfolios), never imposed by default.

**Icons:** A single, consistent icon language across the whole platform — simple, geometric, and never decorative; icons always paired with text labels in primary navigation to support both recognition and accessibility.

**Illustrations:** Used sparingly, primarily in onboarding and empty states, in a style that feels grounded and real (evocative of actual landscapes and phenomena) rather than abstract corporate illustration — reinforcing "built for Earth" rather than "generic SaaS."

**Photography:** Real satellite and Earth imagery is a core visual asset, not stock photography — this is one of the platform's genuine differentiators and should be used generously and beautifully wherever authentic imagery is available.

**Motion:** Purposeful and calm (detailed in Section 14) — never bouncy, cartoonish, or attention-grabbing for its own sake.

**Elevation & depth:** A restrained, subtle system of layering (used to indicate what's interactive, what's a modal/overlay, what's the current focus) rather than heavy, decorative shadows.

**Cards, buttons, inputs, charts, tables:** All follow the same underlying visual grammar (consistent corner treatment, consistent weight/contrast rules) so that a user's learned intuition in one context transfers everywhere else on the platform.

**Charts:** Always honestly scaled (no truncated axes exaggerating change), always paired with a plain-language takeaway, never purely decorative.

**Empty states:** Never a blank void — always a clear explanation of why it's empty and a single, obvious next action.

**Loading states:** Calm, informative (what's happening, not just a generic spinner where feasible), never so lengthy that a user perceives failure.

**Error states:** Honest, plain-language, blame-free ("we couldn't load this — here's what you can do"), never a raw technical message.

**Success states:** Quiet and confirming, not celebratory-for-its-own-sake, except where genuine delight is warranted (Section 14).

**Skeleton loading:** Used for content-heavy views (dashboards, reports) to preserve layout stability and perceived speed.

**Dark mode / light mode:** Both fully supported as first-class, not an afterthought — dark mode particularly relevant for field/outdoor and night-time disaster-monitoring use, designed with the same rigor (contrast, legibility) as light mode, not a simple color inversion.

**Accessibility as a visual principle:** Sufficient contrast, never color-alone signaling (always paired with shape/icon/text), and scalable text that doesn't break layouts, are treated as core visual design constraints from the start, not a later audit pass.

---

# SECTION 14 — MOTION DESIGN

Motion exists to **communicate meaning**, never decoration alone.

- **Micro-interactions:** Subtle, fast confirmations (a button's state change, a toggle's flip) that reassure the user their action registered — always under a threshold that feels instantaneous.
- **Page transitions:** Directional and spatially logical (moving "into" a workspace feels like moving forward/deeper; going back feels like retreating) so users build an intuitive spatial model of the product.
- **Map transitions:** Smooth, oriented flight animations between locations — reinforcing the sense of a real, continuous globe rather than teleporting between disconnected views.
- **Loading animations:** Calm, rhythmic, never frantic — communicating "working on it" without anxiety.
- **Hover states:** Immediate, subtle affordance signals (a slight lift or highlight) confirming interactivity, especially important for users unfamiliar with which elements are actionable.
- **AI "thinking" animation:** A distinct, calm, breathing-like animation (never a generic spinner) that signals "considering" rather than "broken" or "loading a webpage" — reinforcing the AI's distinct, trustworthy character.
- **Success animations:** Brief, understated positive reinforcement (e.g., a soft checkmark resolve) for completed actions like report generation or export — genuine but never over-celebratory given the platform's often-serious subject matter.
- **Alert animations:** Severity-appropriate — routine alerts animate in gently; life-safety alerts use a more insistent (but never chaotic or panic-inducing) motion and color treatment reserved exclusively for that tier.
- **Reduced-motion respect:** Every animation has a reduced-motion equivalent (instant or fade-only) honoring system-level user preferences without exception — a hard accessibility requirement, not an enhancement.

---

# SECTION 15 — ACCESSIBILITY (BEYOND WCAG)

- **Low vision:** High-contrast mode, scalable text that doesn't break layout, and a design system that never relies on subtle color or small icon-only distinctions for critical meaning.
- **Blindness:** Full, meaningfully-labeled screen-reader support — not just technically compliant markup, but descriptions that convey actual insight (a screen reader describing a map should convey the *finding*, not just "image of a map"), since a blind user deserves the same understanding, not a lesser experience.
- **Motor disabilities:** Full keyboard and switch-access navigability, generous touch/click target sizes, no interactions that require precise, fast, or sustained gestures as the only path to core functionality.
- **Poor internet:** Aggressive graceful degradation — cached last-known data clearly labeled as such, critical information (especially Disaster Monitoring) available in a lightweight, text-first fallback mode when full map/imagery can't load.
- **Slow devices:** A deliberately lightweight "essential mode" for core information (conditions, alerts) that works on older/low-powered devices without requiring the full rich map experience.
- **Older users:** Larger default touch targets and text sizing options, plain language by default (never assuming tech fluency), and forgiving interactions (confirmations before destructive actions, easy undo).
- **Children (Education workspace):** Simplified navigation, age-appropriate language tiers, and conservative, moderated collaboration features, designed with child-safety as a hard constraint (per PRD Education workspace notes).
- **Emergency situations:** The Disaster Monitoring experience specifically is designed to work under maximum stress and minimum bandwidth/attention — the largest text, the fewest steps, the clearest single next action, tested explicitly for usability under panic and urgency, not just calm conditions.

---

# SECTION 16 — MOBILE EXPERIENCE

Mobile is designed as its own primary experience, not a shrunken desktop.

- **Offline support:** Critical data (recent conditions, active alerts, saved locations) cached locally and clearly labeled with last-updated time when offline; Disaster Monitoring specifically pre-caches essential safety information proactively when a user is in a monitored at-risk area.
- **Gesture navigation:** Natural map gestures (pinch, pan, two-finger rotate) as primary map interaction; swipe gestures for common actions (dismiss notification, switch workspace) consistent with platform-wide mobile conventions.
- **Maps on mobile:** Full-featured but progressively simplified — layer controls collapse into a clean bottom sheet, optimized for one-handed thumb reach.
- **AI on mobile:** Accessible via a persistent, thumb-reachable entry point; supports voice input as a first-class input method, particularly valuable for field-based professional users (Agriculture, Construction) whose hands may be occupied.
- **Notifications on mobile:** Full native push integration, with severity-tiered treatment (Section 12) respected at the OS level (e.g., critical alerts requesting Do Not Disturb bypass permission explicitly and transparently).
- **Widgets:** Native home-screen widget support for the most relevant single piece of information per workspace (today's field risk, active alert count) — extending the platform's presence beyond the app itself.
- **Everything else:** Every core flow (search, dashboard, reports, settings) is fully functional on mobile, never gated as "desktop only," recognizing that for several workspaces (Agriculture, Construction, Disaster Monitoring, Government field staff) mobile is the *primary*, not secondary, surface.

**Wireframe — Mobile app shell (single-hand reachable, bottom navigation replaces desktop sidebar):**

```
┌───────────────────────────┐
│ ≡   World Vitality    👤  │  ← minimal header
├───────────────────────────┤
│                           │
│                           │
│     Main Content          │
│  (Dashboard / Map /       │
│   Reports / Alerts —      │
│   one at a time)          │
│                           │
│                           │
├───────────────────────────┤
│  🏠     🗺️     🔔     💬  │  ← bottom nav: Home, Map,
│ Home    Map   Alerts  AI   │     Alerts, AI — thumb reach
└───────────────────────────┘
```
*Relationships:* Bottom navigation mirrors the desktop sidebar's top four priorities only (Home/Dashboard, Map, Alerts, AI); everything else (Reports, Settings, Team) lives one tap deeper via the header menu (≡), keeping the primary bar uncluttered and reachable one-handed.

---

# SECTION 17 — TRUST

**How trust is earned daily:** Through consistent honesty in small moments — correctly flagging low confidence, admitting data gaps, never overselling a forecast — repeated so often it becomes an expectation rather than a surprise.

**How uncertainty is communicated:** Plainly, visually, and consistently across every workspace, using the same confidence-language system everywhere (Section 10) so users learn to read it fluently.

**How AI decisions are explained:** Every AI-derived insight includes an accessible "why" — the contributing data and reasoning, presented at a depth the user can choose to expand into, never hidden behind an opaque result alone.

**How data sources are shown:** Every insight is traceable to its underlying data source and, where relevant, its provider's licensing/limitations (per the PRD's Research workspace and Constitution's Data Ethics section) — visible on request, never buried.

**How misinformation is prevented:** By refusing to ever present a fabricated or extrapolated value as observed fact, by clearly distinguishing forecast from historical fact visually (Section 11), and by maintaining editorial/scientific review over any curated public-facing content (Public Explorer's "planetary stories") rather than relying on unreviewed AI generation alone for widely-shared claims.

---

# SECTION 18 — FUTURE VISION (10 YEARS)

Today's decisions are designed to support, without requiring redesign:

- **A world with dozens of data providers and AI models**, seamlessly folded into the same trusted interpretive voice the user already knows — because the interface was built around interpreted insight, not around any single provider's branding or format.
- **A world with dozens of workspaces** across industries not yet imagined, each onboarding through the same modular framework (PRD Section C) and inheriting the same dashboard, map, and AI grammar established today — new industries should feel instantly familiar to new users, not like a bolted-on product.
- **A world where the AI experience deepens** from an assistant a user actively queries into a genuinely proactive, trusted advisor for well-scoped, explicitly-permissioned domains — without ever crossing the line into autonomous, unreviewed decision-making in consequential domains, a boundary set intentionally in Section 10 today.
- **A world where World Vitality is present ambiently** — home-screen widgets, voice assistants, embedded partner integrations — carrying the same calm, honest voice into every surface it touches, because that voice, not any single screen design, is the platform's true long-term asset.
- **A world where Public Explorer is a globally recognized public resource** — cited by educators, journalists, and everyday people the way a trusted almanac or encyclopedia once was — because it was protected, from day one, as a trust-building public good rather than optimized purely for conversion.

---

# SECTION 19 — CRITICAL REVIEW

**Weaknesses and risks in this design, named honestly:**

1. **The "one consistent AI voice across all workspaces" model is elegant but risks feeling generic if not executed with real domain depth.** A farmer and an insurance underwriter need genuinely different depths of interaction, not just a different tone wrapper. *Mitigation:* invest early in real domain-expert-reviewed content and reasoning depth per workspace, not just surface-level tone variation — the personality must be consistent, but the substance must be genuinely specialized.

2. **Progressive disclosure and "one action per screen," taken too literally, risk under-serving power users** (Research, Insurance analysts) who need to move fast through dense data, not be walked through single steps repeatedly. *Mitigation:* explicitly design a "power mode" or professional density option per relevant workspace, rather than assuming one interaction pace fits both a casual explorer and a full-time analyst.

3. **The map, as the platform's signature surface, risks becoming a performance and complexity bottleneck** as layer count, historical playback, and multi-workspace theming all compound. *Mitigation:* flag this explicitly to engineering as a priority area for performance budgeting (Engineering Blueprint Section 15) well before layer count grows unchecked.

4. **The emergency/Disaster Monitoring experience described here assumes a level of design and testing rigor (usability under panic, offline pre-caching) that is easy to under-invest in relative to its low day-to-day usage frequency.** Features used rarely are chronically at risk of being deprioritized, yet this is the single highest-stakes workspace on the platform. *Mitigation:* explicitly protect dedicated design and QA resourcing for this workspace regardless of its usage-frequency-based prioritization elsewhere.

5. **A fully consistent design system across eleven-plus very different industries risks either being too generic to feel truly specialized, or quietly fragmenting into eleven different sub-products over time as workspace teams optimize independently.** *Mitigation:* a dedicated, ongoing Design System Architecture function (per this document's authority) with real authority to enforce the shared grammar, not just document it — consistent with the Engineering Blueprint's insistence on structural, not just documented, discipline.

6. **Accessibility-beyond-WCAG commitments (Section 15) are extensive and genuinely valuable, but expensive and easy to erode under delivery pressure** once the platform is mid-growth and every team is busy. *Mitigation:* treat core accessibility criteria as part of the Engineering Blueprint's Definition of Done (already true) with periodic, mandatory re-audits, not a one-time certification.

7. **The homepage's "value before pitch" philosophy is powerful but harder to make legible to enterprise buyers** (Insurance, Government) who often expect and look for traditional trust signals (case studies, security certifications, compliance badges) before engaging emotionally with a product demo. *Mitigation:* design a distinct, still-honest enterprise entry path alongside the consumer-facing wonder-driven homepage, rather than assuming one landing experience serves both buying motions equally well.

---

## WORKFLOW NOTE (for future engineering handoff)

This project's operating workflow avoids local terminal/command-line use and IDE-based tooling (e.g., VS Code) as a working assumption. The intended path is: code changes land in the GitHub repository (via a GitHub-integrated tool, not a manually-run terminal), and deployment happens automatically from GitHub to Vercel on merge — no manual build/deploy steps in between. Any future engineering or design handoff should assume this constraint rather than defaulting to terminal-based instructions.

---

## CLOSING

This Experience Blueprint, together with the Constitution, Engineering Blueprint, and PRD, completes the foundational set that should govern every future design and engineering decision at World Vitality. Its central discipline is simple to state and hard to sustain: make the complexity of an entire planet's data feel calm, clear, and honest in every single screen — and treat any drift from that discipline, as the company grows, as a deliberate decision to be reviewed, never a silent accident.
