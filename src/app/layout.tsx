import type { Metadata } from "next";
import {headers} from 'next/headers';
export const dynamic='force-dynamic';
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { YandexMetrika } from "@/components/yandex-metrika";

const inter = Inter({
  subsets: ["cyrillic", "latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  variable: "--font-cormorant",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pappare.ru"),
  title: {
    default: "Pappare Italiano | Итальянская траттория в Иркутске",
    template: "%s",
  },
  description:
    "Pappare Italiano - уютная современная итальянская траттория в Иркутске на переулке Богданова, 4. Меню, бронь стола, контакты и афиша.",
  applicationName: "Pappare Italiano",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  keywords: [
    "Pappare Italiano",
    "итальянский ресторан Иркутск",
    "траттория Иркутск",
    "ресторан для ужина",
    "итальянская кухня",
    "Паппаре Иркутск",
    "ресторан переулок Богданова Иркутск",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Pappare Italiano",
    description:
      "Современная итальянская траттория: теплый свет, дерево, растения и дорогая простота.",
    url: "https://pappare.ru",
    siteName: "Pappare Italiano",
    images: ["/assets/interior-main.png"],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pappare Italiano",
    description:
      "Современная итальянская траттория в Иркутске с теплым интерьером и атмосферой европейского вечера.",
    images: ["/assets/interior-main.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce=(await headers()).get('x-nonce')||undefined;
  return (
    <html lang="ru">
      <body className={`${inter.variable} ${cormorant.variable} font-sans`}>
        <ThemeProvider>
          <YandexMetrika nonce={nonce}/>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
