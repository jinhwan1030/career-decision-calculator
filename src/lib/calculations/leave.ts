export function estimateLeavePayout(remainingLeaveDays: number, dailyWage: number): number {
  return Math.max(0, remainingLeaveDays) * Math.max(0, dailyWage);
}
