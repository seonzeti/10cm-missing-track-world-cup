# 05. AI 기능 구현 지침 (OpenAI)

> 쉽게 말해: 우승 무대가 정해지면 AI가 **짧은 한마디**(예: "설렘 가득한 선택이네요!")를 만들어 결과 화면에 보여주는 단계입니다.  
> AI는 **부가 기능**입니다. AI가 실패해도 결과 화면과 저장은 항상 정상 동작해야 합니다.

---

## 1. 구현 범위

- `api/ai-comment.js` — AI 한마디 API (1개)
- 결과 화면 `result-ai-comment`에 표시 (docs/02)

AI 기능은 이 1개만 만듭니다.

---

## 2. API 명세

**`POST /api/ai-comment`**

요청:

```json
{ "candidateId": "s05" }
```

응답 (**항상 200**):

```json
{ "comment": "봄바람처럼 설레는 선택! 오늘의 최애 무대로 손색없어요.", "source": "ai" }
```

| `source` 값 | 의미 |
|---|---|
| `ai` | OpenAI가 만든 문구 |
| `fallback` | 실패·미설정 시 미리 정한 문구 |

잘못된 `candidateId`만 400 `{ "error": "알 수 없는 후보예요." }`로 응답합니다.

---

## 3. 처리 순서

1. `candidateId`로 `CANDIDATES`에서 후보를 찾습니다. (브라우저가 보낸 제목·설명은 사용하지 않습니다.)
2. `OPENAI_API_KEY` 또는 `OPENAI_MODEL`이 비어 있으면 바로 fallback을 반환합니다.
3. 아래 프롬프트로 OpenAI를 호출합니다. 제한 시간은 **8초**입니다.
4. 응답 문구를 다듬습니다: 앞뒤 공백·따옴표 제거, **80자 초과 시 80자로 자르기**.
5. 결과가 비어 있으면 fallback을 반환합니다.
6. 어떤 오류든 `console.error`로 기록하고 fallback을 반환합니다.

### 3-1. 호출 코드 형태

```js
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 8000, maxRetries: 0 });

const completion = await client.chat.completions.create({
  model: process.env.OPENAI_MODEL,
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `곡 제목: ${candidate.title}\n무대 설명: ${candidate.description || '없음'}` }
  ],
  max_tokens: 120
});
const text = completion.choices[0]?.message?.content ?? '';
```

> 모델 이름은 코드에 직접 쓰지 않고 `OPENAI_MODEL` 환경변수에서만 읽습니다.

---

## 4. 시스템 프롬프트 (그대로 사용)

```
당신은 10CM 팬콘서트 무대 월드컵의 다정한 진행자입니다.
사용자가 최애 무대로 고른 곡에 대해 한국어로 한마디를 남깁니다.

규칙:
1. 한 문장 또는 두 문장, 전체 80자 이내로 작성합니다.
2. 곡 제목과 무대 설명에 담긴 분위기만 활용합니다.
3. 따뜻하고 밝은 존댓말을 사용합니다.
4. 노래 가사는 인용하지 않고, 자신의 표현으로 작성합니다.
5. 사실 정보(발매 연도, 순위, 수상 등)는 언급하지 않습니다.
6. 이모지는 최대 1개까지 사용합니다.
```

### 4-1. 출력 예시 (few-shot)

**Good**
- "봄바람처럼 설레는 선택! 오늘의 최애 무대로 손색없어요 🌸"
- "잔잔하게 마음을 두드리는 무대를 고르셨네요. 감성 만점이에요."

**Bad (이렇게 나오면 안 되는 이유)**
- 가사 구절을 따옴표로 인용 → 가사 사용 금지
- "2014년 발매된 이 곡은…" → 확인되지 않은 사실 정보
- 3문장 이상, 100자 이상 → 길이 초과

---

## 5. Fallback 문구

아래 3개 중 하나를 무작위로 사용합니다. `{title}`은 곡 제목으로 바꿉니다.

```js
const FALLBACKS = [
  '{title}, 정말 멋진 선택이에요!',
  '오늘의 최애 무대는 {title}! 탁월한 안목이네요.',
  '{title} 무대를 고르셨군요. 다음 팬콘도 기대돼요!'
];
```

---

## 6. 범위 예시 (few-shot)

**Acceptable**
- 프롬프트 문구의 띄어쓰기·맞춤법 교정
- 타임아웃 처리 코드 정리

**Unacceptable → 질문으로 대체**
- 이미지 생성, 음성 등 다른 AI 기능 추가
- 사용자가 자유 입력한 문장을 AI에 전달
- 브라우저에서 OpenAI를 직접 호출

---

## 7. 완료 기준

- [ ] 결과 화면에 AI 한마디가 표시됨
- [ ] 키가 없거나 오류가 나도 fallback 문구가 표시됨
- [ ] 응답이 항상 80자 이내
- [ ] AI 응답을 기다리는 동안에도 저장과 화면 조작이 가능

## 8. 검증 기준

1. 정상 환경에서 완주 → `source: "ai"` 문구가 3초 안팎으로 표시된다.
2. `OPENAI_API_KEY`를 일부러 틀린 값으로 바꾸고 완주 → `source: "fallback"` 문구가 표시되고, 결과 저장은 성공한다.
3. 10회 완주 → 모든 문구가 80자 이내이고 가사 인용이 없다.
