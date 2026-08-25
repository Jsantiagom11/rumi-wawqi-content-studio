import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rumi Wawqi Estudio Gráfico",
  description: "Generador de piezas gráficas consistentes para Rumi Wawqi.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
