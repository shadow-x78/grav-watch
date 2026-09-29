// ─────────────────────────────────────────────
// GravWatch - Context Barrel Export
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

"use client";

import React, { ReactNode } from "react";
import { GravWatchProvider, useGravWatch } from "./GravWatchContext";
import { UIProvider, useUI } from "./UIContext";

export function GravWatchProviders({ children }: { children: ReactNode }) {
  return React.createElement(
    GravWatchProvider,
    null,
    React.createElement(
      UIProvider,
      null,
      children
    )
  );
}

export { useGravWatch as useTelemetry };
export { useGravWatch };
export { useUI };
