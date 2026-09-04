# color cut Chris and more — sajt

One-page sajt frizerskog salona (Beograd, Bojanska 24) sa onlajn zakazivanjem termina i admin panelom.
Next.js 16 (App Router) · React 19 · Tailwind v4 · Convex (backend) · GSAP + motion · Lenis · R3F (neon u hero-u).

Brend, ton i vizuelni DNK: [`docs/BRAND.md`](docs/BRAND.md). Odluke tokom izrade: [`docs/DECISIONS.md`](docs/DECISIONS.md).
Uputstvo za Chrisa i tehnički handover: [`docs/HANDOVER.md`](docs/HANDOVER.md).

## Pokretanje

```bash
npm install
npx convex dev      # u zasebnom terminalu: gura convex/ na dev deployment i drži tipove sveže
npm run dev         # http://localhost:3000
```

`.env.local` (nije u git-u): `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`.
Bez `NEXT_PUBLIC_CONVEX_URL` sajt radi, a sekcija Zakazivanje prikazuje poruku da onlajn zakazivanje nije dostupno.

## Skripte

| Komanda | Šta radi |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm run build` / `npm start` | produkcioni build / server |
| `npm run lint` | ESLint (nula upozorenja je standard) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | vitest: `lib/slots.test.ts` (aritmetika termina) + `convex/bookings.test.ts` (convex-test, backend) |
| `npm run e2e` | Playwright (desktop 1440 + mobilni 390) na `next dev :3100`; admin testovi traže `E2E_ADMIN_KEY` |
| `node scripts/ref-shots.mjs` | referentni snimci wizard-a referentnog projekta u `docs/reference/dfrajlica/` |

## Deploy

- **Front:** `git push origin main` → Vercel builduje sa GitHub-a. Env na Vercelu: `NEXT_PUBLIC_CONVEX_URL` (prod Convex URL).
- **Backend:** `npx convex deploy` (prod deployment). Env na Convex-u: `ADMIN_KEY`, `NOTIFY_EMAIL`, opciono `RESEND_API_KEY`, `RESEND_FROM`, `SITE_URL`.

## Struktura

```
app/
  layout.tsx          koren: fontovi, tokeni, Convex klijent, <meta name="build">
  (site)/             javni sajt: layout (Lenis, text reveal, kontakt-traka) + page (sekcije)
  admin/              /admin panel (Zahtevi · Kalendar · Radno vreme · Usluge) — bez Lenis-a i reveal-a
components/
  booking/            wizard (Usluga → Dan i vreme → Podaci), rezime, uspeh, stringovi
  sections/           Nav, Hero, Services, Manifesto, Gallery, Reviews, About, Prices, Booking, Contact
  ui/                 ContactRail (dock + mobilna traka), SocialIcons, Reveal, SectionHeading…
  providers/          SmoothScroll, SceneTheme, TextRevealGlobal, ConvexClientProvider
convex/               šema, funkcije (bookings, availability, schedules, blocks, services, settings, admin), cron, notify
lib/                  site.ts (podaci), booking.ts (usluge), slots.ts (aritmetika termina), dates.ts, textReveal.ts
tests/e2e/            Playwright
docs/                 BRAND, DECISIONS, HANDOVER, screenshots, reference
```
