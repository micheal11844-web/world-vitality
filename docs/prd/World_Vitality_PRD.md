# THE WORLD VITALITY PRODUCT REQUIREMENTS DOCUMENT (PRD)

### Governed by the World Vitality Constitution and the Engineering Blueprint

**Author authority:** Office of the Chief Product Officer
**Status:** 🔒 LOCKED / IMMUTABLE, with logged Amendments (see end of document). This document defines what World Vitality *is*, from the perspective of the people who use it. It is the definitive reference for all UI/UX design and engineering prioritization going forward.

---

## HOW TO READ THIS DOCUMENT

World Vitality is organized around **Workspaces** — industry- or audience-specific experiences that all sit on top of one shared platform core (identity, AI interpretation, data ingestion, notifications, billing). A user belongs to one or more Workspaces depending on who they are and what decisions they need to make. The platform-wide experience (Section B) is what every user shares regardless of Workspace. The Workspace Framework (Section C) explains how new Workspaces get added without redesigning anything.

**A note on data sourcing, product-wide:** Every workspace in this document is written against "environmental/geospatial data" generically, and deliberately never names a single provider as the substance of the experience. As the underlying data-ingestion layer grows to include multiple sources (satellite, meteorological, hydrological, and geospatial data from any number of current or future providers), the user-facing product must continue to present one unified thing: **World Vitality Intelligence.** The user should never need to know, or care, which provider a given insight traces back to in order to trust or use it — provenance and attribution remain fully available on request (per the Constitution's Data Ethics principles and the Research workspace's provenance tooling), but they live one layer beneath the primary experience, never as the headline. No workspace description in this document should be read as implying dependency on any single data provider.

---

# SECTION A — WORKSPACES

---

## A.1 AGRICULTURE

**Mission:** Give every farmer and agricultural operation — from smallholder to industrial — clear, timely, science-backed insight into soil, weather, and crop conditions so they can protect yield and reduce risk.

**Target users:** Smallholder and commercial farmers, agronomists, farm cooperatives, agricultural input suppliers, crop insurers (cross-referenced with the Insurance workspace).

**Real-world problems solved:**
- Farmers often lack timely, localized information about drought risk, soil moisture, and pest/disease-favorable conditions, leading to poor planting/irrigation timing and preventable crop loss.
- Existing agricultural data (satellite soil moisture, precipitation forecasts) is often too technical or too coarse-grained to be locally actionable.
- Smallholders in particular often cannot afford consultant-grade agronomic services.

**User journey (sign-up to daily use):**
1. Sign-up captures farm location(s), crop types, and farm size — used to tailor relevant insights immediately, not a generic global dashboard.
2. First-run experience shows the user's actual field(s) on a map with an immediate, plain-language "field health" summary — the "aha moment" happens in under a minute, not after configuration.
3. Daily use: user opens the app to a **Field Overview** — soil moisture trend, short-term weather, and any active alerts (frost, drought stress, pest-favorable humidity).
4. Over a season, the user builds a history of conditions and can compare current season to prior seasons and to nearby anonymized/aggregated peer farms.
5. User sets up recurring alerts (irrigation timing, frost warning) so the app becomes a passive safety net, not just an active-lookup tool.

**How AI enhances the experience:** AI translates raw soil-moisture, precipitation, and vegetation-index data into a plain-language recommendation ("conditions suggest irrigation may be needed in the next 3 days") with an explicit confidence level, never a bare number. AI also flags anomalies (unusual dryness for the time of year) proactively rather than requiring the farmer to know what to look for.

**Dashboards / maps / reports / alerts / collaboration / exports / notifications:**
- *Dashboard:* Field Overview (per-field cards: moisture, temperature, precipitation forecast, active alerts).
- *Map:* Satellite-layered field map with soil moisture, vegetation health (NDVI-style), and precipitation overlays.
- *Reports:* Season-end summary report (conditions vs. historical norms, key events).
- *Alerts:* Frost, drought stress, heavy rainfall/flood risk, pest-favorable conditions.
- *Collaboration:* Shared farm access for farm managers/agronomists with commentary threads on specific fields.
- *Exports:* CSV/PDF season reports, shareable with lenders, insurers, or cooperatives.
- *Notifications:* Push/SMS/email for time-sensitive alerts (SMS prioritized for low-connectivity regions, per Accessibility Principles).

**Permissions:** Owner (full access, billing), Manager (field data + alerts, no billing), Agronomist/Advisor (read + comment, invited per-farm), Viewer (read-only, e.g., lender or insurer with shared access).

**Future premium features:** Yield prediction modeling, direct integration with irrigation/farm equipment, hyperlocal multi-day forecasting, marketplace connections to buyers/input suppliers, carbon-credit / regenerative-practice tracking and certification support.

---

## A.2 CONSTRUCTION

**Mission:** Help construction planners and site managers anticipate weather- and environment-driven risk to schedules, worker safety, and site integrity.

**Target users:** General contractors, site safety managers, project schedulers, civil engineers, developers.

