import { SignalsTable } from "@/components/signals-table";
import { getDictionary } from "@/lib/i18n";
import { getAllSignals, filterSignals } from "@/lib/radar/repository";

export default async function SignalsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, t } = await getDictionary();
  const params = await searchParams;
  const signals = await getAllSignals();
  const filtered = filterSignals(signals, {
    region: typeof params.region === "string" ? params.region : "All",
    sourceType: typeof params.sourceType === "string" ? params.sourceType : "All",
    tag: typeof params.tag === "string" ? params.tag : "All",
    timeRange: typeof params.timeRange === "string" ? params.timeRange : "All",
    sort: typeof params.sort === "string" ? params.sort : "newest"
  });

  const filters = {
    region: [
      { value: "All", label: t.signalsPage.all },
      { value: "Global", label: "Global" },
      { value: "China", label: "China" }
    ],
    sourceType: [
      { value: "All", label: t.signalsPage.all },
      { value: "Official", label: "Official" }
    ],
    tag: [
      { value: "All", label: t.signalsPage.all },
      { value: "Agent", label: "Agent" },
      { value: "Coding", label: "Coding" },
      { value: "Search", label: "Search" },
      { value: "Multimodal", label: "Multimodal" },
      { value: "Open Source", label: "Open Source" },
      { value: "Enterprise", label: "Enterprise" },
      { value: "Model Release", label: "Model Release" },
      { value: "API", label: "API" },
      { value: "Infrastructure", label: "Infrastructure" }
    ],
    timeRange: [
      { value: "All", label: t.signalsPage.all },
      { value: "24h", label: "24h" },
      { value: "7d", label: "7d" },
      { value: "30d", label: "30d" }
    ],
    sort: [
      { value: "newest", label: t.signalsPage.newest },
      { value: "score", label: t.signalsPage.score }
    ]
  };

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="eyebrow">{t.signalsPage.eyebrow}</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{t.signalsPage.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{t.signalsPage.description}</p>
        <form className="mt-6 grid gap-4 md:grid-cols-5">
          {Object.entries(filters).map(([key, values]) => (
            <label key={key} className="text-sm font-medium text-slate-700">
              <span className="mb-2 block">
                {key === "region"
                  ? t.signalsPage.region
                  : key === "sourceType"
                    ? t.signalsPage.sourceType
                    : key === "tag"
                      ? t.signalsPage.tag
                      : key === "timeRange"
                        ? t.signalsPage.timeRange
                        : t.signalsPage.sort}
              </span>
              <select
                name={key}
                defaultValue={typeof params[key] === "string" ? (params[key] as string) : values[0].value}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-slate-400"
              >
                {values.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <div className="md:col-span-5">
            <button
              type="submit"
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {t.signalsPage.apply}
            </button>
          </div>
        </form>
      </section>
      <SignalsTable
        signals={filtered}
        labels={{
          signal: t.common.signal,
          type: t.common.type,
          region: t.common.region,
          published: t.common.published,
          score: t.common.score,
          topSignal: t.common.topSignal,
          strongSignal: t.common.strongSignal,
          watch: t.common.watch
        }}
        locale={locale}
      />
    </div>
  );
}
