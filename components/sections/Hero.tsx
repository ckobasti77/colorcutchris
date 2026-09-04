"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { NeonLogo } from "@/components/brand/NeonLogo";
import { CanvasErrorBoundary } from "@/components/three/CanvasErrorBoundary";
import { SIGN, type NeonSignHandle } from "@/components/three/signConfig";
import { bookingLink } from "@/lib/contactLinks";
import { site } from "@/lib/site";
import { setTheme } from "@/lib/theme";
import { concealWords, restoreWords, revealWords } from "@/lib/textReveal";

gsap.registerPlugin(useGSAP);

/** Debounce da Lenis ne okine buđenje više puta dok se zaustavlja (ms). */
const WAKE_DEBOUNCE = 60;
/** Odlazak sa vrha bez presretača (sidro, fokus, reduced-motion): skrol preko ovoliko piksela znači "mrak". */
const REDUCED_THRESHOLD = 40;
/** Tasteri koji znače "skroluj dole". */
const SCROLL_KEYS = new Set(["ArrowDown", "PageDown", " ", "Spacebar"]);

const NeonSignCanvas = dynamic(
  () => import("@/components/three/NeonSignCanvas").then((m) => m.NeonSignCanvas),
  {
    ssr: false,
    loading: () => <NeonLogo lit={false} className="h-full w-full text-fg opacity-90" />,
  },
);

