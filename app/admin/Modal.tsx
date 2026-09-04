"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { admin as t } from "@/components/booking/strings";
import { ghostButtonClass } from "./ui";

/**
 * Pristupačan modal: na telefonu bottom-sheet (klizi odozdo, spring bez odskoka),
 * na sm+ centriran (skala + fade). Escape i klik na pozadinu zatvaraju; Tab kruži
 * unutar dijaloga (focus trap); početni fokus ide na prvo polje za unos, a kad ga
 * nema — na sam dijalog (ne na destruktivno dugme ili tel: link); pri zatvaranju se
 * fokus vraća na prethodni element; body ne skroluje dok je otvoren.
 * Pozivalac ga omotava u <AnimatePresence> da bi radila izlazna animacija.
 * `focusKey` — promeni ga kad se sadržaj zameni u istom modalu, da se fokus ponovo postavi.
 */

const DESKTOP_QUERY = "(min-width: 640px)";
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const FOCUSABLE =
  'input:not([type="hidden"]):not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';
const INPUTS = 'input:not([type="hidden"]):not([disabled]),select:not([disabled]),textarea:not([disabled])';

function subscribeDesktop(onChange: () => void): () => void {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.tabIndex !== -1 && el.offsetParent !== null);
}

export function Modal({
  title,
  onClose,
  children,
  focusKey,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  focusKey?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const downOnOverlay = useRef(false);
  const reduced = useReducedMotion();
  const desktop = useIsDesktop();

  // Escape zatvara, Tab kruži unutar panela, telo ne skroluje, fokus se vraća pri zatvaranju.
  useEffect(() => {
    const prev = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = focusables(panel);
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && panel.contains(active);
      if (e.shiftKey && (active === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus({ preventScroll: true });
    };
  }, [onClose]);

  // Početni fokus: prvo polje za unos; inače sam dijalog (a ne „Ukloni pauzu" ili tel: link).
  useEffect(() => {
    const input = contentRef.current?.querySelector<HTMLElement>(INPUTS);
    (input ?? panelRef.current)?.focus({ preventScroll: true });
  }, [focusKey]);

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-night/40 sm:items-center sm:p-6"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduced ? undefined : { opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.25, ease: EASE }}
      onPointerDown={(e) => {
        downOnOverlay.current = e.target === e.currentTarget;
      }}
      onPointerUp={(e) => {
        if (downOnOverlay.current && e.target === e.currentTarget) onClose();
        downOnOverlay.current = false;
      }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-lg rounded-t-[28px] bg-bg-elev text-fg shadow-[0_-24px_60px_-30px_rgba(0,0,0,0.5)] outline-none sm:rounded-[28px] sm:shadow-[0_32px_80px_-30px_rgba(0,0,0,0.5)]"
        initial={reduced ? false : desktop ? { opacity: 0, scale: 0.96, y: 0 } : { opacity: 1, scale: 1, y: "100%" }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduced ? undefined : desktop ? { opacity: 0, scale: 0.96, y: 0 } : { opacity: 1, scale: 1, y: "100%" }}
        transition={
          reduced ? { duration: 0 } : desktop ? { duration: 0.25, ease: EASE } : { type: "spring", duration: 0.45, bounce: 0 }
        }
      >
        <div
          data-lenis-prevent
          className="max-h-[92dvh] overflow-y-auto overscroll-contain p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-display pt-1.5 text-2xl text-fg">
              {title}
            </h2>
            <button type="button" onClick={onClose} className={`${ghostButtonClass} shrink-0`}>
              <X size={16} aria-hidden="true" />
              {t.close}
            </button>
          </div>
          <div ref={contentRef}>{children}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
