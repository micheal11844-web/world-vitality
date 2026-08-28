"use client";

import { useState, useTransition } from "react";
import { Button, Card, Text } from "@world-vitality/ui-components";
import { createFieldAction } from "./field-actions";

/**
 * "Add a field" form (BUILD_PLAN "STAGE — AGRICULTURE FIELDS"). Only
 * rendered by `page.tsx` when `can(role, "data:edit")` is already true
 * server-side — the Server Action re-checks independently regardless,
 * same defense-in-depth pattern as the Team page's invite form.
 */
export function AddFieldForm() {
  const [name, setName] = useState("");
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
      const result = await createFieldAction(name, lat, lon);
      if (result.ok) {
        setSuccess(`"${name}" added.`);
        setName("");
        setLatitude("");
        setLongitude("");
      } else {
        setError(result.error ?? "Failed to add field.");
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
        style={{ display: "flex", gap: "var(--wv-space-sm)", flexWrap: "wrap", alignItems: "flex-end" }}
      >
        <div>
          <Text variant="caption" style={{ display: "block", marginBottom: "var(--wv-space-xs)" }}>
            <label htmlFor="field-name">Name</label>
          </Text>
          <input
            id="field-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: "var(--wv-space-xs) var(--wv-space-sm)",
              borderRadius: "var(--wv-radius-sm)",
              border: "1px solid var(--wv-border)",
              fontFamily: "var(--wv-font-sans)",
              fontSize: "0.9375rem",
              minWidth: "10rem",
            }}
          />
        </div>
        <div>
          <Text variant="caption" style={{ display: "block", marginBottom: "var(--wv-space-xs)" }}>
            <label htmlFor="field-lat">Latitude</label>
          </Text>
          <input
            id="field-lat"
            type="number"
            step="any"
            required
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            style={{
              padding: "var(--wv-space-xs) var(--wv-space-sm)",
              borderRadius: "var(--wv-radius-sm)",
              border: "1px solid var(--wv-border)",
              fontFamily: "var(--wv-font-sans)",
              fontSize: "0.9375rem",
              width: "8rem",
            }}
          />
        </div>
        <div>
          <Text variant="caption" style={{ display: "block", marginBottom: "var(--wv-space-xs)" }}>
            <label htmlFor="field-lon">Longitude</label>
          </Text>
          <input
            id="field-lon"
            type="number"
            step="any"
            required
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            style={{
              padding: "var(--wv-space-xs) var(--wv-space-sm)",
              borderRadius: "var(--wv-radius-sm)",
              border: "1px solid var(--wv-border)",
              fontFamily: "var(--wv-font-sans)",
              fontSize: "0.9375rem",
              width: "8rem",
            }}
          />
        </div>
        <Button type="submit" loading={isPending}>
          Add Field
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
