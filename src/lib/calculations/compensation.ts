import type {
  ComparisonAssumptions,
  JobComparisonInput,
  JobComparisonResult,
  WorkCondition,
} from "../../types/compensation";
import { formatManWon } from "../money/format";
import { positiveOrFallback } from "../validation/rules";

function annualCash(job: WorkCondition): number {
  return (
    job.annualSalary +
    (job.annualBonus ?? 0) +
    (job.monthlyBenefit ?? 0) * 12 -
    (job.monthlyTransportCost ?? 0) * 12
  );
}

function monthlyCash(job: WorkCondition): number {
  // 월 실수령액이 비어 있거나 0이면 UI 안내대로 연봉/12를 사용한다.
  const baseMonthly = positiveOrFallback(job.monthlyNetIncome, job.annualSalary / 12);
  return baseMonthly + (job.monthlyBenefit ?? 0) - (job.monthlyTransportCost ?? 0);
}

function annualCommuteHours(job: WorkCondition, assumptions: ComparisonAssumptions): number {
  return ((job.oneWayCommuteMinutes * 2 * job.officeDaysPerWeek) / 60) * assumptions.workWeeksPerYear;
}

function annualOvertimeHours(job: WorkCondition, assumptions: ComparisonAssumptions): number {
  return (job.overtimeHoursPerWeek ?? 0) * assumptions.workWeeksPerYear;
}

function annualRemoteWorkDays(job: WorkCondition, assumptions: ComparisonAssumptions): number {
  return job.remoteDaysPerWeek * assumptions.workWeeksPerYear;
}

function hourlyValue(input: JobComparisonInput): number {
  if (input.assumptions.hourlyValueMode === "custom" && input.assumptions.customHourlyValue) {
    return input.assumptions.customHourlyValue;
  }

  const annualWorkHours = input.assumptions.workDaysPerMonth * 12 * 8;
  return input.currentJob.annualSalary / annualWorkHours;
}

export function calculateJobComparison(input: JobComparisonInput): JobComparisonResult {
  const { currentJob, targetJob, assumptions } = input;
  const hourly = hourlyValue(input);

  const annualSalaryDifference = targetJob.annualSalary - currentJob.annualSalary;
  const annualCashDifference = annualCash(targetJob) - annualCash(currentJob);
  const monthlyCashDifference = monthlyCash(targetJob) - monthlyCash(currentJob);
  const annualCommuteTimeDifferenceHours =
    annualCommuteHours(targetJob, assumptions) - annualCommuteHours(currentJob, assumptions);
  const annualOvertimeDifferenceHours =
    annualOvertimeHours(targetJob, assumptions) - annualOvertimeHours(currentJob, assumptions);
  const annualCommuteCostDifference =
    ((targetJob.monthlyTransportCost ?? 0) - (currentJob.monthlyTransportCost ?? 0)) * 12;
  const annualBenefitDifference =
    ((targetJob.monthlyBenefit ?? 0) - (currentJob.monthlyBenefit ?? 0)) * 12;
  const timeDeltaHours = annualCommuteTimeDifferenceHours + annualOvertimeDifferenceHours;
  const estimatedTimeValueDifference =
    -timeDeltaHours * hourly * assumptions.commuteStressMultiplier;
  const remoteDayDifference =
    annualRemoteWorkDays(targetJob, assumptions) - annualRemoteWorkDays(currentJob, assumptions);
  const estimatedRemoteWorkValueDifference =
    remoteDayDifference * (assumptions.remoteWorkValuePerDay ?? 0);
  const estimatedRiskBuffer = Math.max(targetJob.annualSalary * assumptions.riskBufferRate, 0);
  const estimatedNetAnnualGain =
    annualCashDifference +
    estimatedTimeValueDifference +
    estimatedRemoteWorkValueDifference -
    estimatedRiskBuffer;
  const estimatedNetMonthlyGain = estimatedNetAnnualGain / 12;
  // 실질 손익(estimatedNetAnnualGain)에는 이미 리스크 버퍼가 차감되어 있다.
  // 따라서 손실분(-netGain)만 보전하면 버퍼를 반영한 채로 손익분기점에 도달한다.
  // 여기에 버퍼를 또 더하면 이중 반영되므로 더하지 않는다.
  const recommendedNegotiationSalary =
    targetJob.annualSalary + Math.max(-estimatedNetAnnualGain, 0);

  const gainWord = estimatedNetAnnualGain >= 0 ? "이득" : "손실";
  const commuteWord =
    annualCommuteTimeDifferenceHours > 0
      ? "증가합니다"
      : annualCommuteTimeDifferenceHours < 0
        ? "줄어듭니다"
        : "비슷합니다";
  const warnings = [
    "본 결과는 개인 의사결정을 돕기 위한 참고용 계산입니다.",
    "세금, 퇴직금, 연차수당, 실업급여 등은 개인 상황과 회사 기준에 따라 달라질 수 있습니다.",
    "법률, 세무, 노무 자문이 아닙니다.",
  ];

  if (!targetJob.monthlyNetIncome || !currentJob.monthlyNetIncome) {
    warnings.push("월 실수령액을 입력하지 않은 항목은 연봉을 12개월로 나눈 단순값을 사용합니다.");
  }

  if (annualCommuteTimeDifferenceHours > 0) {
    warnings.push("후보 직장의 출퇴근 시간이 늘어납니다. 피로도, 교통 변동성, 가족 일정 영향을 함께 확인하세요.");
  }

  if ((targetJob.remoteDaysPerWeek ?? 0) < (currentJob.remoteDaysPerWeek ?? 0)) {
    warnings.push("재택근무일이 줄어듭니다. 집중 시간, 돌봄 일정, 생활비 변화를 별도로 확인하세요.");
  }

  if (annualOvertimeDifferenceHours > 0) {
    warnings.push("후보 직장의 야근 시간이 늘어납니다. 실제 조직 문화와 피크 시즌 업무량을 확인하세요.");
  }

  if (assumptions.riskBufferRate === 0) {
    warnings.push("리스크 버퍼가 0%입니다. 수습기간, 적응 비용, 성과급 불확실성을 보수적으로 따로 검토하세요.");
  }

  return {
    annualSalaryDifference,
    monthlyCashDifference,
    annualCashDifference,
    annualCommuteTimeDifferenceHours,
    annualCommuteCostDifference,
    annualOvertimeDifferenceHours,
    annualBenefitDifference,
    estimatedTimeValueDifference,
    estimatedRemoteWorkValueDifference,
    estimatedRiskBuffer,
    estimatedNetAnnualGain,
    estimatedNetMonthlyGain,
    recommendedNegotiationSalary,
    summary: [
      `${targetJob.companyName}의 제안 연봉은 현재보다 ${formatManWon(annualSalaryDifference)} 차이입니다.`,
      `출퇴근과 야근 변화까지 반영한 시간 부담은 연간 약 ${Math.abs(Math.round(timeDeltaHours)).toLocaleString("ko-KR")}시간 ${commuteWord}.`,
      `시간가치, 교통비, 복지, 리스크 버퍼를 반영한 실질 결과는 연간 약 ${formatManWon(Math.abs(estimatedNetAnnualGain))} ${gainWord}으로 추정됩니다.`,
      `현재 조건보다 여유 있게 나아지려면 협상 목표 연봉은 최소 ${formatManWon(recommendedNegotiationSalary)} 수준으로 볼 수 있습니다.`,
    ],
    warnings,
  };
}
