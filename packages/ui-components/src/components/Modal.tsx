"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal (ticket 5.2). Renders via a portal to `document.body` so it
 * escapes any parent's `overflow: hidden`/stacking context — important
 * given the app shell's three-column layout (Section 4).
 *
 * Handles the accessibility basics that are easy to get wrong and hard
 * to retrofit later, exactly why Section 13 wants this "from the start":
 * - Escape closes it.
 * - Focus moves into the dialog on open, and is trapped inside it
 *   (Tab/Shift+Tab cycle within the modal, never escape to the page
 *   behind it) — a real, tested behavior, not just an aria attribute.
 * - Focus returns to whatever triggered the modal on close.
 * - `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing at
 *   the title.
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`wv-modal-title-${Math.random().toString(36).slice(2)}`).current;
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable?.[0] ?? dialog)?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;

      const focusableEls = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusableEls.length === 0) return;
      const first = focusableEls[0]!;
      const last = focusableEls[focusableEls.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    // Click-outside-to-close backdrop, not interactive content; the
    // keyboard equivalent is Escape, handled above via keydown listener.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{
          backgroundColor: "var(--wv-surface)",
          borderRadius: "var(--wv-radius-lg)",
          padding: "var(--wv-space-lg)",
          maxWidth: "32rem",
          width: "90%",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
        }}
      >
        <h2
          id={titleId}
          style={{
            fontFamily: "var(--wv-font-sans)",
            fontSize: "1.375rem",
            margin: "0 0 var(--wv-space-md)",
          }}
        >
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
