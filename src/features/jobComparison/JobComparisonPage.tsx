import { useMemo, useState } from "react";
import { Button } from "../../components/common/Button";
import { DeltaBar } from "../../components/charts/DeltaBar";
import { Field } from "../../components/forms/Field";
import { Disclaimer } from "../../components/result/Disclaimer";
import { defaultAssumptions, defaultCurrentJob, defaultTargetJob } from "../../data/defaults";
import { calculateJobComparison } from "../../lib/calculations/compensation";
import { formatKrw, formatManWon } from "../../lib/money/format";
import { buildShareText, shareResult } from "../../lib/share/shareText";
import { isNonNegativeNumber, isPositiveNumber, requiredText } from "../../lib/validation/rules";
import type { ComparisonAssumptions, JobComparisonInput, WorkCondition } from "../../types/compensation";
import type { Scenario } from "../../types/scenario";

interface JobComparisonPageProps {
  scenario?: Scenario;
  onSave: (scenario: Scenario) => void;
}

function createInput(
  title: string,
  currentJob: WorkCondition,
  targetJob: WorkCondition,
  assumptions: ComparisonAssumptions,
  previous?: JobComparisonInput,
): JobComparisonInput {
  const now = new Date().toISOString();
  return {
    id: previous?.id ?? crypto.randomUUID(),
    title: requiredText(title, `${currentJob.companyName} vs ${targetJob.companyName}`),
    currentJob,
    targetJob,
    assumptions,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };
}

function isJobComparisonInput(input: Scenario["input"]): input is JobComparisonInput {
  return "currentJob" in input && "targetJob" in input;
}

function validateJob(job: WorkCondition, label: string): string[] {
  const errors: string[] = [];
  if (!requiredText(job.companyName, "")) errors.push(`${label} 회사명을 입력하세요.`);
  if (!isPositiveNumber(job.annualSalary)) errors.push(`${label} 연봉은 0보다 커야 합니다.`);
  if (!isNonNegativeNumber(job.oneWayCommuteMinutes)) errors.push(`${label} 출퇴근 시간은 0 이상이어야 합니다.`);
  if (!isNonNegativeNumber(job.officeDaysPerWeek) || job.officeDaysPerWeek > 7) {
    errors.push(`${label} 주당 출근일은 0일부터 7일 사이여야 합니다.`);
  }
  if (!isNonNegativeNumber(job.remoteDaysPerWeek) || job.remoteDaysPerWeek > 7) {
    errors.push(`${label} 주당 재택일은 0일부터 7일 사이여야 합니다.`);
  }
  return errors;
}

function validateAssumptions(assumptions: ComparisonAssumptions): string[] {
  const errors: string[] = [];
  if (!isPositiveNumber(assumptions.workWeeksPerYear)) errors.push("연간 근무주는 0보다 커야 합니다.");
  if (!isPositiveNumber(assumptions.workDaysPerMonth)) errors.push("월 평균 근무일은 0보다 커야 합니다.");
  if (!isNonNegativeNumber(assumptions.commuteStressMultiplier)) {
    errors.push("출퇴근 시간 가중치는 0 이상이어야 합니다.");
  }
  if (!isNonNegativeNumber(assumptions.riskBufferRate)) errors.push("리스크 버퍼는 0% 이상이어야 합니다.");
  if (assumptions.hourlyValueMode === "custom" && !isPositiveNumber(assumptions.customHourlyValue ?? 0)) {
    errors.push("직접 입력 시간가치는 0보다 커야 합니다.");
  }
  return errors;
}

