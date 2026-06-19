# Data Model

## MoneyAmount

```ts
type MoneyAmount = number;
```

단위는 원화 KRW다.

## WorkCondition

```ts
interface WorkCondition {
  companyName: string;
  annualSalary: number;
  monthlyNetIncome?: number;
  annualBonus?: number;
  monthlyBenefit?: number;
  monthlyTransportCost?: number;
  oneWayCommuteMinutes: number;
  officeDaysPerWeek: number;
  remoteDaysPerWeek: number;
  overtimeHoursPerWeek?: number;
  annualLeaveDays?: number;
  satisfactionScore?: number;
}
```

## Scenario

```ts
type ScenarioType = "job_comparison" | "resignation";
```

시나리오는 localStorage에 저장한다. 저장 포맷은 `AppData`로 감싼다.

## ResignationInput 추가 필드

```ts
type FinalSalaryProrationMode = "daily_wage" | "calendar_month";
```

퇴사월 월급 정산 참고액은 30일 기준 일급 또는 퇴사월 실제 달력일 기준 중 하나로 계산한다.

## AppData

```ts
interface AppData {
  version: string;
  scenarios: Scenario[];
  settings: AppSettings;
  exportedAt?: string;
}
```

현재 저장 데이터 버전은 `"1"`이다. 로드 시 버전과 설정 기본값을 보정하며, 시나리오 제목이 비어 있으면 입력 제목 또는 기본 제목으로 채운다.
