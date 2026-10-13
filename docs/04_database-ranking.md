# 04. DB와 누적 순위 구현 지침

> 쉽게 말해: 사람들이 뽑은 결과를 **Supabase(온라인 데이터베이스)**에 저장하고, 모두의 결과를 합쳐 **누적 순위**를 보여주는 단계입니다.

---

## 1. 구현 범위

- `supabase/schema.sql` — 테이블·뷰·함수 생성 SQL
- `api/_lib/supabase.js` — 서버용 Supabase 연결
- `api/results.js` — 결과 저장 API
- `api/ranking.js` — 누적 순위 API
- `public/js/api.js` — 위 API를 호출하는 함수

---

## 2. 데이터 구조

| 테이블 | 의미 | 1행 = |
|---|---|---|
| `plays` | 월드컵 완주 기록 | 플레이 1회 |
| `match_results` | 각 1:1 선택 기록 | 매치 1번 |

- **우승 횟수** = `plays`에서 `champion_id`가 그 후보인 행 수
- **승률** = 매치 승리 수 ÷ (승리 수 + 패배 수)
- **우승 비율** = 우승 횟수 ÷ 전체 플레이 수

후보 정보(제목·이미지)는 DB에 저장하지 않고 `api/_lib/candidates-data.js`에서 가져와 합칩니다.

---

## 3. `supabase/schema.sql` (그대로 사용)

```sql
-- 1) 플레이 기록
create table if not exists plays (
  id          uuid primary key,              -- 브라우저에서 만든 playId (중복 저장 방지)
  round_size  int  not null check (round_size in (4, 8, 16, 32, 64)),
  champion_id text not null,
  created_at  timestamptz not null default now()
);

-- 2) 매치 기록
create table if not exists match_results (
  id          bigint generated always as identity primary key,
  play_id     uuid not null references plays(id) on delete cascade,
  round_size  int  not null,
  winner_id   text not null,
  loser_id    text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_match_play on match_results(play_id);

-- 3) 보안: 외부(anon) 직접 접근 차단. 서버(service_role)만 사용
alter table plays enable row level security;
alter table match_results enable row level security;

-- 4) 후보별 통계 뷰
create or replace view candidate_stats as
with m as (
  select winner_id as candidate_id, 1 as win, 0 as loss from match_results
  union all
  select loser_id, 0, 1 from match_results
),
agg as (
  select candidate_id, sum(win)::int as wins, sum(loss)::int as losses
  from m group by candidate_id
),
ch as (
  select champion_id as candidate_id, count(*)::int as champion_count
  from plays group by champion_id
)
select
  coalesce(agg.candidate_id, ch.candidate_id) as candidate_id,
  coalesce(agg.wins, 0)            as wins,
  coalesce(agg.losses, 0)          as losses,
  coalesce(ch.champion_count, 0)   as champion_count
from agg
full outer join ch on agg.candidate_id = ch.candidate_id;

-- 5) 저장 함수: 플레이 + 매치를 한 번에 저장 (중간 실패 시 전부 취소)
create or replace function save_play(
  p_play_id uuid, p_round_size int, p_champion_id text, p_matches jsonb
) returns boolean
language plpgsql
as $$
begin
  insert into plays (id, round_size, champion_id)
  values (p_play_id, p_round_size, p_champion_id)
  on conflict (id) do nothing;

  if not found then
    return false;   -- 이미 저장된 playId → 중복
  end if;

  insert into match_results (play_id, round_size, winner_id, loser_id)
  select p_play_id, (m->>'round')::int, m->>'winnerId', m->>'loserId'
  from jsonb_array_elements(p_matches) as m;

  return true;
end;
$$;

revoke execute on function save_play(uuid, int, text, jsonb) from public, anon, authenticated;
grant  execute on function save_play(uuid, int, text, jsonb) to service_role;
revoke all on candidate_stats from anon, authenticated;
```

---

## 4. Supabase 연결 (`api/_lib/supabase.js`)

```js
import { createClient } from '@supabase/supabase-js';

export function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
}
```

---

## 5. 결과 저장 API

**`POST /api/results`**

요청 본문:

```json
{
  "playId": "8c1f...-uuid",
  "roundSize": 8,
  "championId": "s05",
  "matches": [
    { "round": 8, "winnerId": "s05", "loserId": "s02" }
  ]
}
```

### 5-1. 서버 검증 순서 (하나씩 차례대로)

