import { MessageCircle, Phone } from "lucide-react";
import { site } from "@/lib/site";
import { booking } from "./strings";
import { secondaryButtonClass } from "./wizardStyles";

/**
 * Greška pri slanju (ili nedostupan backend) + brzi izlaz: poziv ili Viber.
 * Bez hook-ova — koristi je i NoBackendFallback, koji se renderuje bez Convex provider-a.
 */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" data-reveal="off" className="mt-5 rounded-2xl border border-rattan/40 bg-rattan/10 p-4 text-sm text-fg">
      <p className="font-medium text-rattan">{booking.errors.title}</p>
      <p className="mt-1">{message}</p>
      <p className="mt-3 text-fg-muted">{booking.errors.hint}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={site.phone.href} className={`${secondaryButtonClass} gap-2`}>
          <Phone size={16} aria-hidden="true" />
          {booking.errors.callUs}
          <span className="tabular-nums text-fg-muted">{site.phone.display}</span>
        </a>
        <a href={site.viber} className={`${secondaryButtonClass} gap-2`}>
          <MessageCircle size={16} aria-hidden="true" />
          {booking.errors.viber}
        </a>
      </div>
    </div>
  );
}
