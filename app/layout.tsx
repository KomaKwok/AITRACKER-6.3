import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getDictionary } from "@/lib/i18n";
import "./globals.css";

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
      <body className="antialiased">
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
