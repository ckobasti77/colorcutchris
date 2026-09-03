import Image from "next/image";
import { works, site } from "@/lib/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Radovi — fotografije sa javnog Google Maps profila salona.
 * Ritam: 2 kolone na mobilnom, 4 na desktopu; svaka druga kartica malo spuštena (kao police u salonu).
 */
export function Gallery() {
  return (
    <section className="px-6 py-28 md:px-10 lg:px-16" aria-labelledby="radovi-title">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Radovi"
            title={
              <span id="radovi-title">
                Ne retuširam <span className="italic">slike</span>.
              </span>
            }
            lead="Ono što vidiš ovde je izašlo iz salona tačno tako. Bez filtera, bez izglađivanja — jer boja mora da izgleda dobro i na dnevnom svetlu ispred zgrade."
          />
          <Reveal delay={0.15}>
            <a
              href={site.social.facebook}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center rounded-full border border-line px-5 text-sm text-fg transition-colors hover:bg-bg-elev"
            >
              Više na Facebooku ↗
            </a>
          </Reveal>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {works.map((p, i) => (
            /* slika + broj: kartica bez copy-ja — Reveal je ovde jedina animacija */
            <Reveal
              as="li"
              key={p.src}
              data-reveal="off"
              delay={(i % 4) * 0.06}
              className={`group relative self-start overflow-hidden rounded-2xl bg-bg-elev ${i % 2 === 1 ? "md:mt-10" : ""}`}
            >
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(min-width:768px) 24vw, 46vw"
                  className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
                />
              </div>
              <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-night/55 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-cream backdrop-blur-sm">
                {String(i + 1).padStart(2, "0")}
              </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
