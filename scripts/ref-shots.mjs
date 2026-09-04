// Referentni snimci javnog wizard-a na https://dfrajlica.vercel.app (raspored i tok, ne boje).
// NIKAD ne šalje zahtev: staje na koraku „Podaci" (klik na submit samo sa praznim poljima → klijentska validacija).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = "C:/Users/admin/Desktop/Web Dev Projects/colorcutchris/docs/reference/dfrajlica";
mkdirSync(OUT, { recursive: true });
const URL = "https://dfrajlica.vercel.app";

const viewports = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, scale: 1 },
  { name: "mobile", viewport: { width: 390, height: 844 }, scale: 2 },
];

const browser = await chromium.launch();
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: vp.viewport, deviceScaleFactor: vp.scale, reducedMotion: "reduce", locale: "sr-RS" });
  const page = await ctx.newPage();
  const shot = async (name) => {
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(OUT, `public-${vp.name}-${name}.png`) });
    console.log("saved", `public-${vp.name}-${name}.png`);
  };
  try {
    await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
    const section = page.locator("#zakazivanje");
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await section.screenshot({ path: join(OUT, `public-${vp.name}-section.png`) });
    console.log("saved section");

    // korak 1
    await shot("step1-service");
    const firstService = section.locator("button[aria-pressed]").first();
    await firstService.click();
    await shot("step1-selected");

    // dalje → korak 2
    const next = section.getByRole("button", { name: /^\u0414\u0430\u0459\u0435$/ });
    await next.filter({ visible: true }).first().click();
    await page.waitForTimeout(1200);
    await shot("step2-day");
    // izaberi prvi omogućen dan koji ima slotove
    const days = section.getByRole("radiogroup").first().getByRole("radio");
    const count = await days.count();
    let picked = false;
    for (let i = 0; i < count && !picked; i++) {
      const d = days.nth(i);
      if ((await d.getAttribute("aria-disabled")) === "true") continue;
      await d.click();
      await page.waitForTimeout(1200);
      const slot = section.locator('button[aria-pressed][aria-label*="–"]').first();
      if (await slot.count()) {
        await shot("step2-slots");
        await slot.click();
        await shot("step2-slot-selected");
        picked = true;
      }
    }
    if (!picked) console.log("no slot found for", vp.name);

    await next.filter({ visible: true }).first().click();
    await page.waitForTimeout(1200);
    await shot("step3-details");
    // prazan submit → samo klijentska validacija (server se ne zove)
    const submit = section.getByRole("button", { name: /\u041f\u043e\u0448\u0430\u0459\u0438 \u0437\u0430\u0445\u0442\u0435\u0432/ }).filter({ visible: true }).first();
    if (await submit.isEnabled()) {
      await submit.click();
      await shot("step3-errors");
    }
  } catch (err) {
    console.log("FAILED", vp.name, err.message);
  }
  await ctx.close();
}
await browser.close();
