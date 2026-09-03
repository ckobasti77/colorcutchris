import { Logo } from "@/components/brand/Logo";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/lib/site";

export function Contact() {
  return (
    <section className="px-6 pt-28 pb-10 md:px-10 lg:px-16" aria-labelledby="kontakt-title">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading
              eyebrow="Kontakt"
              title={
                <span id="kontakt-title">
                  Vidimo se <span className="italic">ujutru</span>.
                </span>
              }
              lead="Termin se zakazuje pozivom ili porukom na Viber. Odgovaram između dva gosta, pa ako ne stignem odmah — stižem."
            />

            {/* dt/dd hvata site-wide reč-po-reč otkrivanje — bez Reveal omotača */}
            <dl className="mt-10 grid gap-7 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-fg-muted">Telefon / Viber</dt>
                <dd className="mt-2">
                  <a href={site.phone.href} className="text-display text-3xl text-fg hover:text-accent">
                    {site.phone.display}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-fg-muted">Email</dt>
                <dd className="mt-2">
                  <a href={`mailto:${site.email}`} className="text-base text-fg hover:text-accent">
                    {site.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-fg-muted">Adresa</dt>
                <dd className="mt-2 text-base text-fg">
                  <a href={site.mapsUrl} target="_blank" rel="noreferrer" className="hover:text-accent">
                    {site.address.street}
                    <br />
                    {site.address.city} · {site.address.area}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-fg-muted">Radno vreme</dt>
                <dd className="mt-2 space-y-1 text-base text-fg">
                  {site.hours.map((h) => (
                    <div key={h.days} className="flex justify-between gap-4 border-b border-line pb-1 text-sm">
                      <span className="text-fg-muted">{h.days}</span>
                      <span className="tabular-nums">{h.time}</span>
                    </div>
                  ))}
                </dd>
              </div>
            </dl>

            {/* linkovi su chrome — Reveal ostaje jer omotava dugmad, ne tekst */}
            <Reveal delay={0.15}>
              <div className="mt-10 flex flex-wrap gap-3">
                <a
                  href={site.phone.href}
                  className="inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-medium text-accent-fg transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
                >
                  Pozovi
                </a>
                <a
                  href={site.viber}
                  className="inline-flex h-12 items-center rounded-full border border-line px-6 text-sm font-medium text-fg transition-colors hover:bg-bg-elev"
                >
                  Piši na Viber
                </a>
                <a
                  href={site.social.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center rounded-full border border-line px-6 text-sm font-medium text-fg transition-colors hover:bg-bg-elev"
                >
                  Facebook ↗
                </a>
              </div>
            </Reveal>
          </div>

          {/* mapa — Google Maps embed, u luku kao ogledalo */}
          <Reveal delay={0.1} className="mask-arch relative min-h-[420px] w-full bg-cream-deep">
            <iframe
              title={`Mapa — ${site.name}, ${site.address.street}`}
              src={site.mapsEmbed}
              className="absolute inset-0 h-full w-full grayscale-[0.35] contrast-[1.05]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </Reveal>
        </div>

        <footer className="mt-24 flex flex-col items-center justify-between gap-6 border-t border-line pt-8 text-xs text-fg-muted sm:flex-row">
          <div className="flex items-center gap-3 text-fg">
            <Logo className="h-10 w-10" />
            <span>
              © {new Date().getFullYear()} {site.name} · {site.address.street}, {site.city}
            </span>
          </div>
          <p>Slike radova nisu retuširane.</p>
        </footer>
      </div>
    </section>
  );
}