function JobFields({
  title,
  value,
  onChange,
}: {
  title: string;
  value: WorkCondition;
  onChange: (next: WorkCondition) => void;
}) {
  const setField = (field: keyof WorkCondition, nextValue: string) => {
    onChange({
      ...value,
      [field]: field === "companyName" ? nextValue : Number(nextValue),
    });
  };

  return (
    <details className="grid gap-4 rounded-md bg-white p-5 shadow-panel" open>
      <summary className="cursor-pointer text-lg font-bold text-ink">{title}</summary>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="회사명 또는 별칭" value={value.companyName} onChange={(event) => setField("companyName", event.target.value)} />
        <Field label="연봉" type="number" unit="원" hint="세전 연봉 기준" value={value.annualSalary} onChange={(event) => setField("annualSalary", event.target.value)} />
        <Field label="월 실수령액" type="number" unit="원" hint="모르면 0으로 두면 연봉/12를 사용합니다." value={value.monthlyNetIncome ?? 0} onChange={(event) => setField("monthlyNetIncome", event.target.value)} />
        <Field label="연간 상여/성과급" type="number" unit="원" value={value.annualBonus ?? 0} onChange={(event) => setField("annualBonus", event.target.value)} />
        <Field label="월 식대/복지" type="number" unit="원/월" value={value.monthlyBenefit ?? 0} onChange={(event) => setField("monthlyBenefit", event.target.value)} />
        <Field label="월 교통비" type="number" unit="원/월" value={value.monthlyTransportCost ?? 0} onChange={(event) => setField("monthlyTransportCost", event.target.value)} />
        <Field label="출퇴근 편도 시간" type="number" unit="분" value={value.oneWayCommuteMinutes} onChange={(event) => setField("oneWayCommuteMinutes", event.target.value)} />
        <Field label="주당 출근일" type="number" unit="일/주" value={value.officeDaysPerWeek} onChange={(event) => setField("officeDaysPerWeek", event.target.value)} />
        <Field label="주당 재택일" type="number" unit="일/주" value={value.remoteDaysPerWeek} onChange={(event) => setField("remoteDaysPerWeek", event.target.value)} />
        <Field label="주당 평균 야근 시간" type="number" unit="시간/주" value={value.overtimeHoursPerWeek ?? 0} onChange={(event) => setField("overtimeHoursPerWeek", event.target.value)} />
        <Field label="남은/사용 가능 연차" type="number" unit="일" value={value.annualLeaveDays ?? 0} onChange={(event) => setField("annualLeaveDays", event.target.value)} />
        <Field label="만족도/리스크 점수" type="number" unit="0-10" value={value.satisfactionScore ?? 0} onChange={(event) => setField("satisfactionScore", event.target.value)} />
      </div>
    </details>
  );
}

function AssumptionFields({
  value,
  onChange,
}: {
  value: ComparisonAssumptions;
  onChange: (next: ComparisonAssumptions) => void;
}) {
  const setNumberField = (field: keyof ComparisonAssumptions, nextValue: string) => {
    onChange({ ...value, [field]: Number(nextValue) });
  };

  return (
    <details className="grid gap-4 rounded-md bg-white p-5 shadow-panel" open>
      <summary className="cursor-pointer text-lg font-bold text-ink">계산 가정값</summary>
      <div className="mt-3">
        <p className="mt-1 text-sm text-slate-600">
          결과가 민감하게 달라지는 기준입니다. 회사 비교 전에 본인의 기준으로 조정하세요.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="연간 근무주"
          type="number"
          unit="주"
          value={value.workWeeksPerYear}
          onChange={(event) => setNumberField("workWeeksPerYear", event.target.value)}
        />
        <Field
          label="월 평균 근무일"
          type="number"
          unit="일"
          value={value.workDaysPerMonth}
          onChange={(event) => setNumberField("workDaysPerMonth", event.target.value)}
        />
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          <span>시간가치 방식</span>
          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-ink outline-none focus:border-sea focus:ring-2 focus:ring-cyan-100"
            value={value.hourlyValueMode}
            onChange={(event) =>
              onChange({
                ...value,
                hourlyValueMode: event.target.value as ComparisonAssumptions["hourlyValueMode"],
              })
            }
          >
            <option value="salary_based">현재 연봉 기준</option>
            <option value="custom">직접 입력</option>
          </select>
        </label>
        {value.hourlyValueMode === "custom" && (
          <Field
            label="직접 입력 시간가치"
            type="number"
            unit="원/시간"
            value={value.customHourlyValue ?? 0}
            onChange={(event) => setNumberField("customHourlyValue", event.target.value)}
          />
        )}
        <Field
          label="출퇴근 시간 가중치"
          type="number"
          step="0.1"
          hint="1이면 시간가치를 그대로 반영합니다."
          value={value.commuteStressMultiplier}
          onChange={(event) => setNumberField("commuteStressMultiplier", event.target.value)}
        />
        <Field
          label="재택근무 1일 가치"
          type="number"
          unit="원/일"
          value={value.remoteWorkValuePerDay ?? 0}
          onChange={(event) => setNumberField("remoteWorkValuePerDay", event.target.value)}
        />
        <Field
          label="리스크 버퍼(%)"
          type="number"
          step="1"
          unit="%"
          value={Math.round(value.riskBufferRate * 100)}
          onChange={(event) => onChange({ ...value, riskBufferRate: Number(event.target.value) / 100 })}
        />
      </div>
    </details>
  );
}

