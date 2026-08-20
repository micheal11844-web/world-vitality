export type KnowledgeNodeType = "metric" | "capability" | "workspace";

export interface KnowledgeNode {
  id: string;
  type: KnowledgeNodeType;
  label: string;
  description: string;
}

export type KnowledgeEdgeRelationship =
  /** A raw metric is consumed by an InterpretationProvider capability. */
  | "feeds"
  /** A capability's interpretation is surfaced in a workspace's UI. */
  | "powers"
  /** A workspace shows a raw metric directly, with no interpretation
   *  layer in between (currently only Research — see that workspace's
   *  `workspace-shell.tsx` doc comment for why). */
  | "displays-raw";

export interface KnowledgeEdge {
  from: string;
  to: string;
  relationship: KnowledgeEdgeRelationship;
}

/**
 * World Vitality Knowledge Graph — Phase 1 (ADR-0004).
 *
 * **What this is:** every edge below is derived directly from this
 * codebase's real capability wiring — which `InterpretationProvider`
 * consumes which raw metric, and which workspace surfaces which
 * capability — checked against the actual source files at the time
 * this was written (`grep`'d, not recalled from memory), not a
 * hypothetical or aspirational model of relationships that don't exist
 * in code yet.
 *
 * **What this deliberately is NOT (yet):** ADR-0004 explicitly scopes
 * this as Phase 1 — metric → capability → workspace structure only.
 * The bigger vision this is a first step toward — genuine cross-domain
 * *causal* reasoning (e.g. "rain → soil moisture → crop yield →
 * insurance risk", raised as an external recommendation) needs
 * providers that actually consume *each other's* output, which doesn't
 * exist anywhere in this codebase: every `InterpretationProvider`
 * today consumes raw ingested records directly, none consumes another
 * provider's `InterpretationResult`. Building that chaining
 * architecture is real, substantial, deferred work — see ADR-0004's
 * "Consequences" section — not something this Phase 1 data structure
 * pretends to already do.
 *
 * Maintenance note: this is a hand-maintained snapshot, not generated
 * from the source files at build time. It will drift from reality as
 * new providers/workspaces are added unless updated alongside them —
 * a real, accepted tradeoff for a Phase 1 this small (see ADR-0004).
 */

export const METRIC_NODES: KnowledgeNode[] = [
  {
    id: "metric:T2M",
    type: "metric",
    label: "Temperature (T2M)",
    description:
      'NASA POWER\'s "Temperature at 2 Meters" — also fetched as a daily forecast via Open-Meteo.',
  },
  {
    id: "metric:WS2M",
    type: "metric",
    label: "Wind Speed (WS2M)",
    description:
      'NASA POWER\'s "Wind Speed at 2 Meters" — also fetched as a daily forecast via Open-Meteo, explicitly in m/s so both sources are directly comparable.',
  },
  {
    id: "metric:GWETROOT",
    type: "metric",
    label: "Root-Zone Soil Wetness (GWETROOT)",
    description: "NASA POWER's root-zone soil moisture index, 0 (dry) to 1 (saturated).",
  },
];

export const CAPABILITY_NODES: KnowledgeNode[] = [
  {
    id: "capability:agriculture.soil-moisture-status",
    type: "capability",
    label: "Soil Moisture Status",
    description: "SoilMoistureStatusProvider — bands GWETROOT into a soil-moisture status.",
  },
  {
    id: "capability:weather.temperature-status",
    type: "capability",
    label: "Temperature Status",
    description: "WeatherStatusProvider — current-conditions temperature status.",
  },
  {
    id: "capability:weather.forecast-trend",
    type: "capability",
    label: "Forecast Trend",
    description: "WeatherForecastProvider — multi-day temperature forecast trend.",
  },
  {
    id: "capability:construction.site-risk-status",
    type: "capability",
    label: "Site Risk Status",
    description:
      "ConstructionRiskStatusProvider — current temperature + wind against per-activity thresholds (concrete pour, crane, roofing).",
  },
  {
    id: "capability:construction.site-risk-timeline",
    type: "capability",
    label: "Site Risk Timeline",
    description:
      "ConstructionSiteRiskTimelineProvider — the same per-activity thresholds, applied across a multi-day forecast.",
  },
  {
    id: "capability:renewable-energy.wind-generation-status",
    type: "capability",
    label: "Wind Generation Status",
    description:
      "WindGenerationStatusProvider — current wind speed banded into a turbine generation status.",
  },
  {
    id: "capability:renewable-energy.wind-generation-outlook",
    type: "capability",
    label: "Wind Generation Outlook",
    description:
      "WindGenerationOutlookProvider — the same turbine bands, applied across a multi-day forecast.",
  },
];

export const WORKSPACE_NODES: KnowledgeNode[] = [
  { id: "workspace:agriculture", type: "workspace", label: "Agriculture", description: "" },
  { id: "workspace:weather", type: "workspace", label: "Weather & Climate", description: "" },
  { id: "workspace:construction", type: "workspace", label: "Construction", description: "" },
  {
    id: "workspace:renewable-energy",
    type: "workspace",
    label: "Renewable Energy",
    description: "",
  },
  { id: "workspace:research", type: "workspace", label: "Research", description: "" },
];

export const NODES: KnowledgeNode[] = [...METRIC_NODES, ...CAPABILITY_NODES, ...WORKSPACE_NODES];

