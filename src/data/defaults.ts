import type { ComparisonAssumptions, WorkCondition } from "../types/compensation";
import type { AppSettings } from "../types/settings";

export const defaultSettings: AppSettings = {
  currency: "KRW",
  autosave: true,
};

export const defaultAssumptions: ComparisonAssumptions = {
  workWeeksPerYear: 52,
  workDaysPerMonth: 21.75,
  hourlyValueMode: "salary_based",
  commuteStressMultiplier: 1,
  riskBufferRate: 0.1,
};

export const defaultCurrentJob: WorkCondition = {
  companyName: "현재 회사",
  annualSalary: 48000000,
  monthlyNetIncome: 3200000,
  annualBonus: 0,
  monthlyBenefit: 200000,
  monthlyTransportCost: 120000,
  oneWayCommuteMinutes: 35,
  officeDaysPerWeek: 3,
  remoteDaysPerWeek: 2,
  overtimeHoursPerWeek: 3,
  annualLeaveDays: 8,
  satisfactionScore: 6,
};

export const defaultTargetJob: WorkCondition = {
  companyName: "후보 회사",
  annualSalary: 54000000,
  monthlyNetIncome: 3550000,
  annualBonus: 0,
  monthlyBenefit: 150000,
  monthlyTransportCost: 160000,
  oneWayCommuteMinutes: 50,
  officeDaysPerWeek: 4,
  remoteDaysPerWeek: 1,
  overtimeHoursPerWeek: 5,
  annualLeaveDays: 5,
  satisfactionScore: 5,
};
