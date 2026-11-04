"use client";

import { useState, useTransition } from "react";
import { Button, Input, Text } from "@world-vitality/ui-components";
import { updateFieldAction, deleteFieldAction } from "./field-actions";
import { useI18n } from "../../../lib/i18n/i18n-provider";

export interface FieldManageControlsProps {
  fieldId: string;
  initialName: string;
  initialLatitude: number;
  initialLongitude: number;
}

/**
 * Edit/delete controls for one field card (BUILD_PLAN "STAGE —
 * AGRICULTURE FIELDS FOLLOW-UP: EDIT/DELETE"), closing the gap the
 * original Agriculture Fields stage explicitly deferred. Only rendered
 * by `page.tsx` when the current membership's resource-scoped
 * `can(role, "data:edit", { resourceId: field.id, scopedResourceIds })`
 * is already true — `field-actions.ts`'s Server Actions re-check this
 * independently regardless, same defense-in-depth pattern as every
 * other write path in this app.
 *
 * Delete requires two clicks (button becomes "Confirm Delete?" after
 * the first) rather than a native `confirm()` dialog, consistent with
 * this app's design system rather than an unstyled browser popup.
 */
export function FieldManageControls({
  fieldId,
  initialName,
  initialLatitude,
  initialLongitude,
}: FieldManageControlsProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
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
      const result = await updateFieldAction(fieldId, name, lat, lon);
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
      const result = await deleteFieldAction(fieldId);
      if (!result.ok) {
        setError(result.error ?? t("common.genericError"));
        setConfirmingDelete(false);
      }
      // On success, revalidatePath (in the Server Action) refreshes
      // the page and this card simply stops existing — no local
      // "removed" state needed.
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
      <Input label={t("resource.name")} value={name} onChange={(e) => setName(e.target.value)} />
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
