"use client";

import { useState, useTransition } from "react";
import { Button, Text } from "@world-vitality/ui-components";
import type { FieldComment } from "@world-vitality/identity-service";
import { createFieldCommentAction, updateFieldCommentAction, deleteFieldCommentAction } from "./field-actions";

export interface FieldCommentsProps {
  fieldId: string;
  initialComments: FieldComment[];
  canComment: boolean;
  currentUserId: string | null;
}

/**
 * One comment row, with inline edit/delete controls when
 * `currentUserId` matches the comment's own author (BUILD_PLAN "STAGE
 * — AGRICULTURE FIELD COMMENTS FOLLOW-UP: EDIT/DELETE"). Same
 * inline-edit / two-click-delete pattern `field-manage-controls.tsx`
 * already established for fields themselves, scaled down for a single
 * text field rather than three. Server Actions re-check authorship
 * independently regardless of what's shown here — this is purely about
 * which controls render, same defense-in-depth split as every other
 * write path in this app.
 */
function CommentRow({
  comment,
  fieldId,
  isOwnComment,
}: {
  comment: FieldComment;
  fieldId: string;
  isOwnComment: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateFieldCommentAction(comment.id, fieldId, body);
      if (result.ok) {
        setEditing(false);
      } else {
        setError(result.error ?? "Failed to update comment.");
      }
    });
  }

  function handleDeleteClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteFieldCommentAction(comment.id, fieldId);
      if (!result.ok) {
        setError(result.error ?? "Failed to delete comment.");
        setConfirmingDelete(false);
      }
      // On success, revalidatePath refreshes the page and this row
      // simply stops existing — same pattern FieldManageControls uses.
    });
  }

  if (editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--wv-space-xs)" }}>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{
            padding: "var(--wv-space-xs) var(--wv-space-sm)",
            borderRadius: "var(--wv-radius-sm)",
            border: "1px solid var(--wv-border)",
            fontFamily: "var(--wv-font-sans)",
            fontSize: "0.9375rem",
          }}
        />
        <div style={{ display: "flex", gap: "var(--wv-space-xs)" }}>
          <Button onClick={handleSave} loading={isPending}>
            Save
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setBody(comment.body);
              setEditing(false);
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
        {error && (
          <Text variant="caption" style={{ color: "var(--wv-critical)" }}>
            {error}
          </Text>
        )}
      </div>
    );
  }

  return (
    <div>
      <Text variant="caption" style={{ color: "var(--wv-text-secondary)" }}>
        {comment.displayName ?? comment.email} · {comment.createdAt.slice(0, 10)}
        {comment.updatedAt ? " (edited)" : ""}
      </Text>
      <Text variant="body">{comment.body}</Text>
      {isOwnComment && (
        <div style={{ display: "flex", gap: "var(--wv-space-xs)", marginTop: "var(--wv-space-xs)" }}>
          <Button variant="secondary" onClick={() => setEditing(true)} disabled={isPending}>
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDeleteClick} disabled={isPending}>
            {confirmingDelete ? "Confirm Delete?" : "Delete"}
          </Button>
        </div>
      )}
      {error && (
        <Text variant="caption" style={{ color: "var(--wv-critical)" }}>
          {error}
        </Text>
      )}
    </div>
  );
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
 * *show* the compose form; `field-actions.ts`'s Server Actions re-check
 * independently regardless, same defense-in-depth pattern as every
 * other write path in this app.
 *
 * `currentUserId` (from `getSessionUserId()`, `page.tsx`) decides
 * per-comment whether to show edit/delete controls — only the
 * comment's own author sees them, no admin override, same author-only
 * scope `field-actions.ts`'s Server Actions themselves enforce.
 */
export function FieldComments({ fieldId, initialComments, canComment, currentUserId }: FieldCommentsProps) {
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
                <CommentRow
                  key={c.id}
                  comment={c}
                  fieldId={fieldId}
                  isOwnComment={currentUserId !== null && c.userId === currentUserId}
                />
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
