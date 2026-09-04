/**
 * Smoke test produkcije (bez browsera):
 *  1. HTML produkcije servira poslednji commit (<meta name="build">) i ima Convex URL (nema NoBackendFallback teksta)
 *  2. Convex prod vraća prave slotove za sutra
 *  3. test-zahtev („TEST Jovan", 0600000000) → vidi se u listPending (admin) → potvrdi → u listRange (kalendar) → otkaži → purge
 *
 *   SMOKE_ADMIN_KEY=<ključ> node scripts/smoke-prod.mjs [siteUrl] [convexUrl] [expectedSha]
 *
 * Ključ i URL-ovi: HANDOVER-SECRETS.local.md. Skripta ništa ne ispisuje od tajni.
 */
import { ConvexHttpClient } from "convex/browser";
import { execSync } from "node:child_process";

const SITE = process.argv[2] ?? "https://colorcutchris.vercel.app";
const CONVEX = process.argv[3] ?? "https://stoic-wolverine-389.eu-west-1.convex.cloud";
const EXPECTED_SHA = process.argv[4] ?? "";
const KEY = process.env.SMOKE_ADMIN_KEY ?? "";
const PHONE = "0600000000";
const NAME = "TEST Jovan";

const results = [];
const ok = (name, detail = "") => results.push({ name, ok: true, detail });
const fail = (name, detail = "") => results.push({ name, ok: false, detail });

function belgradeDate(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 864e5);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Belgrade", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return parts; // YYYY-MM-DD
}

// 1. HTML
try {
  const res = await fetch(SITE, { headers: { "cache-control": "no-cache" } });
  const html = await res.text();
  const build = /<meta name="build" content="([^"]+)"/.exec(html)?.[1] ?? "";
  if (!build) fail("html: meta build", "nema <meta name=build>");
  else if (EXPECTED_SHA && !EXPECTED_SHA.startsWith(build) && !build.startsWith(EXPECTED_SHA)) fail("html: meta build", `build=${build} očekivano ${EXPECTED_SHA}`);
  else ok("html: meta build", build);
  // wizard (i Convex klijent) su u lenjom chunk-u: HTML ga samo preload-uje (<link rel=preload as=script>),
  // a njegov URL je i u loader chunk-u — zato gledamo <script src>, preload linkove i chunk-ove na koje oni upućuju.
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  const preloads = [...html.matchAll(/<link[^>]+as="script"[^>]+href="([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set();
  const queue = [...scripts, ...preloads];
  let found = "";
  while (queue.length && !found) {
    const src = queue.shift();
    if (seen.has(src) || seen.size > 60) continue;
    seen.add(src);
    const js = await fetch(new URL(src, SITE)).then((r) => (r.ok ? r.text() : "")).catch(() => "");
    const m = /https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.convex\.cloud/.exec(js);
    if (m) {
      found = m[0];
      break;
    }
    for (const ref of js.matchAll(/static\/(?:immutable\/)?chunks\/[A-Za-z0-9_.-]+\.js/g)) queue.push("/_next/" + ref[0]);
  }
  if (!found) fail("js: NEXT_PUBLIC_CONVEX_URL", "Convex URL nije u JS-u — env nije postavljen na Vercelu (Production)");
  else if (found !== CONVEX) fail("js: NEXT_PUBLIC_CONVEX_URL", `sajt gađa ${found}, očekivano ${CONVEX}`);
  else ok("js: NEXT_PUBLIC_CONVEX_URL = prod Convex", found);
  if (html.includes("Izaberi termin")) ok("html: sekcija Zakazivanje prisutna");
  else fail("html: sekcija Zakazivanje prisutna", "naslov sekcije nije u HTML-u");
} catch (err) {
  fail("html", err.message);
}

// 2. slotovi za sutra
const client = new ConvexHttpClient(CONVEX);
const now = Math.floor(Date.now() / 300000) * 300000;
let date = belgradeDate(1);
try {
  const week = await client.query("availability:week", { startDate: date, serviceKey: "zensko-sisanje", now });
  const first = week.find((d) => d.open && d.count > 0);
  if (!first) fail("prod: slotovi u narednih 7 dana", JSON.stringify(week));
  else {
    date = first.date;
    ok("prod: slotovi", `${first.date} → ${first.count} početaka`);
  }
} catch (err) {
  fail("prod: availability.week", err.message);
}

// 3. zahtev → admin → potvrdi → kalendar → otkaži → purge
if (!KEY) {
  fail("prod: admin tok", "SMOKE_ADMIN_KEY nije postavljen — preskačem");
} else {
  try {
    const day = await client.query("availability:day", { date, serviceKey: "zensko-sisanje", now });
    const startMin = day[0]?.slots?.[0];
    if (startMin === undefined) throw new Error(`nema slota za ${date}`);
    const req = await client.mutation("bookings:request", { name: NAME, phone: PHONE, serviceKey: "zensko-sisanje", staffKey: "any", date, startMin, note: "smoke test — obrisati" });
    if (!req.id) throw new Error("request nije vratio id");
    ok("prod: bookings.request", `${date} ${startMin}`);

    const pending = await client.query("bookings:listPending", { key: KEY });
    const mine = pending.find((b) => b._id === req.id);
    if (!mine) throw new Error("zahtev nije u listPending");
    ok("prod: zahtev u /admin (listPending)");

    await client.mutation("bookings:setStatus", { key: KEY, id: req.id, status: "potvrdjen" });
    const range = await client.query("bookings:listRange", { key: KEY, from: date, to: date });
    const confirmed = range.find((b) => b._id === req.id && b.status === "potvrdjen");
    if (!confirmed) throw new Error("potvrđen termin nije u listRange (kalendar)");
    ok("prod: potvrđen i u kalendaru");

    await client.mutation("bookings:setStatus", { key: KEY, id: req.id, status: "otkazan" });
    const after = await client.query("bookings:listRange", { key: KEY, from: date, to: date });
    if (!after.find((b) => b._id === req.id && b.status === "otkazan")) throw new Error("otkazivanje nije upisano");
    ok("prod: otkazan");
  } catch (err) {
    fail("prod: admin tok", err.message);
  } finally {
    try {
      const out = execSync(`npx convex run bookings:purgeByPhone "{\\"phone\\":\\"${PHONE}\\"}" --prod`, { encoding: "utf8", timeout: 90_000 });
      ok("prod: purge test-zahteva", out.trim().split("\n").pop());
    } catch (err) {
      fail("prod: purge", err.message);
    }
  }
}

for (const r of results) console.log(`${r.ok ? "OK  " : "FAIL"} ${r.name}${r.detail ? " — " + r.detail : ""}`);
process.exit(results.some((r) => !r.ok) ? 1 : 0);
