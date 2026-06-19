# Career Decision Calculator

한국어 UI명: **이직 손익계산기**

직장인이 이직, 퇴사일, 연봉협상, 출퇴근 시간, 재택근무, 복지, 연차, 퇴직금 참고액을 숫자로 비교해 의사결정을 준비할 수 있도록 돕는 로컬 우선 웹앱/PWA입니다.

## 스크린샷

릴리스용 스크린샷은 준비 중입니다. 캡처 후보는 [docs/assets/SCREENSHOTS.md](docs/assets/SCREENSHOTS.md)에 정리합니다.

## MVP 범위

- 이직 손익계산기
- 퇴사일 계산기
- localStorage 기반 시나리오 저장
- 캡처 가능한 결과 요약 카드
- 저장된 시나리오 검색, 필터, 정렬, 복제
- JSON 내보내기/가져오기
- 결과 인쇄와 공유 문구 복사
- PWA 준비 구조

## 원칙

- 서버, 로그인, AI API, 결제, 분석 SDK를 사용하지 않습니다.
- 유료 과금 요소와 결제 SDK가 없습니다.
- 개인정보를 외부로 전송하지 않습니다.
- 계산 로직은 UI와 분리합니다.
- 모든 결과는 참고용이며 법률, 세무, 노무 자문이 아닙니다.

## 현재 구현된 계산

- 연봉, 상여, 복지, 교통비를 반영한 현금성 보상 차이
- 출퇴근/야근 시간을 시간가치로 환산한 실질 차이
- 재택근무 가치와 리스크 버퍼
- 최소 협상 목표 연봉
- 예상 퇴사일까지의 근속기간과 남은 기간
- 연차수당, 월급 정산, 퇴직금 참고액

## 실행

```bash
npm install
npm run dev
```

## 배포

GitHub Pages 배포 workflow가 포함되어 있습니다. `main` 브랜치에 push하면 typecheck, test, build 후 Pages artifact를 배포합니다.

저장소 Settings에서 Pages source를 **GitHub Actions**로 설정하세요.

## 문서

- [PRD](docs/PRD.md)
- [Tasks](docs/TASKS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Decisions](docs/DECISIONS.md)
- [Calculation Rules](docs/CALCULATION_RULES.md)
- [Data Model](docs/DATA_MODEL.md)
- [Roadmap](docs/ROADMAP.md)
