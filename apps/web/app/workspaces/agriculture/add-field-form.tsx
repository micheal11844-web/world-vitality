"use client";

import { useState, useTransition } from "react";
import { Button, Card, Input, Text } from "@world-vitality/ui-components";
import { createFieldAction } from "./field-actions";
import { UpgradeLink } from "../../upgrade-link";

/**
 * "Add a field" form (BUILD_PLAN "STAGE — AGRICULTURE FIELDS"). Only
 * rendered by `page.tsx` when `can(role, "data:edit")` is already true
 * server-side — the Server Action re-checks independently regardless,
 * same defense-in-depth pattern as the Team page's invite form.
 *
 * Uses the shared `Input` so the fields are the same 44px height as the
 * submit button beside them (hand-styled inputs were ~28px next to a 44px
 * button, which looked broken on a desktop screen).
 */
export function AddFieldForm() {
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUpgrade(false);
    setSuccess(null);
    const lat = Number(latitude);
    const lon = Number(longitude);
    startTransition(async () => {
      const result = await createFieldAction(name, lat, lon);
      if (result.ok) {
        setSuccess(`"${name}" added.`);
        setName("");
        setLatitude("");
        setLongitude("");
      } else {
        setError(result.error ?? "Failed to add field.");
        setUpgrade(Boolean(result.upgrade));
      }
    });
  }

  return (
    <Card style={{ marginBottom: "var(--wv-space-lg)" }}>
      <Text variant="sectionTitle" as="h2" style={{ marginBottom: "var(--wv-space-sm)" }}>
        Add a field
      </Text>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: "var(--wv-space-sm)",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: "1 1 10rem", maxWidth: "16rem" }}>
          <Input
            id="field-name"
            label="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div style={{ width: "8rem" }}>
          <Input
            id="field-lat"
            label="Latitude"
            type="number"
            step="any"
            required
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
          />
        </div>
        <div style={{ width: "8rem" }}>
          <Input
            id="field-lon"
            label="Longitude"
            type="number"
            step="any"
            required
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />
        </div>
        <Button type="submit" loading={isPending}>
          Add Field
        </Button>
      </form>
      {error && (
        <Text
          variant="caption"
          style={{ display: "block", color: "var(--wv-critical)", marginTop: "var(--wv-space-sm)" }}
        >
          {error}
          {upgrade && <UpgradeLink />}
        </Text>
      )}
      {success && (
        <Text
          variant="caption"
          style={{ display: "block", color: "var(--wv-accent)", marginTop: "var(--wv-space-sm)" }}
        >
          {success}
        </Text>
      )}
    </Card>
  );
}
