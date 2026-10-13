// api/candidates.js
import { CANDIDATES } from './_lib/candidates-data.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: '허용되지 않은 요청이에요.' });
  }

  try {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json({ candidates: CANDIDATES });
  } catch (error) {
    console.error('후보 목록 조회 에러:', error);
    return res.status(500).json({ error: '후보 목록을 불러오지 못했어요.' });
  }
}
