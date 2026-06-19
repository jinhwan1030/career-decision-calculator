import { useState } from "react";
import { Button } from "../../components/common/Button";
import type { AppRoute } from "../../app/routes";
import { calculateJobComparison } from "../../lib/calculations/compensation";
import { calculateResignation } from "../../lib/calculations/resignation";
import { formatKrw, formatManWon } from "../../lib/money/format";
import type { JobComparisonInput } from "../../types/compensation";
import type { ResignationInput } from "../../types/resignation";
import type { Scenario } from "../../types/scenario";

interface DashboardProps {
  scenarios: Scenario[];
  message?: string;
  onRouteChange: (route: AppRoute) => void;
  onOpen: (scenario: Scenario) => void;
  onDuplicate: (id: string) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
  onImport: (rawJson: string) => void;
}

export function Dashboard({
  scenarios,
  message,
  onRouteChange,
  onOpen,
  onDuplicate,
  onClear,
  onDelete,
  onImport,
}: DashboardProps) {
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | Scenario["type"]>("all");
  const [sortOrder, setSortOrder] = useState<"updated_desc" | "updated_asc" | "title_asc">("updated_desc");
  const exportJson = JSON.stringify(
    {
      version: "1",
      scenarios,
      settings: { currency: "KRW", autosave: true },
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  );

  const submitImport = () => {
    try {
      onImport(importText);
      setImportText("");
      setImportError(undefined);
      setShowDataPanel(false);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "JSON 데이터를 가져오지 못했습니다.");
    }
  };

  const downloadJson = () => {
    const blob = new Blob([exportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `career-decision-calculator-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const uploadJson = (file?: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImportText(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const filteredScenarios = [...scenarios]
    .filter((scenario) => {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const matchesType = typeFilter === "all" || scenario.type === typeFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        scenario.title.toLowerCase().includes(normalizedQuery) ||
        getScenarioSearchText(scenario).toLowerCase().includes(normalizedQuery);

      return matchesType && matchesQuery;
    })
    .sort((left, right) => {
      if (sortOrder === "title_asc") return left.title.localeCompare(right.title, "ko-KR");
      const leftTime = new Date(left.updatedAt).getTime();
      const rightTime = new Date(right.updatedAt).getTime();
      return sortOrder === "updated_asc" ? leftTime - rightTime : rightTime - leftTime;
    });

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-md bg-white p-5 shadow-panel">
        <div>
          <h2 className="text-xl font-bold text-ink">최근 계산</h2>
          <p className="mt-1 text-sm text-slate-600">
            이 기기 안에만 저장됩니다. 로그인이나 서버 전송은 없습니다.
          </p>
        </div>
        {message && (
          <div aria-live="polite" className="rounded-md bg-mint px-3 py-2 text-sm font-medium text-ink">
            {message}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onRouteChange("jobComparison")}>새 이직 비교 시작</Button>
          <Button variant="secondary" onClick={() => onRouteChange("resignation")}>
            새 퇴사일 계산 시작
          </Button>
          <Button variant="secondary" onClick={() => setShowDataPanel((current) => !current)}>
            JSON 내보내기/가져오기
          </Button>
          <Button variant="danger" onClick={onClear}>데이터 초기화</Button>
        </div>
      </section>

      {showDataPanel && (
        <section className="grid gap-4 rounded-md bg-white p-5 shadow-panel">
          <div>
            <h2 className="text-xl font-bold text-ink">로컬 데이터 이동</h2>
            <p className="mt-1 text-sm text-slate-600">
              JSON은 이 브라우저의 저장 데이터를 옮기기 위한 형식입니다. 민감한 연봉 정보가 포함될 수 있습니다.
            </p>
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span>내보내기 JSON</span>
            <textarea
              className="min-h-40 rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-ink"
              readOnly
              value={exportJson}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span>가져오기 JSON</span>
            <textarea
              className="min-h-40 rounded-md border border-slate-200 bg-white p-3 font-mono text-xs text-ink outline-none focus:border-sea focus:ring-2 focus:ring-cyan-100"
              placeholder="내보낸 JSON을 붙여넣으세요."
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
            />
          </label>
          {importError && (
            <p role="alert" className="text-sm font-medium text-coral">
              {importError}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={submitImport} disabled={!importText.trim()}>
              JSON 가져오기
            </Button>
            <Button variant="secondary" onClick={downloadJson}>
              JSON 파일 다운로드
            </Button>
            <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-ink ring-1 ring-slate-200 transition hover:bg-slate-50">
              JSON 파일 업로드
              <input
                className="sr-only"
                type="file"
                accept="application/json,.json"
                onChange={(event) => uploadJson(event.target.files?.[0])}
              />
            </label>
            <Button variant="secondary" onClick={() => setImportText(exportJson)}>
              현재 JSON 복사 입력
            </Button>
          </div>
        </section>
      )}

      <section className="grid gap-3 rounded-md bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="grid flex-1 gap-1 text-sm font-medium text-slate-700">
            <span>시나리오 검색</span>
            <input
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-ink outline-none focus:border-sea focus:ring-2 focus:ring-cyan-100"
              placeholder="회사명, 제목으로 검색"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700 md:w-52">
            <span>유형 필터</span>
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-ink outline-none focus:border-sea focus:ring-2 focus:ring-cyan-100"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as "all" | Scenario["type"])}
            >
              <option value="all">전체</option>
              <option value="job_comparison">이직 비교</option>
              <option value="resignation">퇴사일 계산</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700 md:w-52">
            <span>정렬</span>
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-ink outline-none focus:border-sea focus:ring-2 focus:ring-cyan-100"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}
            >
              <option value="updated_desc">최근 수정순</option>
              <option value="updated_asc">오래된 수정순</option>
              <option value="title_asc">제목순</option>
            </select>
          </label>
        </div>
        <p className="text-sm text-slate-500">
          {scenarios.length.toLocaleString("ko-KR")}개 중 {filteredScenarios.length.toLocaleString("ko-KR")}개 표시
        </p>
      </section>

      <section className="grid gap-3">
        {scenarios.length === 0 ? (
          <div className="grid gap-4 rounded-md border border-dashed border-slate-300 bg-white p-6">
            <div>
              <h3 className="text-lg font-bold text-ink">아직 저장된 계산이 없습니다.</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                현재 조건과 후보 조건을 한 번 비교하거나, 예상 퇴사일을 계산하면 이곳에서 다시 열고 복제할 수 있습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => onRouteChange("jobComparison")}>이직 비교 만들기</Button>
              <Button variant="secondary" onClick={() => onRouteChange("resignation")}>
                퇴사일 계산 만들기
              </Button>
            </div>
          </div>
        ) : filteredScenarios.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-6">
            <h3 className="text-base font-bold text-ink">조건에 맞는 시나리오가 없습니다.</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              검색어를 줄이거나 유형 필터를 전체로 바꿔보세요.
            </p>
          </div>
        ) : (
          filteredScenarios.map((scenario) => (
            <article key={scenario.id} className="rounded-md bg-white p-4 shadow-panel">
              <div className="grid gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-coral">
                      {scenario.type === "job_comparison" ? "이직 비교" : "퇴사일 계산"}
                    </p>
                    <h3 className="font-bold text-ink">{scenario.title}</h3>
                    <p className="text-sm text-slate-500">
                      마지막 수정: {new Date(scenario.updatedAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => onOpen(scenario)}>열기</Button>
                    <Button variant="secondary" onClick={() => onDuplicate(scenario.id)}>복제</Button>
                    <Button variant="secondary" onClick={() => onDelete(scenario.id)}>삭제</Button>
                  </div>
                </div>
                <ScenarioPreview scenario={scenario} />
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function getScenarioSearchText(scenario: Scenario): string {
  if (isJobComparisonInput(scenario.input)) {
    return `${scenario.input.currentJob.companyName} ${scenario.input.targetJob.companyName}`;
  }

  if (isResignationInput(scenario.input)) {
    return `${scenario.input.companyName ?? ""} ${scenario.input.startDate} ${scenario.input.resignationDate}`;
  }

  return "";
}

function isJobComparisonInput(input: Scenario["input"]): input is JobComparisonInput {
  return "currentJob" in input && "targetJob" in input;
}

function isResignationInput(input: Scenario["input"]): input is ResignationInput {
  return "resignationDate" in input && "monthlySalary" in input;
}

function ScenarioPreview({ scenario }: { scenario: Scenario }) {
  if (scenario.type === "job_comparison" && isJobComparisonInput(scenario.input)) {
    const result = calculateJobComparison(scenario.input);

    return (
      <div className="grid gap-3 rounded-md border border-cyan-100 bg-cyan-50 p-4 md:grid-cols-3">
        <PreviewMetric label="실질 연간 결과" value={formatKrw(result.estimatedNetAnnualGain)} />
        <PreviewMetric label="월 기준 결과" value={formatKrw(result.estimatedNetMonthlyGain)} />
        <PreviewMetric label="협상 목표" value={formatManWon(result.recommendedNegotiationSalary)} />
      </div>
    );
  }

  if (scenario.type === "resignation" && isResignationInput(scenario.input)) {
    const result = calculateResignation(scenario.input);

    return (
      <div className="grid gap-3 rounded-md border border-cyan-100 bg-cyan-50 p-4 md:grid-cols-3">
        <PreviewMetric label="근속기간" value={result.tenureText} />
        <PreviewMetric label="남은 기간" value={`${result.daysUntilResignation.toLocaleString("ko-KR")}일`} />
        <PreviewMetric label="퇴직금 참고액" value={formatKrw(result.estimatedSeverancePay ?? 0)} />
      </div>
    );
  }

  return (
    <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
      미리보기를 표시할 수 없는 저장 데이터입니다.
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-sea">{value}</p>
    </div>
  );
}
