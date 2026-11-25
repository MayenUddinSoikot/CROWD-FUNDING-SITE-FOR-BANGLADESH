import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ReferralCapture } from "@/components/ReferralCapture";

// One family across the site, with Bengali weight-matched so bilingual
// lines don't look lopsided.
const display = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Absolute base for links and share previews. Set NEXT_PUBLIC_SITE_URL in
// Vercel; falls back to the live domain so previews still work locally.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://shohay.org";

const title = "Shohay — সহায় | Crowdfunding for Bangladesh";
const description =
  "Shohay is a crowdfunding platform for Bangladesh. Support verified campaigns with bKash, Nagad, and cards. 0% platform fee.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: "Shohay সহায়",
    locale: "en_GB",
    type: "website",
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${notoBengali.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ScrollToTop />
        <ReferralCapture />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
