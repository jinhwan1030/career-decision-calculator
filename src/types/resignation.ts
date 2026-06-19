export type FinalSalaryProrationMode = "daily_wage" | "calendar_month";

export interface ResignationInput {
  id: string;
  title: string;
  companyName?: string;
  startDate: string;
  resignationDate: string;
  lastWorkingDate?: string;
  monthlySalary: number;
  salaryDay: number;
  finalSalaryProrationMode?: FinalSalaryProrationMode;
  remainingLeaveDays?: number;
  dailyWage?: number;
  includeLeavePayout: boolean;
  includeSeveranceEstimate: boolean;
  nextJobStartDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResignationResult {
  tenureDays: number;
  tenureText: string;
  daysUntilResignation: number;
  estimatedLeavePayout?: number;
  availableLeaveDaysBeforeResignation: number;
  estimatedFinalSalary?: number;
  finalSalarySettledDays: number;
  finalSalaryBasisText: string;
  estimatedSeverancePay?: number;
  restDaysBeforeNextJob?: number;
  checklist: string[];
  warnings: string[];
}
