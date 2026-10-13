# AGENTS.md — 작업 규칙

이 문서는 AI 코딩 에이전트(Antigravity)가 **모든 작업에서 항상 지켜야 하는 규칙**입니다.  
작업을 시작하기 전에 이 문서를 처음부터 끝까지 천천히 읽으세요.

---

## 1. 프로젝트 한 줄 요약

**10CM 팬콘 무대 월드컵**: 사용자가 10CM 팬콘서트 무대 후보 중 1:1로 하나씩 골라 최애 무대를 뽑는 이상형 월드컵 웹앱입니다. 모든 사용자의 결과는 Supabase에 저장되어 **누적 순위**로 보여집니다.

---

## 2. 문서 읽는 순서

작업 전, 아래 순서대로 **전체 내용을 빠짐없이** 읽으세요.

1. `AGENTS.md` (이 문서) — 작업 규칙
2. `PRD.md` — 무엇을 만드는지
3. `DESIGN.md` — 화면의 색상·폰트·간격 등 시각 규칙 (사용자가 별도로 제공)
4. `docs/01_project-setup.md` — 프로젝트 생성
5. `docs/02_ui-implementation.md` — 화면 구현
6. `docs/03_tournament-logic.md` — 토너먼트 기능
7. `docs/04_database-ranking.md` — DB와 누적 순위
8. `docs/05_ai-integration.md` — OpenAI 기능
9. `docs/06_deployment-qa.md` — Vercel 배포와 검증

---

## 3. 기술 스택 (고정)

아래 스택만 사용합니다. 다른 기술이 필요해 보이면 **먼저 사용자에게 질문**하세요.

| 영역 | 사용 기술 |
|---|---|
| Front-end | HTML, CSS, JavaScript (Vanilla, 프레임워크 없음) |
| Back-end | Node.js — Vercel Serverless Functions (`/api` 폴더) |
| AI | OpenAI API (공식 `openai` npm 패키지) |
| DB | Supabase (PostgreSQL, `@supabase/supabase-js`) |
| 배포 | Vercel |

허용되는 npm 패키지: `openai`, `@supabase/supabase-js`, (개발용) `vercel`.  
그 외 패키지가 필요하면 이유를 적고 사용자 승인을 받으세요.

---

## 4. 작업 방식 (Trigger / Instruction)

---
**Trigger:** 새 작업을 시작할 때  
**Instruction:** 관련 문서를 다시 읽고, 수정할 파일 목록과 순서를 먼저 적으세요.

---
**Trigger:** 문서에 정의되지 않은 결정이 필요할 때  
**Instruction:** 추측하지 말고 작업을 멈춘 뒤, 선택지 2~3개와 추천안을 사용자에게 질문하세요.

---
**Trigger:** 한 단계 구현을 마쳤을 때  
**Instruction:** 해당 문서의 **완료 기준**과 **검증 기준**을 하나씩 확인하고, 결과를 체크리스트로 보고하세요.

---
**Trigger:** 오류가 발생했을 때  
**Instruction:** 오류 메시지 원문, 원인, 수정 내용을 순서대로 보고하세요.

---

## 5. 반드시 지킬 규칙

**It is critical that you follow these rules.**

1. **비밀 키는 서버에서만 사용합니다.** `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`는 `/api` 폴더 코드에서만 `process.env`로 읽습니다.
2. **브라우저 코드(`public/`)는 오직 `/api/*` 주소만 호출합니다.** Supabase·OpenAI는 서버를 거쳐서만 사용합니다.
3. **환경변수 이름은 `docs/01_project-setup.md`에 적힌 이름 그대로** 사용합니다.
4. **파일·폴더 구조는 `docs/01_project-setup.md`의 구조 그대로** 만듭니다.
5. **시각 스타일 값(색상, 폰트, 크기, 간격)은 `DESIGN.md`에서 가져옵니다.** DESIGN.md에 없는 값이 필요하면 사용자에게 질문합니다.
6. **사용자에게 보이는 모든 문구는 한국어**로 작성합니다.
7. **코드는 작은 단위로 나누어** 작성하고, 함수마다 한 가지 일만 하도록 합니다.
8. **10CM 노래 가사는 화면·AI 응답 어디에도 넣지 않습니다.** 곡 제목과 무대 설명만 사용합니다.

---

## 6. 범위 판단 예시 (few-shot)

**Acceptable (해도 됨)**
- 문서에 적힌 API 응답 형식대로 구현
- 버튼에 로딩 상태 표시 추가 (02 문서에 명시됨)
- 변수명을 더 읽기 쉽게 정리

**Unacceptable (하지 않음 → 질문으로 대체)**
- React, Next.js 등 프레임워크 도입
- 로그인/회원가입 기능 추가
- 문서에 없는 새 화면이나 새 DB 테이블 추가
- 브라우저 코드에서 Supabase에 직접 접속

---

## 7. 최종 완료 정의

아래가 모두 충족되면 프로젝트 완료입니다.

- [ ] `PRD.md`의 모든 Must 기능이 동작
- [ ] `docs/06_deployment-qa.md`의 검증 체크리스트 전체 통과
- [ ] Vercel 배포 주소에서 월드컵 1회 완주 → 누적 순위에 반영 확인
