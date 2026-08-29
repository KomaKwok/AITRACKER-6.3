import { CheckCircle2, Clock3, ExternalLink, ShieldAlert } from "lucide-react";
import { PriceSnapshotEntry } from "@/lib/data/pricing-snapshot";

function formatDateTime(value: string | null | undefined, locale: "zh" | "en") {
  if (!value) return locale === "zh" ? "暂无" : "Not available";
  return new Date(value).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Shanghai"
  });
}

const brandStyles: Record<string, string> = {
  OpenAI: "from-slate-950 to-slate-800",
  Anthropic: "from-orange-700 to-stone-700",
  腾讯混元: "from-blue-700 via-sky-600 to-cyan-600",
  DeepSeek: "from-blue-700 to-cyan-700",
  MiniMax: "from-fuchsia-700 to-pink-700",
  "豆包 / 方舟": "from-emerald-700 to-teal-700"
};

export function PriceBoard({ entries, locale }: { entries: PriceSnapshotEntry[]; locale: "zh" | "en" }) {
  const verifiedCount = entries.filter((entry) => entry.verificationStatus !== "stale").length;
  const latestAttempt = entries
    .map((entry) => entry.lastAttemptedAt ?? entry.verifiedAt)
    .sort((a, b) => +new Date(b) - +new Date(a))[0];
  const copy =
    locale === "zh"
      ? {
          eyebrow: "Pricing Radar",
          title: "旗舰模型价格雷达",
          description: "每家公司只保留一个当前旗舰细分模型；不跨人民币与美元做误导性的高低排名。",
          checked: "本轮检查",
          coverage: "成功核验",
          strategy: "抓取策略",
          strategyValue: "官方页直抓 · 失败保留上次",
          input: "标准输入价",
          output: "标准输出价",
          verified: "本轮已核验",
          stale: "使用上次数据",
          successAt: "最近成功核验",
          sourceAt: "官网文档日期",
          changedAt: "最近模型/价格变化",
          official: "查看官方页"
        }
      : {
          eyebrow: "Pricing Radar",
          title: "Flagship Model Pricing",
          description: "One current flagship variant per provider; USD and CNY prices are not ranked against each other.",
          checked: "Current check",
          coverage: "Verified",
          strategy: "Fetch strategy",
          strategyValue: "Official pages · keep last good value on failure",
          input: "Standard input",
          output: "Standard output",
          verified: "Verified this round",
          stale: "Using last value",
          successAt: "Last successful check",
          sourceAt: "Official document date",
          changedAt: "Last model/price change",
          official: "Official source"
        };

  return (
    <div className="mt-8 rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(180deg,#f8fbff_0%,#f3f6fb_100%)] p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="eyebrow">{copy.eyebrow}</div>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{copy.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{copy.description}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div className="text-xs text-slate-500">{copy.checked}</div>
            <div className="mt-1 text-sm font-semibold text-ink">{formatDateTime(latestAttempt, locale)}</div>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div className="text-xs text-slate-500">{copy.coverage}</div>
            <div className="mt-1 text-sm font-semibold text-ink">{verifiedCount} / {entries.length}</div>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div className="text-xs text-slate-500">{copy.strategy}</div>
            <div className="mt-1 text-sm font-semibold text-ink">{copy.strategyValue}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {entries.map((entry) => {
          const isStale = entry.verificationStatus === "stale";
          const brandStyle = brandStyles[entry.company] ?? "from-slate-800 to-slate-700";

          return (
            <article key={entry.company} className="overflow-hidden rounded-[1.9rem] border border-white/80 bg-white/95 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <div className={`bg-gradient-to-r ${brandStyle} px-5 py-4 text-white`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold tracking-tight">{entry.company}</div>
                    <div className="mt-1 text-sm text-white/80">{entry.product}</div>
                  </div>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">{entry.basis}</span>
                </div>
              </div>

              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <div className="text-xs font-medium text-slate-500">{copy.input}</div>
                    <div className="mt-2 text-lg font-semibold tracking-tight text-ink">{entry.headlinePrice}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <div className="text-xs font-medium text-slate-500">{copy.output}</div>
                    <div className="mt-2 text-lg font-semibold tracking-tight text-ink">{entry.secondaryPrice ?? "—"}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isStale ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {isStale ? <ShieldAlert className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    {isStale ? copy.stale : copy.verified}
                  </span>
                  <a href={entry.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-ink">
                    {copy.official}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{copy.successAt}</span>
                    <span className="font-medium text-slate-700">{formatDateTime(entry.verifiedAt, locale)}</span>
                  </div>
                  {entry.officialUpdatedAt ? (
                    <div className="flex items-center justify-between gap-3"><span>{copy.sourceAt}</span><span>{formatDateTime(entry.officialUpdatedAt, locale)}</span></div>
                  ) : null}
                  {entry.priceChangedAt ? (
                    <div className="flex items-center justify-between gap-3"><span>{copy.changedAt}</span><span>{formatDateTime(entry.priceChangedAt, locale)}</span></div>
                  ) : null}
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">{entry.note}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
