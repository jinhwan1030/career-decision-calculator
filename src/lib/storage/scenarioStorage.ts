import { defaultSettings } from "../../data/defaults";
import type { Scenario } from "../../types/scenario";
import type { AppData } from "../../types/settings";

const storageKey = "career-decision-calculator:v1";
const currentDataVersion = "1";

function createEmptyAppData(): AppData {
  return { version: currentDataVersion, scenarios: [], settings: defaultSettings };
}

export function loadAppData(): AppData {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return createEmptyAppData();
  }

  try {
    return migrateAppData(JSON.parse(raw) as Partial<AppData>);
  } catch {
    return createEmptyAppData();
  }
}

export function saveAppData(data: AppData): void {
  window.localStorage.setItem(storageKey, JSON.stringify(data));
}

function normalizeAppData(data: Partial<AppData>): AppData {
  return migrateAppData(data);
}

function migrateScenario(scenario: Scenario): Scenario {
  const title = scenario.title || scenario.input.title || "이름 없는 시나리오";
  return {
    ...scenario,
    title,
    input: {
      ...scenario.input,
      title: scenario.input.title || title,
    },
  };
}

function ensureUniqueScenarioIds(scenarios: Scenario[]): Scenario[] {
  const seen = new Set<string>();

  return scenarios.map((scenario) => {
    if (!seen.has(scenario.id)) {
      seen.add(scenario.id);
      return scenario;
    }

    const nextId = crypto.randomUUID();
    seen.add(nextId);
    return {
      ...scenario,
      id: nextId,
      input: {
        ...scenario.input,
        id: nextId,
      },
    };
  });
}

function migrateAppData(data: Partial<AppData>): AppData {
  const scenarios = Array.isArray(data.scenarios)
    ? ensureUniqueScenarioIds(data.scenarios.map(migrateScenario))
    : [];
  return {
    version: currentDataVersion,
    scenarios,
    settings: { ...defaultSettings, ...(data.settings ?? {}) },
    exportedAt: data.exportedAt,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isScenarioLike(value: unknown): value is Scenario {
  if (!isRecord(value)) return false;
  if (value.type !== "job_comparison" && value.type !== "resignation") return false;
  if (typeof value.id !== "string" || typeof value.title !== "string") return false;
  if (typeof value.createdAt !== "string" || typeof value.updatedAt !== "string") return false;
  if (!isRecord(value.input)) return false;

  if (value.type === "job_comparison") {
    return isRecord(value.input.currentJob) && isRecord(value.input.targetJob) && isRecord(value.input.assumptions);
  }

  return typeof value.input.startDate === "string" && typeof value.input.resignationDate === "string";
}

function parseImportData(rawJson: string): AppData {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("올바른 JSON 형식이 아닙니다.");
  }

  if (!isRecord(parsed)) {
    throw new Error("가져오기 데이터는 JSON 객체여야 합니다.");
  }

  if (!Array.isArray(parsed.scenarios)) {
    throw new Error("scenarios 배열이 필요합니다.");
  }

  const invalidIndex = parsed.scenarios.findIndex((scenario) => !isScenarioLike(scenario));
  if (invalidIndex >= 0) {
    throw new Error(`${invalidIndex + 1}번째 시나리오 형식이 올바르지 않습니다.`);
  }

  return normalizeAppData(parsed as Partial<AppData>);
}

export function upsertScenario(scenario: Scenario): AppData {
  const data = loadAppData();
  const scenarios = data.scenarios.some((item) => item.id === scenario.id)
    ? data.scenarios.map((item) => (item.id === scenario.id ? scenario : item))
    : [scenario, ...data.scenarios];
  const nextData = { ...data, scenarios };
  saveAppData(nextData);
  return nextData;
}

export function deleteScenario(id: string): AppData {
  const data = loadAppData();
  const nextData = { ...data, scenarios: data.scenarios.filter((scenario) => scenario.id !== id) };
  saveAppData(nextData);
  return nextData;
}

export function duplicateScenario(id: string): AppData {
  const data = loadAppData();
  const source = data.scenarios.find((scenario) => scenario.id === id);
  if (!source) return data;

  const now = new Date().toISOString();
  const nextId = crypto.randomUUID();
  const clonedInput = { ...source.input, id: nextId, title: `${source.input.title} 복사본`, createdAt: now, updatedAt: now };
  const clonedScenario: Scenario = {
    ...source,
    id: nextId,
    title: `${source.title} 복사본`,
    input: clonedInput,
    createdAt: now,
    updatedAt: now,
  };
  const nextData = { ...data, scenarios: [clonedScenario, ...data.scenarios] };
  saveAppData(nextData);
  return nextData;
}

export function clearAppData(): AppData {
  const nextData = createEmptyAppData();
  saveAppData(nextData);
  return nextData;
}

export function exportAppData(): string {
  return JSON.stringify({ ...loadAppData(), exportedAt: new Date().toISOString() }, null, 2);
}

export function importAppData(rawJson: string): AppData {
  const nextData = parseImportData(rawJson);
  saveAppData(nextData);
  return nextData;
}