**Real-world problems solved:**
- Weather delays and site-safety incidents (heat stress, storm exposure, flooding of excavation sites) are a leading cause of schedule and cost overruns and injury.
- Planners often rely on generic weather apps not tailored to construction-specific thresholds (e.g., concrete pour temperature limits, crane wind limits).

**User journey:**
1. Sign-up captures site location(s) and project timeline/phase.
2. First-run experience shows a **Site Risk Timeline** — a forward-looking calendar of weather-sensitive risk windows (high wind days, heat-stress days, heavy rain).
3. Daily use: site manager checks a **Today/This Week** view before scheduling pours, crane operations, or outdoor crews.
4. Over the project lifecycle, the tool logs actual delay events against forecasted risk, refining trust in the forecast for that specific site.

**How AI enhances the experience:** AI cross-references weather forecasts against construction-specific operational thresholds (configurable per activity type) and produces a go/no-go style recommendation with reasoning, rather than requiring the site manager to interpret raw meteorological data themselves.

**Dashboards / maps / reports / alerts / collaboration / exports / notifications:**
- *Dashboard:* Site Risk Timeline, per-activity thresholds (pour, crane, roofing, excavation).
- *Map:* Site-level weather and terrain/flood-risk overlay.
- *Reports:* Weather-delay documentation report (useful for contract/claims documentation).
- *Alerts:* High wind, lightning proximity, heat-stress index, flash-flood risk for excavation sites.
- *Collaboration:* Shared site access for subcontractors, with role-specific alert subscriptions (e.g., crane operators only see wind alerts).
- *Exports:* Delay-documentation PDF for client/contract reporting.
- *Notifications:* Push/SMS for time-critical, safety-relevant alerts.

**Permissions:** Project Owner (full access, billing), Site Manager (full site operational access), Subcontractor (scoped to relevant activity alerts only), Client/Viewer (read-only project timeline).

**Future premium features:** Integration with project-management/scheduling tools, automated insurance-claim-ready delay documentation, multi-site portfolio risk view for large developers, worker-safety heat-index compliance tracking against regional labor regulations.

---

## A.3 INSURANCE

**Mission:** Give insurers and reinsurers transparent, defensible environmental risk data to support underwriting, claims, and portfolio risk management.

**Target users:** Underwriters, actuaries, claims adjusters, reinsurance analysts, parametric-insurance product teams.

**Real-world problems solved:**
- Underwriting environmental/climate risk (flood, wildfire, crop, storm) often relies on outdated static risk maps rather than current, dynamic conditions.
- Claims verification for weather-related events is often slow and manual (was there actually a hailstorm at this address on this date?).
- Parametric insurance products need reliable, auditable environmental triggers.

**User journey:**
1. Sign-up (enterprise-oriented) includes portfolio upload (addresses/geographies covered) or API-based integration.
2. First-run experience shows a **Portfolio Risk Map** — aggregated risk exposure across the insurer's book of business.
3. Daily use: underwriters query specific addresses/regions for current and historical risk context during policy issuance; claims adjusters verify event occurrence and severity against historical data.
4. Ongoing: portfolio-level risk-trend monitoring informs renewal and pricing strategy cycles.

**How AI enhances the experience:** AI synthesizes multiple hazard layers (flood, wildfire, storm, drought) into a single normalized risk score per location with full transparency into contributing factors and confidence — critical since underwriting decisions must be explainable and auditable, not black-box.

**Dashboards / maps / reports / alerts / collaboration / exports / notifications:**
- *Dashboard:* Portfolio Risk Overview (exposure by peril, by region, by policy tier).
- *Map:* Address- and region-level hazard layers with historical event overlay.
- *Reports:* Underwriting risk reports (per-policy), claims-verification event reports, portfolio stress-test summaries.
- *Alerts:* Real-time event alerts affecting insured portfolio locations (active wildfire, flood, storm).
- *Collaboration:* Shared portfolio views across underwriting and claims teams, with audit-logged access (per Constitution security/privacy principles).
- *Exports:* Auditable PDF/CSV reports suitable for regulatory and reinsurance documentation.
- *Notifications:* Real-time portfolio-impact alerts for active events.

**Permissions:** Admin (portfolio + billing + integration management), Underwriter (query + report generation), Claims Adjuster (event verification tools, scoped to relevant claims), Analyst/Read-only (portfolio-level reporting, no individual policy detail).

**Future premium features:** Parametric-trigger API for automated payout products, reinsurance treaty stress-testing tools, climate-scenario portfolio modeling (multi-decade projections), white-labeled risk reports for policyholder-facing communication.

---

## A.4 RENEWABLE ENERGY

**Mission:** Help renewable energy developers and operators site, forecast, and optimize solar, wind, and hydro assets using environmental intelligence.

**Target users:** Renewable energy developers, asset operators, grid planners, energy analysts.

**Real-world problems solved:**
- Site selection for new renewable projects requires multi-year environmental data analysis that is often fragmented across sources.
- Day-to-day generation forecasting (solar irradiance, wind speed) affects grid balancing and revenue, and operators need reliable short-term forecasts, not just historical averages.

