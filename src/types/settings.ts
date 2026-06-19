import type { Scenario } from "./scenario";

export interface AppSettings {
  currency: "KRW";
  autosave: boolean;
}

export interface AppData {
  version: string;
  scenarios: Scenario[];
  settings: AppSettings;
  exportedAt?: string;
}
