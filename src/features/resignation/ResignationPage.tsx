import { useMemo, useState } from "react";
import { Button } from "../../components/common/Button";
import { Field } from "../../components/forms/Field";
import { Disclaimer } from "../../components/result/Disclaimer";
import { WarningList } from "../../components/result/WarningList";
import { calculateResignation } from "../../lib/calculations/resignation";
import { todayIso } from "../../lib/date/dateUtils";
import { formatKrw } from "../../lib/money/format";
import { buildShareText, shareResult } from "../../lib/share/shareText";
import { isNonNegativeNumber, isPositiveNumber, requiredText } from "../../lib/validation/rules";
import type { ResignationInput } from "../../types/resignation";
import type { Scenario } from "../../types/scenario";

interface ResignationPageProps {
  scenario?: Scenario;
  onSave: (scenario: Scenario) => void;
}

function createDefaultInput(): ResignationInput {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "퇴사일 계산",
    companyName: "현재 회사",
    startDate: "2022-01-03",
    resignationDate: todayIso(),
    monthlySalary: 4000000,
    salaryDay: 25,
    finalSalaryProrationMode: "daily_wage",
    remainingLeaveDays: 5,
    includeLeavePayout: true,
    includeSeveranceEstimate: true,
    createdAt: now,
    updatedAt: now,
  };
}

function isResignationInput(input: Scenario["input"]): input is ResignationInput {
  return "resignationDate" in input && "monthlySalary" in input;
}

function validateResignation(input: ResignationInput): string[] {
  const errors: string[] = [];
  if (!requiredText(input.companyName ?? "", "")) errors.push("회사명을 입력하세요.");
  if (!input.startDate) errors.push("입사일을 입력하세요.");
  if (!input.resignationDate) errors.push("예상 퇴사일을 입력하세요.");
  if (input.startDate && input.resignationDate && input.startDate > input.resignationDate) {
    errors.push("예상 퇴사일은 입사일 이후여야 합니다.");
  }
  if (!isPositiveNumber(input.monthlySalary)) errors.push("월 급여는 0보다 커야 합니다.");
  if (!Number.isInteger(input.salaryDay) || input.salaryDay < 1 || input.salaryDay > 31) {
    errors.push("월급일은 1일부터 31일 사이여야 합니다.");
  }
  if (!isNonNegativeNumber(input.remainingLeaveDays ?? 0)) errors.push("남은 연차는 0 이상이어야 합니다.");
  return errors;
}

