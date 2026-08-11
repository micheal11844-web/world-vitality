"use client";

import { useState } from "react";
import { Modal } from "./Modal.js";
import { Button } from "./Button.js";
import { Text } from "./Typography.js";
import { GuideCharacter, type GuideCharacterMood } from "./GuideCharacter.js";

export interface GuideTutorialStep {
  title: string;
  body: string;
  mood?: GuideCharacterMood;
}

export interface GuideTutorialProps {
  open: boolean;
  /** Called when the tutorial is dismissed, whether by finishing the
   *  last step, clicking Skip, or closing the dialog. Callers decide
   *  what "seen" means for their own persistence (BUILD_PLAN Stage 9
   *  ticket 9.4 wires this to localStorage in apps/web — deliberately
   *  NOT done in this package, since persistence policy is product
   *  logic, not shared UI). */
  onDismiss: () => void;
  steps: GuideTutorialStep[];
  characterName?: string;
}

/**
 * A first-use tutorial walkthrough narrated by the Guide Character
 * (BUILD_PLAN Stage 9, ticket 9.4). Generic step content in, so any
 * future workspace's own onboarding can reuse this shell rather than
 * rebuilding a walkthrough UI — the *content* (what it says) is always
 * supplied by the caller, per this codebase's existing packages-vs-apps
 * split (Engineering Blueprint Section 4.3): this component owns the
 * shell, not the words.
 *
 * Built on the existing `Modal` (so it inherits real focus-trap,
 * Escape-to-close, and focus-return behavior for free — accessibility
 * isn't reinvented here) rather than a bespoke overlay.
 */
export function GuideTutorial({
  open,
  onDismiss,
  steps,
  characterName = "Orbi",
}: GuideTutorialProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  // Reset to the first step each time the tutorial is (re)opened, so a
  // dismiss-and-reopen (unlikely today, but a real future path — e.g. a
  // "replay tutorial" entry point) doesn't strand the user mid-walkthrough.
  const handleClose = () => {
    onDismiss();
    setStepIndex(0);
  };

  if (!step) return null;

  return (
    <Modal open={open} onClose={handleClose} title={step.title}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--wv-space-md)",
        }}
      >
        <GuideCharacter name={characterName} mood={step.mood ?? "idle"} size={80} />
        <Text variant="body" style={{ textAlign: "center" }}>
          {step.body}
        </Text>
        <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
          Step {stepIndex + 1} of {steps.length}
        </Text>
        <div
          style={{
            display: "flex",
            gap: "var(--wv-space-sm)",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Skip
          </Button>
          <div style={{ display: "flex", gap: "var(--wv-space-sm)" }}>
            {stepIndex > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setStepIndex((i) => i - 1)}>
                Back
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => (isLastStep ? handleClose() : setStepIndex((i) => i + 1))}
            >
              {isLastStep ? "Get started" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
