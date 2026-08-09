import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CalculaEC | Herramientas para Ecuador",
  description:
    "Calculadoras, precios, indicadores y herramientas útiles para Ecuador.",
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