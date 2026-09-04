# ColorcutChris & more — brend brief (v0, 2026-09-03)

Radni dokument za sajt. Dopunjavati kako saznajemo više od klijenta.

## Činjenice (potvrđeno)
- Naziv: **color cut Chris and more** (logo: "color cut" gore-levo, potpis "Chris", "and more" dole-desno, luk sa desne strane)
- Vlasnik/frizer: **Kristijan Vlajković** ("Kris", "Chris"; gosti ga zovu i Kristijan)
- Adresa: **Bojanska 24, 11000 Beograd (Zvezdara)** — Google Maps profil `/g/11jzl9t5mq`
- Radno vreme (Google): uto–pet 09–19 · sub 10–17 · ned i pon zatvoreno
- Google ocena: **5,0 / 24 recenzije**, sve petice (10 preuzeto, u `lib/site.ts`)
- Facebook: facebook.com/Tosamjahair → "ColorcutChrisandmore" (112 pratilaca); objave su Instagram cross-post
- Instagram: instagram.com/colorcutchrisandmore (u `lib/site.ts → social.instagram`)
- Kategorija na FB: Beauty, cosmetic & personal care · Beograd, Srbija
- Telefon: 060 3738001 · Email: vlajkovick@gmail.com
- Usluge iz FB intro-a: Haircolor · Haircut · Hairstyle · Bride
- Proizvodi u salonu: Goldwell (vidljivo na slici pulta)
- FB objava (bez retuša): "I mi naše slike ne obradjujemo!" → ponos na realne rezultate, autentičnost
- Recenzije pominju "Klaru" (mala devojčica koja "voli da naređuje") — verovatno Kristijanova ćerka; slatka priča, ali **ne stavljati ime/slike deteta na sajt bez izričite saglasnosti**
- Gosti ga prate "gde god da mu je adresa" → selio se; lojalna baza

## Preuzeti materijal
- `public/photos/rad-*.webp` — 12 radova sa Google Maps profila (vlasnikove objave, feb 2024–)
- `public/photos/salon-*.webp` — 3 fotografije enterijera
- **Nisu preuzete** 3 fotografije Kristijana sa detetom u stolici (Google Maps) — tražiti saglasnost; iste bi bile odličan portret za "O Chrisu"
- `docs/reference/fb-konsultacija-*.jpg` — 8 slajdova sa FB/IG o konsultaciji; tekst prenet u `lib/site.ts → manifesto`

## Otvoreno (pitati klijenta / proveriti)
- Cenovnik (postoji štampana "KARTA" u salonu — tražiti fotografiju/PDF) → cene „od" za zakazivanje Chris unosi u `/admin → Usluge`
- Trajanja usluga u zakazivanju su predlog (`lib/booking.ts`) — Chris ih koriguje u `/admin → Usluge`
- Biografija (godine iskustva, edukacije), portret bez deteta
- Saglasnost za korišćenje fotografija gošći sa Google Maps na sajtu (javno objavljene od vlasnika, ali potvrditi)

## Vizuelni DNK (iz fotografija salona)
Salon je topao, boho-skandi, sa puno prirodnog svetla. Nije hladno-luksuzan, nije "crno-zlatni barbershop". Deluje kao lepo uređen stan prijatelja koji je vrhunski kolorista.

### Paleta (za tokene)
| Token | Hex (predlog) | Poreklo |
|---|---|---|
| `sage` | `#8D9472` | pozadina loga (sempl 141,148,114) |
| `sage-deep` | `#6F7A5A` | zeleni kuhinjski elementi, niša sa proizvodima |
| `ink` | `#3B3F30` | tinta potpisa na logu (sempl 59,63,48) — umesto crne |
| `cream` | `#F4EFE6` | zidovi, zavese, krem paravan-školjka |
| `sand` | `#D9C9B0` | draperija u obliku školjke, pampas trava |
| `rattan` | `#C9A96E` | komoda, fotelje, lampa |
| `brass` | `#B99A5B` | luster, nogice komode |
| `cognac` | `#B5652F` | frizerska stolica, tabure |
| `oak` | `#8C4F2E` | pod (sempl 62,30,24 u senci) |
| `forest` | `#2F5D45` | zelena sofa, palma |
| `neon` | `#F5E663` | uključen neon-potpis |
| `neon-glow` | `#FFF3A0` | halo oko neona |

