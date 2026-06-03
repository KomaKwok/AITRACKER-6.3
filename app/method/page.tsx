import { getDictionary } from "@/lib/i18n";

export default async function MethodPage() {
  const { t } = await getDictionary();

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="eyebrow">{t.methodPage.eyebrow}</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{t.methodPage.title}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">{t.methodPage.intro}</p>
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        <article className="panel p-6">
          <h2 className="text-xl font-semibold text-ink">{t.methodPage.whyTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{t.methodPage.whyBody}</p>
        </article>
        <article className="panel p-6">
          <h2 className="text-xl font-semibold text-ink">{t.methodPage.scoringTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{t.methodPage.scoringBody}</p>
        </article>
        <article className="panel p-6">
          <h2 className="text-xl font-semibold text-ink">{t.methodPage.loopTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{t.methodPage.loopBody}</p>
        </article>
      </section>
      <section className="panel p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">{t.methodPage.refTitle}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="font-semibold text-ink">{t.methodPage.firstHandTitle}</div>
            <p className="mt-2 text-sm leading-7 text-slate-600">{t.methodPage.firstHandBody}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="font-semibold text-ink">{t.methodPage.signalTitle}</div>
            <p className="mt-2 text-sm leading-7 text-slate-600">{t.methodPage.signalBody}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