export function JobComparisonPage({ scenario, onSave }: JobComparisonPageProps) {
  const previousInput = scenario && isJobComparisonInput(scenario.input) ? scenario.input : undefined;
  const [scenarioTitle, setScenarioTitle] = useState(
    previousInput?.title ?? `${defaultCurrentJob.companyName} vs ${defaultTargetJob.companyName}`,
  );
  const [currentJob, setCurrentJob] = useState(previousInput?.currentJob ?? defaultCurrentJob);
  const [targetJob, setTargetJob] = useState(previousInput?.targetJob ?? defaultTargetJob);
  const [assumptions, setAssumptions] = useState(previousInput?.assumptions ?? defaultAssumptions);
  const [shareMessage, setShareMessage] = useState<string | undefined>();
  const input = useMemo(
    () => createInput(scenarioTitle, currentJob, targetJob, assumptions, previousInput),
    [assumptions, currentJob, previousInput, scenarioTitle, targetJob],
  );
  const result = useMemo(() => calculateJobComparison(input), [input]);
  const shareTitle = `${targetJob.companyName} 이직 비교 결과`;
  const shareText = useMemo(() => buildShareText(shareTitle, result.summary), [result.summary, shareTitle]);
  const validationErrors = useMemo(
    () => [
      ...validateJob(currentJob, "현재 직장"),
      ...validateJob(targetJob, "후보 직장"),
      ...validateAssumptions(assumptions),
    ],
    [assumptions, currentJob, targetJob],
  );
  const maxBar = Math.max(
    Math.abs(result.annualCashDifference),
    Math.abs(result.estimatedTimeValueDifference),
    Math.abs(result.estimatedNetAnnualGain),
  );

  const saveScenario = () => {
    if (validationErrors.length > 0) return;

    onSave({
      id: input.id,
      type: "job_comparison",
      title: input.title,
      input,
      createdAt: input.createdAt,
      updatedAt: new Date().toISOString(),
    });
  };

  const printResult = () => {
    window.print();
  };

  const shareSummary = async () => {
    const outcome = await shareResult(shareTitle, result.summary);
    setShareMessage(outcome === "shared" ? "공유 창을 열었습니다." : "요약 문구를 클립보드에 복사했습니다.");
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <JobFields title="현재 직장" value={currentJob} onChange={setCurrentJob} />
        <JobFields title="후보 직장" value={targetJob} onChange={setTargetJob} />
      </div>

      <AssumptionFields value={assumptions} onChange={setAssumptions} />

      <section className="grid gap-5 rounded-md bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">비교 결과 요약</h2>
            <p className="text-sm text-slate-600">
              {previousInput ? "저장된 비교를 수정 중입니다." : "캡처해서 공유하기 좋은 핵심 결과입니다."}
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
          <h3 className="mt-1 text-xl font-bold text-ink">{targetJob.companyName} 이직 비교 결과</h3>
          <div className="mt-3 grid gap-2 text-base leading-7 text-ink">
            {result.summary.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <details className="rounded-md border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-bold text-ink">공유 문구 미리보기</summary>
          <textarea
            className="mt-4 min-h-44 w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-ink"
            readOnly
            value={shareText}
          />
        </details>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border border-cyan-100 bg-white p-4">
            <p className="text-sm text-slate-600">실질 연간 이득/손실</p>
            <p className="mt-1 text-3xl font-bold text-sea">{formatKrw(result.estimatedNetAnnualGain)}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">실질 월간 이득/손실</p>
            <p className="mt-1 text-2xl font-bold text-ink">{formatKrw(result.estimatedNetMonthlyGain)}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">최소 협상 목표 연봉</p>
            <p className="mt-1 text-2xl font-bold text-ink">{formatManWon(result.recommendedNegotiationSalary)}</p>
          </div>
        </div>

        <div className="grid gap-3">
          <DeltaBar label="연간 현금성 보상 차이" value={result.annualCashDifference} max={maxBar} />
          <DeltaBar label="시간가치 반영액" value={result.estimatedTimeValueDifference} max={maxBar} />
          <DeltaBar label="최종 실질 결과" value={result.estimatedNetAnnualGain} max={maxBar} />
        </div>

        <details className="rounded-md border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-bold text-ink">세부 계산 보기</summary>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-slate-500">연봉 차이</dt>
              <dd className="font-semibold text-ink">{formatKrw(result.annualSalaryDifference)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">연간 현금성 보상 차이</dt>
              <dd className="font-semibold text-ink">{formatKrw(result.annualCashDifference)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">월 기준 차이</dt>
              <dd className="font-semibold text-ink">{formatKrw(result.monthlyCashDifference)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">출퇴근 시간 변화</dt>
              <dd className="font-semibold text-ink">
                {Math.round(result.annualCommuteTimeDifferenceHours).toLocaleString("ko-KR")}시간/년
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">야근 시간 변화</dt>
              <dd className="font-semibold text-ink">
                {Math.round(result.annualOvertimeDifferenceHours).toLocaleString("ko-KR")}시간/년
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">시간가치 반영액</dt>
              <dd className="font-semibold text-ink">{formatKrw(result.estimatedTimeValueDifference)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">재택근무 가치 차이</dt>
              <dd className="font-semibold text-ink">{formatKrw(result.estimatedRemoteWorkValueDifference)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">교통비 차이</dt>
              <dd className="font-semibold text-ink">{formatKrw(result.annualCommuteCostDifference)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">리스크 버퍼</dt>
              <dd className="font-semibold text-ink">{formatKrw(result.estimatedRiskBuffer)}</dd>
            </div>
          </dl>
        </details>

        <Disclaimer />
      </section>
    </div>
  );
}
