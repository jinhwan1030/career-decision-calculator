import type { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  unit?: string;
}

export function Field({ label, hint, unit, className = "", ...props }: FieldProps) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      <span className="flex items-center justify-between gap-2">
        <span>{label}</span>
        {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
      </span>
      <div className="relative">
        <input
          className={`h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-ink outline-none focus:border-sea focus:ring-2 focus:ring-cyan-100 ${unit ? "pr-14" : ""} ${className}`}
          {...props}
        />
        {unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
            {unit}
          </span>
        )}
      </div>
      {hint && <span className="text-xs font-normal leading-5 text-slate-500">{hint}</span>}
    </label>
  );
}
