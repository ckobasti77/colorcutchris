import { SectionHeading } from "@/components/ui/SectionHeading";
import { BookingWizardLoader } from "@/components/booking/BookingWizardLoader";
import { booking } from "@/components/booking/strings";
import { site } from "@/lib/site";

/**
 * Sekcija „Zakazivanje" — noćna tema. `id="zakazivanje"` nosi SceneTheme omotač u page.tsx.
 * `overflow-clip`, NE hidden: mobilna traka wizard-a je sticky, a overflow:hidden
 * na pretku bi je pretvorio u običan blok.
 */
export function Booking() {
  return (
    <section className="relative overflow-clip px-6 py-28 md:px-10 lg:px-16" aria-labelledby="zakazivanje-title">
      {/* meki halo u boji neona iza kartice */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-56 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-neon/[0.06] blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={booking.section.eyebrow}
          title={
            <span id="zakazivanje-title">
              {booking.section.titleLead} <span className="italic">{booking.section.titleItalic}</span>
            </span>
          }
          lead={booking.section.lead}
        />

        {/* overflow-clip i ovde (nije scroll kontejner, sticky radi): traka na dnu prati luk kartice */}
        <div className="mt-14 overflow-clip rounded-[28px] border border-line bg-bg-elev/70 p-5 backdrop-blur sm:p-8 lg:p-10">
          <BookingWizardLoader />
        </div>

        <div className="mt-14 flex flex-col items-start gap-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{booking.section.orCall}</p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <a
              href={site.phone.href}
              className="text-display text-3xl tabular-nums text-fg transition-colors hover:text-accent sm:text-4xl"
            >
              {site.phone.display}
            </a>
            <a
              href={site.viber}
              className="inline-flex h-12 items-center rounded-full border border-line px-6 text-sm font-medium text-fg transition-colors hover:bg-bg-elev"
            >
              {booking.section.viber}
            </a>
          </div>
          <p className="text-sm text-fg-muted">{booking.section.hoursNote}</p>
        </div>
      </div>
    </section>
  );
}
