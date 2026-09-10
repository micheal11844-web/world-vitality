"use client";

import { useState, useTransition } from "react";
import { Button, Text } from "@world-vitality/ui-components";
import { updateLocationAction, deleteLocationAction } from "./location-actions";

export interface LocationManageControlsProps {
  locationId: string;
  initialLabel: string;
  initialLatitude: number;
  initialLongitude: number;
}

/**
 * Edit/delete controls for one monitored-location card (BUILD_PLAN
 * "STAGE — GOVERNMENT & NGOS FOLLOW-UP: MONITORED LOCATIONS
 * EDIT/DELETE"), mirroring `PropertyManageControls`'/
 * `FieldManageControls`'s exact pattern (same two-click delete
 * confirmation, same inline-edit shape), with a single label field —
 * this workspace's resource has no second text field the way Insured
 * Properties has an address alongside its policy number. Only
 * rendered by `page.tsx` when the current membership's resource-scoped
 * `can(role, "data:edit", { resourceId: location.id, scopedResourceIds
 * })` is already true — `location-actions.ts`'s Server Actions
 * re-check this independently regardless, same defense-in-depth
 * pattern as every other write path in this app.
 */
export function LocationManageControls({
  locationId,
  initialLabel,
  initialLatitude,
  initialLongitude,
}: LocationManageControlsProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(initialLabel);
  const [latitude, setLatitude] = useState(String(initialLatitude));
  const [longitude, setLongitude] = useState(String(initialLongitude));
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    const lat = Number(latitude);
    const lon = Number(longitude);
    startTransition(async () => {
      const result = await updateLocationAction(locationId, label, lat, lon);
      if (result.ok) {
        setEditing(false);
      } else {
        setError(result.error ?? "Failed to update location.");
      }
    });
  }

  function handleDeleteClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteLocationAction(locationId);
      if (!result.ok) {
        setError(result.error ?? "Failed to delete location.");
        setConfirmingDelete(false);
      }
      // On success, revalidatePath (in the Server Action) refreshes
      // the page and this card simply stops existing.
    });
  }

  const inputStyle = {
    padding: "var(--wv-space-xs) var(--wv-space-sm)",
    borderRadius: "var(--wv-radius-sm)",
    border: "1px solid var(--wv-border)",
    fontFamily: "var(--wv-font-sans)",
    fontSize: "0.9375rem",
  };

  if (!editing) {
    return (
      <div style={{ display: "flex", gap: "var(--wv-space-xs)", marginTop: "var(--wv-space-sm)" }}>
        <Button variant="secondary" onClick={() => setEditing(true)} disabled={isPending}>
          Edit
        </Button>
        <Button variant="destructive" onClick={handleDeleteClick} disabled={isPending}>
          {confirmingDelete ? "Confirm Delete?" : "Delete"}
        </Button>
        {error && (
          <Text variant="caption" style={{ color: "var(--wv-critical)" }}>
            {error}
          </Text>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: "var(--wv-space-sm)", display: "flex", flexDirection: "column", gap: "var(--wv-space-xs)" }}>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Location label"
        style={inputStyle}
      />
      <div style={{ display: "flex", gap: "var(--wv-space-xs)" }}>
        <input
          type="number"
          step="any"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="Latitude"
          style={{ ...inputStyle, width: "7rem" }}
        />
        <input
          type="number"
          step="any"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="Longitude"
          style={{ ...inputStyle, width: "7rem" }}
        />
      </div>
      <div style={{ display: "flex", gap: "var(--wv-space-xs)" }}>
        <Button onClick={handleSave} loading={isPending}>
          Save
        </Button>
        <Button variant="secondary" onClick={() => setEditing(false)} disabled={isPending}>
          Cancel
        </Button>
      </div>
      {error && (
        <Text variant="caption" style={{ color: "var(--wv-critical)" }}>
          {error}
        </Text>
      )}
    </div>
  );
}
