"use client";

import { useId, useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, isLocaleCode, type LocaleCode } from "@world-vitality/i18n";
import { Text } from "@world-vitality/ui-components";
import { useI18n } from "./i18n-provider";
import { setLanguageAction } from "./language-actions";

/** Unicode isolates: keep an Arabic name from reordering the text around it. */
const FSI = "⁨";
const PDI = "⁩";

const selectStyle: CSSProperties = {
  padding: "0.5rem 0.75rem",
  borderRadius: "var(--wv-radius-sm)",
  border: "1px solid var(--wv-border)",
  backgroundColor: "var(--wv-surface)",
  color: "var(--wv-text-primary)",
  fontFamily: "var(--wv-font-sans)",
  fontSize: "0.875rem",
};

/**
 * The language picker. Each language is listed **in its own name and
 * script** ("Español", "العربية") so a person can find theirs even when
 * the page is in a language they can't read — and any language that
 * hasn't been checked by a native speaker is labelled as a draft right
 * in the list, not hidden in a footnote.
 *
 * Choosing one saves it (device cookie always, account too when signed
 * in) and refreshes the current page in place: nothing the person has
 * typed or chosen on the page is lost, which matters most on the
 * onboarding screens. If the save fails the page says so and the list
 * goes back to the language actually in use.
 *
 * `compact` is the bare control with an accessible name (for the
 * Welcome screen's corner); the default adds a visible label and, when
 * a status is showing, the result.
 */
export function LanguageSwitcher({ compact = false, id }: { compact?: boolean; id?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const [choice, setChoice] = useState<LocaleCode | null>(null);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    if (!isLocaleCode(value) || value === locale) return;
    setChoice(value);
    setStatus("idle");
    setError(undefined);
    startTransition(async () => {
      const result = await setLanguageAction(value);
      if (result.ok) {
        setStatus("saved");
        router.refresh();
      } else {
        setChoice(null);
        setStatus("error");
        setError(result.error);
      }
    });
  }

  const select = (
    <select
      id={selectId}
      value={choice ?? locale}
      disabled={pending}
      aria-label={compact ? t("settings.language.title") : undefined}
      onChange={(e) => onChange(e.target.value)}
      style={selectStyle}
    >
      {LOCALES.map((l) => (
        <option key={l.code} value={l.code} lang={l.code}>
          {FSI}
          {l.nativeName}
          {PDI}
          {l.review === "draft" ? ` · ${t("settings.language.draftTag")}` : ""}
        </option>
      ))}
    </select>
  );

  if (compact) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-xs)" }}>
        {select}
        {status === "error" && error && (
          <Text variant="caption" role="alert" style={{ color: "var(--wv-color-critical-500)" }}>
            {error}
          </Text>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-xs)" }}>
      <label
        htmlFor={selectId}
        style={{ fontFamily: "var(--wv-font-sans)", fontWeight: 600, fontSize: "0.875rem" }}
      >
        {t("settings.language.label")}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--wv-space-md)" }}>
        {select}
        {status === "saved" && !pending && (
          <Text variant="caption" role="status" style={{ color: "var(--wv-text-secondary)" }}>
            {t("settings.language.saved")}
          </Text>
        )}
      </div>
      {status === "error" && error && (
        <Text variant="caption" role="alert" style={{ color: "var(--wv-color-critical-500)" }}>
          {error}
        </Text>
      )}
    </div>
  );
}
