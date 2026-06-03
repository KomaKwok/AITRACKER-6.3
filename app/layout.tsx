import type { Metadata } from "next";
import { Geist_Mono, Geist } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { getDictionary } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "AI Radar",
  description: "Track first-hand AI product signals across global and China markets."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, t } = await getDictionary();

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppShell
          locale={locale}
          labels={{
            title: t.app.title,
            subtitle: t.app.subtitle,
            dashboard: t.nav.dashboard,
            signals: t.nav.signals,
            sources: t.nav.sources,
            method: t.nav.method,
            zh: t.app.switchToZh,
            en: t.app.switchToEn,
            refresh: t.refresh
          }}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
