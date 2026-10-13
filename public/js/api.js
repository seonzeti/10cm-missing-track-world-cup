// public/js/api.js
// /api 호출 클라이언트 함수 모음

export async function fetchCandidates() {
  const res = await fetch('/api/candidates');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || '후보 목록을 불러오지 못했어요.');
  }
  return res.json();
}

export async function saveResult(payload) {
  const res = await fetch('/api/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || '결과를 저장하지 못했어요.');
  }
  return res.json();
}

export async function fetchRanking() {
  const res = await fetch('/api/ranking', {
    cache: 'no-store'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || '순위를 불러오지 못했어요.');
  }
  return res.json();
}

export async function fetchAiComment(candidateId) {
  const res = await fetch('/api/ai-comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateId })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'AI 한마디를 불러오지 못했어요.');
  }
  return res.json();
}
