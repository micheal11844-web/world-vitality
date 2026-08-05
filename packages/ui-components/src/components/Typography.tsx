import type { HTMLAttributes, ReactNode, ElementType } from "react";

type TextVariant = "caption" | "body" | "bodyLarge" | "sectionTitle" | "pageTitle" | "display";

const VARIANT_STYLE: Record<TextVariant, React.CSSProperties> = {
  caption: { fontSize: "0.8125rem", lineHeight: 1.5, color: "var(--wv-text-secondary)" },
  body: { fontSize: "1rem", lineHeight: 1.5 },
  bodyLarge: { fontSize: "1.125rem", lineHeight: 1.5 },
  sectionTitle: { fontSize: "1.375rem", lineHeight: 1.25, fontWeight: 600 },
  pageTitle: { fontSize: "1.75rem", lineHeight: 1.25, fontWeight: 600 },
  display: { fontSize: "2.25rem", lineHeight: 1.25, fontWeight: 600 },
};

const DEFAULT_TAG: Record<TextVariant, ElementType> = {
  caption: "span",
  body: "p",
  bodyLarge: "p",
  sectionTitle: "h2",
  pageTitle: "h1",
  display: "h1",
};

export interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  /** Override the rendered tag — keep the semantic heading level
   *  correct for the page's actual outline even when the *visual*
   *  size needs to differ (e.g. an `h3` styled as `sectionTitle`). */
  as?: ElementType;
  children: ReactNode;
}

/**
 * The full type scale as one component (ticket 5.2) — deliberately a
 * single `Text` with a `variant` prop, not six separate components, so
 * the limited scale (Section 13) is structurally hard to bypass: there's
 * no `<Heading1>` to reach for when what's needed is a one-off size.
 */
export function Text({ variant = "body", as, children, style, ...rest }: TextProps) {
  const Tag = as ?? DEFAULT_TAG[variant];
  return (
    <Tag
      style={{
        fontFamily: "var(--wv-font-sans)",
        color: "var(--wv-text-primary)",
        margin: 0,
        ...VARIANT_STYLE[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