export function ResignationPage({ scenario, onSave }: ResignationPageProps) {
  const previousInput = scenario && isResignationInput(scenario.input) ? scenario.input : undefined;
  const [input, setInput] = useState<ResignationInput>(previousInput ?? createDefaultInput);
  const [scenarioTitle, setScenarioTitle] = useState(
    previousInput?.title ?? `${previousInput?.companyName ?? "현재 회사"} 퇴사일 계산`,
  );
  const [shareMessage, setShareMessage] = useState<string | undefined>();
  const result = useMemo(() => calculateResignation(input), [input]);
  const validationErrors = useMemo(() => validateResignation(input), [input]);
  const shareTitle = `${input.companyName ?? "현재 회사"} 퇴사일 계산 결과`;
  const shareLines = useMemo(
    () => [
      `예상 근속기간은 ${result.tenureText}입니다.`,
      `퇴사일까지 남은 기간은 ${result.daysUntilResignation.toLocaleString("ko-KR")}일입니다.`,
      `월급 정산 참고액은 ${formatKrw(result.estimatedFinalSalary ?? 0)}입니다.`,
      `퇴직금 참고액은 ${formatKrw(result.estimatedSeverancePay ?? 0)}입니다.`,
    ],
    [result],
  );
  const shareText = useMemo(() => buildShareText(shareTitle, shareLines), [shareLines, shareTitle]);

  const setField = (field: keyof ResignationInput, value: string | boolean) => {
    setInput((current) => ({
      ...current,
      [field]:
        typeof value === "boolean" ||
        field.includes("Date") ||
        field === "companyName" ||
        field === "title" ||
        field === "finalSalaryProrationMode"
          ? value
          : Number(value),
      updatedAt: new Date().toISOString(),
    }));
  };

  const saveScenario = () => {
    if (validationErrors.length > 0) return;

    onSave({
      id: input.id,
      type: "resignation",
      title: requiredText(scenarioTitle, `${input.companyName ?? "현재 회사"} 퇴사일 계산`),
      input: {
        ...input,
        title: requiredText(scenarioTitle, `${input.companyName ?? "현재 회사"} 퇴사일 계산`),
      },
      createdAt: input.createdAt,
      updatedAt: new Date().toISOString(),
    });
  };

  const printResult = () => {
    window.print();
  };

  const shareSummary = async () => {
    const outcome = await shareResult(shareTitle, shareLines);
    setShareMessage(outcome === "shared" ? "공유 창을 열었습니다." : "요약 문구를 클립보드에 복사했습니다.");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <details className="grid gap-4 rounded-md bg-white p-5 shadow-panel" open>
        <summary className="cursor-pointer text-xl font-bold text-ink">퇴사일 계산 입력</summary>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="회사명 또는 별칭" value={input.companyName ?? ""} onChange={(event) => setField("companyName", event.target.value)} />
          <Field label="입사일" type="date" value={input.startDate} onChange={(event) => setField("startDate", event.target.value)} />
          <Field label="예상 퇴사일" type="date" value={input.resignationDate} onChange={(event) => setField("resignationDate", event.target.value)} />
          <Field label="마지막 출근일" type="date" value={input.lastWorkingDate ?? ""} onChange={(event) => setField("lastWorkingDate", event.target.value)} />
          <Field label="월급일" type="number" unit="일" hint="1일부터 31일 사이" value={input.salaryDay} onChange={(event) => setField("salaryDay", event.target.value)} />
          <Field label="월 기본급 또는 월 평균 급여" type="number" unit="원" value={input.monthlySalary} onChange={(event) => setField("monthlySalary", event.target.value)} />
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            <span>월급 정산 기준</span>
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-ink outline-none focus:border-sea focus:ring-2 focus:ring-cyan-100"
              value={input.finalSalaryProrationMode ?? "daily_wage"}
              onChange={(event) => setField("finalSalaryProrationMode", event.target.value)}
            >
              <option value="daily_wage">30일 기준 일급</option>
              <option value="calendar_month">퇴사월 실제 달력일 기준</option>
            </select>
          </label>
          <Field label="남은 연차" type="number" unit="일" value={input.remainingLeaveDays ?? 0} onChange={(event) => setField("remainingLeaveDays", event.target.value)} />
          <Field label="1일 통상임금" type="number" unit="원/일" hint="비워두면 월 급여/30을 사용합니다." value={input.dailyWage ?? ""} onChange={(event) => setField("dailyWage", event.target.value)} />
          <Field label="이직 예정일" type="date" value={input.nextJobStartDate ?? ""} onChange={(event) => setField("nextJobStartDate", event.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={input.includeLeavePayout} onChange={(event) => setField("includeLeavePayout", event.target.checked)} />
          연차수당 참고 계산 포함
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={input.includeSeveranceEstimate} onChange={(event) => setField("includeSeveranceEstimate", event.target.checked)} />
          퇴직금 참고 계산 포함
        </label>
      </details>

      <section className="grid gap-5 rounded-md bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">퇴사일 결과</h2>
            <p className="text-sm text-slate-600">
              {previousInput ? "저장된 퇴사일 계산을 수정 중입니다." : "회사 기준 확인 전에 보는 참고 계산입니다."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print-hidden">
            <Button onClick={saveScenario} disabled={validationErrors.length > 0}>
              {previousInput ? "수정 내용 저장" : "시나리오 저장"}
            </Button>
            <Button variant="secondary" onClick={printResult}>인쇄</Button>
            <Button variant="secondary" onClick={shareSummary}>공유</Button>
          </div>
        </div>
        {shareMessage && (
          <p aria-live="polite" className="rounded-md bg-mint px-3 py-2 text-sm font-medium text-ink">
            {shareMessage}
          </p>
        )}

        <Field
          label="시나리오 제목"
          value={scenarioTitle}
          onChange={(event) => setScenarioTitle(event.target.value)}
          hint="대시보드와 저장 목록에 표시됩니다."
        />

        {validationErrors.length > 0 && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
            {validationErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        <div className="rounded-md border border-cyan-200 bg-cyan-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-coral">요약 카드</p>
          <h3 className="mt-1 text-xl font-bold text-ink">{input.companyName} 퇴사일 계산 결과</h3>
          <p className="mt-3 leading-7">예상 근속기간은 {result.tenureText}입니다.</p>
          <p className="leading-7">퇴사일까지 남은 기간은 {result.daysUntilResignation.toLocaleString("ko-KR")}일입니다.</p>
          {result.restDaysBeforeNextJob !== undefined && (
            <p className="leading-7">퇴사일부터 이직일까지 쉬는 기간은 {result.restDaysBeforeNextJob.toLocaleString("ko-KR")}일입니다.</p>
          )}
        </div>

        <details className="rounded-md border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-bold text-ink">공유 문구 미리보기</summary>
          <textarea
            className="mt-4 min-h-44 w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-ink"
            readOnly
            value={shareText}
          />
        </details>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">남은 연차수당 참고액</p>
            <p className="mt-1 text-xl font-bold">{formatKrw(result.estimatedLeavePayout ?? 0)}</p>
          </div>
          <div className="rounded-md border border-cyan-100 bg-white p-4">
            <p className="text-sm text-slate-600">월급 정산 참고액</p>
            <p className="mt-1 text-2xl font-bold text-sea">{formatKrw(result.estimatedFinalSalary ?? 0)}</p>
            <p className="mt-1 text-xs text-slate-500">{result.finalSalaryBasisText}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">퇴직금 참고액</p>
            <p className="mt-1 text-xl font-bold">{formatKrw(result.estimatedSeverancePay ?? 0)}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">퇴사 전 사용 가능 연차</p>
            <p className="mt-1 text-xl font-bold">{result.availableLeaveDaysBeforeResignation.toLocaleString("ko-KR")}일</p>
          </div>
        </div>

        <details className="rounded-md border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-bold text-ink">세부 계산 보기</summary>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">근속일수</dt>
              <dd className="font-semibold text-ink">{result.tenureDays.toLocaleString("ko-KR")}일</dd>
            </div>
            <div>
              <dt className="text-slate-500">월급 정산 반영일</dt>
              <dd className="font-semibold text-ink">{result.finalSalarySettledDays.toLocaleString("ko-KR")}일</dd>
            </div>
            <div>
              <dt className="text-slate-500">연차수당 기준 일급</dt>
              <dd className="font-semibold text-ink">{formatKrw(input.dailyWage ?? input.monthlySalary / 30)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">퇴사 전 사용 가능 연차</dt>
              <dd className="font-semibold text-ink">{result.availableLeaveDaysBeforeResignation.toLocaleString("ko-KR")}일</dd>
            </div>
          </dl>
        </details>

        <div>
          <h3 className="font-bold text-ink">체크리스트</h3>
          <ul className="mt-2 grid gap-2 text-sm leading-6 text-slate-700">
            {result.checklist.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>

        <WarningList warnings={result.warnings} />
        <Disclaimer />
      </section>
    </div>
  );
}
