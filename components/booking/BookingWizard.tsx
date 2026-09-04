"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { api } from "@/convex/_generated/api";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { bookableServices, formatDin, staffName, staffNameGenitive, type StaffKey } from "@/lib/booking";
import { useLenis } from "@/components/providers/SmoothScroll";
import { setContactRailSuppressed } from "@/lib/contactRail";
import { formatDayLong } from "@/lib/dates";
import { addDays, belgradeNow, fmtRange } from "@/lib/slots";
import { DetailsStep, validateDetails, type DetailsErrors, type DetailsField, type DetailsValues } from "./DetailsStep";
import { ErrorBanner } from "./ErrorBanner";
import { ServiceStep, durationOf, priceOf, type OverrideMap, type ServiceOverride, type StaffChoice } from "./ServiceStep";
import { SlotChips, type SlotOption } from "./SlotChips";
import { StepDots } from "./StepDots";
import { booking } from "./strings";
import { SuccessView, type SuccessData } from "./SuccessView";
import { SummaryBar, SummaryCard, type SummaryData } from "./SummaryCard";
import { WeekStrip, type DayInfo } from "./WeekStrip";
import { primaryButtonClass, secondaryButtonClass, wizardEase } from "./wizardStyles";

const HAS_BACKEND = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
/** Rezerva dok `settings.publicInfo` ne stigne; motor je merodavan (dani posle horizonta vraćaju 0 termina). */
const HORIZON_DAYS = 30;
const HOLD_HOURS = 48;
/** `now` koji šaljemo upitima je zaokružen, da ključ pretplate ostane stabilan nekoliko minuta. */
const NOW_ROUND_MS = 5 * 60 * 1000;

type Clock = { now: number; today: string };
type Status =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "error"; message: string }
  | ({ kind: "success" } & SuccessData);

function makeClock(): Clock {
  // NAGORE: klijent je uvek bar strog koliko i server (koji radi sa pravim satom), pa se
  // ne nudi termin koji bi mutacija odbila kao „upravo zauzet" zbog najave.
  const now = Math.ceil(Date.now() / NOW_ROUND_MS) * NOW_ROUND_MS;
  return { now, today: belgradeNow(now).date };
}

const emptyDetails: DetailsValues = { name: "", phone: "", note: "", website: "" };

/**
 * Zadrži poslednju poznatu vrednost dok je nova `undefined` — ali samo dok je `key`
 * (dan/usluga/frizer, bez sata) isti; promena dana odmah pokazuje skelet.
 */
function useLastFor<T>(value: T | undefined, key: string): T | undefined {
  const [last, setLast] = useState<{ key: string; value: T } | null>(null);
  useEffect(() => {
    const remember = () => {
      if (value !== undefined) setLast({ key, value });
    };
    remember();
  }, [value, key]);
  if (value !== undefined) return value;
  return last && last.key === key ? last.value : undefined;
}

const stepVariants = {
  initial: (dir: number) => ({ opacity: 0, x: 24 * dir }),
  animate: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: -24 * dir }),
};

