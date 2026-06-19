# AGENTS.md

이 프로젝트는 **Career Decision Calculator / 이직 손익계산기**다. Codex는 로컬 우선 React + TypeScript 웹앱을 작고 안정적으로 발전시킨다.

## 작업 원칙

- 모든 UI 문구는 한국어로 작성한다.
- 코드, 변수명, 타입명, 파일명은 영어로 작성한다.
- 계산식은 `src/lib/calculations` 아래에 둔다.
- UI 컴포넌트가 계산식을 직접 가지지 않게 한다.
- 금액 포맷은 `src/lib/money`, 날짜 유틸은 `src/lib/date`, 저장소 로직은 `src/lib/storage`에 둔다.
- 서버, 로그인, AI API, 결제, 분석 SDK, 외부 캘린더 연동, 채용사이트 크롤링을 구현하지 않는다.
- localStorage 외부로 개인 데이터를 전송하지 않는다.
- 기능 변경 시 `docs/TASKS.md`를 갱신한다.
- 계산식 또는 한계를 바꾸면 `docs/CALCULATION_RULES.md`를 갱신한다.
- 제품/기술 결정은 `docs/DECISIONS.md`에 기록한다.

## MVP 범위

- 이직 손익계산기
- 퇴사일 계산기
- 시나리오 저장, 수정, 삭제, 불러오기
- JSON export/import 가능 구조
- 캡처 가능한 결과 요약 카드

## 주의 문구

결과 화면에는 항상 다음 성격의 안내를 포함한다.

- 본 결과는 개인 의사결정을 돕기 위한 참고용 계산입니다.
- 세금, 퇴직금, 연차수당, 실업급여 등은 개인 상황과 회사 기준에 따라 달라질 수 있습니다.
- 법률, 세무, 노무 자문이 아닙니다.
