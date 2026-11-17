"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { MessageKey, Translator } from "@world-vitality/i18n";
import {
  BUSINESS_EMAIL,
  BUSINESS_NAME,
  SUPPORT_TOPIC_HREF,
  SUPPORT_TOPIC_IDS,
  historyFromChat,
  supportMailto,
  type SupportReply,
  type SupportTopicId,
  type TranscriptLine,
} from "@world-vitality/support";
import { Button, Input, Modal } from "@world-vitality/ui-components";
import { assistantEnabled, respondToMessage } from "./responder";

const TOPIC_LABEL: Record<SupportTopicId, MessageKey> = {
  plans: "support.topic.plans",
  account: "support.topic.account",
  alerts: "support.topic.alerts",
  globe: "support.topic.globe",
  workspaces: "support.topic.workspaces",
  sources: "support.topic.sources",
  privacy: "support.topic.privacy",
  language: "support.topic.language",
  contact: "support.topic.contact",
};

const TOPIC_ANSWER: Record<SupportTopicId, MessageKey> = {
  plans: "support.answer.plans",
  account: "support.answer.account",
  alerts: "support.answer.alerts",
  globe: "support.answer.globe",
  workspaces: "support.answer.workspaces",
  sources: "support.answer.sources",
  privacy: "support.answer.privacy",
  language: "support.answer.language",
  contact: "support.answer.contact",
};

type Entry =
  | { id: number; who: "you"; text: string }
  | { id: number; who: "orbi"; reply: SupportReply | { kind: "intro" } };

let nextId = 1;
const INTRO: Entry = { id: 0, who: "orbi", reply: { kind: "intro" } };

/** The words an entry shows, in the reader's language. */
function entryText(entry: Entry, t: Translator["t"]): string {
  if (entry.who === "you") return entry.text;
  const reply = entry.reply;
  switch (reply.kind) {
    case "intro":
      return t("support.intro");
    case "emergency":
      return t("support.emergency");
    case "fallback":
      return t("support.fallback");
    case "text":
      return reply.text;
    case "topic":
      return t(TOPIC_ANSWER[reply.topic], { business: BUSINESS_NAME, email: BUSINESS_EMAIL });
  }
}

const bubble = {
  maxWidth: "92%",
  padding: "var(--wv-space-sm) var(--wv-space-md)",
  borderRadius: "var(--wv-radius-md)",
  fontFamily: "var(--wv-font-sans)",
  fontSize: "0.9375rem",
  lineHeight: 1.5,
  overflowWrap: "anywhere",
} as const;

/**
 * The help chat window: Orbi answers common questions from a built-in matcher
 * (`respondToMessage`), points to the right page, and offers an email to a
 * person. Nothing typed here is stored or sent anywhere; the "Email a person"
 * link only puts the chat into the reader's own mail app, to read and edit
 * before sending. Stays mounted after the first open, so closing and
 * reopening keeps the conversation (it is gone when the page is left).
 *
 * **Only if the server says an outside assistant is switched on** (asked once,
 * no text sent) are typed messages sent on, and then the notice at the top says
 * so in plain words. The topic buttons always stay on the device.
 */
