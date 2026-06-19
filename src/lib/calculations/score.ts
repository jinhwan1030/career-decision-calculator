export function clampScore(score: number): number {
  return Math.min(10, Math.max(0, score));
}
