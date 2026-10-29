import { staffPermissionsFor } from "@world-vitality/identity-service";
import { DATA_SOURCES, effectiveCommercialUse } from "@world-vitality/data-ingestion";
import { requireStaff } from "../../../lib/staff";
import { AdminShell } from "../admin-shell";
import { SourcesView, type SourceRow } from "./sources-view";

/**
 * Data sources (BUILD_PLAN "v87"): licence and commercial-use status for
 * every source, plus an on-demand live check for the ones with a probe.
 * Nothing is fetched until a person presses the button, so opening the page
 * never spends a source's free-tier allowance.
 */
export default async function AdminSourcesPage() {
  const staff = await requireStaff("sources:view");
  const rows: SourceRow[] = DATA_SOURCES.map((s) => {
    const commercialUse = effectiveCommercialUse(s);
    // A restricted source whose paid-plan key is set is no longer restricted,
    // so the "before charging" note would contradict the status beside it.
    const lifted = s.commercialUse === "restricted" && commercialUse === "permitted";
    return {
      id: s.id,
      name: s.name,
      usedFor: s.usedFor,
      licence: s.licence,
      commercialUse,
      commercialNote: lifted
        ? "A paid plan's key is set, so requests use the commercial endpoint. Confirm the subscription is current."
        : (s.commercialNote ?? null),
      hasProbe: s.connectorId !== null,
      provenanceDoc: `docs/data-provenance/${s.id}.md`,
      // Only whether it is set, never the value.
      keySetting: s.requiresKeyEnv
        ? { name: s.requiresKeyEnv, configured: Boolean(process.env[s.requiresKeyEnv]) }
        : s.commercialKeyEnv
          ? {
              name: s.commercialKeyEnv,
              configured: Boolean(process.env[s.commercialKeyEnv]?.trim()),
              optional: true,
            }
          : null,
    };
  });
  return (
    <AdminShell current="sources" permissions={staffPermissionsFor(staff.role)}>
      <SourcesView rows={rows} />
    </AdminShell>
  );
}
