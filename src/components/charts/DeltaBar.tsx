interface DeltaBarProps {
  label: string;
  value: number;
  max: number;
}

export function DeltaBar({ label, value, max }: DeltaBarProps) {
  const width = max === 0 ? 0 : Math.min(100, Math.abs(value / max) * 100);
  const positive = value >= 0;

  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className={positive ? "text-sea" : "text-coral"}>{Math.round(value).toLocaleString("ko-KR")}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${positive ? "bg-sea" : "bg-coral"}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
