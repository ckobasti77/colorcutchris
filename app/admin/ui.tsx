"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ConvexError } from "convex/values";
import { admin as t } from "@/components/booking/strings";
import { staffMembers } from "@/lib/booking";
import { fmt } from "@/lib/slots";

/**
 * Deljene klase i sitne komponente admin panela — dnevna tema (cream / ink / sage),
 * neon samo za fokus prsten i badge. Svi tap-target-i su ≥ 44 px (h-11).
 */

/** Sa jednim frizerom (Chris) ime frizera je šum — prikazuje se i bira samo kad ih ima više. */
export const MULTI_STAFF: boolean = staffMembers.length > 1;

export const focusRingClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export const inputClass =
  "h-11 w-full rounded-xl border border-line bg-bg-elev px-3 text-[15px] text-fg outline-none transition-shadow duration-200 placeholder:text-fg-muted focus:ring-2 focus:ring-focus disabled:opacity-60";
/** Isti izgled, ali širine sadržaja (birači vremena/datuma u redu). */
export const compactInputClass = inputClass.replace("w-full ", "");
export const labelClass = "mb-1.5 block text-[13px] font-medium text-fg-muted";
export const primaryButtonClass = `inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-fg transition-transform duration-300 ease-out-expo hover:-translate-y-px ${focusRingClass} disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0`;
export const ghostButtonClass = `inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-bg-elev px-4 text-sm font-medium text-fg transition-colors duration-200 hover:bg-bg ${focusRingClass} disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-bg-elev`;
export const dangerButtonClass = `inline-flex h-11 items-center justify-center gap-2 rounded-full border border-cognac/40 bg-bg-elev px-4 text-sm font-medium text-oak transition-colors duration-200 hover:bg-cognac/10 ${focusRingClass} disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-bg-elev`;
export const cardClass = "rounded-[24px] border border-line bg-bg-elev p-4 sm:p-5";

export function errorMessage(err: unknown): string {
  return err instanceof ConvexError && typeof err.data === "string" ? err.data : t.error;
}

/** Pokreće async radnju, prati busy/greška i nakratko pokaže „Sačuvano". */
export function useAsyncAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const run = async (fn: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setFlash(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setFlash(false), 1800);
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { run, busy, error, flash, clearError: () => setError(null) };
}

export function StatusLine({ busy, error, flash, className = "" }: { busy: boolean; error: string | null; flash: boolean; className?: string }) {
  return (
    <p className={`min-h-5 text-[13px] ${className}`} aria-live="polite">
      {busy ? (
        <span className="text-fg-muted">{t.saving}</span>
      ) : error ? (
        <span className="text-oak">{error}</span>
      ) : flash ? (
        <span className="text-accent">{t.saved}</span>
      ) : null}
    </p>
  );
}

/** Vremena na 15 minuta, 06:00–22:00. */
export const TIME_OPTIONS: readonly number[] = Array.from({ length: (22 - 6) * 4 + 1 }, (_, i) => 6 * 60 + i * 15);

export function TimeSelect({
  id,
  value,
  onChange,
  min,
  max,
  disabled,
  ariaLabel,
  className = "",
}: {
  id?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  const opts = TIME_OPTIONS.filter((m) => (min === undefined || m >= min) && (max === undefined || m <= max));
  const list = opts.includes(value) ? opts : [value, ...opts].sort((a, b) => a - b);
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${compactInputClass} min-w-[96px] tabular-nums ${className}`}
    >
      {list.map((m) => (
        <option key={m} value={m}>
          {fmt(m)}
        </option>
      ))}
    </select>
  );
}

export function Field({ label, htmlFor, children, className = "" }: { label: string; htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}