### Motivi za UI
- **Luk (arch)** — ogledalo u obliku luka, paravan-luk → maske za slike, hero forma
- **Talasasta ivica (wavy cutout)** — sivi paravan sa ratan ispunom → dekorativni divideri, clip-path
- **Školjka / koral** — draperija-školjka, keramička školjka → suptilni organski oblici
- **Ratan mreža (cane webbing)** — tekstura za pozadine/pattern (vrlo suptilno)
- **Neon potpis** — logo koji se "pali" (SVG stroke animacija + glow) — hero momenat
- **Sunčeva svetlost kroz zavese** — meke pruge svetla → shader/gradient u 3D sceni
- **Tapeta sa magnolijama i pticama** (botanička, krem/sage/braon) — pozadina većine fotografija radova; kandidat za suptilni pattern u sekciji Radovi

### Tipografija (predlog)
- Display: elegantan serif sa karakterom (npr. *Fraunces* ili *Cormorant Garamond*) — toplo, ne korporativno
- Potpis "Chris": ne pokušavati fontom — koristiti **SVG trag loga** (vektorizovati iz reference)
- Body/UI: *Geist* (već u projektu) ili *Inter* — čisto, čitljivo

### Ton copy-ja
Srpski, latinica, prijateljski, direktno, prvo lice ("Ja sam Chris" — FB handle je "Tosamjahair" = "To sam ja hair"). Bez "premium luxury experience" fraza. Autentičnost: "ne retuširam slike".
Referentni tekst u njegovom glasu: karusel o konsultaciji ("Zašto moja kosa ne izgleda kao na slici? Zato što — nije ista kosa." … "donesi inspo, obavezno — kao pravac, a ne obećanje"). Kratke rečenice, tačka posle svake misli, obraćanje na "ti".

