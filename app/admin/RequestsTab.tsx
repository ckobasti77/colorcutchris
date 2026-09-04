"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Phone, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { admin as t } from "@/components/booking/strings";
import { staffName } from "@/lib/booking";
import { formatDateTime, formatDayLong } from "@/lib/dates";
import { fmtRange } from "@/lib/slots";
import { MULTI_STAFF, cardClass, dangerButtonClass, errorMessage, primaryButtonClass } from "./ui";

type Decision = Extract<Doc<"bookings">["status"], "potvrdjen" | "odbijen">;

export default function RequestsTab({ adminKey }: { adminKey: string }) {
  const pending = useQuery(api.bookings.listPending, { key: adminKey });
  const setStatus = useMutation(api.bookings.setStatus);
  const reduced = useReducedMotion();
  const [busy, setBusy] = useState<Id<"bookings"> | null>(null);
  const [error, setError] = useState<{ id: Id<"bookings">; message: string } | null>(null);

  const decide = async (id: Id<"bookings">, status: Decision) => {
    setBusy(id);
    setError(null);
    try {
      await setStatus({ key: adminKey, id, status });
    } catch (err) {
      setError({ id, message: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  if (pending === undefined) return <p className="text-fg-muted">{t.loading}</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-muted" aria-live="polite">
        {t.requests.count(pending.length)}
      </p>

      {pending.length === 0 ? (
        <div className={cardClass}>
          <p className="text-display text-xl text-fg">{t.requests.empty}</p>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t.requests.emptyHint}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {pending.map((b) => {
              const isBusy = busy === b._id;
              return (
                <motion.li
                  key={b._id}
                  layout={!reduced}
                  exit={reduced ? undefined : { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                  className={cardClass}
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div className="min-w-0">
                      <p className="text-display text-xl text-fg">{b.serviceTitle}</p>
                      <p className="mt-1.5 text-sm text-fg-muted">
                        {MULTI_STAFF ? `${staffName(b.staffKey)} · ` : ""}
                        {formatDayLong(b.date)} · <span className="tabular-nums">{fmtRange(b.startMin, b.endMin)}</span>
                      </p>
                    </div>
                    <p className="text-xs text-fg-muted">
                      {t.requests.received} <span className="tabular-nums">{formatDateTime(b.createdAt)}</span>
                      {b.source === "admin" ? ` · ${t.requests.source.admin}` : ""}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px]">
                    <span className="font-medium text-fg">{b.name}</span>
                    {b.phone ? (
                      <a
                        href={`tel:${b.phone}`}
                        className="inline-flex min-h-11 items-center gap-1.5 tabular-nums text-accent underline underline-offset-4 transition-colors hover:text-forest"
                      >
                        <Phone size={14} aria-hidden="true" />
                        {b.phone}
                      </a>
                    ) : null}
                  </div>

                  {b.note ? (
                    <p className="mt-3 rounded-xl bg-bg px-3 py-2 text-sm leading-relaxed text-fg">
                      <span className="text-fg-muted">{t.requests.note}: </span>
                      {b.note}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" className={primaryButtonClass} disabled={isBusy} onClick={() => void decide(b._id, "potvrdjen")}>
                      <Check size={16} aria-hidden="true" />
                      {t.requests.confirm}
                    </button>
                    <button type="button" className={dangerButtonClass} disabled={isBusy} onClick={() => void decide(b._id, "odbijen")}>
                      <X size={16} aria-hidden="true" />
                      {t.requests.decline}
                    </button>
                  </div>
                  {error && error.id === b._id ? (
                    <p role="alert" className="mt-2 text-sm text-oak">
                      {error.message}
                    </p>
                  ) : null}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
