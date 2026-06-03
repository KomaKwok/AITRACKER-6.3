interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
}

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <div className="panel p-5">
      <div className="eyebrow">{label}</div>
      <div className="metric-value mt-3">{value}</div>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </div>
  );
}
