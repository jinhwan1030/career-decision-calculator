import type { ComparisonAssumptions, WorkCondition } from "../../types/compensation";

export function getAnnualCommuteHours(
  condition: WorkCondition,
  assumptions: ComparisonAssumptions,
): number {
  return ((condition.oneWayCommuteMinutes * 2 * condition.officeDaysPerWeek) / 60) * assumptions.workWeeksPerYear;
}