export const EDGES: KnowledgeEdge[] = [
  {
    from: "metric:GWETROOT",
    to: "capability:agriculture.soil-moisture-status",
    relationship: "feeds",
  },
  {
    from: "capability:agriculture.soil-moisture-status",
    to: "workspace:agriculture",
    relationship: "powers",
  },

  { from: "metric:T2M", to: "capability:weather.temperature-status", relationship: "feeds" },
  {
    from: "capability:weather.temperature-status",
    to: "workspace:weather",
    relationship: "powers",
  },
  { from: "metric:T2M", to: "capability:weather.forecast-trend", relationship: "feeds" },
  { from: "capability:weather.forecast-trend", to: "workspace:weather", relationship: "powers" },

  { from: "metric:T2M", to: "capability:construction.site-risk-status", relationship: "feeds" },
  { from: "metric:WS2M", to: "capability:construction.site-risk-status", relationship: "feeds" },
  {
    from: "capability:construction.site-risk-status",
    to: "workspace:construction",
    relationship: "powers",
  },
  { from: "metric:T2M", to: "capability:construction.site-risk-timeline", relationship: "feeds" },
  { from: "metric:WS2M", to: "capability:construction.site-risk-timeline", relationship: "feeds" },
  {
    from: "capability:construction.site-risk-timeline",
    to: "workspace:construction",
    relationship: "powers",
  },

  {
    from: "metric:WS2M",
    to: "capability:renewable-energy.wind-generation-status",
    relationship: "feeds",
  },
  {
    from: "capability:renewable-energy.wind-generation-status",
    to: "workspace:renewable-energy",
    relationship: "powers",
  },
  {
    from: "metric:WS2M",
    to: "capability:renewable-energy.wind-generation-outlook",
    relationship: "feeds",
  },
  {
    from: "capability:renewable-energy.wind-generation-outlook",
    to: "workspace:renewable-energy",
    relationship: "powers",
  },

  // Research bypasses the capability layer entirely, by design — see
  // that workspace's own doc comments.
  { from: "metric:T2M", to: "workspace:research", relationship: "displays-raw" },
  { from: "metric:WS2M", to: "workspace:research", relationship: "displays-raw" },
];

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export function getGraph(): KnowledgeGraph {
  return { nodes: NODES, edges: EDGES };
}

export function getNode(id: string): KnowledgeNode | undefined {
  return NODES.find((n) => n.id === id);
}

/**
 * All nodes directly connected to `nodeId` (either direction), plus
 * the connecting edges — a one-hop neighborhood, not a full traversal.
 * Useful for "what does this metric feed into?" or "what feeds this
 * workspace?" style questions, which is the whole point of Phase 1.
 */
export function getRelated(nodeId: string): KnowledgeGraph {
  const edges = EDGES.filter((e) => e.from === nodeId || e.to === nodeId);
  const relatedIds = new Set<string>();
  edges.forEach((e) => {
    relatedIds.add(e.from);
    relatedIds.add(e.to);
  });
  return { nodes: NODES.filter((n) => relatedIds.has(n.id)), edges };
}

/**
 * Every metric that, directly or via a capability, reaches the given
 * workspace — e.g. `metricsFeedingWorkspace("workspace:construction")`
 * returns T2M and WS2M. Directly answers "what raw data actually
 * drives what I'm seeing here?", which the Research workspace's
 * "Data Relationships" panel uses.
 */
export function metricsFeedingWorkspace(workspaceId: string): KnowledgeNode[] {
  const capabilityIds = new Set(
    EDGES.filter((e) => e.to === workspaceId && e.relationship === "powers").map((e) => e.from),
  );
  const directMetricIds = new Set(
    EDGES.filter((e) => e.to === workspaceId && e.relationship === "displays-raw").map(
      (e) => e.from,
    ),
  );
  const metricIdsViaCapability = new Set(
    EDGES.filter((e) => capabilityIds.has(e.to) && e.relationship === "feeds").map((e) => e.from),
  );
  const allMetricIds = new Set([...directMetricIds, ...metricIdsViaCapability]);
  return NODES.filter((n) => allMetricIds.has(n.id));
}

/**
 * Every workspace a given metric reaches — the flip side of
 * `metricsFeedingWorkspace`, and the more interesting query in
 * practice: `workspacesUsingMetric("metric:WS2M")` returns
 * Construction, Renewable Energy, AND Research — the same raw wind
 * reading interpreted three completely different ways depending on
 * domain, which is exactly the kind of relationship a knowledge graph
 * exists to surface.
 */
export function workspacesUsingMetric(metricId: string): KnowledgeNode[] {
  const capabilityIds = new Set(
    EDGES.filter((e) => e.from === metricId && e.relationship === "feeds").map((e) => e.to),
  );
  const workspaceIdsViaCapability = new Set(
    EDGES.filter((e) => capabilityIds.has(e.from) && e.relationship === "powers").map((e) => e.to),
  );
  const directWorkspaceIds = new Set(
    EDGES.filter((e) => e.from === metricId && e.relationship === "displays-raw").map((e) => e.to),
  );
  const allWorkspaceIds = new Set([...workspaceIdsViaCapability, ...directWorkspaceIds]);
  return NODES.filter((n) => allWorkspaceIds.has(n.id));
}
