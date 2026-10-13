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
