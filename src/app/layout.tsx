import type { Metadata } from "next";
import "./globals.css";

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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
