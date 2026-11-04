import type { MessageKey } from "@world-vitality/i18n";

/**
 * The construction risk provider writes its answer as one English sentence,
 * "Concrete pour: go; Crane operation: caution; …". The home page shows each
 * activity as its own chip, so the sentence is split back into pieces here,
 * and the pieces whose words are fixed (the four activity names and
 * go / caution / no-go) are shown in the reader's language. A word that is not
 * in the tables below is shown exactly as the engine wrote it.
 */
export interface ActivityChip {
  label: string;
  status: string;
}

export function parseActivityChips(summary: string): ActivityChip[] {
  return summary
    .split(/(?<=\.)\s*(?=[A-Z])|;\s*/)
    .map((s) => s.replace(/\.$/, "").trim())
    .filter((s) => s.includes(":"))
    .map((entry) => {
      const [label = "", status = ""] = entry.split(":").map((p) => p.trim());
      return { label, status };
    });
}

// See `ACTIVITY_LABELS` in the construction risk provider.
export const ACTIVITY_LABEL_KEYS: Record<string, MessageKey> = {
  "Concrete pour": "construction.activity.concretePour",
  "Crane operation": "construction.activity.craneOperation",
  "Roofing work": "construction.activity.roofingWork",
  "Excavation (flash-flood risk)": "construction.activity.excavation",
};

export const ACTIVITY_STATUS_KEYS: Record<string, MessageKey> = {
  go: "construction.status.go",
  caution: "construction.status.caution",
  "no-go": "construction.status.noGo",
};
