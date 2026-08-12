"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Button,
  Card,
  Input,
  Text,
  Checkbox,
  GuideCharacter,
  AuthIllustration,
  PasswordStrengthMeter,
  type GuideCharacterMood,
} from "@world-vitality/ui-components";
import {
  requestMagicLinkAction,
  signInWithPasswordAction,
  signUpWithPasswordAction,
  signInWithGoogleAction,
} from "../../lib/actions";

/**
 * GuideCharacter3D touches browser globals (document, canvas) during
 * module import — it must never be server-rendered, even though it's
 * a "use client" component (that alone doesn't prevent Next's initial
 * server-side pass from evaluating its module). `ssr: false` is
 * required, not optional — see the component's own doc comment for
 * the full reasoning.
 *
 * **Imports from `@world-vitality/ui-components/GuideCharacter3D`, a
 * dedicated subpath — NOT the package's main barrel export.** Found
 * this the hard way: importing via the shared barrel
 * (`@world-vitality/ui-components`, the same module every other page
 * also statically imports for Button/Card/etc.) caused webpack to
 * bundle Three.js/@react-three/fiber into the SHARED chunk used by
 * every route, not just this dynamically-loaded one — every
 * page's First Load JS jumped by ~230kB, not just `/login`'s,
 * completely defeating the point of `ssr:false`/code-splitting this in
 * the first place. Caught by actually inspecting `next build`'s
 * real per-route bundle sizes before considering this done, not
 * assuming the dynamic import "just worked" because the build
 * succeeded. The package.json `exports` map has a matching
 * `"./GuideCharacter3D"` entry pointing directly at the compiled
 * component file, isolated from the barrel's module graph.
 *
 * The `loading` fallback is deliberately static (idle mood, no wave)
 * rather than wired to live `mood`/`wave` state: `next/dynamic`'s
 * `loading` render function's exact prop-passthrough behavior wasn't
 * something to guess at a second time after the CSP incident, and the
 * loading window here is a small bundle's worth of JS — typically well
 * under a second — so a static fallback during that brief window is
 * low-stakes, not a real UX gap.
 */
const GuideCharacter3D = dynamic(
  () =>
    import("@world-vitality/ui-components/GuideCharacter3D").then((mod) => mod.GuideCharacter3D),
  { ssr: false, loading: () => <GuideCharacter mood="idle" /> },
);

/**
 * Maps the form's real states onto the Guide Character's moods (Stage
 * 9, ticket 9.3). Deliberate 1:1 mapping to state that already exists,
 * not new state invented just for the character.
 */
function moodFor(status: "idle" | "sending" | "sent" | "error"): GuideCharacterMood {
  switch (status) {
    case "sending":
      return "thinking";
    case "sent":
      return "happy";
    case "error":
      return "concerned";
    case "idle":
    default:
      return "idle";
  }
}

const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  missing_token: "That sign-in link looks incomplete. Please request a new one.",
  verification_failed:
    "That sign-in link has expired or already been used. Please request a new one.",
  oauth_failed: "Google sign-in didn't go through. Please try again.",
  oauth_not_configured:
    "Google sign-in isn't set up yet on this deployment. Use email sign-in for now.",
};

type AuthMode = "link" | "password";
type PasswordSubMode = "signin" | "signup";

