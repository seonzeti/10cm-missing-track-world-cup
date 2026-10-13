# 03. 토너먼트 기능 구현 지침

> 쉽게 말해: 후보 목록을 정리하고, "누가 누구와 붙고 누가 올라가는지"를 계산하는 단계입니다.

---

## 1. 구현 범위

- `api/_lib/candidates-data.js` — 후보 데이터 원본 작성
- `api/candidates.js` — 후보 목록 API
- `public/js/tournament.js` — 토너먼트 계산 함수 (화면 코드와 분리된 **순수 함수**)
- `public/images/candidates/` — 후보 이미지 배치

---

## 2. 후보 데이터

### 2-1. 작성 절차

**It is critical that you follow these steps one by one.**

1. 사용자가 제공한 후보 사진 자료(이미지 파일 또는 목록 사진)를 처음부터 끝까지 천천히 확인합니다.
2. 사진에 적힌 **곡 제목을 한 글자도 바꾸지 않고** 그대로 옮겨 적습니다. (띄어쓰기, 물음표, 영문 대소문자 포함)
3. 무대 설명이 사진에 있으면 그대로 사용하고, 없으면 `description`을 빈 문자열 `""`로 둡니다.
4. 후보마다 `id`를 `s01`, `s02` … 순서로 붙입니다.
5. 이미지 파일을 `public/images/candidates/{id}.jpg` 이름으로 저장합니다.
6. 사진 자료가 없거나 글자가 읽히지 않으면 **작업을 멈추고 사용자에게 질문**합니다.

### 2-2. 데이터 형식 (`api/_lib/candidates-data.js`)

```js
export const CANDIDATES = [
  {
    id: 's01',                                  // 고유값, 변경 금지
    title: '봄이 좋냐??',                        // 사진 속 곡 제목 그대로
    description: '관객 떼창이 터진 앙코르 무대',   // 짧은 무대 설명 (40자 이내)
    image: '/images/candidates/s01.jpg'
  },
  // ... 사진 자료 기준으로 계속
];
```

> 위 항목은 **형식 예시**입니다. 실제 내용은 반드시 사용자 사진 자료로 교체합니다.

### 2-3. 데이터 규칙

| 항목 | 규칙 |
|---|---|
| 후보 수 | 최소 8개. 권장 16개 또는 32개 |
| `id` | `s` + 두 자리 숫자. 한 번 정하면 바꾸지 않음 (DB에 저장되는 값) |
| `title` | 필수, 사진 기준 원문 |
| `description` | 40자 이내, 가사 인용 금지 |
| `image` | `/images/candidates/{id}.jpg`, 권장 비율 3:4 |

후보가 2의 거듭제곱이 아니어도 됩니다 (예: 20개). 이때는 선택한 강 수만큼 **무작위로 뽑아서** 진행합니다.

---

## 3. 후보 목록 API

**`GET /api/candidates`**

응답 (200):

```json
{
  "candidates": [
    { "id": "s01", "title": "봄이 좋냐??", "description": "...", "image": "/images/candidates/s01.jpg" }
  ]
}
```

- 오류 시 500과 `{ "error": "후보 목록을 불러오지 못했어요." }`
- 응답 헤더: `Cache-Control: public, max-age=300`

---

## 4. 토너먼트 상태 (State)

토너먼트 진행 정보는 아래 객체 하나로 관리합니다.

```js
{
  playId: 'uuid',          // crypto.randomUUID()로 시작 시 1회 생성
  roundSize: 16,           // 처음 고른 강 수
  current: ['s03', ...],   // 이번 라운드에 남아있는 후보 id (순서 = 대진)
  next: ['s07', ...],      // 이번 라운드 승자들 (다음 라운드 후보)
  matchIndex: 0,           // 이번 라운드에서 몇 번째 매치인지 (0부터)
  matches: [               // 지금까지의 모든 선택 기록
    { round: 16, winnerId: 's07', loserId: 's03' }
  ],
  championId: null         // 결승이 끝나면 채워짐
}
```

