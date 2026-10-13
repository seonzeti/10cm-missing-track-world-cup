# 06. Vercel 배포와 검증 지침

> 쉽게 말해: 만든 웹앱을 **인터넷 주소로 공개**하고, 모든 기능이 제대로 동작하는지 **최종 점검**하는 단계입니다.  
> 이 문서의 1~3번은 **사용자가 직접 하는 작업**이 포함되어 있습니다. 에이전트는 사용자에게 단계별로 안내하고, 결과를 확인받은 뒤 다음 단계로 넘어갑니다.

---

## 1. Supabase 준비 (사용자 작업)

1. [supabase.com](https://supabase.com)에 로그인 → **New project** 생성 (Region: Northeast Asia (Seoul) 권장)
2. 왼쪽 메뉴 **SQL Editor** → `supabase/schema.sql` 내용 전체 붙여넣기 → **Run**
3. **Table Editor**에서 `plays`, `match_results` 테이블이 보이는지 확인
4. **Project Settings → API**에서 아래 2개 값을 복사해 둡니다.
   - Project URL → `SUPABASE_URL`
   - service_role 키 → `SUPABASE_SERVICE_ROLE_KEY` (**절대 공개 금지**)

## 2. OpenAI 준비 (사용자 작업)

1. [platform.openai.com](https://platform.openai.com) → **API keys** → 새 키 생성 → `OPENAI_API_KEY`
2. 사용할 모델 이름을 정해 `OPENAI_MODEL`에 적습니다. (모델 선택은 사용자가 결정)
3. 결제 수단·사용 한도를 설정합니다.

## 3. 로컬 실행 확인

1. 프로젝트 폴더에 `.env` 파일을 만들고 4개 값을 채웁니다 (`.env.example` 참고).
2. `npm run dev` 실행 → `http://localhost:3000` 접속
3. 아래 7번 체크리스트 중 **기능 항목**을 로컬에서 먼저 통과시킵니다.

## 4. GitHub 업로드 (사용자 작업, 에이전트가 명령어 안내)

1. GitHub에서 새 저장소(Repository)를 만듭니다.
2. 업로드 전 `git status`로 `.env`가 목록에 **없는지** 확인합니다.
3. 코드를 push합니다.

## 5. Vercel 배포 (사용자 작업)

1. [vercel.com](https://vercel.com) → **Add New → Project** → GitHub 저장소 선택 → **Import**
2. Framework Preset: **Other** / Build Command: 비워둠 / Output Directory: `public`
3. **Environment Variables**에 4개 값을 이름 그대로 입력합니다.

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | 1번에서 복사 |
   | `SUPABASE_SERVICE_ROLE_KEY` | 1번에서 복사 |
   | `OPENAI_API_KEY` | 2번에서 복사 |
   | `OPENAI_MODEL` | 2번에서 정한 이름 |

4. **Deploy** 클릭 → 완료 후 `https://프로젝트명.vercel.app` 주소 확인
5. 환경변수를 나중에 바꾸면 **Deployments → Redeploy**를 해야 반영됩니다.

> 이후에는 GitHub에 push할 때마다 자동으로 다시 배포됩니다.

---

## 6. 자주 생기는 문제

| 증상 | 원인 | 해결 |
|---|---|---|
| `/api/...`가 404 | `api` 폴더 위치가 틀림 | 프로젝트 최상위에 `api/` 있는지 확인 |
| 화면은 뜨는데 404 페이지 | Output Directory 설정 누락 | Vercel 설정에서 `public` 지정 |
| 저장 시 500 | 환경변수 누락·오타 | 이름 확인 후 Redeploy |
| `function save_play does not exist` | SQL 미실행 | 1-2단계 다시 실행 |
| AI 문구가 항상 같은 형식 | OpenAI 키·모델 오류로 fallback | Vercel **Logs**에서 오류 확인 |
| 이미지 깨짐 | 파일명 대소문자 불일치 | `s01.jpg` 소문자로 통일 |

---

## 7. 최종 검증 체크리스트

**Take your time and check every item carefully.** 배포 주소에서 하나씩 실행하고, 결과를 ✅/❌로 보고하세요.

### 기능

- [ ] 시작 화면에 후보 수에 맞는 강 버튼만 보인다
- [ ] 4강 완주 (매치 3회)
- [ ] 8강 완주 (매치 7회)
- [ ] 16강 완주 (매치 15회) — 후보가 16개 이상일 때
- [ ] 진행 표시가 "16강 1/8 → … → 결승 1/1" 순서로 바뀐다
- [ ] 결과 화면에 우승 무대와 AI 한마디가 보인다
- [ ] "결과가 저장되었어요!"가 표시된다
- [ ] 누적 순위의 총 플레이 수가 1 증가한다
- [ ] 새로고침 후에도 순위 데이터가 유지된다
- [ ] 다시하기 → 시작 화면으로 돌아가고 새 대진이 만들어진다

### 안정성

- [ ] 카드 연타 시 매치가 건너뛰어지지 않는다
- [ ] AI 실패 상황에서도 fallback 문구 + 저장 성공
- [ ] 저장 실패 → 다시 시도 → 1번만 저장된다

### 보안

- [ ] 브라우저 소스에 `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` 값이 없다
- [ ] GitHub 저장소에 `.env` 파일이 없다

### 화면

- [ ] 모바일(실제 휴대폰)에서 가로 스크롤 없음
- [ ] 데스크톱에서 카드가 좌우 배치
- [ ] 색상·폰트가 `DESIGN.md`와 일치
- [ ] 첫 화면이 3초 안에 표시

### 콘텐츠

- [ ] 후보 제목이 사진 자료와 글자 하나까지 일치
- [ ] 화면 어디에도 노래 가사가 없다

---

## 8. 완료 기준

- [ ] 배포 주소가 정상 접속됨
- [ ] 7번 체크리스트 전 항목 ✅
- [ ] 사용자에게 배포 주소와 체크리스트 결과를 보고함

## 9. 보고 형식 (few-shot)

```
배포 주소: https://10cm-worldcup.vercel.app

[기능] 10/10 ✅
[안정성] 3/3 ✅
[보안] 2/2 ✅
[화면] 3/4 — ❌ 첫 화면 4.2초 (원인: 이미지 용량 큼 → 이미지 압축 제안)
[콘텐츠] 2/2 ✅
```
