import { describe, expect, it, vi } from "vitest";
import { calculateResignation } from "../resignation";
import type { ResignationInput } from "../../../types/resignation";

describe("calculateResignation", () => {
  it("estimates tenure, leave payout, final salary, and severance", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:00.000Z"));

    const input: ResignationInput = {
      id: "resign-1",
      title: "퇴사일 계산",
      companyName: "현재",
      startDate: "2024-06-01",
      resignationDate: "2026-06-30",
      monthlySalary: 3000000,
      salaryDay: 25,
      remainingLeaveDays: 4,
      dailyWage: 100000,
      includeLeavePayout: true,
      includeSeveranceEstimate: true,
      nextJobStartDate: "2026-07-08",
      createdAt: "2026-06-19T00:00:00.000Z",
      updatedAt: "2026-06-19T00:00:00.000Z",
    };

    const result = calculateResignation(input);

    expect(result.tenureDays).toBe(760);
    expect(result.daysUntilResignation).toBe(29);
    expect(result.estimatedLeavePayout).toBe(400000);
    expect(result.estimatedFinalSalary).toBe(3000000);
    expect(result.estimatedSeverancePay).toBeCloseTo(6246575.34, 2);
    expect(result.restDaysBeforeNextJob).toBe(8);

    vi.useRealTimers();
  });

  it("uses calendar-month proration when selected", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));

    const input: ResignationInput = {
      id: "resign-2",
      title: "달력일 기준",
      companyName: "현재",
      startDate: "2025-02-01",
      resignationDate: "2026-02-14",
      monthlySalary: 2800000,
      salaryDay: 25,
      finalSalaryProrationMode: "calendar_month",
      remainingLeaveDays: 0,
      includeLeavePayout: true,
      includeSeveranceEstimate: true,
      createdAt: "2026-06-19T00:00:00.000Z",
      updatedAt: "2026-06-19T00:00:00.000Z",
    };

    const result = calculateResignation(input);

    expect(result.finalSalarySettledDays).toBe(14);
    expect(result.finalSalaryBasisText).toBe("퇴사월 실제 달력일 28일 기준");
    expect(result.estimatedFinalSalary).toBe(1400000);
    expect(result.checklist).not.toContain("남은 연차를 사용할지, 수당으로 받을지 회사 기준을 확인하세요.");
    expect(result.warnings).toContain("퇴사월 실제 달력일 기준은 회사 급여기간과 다를 수 있습니다.");

    vi.useRealTimers();
  });

  it("falls back to monthlySalary/30 when dailyWage is 0 or empty", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:00.000Z"));

    const input: ResignationInput = {
      id: "resign-fallback",
      title: "일급 fallback",
      companyName: "현재",
      startDate: "2024-06-01",
      resignationDate: "2026-06-30",
      monthlySalary: 3000000,
      salaryDay: 25,
      remainingLeaveDays: 3,
      // 빈 입력이 Number("")=0 으로 저장되어도 월 급여/30(=100,000)이 적용되어야 한다.
      dailyWage: 0,
      includeLeavePayout: true,
      includeSeveranceEstimate: false,
      createdAt: "2026-06-19T00:00:00.000Z",
      updatedAt: "2026-06-19T00:00:00.000Z",
    };

    const result = calculateResignation(input);

    // 3,000,000 / 30 * 3 = 300,000 (0 이 그대로 쓰이면 0 이 된다).
    expect(result.estimatedLeavePayout).toBe(300000);
    // 30일 기준 일급 정산: 100,000 * min(30, 30) = 3,000,000.
    expect(result.estimatedFinalSalary).toBe(3000000);
    expect(result.warnings).toContain("1일 통상임금을 입력하지 않아 월 급여 / 30 기준을 사용합니다.");

    vi.useRealTimers();
  });

  it("adds checklist items for next job and different last working date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:00.000Z"));

    const input: ResignationInput = {
      id: "resign-3",
      title: "체크리스트",
      companyName: "현재",
      startDate: "2026-01-01",
      resignationDate: "2026-06-30",
      lastWorkingDate: "2026-06-20",
      monthlySalary: 3000000,
      salaryDay: 25,
      remainingLeaveDays: 2,
      includeLeavePayout: true,
      includeSeveranceEstimate: true,
      nextJobStartDate: "2026-07-01",
      createdAt: "2026-06-19T00:00:00.000Z",
      updatedAt: "2026-06-19T00:00:00.000Z",
    };

    const result = calculateResignation(input);

    expect(result.checklist).toContain("남은 연차를 사용할지, 수당으로 받을지 회사 기준을 확인하세요.");
    expect(result.checklist).toContain("근속 1년 미만이면 일반적인 퇴직금 대상이 아닐 수 있으니 회사 기준을 확인하세요.");
    expect(result.checklist).toContain("이직 전 휴식 기간의 4대보험 공백과 생활비를 함께 확인하세요.");
    expect(result.checklist).toContain("마지막 출근일과 퇴사일 사이의 연차, 급여, 보험 처리 기준을 확인하세요.");
    expect(result.warnings).toContain("근속 1년 미만의 퇴직금은 일반적인 법정 퇴직금 기준과 다를 수 있습니다.");

    vi.useRealTimers();
  });
});
