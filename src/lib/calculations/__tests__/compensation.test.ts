import { describe, expect, it } from "vitest";
import { calculateJobComparison } from "../compensation";
import type { JobComparisonInput } from "../../../types/compensation";

describe("calculateJobComparison", () => {
  it("compares cash, time value, and risk buffer", () => {
    const input: JobComparisonInput = {
      id: "case-1",
      title: "현재 vs 후보",
      createdAt: "2026-06-19T00:00:00.000Z",
      updatedAt: "2026-06-19T00:00:00.000Z",
      currentJob: {
        companyName: "현재",
        annualSalary: 48000000,
        annualBonus: 1000000,
        monthlyBenefit: 200000,
        monthlyTransportCost: 100000,
        oneWayCommuteMinutes: 30,
        officeDaysPerWeek: 3,
        remoteDaysPerWeek: 2,
        overtimeHoursPerWeek: 2,
      },
      targetJob: {
        companyName: "후보",
        annualSalary: 54000000,
        annualBonus: 2000000,
        monthlyBenefit: 100000,
        monthlyTransportCost: 150000,
        oneWayCommuteMinutes: 45,
        officeDaysPerWeek: 4,
        remoteDaysPerWeek: 1,
        overtimeHoursPerWeek: 4,
      },
      assumptions: {
        workWeeksPerYear: 52,
        workDaysPerMonth: 21.75,
        hourlyValueMode: "custom",
        customHourlyValue: 20000,
        commuteStressMultiplier: 1,
        remoteWorkValuePerDay: 10000,
        riskBufferRate: 0.1,
      },
    };

    const result = calculateJobComparison(input);

    expect(result.annualSalaryDifference).toBe(6000000);
    expect(result.annualCashDifference).toBe(5200000);
    expect(result.annualCommuteTimeDifferenceHours).toBe(156);
    expect(result.annualOvertimeDifferenceHours).toBe(104);
    expect(result.estimatedTimeValueDifference).toBe(-5200000);
    expect(result.estimatedRemoteWorkValueDifference).toBe(-520000);
    expect(result.estimatedRiskBuffer).toBe(5400000);
    expect(result.estimatedNetAnnualGain).toBe(-5920000);
    // 협상 권장 연봉 = 후보 연봉 + 손실 보전액(-netGain). 리스크 버퍼는 netGain에 이미
    // 반영되어 있으므로 다시 더하지 않는다(이전: 65,320,000 은 버퍼 이중 반영).
    expect(result.recommendedNegotiationSalary).toBe(59920000);
    // 손실 보전액만큼 연봉을 올리면 실질 손익이 정확히 0(버퍼 반영 손익분기점)이 된다.
    expect(result.recommendedNegotiationSalary - input.targetJob.annualSalary).toBe(
      -result.estimatedNetAnnualGain,
    );
  });

  it("falls back to annualSalary/12 when monthlyNetIncome is 0 or empty", () => {
    const base = {
      companyName: "기준",
      annualSalary: 60000000,
      oneWayCommuteMinutes: 0,
      officeDaysPerWeek: 5,
      remoteDaysPerWeek: 0,
    } as const;
    const input: JobComparisonInput = {
      id: "case-fallback",
      title: "월 실수령액 fallback",
      createdAt: "2026-06-19T00:00:00.000Z",
      updatedAt: "2026-06-19T00:00:00.000Z",
      // monthlyNetIncome 0 은 UI 안내대로 연봉/12 로 대체되어야 한다.
      currentJob: { ...base, monthlyNetIncome: 0 },
      // monthlyNetIncome 미입력(undefined)도 동일하게 연봉/12 를 사용한다.
      targetJob: { ...base },
      assumptions: {
        workWeeksPerYear: 52,
        workDaysPerMonth: 21.75,
        hourlyValueMode: "salary_based",
        commuteStressMultiplier: 1,
        riskBufferRate: 0,
      },
    };

    const result = calculateJobComparison(input);

    // 두 직장 모두 연봉/12 를 쓰므로 월 현금 차이는 0 이어야 한다(0 이 그대로 쓰이면 -5,000,000).
    expect(result.monthlyCashDifference).toBe(0);
  });

  it("uses salary-based hourly value when custom hourly value is not selected", () => {
    const input: JobComparisonInput = {
      id: "case-2",
      title: "현재 vs 원격 후보",
      createdAt: "2026-06-19T00:00:00.000Z",
      updatedAt: "2026-06-19T00:00:00.000Z",
      currentJob: {
        companyName: "현재",
        annualSalary: 60000000,
        monthlyNetIncome: 4000000,
        monthlyBenefit: 100000,
        monthlyTransportCost: 200000,
        oneWayCommuteMinutes: 60,
        officeDaysPerWeek: 5,
        remoteDaysPerWeek: 0,
        overtimeHoursPerWeek: 5,
      },
      targetJob: {
        companyName: "후보",
        annualSalary: 60000000,
        monthlyNetIncome: 4000000,
        monthlyBenefit: 100000,
        monthlyTransportCost: 50000,
        oneWayCommuteMinutes: 20,
        officeDaysPerWeek: 2,
        remoteDaysPerWeek: 3,
        overtimeHoursPerWeek: 1,
      },
      assumptions: {
        workWeeksPerYear: 52,
        workDaysPerMonth: 20,
        hourlyValueMode: "salary_based",
        commuteStressMultiplier: 1,
        remoteWorkValuePerDay: 5000,
        riskBufferRate: 0,
      },
    };

    const result = calculateJobComparison(input);

    expect(result.monthlyCashDifference).toBe(150000);
    expect(result.annualCashDifference).toBe(1800000);
    expect(result.annualCommuteTimeDifferenceHours).toBe(-450.6666666666667);
    expect(result.annualOvertimeDifferenceHours).toBe(-208);
    expect(result.estimatedTimeValueDifference).toBeCloseTo(20583333.33, 2);
    expect(result.estimatedRemoteWorkValueDifference).toBe(780000);
    expect(result.estimatedNetAnnualGain).toBeCloseTo(23163333.33, 2);
    expect(result.recommendedNegotiationSalary).toBe(60000000);
    expect(result.warnings).toContain("리스크 버퍼가 0%입니다. 수습기간, 적응 비용, 성과급 불확실성을 보수적으로 따로 검토하세요.");
  });
});
