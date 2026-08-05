import Link from "next/link";
import { Button, Text } from "@world-vitality/ui-components";

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--wv-space-lg)",
      }}
    >
      <div style={{ maxWidth: "32rem", textAlign: "left" }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: "var(--wv-accent)",
            marginBottom: "var(--wv-space-lg)",
          }}
        />
        <Text variant="pageTitle" as="h1">
          World Vitality
        </Text>
        <Text
          variant="body"
          style={{
            color: "var(--wv-text-secondary)",
            margin: "var(--wv-space-sm) 0 var(--wv-space-lg)",
          }}
        >
          Real-time environmental intelligence, interpreted plainly.
        </Text>
        <Link href="/login" style={{ textDecoration: "none" }}>
          <Button>Sign in</Button>
        </Link>
      </div>
    </main>
  );
}
