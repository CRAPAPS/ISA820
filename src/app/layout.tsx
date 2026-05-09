import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Spectral } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ISA820 | The Forensic Standard",
  description: "A manuscript-first biblical research platform for dismantling false doctrines through forensic analysis.",
  keywords: ["Bible", "Scripture", "Theology", "Forensic Analysis", "ISA820", "TAHOT", "TBESG"],
  authors: [{ name: "ISA820" }],
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${spectral.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
