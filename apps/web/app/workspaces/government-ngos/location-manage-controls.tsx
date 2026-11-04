"use client";

import { useState, useTransition } from "react";
import { Button, Input, Text } from "@world-vitality/ui-components";
import { updateLocationAction, deleteLocationAction } from "./location-actions";
import { useI18n } from "../../../lib/i18n/i18n-provider";

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
  const { t } = useI18n();
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
        setError(result.error ?? t("common.genericError"));
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
        setError(result.error ?? t("common.genericError"));
        setConfirmingDelete(false);
      }
      // On success, revalidatePath (in the Server Action) refreshes
      // the page and this card simply stops existing.
    });
  }

  if (!editing) {
    return (
      <div style={{ display: "flex", gap: "var(--wv-space-xs)", marginTop: "var(--wv-space-sm)" }}>
        <Button variant="secondary" onClick={() => setEditing(true)} disabled={isPending}>
          {t("resource.edit")}
        </Button>
        <Button variant="destructive" onClick={handleDeleteClick} disabled={isPending}>
          {confirmingDelete ? t("resource.confirmDelete") : t("resource.delete")}
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
    <div
      style={{
        marginTop: "var(--wv-space-sm)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--wv-space-xs)",
      }}
    >
      <Input
        label={t("gov.locationLabel")}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <div style={{ display: "flex", gap: "var(--wv-space-xs)" }}>
        <Input
          label={t("resource.latitude")}
          type="number"
          step="any"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          style={{ width: "7rem" }}
        />
        <Input
          label={t("resource.longitude")}
          type="number"
          step="any"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          style={{ width: "7rem" }}
        />
      </div>
      <div style={{ display: "flex", gap: "var(--wv-space-xs)" }}>
        <Button onClick={handleSave} loading={isPending}>
          {t("resource.save")}
        </Button>
        <Button variant="secondary" onClick={() => setEditing(false)} disabled={isPending}>
          {t("common.cancel")}
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