**User journey:**
1. Sign-up captures asset location(s) and type (solar/wind/hydro).
2. First-run experience shows an **Asset Generation Outlook** — near-term forecast of expected generation conditions for the specific asset.
3. Daily use: operators check forecast-vs-actual generation performance and upcoming condition changes.
4. Development teams use historical multi-year analysis tools during site-selection/feasibility phases (a separate, less frequent but high-value workflow).

**How AI enhances the experience:** AI translates raw irradiance/wind-speed/hydrological data into asset-specific generation forecasts and flags anomalies (underperformance relative to conditions, suggesting equipment issues rather than environmental causes) — helping distinguish environmental from mechanical underperformance.

**Dashboards / maps / reports / alerts / collaboration / exports / notifications:**
- *Dashboard:* Asset Generation Outlook, forecast-vs-actual performance tracking.
- *Map:* Regional resource maps (solar irradiance, wind speed, hydrological flow) for site selection.
- *Reports:* Feasibility/siting reports, monthly generation-performance summaries.
- *Alerts:* Severe weather threatening asset integrity (high wind for turbines, hail for solar), significant forecast-vs-actual deviation.
- *Collaboration:* Shared asset portfolios across development and operations teams.
- *Exports:* Feasibility study exports, performance reports for investor/board reporting.
- *Notifications:* Asset-threatening severe weather alerts, generation anomaly flags.

**Permissions:** Portfolio Owner (full access, billing), Operator (asset-level operational dashboards), Analyst (siting/feasibility tools), Viewer (investor-facing summary reports only).

**Future premium features:** Grid-balancing forecast integration, multi-asset portfolio optimization recommendations, long-term climate-scenario siting risk (e.g., changing wind patterns over asset lifetime), equipment-maintenance predictive flags correlated with environmental stress.

---

## A.5 LOGISTICS & SHIPPING

**Mission:** Help logistics and shipping operators anticipate environmental disruption to routes, ports, and schedules.

**Target users:** Fleet and route planners, maritime shipping operators, freight/logistics coordinators, port authorities.

**Real-world problems solved:**
- Weather-related delays and rerouting decisions are often made reactively rather than with sufficient lead time.
- Route planning rarely incorporates dynamic environmental risk (storm systems, flooding of key routes, port closures) in a unified, decision-ready way.

**User journey:**
1. Sign-up captures typical routes/regions of operation and fleet type (maritime, ground freight, air).
2. First-run experience shows a **Route Risk Overview** for active/planned routes.
3. Daily use: dispatchers check route conditions before finalizing schedules; active shipments are monitored against a live risk overlay.
4. Post-event: disruption reports support customer communication and internal performance review.

**How AI enhances the experience:** AI synthesizes storm tracks, port-condition data, and route-specific historical disruption patterns into a single "route risk" recommendation with suggested lead time for rerouting decisions, rather than requiring planners to separately monitor multiple raw data feeds.

**Dashboards / maps / reports / alerts / collaboration / exports / notifications:**
- *Dashboard:* Active Route Risk Overview, fleet-wide disruption summary.
- *Map:* Route overlays with live storm tracks, port-status indicators, flood-prone corridor flags.
- *Reports:* Post-disruption delay reports for customer/contract documentation.
- *Alerts:* Storm approaching active route, port closure risk, flooding on key ground corridors.
- *Collaboration:* Shared visibility across dispatch, operations, and customer-service teams.
- *Exports:* Disruption/delay reports, route-risk summaries for planning meetings.
- *Notifications:* Time-critical rerouting alerts pushed to dispatchers and, optionally, drivers/captains.

**Permissions:** Fleet Admin (full access, billing), Dispatcher (route monitoring + alerts), Customer Service (read-only disruption reports for customer communication), Driver/Operator (scoped, relevant-route alerts only).

**Future premium features:** Automated rerouting suggestions integrated with fleet-management systems, predictive ETA adjustment based on environmental risk, port-congestion-plus-weather combined risk scoring, carbon-footprint-optimized routing options.

---

## A.6 WEATHER & CLIMATE

**Mission:** Serve as the general-purpose environmental intelligence workspace for anyone needing deeper, more trustworthy weather and climate insight than a typical consumer weather app provides.

**Target users:** Prosumers, small businesses without a dedicated vertical workspace, event planners, outdoor industry operators, journalists.

**Real-world problems solved:**
- Consumer weather apps optimize for daily convenience, not decision-grade insight (confidence levels, longer-range climate context, historical comparison).
- Businesses without a dedicated vertical (e.g., outdoor event companies) still need reliable, decision-ready environmental insight.

**User journey:**
1. Sign-up captures locations of interest (home, business location, event venues).
2. First-run experience shows a clear current-conditions-plus-trend view with an honest short/medium/long-range confidence gradient (not false precision 10 days out).
3. Daily use: check forecast and any active alerts for saved locations.
4. Periodic: historical/climate-context lookups (e.g., "is this an unusually dry year here?").

**How AI enhances the experience:** AI clearly separates high-confidence near-term forecasts from lower-confidence longer-range trends, and contextualizes current conditions against historical norms in plain language.

