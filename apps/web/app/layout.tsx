import type { ReactNode } from "react";
import type { Metadata } from "next";
import "@world-vitality/design-tokens/theme.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://world-vitality.vercel.app"),
  title: "World Vitality",
  description: "World Vitality — See. Understand. Act.",
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "World Vitality",
    description: "World Vitality — See. Understand. Act.",
    images: ["/brand/world-vitality-logo.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: "var(--wv-bg)", color: "var(--wv-text-primary)" }}>
        {children}
      </body>
    </html>
  );
}
