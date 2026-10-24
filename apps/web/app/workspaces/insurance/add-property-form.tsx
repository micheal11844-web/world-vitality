"use client";

import { useState, useTransition } from "react";
import { Button, Card, Input, Text } from "@world-vitality/ui-components";
import { createPropertyAction } from "./property-actions";

/**
 * "Add an insured property" form (BUILD_PLAN "STAGE — INSURANCE
 * FOLLOW-UP: INSURED PROPERTIES"), mirroring `AddFieldForm`'s exact
 * pattern. Only rendered by `page.tsx` when `can(role, "data:edit")`
 * is already true server-side — the Server Action re-checks
 * independently regardless, same defense-in-depth pattern as every
 * other write path in this app.
 *
 * Uses the shared `Input`, so the fields match the submit button's 44px
 * height instead of sitting short beside it.
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

  return (
    <Card style={{ marginBottom: "var(--wv-space-lg)" }}>
      <Text variant="sectionTitle" as="h2" style={{ marginBottom: "var(--wv-space-sm)" }}>
        Add an insured property
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
        <div style={{ flex: "1 1 9rem", maxWidth: "12rem" }}>
          <Input
            id="property-policy-number"
            label="Policy Number"
            required
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
          />
        </div>
        <div style={{ flex: "1 1 12rem", maxWidth: "20rem" }}>
          <Input
            id="property-address"
            label="Address"
            required
            value={propertyAddress}
            onChange={(e) => setPropertyAddress(e.target.value)}
          />
        </div>
        <div style={{ width: "8rem" }}>
          <Input
            id="property-lat"
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
            id="property-lon"
            label="Longitude"
            type="number"
            step="any"
            required
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />
        </div>
        <Button type="submit" loading={isPending}>
          Add Property
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
