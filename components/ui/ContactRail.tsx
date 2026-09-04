"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { BookingIcon, contactIcon } from "@/components/ui/SocialIcons";
import { useContactRailSuppressed } from "@/lib/contactRail";
import {
  bookingLink,
  contactLinkById,
  contactLinks,
  type ContactLinkId,
} from "@/lib/contactLinks";

const EASE = [0.16, 1, 0.3, 1] as const;
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
/** Mobilna traka: podskup linkova i njihov redosled (četvrto polje je "Zakaži"). */
const MOBILE_IDS: readonly ContactLinkId[] = ["call", "viber", "instagram"];

/**
 * Brzi kontakt — ista stvar u dva oblika:
 *  - lg+: vertikalni dock uz desnu ivicu; ulazi tek kad hero (`#top`) izađe iz viewporta
 *  - <lg: donja traka; vidljiva i na hero-u, sklanja se dok je Zakazivanje u viewportu
 *    (da ne prekrije wizard) ili dok ju je neko sklonio preko `setContactRailSuppressed(true)`
 *
 * Početno stanje je isto kao na serveru (dock sakriven, traka vidljiva) — IntersectionObserver
 * odlučuje tek u efektu, pa nema hydration razlike.
 */
export function ContactRail() {
  const [heroGone, setHeroGone] = useState(false);
  const [bookingInView, setBookingInView] = useState(false);
  const suppressed = useContactRailSuppressed();

  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) {
      // strana bez hero-a — dock je odmah tu
      const id = window.requestAnimationFrame(() => setHeroGone(true));
      return () => window.cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setHeroGone(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const booking = document.getElementById("zakazivanje");
    if (!booking) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const rootHeight = entry.rootBounds?.height ?? window.innerHeight;
          // 15% sekcije u viewportu — ili, ako je sekcija toliko visoka da 15% nikad
          // ne stane na ekran, kad prekriva bar 60% ekrana
          setBookingInView(
            entry.isIntersecting &&
              (entry.intersectionRatio >= 0.15 ||
                entry.intersectionRect.height >= rootHeight * 0.6),
          );
        }
      },
      { threshold: [0, 0.05, 0.1, 0.15] },
    );
    io.observe(booking);
    return () => io.disconnect();
  }, []);

  return (
    <nav aria-label="Brzi kontakt" data-reveal="off">
      <Dock visible={heroGone} />
      <MobileBar hidden={bookingInView || suppressed} />
    </nav>
  );
}

/* ---------------------------------------------------------------- desktop dock */

function dockVariants(reduced: boolean): Variants {
  return {
    hidden: {
      opacity: 0,
      x: reduced ? 0 : 12,
      filter: reduced ? "blur(0px)" : "blur(8px)",
      transition: {
        duration: reduced ? 0 : 0.22,
        ease: EASE,
        staggerChildren: reduced ? 0 : 0.03,
        staggerDirection: -1,
      },
    },
    shown: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: {
        duration: reduced ? 0 : 0.4,
        ease: EASE,
        staggerChildren: reduced ? 0 : 0.04,
        delayChildren: reduced ? 0 : 0.06,
      },
    },
  };
}

function itemVariants(reduced: boolean): Variants {
  return {
    hidden: {
      opacity: 0,
      y: reduced ? 0 : 6,
      transition: { duration: reduced ? 0 : 0.15, ease: EASE },
    },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : 0.3, ease: EASE },
    },
  };
}

function Dock({ visible }: { visible: boolean }) {
  const reduced = useReducedMotion() === true;
  const dock = dockVariants(reduced);
  const item = itemVariants(reduced);

  return (
    <div data-rail="dock" className="fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 lg:block">
      <AnimatePresence>
        {visible && (
          <motion.div
            key="dock"
            variants={dock}
            initial="hidden"
            animate="shown"
            exit="hidden"
            className="flex flex-col items-center gap-1 rounded-full border border-line bg-bg-elev/80 p-1.5 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)] backdrop-blur-md transition-colors duration-700"
          >
            {contactLinks.map((link) => {
              const Icon = contactIcon(link.id);
              return (
                <DockItem
                  key={link.id}
                  href={link.href}
                  label={link.label}
                  ariaLabel={link.ariaLabel}
                  external={link.external}
                  variants={item}
                >
                  <Icon className="h-5 w-5" />
                </DockItem>
              );
            })}
            <motion.span variants={item} aria-hidden className="my-1 h-px w-6 bg-line" />
            <DockItem
              href={bookingLink.href}
              label={bookingLink.ariaLabel}
              ariaLabel={bookingLink.ariaLabel}
              variants={item}
              accent
            >
              <BookingIcon className="h-5 w-5" />
            </DockItem>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DockItem({
  href,
  label,
  ariaLabel,
  external = false,
  accent = false,
  variants,
  children,
}: {
  href: string;
  label: string;
  ariaLabel: string;
  external?: boolean;
  accent?: boolean;
  variants: Variants;
  children: ReactNode;
}) {
  const reduced = useReducedMotion() === true;
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const show = hover || focus;

  return (
    <motion.div
      variants={variants}
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <a
        href={href}
        aria-label={ariaLabel}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className={`grid h-11 w-11 place-items-center rounded-full ${FOCUS} ${
          accent
            ? "bg-accent text-accent-fg transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
            : "text-fg transition-colors hover:bg-bg hover:text-accent"
        }`}
      >
        {children}
      </a>
      {/* tooltip — link već ima aria-label, ovo je samo za oko */}
      <AnimatePresence>
        {show && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0, x: reduced ? 0 : 6, y: "-50%" }}
            animate={{ opacity: 1, x: 0, y: "-50%" }}
            exit={{ opacity: 0, x: reduced ? 0 : 6, y: "-50%" }}
            transition={{ duration: reduced ? 0 : 0.15, ease: EASE }}
            className="pointer-events-none absolute top-1/2 right-full mr-3 rounded-full bg-fg px-3 py-1 text-xs font-medium whitespace-nowrap text-bg"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------------------------------------------------------------- mobile bar */

function MobileBar({ hidden }: { hidden: boolean }) {
  const links = MOBILE_IDS.map((id) => contactLinkById[id]);
  const itemClass = `flex h-12 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium ${FOCUS}`;

  return (
    <div
      data-rail="mobile"
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-linear-to-t from-bg via-bg/85 to-transparent px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] transition-transform duration-300 ease-out lg:hidden ${
        hidden ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="pointer-events-auto grid grid-cols-4 gap-1 rounded-full border border-line bg-bg-elev/90 p-1.5 backdrop-blur-md transition-colors duration-700">
        {links.map((link) => {
          const Icon = contactIcon(link.id);
          return (
            <a
              key={link.id}
              href={link.href}
              aria-label={link.ariaLabel}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
              tabIndex={hidden ? -1 : undefined}
              className={`${itemClass} text-fg transition-colors hover:bg-bg`}
            >
              <Icon className="h-5 w-5" />
              <span>{link.label}</span>
            </a>
          );
        })}
        <a
          href={bookingLink.href}
          aria-label={bookingLink.ariaLabel}
          tabIndex={hidden ? -1 : undefined}
          className={`${itemClass} bg-accent text-accent-fg`}
        >
          <BookingIcon className="h-5 w-5" />
          <span>{bookingLink.label}</span>
        </a>
      </div>
    </div>
  );
}
