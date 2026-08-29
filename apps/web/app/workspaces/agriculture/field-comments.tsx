"use client";

import { useState, useTransition } from "react";
import { Button, Text } from "@world-vitality/ui-components";
import type { FieldComment } from "@world-vitality/identity-service";
import { createFieldCommentAction } from "./field-actions";

export interface FieldCommentsProps {
  fieldId: string;
  initialComments: FieldComment[];
  canComment: boolean;
}

/**
 * Expandable commentary thread for one field (BUILD_PLAN "STAGE —
 * AGRICULTURE FIELD COMMENTS"), closing PRD A.1's "Collaboration:
 * ...commentary threads on specific fields." Same expand/collapse
 * pattern `field-manage-controls.tsx` already established for this
 * page, rather than a separate dedicated field-detail route — keeps
 * every field's context (status, controls, comments) in one card.
 *
 * `canComment` is computed server-side in `page.tsx` via the
 * resource-scoped `can(role, "comments:create", { resourceId,
 * scopedResourceIds })` check — this component only decides whether to
 * *show* the compose form; `field-actions.ts`'s Server Action re-checks
 * independently regardless, same defense-in-depth pattern as every
 * other write path in this app.
 */
export function FieldComments({ fieldId, initialComments, canComment }: FieldCommentsProps) {
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createFieldCommentAction(fieldId, body);
      if (result.ok) {
        setBody("");
      } else {
        setError(result.error ?? "Failed to post comment.");
      }
    });
  }

  return (
    <div style={{ marginTop: "var(--wv-space-sm)" }}>
      <Button variant="secondary" onClick={() => setExpanded((v) => !v)}>
        {expanded ? "Hide comments" : `Comments (${initialComments.length})`}
      </Button>

      {expanded && (
        <div style={{ marginTop: "var(--wv-space-sm)" }}>
          {initialComments.length === 0 ? (
            <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
              No comments yet.
            </Text>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-xs)" }}>
              {initialComments.map((c) => (
                <div key={c.id}>
                  <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
                    {c.displayName ?? c.email} · {c.createdAt.slice(0, 10)}
                  </Text>
                  <Text variant="body">{c.body}</Text>
                </div>
              ))}
            </div>
          )}

          {canComment && (
            <form
              onSubmit={handleSubmit}
              style={{ marginTop: "var(--wv-space-sm)", display: "flex", gap: "var(--wv-space-xs)" }}
            >
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add a comment..."
                style={{
                  flex: 1,
                  padding: "var(--wv-space-xs) var(--wv-space-sm)",
                  borderRadius: "var(--wv-radius-sm)",
                  border: "1px solid var(--wv-border)",
                  fontFamily: "var(--wv-font-sans)",
                  fontSize: "0.9375rem",
                }}
              />
              <Button type="submit" loading={isPending}>
                Post
              </Button>
            </form>
          )}
          {error && (
            <Text variant="caption" style={{ display: "block", color: "var(--wv-critical)", marginTop: "var(--wv-space-xs)" }}>
              {error}
            </Text>
          )}
        </div>
      )}
    </div>
  );
}
