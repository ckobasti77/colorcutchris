import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { admin, booking } from "../../components/booking/strings";

/**
 * E2E: javni wizard do uspeha, admin (pogrešan ključ, potvrda, kalendar, otkazivanje),
 * mobilna kontakt-traka. Gađa DEV Convex deployment (.env.local). Test-zahtevi se
 * brišu na kraju preko `bookings:purgeByPhone`. Admin testovi traže `E2E_ADMIN_KEY`.
 */
/** Snimci: podrazumevano u docs; smoke na produkciji ih šalje u zaseban folder (E2E_SHOTS). */
const SHOTS = process.env.E2E_SHOTS ?? "docs/screenshots/booking";
const ADMIN_KEY = process.env.E2E_ADMIN_KEY ?? "";
/** Na produkciji (E2E_BASE_URL) test-zahtev se briše sa prod deployment-a. */
const PURGE_FLAG = process.env.E2E_BASE_URL ? " --prod" : "";
const NAME = "TEST Jovan";
/** Jedinstven broj po pokretanju/projektu (rate limit je 3/h po telefonu). */
const PHONE = `0600${String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0")}`;
const MONTHS = ["januar", "februar", "mart", "april", "maj", "jun", "jul", "avgust", "septembar", "oktobar", "novembar", "decembar"];

mkdirSync(SHOTS, { recursive: true });

/** Klikni prvi VIDLJIV element (desktop rezime i mobilna traka renderuju isto dugme). */
async function clickVisible(loc: Locator) {
  const n = await loc.count();
  for (let i = 0; i < n; i++) {
    const el = loc.nth(i);
    if (await el.isVisible()) {
      await el.click();
      return;
    }
  }
  throw new Error(`Nijedan vidljiv element: ${loc}`);
}

/** Početna strana: čeka da se dev server skompajlira i 3D hero smiri pre bilo kakvog skrola. */
async function openHome(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
}

async function scrollToBooking(page: Page) {
  await page.evaluate(() => {
    document.querySelector("#zakazivanje")?.scrollIntoView({ block: "start", behavior: "auto" });
  });
  await page.waitForTimeout(1200); // reč-po-reč otkrivanje + Lenis
}

