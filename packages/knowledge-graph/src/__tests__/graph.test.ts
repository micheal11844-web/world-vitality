import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getGraph,
  getNode,
  getRelated,
  metricsFeedingWorkspace,
  workspacesUsingMetric,
} from "../graph.js";

test("getGraph returns all nodes and edges", () => {
  const { nodes, edges } = getGraph();
  assert.ok(nodes.length > 0);
  assert.ok(edges.length > 0);
});

test("getNode finds a known node by id", () => {
  const node = getNode("metric:WS2M");
  assert.ok(node);
  assert.equal(node?.type, "metric");
});

test("getNode returns undefined for an unknown id", () => {
  assert.equal(getNode("metric:does-not-exist"), undefined);
});

test("getRelated returns only directly-connected nodes, a one-hop neighborhood", () => {
  const { nodes, edges } = getRelated("metric:GWETROOT");
  // GWETROOT feeds exactly one capability in the real wiring.
  const capabilityNodes = nodes.filter((n) => n.type === "capability");
  assert.equal(capabilityNodes.length, 1);
  assert.equal(capabilityNodes[0]?.id, "capability:agriculture.soil-moisture-status");
  // Should not pull in the workspace two hops away.
  assert.equal(
    nodes.some((n) => n.type === "workspace"),
    false,
  );
  assert.ok(edges.every((e) => e.from === "metric:GWETROOT" || e.to === "metric:GWETROOT"));
});

test("metricsFeedingWorkspace returns both metrics for Construction", () => {
  const metrics = metricsFeedingWorkspace("workspace:construction");
  const ids = metrics.map((m) => m.id).sort();
  assert.deepEqual(ids, ["metric:T2M", "metric:WS2M"]);
});

test("metricsFeedingWorkspace includes direct (non-capability) metrics for Research", () => {
  const metrics = metricsFeedingWorkspace("workspace:research");
  const ids = metrics.map((m) => m.id).sort();
  assert.deepEqual(ids, ["metric:T2M", "metric:WS2M"]);
});

test("metricsFeedingWorkspace returns only GWETROOT for Agriculture", () => {
  const metrics = metricsFeedingWorkspace("workspace:agriculture");
  assert.deepEqual(
    metrics.map((m) => m.id),
    ["metric:GWETROOT"],
  );
});

test("workspacesUsingMetric shows WS2M reaches three different workspaces", () => {
  const workspaces = workspacesUsingMetric("metric:WS2M");
  const ids = workspaces.map((w) => w.id).sort();
  assert.deepEqual(ids, [
    "workspace:construction",
    "workspace:renewable-energy",
    "workspace:research",
  ]);
});

test("workspacesUsingMetric shows GWETROOT reaches only Agriculture", () => {
  const workspaces = workspacesUsingMetric("metric:GWETROOT");
  assert.deepEqual(
    workspaces.map((w) => w.id),
    ["workspace:agriculture"],
  );
});

test("every edge references a node that actually exists in NODES", () => {
  const { nodes, edges } = getGraph();
  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const edge of edges) {
    assert.ok(nodeIds.has(edge.from), `edge.from "${edge.from}" has no matching node`);
    assert.ok(nodeIds.has(edge.to), `edge.to "${edge.to}" has no matching node`);
  }
});
