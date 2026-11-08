export {
  getConfidenceDisplay,
  allConfidenceDisplays,
  type ConfidenceDisplay,
} from "./confidence.js";

export { ConfidenceBadge, type ConfidenceBadgeProps } from "./components/ConfidenceBadge.js";
export {
  Button,
  buttonStyle,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from "./components/Button.js";
export { ButtonLink, type ButtonLinkProps } from "./components/ButtonLink.js";
export { Card, type CardProps } from "./components/Card.js";
export { Text, type TextProps } from "./components/Typography.js";
export { Input, type InputProps } from "./components/Input.js";
export { Select, type SelectProps } from "./components/Select.js";
export { Modal, type ModalProps } from "./components/Modal.js";
export { Table, type TableProps, type TableColumn } from "./components/Table.js";
export { Skeleton, type SkeletonProps } from "./components/Skeleton.js";
export {
  StateDisplay,
  type StateDisplayProps,
  type StateDisplayStatus,
} from "./components/StateDisplay.js";
export {
  GuideCharacter,
  type GuideCharacterProps,
  type GuideCharacterMood,
} from "./components/GuideCharacter.js";
export {
  GuideTutorial,
  type GuideTutorialProps,
  type GuideTutorialStep,
} from "./components/GuideTutorial.js";
export { Checkbox, type CheckboxProps } from "./components/Checkbox.js";
export {
  PasswordStrengthMeter,
  type PasswordStrengthMeterProps,
} from "./components/PasswordStrengthMeter.js";
export { AuthIllustration, type AuthIllustrationProps } from "./components/AuthIllustration.js";

export { Header, type HeaderProps } from "./layout/Header.js";
export {
  Sidebar,
  type SidebarProps,
  type SidebarItem,
  type SidebarSection,
} from "./layout/Sidebar.js";
export { AIPanel, type AIPanelProps } from "./layout/AIPanel.js";
export { AppShell, type AppShellProps } from "./layout/AppShell.js";
export { AppShellSkeleton } from "./layout/AppShellSkeleton.js";
export { OfflineNotice, SAVED_COPY_META } from "./layout/OfflineNotice.js";
export { GlobalSearch, type GlobalSearchProps } from "./search/GlobalSearch.js";
export { NotificationBell, type NotificationBellProps } from "./notifications/NotificationBell.js";
export {
  DEFAULT_UI_STRINGS,
  UiStringsProvider,
  useUiStrings,
  type SuggestionKind,
  type UiStrings,
} from "./i18n/ui-strings.js";
export {
  classifyQuery,
  extractPlaceCandidate,
  normalizeQuery,
  rankEntries,
  suggestionsFromEntries,
  topicTokens,
  type QueryKind,
  type RankedEntry,
  type SearchEntry,
  type SearchEntryKind,
  type SearchSuggestion,
} from "./search/search-core.js";
