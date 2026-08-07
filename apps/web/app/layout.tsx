import type { ReactNode } from "react";
import "@world-vitality/design-tokens/theme.css";

export const metadata = {
  title: "World Vitality",
  description: "World Vitality",
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
