"use client";

import { useState, useTransition } from "react";
import { Button, Card, Text } from "@world-vitality/ui-components";
import { createPropertyAction } from "./property-actions";

/**
 * "Add an insured property" form (BUILD_PLAN "STAGE — INSURANCE
 * FOLLOW-UP: INSURED PROPERTIES"), mirroring `AddFieldForm`'s exact
 * pattern. Only rendered by `page.tsx` when `can(role, "data:edit")`
 * is already true server-side — the Server Action re-checks
 * independently regardless, same defense-in-depth pattern as every
 * other write path in this app.
 */
export function AddPropertyForm() {
  const [policyNumber, setPolicyNumber] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
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
      const result = await createPropertyAction(policyNumber, propertyAddress, lat, lon);
      if (result.ok) {
        setSuccess(`"${policyNumber}" added.`);
        setPolicyNumber("");
        setPropertyAddress("");
        setLatitude("");
        setLongitude("");
      } else {
        setError(result.error ?? "Failed to add property.");
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
        Add an insured property
      </Text>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: "var(--wv-space-sm)", flexWrap: "wrap", alignItems: "flex-end" }}
      >
        <div>
          <Text variant="caption" style={{ display: "block", marginBottom: "var(--wv-space-xs)" }}>
            <label htmlFor="property-policy-number">Policy Number</label>
          </Text>
          <input
            id="property-policy-number"
            required
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
            style={{ ...inputStyle, minWidth: "8rem" }}
          />
        </div>
        <div>
          <Text variant="caption" style={{ display: "block", marginBottom: "var(--wv-space-xs)" }}>
            <label htmlFor="property-address">Address</label>
          </Text>
          <input
            id="property-address"
            required
            value={propertyAddress}
            onChange={(e) => setPropertyAddress(e.target.value)}
            style={{ ...inputStyle, minWidth: "12rem" }}
          />
        </div>
        <div>
          <Text variant="caption" style={{ display: "block", marginBottom: "var(--wv-space-xs)" }}>
            <label htmlFor="property-lat">Latitude</label>
          </Text>
          <input
            id="property-lat"
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
            <label htmlFor="property-lon">Longitude</label>
          </Text>
          <input
            id="property-lon"
            type="number"
            step="any"
            required
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            style={{ ...inputStyle, width: "8rem" }}
          />
        </div>
        <Button type="submit" loading={isPending}>
          Add Property
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
