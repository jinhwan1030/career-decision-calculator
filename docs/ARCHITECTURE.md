# Architecture

## 구조

```txt
src/
  app/
  components/
  features/
  lib/
    calculations/
    date/
    money/
    storage/
    validation/
  types/
  data/
  styles/
docs/
```

## 원칙

- UI는 입력과 표시를 담당한다.
- 계산식은 `src/lib/calculations`에 둔다.
- 타입은 `src/types`에 둔다.
- localStorage 접근은 `src/lib/storage`에 둔다.
- 날짜 유틸은 `src/lib/date`, 금액 포맷은 `src/lib/money`에 둔다.

## 로컬 우선

앱 데이터는 브라우저 localStorage에만 저장한다. 서버 API, 로그인, 클라우드 동기화는 없다.

## PWA 준비

`public/manifest.webmanifest`와 `public/service-worker.js`를 둔다. 서비스 워커는 프로덕션 빌드에서만 등록하며, 앱 셸의 기본 파일만 캐시한다.

## 공유

결과 공유는 `src/lib/share`의 브라우저 기본 기능만 사용한다. `navigator.share`가 있으면 네이티브 공유를 열고, 없으면 클립보드에 요약 문구를 복사한다. 외부 API나 분석 SDK는 사용하지 않는다.

## 저장 실패 처리

localStorage 쓰기 실패는 앱 레벨에서 잡아 사용자에게 안내 메시지로 표시한다. 저장 공간 부족, 시크릿 모드, 브라우저 정책 차이를 고려한다.

## 데이터 마이그레이션

저장 데이터는 `version` 필드를 가진다. 현재 버전은 `1`이며, `loadAppData`와 import 과정에서 누락된 설정과 시나리오 제목을 보정한다.

## 테스트

계산 로직과 저장소 유틸은 Vitest로 검증한다. 저장소 테스트는 브라우저 localStorage를 메모리 목으로 대체해 실행한다.