function BookingWizardLive() {
  const baseId = useId();
  const ids = {
    name: `${baseId}-name`,
    phone: `${baseId}-phone`,
    note: `${baseId}-note`,
    website: `${baseId}-website`,
    heading: `${baseId}-heading`,
    hint: `${baseId}-hint`,
  };
  const reduce = useReducedMotion() ?? false;
  const lenis = useLenis();
  const request = useMutation(api.bookings.request);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [serviceKey, setServiceKey] = useState<string | null>(null);
  const [staffKey, setStaffKey] = useState<StaffChoice>("any");
  const [clock, setClock] = useState<Clock | null>(null);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [startMin, setStartMin] = useState<number | null>(null);
  const [details, setDetails] = useState<DetailsValues>(emptyDetails);
  const [errors, setErrors] = useState<DetailsErrors>({});
  const [touched, setTouched] = useState<Partial<Record<DetailsField, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [live, setLive] = useState("");

  const headingRef = useRef<HTMLHeadingElement>(null);
  /** Fokus na naslov koraka tek posle prve navigacije — ne pri mount-u. */
  const navigatedRef = useRef(false);

  // Sat za najavu / „danas" — proverava se svakog minuta, ali se menja tek kad
  // zaokruženi `now` (5 min) ili dan stvarno pređu — inače ista referenca, bez re-rendera.
  useEffect(() => {
    const tick = () =>
      setClock((prev) => {
        const next = makeClock();
        return prev && prev.now === next.now && prev.today === next.today ? prev : next;
      });
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const service = useMemo(() => (serviceKey ? bookableServices.find((s) => s.key === serviceKey) : undefined), [serviceKey]);
  const overrides = useQuery(api.services.overrides, {});
  const info = useQuery(api.settings.publicInfo, {});
  const horizonDays = info?.horizonDays ?? HORIZON_DAYS;
  const holdHours = info?.holdHours ?? HOLD_HOURS;
  const overrideMap = useMemo<OverrideMap>(
    () => new Map<string, ServiceOverride>((overrides ?? []).map((o) => [o.serviceKey, o])),
    [overrides],
  );
  const durationMin = service ? durationOf(service, overrideMap) : 0;
  const priceFrom = service ? priceOf(service, overrideMap) : null;

  const today = clock?.today ?? null;
  const horizonEnd = today ? addDays(today, horizonDays) : null;
  const effectiveWeekStart = weekStart ?? today;

  // Posle uspeha ne slušamo više dostupnost: naš termin je upravo nestao iz slobodnih
  // (mi smo ga zauzeli) i ne sme da nas vrati na izbor vremena.
  const settled = status.kind === "success";
  const weekArgs =
    clock && serviceKey && effectiveWeekStart && step >= 1 && !settled
      ? { startDate: effectiveWeekStart, serviceKey, staffKey, now: clock.now }
      : "skip";
  // Kad zaokruženi `now` pređe granicu (svakih 5 min) upit dobija nov ključ i Convex
  // vraća undefined dok stigne — zadržavamo prethodni rezultat za ISTI dan/uslugu, da
  // termini ne trepnu u skelet usred biranja.
  const week = useLastFor(useQuery(api.availability.week, weekArgs), `${effectiveWeekStart}|${serviceKey}|${staffKey}`);

  const dayArgs =
    clock && serviceKey && date && step >= 1 && !settled ? { date, serviceKey, staffKey, now: clock.now } : "skip";
  const dayAvail = useLastFor(useQuery(api.availability.day, dayArgs), `${date}|${serviceKey}|${staffKey}`);

  const slots = useMemo<SlotOption[] | undefined>(() => {
    if (dayAvail === undefined) return undefined;
    const map = new Map<number, StaffKey[]>();
    for (const { staffKey: k, slots: list } of dayAvail) {
      for (const s of list) {
        const arr = map.get(s) ?? [];
        arr.push(k);
        map.set(s, arr);
      }
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([s, staff]) => ({ startMin: s, staff }));
  }, [dayAvail]);

  const days = useMemo<DayInfo[]>(() => {
    if (!effectiveWeekStart) return [];
    const byDate = new Map((week ?? []).map((d) => [d.date, d] as const));
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(effectiveWeekStart, i);
      const info = byDate.get(d);
      return {
        date: d,
        count: week === undefined ? undefined : (info?.count ?? 0),
        open: week === undefined ? undefined : (info?.open ?? false),
      };
    });
  }, [effectiveWeekStart, week]);

  // Reaktivnost: izabrani termin je nestao (neko ga je uzeo, Chris potvrdio drugi
  // zahtev, prošla je najava) — skidamo ga i vraćamo gosta na izbor vremena.
  useEffect(() => {
    const syncSlot = () => {
      // Dok se zahtev šalje ili je već poslat, nestanak slota je očekivan (naš je) — ne diramo tok.
      if (status.kind === "pending" || status.kind === "success") return;
      if (startMin === null || slots === undefined) return;
      if (slots.some((s) => s.startMin === startMin)) return;
      setStartMin(null);
      if (step === 2) {
        setDir(-1);
        setStep(1);
        setStatus({ kind: "error", message: booking.errors.taken });
      }
    };
    syncSlot();
  }, [slots, startMin, step, status.kind]);

  // Usluga isključena usred toka (Chris je sakrio u panelu) — nazad na izbor usluge, uz poruku.
  useEffect(() => {
    const check = () => {
      if (!serviceKey || !overrideMap.get(serviceKey)?.hidden) return;
      setServiceKey(null);
      setStartMin(null);
      setDate(null);
      navigatedRef.current = true;
      setDir(-1);
      setStep(0);
      setStatus({ kind: "error", message: booking.errors.serviceHidden });
    };
    check();
  }, [serviceKey, overrideMap]);

  // Na koraku „Podaci" mobilna kontakt-traka bi prekrila dugmad — sklanjamo je.
  useEffect(() => {
    const suppress = step === 2 && status.kind !== "success";
    const apply = () => setContactRailSuppressed(suppress);
    apply();
    return () => setContactRailSuppressed(false);
  }, [step, status.kind]);

  const go = useCallback(
    (to: number) => {
      navigatedRef.current = true;
      setDir(to > step ? 1 : -1);
      setStep(to);
      setStatus((s) => (s.kind === "error" ? { kind: "idle" } : s));
    },
    [step],
  );

  /**
   * Fokus na naslov novog koraka; ako je naslov iznad ekrana (na mobilnom „Dalje" sa dna
   * duge liste usluga skupi wizard), doskroluj do njega da gost ne ostane ispod kartice.
   */
  const focusHeading = () => {
    if (!navigatedRef.current) return;
    const el = headingRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    const top = el.getBoundingClientRect().top;
    if (top >= 0) return;
    const target = window.scrollY + top - 96;
    if (lenis.current) lenis.current.scrollTo(target, { duration: reduce ? 0 : 0.8 });
    else window.scrollTo({ top: target, behavior: reduce ? "auto" : "smooth" });
  };

  const onService = (key: string) => {
    if (key === serviceKey) return;
    setServiceKey(key);
    setStartMin(null);
    const s = bookableServices.find((x) => x.key === key);
    if (s && s.staff.length === 1) setStaffKey("any");
  };
  const onStaff = (k: StaffChoice) => {
    setStaffKey(k);
    setStartMin(null);
  };
  const onDate = (d: string) => {
    if (d === date) return;
    setDate(d);
    setStartMin(null);
  };
  const shiftWeek = (n: number) => {
    if (!effectiveWeekStart) return;
    setWeekStart(addDays(effectiveWeekStart, n));
  };

  const setField = <K extends keyof DetailsValues>(key: K, value: DetailsValues[K]) => {
    const next = { ...details, [key]: value };
    setDetails(next);
    setErrors(validateDetails(next));
  };
  const blurField = (field: DetailsField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateDetails(details));
  };

  const canProceed = step === 0 ? Boolean(serviceKey) : step === 1 ? Boolean(date && startMin !== null) : true;

  const submit = async () => {
    if (!service || !date || startMin === null) return;
    setTouched({ name: true, phone: true, note: true });
    const errs = validateDetails(details);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const first = (["name", "phone", "note"] as const).find((f) => errs[f]);
      if (first) document.getElementById(ids[first])?.focus();
      return;
    }
    setStatus({ kind: "pending" });
    setLive(booking.details.submitting);
    const name = details.name.trim();
    try {
      const res = await request({
        name,
        phone: details.phone.trim(),
        serviceKey: service.key,
        staffKey,
        date,
        startMin,
        note: details.note.trim() || undefined,
        website: details.website || undefined,
      });
      setStatus({
        kind: "success",
        staffKey: res.staffKey,
        startMin: res.startMin,
        endMin: res.endMin,
        date,
        serviceTitle: service.title,
        name,
      });
      setLive(booking.success.title);
    } catch (err) {
      const message = err instanceof ConvexError && typeof err.data === "string" ? err.data : booking.errors.generic;
      setLive(message);
      if (message === booking.errors.taken) {
        setStartMin(null);
        setDir(-1);
        setStep(1);
      }
      setStatus({ kind: "error", message });
    }
  };

  const primary = () => {
    if (status.kind === "pending") return;
    if (step < 2) {
      if (canProceed) go(step + 1);
      return;
    }
    void submit();
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    primary();
  };

  const reset = () => {
    navigatedRef.current = true;
    setStep(0);
    setDir(-1);
    setServiceKey(null);
    setStaffKey("any");
    setWeekStart(null);
    setDate(null);
    setStartMin(null);
    setDetails(emptyDetails);
    setErrors({});
    setTouched({});
    setStatus({ kind: "idle" });
    setLive("");
    // Uspeh se demontira bez izlazne animacije — fokus na naslov koraka 1 posle commit-a.
    window.requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
  };

  /* ---------- rezime ---------- */
  const chosenSlot = startMin !== null ? slots?.find((s) => s.startMin === startMin) : undefined;
  const staffLabel = !service
    ? null
    : staffKey !== "any"
      ? staffName(staffKey)
      : chosenSlot && chosenSlot.staff.length === 1
        ? staffName(chosenSlot.staff[0])
        : booking.summary.staffAny;
  const summary: SummaryData = {
    service: service?.title ?? null,
    staff: service && service.staff.length > 1 ? staffLabel : null,
    date: date && step >= 1 ? formatDayLong(date) : null,
    time: startMin !== null && service ? fmtRange(startMin, startMin + durationMin) : null,
    duration: service ? booking.service.minutes(durationMin) : null,
    price: priceFrom !== null ? booking.service.priceFrom(formatDin(priceFrom)) : null,
  };

  /* ---------- uspeh ---------- */
  if (status.kind === "success") {
    return <SuccessView data={status} holdHours={holdHours} onReset={reset} />;
  }

  const pending = status.kind === "pending";
  const stepTitle = step === 0 ? booking.service.title : step === 1 ? booking.day.title : booking.details.title;

  const actions = (
    <>
      {step > 0 ? (
        <button type="button" onClick={() => go(step - 1)} disabled={pending} className={`${secondaryButtonClass} shrink-0`}>
          {booking.nav.back}
        </button>
      ) : null}
      <button
        type="button"
        onClick={primary}
        disabled={pending || (step < 2 && !canProceed)}
        className={primaryButtonClass}
        aria-describedby={step === 1 && !canProceed ? ids.hint : undefined}
      >
        {step === 2 ? (pending ? booking.details.submitting : booking.details.submit) : booking.nav.next}
      </button>
    </>
  );

  return (
    <div className="relative" data-reveal="off">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <StepDots step={step} onJump={go} disabled={pending} />
        <p className="text-[13px] tabular-nums text-fg-muted">{booking.stepOf(step + 1, booking.steps.length)}</p>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-10">
        <form onSubmit={onSubmit} noValidate className="relative min-w-0" aria-busy={pending}>
          {/* implicitna predaja (Enter u polju) — vidljiva dugmad su u rezimeu, van forme */}
          <button type="submit" tabIndex={-1} aria-hidden="true" className="sr-only" />
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: reduce ? 0 : 0.35, ease: wizardEase }}
              onAnimationComplete={(def) => {
                if (def === "animate") focusHeading();
              }}
            >
              <h3 id={ids.heading} ref={headingRef} tabIndex={-1} className="text-display text-3xl text-fg outline-none">
                {stepTitle}
              </h3>
              {step === 0 ? <p className="mt-2 text-sm leading-relaxed text-fg-muted">{booking.service.hint}</p> : null}

              <div className="mt-6">
                {step === 0 ? (
                  <ServiceStep serviceKey={serviceKey} staffKey={staffKey} overrides={overrideMap} onService={onService} onStaff={onStaff} />
                ) : null}

                {step === 1 && effectiveWeekStart && today && horizonEnd ? (
                  <div className="space-y-5">
                    <WeekStrip
                      weekStart={effectiveWeekStart}
                      today={today}
                      horizonEnd={horizonEnd}
                      selected={date}
                      days={days}
                      onSelect={onDate}
                      onPrev={() => shiftWeek(-7)}
                      onNext={() => shiftWeek(7)}
                    />
                    {date ? (
                      <div role="group" aria-label={booking.day.slotsLabel}>
                        <SlotChips
                          slots={slots}
                          selected={startMin}
                          durationMin={durationMin}
                          showStaffHint={Boolean(service && service.staff.length > 1 && staffKey === "any")}
                          onSelect={setStartMin}
                        />
                        {startMin !== null ? (
                          <p className="mt-4 text-[15px] tabular-nums text-fg">
                            {booking.day.ends(fmtRange(startMin, startMin + durationMin))}
                            {chosenSlot && chosenSlot.staff.length === 1 && service && service.staff.length > 1 ? (
                              <span className="text-fg-muted"> · {booking.day.withStaff(staffNameGenitive(chosenSlot.staff[0]))}</span>
                            ) : null}
                          </p>
                        ) : (
                          <p id={ids.hint} className="mt-4 text-sm text-fg-muted">
                            {booking.day.pickTime}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p id={ids.hint} className="text-sm text-fg-muted">
                        {booking.day.pickHint}
                      </p>
                    )}
                  </div>
                ) : null}

                {step === 2 ? (
                  <DetailsStep ids={ids} values={details} errors={errors} touched={touched} disabled={pending} onChange={setField} onBlur={blurField} />
                ) : null}
              </div>

              {status.kind === "error" ? <ErrorBanner message={status.message} /> : null}
            </motion.div>
          </AnimatePresence>
        </form>

        <div className="hidden lg:sticky lg:top-24 lg:block">
          <SummaryCard data={summary}>{actions}</SummaryCard>
        </div>
      </div>

      <SummaryBar data={summary}>{actions}</SummaryBar>

      <div aria-live="polite" className="sr-only">
        {live || (step === 1 && date && slots === undefined ? booking.day.loading : "")}
      </div>
    </div>
  );
}

/** Bez NEXT_PUBLIC_CONVEX_URL nema Convex provider-a — pa ni hook-ova. */
function NoBackendFallback() {
  return <ErrorBanner message={booking.errors.noBackend} />;
}

/** Provider je ovde (u lenjo učitanom chunk-u), ne u root layout-u — convex/react ne ide u početni bundle. */
export default function BookingWizard() {
  if (!HAS_BACKEND) return <NoBackendFallback />;
  return (
    <ConvexClientProvider>
      <BookingWizardLive />
    </ConvexClientProvider>
  );
}
