// api/ranking.js
import { CANDIDATES } from './_lib/candidates-data.js';
import { getSupabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: '허용되지 않은 요청이에요.' });
  }

  try {
    const supabase = getSupabase();

    // 1. 전체 플레이 수 조회
    const { count: totalPlaysCount, error: countError } = await supabase
      .from('plays')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('plays count 조회 에러:', countError);
      return res.status(500).json({ error: '순위를 불러오지 못했어요.' });
    }

    const totalPlays = totalPlaysCount || 0;

    // 2. candidate_stats 뷰 조회
    const { data: statsData, error: statsError } = await supabase
      .from('candidate_stats')
      .select('*');

    if (statsError) {
      console.error('candidate_stats 조회 에러:', statsError);
      return res.status(500).json({ error: '순위를 불러오지 못했어요.' });
    }

    const statsMap = new Map();
    (statsData || []).forEach((row) => {
      statsMap.set(row.candidate_id, row);
    });

    // 3 & 4. CANDIDATES 전체 기준으로 통계 병합 및 비율 계산
    const rankedItems = CANDIDATES.map((candidate) => {
      const stats = statsMap.get(candidate.id) || {};
      const championCount = Number(stats.champion_count) || 0;
      const wins = Number(stats.wins) || 0;
      const losses = Number(stats.losses) || 0;
      const totalMatches = wins + losses;

      const championRate = totalPlays > 0
        ? Math.round((championCount / totalPlays) * 1000) / 10
        : 0;

      const winRate = totalMatches > 0
        ? Math.round((wins / totalMatches) * 1000) / 10
        : 0;

      return {
        candidateId: candidate.id,
        title: candidate.title,
        image: candidate.image,
        championCount,
        championRate,
        wins,
        losses,
        winRate
      };
    });

    // 5. 정렬: 우승 횟수 ↓ → 승률 ↓ → 곡 제목 가나다순 ↑
    rankedItems.sort((a, b) => {
      if (b.championCount !== a.championCount) {
        return b.championCount - a.championCount;
      }
      if (b.winRate !== a.winRate) {
        return b.winRate - a.winRate;
      }
      return a.title.localeCompare(b.title, 'ko');
    });

    // 6. 1부터 rank 부여
    const items = rankedItems.map((item, index) => ({
      rank: index + 1,
      ...item
    }));

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      totalPlays,
      items
    });
  } catch (error) {
    console.error('순위 집계 예외:', error);
    return res.status(500).json({ error: '순위를 불러오지 못했어요.' });
  }
}
