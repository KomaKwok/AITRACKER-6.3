import Link from "next/link";
import type { Route } from "next";
import { Radar } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { RefreshButton } from "@/components/refresh-button";
import { Locale } from "@/lib/i18n";

const nav = [
  { href: "/", key: "dashboard" },
  { href: "/signals", key: "signals" },
  { href: "/sources", key: "sources" },
  { href: "/method", key: "method" }
] satisfies Array<{ href: Route; key: "dashboard" | "signals" | "sources" | "method" }>;

export function AppShell({
  children,
  locale,
  labels
}: {
  children: React.ReactNode;
  locale: Locale;
  labels: {
    title: string;
    subtitle: string;
    dashboard: string;
    signals: string;
    sources: string;
    method: string;
    zh: string;
    en: string;
    refresh: { button: string; loading: string; done: string; failed: string; waiting: string };
  };
}) {
  return (
    <div className="page-shell">
      <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-soft backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white">
            <Radar className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">{labels.title}</div>
            <div className="text-sm text-slate-600">{labels.subtitle}</div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex items-center gap-3">
            <RefreshButton
              labels={{ ...labels.refresh, button: locale === "zh" ? "更新资讯" : "Update feed" }}
              showMessage={false}
              align="start"
            />
            <LanguageToggle locale={locale} labels={{ zh: labels.zh, en: labels.en }} />
          </div>
          <nav className="flex flex-wrap gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {labels[item.key]}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