**Dashboards / maps / reports / alerts / collaboration / exports / notifications:**
- *Dashboard:* Saved-location conditions and forecast, with confidence-gradient timeline.
- *Map:* Standard weather/climate overlay layers.
- *Reports:* Historical climate-context summaries for a location.
- *Alerts:* Severe weather warnings for saved locations.
- *Collaboration:* Minimal — mainly individual/small-team use; shared location lists for small businesses.
- *Exports:* Simple PDF/CSV of forecast/historical data.
- *Notifications:* Severe weather push alerts.

**Permissions:** Individual account model; small-business tier adds a small number of team seats with shared saved locations.

**Future premium features:** Hyperlocal event-specific forecasting (e.g., outdoor wedding planning), long-range seasonal outlook tools, "ask a climate question" deep-research mode.

---

## A.7 DISASTER MONITORING

**Mission:** Provide real-time, trustworthy situational awareness during active environmental disasters to support life-safety decisions.

**Target users:** Emergency management agencies, first responders, at-risk community members, disaster-response NGOs.

**Real-world problems solved:**
- During active disasters (wildfire, flood, hurricane, earthquake aftermath), information is often fragmented across many sources, some unreliable, at exactly the moment clarity matters most.
- Communities need clear, non-alarmist, actionable information — not just raw data feeds.

**User journey:**
1. Sign-up (or anonymous/lightweight access during active emergencies, since barriers to access must be minimal in a crisis) captures area(s) of concern.
2. First-run/emergency-mode experience prioritizes a single, clear **Current Situation** view: what's happening, official guidance, and immediate risk to the user's specific location.
3. During an event: live updates, evacuation-zone status, shelter information.
4. Post-event: recovery-phase information (re-entry status, ongoing hazards).

**How AI enhances the experience:** AI aggregates and cross-validates multiple hazard signals (satellite fire detection, flood gauges, official alerts) into a single coherent situational summary, explicitly flagging uncertainty rather than presenting a false sense of precision during fast-moving events — this is the single highest-stakes application of the Constitution's AI honesty principles.

**Dashboards / maps / reports / alerts / collaboration / exports / notifications:**
- *Dashboard:* Current Situation summary, personalized to the user's location.
- *Map:* Live hazard extent (fire perimeter, flood extent), evacuation zones, shelter locations.
- *Reports:* Post-event impact summaries for agencies and NGOs.
- *Alerts:* Life-safety alerts (evacuation orders, imminent hazard approach) — highest priority tier in the entire platform.
- *Collaboration:* Agency-to-agency shared situational views; NGO coordination views.
- *Exports:* Impact/damage-assessment reports for response coordination.
- *Notifications:* Highest-priority push/SMS, designed to work even under degraded connectivity (per Accessibility Principles), since this is the workspace where notification reliability is most critical.

**Permissions:** Public/community user (read-only, location-based situational awareness), Verified Responder/Agency (full situational tools, coordination features), NGO Partner (scoped regional access), Admin (agency-level configuration).

**Future premium features:** Multi-agency coordination workflow tools, predictive hazard-spread modeling, integration with official emergency-alerting systems, offline-first emergency mode with pre-cached critical information.

**Special note:** This workspace carries the platform's highest ethical weight. Constitution Section 7 (no fear-based manipulation) and Section 9 (AI honesty) apply with zero tolerance here — no engagement-optimization pattern of any kind belongs in this workspace.

---

## A.8 EDUCATION

**Mission:** Make Earth science, climate, and geospatial literacy genuinely accessible and engaging for students and educators at every level.

**Target users:** K-12 and university students, teachers/professors, informal science educators, museums/science centers.

**Real-world problems solved:**
- Real environmental data is rarely presented in a way that's usable in a classroom without significant technical translation work by the teacher.
- Students often engage with climate topics abstractly rather than through their own local, tangible data.

**User journey:**
1. Sign-up (often via institutional/classroom accounts) captures grade level/context.
2. First-run experience invites the student to explore their own location's environmental story — personal relevance drives engagement.
3. Daily/classroom use: guided lessons and open-ended exploration tools tied to real, current data.
4. Educators build custom lesson sequences using platform data and assign them to a class.

**How AI enhances the experience:** AI adjusts explanation complexity to the learner's level, answers open-ended student questions about data in accurate, age-appropriate language, and helps educators generate lesson material grounded in real, current data rather than static textbook examples.

**Dashboards / maps / reports / alerts / collaboration / exports / notifications:**
- *Dashboard:* Class/lesson progress view for educators; personal exploration history for students.
- *Map:* Simplified, guided-exploration map layers appropriate to age level.
- *Reports:* Student project/assignment summaries.
- *Alerts:* Minimal — mainly lesson-deadline reminders, not environmental alerts.
- *Collaboration:* Classroom groups, peer project sharing (moderated, per child-safety-appropriate design).
- *Exports:* Student project exports (for portfolios, assignments).
- *Notifications:* Assignment/lesson reminders.

**Permissions:** Educator/Admin (class management, lesson creation, billing), Student (scoped to assigned lessons and safe exploration tools), Institution Admin (multi-classroom oversight).

