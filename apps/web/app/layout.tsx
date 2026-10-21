import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "@world-vitality/design-tokens/theme.css";
import { PwaSupport } from "../lib/pwa/pwa-support";

export const metadata: Metadata = {
  metadataBase: new URL("https://world-vitality.vercel.app"),
  title: "World Vitality",
  description: "World Vitality — See. Understand. Act.",
  icons: {
    icon: "/icon.png",
    apple: "/icons/apple-touch-icon.png",
  },
  // When added to an iPhone/iPad home screen, open like an app. (The
  // manifest, `app/manifest.ts`, covers Android and desktop.)
  appleWebApp: {
    capable: true,
    title: "World Vitality",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "World Vitality",
    description: "World Vitality — See. Understand. Act.",
    images: ["/brand/world-vitality-logo.png"],
  },
};

/**
 * `device-width` is what makes the phone layout (see `AppShell`) apply
 * at all — and the theme colour tints a phone browser's toolbar to the
 * page background in both colour schemes (the two values are `--wv-bg`'s
 * light and dark values in `theme.css`).
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#14171a" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: "var(--wv-bg)", color: "var(--wv-text-primary)" }}>
        <PwaSupport />
        {children}
      </body>
    </html>
  );
}