## Tehnički stek (instalirano 2026-09-03)
- Next.js 16.3.4 · React 19.2 · Tailwind v4 · TypeScript
- `three` 0.185 + `@react-three/fiber` 9.7 + `@react-three/drei` 10.7 — 3D hero
- `gsap` 3.15 + `@gsap/react` — ScrollTrigger, timeline-i, neon "paljenje"
- `motion` 13 (Framer Motion) — layout/enter animacije komponenti, AnimatePresence
- `lenis` 1.3 — smooth scroll (sinhronizovan sa GSAP ScrollTrigger)
- `convex` 1.45 — backend zakazivanja i admin panela (vidi „Zakazivanje")
- `lucide-react` — ikonice (kontakt-traka, Nav, admin); Viber je inline SVG
- Testovi: `vitest` + `convex-test` (backend), `@playwright/test` (e2e)

Pravilo podele: **GSAP** za sve što je vezano za scroll i sekvence; **motion** za stanja komponenti (hover, modal, lista); **R3F** za hero i eventualno jedan "wow" trenutak niže, ne više od toga (performanse na mobilnom).

## Odluke (Jovan, 2026-09-03)
- **Stil:** hibrid svetlo → tamno. Hero je salon danju (krem), scroll "gasi svetla" (tema `night`, forest-deep) i pali neon; Kontakt vraća dan ("vidimo se ujutru").
- **3D hero:** neon potpis "Chris" + luk kao tube (R3F), akrilni disk sa šrafovima, halo na zidu, paljenje potez-po-potez sa treperenjem, parallax na miš. "color cut"/"and more" ostaju štampana slova (kao u salonu).
- **Obim v1:** one-page: Hero · Usluge · Radovi · Chris · Cenovnik · Kontakt. Zakazivanje = poziv/Viber. Convex/admin kasnije.
- **Logo:** vektorizovan iz reference (`lib/brand/logo-data.ts`) — ink konture + centralne linije neona. Ne koristimo font za potpis.
- **v1.1 (4. 9. 2026):** sekcija **Zakazivanje** (Convex) između Cenovnika i Kontakta, admin panel `/admin`, kontakt-traka
  (desktop dock + mobilna donja traka), Hero/Nav CTA vode na `#zakazivanje`. Vidi dole.

## Zakazivanje (Convex + admin)
- **Tok za gosta:** Usluga → Dan i vreme → Podaci → „Zahtev je poslat." Slotovi dolaze isključivo sa servera
  (`availability.day/week`), po radnom vremenu, pauzama i već zauzetim terminima; korak 30 min, najava 2 h, horizont 30 dana.
  Zahtev je `nov` dok ga Chris ne potvrdi; posle 48 h sam ističe (cron `expirePending`).
- **Chris u `/admin`** (deljeni ključ, sessionStorage): Zahtevi (Potvrdi / Odbij) · Kalendar (dnevni prikaz 08–21, ručni termin,
  pauza, otkazivanje) · Radno vreme (nedeljni raspored, izuzeci po datumu, podešavanja termina) · Usluge (trajanje, cena „od",
  vidljivo u zakazivanju).
- **Sekcija je u noćnoj temi** (forest-deep + neon): kartice usluga sa neon prstenom kad su izabrane, slot čipovi neon/ink,
  WeekStrip sa `layoutId` indikatorom, rezime „Tvoj termin" sa blur-in promenama vrednosti, uspeh sa iscrtanim check-om pa
  reč-po-reč tekstom. Admin je u dnevnoj temi (cream/ink/sage), neon samo za fokus i badge.
- **Ton:** naslov „Izaberi termin. Ja se javim.", koraci „Šta radimo? / Kad ti odgovara? / Ko dolazi?", greške u ti-formi
  („Termin je upravo zauzet — izaberi drugi."). Svi stringovi: `components/booking/strings.ts`.
- **Kontakt-traka:** Instagram · Facebook · Viber · Poziv · Mejl · Zakaži — desktop dock uz desnu ivicu (pojavi se kad hero ode),
  mobilna donja traka (sklanja se u sekciji Zakazivanje). Iste ikonice u Nav-u i u Kontaktu/footeru.
- Detalji odluka: `docs/DECISIONS.md`; uputstvo za Chrisa i deploy: `docs/HANDOVER.md`.

## Struktura koda
```
app/
  layout.tsx    koren: fontovi Fraunces+Geist, tokeni, ConvexClientProvider, <meta name="build">
  (site)/       javni sajt: layout (SmoothScroll, TextRevealGlobal, ContactRail) + page (sekcije + SceneTheme)
  admin/        /admin panel (AdminPanel + tabovi) — bez Lenis-a, reveal-a i kontakt-trake
  globals.css   tokeni
lib/            site.ts (podaci), booking.ts (usluge/frizeri), slots.ts (aritmetika termina), dates.ts, theme.ts, textReveal.ts, contactRail.ts
convex/         schema, bookings, availability, schedules, blocks, services, settings, admin, crons, notify, lib/*
components/
  providers/    SmoothScroll (Lenis+GSAP), SceneTheme (ScrollTrigger → tema), TextRevealGlobal, ConvexClientProvider
  brand/        Logo (ink SVG), NeonLogo (2D neon fallback)
  three/        NeonSign (scena), NeonSignCanvas (Canvas; dynamic ssr:false)
  sections/     Nav, Hero, Services, Manifesto, Gallery, Reviews, About, Prices, Booking, Contact
  booking/      BookingWizard + koraci, rezime, uspeh, greške, strings
  ui/           Reveal (motion), SectionHeading, ContactRail, SocialIcons
tests/e2e/      Playwright (wizard, admin, mobilna traka)
```

## Reference slike
`public/brand/reference/` — logo (sage), neon potpis, enterijer.