/** "četvrtak, 10. septembar" → "2026-09-10" (godina: tekuća, ili sledeća ako je mesec prošao). */
function parseDayLong(label: string): string {
  const m = /(\d{1,2})\.\s+([a-zčćšđž]+)/i.exec(label);
  if (!m) throw new Error(`Ne mogu da pročitam datum iz: ${label}`);
  const day = Number(m[1]);
  const month = MONTHS.indexOf(m[2].toLowerCase()) + 1;
  if (!month) throw new Error(`Nepoznat mesec: ${m[2]}`);
  const now = new Date();
  let year = now.getFullYear();
  if (month < now.getMonth() + 1 - 1) year += 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

test.describe.serial("zakazivanje", () => {
  let bookedDate = "";

  test.afterAll(() => {
    try {
      execSync(`npx convex run bookings:purgeByPhone "{\\"phone\\":\\"${PHONE}\\"}"${PURGE_FLAG}`, { stdio: "ignore", timeout: 90_000 });
    } catch {
      // čišćenje nije kritično — zapisano u HANDOVER kako se briše ručno
    }
  });

  test("wizard: usluga → dan i vreme → podaci → uspeh", async ({ page }, testInfo) => {
    const vp = testInfo.project.name;
    await openHome(page);
    await scrollToBooking(page);
    const section = page.locator("#zakazivanje");
    await expect(section.getByRole("heading", { name: /Izaberi termin/ })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/${vp}-1-usluga.png` });

    // korak 1
    await section.getByRole("radio", { name: /Žensko šišanje/ }).click();
    await expect(section.getByRole("radio", { name: /Žensko šišanje/ })).toHaveAttribute("aria-checked", "true");
    await page.screenshot({ path: `${SHOTS}/${vp}-1-usluga-izabrana.png` });
    await clickVisible(section.getByRole("button", { name: booking.nav.next }));

    // korak 2 — prvi dan koji ima termine
    const days = section.getByRole("radiogroup", { name: booking.day.weekStrip }).getByRole("radio");
    await expect(days.first()).toBeVisible();
    await expect
      .poll(async () => (await days.evaluateAll((els) => els.filter((e) => e.getAttribute("aria-disabled") !== "true").length)) > 0)
      .toBe(true);
    let picked = false;
    for (let i = 0; i < (await days.count()) && !picked; i++) {
      const d = days.nth(i);
      if ((await d.getAttribute("aria-disabled")) === "true") continue;
      await d.click();
      const slot = section.getByRole("radiogroup", { name: new RegExp(`${booking.day.prepodne}|${booking.day.popodne}`) }).getByRole("radio").first();
      const empty = section.getByText(booking.day.empty);
      await Promise.race([slot.waitFor({ timeout: 15_000 }).catch(() => null), empty.waitFor({ timeout: 15_000 }).catch(() => null)]);
      if (await slot.count()) {
        await page.screenshot({ path: `${SHOTS}/${vp}-2-dan.png` });
        await slot.click();
        picked = true;
      }
    }
    expect(picked, "nijedan dan sa slobodnim terminima u tekućoj nedelji").toBe(true);
    await expect(section.getByText(/^Termin: \d{2}:\d{2}–\d{2}:\d{2}/)).toBeVisible();
    const dayLabel = await section.getByRole("radio", { checked: true }).first().getAttribute("aria-label");
    bookedDate = parseDayLong(dayLabel ?? "");
    await page.screenshot({ path: `${SHOTS}/${vp}-2-dan-termin.png` });
    await clickVisible(section.getByRole("button", { name: booking.nav.next }));

    // korak 3
    await section.getByLabel(booking.details.name).fill(NAME);
    await section.getByLabel(booking.details.phone).fill(PHONE);
    await section.getByLabel(booking.details.note).fill("e2e test — slobodno obriši");
    await page.screenshot({ path: `${SHOTS}/${vp}-3-podaci.png` });
    await clickVisible(section.getByRole("button", { name: booking.details.submit }));

    await expect(section.getByText(booking.success.title)).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SHOTS}/${vp}-4-uspeh.png` });
  });

  test("admin: pogrešan ključ", async ({ page }, testInfo) => {
    await page.goto("/admin");
    await page.getByLabel(admin.keyLabel).fill("pogresan-kljuc");
    await page.getByRole("button", { name: admin.keySubmit }).click();
    // u dev modu Next overlay takođe ispiše uhvaćenu grešku — gledamo samo našu alert karticu
    await expect(page.getByRole("alert").filter({ hasText: admin.badKey })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-admin-0-kljuc.png` });
  });

  test("admin: zahtev → potvrdi → kalendar → otkaži", async ({ page }, testInfo) => {
    test.skip(!ADMIN_KEY, "E2E_ADMIN_KEY nije postavljen");
    const vp = testInfo.project.name;
    await page.goto("/admin");
    await page.getByLabel(admin.keyLabel).fill(ADMIN_KEY);
    await page.getByRole("button", { name: admin.keySubmit }).click();
    await expect(page.getByRole("tab", { name: new RegExp(admin.tabs.requests) })).toBeVisible();

    const card = page.locator("li", { hasText: NAME }).filter({ hasText: PHONE }).first();
    await expect(card).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: `${SHOTS}/${vp}-admin-1-zahtevi.png`, fullPage: true });
    await card.getByRole("button", { name: admin.requests.confirm }).click();
    await expect(card).toBeHidden({ timeout: 20_000 });

    await page.getByRole("tab", { name: new RegExp(admin.tabs.calendar) }).click();
    const dateInput = page.getByLabel(admin.calendar.date);
    await dateInput.fill(bookedDate);
    const block = page.getByRole("button", { name: new RegExp(NAME) }).first();
    await expect(block).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: `${SHOTS}/${vp}-admin-2-kalendar.png`, fullPage: true });
    await block.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: admin.calendar.cancel }).click();
    await expect(dialog).toBeHidden({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: new RegExp(NAME) })).toHaveCount(0);

    await page.getByRole("tab", { name: new RegExp(admin.tabs.hours) }).click();
    await expect(page.getByText(admin.hours.overridesTitle)).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/${vp}-admin-3-radno-vreme.png`, fullPage: true });

    await page.getByRole("tab", { name: new RegExp(admin.tabs.services) }).click();
    await expect(page.getByText(admin.services.title)).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/${vp}-admin-4-usluge.png`, fullPage: true });
  });
});

test("mobilna kontakt-traka: vidljiva na hero-u, sakrivena u zakazivanju", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "samo mobilni viewport");
  await openHome(page);
  const rail = page.getByRole("navigation", { name: "Brzi kontakt" });
  const bar = rail.locator("[data-rail='mobile']");
  await expect(bar).toBeVisible();
  await expect(bar).not.toHaveAttribute("aria-hidden", "true");
  await expect(bar.getByRole("link", { name: /Zakaži/ })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/mobile-traka-hero.png` });
  await scrollToBooking(page);
  await expect(bar).toHaveAttribute("aria-hidden", "true", { timeout: 10_000 });
  await page.screenshot({ path: `${SHOTS}/mobile-traka-zakazivanje.png` });
});
