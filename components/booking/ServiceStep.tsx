"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { bookableGroups, bookableServices, formatDin, staffMembers, type BookableService, type StaffKey } from "@/lib/booking";
import { booking } from "./strings";
import { useRovingRadio } from "./useRovingRadio";
import { eyebrowClass, focusRingClass, wizardEase } from "./wizardStyles";

export type StaffChoice = StaffKey | "any";

/** Izmene iz admin panela (api.services.overrides), po ključu usluge. */
export type ServiceOverride = { durationMin?: number; priceFrom?: number; hidden?: boolean };
export type OverrideMap = ReadonlyMap<string, ServiceOverride>;

export function durationOf(service: BookableService, overrides: OverrideMap): number {
  return overrides.get(service.key)?.durationMin ?? service.durationMin;
}

/** Cena „od" u dinarima; null = ne prikazujemo cenu. */
export function priceOf(service: BookableService, overrides: OverrideMap): number | null {
  return overrides.get(service.key)?.priceFrom ?? service.priceFrom;
}

/** "60 min" ili "60 min · od 2.500 din" */
export function serviceMeta(service: BookableService, overrides: OverrideMap): string {
  const parts = [booking.service.minutes(durationOf(service, overrides))];
  const price = priceOf(service, overrides);
  if (price !== null) parts.push(booking.service.priceFrom(formatDin(price)));
  return parts.join(" · ");
}

type Props = {
  serviceKey: string | null;
  staffKey: StaffChoice;
  overrides: OverrideMap;
  onService: (key: string) => void;
  onStaff: (key: StaffChoice) => void;
};

const cardClass =
  "relative grid min-h-[64px] w-full content-center rounded-2xl border bg-bg px-4 py-3 text-left transition-[border-color,box-shadow,background-color] duration-300 ease-out-expo";

/** Jedna grupa usluga (Šišanje, Farbanje…) kao radio grupa sa jednim tab-stopom. */
function ServiceGroup({
  labelId,
  label,
  items,
  serviceKey,
  overrides,
  onService,
}: {
  labelId: string;
  label: string;
  items: readonly BookableService[];
  serviceKey: string | null;
  overrides: OverrideMap;
  onService: (key: string) => void;
}) {
  const reduce = useReducedMotion() ?? false;
  const selectedIndex = items.findIndex((s) => s.key === serviceKey);
  const { rovingIndex, setRef, onKeyDown } = useRovingRadio<HTMLButtonElement>(items.length, selectedIndex, (i) =>
    onService(items[i].key),
  );

  return (
    <div>
      <p id={labelId} className={`${eyebrowClass} mb-3`}>
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {items.map((s, i) => {
          const isSel = s.key === serviceKey;
          return (
            <motion.button
              key={s.key}
              ref={setRef(i)}
              type="button"
              role="radio"
              aria-checked={isSel}
              tabIndex={i === rovingIndex ? 0 : -1}
              onClick={() => onService(s.key)}
              onKeyDown={(e) => onKeyDown(e, i)}
              whileHover={reduce ? undefined : { y: -4 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.3, ease: wizardEase }}
              className={[
                cardClass,
                isSel ? "border-neon bg-neon/10 ring-1 ring-neon shadow-[0_0_28px_-8px_var(--neon)]" : "border-line hover:border-neon/40",
                focusRingClass,
              ].join(" ")}
            >
              <span className="pr-8 text-[15px] leading-snug text-fg">{s.title}</span>
              <span className="mt-1 text-xs tabular-nums text-fg-muted">{serviceMeta(s, overrides)}</span>
              {isSel ? (
                <motion.span
                  aria-hidden="true"
                  initial={reduce ? false : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: wizardEase }}
                  className="absolute top-3 right-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neon text-ink"
                >
                  <Check size={12} strokeWidth={3} />
                </motion.span>
              ) : null}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function ServiceStep({ serviceKey, staffKey, overrides, onService, onStaff }: Props) {
  const baseId = useId();
  const visible = bookableServices.filter((s) => !overrides.get(s.key)?.hidden);
  const selected = serviceKey ? bookableServices.find((s) => s.key === serviceKey) : undefined;
  // „Ko radi?" ima smisla tek sa dva frizera — logika ostaje, danas se ne prikazuje.
  const showStaff = selected !== undefined && selected.staff.length > 1;
  const staffOptions: { key: StaffChoice; label: string }[] = [
    ...staffMembers.map((m) => ({ key: m.key as StaffChoice, label: m.name })),
    { key: "any", label: booking.service.staffAny },
  ];

  return (
    <div className="space-y-7">
      {bookableGroups.map((group, gi) => {
        const items = visible.filter((s) => s.group === group);
        if (items.length === 0) return null;
        return (
          <ServiceGroup
            key={group}
            labelId={`${baseId}-g${gi}`}
            label={group}
            items={items}
            serviceKey={serviceKey}
            overrides={overrides}
            onService={onService}
          />
        );
      })}

      {showStaff ? (
        <div>
          <p id={`${baseId}-staff`} className={`${eyebrowClass} mb-3`}>
            {booking.service.staffLabel}
          </p>
          <div role="radiogroup" aria-labelledby={`${baseId}-staff`} className="inline-flex rounded-full border border-line bg-bg p-1">
            {staffOptions.map((o) => {
              const isSel = o.key === staffKey;
              return (
                <button
                  key={o.key}
                  type="button"
                  role="radio"
                  aria-checked={isSel}
                  onClick={() => onStaff(o.key)}
                  className={[
                    "h-10 rounded-full px-4 text-[15px] transition-colors duration-200",
                    isSel ? "bg-neon font-medium text-ink" : "text-fg hover:bg-bg-elev",
                    focusRingClass,
                  ].join(" ")}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
