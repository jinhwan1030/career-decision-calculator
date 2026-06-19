export type MoneyAmount = number;

export interface WorkCondition {
  companyName: string;
  annualSalary: number;
  monthlyNetIncome?: number;
  annualBonus?: number;
  monthlyBenefit?: number;
  monthlyTransportCost?: number;
  oneWayCommuteMinutes: number;
  officeDaysPerWeek: number;
  remoteDaysPerWeek: number;
  overtimeHoursPerWeek?: number;
  annualLeaveDays?: number;
  satisfactionScore?: number;
}

export interface ComparisonAssumptions {
  workWeeksPerYear: number;
  workDaysPerMonth: number;
  hourlyValueMode: "salary_based" | "custom";
  customHourlyValue?: number;
  commuteStressMultiplier: number;
  remoteWorkValuePerDay?: number;
  riskBufferRate: number;
}

export interface JobComparisonInput {
  id: string;
  title: string;
  currentJob: WorkCondition;
  targetJob: WorkCondition;
  assumptions: ComparisonAssumptions;
  createdAt: string;
  updatedAt: string;
}

export interface JobComparisonResult {
  annualSalaryDifference: number;
  monthlyCashDifference: number;
  annualCashDifference: number;
  annualCommuteTimeDifferenceHours: number;
  annualCommuteCostDifference: number;
  annualOvertimeDifferenceHours: number;
  annualBenefitDifference: number;
  estimatedTimeValueDifference: number;
  estimatedRemoteWorkValueDifference: number;
  estimatedRiskBuffer: number;
  estimatedNetAnnualGain: number;
  estimatedNetMonthlyGain: number;
  recommendedNegotiationSalary: number;
  summary: string[];
  warnings: string[];
}
