# HANDOVER — zakazivanje termina i admin panel

> **Stanje 4. 9. 2026, 09:20:** produkcija je živa i proverena — Vercel ima `NEXT_PUBLIC_CONVEX_URL` (prod Convex
> `https://stoic-wolverine-389.eu-west-1.convex.cloud`), sekcija Zakazivanje vraća prave termine, a test-zahtev sa produkcije
> je prošao ceo krug (zahtev → /admin → Potvrdi → kalendar → Otkaži) i obrisan je. Lokalni Playwright (desktop + mobilni) prolazi. Ništa nije „uradi prvo“.

## Za Chrisa — kako radi zakazivanje

Gost na sajtu (sekcija **Zakazivanje**) bira uslugu, dan i vreme, upiše ime i telefon i pošalje zahtev.
Zahtev **nije termin** dok ga ti ne potvrdiš. Sve što ti treba je na jednoj strani: **`/admin`**
(npr. `https://colorcutchris.vercel.app/admin`). Radi i sa telefona — sačuvaj je kao prečicu na početnom ekranu.

### Ulazak
1. Otvori `/admin`.
2. Upiši **ključ** (dao ti ga je Jovan; čuva se samo u tom prozoru — kad zatvoriš tab, upisuješ ga ponovo).
3. Ako vidiš „Neispravan ključ“ — proveri razmake i velika/mala slova, pa „Promeni ključ“.

### Zahtevi
- Svaki novi zahtev sa sajta je ovde, sa uslugom, danom, vremenom, imenom i telefonom (klik na broj = poziv).
- **Potvrdi** — termin ulazi u kalendar kao potvrđen. Javi se gostu porukom ili pozivom (sajt mu je rekao da ćeš se javiti).
- **Odbij** — zahtev se sklanja, termin se oslobađa.
- Zahtev koji ne potvrdiš **za 48 h sam se otkazuje** (nestaje sa liste; rok menjaš u „Radno vreme → Podešavanja termina“). Dok čeka, taj termin je zauzet
  i drugi gosti ga ne vide — zato potvrđuj ili odbijaj isti dan.
- Broj u tabu „Zahtevi“ je broj zahteva koji čekaju.

### Kalendar
- Dnevni prikaz 08–21. Strelicama ili datumom menjaš dan; „Danas“ te vraća.
- Sivo = van radnog vremena. Zeleno = potvrđen termin. Prazan okvir = zahtev na čekanju. Prugasto = pauza.
- **Klik na prazno vreme** → „Dodaj termin“ (gost koji je zvao telefonom — upisuje se odmah kao potvrđen; sme i van radnog
  vremena, ali ne preko postojećeg termina ili pauze) ili „Blokiraj“ (pauza: ručak, odlazak, privatno).
- **Klik na termin** → Potvrdi / Odbij / Otkaži / Pozovi. **Klik na pauzu** → Ukloni pauzu.

### Radno vreme
- **Nedeljni raspored:** za svaki dan jedan ili više opsega (npr. 09:00–13:00 i 15:00–19:00). „Neradni dan“ = bez opsega.
  Podrazumevano je uto–pet 09–19, sub 10–17, ned i pon zatvoreno. Kad prvi put sačuvaš, baner na vrhu nestaje.
- **Izuzeci po datumu:** „+ Radim u nedelju“, „+ Radim u ponedeljak“ (kad radiš neradnim danom), „+ Slobodan dan“ (odmor, praznik),
  „+ Posebno vreme“ (kraći ili duži dan). Izuzetak važi samo za taj datum i jači je od nedeljnog rasporeda.
- **Podešavanja termina:** korak (razmak između ponuđenih vremena, 30 min), najmanja najava (koliko unapred gost mora da
  zakaže, 120 min), koliko dana unapred se prima (30), i posle koliko sati zahtev ističe (48).

### Usluge
- **Trajanje** određuje koje termine gost vidi (usluga od 90 min ne može u 18:30 ako radiš do 19). Klikni u polje, upiši,
  pritisni Enter ili klikni van polja — čuva se odmah. „Vrati podrazumevano“ vraća početnu vrednost.
- **Cena od** — ako je upišeš, gost je vidi uz uslugu („od 2.500 din“). Prazno = bez cene.
- **Vidljivo u zakazivanju** — isključi uslugu koju ne nudiš onlajn. I dalje je možeš ručno upisati u kalendar.

### Mejl obaveštenja (trenutno isključena)
Kad se uključe, za svaki novi zahtev stiže mejl na `vlajkovick@gmail.com` sa svim podacima i linkom na `/admin`.
Uključuje ih Jovan (vidi dole, Resend).

---

## Za Jovana — tehnički deo

### Gde šta živi
- Front: Vercel, projekat `colorcutchris` (GitHub `ckobasti77/colorcutchris`, grana `main`). Produkcija: https://colorcutchris.vercel.app
- Backend: Convex, projekat `colorcutchris` — **dev** `tough-warbler-480` (`.env.local`), **prod** `stoic-wolverine-389`
  (`https://stoic-wolverine-389.eu-west-1.convex.cloud`). Dashboard: `npx convex dashboard` (dev) / `--prod`.