**Future premium features:** Full curriculum packages aligned to education standards, classroom competition/collaborative-project tools, integration with common LMS platforms, educator community for sharing lesson plans.

**Special note:** Given likely use by minors, this workspace requires the most conservative child-safety, data-privacy, and moderation design on the entire platform, reviewed against relevant regulatory frameworks (e.g., COPPA-equivalent considerations) as a hard requirement, not a later addition.

---

## A.9 RESEARCH

**Mission:** Give researchers a serious, rigorous analytical environment for working directly with underlying environmental and geospatial datasets, not just interpreted summaries.

**Target users:** Academic researchers, graduate students, independent scientists, think tanks.

**Real-world problems solved:**
- Researchers need access to raw and semi-processed data with full provenance and methodology transparency, which consumer-oriented interpretation layers intentionally simplify away for other audiences.
- Reproducibility requires clear documentation of data lineage, processing steps, and known limitations.

**User journey:**
1. Sign-up captures research affiliation/purpose (used to tailor default dataset recommendations, not to gate access unnecessarily).
2. First-run experience presents a **Dataset Explorer** — search and filter across all available underlying data sources with full metadata.
3. Daily use: researchers query, filter, and export datasets; build saved analysis views; document methodology.
4. Ongoing: researchers cite platform-provided data provenance in their own publications.

**How AI enhances the experience:** AI assists with dataset discovery ("find data relevant to X question"), flags known limitations or gaps in a chosen dataset, and can assist in drafting methodology descriptions — but never substitutes for the researcher's own analysis or statistical judgment, consistent with Constitution Section 9's human-authority principle in domains requiring expert judgment.

**Dashboards / maps / reports / alerts / collaboration / exports / notifications:**
- *Dashboard:* Dataset Explorer, saved queries/analyses.
- *Map:* Full raw-layer geospatial visualization, minimally "interpreted," maximally transparent.
- *Reports:* Methodology and data-provenance documentation, auto-generated citation blocks.
- *Alerts:* New-data-available notifications for saved dataset queries.
- *Collaboration:* Shared research-group workspaces, co-authorship on saved analyses.
- *Exports:* Full raw data export (CSV, NetCDF-equivalent, GeoTIFF-equivalent) with complete provenance metadata.
- *Notifications:* New data availability, collaborator activity.

**Permissions:** Principal Investigator/Admin (workspace + billing), Researcher (full data access, export), Student Researcher (scoped per PI configuration), External Collaborator (limited to shared projects).

**Future premium features:** Direct notebook/analysis-environment integration, larger bulk-export quotas and API access tiers, institutional-wide licensing, dataset version-pinning for long-term reproducibility of published work.

---

## A.10 GOVERNMENT & NGOs

**Mission:** Equip public-sector and civil-society decision-makers with reliable, auditable environmental intelligence to inform policy, resource allocation, and humanitarian response.

**Target users:** Municipal/regional/national government agencies, humanitarian and development NGOs, multilateral organizations.

**Real-world problems solved:**
- Public agencies often lack in-house technical capacity to interpret raw satellite/environmental data for planning purposes (flood-risk zoning, drought-response resource allocation).
- NGOs operating in resource-constrained regions need actionable intelligence without requiring their own technical infrastructure.

**User journey:**
1. Sign-up (enterprise/institutional) defines jurisdiction/area of operation and priority domains (water security, disaster resilience, agriculture, health-environment links).
2. First-run experience presents a **Jurisdiction Overview** — current and trending risk indicators relevant to the agency's mandate.
3. Daily/periodic use: staff monitor conditions relevant to active programs, generate reports for internal planning or donor reporting.
4. Ongoing: multi-year trend data informs policy and program design cycles.

**How AI enhances the experience:** AI synthesizes multi-domain data (climate, agriculture, water, health-environment overlaps) into jurisdiction-level briefings appropriate for non-technical policymakers, always with source transparency given the public-accountability context these decisions operate in.

**Dashboards / maps / reports / alerts / collaboration / exports / notifications:**
- *Dashboard:* Jurisdiction Overview, program-relevant indicator tracking.
- *Map:* Jurisdiction-boundary-aware layered risk maps.
- *Reports:* Policy-briefing-style reports, donor/program reports for NGOs.
- *Alerts:* Emerging risk trends relevant to active programs (drought onset, flood-season outlook shifts).
- *Collaboration:* Cross-agency and agency-NGO shared views for coordinated response planning.
- *Exports:* Formal report exports suitable for public/policy/donor documentation.
- *Notifications:* Program-relevant risk-trend alerts.

**Permissions:** Agency Admin (jurisdiction + billing + user management), Analyst (full reporting tools), Field Staff (mobile-optimized, scoped regional access), Partner Agency (shared cross-agency views, scoped by data-sharing agreement).

**Future premium features:** Custom jurisdiction-boundary policy-scenario modeling, multi-year program-impact evaluation tools, secure data-sharing agreements between partner agencies, integration with humanitarian coordination platforms.

---

## A.11 PUBLIC EXPLORER

