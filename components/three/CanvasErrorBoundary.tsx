"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; fallback: ReactNode };
type State = { failed: boolean };

/**
 * Pad WebGL-a (nema konteksta, izgubljen kontekst, shader, chunk) ne sme da obori
 * ceo hero: umesto 3D znaka ostaje statični 2D neon (fallback), a copy i CTA rade.
 */
export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[NeonSign] 3D znak nije uspeo — prikazujem 2D neon:", error.message, info.componentStack);
    }
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
