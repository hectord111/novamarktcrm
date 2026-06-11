import type { Metadata } from "next";
import "./globals.css";

// Run the serverless functions next to the Supabase DB (Europe) so data-heavy
// pages don't pay a transatlantic round-trip per query. Region is enforced in
// vercel.json ("regions": ["fra1"]); this hint matches it.
export const preferredRegion = 'fra1';

export const metadata: Metadata = {
  title: "Nova Marketing CRM",
  description:
    "CRM de Nova Marketing — gestiona leads de Meta Ads, coste por lead, coste por cliente cerrado y automatizaciones de WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
