export function SectionHeader({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="eyebrow">{title}</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}
