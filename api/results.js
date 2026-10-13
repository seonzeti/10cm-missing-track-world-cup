// api/results.js
import { CANDIDATES } from './_lib/candidates-data.js';
import { getSupabase } from './_lib/supabase.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_ROUND_SIZES = [4, 8, 16, 32, 64];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: '허용되지 않은 요청이에요.' });
  }

  const { playId, roundSize, championId, matches } = req.body || {};

  // 1. playId UUID 형식 검증
  if (!playId || typeof playId !== 'string' || !UUID_REGEX.test(playId)) {
    return res.status(400).json({ error: '잘못된 결과 데이터예요.' });
  }

  // 2. roundSize 유효성 및 후보 수 이하인지 검증
  const roundNum = Number(roundSize);
  if (!VALID_ROUND_SIZES.includes(roundNum) || roundNum > CANDIDATES.length) {
    return res.status(400).json({ error: '잘못된 결과 데이터예요.' });
  }

  // 3. matches 배열 및 길이 검증 (roundSize - 1)
  if (!Array.isArray(matches) || matches.length !== roundNum - 1) {
    return res.status(400).json({ error: '잘못된 결과 데이터예요.' });
  }

  // 4. 모든 id가 CANDIDATES에 존재하는지 검증
  const candidateIdSet = new Set(CANDIDATES.map((c) => c.id));
  if (!candidateIdSet.has(championId)) {
    return res.status(400).json({ error: '잘못된 결과 데이터예요.' });
  }

  for (const match of matches) {
    if (
      !match ||
      !match.round ||
      !candidateIdSet.has(match.winnerId) ||
      !candidateIdSet.has(match.loserId) ||
      match.winnerId === match.loserId
    ) {
      return res.status(400).json({ error: '잘못된 결과 데이터예요.' });
    }
  }

  // 5. 결승 매치(round === 2)의 winnerId가 championId와 일치하는지 검증
  const finalMatch = matches[matches.length - 1];
  if (!finalMatch || Number(finalMatch.round) !== 2 || finalMatch.winnerId !== championId) {
    return res.status(400).json({ error: '잘못된 결과 데이터예요.' });
  }

  // 6. DB 저장 (save_play RPC 호출)
  try {
    const supabase = getSupabase();
    const { data: isSaved, error } = await supabase.rpc('save_play', {
      p_play_id: playId,
      p_round_size: roundNum,
      p_champion_id: championId,
      p_matches: matches
    });

    if (error) {
      console.error('Supabase save_play 에러:', error);
      return res.status(500).json({ error: '결과를 저장하지 못했어요.' });
    }

    if (isSaved) {
      return res.status(201).json({ saved: true });
    } else {
      // 이미 저장된 playId 중복
      return res.status(200).json({ saved: false, duplicate: true });
    }
  } catch (err) {
    console.error('결과 저장 처리 예외:', err);
    return res.status(500).json({ error: '결과를 저장하지 못했어요.' });
  }
}
