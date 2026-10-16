import { en, type MessageKey } from "./messages/en.js";
import type { Translator } from "./translator.js";

/** True when `value` is a real catalog key (used before building a key from data). */
export function isMessageKey(value: string): value is MessageKey {
  return Object.prototype.hasOwnProperty.call(en, value);
}

/** The parts of a stored notification this needs — structural, so no package dependency. */
export interface LocalizableNotification {
  title: string;
  body: string | null;
  messageKey?: string | null;
  messageParams?: Record<string, string> | null;
}

/**
 * The title and body to show for a stored notification, in the
 * reader's language.
 *
 * Notifications the app writes itself (a teammate's comment, a new
 * workspace membership) were saved as *what happened* — an id plus
 * parameters — so they read in whatever language is chosen when the
 * inbox is opened, not the one in force when they were created. If the
 * data is missing or unrecognised, the stored English text is shown:
 * degraded, never blank, never wrong.
 *
 * Anything without a message id — in practice every official weather
 * alert — is returned untouched. That is deliberate and a safety
 * property: an agency's emergency text is never re-worded or
 * machine-translated here, so it cannot be altered on the way to the
 * reader.
 */
export function localizeNotificationText(
  notification: LocalizableNotification,
  translator: Translator,
): { title: string; body: string | null } {
  const { t } = translator;
  const params = notification.messageParams ?? null;
  const stored = { title: notification.title, body: notification.body };

  if (notification.messageKey === "field_comment") {
    const field = params?.field;
    if (!field) return stored;
    const who = params?.who || t("notifications.msg.someone");
    return {
      title: t("notifications.msg.fieldComment.title", { who, field }),
      // The comment itself is the author's own words — never translated.
      body: notification.body,
    };
  }

  if (notification.messageKey === "member_added") {
    const workspaceId = params?.workspaceId;
    const roleId = params?.roleId;
    if (!workspaceId || !roleId) return stored;
    const workspaceKey = `workspace.${workspaceId}.name`;
    const roleKey = `role.${roleId}`;
    const workspace = isMessageKey(workspaceKey)
      ? t(workspaceKey)
      : params?.workspaceLabel || workspaceId;
    const role = isMessageKey(roleKey) ? t(roleKey) : params?.roleLabel || roleId;
    return {
      title: t("notifications.msg.memberAdded.title", { workspace }),
      body: t("notifications.msg.memberAdded.body", { role }),
    };
  }

  return stored;
}