export function SupportPanel({
  open,
  onClose,
  translator,
}: {
  open: boolean;
  onClose: () => void;
  translator: Translator;
}) {
  const { t, locale } = translator;
  const [entries, setEntries] = useState<Entry[]>([INTRO]);
  const [draft, setDraft] = useState("");
  // The topic buttons are open at the start and fold away once the conversation
  // begins (they take a lot of a phone screen); the "Topics" button brings them back.
  const [showTopics, setShowTopics] = useState(true);
  // Off unless the server says so (see `assistantEnabled`); asked once, on first open.
  const [assistant, setAssistant] = useState(false);
  const [thinking, setThinking] = useState(false);
  const asked = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || asked.current) return;
    asked.current = true;
    void assistantEnabled().then(setAssistant);
  }, [open]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [entries, open, thinking]);

  async function ask(message: string, shown: string) {
    const text = message.trim();
    if (!text || thinking) return;
    setShowTopics(false);
    // What was said so far, before this message (danger is filtered out of it).
    const history = historyFromChat(
      entries
        .filter((e) => !(e.who === "orbi" && e.reply.kind === "intro"))
        .map((e) => ({
          who: e.who,
          text: entryText(e, t),
          emergency: e.who === "orbi" && e.reply.kind === "emergency",
        })),
    );
    // The visitor's own words appear at once; the answer follows.
    setEntries((prev) => [...prev, { id: nextId++, who: "you", text: shown.trim() || text }]);
    setThinking(true);
    try {
      const reply = await respondToMessage(text, locale, { useAssistant: assistant, history });
      setEntries((prev) => [...prev, { id: nextId++, who: "orbi", reply }]);
    } finally {
      setThinking(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (thinking) return;
    const text = draft;
    setDraft("");
    void ask(text, text);
  }

  // A topic button asks the same question a person would type, in their language.
  function pickTopic(topic: SupportTopicId) {
    const label = t(TOPIC_LABEL[topic]);
    setShowTopics(false);
    setEntries((prev) => [
      ...prev,
      { id: nextId++, who: "you", text: label },
      { id: nextId++, who: "orbi", reply: { kind: "topic", topic } },
    ]);
  }

  const transcript: TranscriptLine[] = entries
    .filter((e) => !(e.who === "orbi" && e.reply.kind === "intro"))
    .map((e) => ({ who: e.who, text: entryText(e, t) }));

  return (
    <Modal open={open} onClose={onClose} title={t("support.title")}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-md)" }}>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--wv-font-sans)",
            fontSize: "0.8125rem",
            color: "var(--wv-text-secondary)",
          }}
        >
          {t(assistant ? "support.autoAssistant" : "support.auto")}
        </p>

        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--wv-space-sm)",
            maxHeight: "min(40vh, 20rem)",
            overflowY: "auto",
            padding: "var(--wv-space-xs)",
          }}
        >
          {entries.map((entry) => {
            const mine = entry.who === "you";
            const emergency = entry.who === "orbi" && entry.reply.kind === "emergency";
            const topic =
              entry.who === "orbi" && entry.reply.kind === "topic" ? entry.reply.topic : null;
            const href = topic ? SUPPORT_TOPIC_HREF[topic] : null;
            return (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.125rem",
                  alignItems: mine ? "flex-end" : "flex-start",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--wv-font-sans)",
                    fontSize: "0.75rem",
                    color: "var(--wv-text-secondary)",
                  }}
                >
                  {t(mine ? "support.you" : "support.orbi")}
                </span>
                <div
                  style={{
                    ...bubble,
                    ...(mine
                      ? {
                          backgroundColor: "var(--wv-color-accent-500)",
                          color: "var(--wv-color-neutral-50)",
                        }
                      : {
                          backgroundColor: "var(--wv-bg)",
                          color: "var(--wv-text-primary)",
                          border: emergency
                            ? "2px solid var(--wv-critical)"
                            : "1px solid var(--wv-border)",
                        }),
                  }}
                >
                  {entryText(entry, t)}
                  {href && topic && (
                    <div style={{ marginTop: "var(--wv-space-sm)" }}>
                      <Link
                        href={href}
                        onClick={onClose}
                        style={{ color: "var(--wv-accent)", fontWeight: 600 }}
                      >
                        {t("support.openPage", { page: t(TOPIC_LABEL[topic]) })}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {thinking && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
              <span
                style={{
                  fontFamily: "var(--wv-font-sans)",
                  fontSize: "0.75rem",
                  color: "var(--wv-text-secondary)",
                }}
              >
                {t("support.orbi")}
              </span>
              <div
                data-testid="support-thinking"
                style={{
                  ...bubble,
                  backgroundColor: "var(--wv-bg)",
                  color: "var(--wv-text-secondary)",
                  border: "1px solid var(--wv-border)",
                }}
              >
                {t("support.thinking")}
              </div>
            </div>
          )}
        </div>

        {showTopics && (
          <div
            id="support-topics"
            role="group"
            aria-label={t("support.topicsLabel")}
            style={{ display: "flex", flexWrap: "wrap", gap: "var(--wv-space-xs)" }}
          >
            {SUPPORT_TOPIC_IDS.map((topic) => (
              <Button
                key={topic}
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => pickTopic(topic)}
              >
                {t(TOPIC_LABEL[topic])}
              </Button>
            ))}
          </div>
        )}

        <form
          onSubmit={submit}
          style={{ display: "flex", gap: "var(--wv-space-sm)", alignItems: "flex-end" }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Input
              label={t("support.inputLabel")}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
              autoComplete="off"
              enterKeyHint="send"
            />
          </div>
          <Button
            type="submit"
            disabled={draft.trim().length === 0 || thinking}
            style={{ flexShrink: 0 }}
          >
            {t("support.send")}
          </Button>
        </form>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--wv-space-sm)",
            justifyContent: "space-between",
          }}
        >
          <a
            href={supportMailto(transcript)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "2.75rem",
              padding: "0 var(--wv-space-md)",
              borderRadius: "var(--wv-radius-sm)",
              border: "1px solid var(--wv-border)",
              color: "var(--wv-text-primary)",
              fontFamily: "var(--wv-font-sans)",
              fontSize: "0.9375rem",
              textDecoration: "none",
            }}
          >
            {t("support.email")}
          </a>
          <Button
            variant="ghost"
            type="button"
            aria-expanded={showTopics}
            aria-controls="support-topics"
            onClick={() => setShowTopics((v) => !v)}
          >
            {t("support.topicsLabel")} {showTopics ? "▴" : "▾"}
          </Button>
          <Button variant="ghost" type="button" onClick={onClose}>
            {t("support.close")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
