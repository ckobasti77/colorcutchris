"use client";

import {
  Component,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
  type ErrorInfo,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { motion, useReducedMotion } from "motion/react";
import { KeyRound } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { admin as t } from "@/components/booking/strings";
import CalendarTab from "./CalendarTab";
import HoursTab from "./HoursTab";
import RequestsTab from "./RequestsTab";
import ServicesTab from "./ServicesTab";
import { cardClass, focusRingClass, ghostButtonClass, inputClass, labelClass, primaryButtonClass } from "./ui";

/**
 * Ljuska admin panela: ključ (sessionStorage, samo ovaj prozor), kartice, baner
 * „Podesi radno vreme" i idempotentni seed pri prvom otvaranju.
 * Ceo panel je pod data-reveal="off" — site-wide reč-po-reč otkrivanje ovde nema ko da vrati.
 */

const STORAGE_KEY = "ccc_admin_key";
const TAB_KEY = "ccc_admin_tab";

type Tab = "requests" | "calendar" | "hours" | "services";
const TABS: readonly Tab[] = ["requests", "calendar", "hours", "services"];

function isTab(value: string): value is Tab {
  return (TABS as readonly string[]).includes(value);
}

const subscribeNoop = () => () => {};
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function readStored(key: string): string {
  try {
    return window.sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeStored(key: string, value: string): void {
  try {
    if (value) window.sessionStorage.setItem(key, value);
    else window.sessionStorage.removeItem(key);
  } catch {
    // sessionStorage nedostupan — stanje živi samo u memoriji
  }
}

/* ---------- Error boundary: useQuery baca ConvexError za pogrešan ključ ---------- */

type BoundaryProps = { onReset: () => void; children: ReactNode };
type BoundaryState = { error: Error | null };

/** Pogrešan ključ (ConvexError „Neispravan ključ“) ↔ bilo koja druga greška (mreža, klijent) — različit tekst i radnja. */
function isBadKey(error: Error): boolean {
  return (error instanceof ConvexError && error.data === t.badKey) || error.message.includes(t.badKey);
}

class KeyErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn("Admin upit nije prošao", error.message, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (error) {
      const badKey = isBadKey(error);
      return (
        <div role="alert" className={`${cardClass} max-w-md border-cognac/40`}>
          <p className="font-medium text-oak">{badKey ? t.badKey : t.error}</p>
          {!badKey ? <p className="mt-1 text-sm text-fg-muted">{error.message}</p> : null}
          <button
            type="button"
            className={`${ghostButtonClass} mt-4`}
            onClick={() => {
              this.setState({ error: null });
              if (badKey) this.props.onReset();
            }}
          >
            {badKey ? t.keyClear : t.retry}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------- Unos ključa ---------- */

function KeyForm({ onSubmit }: { onSubmit: (key: string) => void }) {
  const id = useId();
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
      className={`${cardClass} max-w-sm space-y-4`}
    >
      <div>
        <label htmlFor={id} className={labelClass}>
          {t.keyLabel}
        </label>
        <input
          id={id}
          type="password"
          autoComplete="current-password"
          required
          placeholder={t.keyPlaceholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={inputClass}
        />
        <p className="mt-2 text-xs leading-relaxed text-fg-muted">{t.keyHint}</p>
      </div>
      <button type="submit" className={`${primaryButtonClass} w-full`}>
        <KeyRound size={16} aria-hidden="true" />
        {t.keySubmit}
      </button>
    </form>
  );
}

/* ---------- Ljuska sa karticama ---------- */

function Shell({ adminKey, tab, onTab }: { adminKey: string; tab: Tab; onTab: (next: Tab) => void }) {
  const status = useQuery(api.admin.status, { key: adminKey });
  const pending = useQuery(api.bookings.pendingCount, { key: adminKey });
  const init = useMutation(api.admin.init);
  const tabsId = useId();
  const reduced = useReducedMotion();

  // Seed frizera / podrazumevanog radnog vremena / podešavanja pri prvom otvaranju (idempotentno).
  useEffect(() => {
    const seed = () => {
      if (status && !status.seeded) void init({ key: adminKey });
    };
    seed();
  }, [status, init, adminKey]);

  const labels: Record<Tab, string> = t.tabs;

  // Strelice levo/desno biraju susednu karticu (WAI-ARIA tabs), Home/End prvu/poslednju.
  const onTabsKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.indexOf(tab);
    let next: Tab | null = null;
    if (e.key === "ArrowRight") next = TABS[(i + 1) % TABS.length];
    else if (e.key === "ArrowLeft") next = TABS[(i - 1 + TABS.length) % TABS.length];
    else if (e.key === "Home") next = TABS[0];
    else if (e.key === "End") next = TABS[TABS.length - 1];
    if (!next) return;
    e.preventDefault();
    onTab(next);
    document.getElementById(`${tabsId}-${next}`)?.focus();
  };

  return (
    <>
      {status && !status.hoursConfirmed ? (
        <div role="status" className={`${cardClass} mb-5 border-forest/30`}>
          <p className="font-medium text-fg">{t.banner.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">{t.banner.text}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={ghostButtonClass} onClick={() => onTab("hours")}>
              {t.banner.go}
            </button>
            {!status.seeded ? (
              <button type="button" className={ghostButtonClass} onClick={() => void init({ key: adminKey })}>
                {t.banner.init}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        role="tablist"
        aria-label={t.heading}
        onKeyDown={onTabsKeyDown}
        className="-mx-4 mb-5 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((k) => {
          const active = k === tab;
          return (
            <button
              key={k}
              id={`${tabsId}-${k}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`${tabsId}-panel`}
              tabIndex={active ? 0 : -1}
              onClick={() => onTab(k)}
              className={`relative inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[15px] font-medium transition-colors duration-200 ${focusRingClass} ${
                active ? "text-accent-fg" : "text-fg hover:bg-bg-elev"
              }`}
            >
              {active ? (
                <motion.span
                  layoutId="admin-tab-pill"
                  // animira samo pri promeni kartice — ne kad baner/sadržaj iznad pomeri red
                  layoutDependency={tab}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-accent"
                  transition={reduced ? { duration: 0 } : { type: "spring", duration: 0.4, bounce: 0 }}
                />
              ) : null}
              <span className="relative">{labels[k]}</span>
              {k === "requests" && pending ? (
                <span className="relative inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-neon px-1.5 text-[12px] font-semibold tabular-nums text-ink">
                  {pending}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`}>
        <motion.div
          key={tab}
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          {tab === "requests" ? <RequestsTab adminKey={adminKey} /> : null}
          {tab === "calendar" ? <CalendarTab adminKey={adminKey} /> : null}
          {tab === "hours" ? <HoursTab adminKey={adminKey} /> : null}
          {tab === "services" ? <ServicesTab adminKey={adminKey} /> : null}
        </motion.div>
      </div>
    </>
  );
}

/* ---------- Panel ---------- */

export default function AdminPanel() {
  // sessionStorage se čita lenjo na klijentu; prikaz čeka `hydrated` da se SSR i hidracija poklope.
  const [adminKey, setAdminKey] = useState<string>(() => (typeof window === "undefined" ? "" : readStored(STORAGE_KEY)));
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "requests";
    const stored = readStored(TAB_KEY);
    return isTab(stored) ? stored : "requests";
  });
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const applyKey = (key: string) => {
    writeStored(STORAGE_KEY, key);
    setAdminKey(key);
  };
  const clearKey = () => applyKey("");
  const onTab = (next: Tab) => {
    writeStored(TAB_KEY, next);
    setTab(next);
  };

  return (
    <main data-admin="" data-reveal="off" className="min-h-screen bg-bg px-4 py-6 text-fg sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{t.subheading}</p>
            <h1 className="text-display mt-2 text-4xl text-fg">{t.heading}</h1>
          </div>
          {hydrated && adminKey ? (
            <button type="button" className={ghostButtonClass} onClick={clearKey}>
              <KeyRound size={16} aria-hidden="true" />
              {t.keyClear}
            </button>
          ) : null}
        </header>

        {!hydrated ? (
          <p className="text-fg-muted">{t.loading}</p>
        ) : !adminKey ? (
          <KeyForm onSubmit={applyKey} />
        ) : (
          <KeyErrorBoundary key={adminKey} onReset={clearKey}>
            <Shell adminKey={adminKey} tab={tab} onTab={onTab} />
          </KeyErrorBoundary>
        )}
      </div>
    </main>
  );
}
