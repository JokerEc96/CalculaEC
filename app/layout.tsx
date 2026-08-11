import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CalculaEC | Herramientas para Ecuador",
  description:
    "Calculadoras, precios, indicadores y herramientas útiles para Ecuador.",
  icons: {
    icon: "/calculaec-logo.svg",
    shortcut: "/calculaec-logo.svg",
    apple: "/calculaec-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