1. `playId`가 UUID 형식인지 확인합니다.
2. `roundSize`가 4, 8, 16, 32, 64 중 하나이고 후보 수 이하인지 확인합니다.
3. `matches.length === roundSize - 1`인지 확인합니다.
4. 모든 `winnerId`, `loserId`, `championId`가 `CANDIDATES`에 있는 id인지 확인합니다.
5. 마지막 매치(`round === 2`)의 `winnerId === championId`인지 확인합니다.
6. 통과하면 `supabase.rpc('save_play', {...})`를 호출합니다.

### 5-2. 응답

| 상황 | 상태 코드 | 본문 |
|---|---|---|
| 새로 저장됨 | 201 | `{ "saved": true }` |
| 이미 저장된 playId | 200 | `{ "saved": false, "duplicate": true }` |
| 검증 실패 | 400 | `{ "error": "잘못된 결과 데이터예요." }` |
| 서버/DB 오류 | 500 | `{ "error": "결과를 저장하지 못했어요." }` |
| POST 외 요청 | 405 | `{ "error": "허용되지 않은 요청이에요." }` |

> 브라우저는 실패 시 **같은 playId로** 다시 시도합니다. 그래서 여러 번 눌러도 1번만 저장됩니다.

---

## 6. 누적 순위 API

**`GET /api/ranking`**

처리 순서:

1. `plays` 전체 행 수를 셉니다 → `totalPlays`.
2. `candidate_stats` 뷰를 조회합니다.
3. `CANDIDATES` 전체를 기준으로 통계를 합칩니다. 기록이 없는 후보는 모두 0으로 채웁니다.
4. 비율을 계산합니다 (분모가 0이면 0).
5. 아래 순서로 정렬합니다: **우승 횟수 ↓ → 승률 ↓ → 곡 제목 가나다순 ↑**
6. 1부터 `rank`를 붙입니다. (동점이어도 정렬 순서대로 번호 부여)

응답 (200):

```json
{
  "totalPlays": 50,
  "items": [
    {
      "rank": 1,
      "candidateId": "s05",
      "title": "봄이 좋냐??",
      "image": "/images/candidates/s05.jpg",
      "championCount": 12,
      "championRate": 24.0,
      "wins": 40,
      "losses": 16,
      "winRate": 71.4
    }
  ]
}
```

- 비율은 **소수점 첫째 자리까지 반올림한 숫자**(퍼센트 값)로 보냅니다.
- 응답 헤더: `Cache-Control: no-store` (항상 최신 순위)
- 오류 시 500과 `{ "error": "순위를 불러오지 못했어요." }`

### 6-1. 계산 예시 (few-shot)

| 후보 | 우승 | 승 | 패 | 전체 플레이 50 기준 |
|---|---|---|---|---|
| A | 12 | 40 | 16 | 우승 비율 24.0%, 승률 71.4% |
| B | 0 | 0 | 0 | 우승 비율 0.0%, 승률 0.0% |

---

## 7. 브라우저 호출 함수 (`public/js/api.js`)

| 함수 | 호출 |
|---|---|
| `fetchCandidates()` | `GET /api/candidates` |
| `saveResult(payload)` | `POST /api/results` |
| `fetchRanking()` | `GET /api/ranking` |
| `fetchAiComment(candidateId)` | `POST /api/ai-comment` (docs/05) |

각 함수는 실패 시 `Error`를 던지고, 화면 코드(`app.js`)가 오류 문구를 표시합니다.

---

## 8. 범위 예시 (few-shot)

**Acceptable**
- 검증 실패 원인을 서버 로그(`console.error`)에 기록
- `candidate_stats` 조회 시 필요한 열만 선택

**Unacceptable → 질문으로 대체**
- 브라우저에서 Supabase anon key로 직접 조회
- 사용자 IP, 기기 정보 등 개인정보 저장
- 테이블 추가 또는 열 이름 변경

---

## 9. 완료 기준

- [ ] `schema.sql`이 Supabase SQL Editor에서 오류 없이 실행됨
- [ ] 결과 저장 API가 5-2 표대로 응답
- [ ] 누적 순위 API가 6번 형식대로 응답
- [ ] 브라우저 코드에 Supabase 키가 없음

## 10. 검증 기준

1. 월드컵 1회 완주 → Supabase Table Editor의 `plays`에 1행, `match_results`에 `roundSize - 1`행이 추가된다.
2. 같은 본문으로 `/api/results`를 2번 보냄 → 두 번째 응답이 `duplicate: true`, 행 수는 그대로다.
3. `championId`를 존재하지 않는 값(`s99`)으로 보냄 → 400 응답.
4. 완주 전후 `/api/ranking`의 `totalPlays`가 정확히 1 증가한다.
5. 브라우저 개발자 도구 Sources에서 `SUPABASE`로 검색 → 키 값이 나오지 않는다.
