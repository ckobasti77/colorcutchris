"use client";

import { useId, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion, useReducedMotion } from "motion/react";
import { api } from "@/convex/_generated/api";
import { bookableGroups, bookableServices } from "@/lib/booking";
import { admin as t } from "@/components/booking/strings";
import { StatusLine, cardClass, focusRingClass, ghostButtonClass, inputClass, useAsyncAction } from "./ui";

/**
 * Usluge u zakazivanju: trajanje (određuje ponuđene termine), cena „od" (prazno = bez
 * cene) i prekidač vidljivosti na sajtu. Trajanje i cena se čuvaju na blur/Enter,
 * prekidač odmah. Podrazumevane vrednosti su u lib/booking.ts; ovde su samo razlike.
 */

function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([k]) => k !== key));
}

export default function ServicesTab({ adminKey }: { adminKey: string }) {
  const id = useId();
  const overrides = useQuery(api.services.overrides, {});
  const setDuration = useMutation(api.services.setDuration);
  const setPrice = useMutation(api.services.setPrice);
  const setHidden = useMutation(api.services.setHidden);
  const { run, busy, error, flash } = useAsyncAction();
  const reduced = useReducedMotion();
  const [durationDraft, setDurationDraft] = useState<Record<string, number>>({});
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  /** Usluga čije poslednje čuvanje nije prošlo — greška se ispisuje uz taj red, ne samo na vrhu. */
  const [errorKey, setErrorKey] = useState<string | null>(null);

  if (overrides === undefined) return <p className="text-fg-muted">{t.loading}</p>;
  const byKey = new Map(overrides.map((o) => [o.serviceKey, o]));

  const commitDuration = async (key: string) => {
    const value = durationDraft[key];
    if (value === undefined) return;
    const ok = await run(() => setDuration({ key: adminKey, serviceKey: key, durationMin: value }));
    setErrorKey(ok ? null : key);
    if (ok) setDurationDraft((d) => withoutKey(d, key));
  };

  const commitPrice = async (key: string) => {
    const raw = priceDraft[key];
    if (raw === undefined) return;
    const trimmed = raw.trim();
    const priceFrom = trimmed === "" ? null : Math.round(Number(trimmed));
    if (priceFrom !== null && !Number.isFinite(priceFrom)) return;
    const ok = await run(() => setPrice({ key: adminKey, serviceKey: key, priceFrom }));
    setErrorKey(ok ? null : key);
    if (ok) setPriceDraft((d) => withoutKey(d, key));
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-display text-3xl text-fg">{t.services.title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">{t.services.intro}</p>
      </div>
      <StatusLine busy={busy} error={error} flash={flash} />

      {bookableGroups.map((group) => (
        <section key={group} className={cardClass} aria-label={group}>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{group}</p>
          <ul className="mt-2 divide-y divide-line">
            {bookableServices
              .filter((s) => s.group === group)
              .map((s) => {
                const ov = byKey.get(s.key);
                const effectiveDuration = ov?.durationMin ?? s.durationMin;
                const effectivePrice = ov?.priceFrom ?? s.priceFrom;
                const visible = !ov?.hidden;
                const durationValue = durationDraft[s.key] ?? effectiveDuration;
                const durationChanged = durationDraft[s.key] !== undefined && durationDraft[s.key] !== effectiveDuration;
                const priceText = effectivePrice === null ? "" : String(effectivePrice);
                const priceValue = priceDraft[s.key] ?? priceText;
                const priceChanged = priceDraft[s.key] !== undefined && priceDraft[s.key].trim() !== priceText;
                const rowId = `${id}-${s.key}`;
                return (
                  <li key={s.key} className="py-4 first:pt-3 last:pb-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className={`flex flex-wrap items-center gap-2 text-[15px] font-medium text-fg ${visible ? "" : "opacity-60"}`}>
                          <span>{s.title}</span>
                          {!visible ? (
                            <span className="rounded-full border border-line bg-bg px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-fg-muted">
                              {t.services.hiddenBadge}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs text-fg-muted">{t.services.defaultOf(s.durationMin)}</p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={visible}
                        aria-label={`${s.title} — ${t.services.visible}`}
                        disabled={busy}
                        onClick={() => {
                          const nextVisible = !visible;
                          void run(() => setHidden({ key: adminKey, serviceKey: s.key, hidden: !nextVisible }));
                        }}
                        className={`-mr-2 inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-2 ${focusRingClass} disabled:opacity-50`}
                      >
                        <span className="hidden text-xs text-fg-muted sm:inline">{t.services.visible}</span>
                        <span
                          aria-hidden="true"
                          className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors duration-200 ${
                            visible ? "justify-end bg-accent" : "justify-start bg-line"
                          }`}
                        >
                          <motion.span
                            layout
                            transition={reduced ? { duration: 0 } : { type: "spring", duration: 0.3, bounce: 0 }}
                            className="block h-5 w-5 rounded-full bg-bg-elev shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                          />
                        </span>
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          id={`${rowId}-dur`}
                          type="number"
                          inputMode="numeric"
                          min={5}
                          max={480}
                          step={5}
                          value={durationValue}
                          onChange={(e) => setDurationDraft((d) => ({ ...d, [s.key]: Number(e.target.value) }))}
                          onBlur={() => {
                            if (durationChanged) void commitDuration(s.key);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && durationChanged) {
                              e.preventDefault();
                              void commitDuration(s.key);
                            }
                          }}
                          className={`${inputClass} w-24 tabular-nums ${durationChanged ? "ring-2 ring-focus" : ""}`}
                          aria-label={`${s.title} — ${t.services.duration}`}
                        />
                        <span className="text-[13px] text-fg-muted">{t.services.minutes}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          id={`${rowId}-price`}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={100}
                          placeholder={t.services.pricePlaceholder}
                          value={priceValue}
                          onChange={(e) => setPriceDraft((d) => ({ ...d, [s.key]: e.target.value }))}
                          onBlur={() => {
                            if (priceChanged) void commitPrice(s.key);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && priceChanged) {
                              e.preventDefault();
                              void commitPrice(s.key);
                            }
                          }}
                          className={`${inputClass} w-28 tabular-nums ${priceChanged ? "ring-2 ring-focus" : ""}`}
                          aria-label={`${s.title} — ${t.services.priceFrom}`}
                        />
                        <span className="text-[13px] text-fg-muted">{t.services.din}</span>
                      </div>

                      {effectiveDuration !== s.durationMin ? (
                        <button
                          type="button"
                          className={`${ghostButtonClass} px-3`}
                          disabled={busy}
                          onClick={() =>
                            void run(() => setDuration({ key: adminKey, serviceKey: s.key, durationMin: s.durationMin }))
                          }
                        >
                          {t.services.reset}
                        </button>
                      ) : null}
                    </div>
                    {errorKey === s.key && error ? (
                      <p role="alert" className="mt-2 text-sm text-oak">
                        {error}
                      </p>
                    ) : null}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
