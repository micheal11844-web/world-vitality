export {
  getConfidenceDisplay,
  allConfidenceDisplays,
  type ConfidenceDisplay,
} from "./confidence.js";

export { ConfidenceBadge, type ConfidenceBadgeProps } from "./components/ConfidenceBadge.js";
export {
  Button,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from "./components/Button.js";
export { Card, type CardProps } from "./components/Card.js";
export { Text, type TextProps } from "./components/Typography.js";
export { Input, type InputProps } from "./components/Input.js";
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
// NOTE: GuideCharacter3D is deliberately NOT re-exported here. It's
// only reachable via the dedicated subpath
// "@world-vitality/ui-components/GuideCharacter3D" (see package.json's
// exports map and the component's own doc comment). Re-exporting it
// from this barrel — which every page in apps/web statically imports,
// including ones that never use the 3D character — was tried, found
// (by directly inspecting `next build`'s real per-route bundle sizes,
// not assumed correct) to feed Three.js into Next's automatic shared-
// chunk heuristic for several unrelated routes, inflating their First
// Load JS by ~230kB each. Removing it from the barrel, keeping only the
// isolated subpath, fixed it — verified again after this change.
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
