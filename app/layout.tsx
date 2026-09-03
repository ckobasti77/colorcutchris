import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { TextRevealGlobal } from "@/components/providers/TextRevealGlobal";
import { hideCss } from "@/constants/textRevealConfig";
import "./globals.css";

/**
 * Copy se krije pre prvog paint-a (inline <style>), ali samo pod `html.js` —
 * bez JS-a nema ko da ga vrati, pa tada ostaje vidljiv.
 */
const JS_FLAG = `document.documentElement.classList.add("js")`;

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "color cut Chris and more — frizerski salon, Beograd",
  description:
    "Farbanje, šišanje, styling i svečane frizure. Salon Chris u Beogradu — topao prostor, iskren rad, slike koje ne retuširamo.",
  openGraph: {
    title: "color cut Chris and more",
    description: "Farbanje, šišanje, styling i svečane frizure u Beogradu.",
    locale: "sr_RS",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe6" },
    { media: "(prefers-color-scheme: dark)", color: "#1d2a22" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sr-Latn"
      className={`${fraunces.variable} ${geist.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_FLAG }} />
        <style dangerouslySetInnerHTML={{ __html: hideCss() }} />
      </head>
      <body className="min-h-full flex flex-col">
        <TextRevealGlobal />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
