"use client";

import { Component, type ReactNode } from "react";

/**
 * Catches a failure while the 3D globe starts (a lost graphics context, an
 * engine that cannot initialise) so the page keeps its flat map instead of
 * showing an error screen.
 */
export class GlobeErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
