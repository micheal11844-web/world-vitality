"use client";

import { useState, useTransition } from "react";
import { Button, Card, Input, Text } from "@world-vitality/ui-components";
import { createPropertyAction } from "./property-actions";
import { UpgradeLink } from "../../upgrade-link";
import { useI18n } from "../../../lib/i18n/i18n-provider";

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
  const { t } = useI18n();
  const [policyNumber, setPolicyNumber] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
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
      const result = await createPropertyAction(policyNumber, propertyAddress, lat, lon);
      if (result.ok) {
        setSuccess(t("insurance.add.success", { name: policyNumber }));
        setPolicyNumber("");
        setPropertyAddress("");
        setLatitude("");
        setLongitude("");
      } else {
        setError(result.error ?? t("common.genericError"));
        setUpgrade(Boolean(result.upgrade));
      }
    });
  }

  return (
    <Card style={{ marginBottom: "var(--wv-space-lg)" }}>
      <Text variant="sectionTitle" as="h2" style={{ marginBottom: "var(--wv-space-sm)" }}>
        {t("insurance.add.title")}
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
            label={t("insurance.policyNumber")}
            required
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
          />
        </div>
        <div style={{ flex: "1 1 12rem", maxWidth: "20rem" }}>
          <Input
            id="property-address"
            label={t("insurance.address")}
            required
            value={propertyAddress}
            onChange={(e) => setPropertyAddress(e.target.value)}
          />
        </div>
        <div style={{ width: "8rem" }}>
          <Input
            id="property-lat"
            label={t("resource.latitude")}
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
            label={t("resource.longitude")}
            type="number"
            step="any"
            required
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />
        </div>
        <Button type="submit" loading={isPending}>
          {t("insurance.add.button")}
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
