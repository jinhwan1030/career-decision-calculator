export function buildShareText(title: string, lines: string[]): string {
  return [title, "", ...lines].join("\n");
}

export async function shareResult(title: string, lines: string[]): Promise<"shared" | "copied"> {
  const text = buildShareText(title, lines);

  if (navigator.share) {
    await navigator.share({ title, text });
    return "shared";
  }

  await navigator.clipboard.writeText(text);
  return "copied";
}
