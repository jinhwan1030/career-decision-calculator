import type { JobComparisonInput } from "./compensation";
import type { ResignationInput } from "./resignation";

export type ScenarioType = "job_comparison" | "resignation";

export interface Scenario {
  id: string;
  type: ScenarioType;
  title: string;
  input: JobComparisonInput | ResignationInput;
  createdAt: string;
  updatedAt: string;
}
