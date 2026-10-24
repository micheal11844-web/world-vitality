"use client";

import { useState, useTransition } from "react";
import { Button, Card, Input, Text } from "@world-vitality/ui-components";
import { createLocationAction } from "./location-actions";

/**
 * "Add a monitored location" form (BUILD_PLAN "STAGE — GOVERNMENT &
 * NGOS FOLLOW-UP: MONITORED LOCATIONS"), mirroring
 * `insurance/add-property-form.tsx`'s exact pattern. Only rendered by
 * `page.tsx` when `can(role, "data:edit")` is already true server-side
 * — the Server Action re-checks independently regardless, same
 * defense-in-depth pattern as every other write path in this app.
 *
 * Uses the shared `Input`, so the fields match the submit button's 44px
 * height instead of sitting short beside it.
 */
export function AddLocationForm() {
  const [label, setLabel] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const lat = Number(latitude);
    const lon = Number(longitude);
    startTransition(async () => {
      const result = await createLocationAction(label, lat, lon);
      if (result.ok) {
        setSuccess(`"${label}" added.`);
        setLabel("");
        setLatitude("");
        setLongitude("");
      } else {
        setError(result.error ?? "Failed to add location.");
      }
    });
  }

  return (
    <Card style={{ marginBottom: "var(--wv-space-lg)" }}>
      <Text variant="sectionTitle" as="h2" style={{ marginBottom: "var(--wv-space-sm)" }}>
        Add a monitored location
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
        <div style={{ flex: "1 1 12rem", maxWidth: "20rem" }}>
          <Input
            id="location-label"
            label="Label"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div style={{ width: "8rem" }}>
          <Input
            id="location-lat"
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
            id="location-lon"
            label="Longitude"
            type="number"
            step="any"
            required
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />
        </div>
        <Button type="submit" loading={isPending}>
          Add Location
        </Button>
      </form>
      {error && (
        <Text
          variant="caption"
          style={{ display: "block", color: "var(--wv-critical)", marginTop: "var(--wv-space-sm)" }}
        >
          {error}
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
