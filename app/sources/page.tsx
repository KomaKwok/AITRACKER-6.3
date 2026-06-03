import { SourceList } from "@/components/source-list";
import { getDictionary } from "@/lib/i18n";
import { getAllSources } from "@/lib/radar/repository";

export default async function SourcesPage() {
  const { locale, t } = await getDictionary();
  const sources = await getAllSources();

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="eyebrow">{t.sourcesPage.eyebrow}</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{t.sourcesPage.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{t.sourcesPage.description}</p>
      </section>
      <SourceList
        sources={sources}
        labels={{
          active: t.common.active,
          inactive: t.common.inactive,
          visit: t.common.visit,
          lastFetched: t.common.lastFetched,
          lastSuccess: t.common.lastSuccess,
          priority: t.common.priority,
          fetchVia: t.common.fetchVia,
          status: t.common.status,
          details: t.common.details,
          success: t.common.success,
          empty: t.common.empty,
          error: t.common.error
        }}
        locale={locale}
      />
    </div>
  );
}
