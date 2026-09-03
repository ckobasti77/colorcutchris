import Image from "next/image";
import { reviews, site } from "@/lib/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ReviewPrompt } from "@/components/ui/ReviewPrompt";

function Stars() {
  return (
    <span className="flex gap-0.5 text-neon" aria-label="5 od 5 zvezdica">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden>
          <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L10 15l-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
        </svg>
      ))}
    </span>
  );
}

export function Reviews() {
  return (
    <section className="px-6 py-28 md:px-10 lg:px-16" aria-labelledby="recenzije-title">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Google recenzije"
            title={
              <span id="recenzije-title">
                {site.google.rating.toFixed(1).replace(".", ",")} od 5.{" "}
                <span className="italic">Sve do jedne.</span>
              </span>
            }
            lead={`${site.google.reviews} recenzije na Google mapama, nijedna ispod pet zvezdica. Evo šta ljudi kažu kad izađu.`}
          />
          <Reveal delay={0.15}>
            <a
              href={site.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center rounded-full border border-line px-5 text-sm text-fg transition-colors hover:bg-bg-elev"
            >
              Sve recenzije na Google mapama ↗
            </a>
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal as="li" key={r.name} delay={(i % 3) * 0.07} className="h-full">
              {/* cela kartica je link na tu recenziju na Google mapama */}
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Recenzija — ${r.name}, 5 zvezdica. Otvori na Google mapama.`}
                className="group flex h-full flex-col justify-between rounded-[24px] border border-line bg-bg-elev p-6 transition-[transform,border-color,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:border-neon/40 hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neon"
              >
                <blockquote className="text-display text-[1.35rem] leading-snug text-fg">
                  „{r.text}“
                </blockquote>
                <figcaption className="mt-6 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <Image
                      src={r.avatar}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-line"
                    />
                    <span className="text-xs text-fg-muted">
                      <span className="block text-sm text-fg">{r.name}</span>
                      <span className="opacity-80">
                        Google recenzija{r.original ? " · prevod" : ""}
                      </span>
                    </span>
                  </span>
                  <Stars />
                </figcaption>
              </a>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.1} className="mt-8">
          <ReviewPrompt />
        </Reveal>
      </div>
    </section>
  );
}
