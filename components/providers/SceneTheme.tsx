"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { setTheme, type Theme } from "@/lib/theme";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Sekcija koja, kad uđe u sredinu ekrana, postavlja temu (day/night).
 * Hero sam upravlja svojim prelazom; ovo je za sve ispod njega.
 */
export function SceneTheme({
  theme,
  children,
  className,
  id,
}: {
  theme: Theme;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top 55%",
        end: "bottom 45%",
        onEnter: () => setTheme(theme),
        onEnterBack: () => setTheme(theme),
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} id={id} className={className} data-scene={theme}>
      {children}
    </div>
  );
}
