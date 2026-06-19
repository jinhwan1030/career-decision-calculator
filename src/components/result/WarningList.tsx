interface WarningListProps {
  title?: string;
  warnings: string[];
}

export function WarningList({ title = "주의할 변수", warnings }: WarningListProps) {
  if (warnings.length === 0) return null;

  return (
    <section className="rounded-md border border-amber-200 bg-amber-50 p-4">
      <h3 className="text-sm font-bold text-amber-950">{title}</h3>
      <ul className="mt-2 grid gap-1 text-sm leading-6 text-amber-950">
        {warnings.map((warning) => (
          <li key={warning}>- {warning}</li>
        ))}
      </ul>
    </section>
  );
}
