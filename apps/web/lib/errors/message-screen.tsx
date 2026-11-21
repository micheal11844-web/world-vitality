import type { CSSProperties, ReactNode, Ref } from "react";

/**
 * One full-page message with a heading, a sentence and a row of buttons: the shape of the error
 * page and the "page not found" page. Plain elements and inline styles on purpose: it has to draw
 * when the page tree around it has failed, even (for the whole-app error page) when the theme
 * stylesheet has not loaded, so every colour has a fallback.
 */
export interface ScreenAction {
  label: string;
  /** A link when given, otherwise a button that calls `onClick`. */
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}

const FONT = 'var(--wv-font-sans, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif)';

const buttonBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "2.75rem",
  padding: "0 1.25rem",
  borderRadius: "var(--wv-radius-sm, 0.375rem)",
  font: "inherit",
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
  boxSizing: "border-box",
};
const primaryStyle: CSSProperties = {
  ...buttonBase,
  background: "var(--wv-accent, #1f6f54)",
  border: "1px solid var(--wv-accent, #1f6f54)",
  color: "var(--wv-color-neutral-50, #ffffff)",
};
const secondaryStyle: CSSProperties = {
  ...buttonBase,
  background: "var(--wv-surface, #ffffff)",
  border: "1px solid var(--wv-border, #d9d6cd)",
  color: "var(--wv-text-primary, #1d2125)",
};

export function MessageScreen({
  lang,
  dir,
  title,
  body,
  reference,
  actions,
  headingRef,
}: {
  lang: string;
  dir: "ltr" | "rtl";
  title: string;
  body: string;
  reference?: string;
  actions: ScreenAction[];
  /** Lets the error page move keyboard focus to the heading so a screen reader announces it. */
  headingRef?: Ref<HTMLHeadingElement>;
}): ReactNode {
  return (
    <div lang={lang} dir={dir}>
      <main
        style={{
          boxSizing: "border-box",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "var(--wv-bg, #fbfaf7)",
          color: "var(--wv-text-primary, #1d2125)",
          fontFamily: FONT,
        }}
      >
        <div style={{ maxWidth: "30rem", textAlign: "start" }}>
          {/* A plain <img>: this must not depend on the image optimiser while the app is failing. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/world-vitality-mark.png"
            alt=""
            width={900}
            height={560}
            style={{ height: "2.5rem", width: "auto", marginBottom: "1.5rem" }}
          />
          <h1
            ref={headingRef}
            // Focus is moved here by script (not by the person), so no ring is wanted around it.
            tabIndex={-1}
            style={{ margin: "0 0 0.75rem", fontSize: "1.75rem", lineHeight: 1.2, outline: "none" }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: "0 0 1.5rem",
              fontSize: "1rem",
              lineHeight: 1.5,
              color: "var(--wv-text-secondary, #5b6660)",
            }}
          >
            {body}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {actions.map((action) =>
              action.href !== undefined ? (
                <a
                  key={action.label}
                  href={action.href}
                  style={action.primary ? primaryStyle : secondaryStyle}
                >
                  {action.label}
                </a>
              ) : (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  style={action.primary ? primaryStyle : secondaryStyle}
                >
                  {action.label}
                </button>
              ),
            )}
          </div>
          {reference && (
            <p
              style={{
                margin: "1.5rem 0 0",
                fontSize: "0.8125rem",
                color: "var(--wv-text-secondary, #5b6660)",
              }}
            >
              {reference}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
