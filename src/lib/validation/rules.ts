export function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * 입력값이 비어 있으면 undefined를 반환한다.
 * Number("") === 0 때문에 빈 입력이 0으로 저장되는 문제를 막기 위해 사용한다.
 */
export function toOptionalNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** 값이 유효한 양수면 그대로, 아니면 fallback을 사용한다. (0, 빈 값, NaN 모두 fallback) */
export function positiveOrFallback(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
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