**Mission:** Give any curious person on Earth free, beautiful, and honest access to explore their planet — the on-ramp to World Vitality and the embodiment of "we sell understanding" for the broadest possible audience.

**Target users:** General public, curious individuals, casual explorers, people arriving from search/social/news referrals.

**Real-world problems solved:**
- Most people have no easy, engaging way to explore real environmental data about their own community or the wider world; existing tools are either oversimplified (infographics) or inaccessible (raw scientific portals).
- This workspace is also the primary top-of-funnel for all other workspaces and must convert curiosity into either continued free use or a natural upgrade path to a relevant professional workspace.

**User journey:**
1. No sign-up required for first exploration — a person can search their town and immediately see something true and interesting about it (per user-first principles: value before friction).
2. Optional sign-up unlocks saved locations, personalized digests, and deeper history.
3. Daily/casual use: browse trending environmental stories, explore a map, ask the AI assistant open questions about the planet.
4. Natural upgrade path: if usage patterns suggest a professional need (e.g., repeated agriculture-specific queries), the platform suggests the relevant vertical workspace — never a hard paywall block on the free exploratory experience itself.

**How AI enhances the experience:** AI acts as a friendly, accurate guide — answering open-ended questions ("why is it raining so much this year where I live?") in accessible language while remaining honest about uncertainty, and proactively surfacing genuinely interesting, true stories in the user's area rather than generic content.

**Dashboards / maps / reports / alerts / collaboration / exports / notifications:**
- *Dashboard:* "Your Planet Today" — personalized, story-driven feed of interesting/relevant environmental insight.
- *Map:* Global explorable map with layered environmental data, designed for delight and discovery, not professional density.
- *Reports:* None formal — shareable "story cards" instead (social-shareable insight snippets).
- *Alerts:* Optional, opt-in only, for saved locations of personal interest.
- *Collaboration:* Social sharing of discoveries (with careful non-manipulative design per Constitution Section 7).
- *Exports:* Simple image/story-card export for sharing.
- *Notifications:* Opt-in only, low-frequency, high-relevance.

**Permissions:** Anonymous (basic exploration), Registered (saved locations, digest), no paid tier at this layer — this workspace is intentionally always free, as the platform's public-good/on-ramp layer.

**Future premium features:** None directly — this workspace's "premium" outcome is conversion to a paid vertical workspace, not monetization of the explorer experience itself, which should remain a trust-building public good.

---

# SECTION B — PLATFORM-WIDE EXPERIENCE

## B.1 Onboarding
A single, adaptive onboarding flow: the user states who they are and what they care about (a farmer, a student, a researcher, "just curious"), and the platform routes them to the most relevant workspace with pre-populated, location-aware content — never a generic empty dashboard. Onboarding always demonstrates value (a real, personalized insight) within the first minute, before asking for any account commitment beyond what's functionally necessary.

## B.2 Authentication Experience
Standard secure authentication (passwordless/magic-link and SSO options prioritized over password-only, reducing both friction and security risk) with clear session management. Enterprise/institutional workspaces (Insurance, Government & NGOs, Research, Education) support organization-level SSO and centralized user provisioning. Public Explorer supports meaningful anonymous use, per its mission.

## B.3 Home Dashboard
A cross-workspace landing view for users belonging to multiple workspaces (e.g., a researcher who is also a small-scale farmer): surfaces the most relevant/urgent item across all their workspaces (an active alert takes priority over routine data), then lets them enter a specific workspace for depth.

## B.4 Global Search
A single search bar that understands location queries, data-topic queries, and natural-language questions, routing to the right workspace, map layer, or AI assistant response as appropriate — search is the fastest path to insight for users unsure exactly where to look.

## B.5 AI Assistant
A persistent, platform-wide assistant available inside every workspace, scoped to that workspace's context and permissions (an Agriculture user's assistant conversation has farm context; a Research user's has dataset context). The assistant always exposes its confidence and sourcing, and explicitly escalates to "I don't have reliable data for that" rather than guessing — this is the most direct, daily embodiment of the Constitution's AI Principles.

**Clarification on internal structure vs. user-facing presentation:** Internally, the assistant may draw on multiple specialized reasoning components per domain (e.g., distinct crop, weather, and market reasoning for an Agriculture query). This internal specialization is explicitly an implementation detail, not a user-facing feature: the user always experiences **one consistent World Vitality AI identity**, never a roster of separate named "agents" or bots to choose between. Specialization deepens the quality of a single trusted voice; it does not fragment that voice. Any future "AI Workforce"-style capability (multiple visible, named specialist personas) is deferred pending evidence that users want that complexity — it is not assumed as the default direction.

## B.6 Notification Center
A unified inbox across all of a user's workspaces and alert subscriptions, with clear severity tiering (life-safety alerts visually and functionally distinct from routine informational updates) and full user control over channel (push/email/SMS) and frequency per alert type.

## B.7 Settings
Centralized account settings covering profile, notification preferences, connected workspaces, data export/deletion (per Privacy Principles), language/accessibility preferences, and organization management for institutional accounts.

