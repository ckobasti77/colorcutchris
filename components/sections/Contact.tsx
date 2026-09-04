import { Logo } from "@/components/brand/Logo";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { contactIcon } from "@/components/ui/SocialIcons";
import { bookingLink, contactLinks } from "@/lib/contactLinks";
import { site } from "@/lib/site";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/**
 * Red okruglih ikonica (Instagram · Facebook · Viber · Poziv · Mejl). Lista je chrome —
 * `data-reveal="off"`, inače bi site-wide reveal sakrio <li> koji nema teksta.
 */
function ContactIconRow({ size, className }: { size: "md" | "lg"; className?: string }) {
  const item =
    size === "lg"
      ? "grid h-11 w-11 place-items-center rounded-full border border-line text-fg transition-colors hover:bg-bg-elev hover:text-accent"
      : "grid h-11 w-11 place-items-center rounded-full border border-line text-fg transition-colors hover:bg-bg-elev hover:text-accent";
  const icon = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <ul data-reveal="off" aria-label="Kontakt i mreže" className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      {contactLinks.map((link) => {
        const Icon = contactIcon(link.id);
        return (
          <li key={link.id}>
            <a
              href={link.href}
              aria-label={link.ariaLabel}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
              className={`${item} ${FOCUS}`}
            >
              <Icon className={icon} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

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
              lead="Termin zakažeš ovde na sajtu, pozivom ili porukom na Viber. Odgovaram između dva gosta, pa ako ne stignem odmah — stižem."
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
            <Reveal delay={0.15} data-reveal="off">
              <div className="mt-10 flex flex-wrap gap-3">
                <a
                  href={bookingLink.href}
                  className={`inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-medium text-accent-fg transition-transform duration-300 ease-out-expo hover:-translate-y-0.5 ${FOCUS}`}
                >
                  Zakaži termin
                </a>
                <a
                  href={site.phone.href}
                  className={`inline-flex h-12 items-center rounded-full border border-line px-6 text-sm font-medium text-fg transition-colors hover:bg-bg-elev ${FOCUS}`}
                >
                  Pozovi
                </a>
                <a
                  href={site.viber}
                  className={`inline-flex h-12 items-center rounded-full border border-line px-6 text-sm font-medium text-fg transition-colors hover:bg-bg-elev ${FOCUS}`}
                >
                  Piši na Viber
                </a>
              </div>
              <ContactIconRow size="lg" className="mt-5" />
            </Reveal>
          </div>

          {/* mapa — Google Maps embed, u luku kao ogledalo. Google-ov info-karticu
              gasimo (koordinatni prikaz bez upita), pa crtamo svoj pin i karticu. */}
          <Reveal delay={0.1} className="mask-arch relative min-h-[420px] w-full bg-cream-deep">
            <iframe
              title={`Mapa — ${site.name}, ${site.address.street}`}
              src={site.mapsEmbed}
              className="absolute inset-0 h-full w-full grayscale-[0.35] contrast-[1.05]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />

            {/* naš pin na centru mape — centar iframe-a JE koordinata salona */}
            <div
              aria-hidden
              data-reveal="off"
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-10 w-8 -translate-x-1/2 -translate-y-full"
            >
              <span className="absolute bottom-0 left-1/2 h-1.5 w-3.5 -translate-x-1/2 rounded-[50%] bg-ink/30 blur-[2px]" />
              <span
                className="absolute left-1/2 top-0 grid h-8 w-8 place-items-center bg-ink shadow-sm"
                style={{ borderRadius: "50% 50% 50% 0", transform: "translateX(-50%) rotate(45deg)" }}
              >
                <span className="block" style={{ transform: "rotate(-45deg)" }}>
                  <Logo withText={false} className="h-3.5 w-3.5 text-neon" />
                </span>
              </span>
            </div>

            {/* naša info-kartica na dnu luka (chrome — van reč-po-reč otkrivanja) */}
            <div
              data-reveal="off"
              className="absolute inset-x-5 bottom-5 z-10 flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev/90 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-display text-xl text-fg">{site.name}</div>
                <div className="mt-0.5 text-sm text-fg-muted">
                  {site.address.street} · {site.address.area}
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={site.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Otvori u Google mapama"
                  className="grid h-11 w-11 place-items-center rounded-full border border-line text-fg transition-colors hover:bg-bg"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M14 4h6v6" />
                    <path d="M20 4 10 14" />
                    <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
                  </svg>
                </a>
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=44.7960207,20.4837926"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Putanja"
                  className="grid h-11 w-11 place-items-center rounded-full border border-line text-fg transition-colors hover:bg-bg"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="m21.71 11.29-9-9a1 1 0 0 0-1.42 0l-9 9a1 1 0 0 0 0 1.42l9 9a1 1 0 0 0 1.42 0l9-9a1 1 0 0 0 0-1.42Z" />
                    <path d="M9 15v-2a2 2 0 0 1 2-2h4" />
                    <path d="m13 8 3 3-3 3" />
                  </svg>
                </a>
              </div>
            </div>
          </Reveal>
        </div>

        <footer className="mt-24 flex flex-col items-center justify-between gap-6 border-t border-line pt-8 text-xs text-fg-muted lg:flex-row">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
            <div className="flex items-center gap-3 text-fg">
              <Logo className="h-10 w-10" />
              <span>
                © {new Date().getFullYear()} {site.name} · {site.address.street}, {site.city}
              </span>
            </div>
            <ContactIconRow size="md" className="sm:border-l sm:border-line sm:pl-5" />
          </div>
          <p>Slike radova nisu retuširane.</p>
        </footer>
      </div>
    </section>
  );
}
