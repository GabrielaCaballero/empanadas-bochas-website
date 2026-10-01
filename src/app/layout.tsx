import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/lib/cart-context";
import { BUSINESS_INSTAGRAM } from "@/lib/business-info";
import "./globals.css";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const SITE_URL = "https://empanadasbochas.com";
const SITE_NAME = "Empanadas Bochas";
const SITE_DESCRIPTION =
  "Homemade Argentine empanadas in NYC. Find us at breweries and pop-ups around the city, or order ahead for pickup and delivery.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // %s is filled in by each page's own title — e.g. "Shop | Empanadas Bochas".
  // Search engines and LLM crawlers both read this, so every page having its
  // own specific title (set per-page below) matters far more for being
  // found than this default alone.
  title: {
    default: `${SITE_NAME} | Argentine Empanadas in NYC`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Argentine Empanadas in NYC`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/photos/empanada-2.webp", width: 1448, height: 1086 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Argentine Empanadas in NYC`,
    description: SITE_DESCRIPTION,
    images: ["/photos/empanada-2.webp"],
  },
  alternates: {
    canonical: "/",
  },
};

// FoodEstablishment, not a storefront with a public street address — this
// business is pop-up/brewery-based with no walk-in location (see the PDP's
// Non-goals), so `areaServed` is used instead of `address`. Publishing the
// kitchen's pickup address here would make Google show it as a public
// storefront/map pin, which it isn't. If a Google Business Profile gets
// set up for local "near me" search, it should match this same framing
// (service-area business, not a fixed address) for consistency.
const structuredData = {
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/photos/empanada-2.webp`,
  logo: `${SITE_URL}/brand/logo.png`,
  servesCuisine: "Argentine",
  priceRange: "$6–$60",
  areaServed: {
    "@type": "City",
    name: "New York City",
  },
  sameAs: [BUSINESS_INSTAGRAM],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <CartProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
