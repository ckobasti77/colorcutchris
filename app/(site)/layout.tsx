import type { ReactNode } from "react";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { TextRevealGlobal } from "@/components/providers/TextRevealGlobal";
import { ContactRail } from "@/components/ui/ContactRail";

/**
 * Javni sajt: Lenis smooth scroll, site-wide reč-po-reč otkrivanje copy-ja i
 * kontakt-traka (desktop dock + mobilna donja traka). Admin ruta ovo ne koristi.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TextRevealGlobal />
      <SmoothScroll>
        {children}
        <ContactRail />
      </SmoothScroll>
    </>
  );
}
