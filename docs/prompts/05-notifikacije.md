ultracode ultrathink

# Obaveštenja o zakazivanjima — Telegram push + Gmail SMTP + dnevni pregled

Nastavak na sistem zakazivanja (`docs/prompts/04-booking.md`). **Pokreni tek kad je prompt #4 gotov i merge-ovan na `main`.** Radiš sam, bez pitanja; nejasno → najrazumnija opcija + zapis u `docs/DECISIONS.md`.

Cilj: kad neko zakaže preko sajta, **Kristianu zvoni telefon** (Telegram push, u sekundi), a u pozadini stiže i mejl kao trag. Plus dnevni pregled sutrašnjih termina i jedno-klik poruka klijentu iz panela.

Trenutno stanje: `convex/notify.ts` ima `internalAction newRequest` koja šalje Resend mejl i „graceful no-op" ako nema ključa. Nju **refaktorišeš u fan-out**, ne brišeš ponašanje.

---

## Faza 1 — Fan-out arhitektura (`convex/notify.ts`)

1. Jedno mesto pravi **payload poruke** (`buildRequestMessage`) → `{ subject, textLines, html, adminUrl }`, da svi kanali šalju isti sadržaj.
2. `newRequest` više ne šalje direktno nego **redom pokušava sve uključene kanale**, svaki u svom `try/catch` — pad jednog kanala **nikad** ne sme da obori drugi ni da baci grešku ka mutaciji (zahtev je već u bazi).
3. Nova tabela u `convex/schema.ts`:
   ```ts
   notifications: defineTable({
     kind: v.union(v.literal("newRequest"), v.literal("dailyAgenda"), v.literal("test")),
     channel: v.union(v.literal("telegram"), v.literal("email")),
     ok: v.boolean(),
     error: v.optional(v.string()),
     bookingId: v.optional(v.id("bookings")),
     at: v.number(),
   }).index("by_at", ["at"])
   ```
   Svaki pokušaj se upisuje preko `internalMutation notify.log` (action → `ctx.runMutation`). Čuvaj samo poslednjih ~200 (obriši starije u istoj mutaciji).
4. Nijedan kanal nije obavezan: bez env-a → `console.log` + `ok:false, error:"nije podešeno"` i dalje.

## Faza 2 — Telegram (primarni kanal, radi odmah)

- Čist `fetch` u **podrazumevanom Convex runtime-u** (bez `"use node"`, bez zavisnosti):
  `POST https://api.telegram.org/bot<TOKEN>/sendMessage` sa `{ chat_id, text, parse_mode: "HTML", disable_web_page_preview: true }`.
- Env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — **dozvoli listu odvojenu zarezom** (Chris + Jovan), šalji svakom posebno i loguj svakog.
- Format poruke (HTML, kratko, da stane u notifikaciju na zaključanom ekranu):
  ```
  🗓 <b>Nov zahtev</b>
  <b>Farbanje izrastka</b> · 12.09.2026. 10:00–11:30
  Milica Jovanović · <a href="tel:+381601234567">060 123 4567</a>
  Napomena: ...
  Ističe za 48 h · <a href="…/admin">Otvori panel</a>
  ```
- HTML-escape svako korisničko polje (ime, napomena) — Telegram parse_mode puca na `<`, `&`.
- Timeout 10 s (`AbortSignal.timeout`), bez retry-ja (Convex scheduler je već izolovan).

## Faza 3 — Mejl preko Gmail SMTP (rezerva/arhiva)

- **Zaseban fajl** `convex/notifyEmail.ts` sa `"use node";` u prvom redu (Convex Node action) + `nodemailer` u `package.json`.
- `internalAction sendEmail({ subject, text, html })`:
  - Ako postoje `GMAIL_USER` + `GMAIL_APP_PASSWORD` → `nodemailer.createTransport({ host:"smtp.gmail.com", port:465, secure:true, auth:{ user, pass } })`, `from: "color cut Chris and more <GMAIL_USER>"`, `to: NOTIFY_EMAIL || site.email`, `replyTo` = telefon/mejl klijenta nije potreban — stavi `NOTIFY_EMAIL`.
  - Inače ako postoji `RESEND_API_KEY` → postojeći Resend put (zadrži ga).
  - Inače → log + `ok:false`.
- **Ako SMTP ne prođe** (Convex Node runtime blokira izlazni SMTP ili Gmail odbije): ne petljaj se — uloguj tačnu grešku, u `docs/DECISIONS.md` zapiši da je Gmail SMTP pao i **ostavi Telegram kao jedini aktivni kanal**, a u HANDOVER dodaj kratko uputstvo za Resend sa verifikovanim domenom kao trajno rešenje. Ne troši više od ~30 min na debug SMTP-a.
- Gmail app password zahteva 2FA na nalogu i **nije** obična lozinka — to je vrednost koju Jovan postavlja env-om, ti je nikad ne izmišljaj i ne upisuj u kod.

## Faza 4 — Dnevni pregled + obaveštenje o isteku

