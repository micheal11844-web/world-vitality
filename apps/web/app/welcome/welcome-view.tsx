"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Button,
  Card,
  ConfidenceBadge,
  GuideCharacter,
  Input,
  Skeleton,
  Text,
} from "@world-vitality/ui-components";
import {
  PERSONAS,
  homePlaceLabel,
  personaById,
  type HomePlace,
} from "@world-vitality/identity-service";
import {
  previewInsightAction,
  saveOnboardingAction,
  searchHomePlacesAction,
  skipOnboardingAction,
  type PreviewInsightResult,
} from "../../lib/onboarding-actions";

type Step = "role" | "place" | "insight";

export interface WelcomeViewProps {
  /** Came back from Settings on purpose: "Cancel" returns there, nothing is wiped. */
  isRedo: boolean;
  initialPersonaId: string | null;
  initialPlace: HomePlace | null;
}

const stack = { display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" } as const;

/**
 * The onboarding flow (PRD B.1): three short steps, each one question.
 * 1. Who are you here as? — picks the workspace and which real
 *    interpretation to show.
 * 2. Which place matters most? — optional; a geocoder search.
 * 3. A real, live insight for that place — the "value within the first
 *    minute" — then straight into the matching workspace.
 *
 * Nothing here asks for anything beyond what's needed: no extra profile
 * fields, no payment. Skipping is always one click, and (on a first
 * run) is remembered so the person is never asked twice.
 */
export function WelcomeView({ isRedo, initialPersonaId, initialPlace }: WelcomeViewProps) {
  const [step, setStep] = useState<Step>("role");
  const [personaId, setPersonaId] = useState<string | null>(initialPersonaId);
  const [place, setPlace] = useState<HomePlace | null>(initialPlace);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<HomePlace[]>([]);
  const [searchError, setSearchError] = useState<string | undefined>();

  const [insight, setInsight] = useState<PreviewInsightResult | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();

  const persona = personaById(personaId);
  const destinationName = persona?.workspaceKey ? persona.label : null;

  // Move focus to the new step's heading so keyboard and screen-reader
  // users land at the top of what changed.
  useEffect(() => {
    document.getElementById("welcome-heading")?.focus();
  }, [step]);

  // Step 3: fetch the live insight for the chosen role + place.
  useEffect(() => {
    if (step !== "insight" || !personaId || !place) return;
    let cancelled = false;
    setInsight(null);
    setInsightLoading(true);
    previewInsightAction(personaId, place)
      .then((next) => {
        if (!cancelled) setInsight(next);
      })
      .catch(() => {
        if (!cancelled) setInsight({ ok: false, error: "Couldn't load live data right now." });
      })
      .finally(() => {
        if (!cancelled) setInsightLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, personaId, place]);

  async function searchPlaces(event: FormEvent) {
    event.preventDefault();
    setSearching(true);
    setSearchError(undefined);
    const result = await searchHomePlacesAction(query);
    setSearching(false);
    if (result.ok && result.places) {
      setCandidates(result.places);
      setPlace(result.places[0] ?? null);
    } else {
      setCandidates([]);
      setSearchError(result.error);
    }
  }

  async function finish(withPlace: HomePlace | null) {
    setSaving(true);
    setSaveError(undefined);
    const result = await saveOnboardingAction(personaId, withPlace);
    if (result.ok && result.destination) {
      // Full navigation: the Dashboard's redirect decision depends on
      // the row we just wrote.
      window.location.assign(result.destination);
      return;
    }
    setSaving(false);
    setSaveError(result.error);
  }

  async function skipAll() {
    setSaving(true);
    const result = await skipOnboardingAction();
    if (result.ok) {
      window.location.assign("/dashboard");
      return;
    }
    setSaving(false);
    setSaveError(result.error);
  }

  const orbiMood = searching || insightLoading ? "thinking" : step === "insight" ? "happy" : "idle";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "var(--wv-space-lg)",
        backgroundColor: "var(--wv-bg)",
        fontFamily: "var(--wv-font-sans)",
      }}
    >
      <div style={{ ...stack, width: "100%", maxWidth: "40rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-md)" }}>
          <GuideCharacter mood={orbiMood} wave={step === "role"} size={110} />
          <div style={{ flex: 1 }}>
            <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
              Step {step === "role" ? 1 : step === "place" ? 2 : 3} of 3
            </Text>
            {step === "role" && (
              <Text variant="pageTitle" as="h1" tabIndex={-1} id="welcome-heading">
                Who are you here as?
              </Text>
            )}
            {step === "place" && (
              <Text variant="pageTitle" as="h1" tabIndex={-1} id="welcome-heading">
                Which place matters most?
              </Text>
            )}
            {step === "insight" && (
              <Text variant="pageTitle" as="h1" tabIndex={-1} id="welcome-heading">
                {place ? homePlaceLabel(place) : "Your place"}, right now
              </Text>
            )}
          </div>
        </div>

        {step === "role" && (
          <div style={stack}>
            <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
              I’m Orbi. Pick the one that fits best and I’ll start you in the right place — you can
              change it any time in Settings.
            </Text>
            <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
              <legend style={{ position: "absolute", left: "-9999px" }}>Your role</legend>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(15rem, 1fr))",
                  gap: "var(--wv-space-sm)",
                }}
              >
                {PERSONAS.map((p) => {
                  const selected = personaId === p.id;
                  return (
                    <label
                      key={p.id}
                      style={{
                        display: "block",
                        cursor: "pointer",
                        padding: "var(--wv-space-sm) var(--wv-space-md)",
                        borderRadius: "var(--wv-radius-sm)",
                        border: `2px solid ${selected ? "var(--wv-accent)" : "var(--wv-border)"}`,
                        backgroundColor: "var(--wv-surface)",
                      }}
                    >
                      <input
                        type="radio"
                        name="persona"
                        value={p.id}
                        checked={selected}
                        onChange={() => setPersonaId(p.id)}
                        style={{ marginRight: "0.5rem", accentColor: "var(--wv-accent)" }}
                      />
                      <strong>{p.label}</strong>
                      <span
                        style={{
                          display: "block",
                          color: "var(--wv-text-secondary)",
                          fontSize: "0.875rem",
                          marginLeft: "1.4rem",
                        }}
                      >
                        {p.description}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div style={{ display: "flex", gap: "var(--wv-space-sm)", alignItems: "center" }}>
              <Button onClick={() => setStep("place")} disabled={!personaId}>
                Continue
              </Button>
              {isRedo ? (
                <a href="/settings" style={{ color: "var(--wv-text-secondary)" }}>
                  Cancel
                </a>
              ) : (
                <Button variant="secondary" onClick={skipAll} loading={saving}>
                  Skip for now
                </Button>
              )}
            </div>
          </div>
        )}

        {step === "place" && (
          <div style={stack}>
            <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
              I’ll show you real conditions for it right away. It’s the only thing I ask, and it
              stays on your account — you can change or remove it in Settings.
            </Text>
            <form onSubmit={searchPlaces} style={{ display: "flex", gap: "var(--wv-space-sm)" }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Town, city or region"
                  placeholder="e.g. Ibadan"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  error={searchError}
                />
              </div>
              <Button type="submit" loading={searching} disabled={query.trim().length < 2}>
                Search
              </Button>
            </form>

            {candidates.length > 0 && (
              <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
                <legend style={{ marginBottom: "var(--wv-space-xs)" }}>Choose the right one</legend>
                <div style={{ display: "grid", gap: "var(--wv-space-xs)" }}>
                  {candidates.map((c) => (
                    <label
                      key={`${c.latitude},${c.longitude}`}
                      style={{
                        cursor: "pointer",
                        padding: "var(--wv-space-xs) var(--wv-space-md)",
                        borderRadius: "var(--wv-radius-sm)",
                        border: `2px solid ${
                          place?.latitude === c.latitude && place?.longitude === c.longitude
                            ? "var(--wv-accent)"
                            : "var(--wv-border)"
                        }`,
                        backgroundColor: "var(--wv-surface)",
                      }}
                    >
                      <input
                        type="radio"
                        name="place"
                        checked={place?.latitude === c.latitude && place?.longitude === c.longitude}
                        onChange={() => setPlace(c)}
                        style={{ marginRight: "0.5rem", accentColor: "var(--wv-accent)" }}
                      />
                      {homePlaceLabel(c)}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {candidates.length === 0 && place && (
              <Text variant="body">
                Currently: <strong>{homePlaceLabel(place)}</strong>. Search above to change it.
              </Text>
            )}

            <div style={{ display: "flex", gap: "var(--wv-space-sm)", alignItems: "center" }}>
              <Button variant="secondary" onClick={() => setStep("role")}>
                Back
              </Button>
              <Button onClick={() => setStep("insight")} disabled={!place}>
                Show me
              </Button>
              <Button variant="secondary" onClick={() => finish(null)} loading={saving}>
                Skip the place
              </Button>
            </div>
            {saveError && (
              <Text
                variant="caption"
                role="alert"
                style={{ color: "var(--wv-color-critical-500)" }}
              >
                {saveError}
              </Text>
            )}
          </div>
        )}

        {step === "insight" && (
          <div style={stack}>
            <div aria-live="polite">
              {insightLoading && (
                <Card>
                  <Skeleton />
                  <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
                    Fetching live data…
                  </Text>
                </Card>
              )}
              {!insightLoading && insight && insight.ok && (
                <Card>
                  <Text variant="caption">{insight.title?.toUpperCase()}</Text>
                  <Text variant="body" style={{ margin: "var(--wv-space-xs) 0" }}>
                    {insight.summary}
                  </Text>
                  {!insight.unableToAnswer && insight.confidence && (
                    <ConfidenceBadge level={insight.confidence} showDescription />
                  )}
                  {insight.explanation && (
                    <Text
                      variant="caption"
                      style={{
                        display: "block",
                        color: "var(--wv-text-secondary)",
                        marginTop: "var(--wv-space-sm)",
                      }}
                    >
                      {insight.explanation}
                    </Text>
                  )}
                  {typeof insight.gapCount === "number" && insight.gapCount > 0 && (
                    <Text
                      variant="caption"
                      style={{ display: "block", marginTop: "var(--wv-space-xs)" }}
                    >
                      {insight.gapCount} day(s) had no data available.
                    </Text>
                  )}
                </Card>
              )}
              {!insightLoading && insight && !insight.ok && (
                <Card>
                  <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
                    {insight.error}
                  </Text>
                </Card>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "var(--wv-space-sm)",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Button variant="secondary" onClick={() => setStep("place")}>
                Back
              </Button>
              <Button onClick={() => finish(place)} loading={saving}>
                {destinationName ? `Take me to ${destinationName}` : "Take me to Explorer"}
              </Button>
            </div>
            {saveError && (
              <Text
                variant="caption"
                role="alert"
                style={{ color: "var(--wv-color-critical-500)" }}
              >
                {saveError}
              </Text>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
