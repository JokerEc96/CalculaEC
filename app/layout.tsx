import type { Metadata } from "next";
import "./globals.css";

const originalLogo = "https://raw.githubusercontent.com/JokerEc96/CalculaEC/main/calculaec-logo-original.png";

export const metadata: Metadata = {
  title: "CalculaEC | Herramientas para Ecuador",
  description:
    "Calculadoras, precios, indicadores y herramientas útiles para Ecuador.",
  icons: {
    icon: originalLogo,
    shortcut: originalLogo,
    apple: originalLogo,
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