- Ključ i vrednosti env promenljivih: `HANDOVER-SECRETS.local.md` (lokalno, nije u git-u).

### Env promenljive (bez vrednosti)
| Gde | Promenljiva | Svrha |
| --- | --- | --- |
| Vercel (Production + Preview) | `NEXT_PUBLIC_CONVEX_URL` | URL prod Convex deployment-a; bez njega sekcija Zakazivanje prikazuje „Onlajn zakazivanje trenutno nije dostupno.“ |
| Vercel (opciono) | `NEXT_PUBLIC_CONVEX_SITE_URL` | `.convex.site` URL — trenutno se ne koristi (nema HTTP ruta) |
| Convex dev + prod | `ADMIN_KEY` | deljeni ključ za `/admin` (svaka admin funkcija ga proverava) |
| Convex dev + prod | `NOTIFY_EMAIL` | primalac mejla o novom zahtevu (fallback `site.email`) |
| Convex dev + prod | `RESEND_API_KEY` | **nije postavljen** — dok ga nema, `notify.newRequest` samo zapiše u log |
| Convex (opciono) | `RESEND_FROM`, `SITE_URL` | pošiljalac mejla; osnova za link ka `/admin` (fallback `site.url`) |

### Komande
```bash
npm run dev            # sajt (3000); u drugom terminalu: npx convex dev
npm run lint && npm run typecheck && npm test && npm run build
E2E_ADMIN_KEY=<ključ> npm run e2e        # Playwright, next dev na :3100, gađa DEV Convex
E2E_BASE_URL=https://colorcutchris.vercel.app E2E_SHOTS=docs/screenshots/prod E2E_ADMIN_KEY=<ključ> npx playwright test --project=desktop   # isti tok na PRODUKCIJI (purge --prod)
SMOKE_ADMIN_KEY=<ključ> node scripts/smoke-prod.mjs   # brzi API smoke produkcije (build marker, env, slotovi, zahtev→potvrda→otkaz→purge)
npx convex deploy      # backend → PROD (stoic-wolverine-389); cron „expire pending booking requests“ ide sa njim
git push origin main   # front → Vercel produkcija (proveri: gh api repos/ckobasti77/colorcutchris/deployments)
npx convex env set ADMIN_KEY <novi> --prod        # promena ključa (i bez --prod za dev)
npx convex run bookings:purgeByPhone '{"phone":"0600000000"}' --prod   # briše test-zahteve po telefonu
```

### Uključivanje mejl obaveštenja (Resend)
1. Nalog na resend.com → API key (`re_…`).
2. `npx convex env set RESEND_API_KEY re_xxx --prod` (i bez `--prod` za dev ako želiš).
3. Bez verifikovanog domena Resend šalje samo sa `onboarding@resend.dev` i **samo na adresu vlasnika Resend naloga** — otvori
   nalog na `vlajkovick@gmail.com` ili verifikuj domen i postavi `RESEND_FROM` (npr. `color cut Chris and more <termini@domen.rs>`).
4. Test: pošalji zahtev sa sajta → mejl „Nov zahtev: …“ sa `tel:` linkom i dugmetom „Otvori panel“. Logovi: Convex dashboard → Logs.

### Testovi
- `lib/slots.test.ts` — čista aritmetika termina (vitest, node).
- `convex/bookings.test.ts` — backend u memoriji (convex-test, edge-runtime): dupli termin, neradni dani, honeypot, rate limit,
  tranzicije, isticanje, ključ, usluge, podešavanja.
- `tests/e2e/booking.spec.ts` — Playwright: wizard do uspeha (desktop + mobilni), pogrešan ključ, potvrda u adminu, mobilna
  kontakt-traka. Snimci: `docs/screenshots/booking/`.

### Performanse (za Jovana)
- Lighthouse mobilni na produkciji: performanse **55**, pristupačnost 97, best practices 100, SEO 100. Skor vuče 3D neon
  (three.js ~920 KB odmah po učitavanju) — nije od zakazivanja (wizard je u odloženom chunk-u). Ako želiš 90+: 3D znak učitati
  tek kad stranica miruje (`requestIdleCallback`) i spustiti `dpr` na telefonu; do tada 2D neon fallback već postoji.

### Za Jovana — sitnice posle noći
- Folder `.claude/worktrees/salon-neon-text-reveal-ca8813` (75 MB, mrtav worktree ugašenog home-repo-a) i ostatak
  `.claude/worktrees/contact-map-polish-cfb35e` (zaključan drugim procesom) obriši ručno — nisu u git-u.
- Cene „od“ i tačna trajanja usluga: `/admin → Usluge` (trenutno predlog bez cena).
- Resend ključ za mejl obaveštenja (dole).

### Dodavanje drugog frizera (kad zatreba)
1. `convex/schema.ts`: `staffKeyValidator = v.union(v.literal("chris"), v.literal("novi"))`.
2. `lib/booking.ts`: red u `staffMembers` + `staff: [...]` po usluzi.
3. `npx convex deploy`. UI (izbor „Ko radi?“, kolone kalendara, „Svejedno“ balansiranje) se pojavljuje sam.