`matches[].round`는 **그 매치가 열린 라운드의 인원 수**입니다 (16강=16, 준결승=4, 결승=2).

---

## 5. 함수 명세 (`public/js/tournament.js`)

모든 함수는 화면(DOM)을 건드리지 않고, 입력을 받아 결과만 돌려줍니다. 기존 상태를 직접 바꾸지 말고 **새 객체를 반환**합니다.

| 함수 | 입력 | 반환 |
|---|---|---|
| `getAvailableRoundSizes(count)` | 후보 수 | 4 이상, count 이하의 2의 거듭제곱 배열 (작은 순) |
| `shuffle(array)` | 배열 | 섞인 **새 배열** (Fisher–Yates) |
| `createTournament(candidateIds, roundSize)` | id 배열, 강 수 | 초기 State |
| `getCurrentPair(state)` | State | `[leftId, rightId]` |
| `selectWinner(state, winnerId)` | State, 고른 id | 다음 State |
| `getProgress(state)` | State | `{ roundLabel, current, total, done, totalMatches }` |
| `isFinished(state)` | State | `championId !== null` |

### 5-1. 동작 예시 (few-shot)

```js
getAvailableRoundSizes(16) // → [4, 8, 16]
getAvailableRoundSizes(20) // → [4, 8, 16]
getAvailableRoundSizes(32) // → [4, 8, 16, 32]
getAvailableRoundSizes(6)  // → [4]
```

```js
// 8강, 3번째 매치 진행 중
getProgress(state)
// → { roundLabel: '8강', current: 3, total: 4, done: 2, totalMatches: 7 }

// 결승
// → { roundLabel: '결승', current: 1, total: 1, done: 6, totalMatches: 7 }
```

### 5-2. `selectWinner` 처리 순서

1. `winnerId`가 현재 매치 두 후보 중 하나인지 확인합니다. 아니면 상태를 그대로 반환합니다.
2. `matches`에 `{ round: current.length, winnerId, loserId }`를 추가합니다.
3. `next`에 `winnerId`를 추가하고 `matchIndex`를 1 올립니다.
4. 이번 라운드 매치가 모두 끝났는지 확인합니다 (`matchIndex * 2 === current.length`).
5. 끝났고 `next.length === 1`이면 `championId = next[0]`으로 설정합니다.
6. 끝났고 `next.length > 1`이면 `current = next`, `next = []`, `matchIndex = 0`으로 다음 라운드를 시작합니다. (다음 라운드는 **다시 섞지 않고** 승자 순서대로 대진)

### 5-3. 불변 규칙 (검증용)

- 전체 매치 수 = `roundSize - 1` (16강 → 15번)
- 한 후보는 한 라운드에 한 번만 등장
- 플레이 종료 시 `matches.length === roundSize - 1`

---

## 6. 범위 예시 (few-shot)

**Acceptable**
- 강 수가 후보 수보다 작을 때 무작위로 후보 추출
- 테스트용 `console.assert` 코드 추가 (배포 전 제거)

**Unacceptable → 질문으로 대체**
- 부전승(Bye) 규칙 추가
- 사용자가 후보를 직접 추가/삭제하는 기능
- 사진 자료에 없는 곡을 후보로 추가

---

## 7. 완료 기준

- [ ] 후보 데이터가 사진 자료와 1:1로 일치 (제목 원문 그대로)
- [ ] 모든 후보 이미지가 경로대로 존재
- [ ] 5번 항목 함수 7개가 명세대로 동작
- [ ] `/api/candidates`가 명세 형식으로 응답

## 8. 검증 기준

1. 브라우저 주소창에 `/api/candidates` 입력 → JSON에 후보 전체가 보인다.
2. 4강·8강·16강 각각 완주 → 매치 수가 3·7·15회다.
3. 같은 강으로 두 번 시작 → 첫 대진 순서가 서로 다르다 (무작위 확인).
4. 개발자 도구 Network 탭에서 이미지 404 오류가 0개다.
