import { AppShellSkeleton } from "@world-vitality/ui-components";

/**
 * Shown the instant `/globe` is requested, while the page reads the
 * person's own locations. (It used to show nothing until the server had
 * also waited on every live hazard source.) Same skeleton the Dashboard
 * uses; see `AppShellSkeleton`.
 */
export default function GlobeLoading() {
  return <AppShellSkeleton />;
}
