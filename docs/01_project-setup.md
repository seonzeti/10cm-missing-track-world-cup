# 01. 프로젝트 생성 지침

> 쉽게 말해: 프로젝트의 "뼈대(폴더와 기본 파일)"를 만드는 단계입니다.

## 1. 구현 범위

- 폴더 구조 생성
- `package.json`, `vercel.json`, `.env.example`, `.gitignore` 작성
- 로컬에서 실행 가능한 상태 만들기

---

## 2. 폴더 구조 (이 구조 그대로 생성)

```
10cm-worldcup/
├── AGENTS.md
├── PRD.md
├── DESIGN.md                  # 사용자가 제공
├── docs/                      # 구현 문서 6개
├── public/                    # 브라우저에 그대로 전달되는 파일
│   ├── index.html             # 화면 전체 (단일 페이지)
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js             # 화면 전환, 이벤트 연결
│   │   ├── tournament.js      # 토너먼트 계산 (순수 함수)
│   │   └── api.js             # /api 호출 함수 모음
│   └── images/
│       └── candidates/        # 후보 이미지 (예: s01.jpg)
├── api/                       # Node.js 서버 함수 (Vercel Serverless)
│   ├── candidates.js          # GET  후보 목록
│   ├── results.js             # POST 결과 저장
│   ├── ranking.js             # GET  누적 순위
│   ├── ai-comment.js          # POST AI 한마디
│   └── _lib/                  # 공용 코드 (밑줄 폴더는 API 주소가 되지 않음)
│       ├── candidates-data.js # 후보 데이터 원본
│       ├── supabase.js        # Supabase 클라이언트
│       └── http.js            # 응답 헬퍼
├── supabase/
│   └── schema.sql             # DB 생성 SQL (docs/04)
├── package.json
├── vercel.json
├── .env.example
└── .gitignore
```

---

## 3. 단계별 작업

1. 위 폴더 구조를 생성합니다.
2. `package.json`을 아래 내용으로 작성합니다.
3. `npm install`을 실행합니다.
4. `.env.example`, `.gitignore`, `vercel.json`을 작성합니다.
5. `public/index.html`에 "Hello 10CM" 문구만 넣어 로컬 실행을 확인합니다.

### package.json

```json
{
  "name": "10cm-worldcup",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "vercel dev"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2",
    "openai": "^4"
  },
  "devDependencies": {
    "vercel": "latest"
  }
}
```

> `openai` 패키지는 설치 시점의 최신 메이저 버전을 사용해도 됩니다. 버전을 바꾸면 보고하세요.

### .env.example (값은 비워둠)

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=
```

| 이름 | 설명 | 어디서 얻나 |
|---|---|---|
| `SUPABASE_URL` | Supabase 프로젝트 주소 | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 비밀 키 | 같은 화면의 service_role 키 |
| `OPENAI_API_KEY` | OpenAI 비밀 키 | platform.openai.com → API keys |
| `OPENAI_MODEL` | 사용할 모델 이름 | 사용자가 지정 (코드에 직접 쓰지 않음) |

### .gitignore

```
node_modules/
.env
.env.local
.vercel/
```

### vercel.json

```json
{
  "outputDirectory": "public",
  "cleanUrls": true
}
```

---

## 4. 제약 조건

- 빌드 도구(Webpack, Vite 등)를 쓰지 않습니다. `public/` 파일이 그대로 배포됩니다.
- 브라우저 JS는 `<script type="module">`로 불러오고 `import/export`를 사용합니다.
- 서버 함수는 아래 형태를 사용합니다.

```js
// api/example.js
export default async function handler(req, res) {
  res.status(200).json({ ok: true });
}
```

---

## 5. 완료 기준

- [ ] 폴더 구조가 2번 항목과 일치
- [ ] `npm install`이 오류 없이 끝남
- [ ] `.env`가 Git에 올라가지 않음 (`.gitignore` 포함 확인)

## 6. 검증 기준

1. `npm run dev` 실행 → `http://localhost:3000` 접속 → "Hello 10CM"이 보인다.
2. `git status`에 `.env`가 나타나지 않는다.
