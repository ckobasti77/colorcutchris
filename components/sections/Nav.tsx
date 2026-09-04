"use client";

import { Logo } from "@/components/brand/Logo";
import { contactIcon } from "@/components/ui/SocialIcons";
import { bookingLink, contactLinks } from "@/lib/contactLinks";

const links = [
  { href: "#usluge", label: "Usluge" },
  { href: "#radovi", label: "Radovi" },
  { href: "#recenzije", label: "Recenzije" },
  { href: "#chris", label: "Chris" },
  { href: "#cenovnik", label: "Cenovnik" },
  { href: "#kontakt", label: "Kontakt" },
];

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-5 pt-4 md:px-8">
      <nav
        className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-full border border-line bg-bg/70 px-3 pl-4 backdrop-blur-md transition-colors duration-700"
        aria-label="Glavna navigacija"
      >
        <a href="#top" className={`flex min-h-11 items-center gap-3 rounded-full text-fg ${FOCUS}`} aria-label="color cut Chris and more — na vrh">
          <Logo withText={false} className="h-9 w-9" />
          <span className="hidden text-sm font-medium tracking-wide sm:block">
            color cut <span className="text-display text-lg italic">Chris</span> and more
          </span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-full px-3.5 py-2 text-sm text-fg-muted transition-colors hover:bg-bg-elev hover:text-fg"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {/* kontakt ikonice — tek od xl: na lg (1024–1279) sa wordmark-om i 6 linkova ne staju u pilulu */}
          <ul className="hidden items-center xl:flex" aria-label="Kontakt i mreže">
            {contactLinks.map((link) => {
              const Icon = contactIcon(link.id);
              return (
                <li key={link.id}>
                  <a
                    href={link.href}
                    aria-label={link.ariaLabel}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noreferrer" : undefined}
                    className={`grid h-11 w-11 place-items-center rounded-full text-fg-muted transition-colors hover:bg-bg-elev hover:text-fg ${FOCUS}`}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                </li>
              );
            })}
          </ul>

          <a
            href={bookingLink.href}
            aria-label={bookingLink.ariaLabel}
            className={`inline-flex h-11 items-center rounded-full bg-accent px-4 text-sm font-medium text-accent-fg transition-transform duration-300 ease-out-expo hover:-translate-y-px ${FOCUS}`}
          >
            {bookingLink.label}
          </a>
        </div>
      </nav>
    </header>
  );
}
