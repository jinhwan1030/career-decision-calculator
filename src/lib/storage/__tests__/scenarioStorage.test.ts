import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAppData,
  importAppData,
  loadAppData,
  upsertScenario,
} from "../scenarioStorage";
import type { Scenario } from "../../../types/scenario";

function createLocalStorageMock() {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
}

function createScenario(): Scenario {
  const now = "2026-06-19T00:00:00.000Z";
  return {
    id: "scenario-1",
    type: "resignation",
    title: "퇴사일 계산",
    createdAt: now,
    updatedAt: now,
    input: {
      id: "scenario-1",
      title: "퇴사일 계산",
      companyName: "현재 회사",
      startDate: "2025-01-01",
      resignationDate: "2026-06-30",
      monthlySalary: 3000000,
      salaryDay: 25,
      includeLeavePayout: true,
      includeSeveranceEstimate: true,
      createdAt: now,
      updatedAt: now,
    },
  };
}

describe("scenarioStorage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: createLocalStorageMock() });
  });

  it("returns empty versioned app data when storage is empty", () => {
    expect(loadAppData()).toEqual({
      version: "1",
      scenarios: [],
      settings: { currency: "KRW", autosave: true },
    });
  });

  it("upserts scenarios into local storage", () => {
    const scenario = createScenario();

    const data = upsertScenario(scenario);

    expect(data.scenarios).toHaveLength(1);
    expect(data.scenarios[0].title).toBe("퇴사일 계산");
    expect(loadAppData().scenarios[0].id).toBe("scenario-1");
  });

  it("migrates imported data with missing version and input title", () => {
    const scenario = createScenario();
    const rawJson = JSON.stringify({
      scenarios: [{ ...scenario, input: { ...scenario.input, title: "" } }],
    });

    const data = importAppData(rawJson);

    expect(data.version).toBe("1");
    expect(data.settings).toEqual({ currency: "KRW", autosave: true });
    expect(data.scenarios[0].input.title).toBe("퇴사일 계산");
  });

  it("rejects invalid import data", () => {
    expect(() => importAppData(JSON.stringify({ scenarios: [{ id: "bad" }] }))).toThrow(
      "1번째 시나리오 형식이 올바르지 않습니다.",
    );
  });

  it("rejects resignation scenarios with a non-numeric monthlySalary", () => {
    const scenario = createScenario();
    const rawJson = JSON.stringify({
      scenarios: [{ ...scenario, input: { ...scenario.input, monthlySalary: "3000000" } }],
    });

    expect(() => importAppData(rawJson)).toThrow("1번째 시나리오 형식이 올바르지 않습니다.");
  });

  it("rejects job_comparison scenarios with malformed work conditions", () => {
    const now = "2026-06-19T00:00:00.000Z";
    const rawJson = JSON.stringify({
      scenarios: [
        {
          id: "job-1",
          type: "job_comparison",
          title: "이직 비교",
          createdAt: now,
          updatedAt: now,
          input: {
            id: "job-1",
            title: "이직 비교",
            currentJob: { companyName: "현재" }, // annualSalary 등 필수 숫자 누락
            targetJob: { companyName: "후보" },
            assumptions: {},
          },
        },
      ],
    });

    expect(() => importAppData(rawJson)).toThrow("1번째 시나리오 형식이 올바르지 않습니다.");
  });

  it("accepts a well-formed job_comparison scenario", () => {
    const now = "2026-06-19T00:00:00.000Z";
    const rawJson = JSON.stringify({
      scenarios: [
        {
          id: "job-2",
          type: "job_comparison",
          title: "이직 비교",
          createdAt: now,
          updatedAt: now,
          input: {
            id: "job-2",
            title: "이직 비교",
            currentJob: {
              companyName: "현재",
              annualSalary: 48000000,
              oneWayCommuteMinutes: 30,
              officeDaysPerWeek: 3,
              remoteDaysPerWeek: 2,
            },
            targetJob: {
              companyName: "후보",
              annualSalary: 54000000,
              oneWayCommuteMinutes: 45,
              officeDaysPerWeek: 4,
              remoteDaysPerWeek: 1,
            },
            assumptions: {
              workWeeksPerYear: 52,
              workDaysPerMonth: 21.75,
              hourlyValueMode: "salary_based",
              commuteStressMultiplier: 1,
              riskBufferRate: 0.1,
            },
            createdAt: now,
            updatedAt: now,
          },
        },
      ],
    });

    const data = importAppData(rawJson);

    expect(data.scenarios).toHaveLength(1);
    expect(data.scenarios[0].type).toBe("job_comparison");
  });

  it("assigns new ids to duplicated imported scenario ids", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "new-import-id" });
    const scenario = createScenario();
    const rawJson = JSON.stringify({
      scenarios: [scenario, { ...scenario, title: "복제된 시나리오" }],
    });

    const data = importAppData(rawJson);

    expect(data.scenarios).toHaveLength(2);
    expect(data.scenarios[0].id).toBe("scenario-1");
    expect(data.scenarios[1].id).toBe("new-import-id");
    expect(data.scenarios[1].input.id).toBe("new-import-id");
  });

  it("clears data back to defaults", () => {
    upsertScenario(createScenario());

    const data = clearAppData();

    expect(data.scenarios).toEqual([]);
    expect(loadAppData().scenarios).toEqual([]);
  });
});
