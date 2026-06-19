export function getRemoteWorkChangeDays(currentDaysPerWeek: number, targetDaysPerWeek: number): number {
  return (targetDaysPerWeek - currentDaysPerWeek) * 52;
}
