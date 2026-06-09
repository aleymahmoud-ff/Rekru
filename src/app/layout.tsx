import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rekru",
  description: "Recruitment Cycle Management",
};

// Render every route dynamically. The CDN (LightCDN) caches statically
// prerendered pages for a year and does not refresh them on deploy, which left
// stale HTML referencing old Server Action IDs (causing "An unexpected response
// was received from the server" after each deploy). Dynamic rendering means no
// statically cached HTML can go stale.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${dmSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
