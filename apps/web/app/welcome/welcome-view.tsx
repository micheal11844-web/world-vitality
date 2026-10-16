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
import { useI18n } from "../../lib/i18n/i18n-provider";
import { LanguageSwitcher } from "../../lib/i18n/language-switcher";
import { personaDescription, personaLabel, workspaceName } from "../../lib/i18n/labels";
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
  const { t, locale } = useI18n();
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
  // Where "Take me to …" goes: the role's *workspace* (not the role's
  // own name), or the Explorer for a role with no workspace of its own.
  const destinationName = persona?.workspaceKey ? workspaceName(persona.workspaceKey, t) : null;

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
        if (!cancelled) setInsight({ ok: false, error: t("welcome.insight.failed") });
      })
      .finally(() => {
        if (!cancelled) setInsightLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `t` is deliberately not a dependency: changing language mid-step
    // must not refetch live data, only re-word what's already shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const englishOnly = locale === "en" ? {} : ({ lang: "en", dir: "ltr" } as const);
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
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <LanguageSwitcher compact />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-md)" }}>
          <GuideCharacter mood={orbiMood} wave={step === "role"} size={110} />
          <div style={{ flex: 1 }}>
            <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
              {t("welcome.step", {
                current: step === "role" ? 1 : step === "place" ? 2 : 3,
                total: 3,
              })}
            </Text>
            {step === "role" && (
              <Text variant="pageTitle" as="h1" tabIndex={-1} id="welcome-heading">
                {t("welcome.role.title")}
              </Text>
            )}
            {step === "place" && (
              <Text variant="pageTitle" as="h1" tabIndex={-1} id="welcome-heading">
                {t("welcome.place.title")}
              </Text>
            )}
            {step === "insight" && (
              <Text variant="pageTitle" as="h1" tabIndex={-1} id="welcome-heading">
                {place
                  ? t("welcome.insight.title", { place: homePlaceLabel(place) })
                  : t("welcome.insight.titleFallback")}
              </Text>
            )}
          </div>
        </div>

        {step === "role" && (
          <div style={stack}>
            <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
              {t("welcome.role.intro")}
            </Text>
            <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
              <legend
                style={{
                  // Visually hidden but still read aloud. (Not an off-screen
                  // offset: in a right-to-left page that pushes the page wider.)
                  position: "absolute",
                  width: 1,
                  height: 1,
                  padding: 0,
                  margin: -1,
                  overflow: "hidden",
                  clip: "rect(0, 0, 0, 0)",
                  whiteSpace: "nowrap",
                  border: 0,
                }}
              >
                {t("welcome.role.legend")}
              </legend>
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
                        style={{ marginInlineEnd: "0.5rem", accentColor: "var(--wv-accent)" }}
                      />
                      <strong>{personaLabel(p.id, t, p.label)}</strong>
                      <span
                        style={{
                          display: "block",
                          color: "var(--wv-text-secondary)",
                          fontSize: "0.875rem",
                          marginInlineStart: "1.4rem",
                        }}
                      >
                        {personaDescription(p.id, t, p.description)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div style={{ display: "flex", gap: "var(--wv-space-sm)", alignItems: "center" }}>
              <Button onClick={() => setStep("place")} disabled={!personaId}>
                {t("common.continue")}
              </Button>
              {isRedo ? (
                <a href="/settings" style={{ color: "var(--wv-text-secondary)" }}>
                  {t("common.cancel")}
                </a>
              ) : (
                <Button variant="secondary" onClick={skipAll} loading={saving}>
                  {t("common.skipForNow")}
                </Button>
              )}
            </div>
          </div>
        )}

        {step === "place" && (
          <div style={stack}>
            <Text variant="body" style={{ color: "var(--wv-text-secondary)" }}>
              {t("welcome.place.intro")}
            </Text>
            <form onSubmit={searchPlaces} style={{ display: "flex", gap: "var(--wv-space-sm)" }}>
              <div style={{ flex: 1 }}>
                <Input
                  label={t("welcome.place.inputLabel")}
                  placeholder={t("welcome.place.inputPlaceholder")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  error={searchError}
                />
              </div>
              <Button type="submit" loading={searching} disabled={query.trim().length < 2}>
                {t("welcome.place.search")}
              </Button>
            </form>

            {candidates.length > 0 && (
              <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
                <legend style={{ marginBottom: "var(--wv-space-xs)" }}>
                  {t("welcome.place.choose")}
                </legend>
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
                        style={{ marginInlineEnd: "0.5rem", accentColor: "var(--wv-accent)" }}
                      />
                      {homePlaceLabel(c)}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {candidates.length === 0 && place && (
              <Text variant="body">
                {t("welcome.place.current", { place: homePlaceLabel(place) })}
              </Text>
            )}

            <div style={{ display: "flex", gap: "var(--wv-space-sm)", alignItems: "center" }}>
              <Button variant="secondary" onClick={() => setStep("role")}>
                {t("common.back")}
              </Button>
              <Button onClick={() => setStep("insight")} disabled={!place}>
                {t("welcome.place.showMe")}
              </Button>
              <Button variant="secondary" onClick={() => finish(null)} loading={saving}>
                {t("welcome.place.skipPlace")}
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
                    {t("welcome.insight.fetching")}
                  </Text>
                </Card>
              )}
              {!insightLoading && insight && insight.ok && (
                <Card>
                  {/* The interpretation is generated in English and not
                      translated yet, so it says so rather than posing as
                      the page's language (and keeps its own direction). */}
                  <div {...englishOnly}>
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
                  </div>
                  {typeof insight.gapCount === "number" && insight.gapCount > 0 && (
                    <Text
                      variant="caption"
                      style={{ display: "block", marginTop: "var(--wv-space-xs)" }}
                    >
                      {t("dashboard.insightGaps", { count: insight.gapCount })}
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
                {t("common.back")}
              </Button>
              <Button onClick={() => finish(place)} loading={saving}>
                {destinationName
                  ? t("welcome.insight.takeMeTo", { destination: destinationName })
                  : t("welcome.insight.takeMeToExplorer")}
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
