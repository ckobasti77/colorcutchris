ultracode ultrathink

# Zakazivanje termina + admin panel + Convex backend — color cut Chris and more

Ti si senior full-stack + UI/UX inženjer. Radiš **sam, preko noći, bez pitanja** — Jovan spava. Ako nešto nije jasno, izaberi najrazumniju opciju, zapiši je u `docs/DECISIONS.md` i nastavi. Ne staj dok sve iz „Definicija urađenog“ na dnu nije zeleno **na produkciji**.

Referentna implementacija (feature-for-feature): projekat `C:\Users\admin\Desktop\Web Dev Projects\dfrajlica` (live: https://dfrajlica.vercel.app i /admin). **Čitaj taj kod pre nego što pišeš svoj** — posebno `convex/*`, `lib/slots.ts`, `app/admin/*`, `components/booking/*`, `content/site.ts` (deo `bookableServices`/`bookingV2`). Preuzmi logiku 1:1, a UI napravi ispočetka u stilu ovog sajta. Ne kopiraj plum/paper boje, ćirilicu, ni imena „Branka/Jana“.

**Vizuelne reference:** (1) brend sajta — `docs/BRAND.md`, `public/brand/reference/*.png`, `docs/reference/*` i postojeće sekcije (posebno `Reviews.tsx`, `ReviewPrompt.tsx`, `Prices.tsx` — isti jezik kartica, radijusa, `border-line`, `neon` fokus). (2) referentni UX — pre dizajna otvori https://dfrajlica.vercel.app Playwright-om (desktop 1440 + mobile 390) i snimi svaki korak javnog wizard-a u `docs/reference/dfrajlica/` (izaberi uslugu → dan → slotovi → podaci → probaj prazan submit za greške; **ne šalji pravi zahtev**). Za admin nemaš ključ — čitaj `app/admin/*.tsx` i, ako postoji, folder `docs/reference/dfrajlica/admin-*.png` koji je Jovan ostavio. Iz ovih snimaka uzimaš **raspored i tok**, ne boje i fontove.

Pre kodiranja učitaj skillove koje imaš instalirane (proveri `.claude/skills` u projektu i `~/.claude/skills`): **ui-ux-pro-max, impeccable, design-taste-frontend, motion-design, apple-design, text-reveal, convex-\*** (convex-design, convex-crons, convex-deploy-guard, convex-test, convex-verify, convex-env). Prati `CLAUDE.md`, `AGENTS.md` i `docs/BRAND.md` u ovom projektu.

---

## 0. Higijena repoa (prvo!)

1. Radi **direktno na `main`** u `C:\Users\admin\Desktop\Web Dev Projects\colorcutchris` — ne pravi novi worktree.
2. `git status` pokazuje necommitovane izmene na `main` (rezultat prethodnog zadatka: senka neona, day⇄night tranzicija). Proveri da `npm run lint && npx tsc --noEmit && npm run build` prolaze, pa ih commituj: `feat(hero): neon shadow + interruptible day/night transition`.
3. Grana `claude/contact-map-polish-cfb35e` (worktree `.claude/worktrees/contact-map-polish-cfb35e`) je zadatak „mapa dole + hero CTA ostaju“. Ako je gotova (ima commit-ove iznad main-a): `git merge --no-ff claude/contact-map-polish-cfb35e`, reši konflikte, pa `git worktree remove --force` za oba worktree-a i `git branch -d` za merge-ovane grane. Ako grana nema ništa novo — samo je ukloni.
4. `git push origin main`. Od sada: **commit posle svake faze ispod**, push na kraju svake faze.
5. Nikad ne commituj `.env*`, ključeve, `.claude/worktrees`, `Claude outputs/`.

---

## 1. Šta pravimo (obim)

### 1.1 Javni deo — sekcija „Zakazivanje“
- Nova sekcija `components/sections/Booking.tsx` (`id="zakazivanje"`) na one-page-u, **između Cenovnika i Kontakta**, unutar `SceneTheme night` (neon-mrak) — Kontakt ostaje „dan“.
- Wizard u 3 koraka (isto kao dfrajlica `BookingWizard`): **Usluga → Dan i vreme → Podaci**, plus „Tvoj termin“ summary kartica (desktop: sticky pored wizard-a; mobilni: sažeta traka iznad dugmadi).
  - **Korak 1 Usluga:** grupe (Šišanje / Farbanje / Styling / Svečano), kartice sa trajanjem i „od X din“ (ako cena postoji). Pošto trenutno postoji **jedan frizer (Kristian, key `chris`)**, izbor „Ko radi?“ se **ne prikazuje** dok u bazi nema ≥2 aktivna staff-a (logika za više staff-ova ostaje u backendu i UI se automatski pojavi).
  - **Korak 2 Dan i vreme:** WeekStrip (7 dana, prev/next nedelja, horizont 30 dana, zatamnjeni dani bez termina, oznake „danas“, „zatvoreno“, „nema termina“), SlotChips grupisani **Prepodne / Popodne** (granica 14:00), prikaz „Termin: 10:00–11:30“. Slotovi dolaze **isključivo sa servera** (`availability.day/week`), sa `now` zaokruženim na 5 min i osvežavanjem na minut.
  - **Korak 3 Podaci:** Ime i prezime (2–60), Telefon (srpski format, normalizacija kao `validate.ts`), Napomena (≤300, counter), honeypot polje `website` (vizuelno sakriveno, `tabIndex=-1`, `autoComplete="off"`), tekst privatnosti: „Podatke koristim samo da potvrdim termin. Termin nije potvrđen dok ti se ne javim.“
  - **Uspeh:** animirani check (pathLength), „Zahtev je poslat“, tekst „Chris potvrđuje termin porukom ili pozivom na 060 373 8001. Termin je rezervisan do potvrde (48 h).“, brzi kanali **Viber / Poziv** sa pripremljenom porukom (`Zdravo! Poslao/la sam zahtev preko sajta: {usluga}, {dan} u {vreme}. {ime}`), dugme „Novi zahtev“.
  - **Greške:** inline poruke ispod polja + ErrorBanner sa fallback-om „Pozovi ili piši na Viber“. Ako slot nestane dok korisnik kuca (reaktivnost Convex-a) → vrati na korak 2 sa porukom „Termin je upravo zauzet — izaberi drugi.“
  - Ako `NEXT_PUBLIC_CONVEX_URL` ne postoji → `NoBackendFallback` (bez hook-ova).
- Sav tekst **srpski, latinica, ti-forma, u Kristianovom glasu** (vidi `docs/BRAND.md` → Ton). Stringovi u `components/booking/strings.ts`.
- **Hero CTA „Zakaži termin“**, Nav CTA i „Zakaži“ u kontakt-traci (dole) skroluju na `#zakazivanje` (Lenis `scrollTo`, offset za Nav).

### 1.2 Kontakt-traka sa ikonicama (pristupačno, ne samo u footeru)
- Nova komponenta `components/ui/ContactRail.tsx`, montirana u `app/layout.tsx` (ne u admin ruti).
- **Desktop (≥1024px):** vertikalni „dock“ fiksiran uz **desnu ivicu**, vertikalno centriran, pojavljuje se (reveal: blur+lift, stagger) tek kad hero izađe iz viewport-a; ikonice: **Instagram, Facebook, Viber, Poziv, Mail**, plus razdvajač i akcenat dugme **„Zakaži“**. Tooltip-label na hover (motion). Ikonice = `lucide-react` (Instagram, Facebook, Phone, Mail) + inline SVG za Viber.
- **Mobilni:** sticky **donja traka** (safe-area inset) sa 4 akcije: Poziv · Viber · Instagram · **Zakaži** (akcenat). Sakriva se (translateY) dok je sekcija `#zakazivanje` u viewport-u i dok je otvoren wizard korak 3 (da ne pokriva dugmad).
- Svi linkovi su **pravi anchor tagovi** sa `aria-label`, `rel="noreferrer"`, `target="_blank"` za društvene mreže:
  - Instagram: `https://www.instagram.com/colorcutchrisandmore/` → upiši u `lib/site.ts` (`social.instagram`, ukloni TODO)
  - Facebook: `site.social.facebook`
  - Viber: `site.viber` · Poziv: `site.phone.href` · Mail: `mailto:${site.email}`
- Iste ikonice dodaj i u **Nav** (desktop, desno od linkova, manje) i zadrži u footeru/Kontaktu. Boje: prate temu (day: ink/sage, night: cream/neon), fokus-ring `neon`.

### 1.3 Admin panel `/admin`
- `app/admin/page.tsx` + `AdminPanel.tsx` (client), `robots: noindex`, **bez** ContactRail/SmoothScroll/SceneTheme — čist, brz, radi na telefonu (Kristian će ga koristiti sa telefona).
- Auth kao dfrajlica: **deljeni `ADMIN_KEY`** (Convex env) prosleđen kao `key` arg u svaku admin funkciju; `assertAdminKey` u `convex/lib/admin.ts`; ključ u `sessionStorage` (`ccc_admin_key`), forma za unos (type=password), `KeyErrorBoundary` za pogrešan ključ, dugme „Promeni ključ“.
- Tabovi (`sessionStorage` pamti aktivni): **Zahtevi** (badge sa brojem) · **Kalendar** · **Radno vreme** · **Usluge**.
  - **Zahtevi:** lista `nov` sortirana po datumu/vremenu, kartica: usluga, dan (dug format, sr-Latn), vreme, primljeno (datum/vreme), izvor (sajt/ručno), ime, telefon kao `tel:` link, napomena; dugmad **Potvrdi / Odbij**; prazno stanje.
  - **Kalendar:** dnevni prikaz 08:00–21:00, red 30 min (44px), kolona po staff-u (sad jedna), zatamnjeno van radnog vremena (poštuje override), legenda (Potvrđen / Na čekanju / Pauza / Van radnog vremena), navigacija ◀ datum ▶ + „Danas“; klik na ćeliju → sheet **Dodaj termin (ručno)** ili **Blokiraj**; klik na termin → **Potvrdi / Odbij / Otkaži / Pozovi**; klik na pauzu → **Ukloni pauzu**. Ručni termin ulazi kao `potvrdjen`, `source: "admin"`, može van radnog vremena, ali **nikad preko postojećeg termina/pauze**.
  - **Radno vreme:** nedeljni raspored (po danu 0–6 opsega, TimeSelect korak 15 min, „Neradan dan“, „+ Dodaj opseg“), **Izuzeci po datumu** (+ Radna nedelja/ponedeljak, + Slobodan dan, + Posebno vreme; lista za narednih 60 dana; brisanje), **Podešavanja termina** (korak 5–120, najava 0–10080, horizont 1–365, zahtev ističe 1–720 h). Banner „Podesi radno vreme“ dok `hoursConfirmed` nije true.
  - **Usluge:** po grupama; za svaku: trajanje (5–480, korak 5, blur/Enter čuva, „Vrati podrazumevano“) **i cena „od“ (din, opciono)** i **prekidač „vidljivo u zakazivanju“** — ovo je proširenje u odnosu na dfrajlica jer Chris još nema cene na sajtu.
- UI admin-a u brand tokenima (**cream pozadina, ink tekst, sage/forest akcenti, neon samo za fokus/badge**), `Fraunces` naslovi, kartice `rounded-[24px] border-line`, 44px tap-targets, `aria-*` kao u referenci, `StatusLine` (Čuvam… / Sačuvano ✓ / Greška). Modal/sheet sa `motion` (AnimatePresence), na mobilnom bottom-sheet.

### 1.4 Backend (Convex) — preslikaj dfrajlica, adaptiraj
- `convex/schema.ts`: tabele `staff{key,name,active,order}`, `schedules`, `scheduleOverrides`, `blocks`, `bookings`, `settings`, `serviceOverrides{serviceKey,durationMin?,priceFrom?,hidden?}` — isti indeksi (`by_createdAt`, `by_status`, `by_phone`, `by_staff_date`, `by_date`, `by_staff_weekday`, `by_serviceKey`). **Bez legacy v1 polja** (`timeSlot`, `serviceId`, `staff`) i bez `migrations.ts` — ovo je čist start.
- `staffKey` validator: `v.literal("chris")` za sada, ali kod (candidateStaff, „svejedno“ balansiranje) ostaje generički.
- Statusi: `nov | potvrdjen | otkazan | odbijen`; tranzicije `nov→potvrdjen|odbijen|otkazan`, `potvrdjen→otkazan`.
- Funkcije: `bookings.request` (honeypot → lažni uspeh; validacija; horizont; provera zatvorenih dana kroz `workRangesFor`; **transakciona re-validacija slota**; rate limit 3/h po telefonu; `scheduler.runAfter(0, internal.notify.newRequest)`), `bookings.listPending/pendingCount/listRange/setStatus/createManual/expirePending`, `availability.day/week`, `schedules.listWeekly/set/listOverrides/upsertOverride/removeOverride`, `blocks.listDay/add/remove`, `services.overrides/setDuration` (+ `setPrice`, `setHidden`), `settings.get/update`, `admin.status/init` (idempotentni seed: staff `chris`, DEFAULT_WEEK, settings).
- `convex/lib/availability.ts`: `DEFAULT_SETTINGS = { slotStepMin: 30, leadTimeMin: 120, horizonDays: 30, holdHours: 48 }`; **`DEFAULT_WEEK` iz `lib/site.ts`: uto–pet 09:00–19:00, sub 10:00–17:00, ned + pon zatvoreno.**
- `convex/crons.ts`: `crons.interval("expire pending booking requests", { hours: 1 }, internal.bookings.expirePending)` — istekli → `otkazan`, napomena `· isteklo`.
- `convex/notify.ts` (action): Resend email vlasniku na novi zahtev (ime, telefon `tel:` link, usluga, dan, vreme, napomena, link na `/admin`). **Ako `RESEND_API_KEY` ne postoji → loguj i ne pucaj.** Env: `RESEND_API_KEY`, `NOTIFY_EMAIL` (default `vlajkovick@gmail.com`), `RESEND_FROM`.
- `lib/slots.ts` — prekopiraj 1:1 (čista aritmetika, Europe/Belgrade) + `lib/slots.test.ts` (vitest) — instaliraj `vitest` kao devDependency, script `test`.
- Poruke grešaka u `convex/lib/validate.ts` prevedi na latinicu/ti-formu (npr. „Termin je upravo zauzet — izaberi drugi.“, „Previše zahteva. Pozovi 060 373 8001.“).
- Usluge za zakazivanje: `lib/booking.ts` → `bookableGroups`, `bookableServices` (key, title, group, durationMin, priceFrom: null, staff: ["chris"]). Predlog liste (Jovan/Chris menjaju posle u admin-u): Šišanje: žensko šišanje 60, muško šišanje 45, šiške 15, dečje šišanje 30 · Farbanje: farbanje izrastka 90, farbanje cele dužine 120, balayage / air-touch 240, toniranje/gloss 60, prekrivanje sedih 90 · Styling: feniranje 45, talasi/glačanje 60, tretman (keratin/rekonstrukcija) 60 · Svečano: svečana frizura 90, proba za venčanje 60, mladenka na dan venčanja 120. Sve `priceFrom: null` → UI ne prikazuje cenu dok admin ne unese.
- `components/providers/ConvexClientProvider.tsx` (client; `null` client ako nema URL-a) u `app/layout.tsx`.

---

## 2. UI/UX i animacije — standard „maksimalno“
- Koristi **text-reveal skill** za sve naslove/leadove nove sekcije i praznih stanja (ne za wizard sadržaj koji se menja po koraku — tamo `motion` variants kao u referenci: slide 24px + fade, `mode="wait"`, `useReducedMotion`).
- Kartice usluga: hover lift 4px + border `neon/40`, selected stanje sa neon prstenom i mekim glow-om (`neon-glow` utility). Slot chip: `scale` na tap, selected = neon pozadina + ink tekst. WeekStrip: `layoutId` indikator pod izabranim danom.
- Summary kartica: `AnimatePresence` po polju, tabular-nums, promena vrednosti = kratak blur-in.
- Uspeh: check crta se `pathLength 0→1` 0.5s, zatim tekst text-reveal.
- Sve ≥44px tap-target, vidljiv fokus (`outline-neon`), `aria-live="polite"` region za status („Učitavam slobodne termine…“, greške), `role="radiogroup"` za slotove, `role="tablist"` u admin-u.
- Performanse: sekcija zakazivanja ne sme da smanji Lighthouse mobile ispod 90 (bez R3F ovde; `lucide-react` tree-shaken; `next/dynamic` za wizard ako treba). Poštuj React Compiler ESLint pravila (nema ref-ova u renderu, nema sync setState u efektima).
- Lenis: elementi sa unutrašnjim skrolom (TimeSelect, kalendar, modal) dobijaju `data-lenis-prevent`. Admin ruta **ne** koristi Lenis.

---

## 3. Env, produkcija i deploy (obavezno, do kraja)
1. Convex je već povezan (`.env.local`: `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`). Razvijaj sa `npx convex dev` u pozadini; kad backend prođe testove, **`npx convex deploy`** (prod). Zapamti prod URL (`npx convex deploy` ga ispisuje; ili `npx convex dashboard`).
2. Generiši admin ključ: `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`. Postavi ga: `npx convex env set ADMIN_KEY <ključ>` (dev) **i** `npx convex env set ADMIN_KEY <ključ> --prod`. Isti postupak za `NOTIFY_EMAIL=vlajkovick@gmail.com`. `RESEND_API_KEY` **ne postoji** — ostavi notify kao graceful no-op i zapiši u HANDOVER kako se uključuje.
3. **Ključ upiši samo u `HANDOVER-SECRETS.local.md`** (dodaj `*.local.md` u `.gitignore`) — nikad u git, nikad u čet-izlaz osim u tom fajlu.
4. **Vercel se NE dira iz CLI-ja** (nema `vercel login/link/--prod`). Deploy na produkciju = **`git push origin main`** → Vercel automatski builduje sa GitHub-a. Da bi znao da je build prošao: `gh api repos/ckobasti77/colorcutchris/commits/$(git rev-parse HEAD)/status` (ili `.../deployments`) — čekaj `success`, uzmi produkcioni URL iz deployment-a (`environment_url` / Vercel status link). Ako `gh` nije ulogovan, poll-uj produkcioni URL dok u HTML-u ne vidiš marker novog builda (dodaj `<meta name="build" content="<git sha>">` u `app/layout.tsx` iz `process.env.VERCEL_GIT_COMMIT_SHA ?? "dev"`).
5. Env na Vercelu (`NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`) postavlja Jovan u dashboard-u. Posle prvog uspešnog builda otvori produkciju: ako sekcija Zakazivanje prikazuje `NoBackendFallback` ili konzola javi da nema Convex URL-a → env nije postavljen za Production. **Ne staj**: završi sve ostalo, a u `docs/HANDOVER.md` na vrhu napiši crvenim „URADI PRVO“: tačan prod Convex URL (iz `npx convex deploy` izlaza / `npx convex dashboard`) koji treba upisati u Vercel → Settings → Environment Variables → Production, i da posle toga uradi Redeploy. Ako env postoji — nastavi na smoke test.
6. **Smoke test na produkciji** (Playwright ili curl+skripta): javna strana učitava sekciju Zakazivanje sa realnim slotovima za sutradan; pošalji jedan test-zahtev (ime „TEST Jovan“, tel 0600000000) → pojavi se u `/admin` → **Potvrdi** ga → pojavljuje se u kalendaru → **Otkaži** ga. Ostavi bazu bez test-zahteva na kraju (otkazan je OK, ali obriši ga preko `npx convex run` internal mutacije ako si je napravio; inače ostavi i zapiši).

---

## 4. Kvalitet i verifikacija (pre svakog commit-a faze)
- `npm run lint` · `npx tsc --noEmit` · `npm test` (slots) · `npm run build` — nula grešaka i nula upozorenja.
- Playwright e2e (instaliraj `@playwright/test` kao dev dep, `tests/e2e/booking.spec.ts`): (a) wizard kroz 3 koraka do uspeha na lokalnom dev-u sa `npx convex dev`; (b) `/admin` sa pogrešnim ključem prikazuje „Neispravan ključ“; (c) sa pravim ključem (iz env `E2E_ADMIN_KEY`) vidi zahtev i potvrđuje ga; (d) mobilni viewport 390×844: donja kontakt-traka vidljiva na hero-u, sakrivena u zakazivanju. Screenshot-e snimi u `docs/screenshots/booking/` (desktop + mobile: svaki korak, uspeh, sva 4 admin taba) i **pogledaj ih** — ako nešto izgleda loše, popravi.
- Ručno proveri: Lenis + wizard ne otima skrol; day/night hero animacija i dalje radi; text-reveal ne „skače“ u wizard-u; nema hydration warning-a u konzoli; `/admin` nema Lenis/ContactRail; `prefers-reduced-motion` gasi animacije.

---

## 5. Dokumentacija
- `docs/HANDOVER.md` (srpski, za Kristiana, jednostavno): kako otvori `/admin`, gde je ključ (kod Jovana), kako potvrđuje/odbija, kako dodaje pauzu i slobodan dan, kako menja trajanje i cenu usluge, šta znači „zahtev ističe posle 48 h“, kako uključiti email obaveštenja (Resend). Plus tehnički deo za Jovana: env promenljive (bez vrednosti), komande za deploy, gde je test.
- `docs/DECISIONS.md` — svaka odluka koju si doneo umesto pitanja.
- Ažuriraj `README.md` (skripte) i `docs/BRAND.md` → sekcija „Zakazivanje“ (Convex + admin, ne više „kasnije“).

---

## Definicija urađenog (sve mora biti tačno)
- [ ] `main` čist, sve commitovano i pushovano; nema worktree-ova; nema `.env*` u istoriji.
- [ ] Vercel build sa poslednjeg push-a **zelen**; produkcija ima sekciju **Zakazivanje** koja vraća prave slotove iz **Convex prod** (ili, ako Vercel env nije postavljen, HANDOVER na vrhu ima „URADI PRVO“ sa tačnim URL-om).
- [ ] Convex prod deploy-ovan (`npx convex deploy`), cron i funkcije vidljivi u dashboard-u.
- [ ] Test-zahtev sa produkcije stigao u `/admin` na produkciji, potvrđen, prikazan u kalendaru, otkazan (ako je env bio postavljen).
- [ ] `ADMIN_KEY` postavljen u Convex dev + prod; zapisan samo u `HANDOVER-SECRETS.local.md`.
- [ ] Cron `expirePending` vidljiv u Convex dashboard-u (prod).
- [ ] Kontakt-traka (desktop dock + mobilna donja traka) sa **Instagram, Facebook, Viber, Poziv, Mail, Zakaži**; Instagram URL u `lib/site.ts`; ikonice i u Nav-u i u footeru.
- [ ] Hero/Nav CTA „Zakaži termin“ vodi na `#zakazivanje`.
- [ ] Sav tekst latinica, ti-forma, bez ćirilice i bez „Branka/Jana/D frajlica“ (grep!).
- [ ] lint + tsc + vitest + build + Playwright e2e — zeleno; screenshot-i u `docs/screenshots/booking/` pregledani.
- [ ] `docs/HANDOVER.md`, `docs/DECISIONS.md` napisani; završni rezime u čet-izlazu: prod URL, admin URL, šta je ostalo za Jovana (npr. Vercel login ako je zapelo, Resend ključ, prave cene).