## B.8 Billing
Unified billing across workspaces for users/organizations with multiple paid workspace subscriptions, transparent usage-based components where applicable (e.g., API/export volume for Research or Government tiers), and self-service upgrade/downgrade with no dark-pattern cancellation friction, per Constitution Section 7.

## B.9 Workspace Switching
A persistent, lightweight workspace switcher (not a full re-login or context loss) allowing users with access to multiple workspaces (e.g., an NGO analyst who also uses Weather & Climate personally) to move between them fluidly.

## B.10 User Profile
Reflects the user's role(s), workspace memberships, and — where relevant and consented — a public-facing profile for collaborative contexts (Research co-authorship, Education classroom identity), with privacy defaults set conservatively per Constitution Privacy Principles.

## B.11 Accessibility
Applies uniformly across every workspace: WCAG-level-and-beyond compliance, offline/low-bandwidth graceful degradation, multi-language support, and plain-language equivalents available for every technical concept platform-wide — this is a platform-level guarantee, not a per-workspace choice.

## B.12 Mobile Experience
A first-class (not secondary/afterthought) mobile experience, particularly critical for Agriculture, Construction, Logistics, Disaster Monitoring, and Government/NGO field staff, where field-based, on-the-go use is often the *primary* use case rather than a convenience layer on top of desktop use. Mobile design prioritizes low-bandwidth resilience and offline-cached critical information (especially Disaster Monitoring).

---

# SECTION C — MODULAR WORKSPACE FRAMEWORK

**Purpose:** Allow future industries/audiences to be added as new Workspaces without redesigning the platform core.

**Every Workspace, regardless of industry, is defined by the same underlying template:**

1. **Mission statement** — why this workspace exists, traceable to the company mission.
2. **User personas and permission roles** — reusing the platform's core role model (Admin/Owner, Operational User, Scoped/Field User, Viewer/External) rather than inventing new permission paradigms per workspace.
3. **Relevant data domains** — which existing data-ingestion connectors and interpretation models apply, and which (if any) new ones are required.
4. **Core dashboard configuration** — a configuration of the platform's shared dashboard/map/report/alert components (from `packages/ui-components`, per the Engineering Blueprint), not bespoke UI built from scratch.
5. **Alert taxonomy** — which alert types matter to this audience and their severity tiering, using the shared platform notification/severity framework.
6. **AI assistant context profile** — what context and tone the AI assistant should adopt for this workspace's users, and what "acceptable confidence/uncertainty" language looks like for this domain's stakes.
7. **Collaboration and export needs** — which of the shared collaboration/export primitives apply (shared workspace access, report exports, API access).
8. **Premium feature roadmap** — how monetization for this workspace evolves, following the platform's general free-to-professional-tier pattern established by existing workspaces.

