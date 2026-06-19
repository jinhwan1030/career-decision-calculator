export function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function requiredText(value: string, fallback: string): string {
  return value.trim() || fallback;
}

export function isPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function isNonNegativeNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}
