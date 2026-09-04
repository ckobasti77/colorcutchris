"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useState, type ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

let warned = false;

/**
 * Jedan Convex klijent za ceo sajt. Bez `NEXT_PUBLIC_CONVEX_URL` (npr. env nije
 * postavljen na Vercelu) renderuje decu bez provider-a — sekcija Zakazivanje tada
 * prikazuje NoBackendFallback, ostatak sajta radi normalno.
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [client] = useState<ConvexReactClient | null>(() => {
    if (!convexUrl) {
      if (!warned) {
        warned = true;
        console.warn("NEXT_PUBLIC_CONVEX_URL nije postavljen — sajt radi bez Convex provider-a.");
      }
      return null;
    }
    return new ConvexReactClient(convexUrl);
  });

  if (!client) return <>{children}</>;
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