function GoogleIcon() {
  // Inline, minimal — Google's own multi-color "G" mark, widely
  // recognized as the standard "Continue with Google" affordance
  // (researched convention: an unmistakable, brand-recognizable icon
  // rather than a generic OAuth glyph).
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("link");
  const [passwordSubMode, setPasswordSubMode] = useState<PasswordSubMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | undefined>();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Surfaces a failure from the /auth/callback redirect — previously
  // this silently landed back on a blank login form with zero
  // explanation.
  useEffect(() => {
    const callbackError = searchParams.get("error");
    if (callbackError) {
      setStatus("error");
      setError(
        CALLBACK_ERROR_MESSAGES[callbackError] ??
          "Something went wrong. Please request a new sign-in link.",
      );
    }
  }, [searchParams]);

  async function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const result = await requestMagicLinkAction(email);
    if (result.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
      setError(result.error);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const action =
      passwordSubMode === "signup" ? signUpWithPasswordAction : signInWithPasswordAction;
    const result = await action(email, password, rememberMe);
    if (result.ok) {
      // Password sign-in/up sets a cookie and the server should
      // redirect on next navigation — a full navigation is used here
      // (rather than router.push) since the cookie was set by a Server
      // Action and downstream Server Components need to see it fresh.
      window.location.href = "/dashboard";
    } else {
      setStatus("error");
      setError(result.error);
    }
  }

  async function handleGoogleClick() {
    setGoogleLoading(true);
    try {
      await signInWithGoogleAction(rememberMe);
      // signInWithGoogleAction always redirects (to Google on success,
      // or back to /login?error=... on failure) — it never returns
      // normally. This line is effectively unreachable, but the
      // try/finally below is real defense-in-depth: a same-route,
      // query-param-only navigation (the error path lands back on
      // /login) isn't guaranteed to remount this component and reset
      // its local state, so googleLoading is reset explicitly rather
      // than assumed to clear itself.
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <Card style={{ maxWidth: "26rem", width: "100%" }}>
      {/* Real brand mark — research on login-page polish specifically
          calls out brand identity (logo/wordmark) reinforcing trust;
          previously this page had no branding beyond the page title
          text, one of the concrete things that made it feel unfinished. */}
      <Text
        variant="caption"
        style={{
          display: "block",
          textAlign: "center",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--wv-text-secondary)",
          marginBottom: "var(--wv-space-md)",
        }}
      >
        World Vitality
      </Text>
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: "var(--wv-space-sm)" }}
      >
        <GuideCharacter3D mood={moodFor(status)} wave={status === "idle"} />
      </div>
      <Text
        variant="sectionTitle"
        as="h1"
        style={{ marginBottom: "var(--wv-space-lg)", textAlign: "center" }}
      >
        {mode === "link"
          ? "Sign in"
          : passwordSubMode === "signup"
            ? "Create your account"
            : "Sign in"}
      </Text>

      {status === "sent" && mode === "link" ? (
        <Text variant="body" style={{ color: "var(--wv-text-secondary)", textAlign: "center" }}>
          Check your email — we sent a sign-in link to {email}.
        </Text>
      ) : (
        <>
          <Button
            type="button"
            variant="secondary"
            loading={googleLoading}
            onClick={handleGoogleClick}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--wv-space-sm)",
              marginBottom: "var(--wv-space-md)",
            }}
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--wv-space-sm)",
              margin: "var(--wv-space-md) 0",
            }}
          >
            <div style={{ flex: 1, height: 1, backgroundColor: "var(--wv-border)" }} />
            <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
              or
            </Text>
            <div style={{ flex: 1, height: 1, backgroundColor: "var(--wv-border)" }} />
          </div>

          {/*
            Single primary flow + a plain secondary link to switch
            methods — NOT a tab strip. Real login-page UX research is
            explicit that tabbed/modal-switching login UIs are an
            anti-pattern: they add an extra decision/click before the
            actual task, and can make people unsure where to find the
            method they actually want (real, cited finding, not a
            stylistic guess — see this file's git history for the
            source). Magic link stays the default/primary path, matching
            this app's own founding security choice (see
            docs/security/auth-threat-model.md) — password is a
            same-weight but secondary option, one link away, not an
            equally-prominent competing tab.
          */}
          {mode === "link" ? (
            <form
              onSubmit={handleMagicLinkSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" }}
            >
              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={status === "error" ? error : undefined}
              />
              <Button type="submit" loading={status === "sending"}>
                Send sign-in link
              </Button>
              <Text variant="caption" style={{ textAlign: "center" }}>
                Prefer a password?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("password");
                    setStatus("idle");
                    setError(undefined);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--wv-accent)",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  Sign in with a password instead
                </button>
              </Text>
            </form>
          ) : (
            <form
              onSubmit={handlePasswordSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" }}
            >
              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div>
                <Input
                  label="Password"
                  type="password"
                  required
                  minLength={passwordSubMode === "signup" ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={status === "error" ? error : undefined}
                />
                {passwordSubMode === "signup" && (
                  <PasswordStrengthMeter password={password} userInputs={[email]} />
                )}
              </div>

              <Checkbox
                label="Remember me on this device"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />

              <Button type="submit" loading={status === "sending"}>
                {passwordSubMode === "signup" ? "Create account" : "Sign in"}
              </Button>

              <Text variant="caption" style={{ textAlign: "center" }}>
                {passwordSubMode === "signup" ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setPasswordSubMode("signin")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--wv-accent)",
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
                      }}
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    New here?{" "}
                    <button
                      type="button"
                      onClick={() => setPasswordSubMode("signup")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--wv-accent)",
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
                      }}
                    >
                      Create an account
                    </button>
                  </>
                )}
              </Text>
              <Text variant="caption" style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode("link");
                    setStatus("idle");
                    setError(undefined);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--wv-text-secondary)",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  Use an email link instead
                </button>
              </Text>
            </form>
          )}
        </>
      )}
    </Card>
  );
}

/**
 * Split-screen layout (auth-page design research: illustration on one
 * side, unadorned form on the other, current SaaS convention) —
 * collapses to a single column below the medium breakpoint via CSS
 * `@media`, not a JS-measured layout, since this is a one-time static
 * layout decision, not something that needs to react to runtime state.
 *
 * **Fixed here, found in real use:** the outer container previously
 * used `minHeight: "100vh"`, which lets the *whole page* — illustration
 * panel included — grow taller than the viewport and scroll once the
 * form's content (tabs, password fields, strength meter, Remember Me,
 * "New here?" link) exceeds one screen's height, which looks broken for
 * an auth page. Fixed to `height: "100vh"` with `overflow: "hidden"` on
 * the page itself, so it never scrolls — but the form column alone gets
 * `overflow-y: "auto"` as a real safety net, not just a cosmetic fix: on
 * a genuinely short viewport, content still needs somewhere to go
 * rather than being silently clipped and unreachable (e.g. the submit
 * button). The illustration panel never scrolls either way.
 */
export default function LoginPage() {
  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      <div className="wv-auth-illustration-panel" style={{ flex: 1, display: "none" }}>
        <AuthIllustration />
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--wv-bg)",
          padding: "var(--wv-space-lg)",
          minWidth: 0,
          height: "100%",
          overflowY: "auto",
        }}
      >
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
      <style>{`
        @media (min-width: 768px) {
          .wv-auth-illustration-panel {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
