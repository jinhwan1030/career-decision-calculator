# Career Decision Calculator

한국어 UI명: **이직 손익계산기**

직장인이 이직, 퇴사일, 연봉협상, 출퇴근 시간, 재택근무, 복지, 연차, 퇴직금 참고액을 숫자로 비교해 의사결정을 준비할 수 있도록 돕는 로컬 우선 웹앱/PWA입니다.

## MVP 범위

- 이직 손익계산기
- 퇴사일 계산기
- localStorage 기반 시나리오 저장
- 캡처 가능한 결과 요약 카드

## 원칙

- 서버, 로그인, AI API, 결제, 분석 SDK를 사용하지 않습니다.
- 개인정보를 외부로 전송하지 않습니다.
- 계산 로직은 UI와 분리합니다.
- 모든 결과는 참고용이며 법률, 세무, 노무 자문이 아닙니다.

## 실행

```bash
npm install
npm run dev
```

## 문서

- [PRD](docs/PRD.md)
- [Tasks](docs/TASKS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Decisions](docs/DECISIONS.md)
- [Calculation Rules](docs/CALCULATION_RULES.md)
- [Data Model](docs/DATA_MODEL.md)
- [Roadmap](docs/ROADMAP.md)
