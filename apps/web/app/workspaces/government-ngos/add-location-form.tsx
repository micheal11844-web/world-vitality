"use client";

import { useState, useTransition } from "react";
import { Button, Card, Text } from "@world-vitality/ui-components";
import { createLocationAction } from "./location-actions";

/**
 * "Add a monitored location" form (BUILD_PLAN "STAGE — GOVERNMENT &
 * NGOS FOLLOW-UP: MONITORED LOCATIONS"), mirroring
 * `insurance/add-property-form.tsx`'s exact pattern. Only rendered by
 * `page.tsx` when `can(role, "data:edit")` is already true server-side
 * — the Server Action re-checks independently regardless, same
 * defense-in-depth pattern as every other write path in this app.
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

  const inputStyle = {
    padding: "var(--wv-space-xs) var(--wv-space-sm)",
    borderRadius: "var(--wv-radius-sm)",
    border: "1px solid var(--wv-border)",
    fontFamily: "var(--wv-font-sans)",
    fontSize: "0.9375rem",
  };

  return (
    <Card style={{ marginBottom: "var(--wv-space-lg)" }}>
      <Text variant="sectionTitle" as="h2" style={{ marginBottom: "var(--wv-space-sm)" }}>
        Add a monitored location
      </Text>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: "var(--wv-space-sm)", flexWrap: "wrap", alignItems: "flex-end" }}
      >
        <div>
          <Text variant="caption" style={{ display: "block", marginBottom: "var(--wv-space-xs)" }}>
            <label htmlFor="location-label">Label</label>
          </Text>
          <input
            id="location-label"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{ ...inputStyle, minWidth: "12rem" }}
          />
        </div>
        <div>
          <Text variant="caption" style={{ display: "block", marginBottom: "var(--wv-space-xs)" }}>
            <label htmlFor="location-lat">Latitude</label>
          </Text>
          <input
            id="location-lat"
            type="number"
            step="any"
            required
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            style={{ ...inputStyle, width: "8rem" }}
          />
        </div>
        <div>
          <Text variant="caption" style={{ display: "block", marginBottom: "var(--wv-space-xs)" }}>
            <label htmlFor="location-lon">Longitude</label>
          </Text>
          <input
            id="location-lon"
            type="number"
            step="any"
            required
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            style={{ ...inputStyle, width: "8rem" }}
          />
        </div>
        <Button type="submit" loading={isPending}>
          Add Location
        </Button>
      </form>
      {error && (
        <Text variant="caption" style={{ display: "block", color: "var(--wv-critical)", marginTop: "var(--wv-space-sm)" }}>
          {error}
        </Text>
      )}
      {success && (
        <Text variant="caption" style={{ display: "block", color: "var(--wv-accent)", marginTop: "var(--wv-space-sm)" }}>
          {success}
        </Text>
      )}
    </Card>
  );
}