/**
 * Hero: dan u salonu. Sekcija se NE pinuje i nikad ne blokira skrolovanje.
 *
 * Dva različita pokreta nad JEDNIM skupom živih vrednosti (sign.live + copy blokovi):
 *  - MRAK = `ignition`, pauziran timeline od 2.4 s (svetlo trči kroz cevi, treperenje,
 *    zamena copy-ja). Okidač: prva skrol-namera na vrhu — progutamo tačno taj jedan
 *    događaj, sve ostalo skroluje nativno.
 *  - BUĐENJE = NIJE reverse. Cev se prosto ugasi, a soba se upali: običan tween od
 *    0.5 s. Okidač: dolazak na scrollY === 0.
 *
 * Oba se prekidaju u bilo kom frejmu i nastavljaju iz TRENUTNOG stanja:
 *  - `ignition` nije stigao do kraja → invalidate() + play(): svaki tween ponovo
 *    upiše start iz živih vrednosti, pa nastavlja odande gde ga je buđenje ostavilo;
 *  - jeste (budimo se iz pune noći) → RELIGHT: 0.6 s gasa i treperenja, bez ponovnog
 *    iscrtavanja svetla kroz cev.
 */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const [sign, setSign] = useState<NeonSignHandle | null>(null);

  // Dnevni copy je sakriven CSS-om dok ga timeline ne otkrije — a timeline čeka 3D znak.
  // Ako znak ne stigne (bez WebGL-a, izgubljen kontekst, chunk), copy se ipak pokaže.
  useEffect(() => {
    if (sign) return;
    const el = section.current;
    if (!el) return;
    const id = window.setTimeout(() => {
      for (const node of el.querySelectorAll<HTMLElement>("[data-hero-copy]")) revealWords(node, { instant: true });
    }, 1500);
    return () => window.clearTimeout(id);
  }, [sign]);

  useGSAP(
    () => {
      const el = section.current;
      if (!el || !sign) return;

      const live = sign.live;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const hint = el.querySelector<HTMLElement>("[data-hero-hint]");
      const dayWrap = el.querySelector<HTMLElement>("[data-hero-day]");
      const nightWrap = el.querySelector<HTMLElement>("[data-hero-night]");
      const status = el.querySelector<HTMLElement>("[data-hero-status]");
      const dayCopy = [...el.querySelectorAll<HTMLElement>("[data-hero-copy]")];
      const nightCopy = [...el.querySelectorAll<HTMLElement>("[data-hero-night-copy]")];
      // Labele CTA dugmadi — jedino što "trepne" na prelazu; sama dugmad nikad ne
      // menjaju providnost ni poziciju (uvek vidljiva i klikabilna).
      const ctaLabels = [...el.querySelectorAll<HTMLElement>("[data-hero-cta-label]")];
      if (!dayWrap || !nightWrap || !hint) return;

      /** Suptilan bljesak labela kroz blur — bez podizanja, bez pomeranja dugmeta. */
      const flourishLabels = () => {
        if (reduced) return;
        for (const label of ctaLabels) revealWords(label, { duration: 0.35, blur: 4, lift: 0 });
      };

      const startedScrolled = window.scrollY > 0;
      const markLit = (on: boolean) => {
        if (status) status.textContent = on ? "Neon znak je upaljen." : "Neon znak je ugašen.";
      };

      /* -------- 1. dnevni copy stiže reč po reč (isti splitter kao svuda) ------
       * Podela na reči se dešava tačno jednom, ovde; ciklus dan⇄noć je posle samo
       * animira. `restoreWords` u cleanup-u vraća DOM u prvobitno stanje.
       */
      const introInstant = reduced || startedScrolled;
      const intro: gsap.core.Animation[] = dayCopy.map((node, i) =>
        revealWords(node, { instant: introInstant, delay: introInstant ? 0 : i * 0.09 }),
      );

      /* -------- 2. krajnja stanja bez animacije (reload, reduced-motion) ------ */

      const nightDom = () => {
        gsap.set(hint, { autoAlpha: 0, display: "none" });
        for (const node of dayCopy) concealWords(node, { instant: true });
        // visibility (ne display) — dnevni blok zadržava visinu ćelije da CTA red ispod ne skoči
        gsap.set(dayWrap, { visibility: "hidden" });
        gsap.set(nightWrap, { opacity: 1 });
        for (const node of nightCopy) revealWords(node, { instant: true });
        markLit(true);
      };

      const dayDom = () => {
        gsap.set(dayWrap, { visibility: "visible" });
        gsap.set(hint, { display: "", autoAlpha: 1 });
        for (const node of nightCopy) concealWords(node, { instant: true });
        gsap.set(nightWrap, { opacity: 0 });
        for (const node of dayCopy) revealWords(node, { instant: true });
        markLit(false);
      };

      const setNightNow = () => {
        gsap.set([live.power, live.arc, live.chris, live.tint], { value: 1 });
        nightDom();
      };
      const setDayNow = () => {
        gsap.set([live.power, live.arc, live.chris, live.tint], { value: 0 });
        dayDom();
      };

      /* -------- 3. `ignition` — jedan pauziran timeline, tačno 2.400 s -------- */

      const ignition = gsap.timeline({
        paused: true,
        onComplete: () => {
          // dnevni blok se sakriva (ali zadržava visinu — visibility, ne display, da CTA
          // red ne skoči), a hint izlazi iz toka; prekid na pola ne ostavlja rupu u layoutu
          gsap.set(dayWrap, { visibility: "hidden" });
          gsap.set(hint, { display: "none" });
          markLit(true);
          sign.startPulse();
        },
      });

      ignition.call(() => setTheme("night"), undefined, 0);
      // svuda `to` (a ne `fromTo`) da invalidate() može ponovo da upiše start
      ignition.to(hint, { autoAlpha: 0, duration: SIGN.hintFade }, 0);
      ignition.to(
        live.arc,
        { value: 1, duration: SIGN.arcFill.duration, ease: "power1.inOut" },
        SIGN.arcFill.at,
      );
      ignition.to(
        live.chris,
        { value: 1, duration: SIGN.chrisFill.duration, ease: "power1.inOut" },
        SIGN.chrisFill.at,
      );
      ignition.to(live.power, { value: SIGN.runPower, duration: SIGN.run, ease: "power1.inOut" }, 0);
      ignition.to(
        live.tint,
        { value: 1, duration: SIGN.textFlip.duration, ease: "none" },
        SIGN.textFlip.at,
      );
      SIGN.flicker.forEach((value, i) => {
        ignition.to(
          live.power,
          { value, duration: SIGN.flickerStep },
          SIGN.flickerAt + i * SIGN.flickerStep,
        );
      });
      ignition.to(
        live.power,
        { value: SIGN.maxPower, duration: SIGN.hold.duration, ease: "none" },
        SIGN.hold.at,
      );

      for (const node of dayCopy) {
        ignition.add(
          concealWords(node, {
            duration: SIGN.dayOut.duration,
            staggerWindow: SIGN.dayOut.staggerWindow,
          }),
          SIGN.dayOut.at,
        );
      }
      ignition.call(flourishLabels, undefined, 1.2);
      ignition.to(nightWrap, { opacity: 1, duration: 0.2 }, SIGN.nightIn.at);
      for (const node of nightCopy) {
        ignition.add(
          revealWords(node, {
            duration: SIGN.nightIn.duration,
            staggerWindow: SIGN.nightIn.staggerWindow,
          }),
          SIGN.nightIn.at,
        );
      }

      // SIGN.hold.at + SIGN.hold.duration === SIGN.ignition, a noćni copy staje na
      // 2.20 → ignition.duration() === 2.4 (assert)

      /* -------- 4. buđenje i ponovno paljenje — zasebni tweenovi, ne reverse -- */

      let wake: gsap.core.Timeline | null = null;
      let relight: gsap.core.Timeline | null = null;
      const killWake = () => {
        wake?.kill();
        wake = null;
      };
      const killRelight = () => {
        relight?.kill();
        relight = null;
      };

      const debug = new URLSearchParams(window.location.search).has("heroDebug");
      const t0 = performance.now();
      const log = (what: string) => {
        if (!debug) return;
        const t = ((performance.now() - t0) / 1000).toFixed(3);
        const p = live.power.value.toFixed(3);
        const i = ignition.progress().toFixed(3);
        console.log("[hero " + t + "s] " + what + " power=" + p + " ignition=" + i);
      };

      /**
       * Vreme na `ignition` na kome kriva gasa ima baš zadatu vrednost. Kriva je
       * monotona na [0, run], pa je dovoljna bisekcija. Koristi se da se playhead
       * poravna sa stvarnim gasom pre nego što nastavi — bez toga bi tween koji je
       * playhead već prešao skočio pravo na svoju krajnju vrednost.
       */
      const runEase = gsap.parseEase("power1.inOut");
      const runTimeForPower = (value: number) => {
        const target = gsap.utils.clamp(0, SIGN.runPower, value);
        let lo = 0;
        let hi: number = SIGN.run;
        for (let i = 0; i < 24; i++) {
          const mid = (lo + hi) / 2;
          if (SIGN.runPower * runEase(mid / SIGN.run) < target) lo = mid;
          else hi = mid;
        }
        return (lo + hi) / 2;
      };

      /** Trčanje svetla je gotovo kad su obe cevi iscrtane — nema šta da se precrtava. */
      const runDone = () => live.arc.value > 0.999 && live.chris.value > 0.999;

      /** Noć je gotova i ne budimo se — tada nema šta da se pali. */
      const isFullyDark = () => ignition.progress() === 1 && !wake;
      /** Dan je gotov: svetlo na nuli i timeline vraćen na početak. */
      const isFullyDay = () =>
        ignition.progress() === 0 && !relight && !ignition.isActive() && live.power.value < 0.001;

      const startWake = () => {
        log("WAKE");
        sign.stopPulse();
        killRelight();
        ignition.pause(); // zadrži progress — MRAK nastavlja odavde
        killWake();
        setTheme("day");
        if (reduced) {
          // pause(0) renderuje `ignition` na nuli i upisuje zapamćene startove —
          // zato ide PRE nego što postavimo dan, inače bi vratio stari `power`
          ignition.pause(0);
          setDayNow();
          return;
        }
        // dnevni blok postaje vidljiv (visinu je i onako držao), hint se vraća u tok
        gsap.set(dayWrap, { visibility: "visible" });
        gsap.set(hint, { display: "" });
        markLit(false);

        const tl = gsap.timeline({
          defaults: { duration: SIGN.wake, ease: "power2.out", overwrite: "auto" },
          onComplete: () => {
            // sledeći MRAK iz punog dana ponovo pušta celo trčanje svetla
            ignition.pause(0);
            wake = null;
          },
        });
        // `arc`/`chris` se NE animiraju — cev se prosto ugasi, svetlo se ne vraća kroz nju
        tl.to(live.power, { value: 0 }, 0);
        tl.to(live.tint, { value: 0 }, 0);
        tl.to(nightWrap, { opacity: 0 }, 0);
        tl.to(hint, { autoAlpha: 1 }, 0);
        tl.call(flourishLabels, undefined, 0.2);
        for (const node of nightCopy) {
          tl.add(concealWords(node, { duration: 0.3, staggerWindow: 0.2 }), 0);
        }
        for (const node of dayCopy) {
          tl.add(revealWords(node, { duration: 0.3, staggerWindow: 0.2 }), 0);
        }
        wake = tl;
      };

      /** Iz pune noći: bez precrtavanja, samo gas + treperenje u 0.6 s. */
      const startRelight = () => {
        log("RELIGHT");
        sign.stopPulse();
        killWake();
        killRelight();
        const step = SIGN.relight / SIGN.flicker.length;
        const tl = gsap.timeline({
          onComplete: () => {
            ignition.progress(1, true);
            gsap.set(dayWrap, { visibility: "hidden" });
            gsap.set(hint, { display: "none" });
            markLit(true);
            sign.startPulse();
            relight = null;
          },
        });
        SIGN.flicker.forEach((value, i) => {
          tl.to(live.power, { value, duration: step, ease: "none", overwrite: "auto" }, i * step);
        });
        tl.to(live.tint, { value: 1, duration: SIGN.relight * 0.5, ease: "none" }, 0);
        tl.to(nightWrap, { opacity: 1, duration: 0.2 }, 0);
        tl.to(hint, { autoAlpha: 0, duration: 0.25 }, 0);
        for (const node of dayCopy) {
          tl.add(concealWords(node, { duration: 0.35, staggerWindow: 0.25 }), 0);
        }
        for (const node of nightCopy) {
          tl.add(revealWords(node, { duration: 0.25, staggerWindow: 0.15 }), 0.2);
        }
        relight = tl;
      };

      const goDark = () => {
        log("GO DARK");
        for (const a of intro) a.progress(1);
        sign.stopPulse();
        killWake();
        killRelight();
        setTheme("night");
        if (reduced) {
          setNightNow();
          ignition.progress(1, true);
          return;
        }
        if (runDone()) {
          // cevi su već iscrtane (budimo se iz noći ili iz prekinutog buđenja posle
          // trčanja) — nema šta da se precrtava, samo gas i treperenje
          startRelight();
          return;
        }
        // svaki tween ponovo upiše start iz TRENUTNE žive vrednosti, a playhead se
        // spusti na mesto gde kriva gasa odgovara stvarnom gasu → nastavlja se odatle
        ignition.invalidate();
        ignition.seek(Math.min(ignition.time(), runTimeForPower(live.power.value)), true);
        ignition.play();
      };

      /* -------- 5. okidači ---------------------------------------------------- */

      const canGoDark = () =>
        !reduced && window.scrollY === 0 && !ignition.isActive() && !relight && !isFullyDark();

      const swallow = (e: Event) => {
        e.preventDefault();
        e.stopImmediatePropagation();
      };

      const onWheel = (e: WheelEvent) => {
        if (e.deltaY <= 0 || !canGoDark()) return;
        swallow(e);
        goDark();
      };

      let touchStartY = 0;
      const onTouchStart = (e: TouchEvent) => {
        touchStartY = e.touches[0]?.clientY ?? 0;
      };
      const onTouchMove = (e: TouchEvent) => {
        const y = e.touches[0]?.clientY ?? 0;
        // prst gore = strana ide dole
        if (touchStartY - y < 6 || !canGoDark()) return;
        swallow(e);
        goDark();
      };

      const onKey = (e: KeyboardEvent) => {
        if (!SCROLL_KEYS.has(e.key) || !canGoDark()) return;
        const t = e.target as HTMLElement | null;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        swallow(e);
        goDark();
      };

      // capture + non-passive → naš listener trči PRE Lenis-a (SmoothScroll.tsx).
      // Osluškivači stoje ceo život komponente; `canGoDark()` je taj koji ih naoružava,
      // pa se presretač vraća sam od sebe posle svakog buđenja — bez dodavanja novih.
      const opts: AddEventListenerOptions = { capture: true, passive: false };
      window.addEventListener("wheel", onWheel, opts);
      window.addEventListener("touchstart", onTouchStart, opts);
      window.addEventListener("touchmove", onTouchMove, opts);
      window.addEventListener("keydown", onKey, opts);

      let wakeTimer = 0;
      const onScroll = () => {
        window.clearTimeout(wakeTimer);
        wakeTimer = window.setTimeout(() => {
          if (window.scrollY === 0) {
            if (!isFullyDay() && !wake) startWake();
            return;
          }
          // odlazak sa vrha bez presretača točkića — programski skrol na sidro (CTA, nav →
          // Lenis scrollTo), fokus tastaturom, reduced-motion: sam skrol okida mrak, da
          // hero ne ostane u danu dok je tema ispod već noć
          if (isFullyDay() && window.scrollY > REDUCED_THRESHOLD) goDark();
        }, WAKE_DEBOUNCE);
      };
      window.addEventListener("scroll", onScroll, { passive: true });

      if (debug) {
        (window as unknown as Record<string, unknown>).__hero = { ignition, live };
      }

      // reload na sredini strane / hash link: odmah noć, temu ispod drži SceneTheme
      if (startedScrolled) {
        setNightNow();
        ignition.progress(1, true);
        sign.startPulse();
      }

      return () => {
        window.removeEventListener("wheel", onWheel, opts);
        window.removeEventListener("touchstart", onTouchStart, opts);
        window.removeEventListener("touchmove", onTouchMove, opts);
        window.removeEventListener("keydown", onKey, opts);
        window.removeEventListener("scroll", onScroll);
        window.clearTimeout(wakeTimer);
        sign.stopPulse();
        killWake();
        killRelight();
        ignition.kill();
        for (const a of intro) a.kill();
        for (const node of [...dayCopy, ...nightCopy, ...ctaLabels]) restoreWords(node);
      };
    },
    { dependencies: [sign], scope: section },
  );

  return (
    <section
      ref={section}
      id="top"
      className="relative flex min-h-svh w-full flex-col justify-center overflow-hidden px-6 pt-28 pb-16 md:px-10 lg:px-16"
      aria-label="Uvod"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-6">
        {/* Copy — dnevni i noćni tekst dele istu ćeliju; CTA red stoji ispod, van animacije */}
        <div className="relative z-10 order-2 lg:order-1">
          <div className="grid">
            <div data-hero-day data-reveal="off" className="col-start-1 row-start-1">
              <p
                data-hero-copy
                className="mb-6 text-xs font-medium uppercase tracking-[0.22em] text-fg-muted"
              >
                Frizerski salon · {site.address.street}, {site.city}
              </p>

              <h1 data-hero-copy className="text-display text-[clamp(2.75rem,7.2vw,6.25rem)] text-fg">
                <span className="block">Boja, šišanje</span>
                <span className="block italic">
                  i sve ono <span className="not-italic">više</span>.
                </span>
              </h1>

              <p
                data-hero-copy
                className="mt-7 max-w-md text-base leading-relaxed text-fg-muted md:text-lg"
              >
                Salon u Bojanskoj koji izgleda kao lepo uređen stan, sa koloristom koji sluša pre
                nego što uzme makaze. Slike radova ne retuširam — ono što vidiš, to dobiješ.
              </p>
            </div>

            {/* Noćna verzija copy-ja — stiže dok se pale cevi */}
            <div
              data-hero-night
              data-reveal="off"
              className="pointer-events-none col-start-1 row-start-1 self-center opacity-0"
            >
            <p
              data-hero-night-copy
              className="mb-6 text-xs font-medium uppercase tracking-[0.22em] text-neon"
            >
              color cut · and more
            </p>
            <h2
              data-hero-night-copy
              className="text-display text-[clamp(2.5rem,6.4vw,5.5rem)] text-fg"
            >
              <span className="block">Kad se ugase svetla,</span>
              <span className="block italic">ostaje potpis.</span>
            </h2>
            <p
              data-hero-night-copy
              className="mt-7 max-w-md text-base leading-relaxed text-fg-muted md:text-lg"
            >
              Svaka boja koja izađe iz salona nosi ga. Nastavi da skroluješ — pokazaćemo ti šta
              radimo i koliko košta.
            </p>
            </div>
          </div>

          {/* CTA — sopstveni kontejner, uvek vidljiv i klikabilan (nije u dan/noć timeline-u).
              Boje prate temu preko tokena; samo labele "trepnu" na prelazu. */}
          <div data-hero-cta data-reveal="off" className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href={bookingLink.href}
              className="inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-medium text-accent-fg transition-[transform,background-color] duration-300 ease-out-expo hover:-translate-y-0.5"
            >
              <span data-hero-cta-label>Zakaži termin</span>
            </a>
            <a
              href="#radovi"
              className="inline-flex h-12 items-center rounded-full border border-line px-6 text-sm font-medium text-fg transition-colors hover:bg-bg-elev"
            >
              <span data-hero-cta-label>Pogledaj radove</span>
            </a>
          </div>
        </div>

        {/* Neon znak */}
        <div className="relative order-1 aspect-square w-full max-w-[560px] justify-self-center lg:order-2 lg:max-w-none">
          <div className="absolute inset-0">
            <CanvasErrorBoundary fallback={<NeonLogo lit={false} className="h-full w-full text-fg opacity-90" />}>
              <NeonSignCanvas signRef={setSign} />
            </CanvasErrorBoundary>
          </div>
          <span data-hero-status data-reveal="off" className="sr-only">
            Neon znak je ugašen.
          </span>
        </div>
      </div>

      {/* scroll hint */}
      <div
        data-hero-hint
        data-reveal="off"
        className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center text-[11px] uppercase tracking-[0.2em] text-fg-muted"
      >
        <span className="flex items-center gap-3">
          <span className="h-px w-8 bg-fg-muted/50" />
          skroluj — ugasi svetla
          <span className="h-px w-8 bg-fg-muted/50" />
        </span>
      </div>
    </section>
  );
}
