"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Locale } from "@/lib/i18n";

export function LanguageToggle({
  locale,
  labels
}: {
  locale: Locale;
  labels: {
    zh: string;
    en: string;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function switchLocale(nextLocale: Locale) {
    document.cookie = `ai-radar-locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
      <button
        type="button"
        onClick={() => switchLocale("zh")}
        disabled={isPending}
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
          locale === "zh" ? "bg-ink text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        {labels.zh}
      </button>
      <button
        type="button"
        onClick={() => switchLocale("en")}
        disabled={isPending}
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
          locale === "en" ? "bg-ink text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        {labels.en}
      </button>
    </div>
  );
}
