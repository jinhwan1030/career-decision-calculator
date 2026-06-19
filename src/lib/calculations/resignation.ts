import type { ResignationInput, ResignationResult } from "../../types/resignation";
import { daysBetween, formatTenure, inclusiveDaysBetween } from "../date/dateUtils";

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function calculateFinalSalary(input: ResignationInput): {
  amount: number;
  settledDays: number;
  basisText: string;
} {
  const resignationDate = new Date(input.resignationDate);
  const settledDays = resignationDate.getDate();

  if (input.finalSalaryProrationMode === "calendar_month") {
    const daysInMonth = getDaysInMonth(resignationDate);
    return {
      amount: (input.monthlySalary / daysInMonth) * settledDays,
      settledDays,
      basisText: `퇴사월 실제 달력일 ${daysInMonth}일 기준`,
    };
  }

  const dailyWage = input.dailyWage ?? input.monthlySalary / 30;
  return {
    amount: dailyWage * Math.min(30, settledDays),
    settledDays: Math.min(30, settledDays),
    basisText: "30일 기준 일급 또는 입력한 1일 통상임금 기준",
  };
}

export function calculateResignation(input: ResignationInput): ResignationResult {
  const today = new Date().toISOString().slice(0, 10);
  const tenureDays = inclusiveDaysBetween(input.startDate, input.resignationDate);
  const daysUntilResignation = daysBetween(today, input.resignationDate);
  const dailyWage = input.dailyWage ?? input.monthlySalary / 30;
  const remainingLeaveDays = input.remainingLeaveDays ?? 0;
  const finalSalary = calculateFinalSalary(input);
  const estimatedLeavePayout = input.includeLeavePayout ? dailyWage * remainingLeaveDays : undefined;
  const estimatedSeverancePay =
    input.includeSeveranceEstimate && tenureDays >= 365
      ? input.monthlySalary * (tenureDays / 365)
      : undefined;
  const restDaysBeforeNextJob = input.nextJobStartDate
    ? daysBetween(input.resignationDate, input.nextJobStartDate)
    : undefined;
  const checklist = [
    "마지막 출근일과 서류상 퇴사일이 같은지 확인하세요.",
    "상여, 성과급, 식대, 미지급 수당의 정산 기준을 확인하세요.",
  ];

  if (remainingLeaveDays > 0) {
    checklist.push("남은 연차를 사용할지, 수당으로 받을지 회사 기준을 확인하세요.");
  }

  if (input.includeSeveranceEstimate) {
    checklist.push(
      tenureDays >= 365
        ? "퇴직금 산정에 포함되는 평균임금 기간과 상여/수당 반영 여부를 확인하세요."
        : "근속 1년 미만이면 일반적인 퇴직금 대상이 아닐 수 있으니 회사 기준을 확인하세요.",
    );
  }

  if (restDaysBeforeNextJob !== undefined) {
    checklist.push(
      restDaysBeforeNextJob > 0
        ? "이직 전 휴식 기간의 4대보험 공백과 생활비를 함께 확인하세요."
        : "퇴사일과 이직일이 붙어 있거나 겹치면 인수인계, 입사서류 일정을 확인하세요.",
    );
  }

  if (input.lastWorkingDate && input.lastWorkingDate !== input.resignationDate) {
    checklist.push("마지막 출근일과 퇴사일 사이의 연차, 급여, 보험 처리 기준을 확인하세요.");
  }
  const warnings = [
    "본 결과는 개인 의사결정을 돕기 위한 참고용 계산입니다.",
    "퇴직금, 연차수당, 최종 급여는 평균임금, 통상임금, 회사 규정, 세금에 따라 달라질 수 있습니다.",
    "법률, 세무, 노무 자문이 아닙니다.",
  ];

  if (!input.dailyWage) {
    warnings.push("1일 통상임금을 입력하지 않아 월 급여 / 30 기준을 사용합니다.");
  }

  if (input.finalSalaryProrationMode === "calendar_month") {
    warnings.push("퇴사월 실제 달력일 기준은 회사 급여기간과 다를 수 있습니다.");
  }

  if (input.includeSeveranceEstimate && tenureDays < 365) {
    warnings.push("근속 1년 미만의 퇴직금은 일반적인 법정 퇴직금 기준과 다를 수 있습니다.");
  }

  return {
    tenureDays,
    tenureText: formatTenure(tenureDays),
    daysUntilResignation,
    estimatedLeavePayout,
    availableLeaveDaysBeforeResignation: Math.min(remainingLeaveDays, Math.max(0, daysUntilResignation)),
    estimatedFinalSalary: finalSalary.amount,
    finalSalarySettledDays: finalSalary.settledDays,
    finalSalaryBasisText: finalSalary.basisText,
    estimatedSeverancePay,
    restDaysBeforeNextJob,
    checklist,
    warnings,
  };
}