**Why this works:** Because the platform core (identity, ingestion, interpretation, notification, billing — per the Engineering Blueprint's architecture) is fully decoupled from any specific workspace, adding a new Workspace is fundamentally a *configuration and content* exercise — new personas, new dashboard configuration, new alert taxonomy — not a new technical platform. This is the product-level expression of the same abstraction discipline the Engineering Blueprint establishes at the code level.

**Candidate future workspaces** (illustrative, not committed): Real Estate & Urban Planning, Tourism & Outdoor Recreation, Public Health & Epidemiology, Mining & Natural Resources, Marine & Fisheries, Conservation & Biodiversity.

## C.2 THIRD-PARTY WORKSPACE MARKETPLACE (Future Capability)

**Mission:** Once the modular Workspace Framework above is proven internally across a handful of first-party workspaces, extend it to third-party developers and domain-expert companies, so World Vitality becomes the platform other organizations build vertical intelligence on — rather than the sole builder of every vertical itself.

**Why this belongs in the framework, not as a separate idea:** Because every Workspace is already required to conform to the same eight-part template (Section C above), a third-party workspace is not a special case — it is simply a Workspace whose template was filled in by an external team instead of an internal one, submitted through a review process rather than built in-house.

**What could be published to the marketplace, over time:**
- **Workspaces** — full vertical experiences for industries World Vitality hasn't prioritized internally (e.g., a Marine & Fisheries workspace built by a maritime-data specialist company).
- **Data connectors** — new ingestion-layer connectors to specialized or regional data sources, conforming to the internal ingestion interface (per the Engineering Blueprint's abstraction rule).
- **Map layers** — specialized overlays (e.g., a soil-chemistry layer from an agri-science partner).
- **Report templates** — domain-specific report formats built on the shared reporting primitives.
- **AI Agents / specialist reasoning modules** — scoped, permissioned additions to the platform's single AI identity's internal expertise (never a separate, user-facing bot — see the AI Experience note below), contributed by domain-expert partners.
- **Integrations** — connections to third-party operational tools (farm equipment, fleet management, insurance core systems).

**Governance implications (must precede any public launch of this capability):** A review and certification process (data provenance, security, accessibility, and Constitution-compliance review) before any third-party contribution goes live; clear revenue-sharing and liability terms; and a hard rule that third-party workspaces meet the same AI-honesty, privacy, and accessibility bar as first-party ones — the marketplace expands *who builds*, never *what standards apply*.

**Sequencing:** This is explicitly a **post-Phase-1 capability** — it depends on the core Workspace Framework being validated by several real, internally-built workspaces first (per the Engineering Blueprint's roadmap). It is recorded here now as an architectural constraint to design toward (interfaces should not preclude it later), not as near-term scope.

---

# SECTION D — CHALLENGED ASSUMPTIONS, GAPS, AND RECOMMENDATIONS

1. **Challenge: Is "one workspace per industry" the right mental model, or should some users get a cross-industry role-based view instead?** Many real users (an NGO worker who needs agriculture, water, and disaster data simultaneously to plan a drought response) don't fit neatly into one vertical. Recommend the Home Dashboard (B.3) and a future **"Blended Workspace"** capability — a custom, user-configured view pulling relevant modules across multiple workspaces — be treated as a near-term priority, not a distant nice-to-have, especially for Government & NGO users.

2. **Missing opportunity: a "Community/Local Government" tier below full Government & NGO enterprise scale.** Small municipalities, local water boards, and community organizations often have real need and real budget constraints between the free Public Explorer tier and the enterprise Government & NGO tier. Recommend a lightweight, self-serve civic tier be scoped explicitly rather than leaving this segment underserved between two extremes.

3. **Missing opportunity: Health workspace, even if deferred.** Environmental data (air quality, heat, water quality, vector-borne-disease-favorable conditions) has direct, high-value public-health applications. This was not in the required list but represents one of the highest-leverage future workspaces given the platform's mission, and the framework in Section C should be validated against this specific candidate early, since public-health data carries its own regulatory/privacy considerations worth planning for.

4. **Challenge: Should Public Explorer really have zero monetization, even indirectly?** While it should remain free and trust-building per its stated mission, recommend exploring non-manipulative, mission-aligned support models (e.g., an optional, clearly-separated philanthropic/patron support tier, or non-intrusive institutional sponsorship of specific educational content) rather than assuming the workspace must be a pure cost center indefinitely — provided any such model is explicitly reviewed against Constitution Section 7's anti-manipulation principles before being pursued.

5. **Gap: cross-workspace collaboration between different organization types is under-specified.** Several workspaces (Insurance and Agriculture on crop risk; Government/NGO and Disaster Monitoring during a response; Renewable Energy and Weather & Climate on siting) have natural cross-workspace collaboration needs that aren't yet designed. Recommend a dedicated **cross-workspace data-sharing and collaboration model** (with explicit, user-controlled consent per share, consistent with Privacy Principles) be scoped as its own design initiative rather than assumed to emerge naturally from individual workspace designs.

6. **Recommendation: define an explicit "trust escalation" ladder for AI confidence across workspaces.** Some workspaces (Public Explorer, Education) can tolerate more exploratory, lower-stakes AI interaction; others (Insurance, Disaster Monitoring, Government) require near-audit-grade rigor. Recommend a single, documented cross-workspace standard defining exactly what confidence/explanation UI is required at each stakes tier, so this isn't reinvented inconsistently per workspace as they're built.

7. **Recommendation: Public Explorer should be treated as a strategic asset, not just a funnel.** Given its zero-friction, high-trust design, it is uniquely positioned to become the platform's primary brand and public-trust vehicle (media citations, viral shareable insights, schools discovering the platform organically). Recommend explicit investment and success metrics for this workspace independent of its conversion-to-paid-workspace function.

---

## AMENDMENTS LOG

This document is locked. The following amendments have been deliberately reviewed and applied, and are recorded here rather than silently merged into the original text, per the project's documentation-governance rule (Engineering Blueprint, ADR discipline):

**Amendment 1 — Multi-provider data framing strengthened.** Added an explicit preamble note (see "A note on data sourcing, product-wide") clarifying that no workspace description implies dependency on any single data provider, and that the user-facing product is always "World Vitality Intelligence," never a named provider's data. Rationale: guards against the platform drifting toward being read as provider-specific as workspace content accumulates.

**Amendment 2 — Third-Party Workspace Marketplace added (Section C.2).** Recorded as a future, sequenced capability built on top of the existing Workspace Framework, not a new architecture. Rationale: the framework already supports this without modification; recording the intent now protects it as a design constraint (interfaces must not preclude external contribution later) without pulling it into near-term scope.

**Amendment 3 — AI identity model clarified (Section B.5).** Confirmed the platform presents one consistent AI identity to users, with internal domain specialization as an implementation detail rather than a user-facing "AI Workforce" of separate named agents. Rationale: preserves trust coherence (per the Experience Blueprint's AI Experience section) while leaving room for deeper internal specialization over time.

---

## CLOSING

This PRD, together with the Constitution and Engineering Blueprint, forms the complete foundational trilogy for World Vitality: **why** we exist, **how** we build, and **what** we build. Every future feature, workspace, or platform capability should be traceable to a mission, a real user problem, and a concrete journey described here — and where it isn't, that absence is itself a signal to update this document deliberately, not to build around it silently.
