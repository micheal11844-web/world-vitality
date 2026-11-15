export {
  BUSINESS_COUNTRY,
  BUSINESS_EMAIL,
  BUSINESS_NAME,
  LEGAL_UPDATED,
  businessMailto,
} from "./business.js";
export {
  EMERGENCY_KEYWORDS,
  SUPPORT_LOCALES,
  SUPPORT_TOPIC_HREF,
  SUPPORT_TOPIC_IDS,
  TOPIC_KEYWORDS,
  type SupportLocale,
  type SupportTopicId,
} from "./keywords.js";
export { detectEmergency, normalise, replyTo, scoreTopics, type SupportReply } from "./matcher.js";
export {
  MAX_TRANSCRIPT_CHARS,
  SUPPORT_EMAIL_SUBJECT,
  supportMailto,
  transcriptText,
  type TranscriptLine,
} from "./transcript.js";
