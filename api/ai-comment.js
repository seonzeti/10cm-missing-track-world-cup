// api/ai-comment.js
import OpenAI from 'openai';
import { CANDIDATES } from './_lib/candidates-data.js';

const SYSTEM_PROMPT = `당신은 10CM 팬콘서트 무대 월드컵의 다정한 진행자입니다.
사용자가 최애 무대로 고른 곡에 대해 한국어로 한마디를 남깁니다.

규칙:
1. 한 문장 또는 두 문장, 전체 80자 이내로 작성합니다.
2. 곡 제목과 무대 설명에 담긴 분위기만 활용합니다.
3. 따뜻하고 밝은 존댓말을 사용합니다.
4. 노래 가사는 인용하지 않고, 자신의 표현으로 작성합니다.
5. 사실 정보(발매 연도, 순위, 수상 등)는 언급하지 않습니다.
6. 이모지는 최대 1개까지 사용합니다.`;

const FALLBACKS = [
  '{title}, 정말 멋진 선택이에요!',
  '오늘의 최애 무대는 {title}! 탁월한 안목이네요.',
  '{title} 무대를 고르셨군요. 다음 팬콘도 기대돼요!'
];

function getFallbackComment(title) {
  const template = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  return template.replace('{title}', title);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: '허용되지 않은 요청이에요.' });
  }

  const { candidateId } = req.body || {};

  // 1. candidateId 유효성 검증
  const candidate = CANDIDATES.find((c) => c.id === candidateId);
  if (!candidate) {
    return res.status(400).json({ error: '알 수 없는 후보예요.' });
  }

  // 2. 키 또는 모델 미설정 시 fallback 즉시 반환
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim();

  if (!apiKey || !model) {
    return res.status(200).json({
      comment: getFallbackComment(candidate.title),
      source: 'fallback'
    });
  }

  // 3. OpenAI 호출
  try {
    const client = new OpenAI({
      apiKey,
      timeout: 8000,
      maxRetries: 0
    });

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `곡 제목: ${candidate.title}\n무대 설명: ${candidate.description || '없음'}`
        }
      ],
      max_tokens: 120
    });

    let comment = completion.choices[0]?.message?.content?.trim() || '';

    // 앞뒤 따옴표 제거
    comment = comment.replace(/^["'「『]+|["'」』]+$/g, '').trim();

    // 80자 제한
    if (comment.length > 80) {
      comment = comment.slice(0, 80);
    }

    if (!comment) {
      return res.status(200).json({
        comment: getFallbackComment(candidate.title),
        source: 'fallback'
      });
    }

    return res.status(200).json({
      comment,
      source: 'ai'
    });
  } catch (err) {
    console.error('OpenAI 호출 실패:', err);
    return res.status(200).json({
      comment: getFallbackComment(candidate.title),
      source: 'fallback'
    });
  }
}