- Novi cron: **svaki dan u 20:00 po Beogradu** (`crons.cron("dnevni pregled", "0 18 * * *", …)` — 18:00 UTC je 20:00 CEST; u kodu izračunaj i komentariši zimsko/letnje računanje vremena, ili koristi `crons.daily` sa `{ hourUTC: 18, minuteUTC: 0 }`) → `internal.notify.dailyAgenda`.
- `dailyAgenda`: pročita **potvrđene** termine za sutra; ako ih nema → ne šalji ništa (nema spama). Ako ih ima → Telegram poruka: `Sutra (13.09.) imaš 4 termina:` pa lista `10:00 Milica · Farbanje`, i na kraju upozorenje ako postoje zahtevi na čekanju: `⚠️ 2 zahteva čekaju odgovor`.
- U `bookings.expirePending`: ako je nešto isteklo, jedna zbirna Telegram poruka `⏰ 2 zahteva su istekla bez odgovora` (ne jedna po zahtevu).

## Faza 5 — Jedno-klik poruka klijentu iz panela (bez ikakvog API-ja)

WhatsApp/Viber slanje **klijentu** ne automatizujemo (vidi „Zašto ne WhatsApp API" dole). Umesto toga, u `/admin`:
- Na kartici zahteva i u modalu termina u kalendaru dodaj dugmad **„Potvrdi i javi"** i **„Javi izmenu"** koja otvaraju pripremljenu poruku:
  - Viber: `viber://chat?number=%2B381…&text=…` (probaj; ako Viber ignoriše `text`, ostavi samo broj)
  - WhatsApp: `https://wa.me/381…?text=…`
  - SMS: `sms:+381…?body=…` (`&body=` na iOS-u — detektuj platformu ili ponudi oba)
- Tekst (URL-enkodovan, ti-forma, iz `lib/booking.ts` → `clientMessages`):
  „Zdravo {ime}, termin je potvrđen: {usluga}, {dan} u {vreme}. Bojanska 24. Vidimo se! — Chris"
- „Potvrdi i javi" prvo izvrši `setStatus → potvrdjen`, pa otvori poruku (`window.open` posle await-a, u istom klik-handleru da iOS ne blokira popup).

## Faza 6 — (opciono, samo ako je sve gore zeleno) Web push za /admin

PWA + VAPID web push da panel radi kao aplikacija: `public/manifest.json`, service worker, tabela `pushSubscriptions`, `web-push` u Node action-u, dugme „Uključi obaveštenja na ovom telefonu" u panelu. iOS zahteva „Dodaj na početni ekran". **Uradi samo ako preostane vremena i ako sve prethodno prolazi testove** — u suprotnom zapiši kao TODO u `docs/DECISIONS.md`.

---

## Env (postavi u dev i prod)

```
npx convex env set TELEGRAM_BOT_TOKEN <token>            [--prod]
npx convex env set TELEGRAM_CHAT_ID  <id1,id2>           [--prod]
npx convex env set GMAIL_USER        <nalog@gmail.com>   [--prod]
npx convex env set GMAIL_APP_PASSWORD <app password>     [--prod]
npx convex env set NOTIFY_EMAIL      vlajkovick@gmail.com [--prod]
```
Vrednosti su u `HANDOVER-SECRETS.local.md` (gitignored) — Jovan ih je tamo ostavio ili ćeš ih naći u `.env.local`. **Ako neka vrednost ne postoji: ne izmišljaj je, ne staj** — implementiraj kanal, ostavi ga neaktivnim, i napiši u HANDOVER tačno koju komandu Jovan treba da pusti. Nikad ne upisuj token u git ni u čet-izlaz.

## Verifikacija (obavezno)

- U admin panelu, tab **Radno vreme** (ili novi mali blok „Obaveštenja"): status svakog kanala (podešen / nije podešen), poslednjih 10 pokušaja iz `notifications` tabele (kanal, vreme, ✓/✗ + greška) i dugme **„Pošalji test"** → `notify.test` action pošalje test poruku na sve uključene kanale.
- Testovi: `convex/notify.test.ts` (convex-test) — `newRequest` bez env-a ne baca i loguje `ok:false` za oba kanala; sa mock-ovanim `fetch` šalje tačno jednu Telegram poruku po chat id-u; `dailyAgenda` bez termina ne šalje ništa; escape funkcija sređuje `<`, `&`, `>`.
- `npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run build` — sve zeleno.
- Na kraju: `npx convex deploy`, `git push origin main`, sačekaj Vercel build, pa **pošalji pravi test-zahtev sa produkcije** i potvrdi da je Telegram poruka stigla (screenshot Telegram poruke nije moguć — dovoljno je da `notifications` tabela ima `ok:true`; zapiši to u izlazu).
- `docs/HANDOVER.md`: novo poglavlje „Obaveštenja" na srpskom za Kristiana — šta stiže na Telegram, šta na mejl, kako se isključi dnevni pregled, šta znači „Pošalji test".

## Zašto ne WhatsApp Cloud API (zapiši u DECISIONS.md)

Za slanje **nama samima** WhatsApp Cloud API traži: zaseban broj telefona koji se registruje na API i **više ne može da se koristi u običnoj WhatsApp aplikaciji**, Meta Business nalog i verifikaciju, i odobrenje šablona (template) za poruke koje biznis inicira; od 1. 10. 2026. Meta naplaćuje i utility šablone unutar servisnog prozora. Telegram bot daje isti push u sekundi, besplatno, bez odobrenja i bez žrtvovanja broja. Poruka **klijentu** ostaje jedno-klik `wa.me` / Viber link iz panela (Faza 5), što ne traži nikakav API.
