// public/js/app.js
// 화면 전환 및 이벤트 연결

import {
  getAvailableRoundSizes,
  createTournament,
  getCurrentPair,
  selectWinner,
  getProgress,
  isFinished
} from './tournament.js';

import {
  fetchCandidates,
  saveResult,
  fetchRanking,
  fetchAiComment
} from './api.js';

// App State
let candidates = [];
let candidateMap = new Map();
let selectedRoundSize = null;
let tournamentState = null;
let isProcessingMatch = false;
let lastResultPayload = null;
let lastChampionId = null;

// DOM Elements
const screenStart = document.getElementById('screen-start');
const screenMatch = document.getElementById('screen-match');
const screenResult = document.getElementById('screen-result');
const screenRanking = document.getElementById('screen-ranking');

const roundOptionsContainer = document.getElementById('round-options');
const btnStart = document.getElementById('btn-start');
const btnGoRanking = document.getElementById('btn-go-ranking');

const matchProgress = document.getElementById('match-progress');
const matchProgressBar = document.getElementById('match-progress-bar');
const cardLeft = document.getElementById('card-left');
const cardRight = document.getElementById('card-right');

const resultImage = document.getElementById('result-image');
const resultTitle = document.getElementById('result-title');
const resultDesc = document.getElementById('result-desc');
const resultAiComment = document.getElementById('result-ai-comment');
const resultSaveStatus = document.getElementById('result-save-status');
const btnRetrySave = document.getElementById('btn-retry-save');
const btnResultRanking = document.getElementById('btn-result-ranking');
const btnRestart = document.getElementById('btn-restart');
const btnShare = document.getElementById('btn-share');

const rankingTotal = document.getElementById('ranking-total');
const rankingList = document.getElementById('ranking-list');
const rankingEmpty = document.getElementById('ranking-empty');
const btnRankingBack = document.getElementById('btn-ranking-back');

// Screen Transition
export function showScreen(id) {
  document.querySelectorAll('section[data-screen]').forEach((el) => {
    el.hidden = el.id !== id;
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 1. Initial Load: 후보 목록 로드
async function initApp() {
  try {
    const data = await fetchCandidates();
    candidates = data.candidates || [];
    candidateMap = new Map(candidates.map((c) => [c.id, c]));
    renderRoundOptions();
  } catch (err) {
    console.error('후보 로드 실패:', err);
    // 임시 목업 또는 안내 문구
    roundOptionsContainer.innerHTML = '<p class="desc-text">후보 목록을 불러오는 중 오류가 발생했습니다.</p>';
  }
}

// 강 선택 버튼 렌더링
function renderRoundOptions() {
  roundOptionsContainer.innerHTML = '';
  const availableSizes = getAvailableRoundSizes(candidates.length);

  if (availableSizes.length === 0) {
    roundOptionsContainer.innerHTML = '<p class="desc-text">진행 가능한 후보가 부족합니다.</p>';
    btnStart.disabled = true;
    return;
  }

  // 기본적으로 가장 큰 강 수 선택
  selectedRoundSize = availableSizes[availableSizes.length - 1];

  availableSizes.forEach((size) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn-round ${size === selectedRoundSize ? 'selected' : ''}`;
    btn.dataset.size = String(size);
    btn.textContent = `${size}강`;

    btn.addEventListener('click', () => {
      selectedRoundSize = size;
      document.querySelectorAll('.btn-round').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      btnStart.disabled = false;
    });

    roundOptionsContainer.appendChild(btn);
  });

  btnStart.disabled = false;
}

// 다음 라운드 후보 이미지 미리 불러오기 (Preload)
function preloadImages(candidateIds) {
  candidateIds.forEach((id) => {
    const candidate = candidateMap.get(id);
    if (candidate?.image) {
      const img = new Image();
      img.src = candidate.image;
    }
  });
}

// 2. 대결 화면 그리기
function renderMatch() {
  if (!tournamentState) return;

  const progress = getProgress(tournamentState);
  matchProgress.textContent = `${progress.roundLabel} ${progress.current}/${progress.total}`;
  matchProgressBar.max = progress.totalMatches;
  matchProgressBar.value = progress.done;

  const pair = getCurrentPair(tournamentState);
  if (!pair) return;

  const [leftId, rightId] = pair;
  const leftCandidate = candidateMap.get(leftId);
  const rightCandidate = candidateMap.get(rightId);

  renderCard(cardLeft, leftCandidate, 'TRACK A');
  renderCard(cardRight, rightCandidate, 'TRACK B');

  // 다음에 나올 후보 이미지 프리로드
  const nextPairStart = (tournamentState.matchIndex + 1) * 2;
  if (nextPairStart < tournamentState.current.length) {
    preloadImages([
      tournamentState.current[nextPairStart],
      tournamentState.current[nextPairStart + 1]
    ]);
  }
}

function renderCard(cardEl, candidate, defaultTag) {
  if (!candidate) return;

  const imgEl = cardEl.querySelector('.card-image');
  const titleEl = cardEl.querySelector('.card-title');
  const descEl = cardEl.querySelector('.card-desc');
  const tagEl = cardEl.querySelector('.card-tag');

  imgEl.src = candidate.image || '';
  imgEl.alt = candidate.title || '10CM 무대';
  titleEl.textContent = candidate.title || '';
  descEl.textContent = candidate.description || '';
  if (tagEl) tagEl.textContent = defaultTag;

  cardEl.dataset.candidateId = candidate.id;
  cardEl.classList.remove('is-selected');
}

// 3. 카드 클릭 처리
async function handleSelectWinner(winnerId, selectedCardEl) {
  if (isProcessingMatch) return;
  isProcessingMatch = true;

  selectedCardEl.classList.add('is-selected');

  // 자연스러운 전환을 위해 180ms 딜레이
  await new Promise((resolve) => setTimeout(resolve, 180));

  tournamentState = selectWinner(tournamentState, winnerId);

  if (isFinished(tournamentState)) {
    onTournamentFinish();
  } else {
    renderMatch();
    isProcessingMatch = false;
  }
}

// 4. 결승 완료 및 결과 화면 처리
function onTournamentFinish() {
  isProcessingMatch = false;
  lastChampionId = tournamentState.championId;
  const champion = candidateMap.get(lastChampionId);

  // 결과 화면 데이터 바인딩
  resultImage.src = champion?.image || '';
  resultImage.alt = champion?.title || '우승 무대';
  resultTitle.textContent = champion?.title || '';
  resultDesc.textContent = champion?.description || '';

  // AI 코멘트 및 저장 상태 초기화
  resultAiComment.textContent = 'AI가 한마디 준비 중이에요…';
  resultSaveStatus.textContent = '결과를 저장하는 중…';
  btnRetrySave.hidden = true;

  showScreen('screen-result');

  // 저장 요청 데이터 준비
  lastResultPayload = {
    playId: tournamentState.playId,
    roundSize: tournamentState.roundSize,
    championId: tournamentState.championId,
    matches: tournamentState.matches
  };

  // 비동기 요청 2개 동시 발송 (저장 & AI 코멘트)
  submitSaveResult(lastResultPayload);
  requestAiComment(lastChampionId);
}

// 결과 저장
async function submitSaveResult(payload) {
  resultSaveStatus.textContent = '결과를 저장하는 중…';
  btnRetrySave.hidden = true;

  try {
    const res = await saveResult(payload);
    if (res.saved || res.duplicate) {
      resultSaveStatus.textContent = '결과가 저장되었어요!';
    } else {
      throw new Error('저장 처리에 실패했습니다.');
    }
  } catch (err) {
    console.error('결과 저장 실패:', err);
    resultSaveStatus.textContent = `저장에 실패했어요: ${err.message || '네트워크 오류'}`;
    btnRetrySave.hidden = false;
  }
}

// AI 코멘트 요청
async function requestAiComment(candidateId) {
  try {
    const res = await fetchAiComment(candidateId);
    resultAiComment.textContent = res.comment || '멋진 선택이에요!';
  } catch (err) {
    console.error('AI 코멘트 요청 실패:', err);
    const champion = candidateMap.get(candidateId);
    resultAiComment.textContent = `${champion?.title || '이번 무대'}, 정말 멋진 선택이에요!`;
  }
}

// 5. 누적 순위 화면 표시
async function showRankingScreen() {
  showScreen('screen-ranking');
  rankingList.innerHTML = '<li class="desc-text" style="text-align:center; padding: 20px;">순위를 불러오는 중…</li>';
  rankingEmpty.hidden = true;

  try {
    const data = await fetchRanking();
    renderRankingList(data);
  } catch (err) {
    console.error('순위 조회 실패:', err);
    rankingList.innerHTML = '<li class="desc-text" style="text-align:center; padding: 20px;">순위를 불러오지 못했어요.</li>';
  }
}

function renderRankingList(data) {
  const totalPlays = data.totalPlays || 0;
  rankingTotal.textContent = `지금까지 ${totalPlays}번의 월드컵이 열렸어요`;

  const items = data.items || [];
  if (items.length === 0 || totalPlays === 0) {
    rankingEmpty.hidden = false;
    rankingList.innerHTML = '';
    return;
  }

  rankingEmpty.hidden = true;
  rankingList.innerHTML = '';

  items.forEach((item) => {
    const li = document.createElement('li');
    const isMine = lastChampionId && item.candidateId === lastChampionId;
    li.className = `ranking-item ${isMine ? 'is-mine' : ''}`;

    const championRateFormatted = (Number(item.championRate) || 0).toFixed(1);
    const winRateFormatted = (Number(item.winRate) || 0).toFixed(1);

    li.innerHTML = `
      <span class="ranking-num">${item.rank}</span>
      <img class="ranking-thumb" src="${item.image || ''}" alt="${item.title}" loading="lazy">
      <div class="ranking-details">
        <div class="ranking-candidate-title">
          ${item.title}
          ${isMine ? '<span class="ranking-mine-tag">MY PICK</span>' : ''}
        </div>
        <div class="ranking-stats">
          우승 ${item.championCount}회 · 우승 비율 ${championRateFormatted}% · 승률 ${winRateFormatted}%
        </div>
      </div>
    `;

    rankingList.appendChild(li);
  });
}

// 6. 이벤트 리스너 등록
function setupEventListeners() {
  // 시작 버튼
  btnStart.addEventListener('click', () => {
    if (!selectedRoundSize || candidates.length < selectedRoundSize) return;
    const allIds = candidates.map((c) => c.id);
    tournamentState = createTournament(allIds, selectedRoundSize);
    showScreen('screen-match');
    renderMatch();
  });

  // 순위 보기 버튼 (시작 화면)
  btnGoRanking.addEventListener('click', () => {
    showRankingScreen();
  });

  // 대결 카드 클릭
  cardLeft.addEventListener('click', () => {
    const pair = getCurrentPair(tournamentState);
    if (pair) handleSelectWinner(pair[0], cardLeft);
  });

  cardRight.addEventListener('click', () => {
    const pair = getCurrentPair(tournamentState);
    if (pair) handleSelectWinner(pair[1], cardRight);
  });

  // 저장 재시도
  btnRetrySave.addEventListener('click', () => {
    if (lastResultPayload) {
      submitSaveResult(lastResultPayload);
    }
  });

  // 결과 화면 -> 순위 보기
  btnResultRanking.addEventListener('click', () => {
    showRankingScreen();
  });

  // 결과 화면 -> 다시하기
  btnRestart.addEventListener('click', () => {
    showScreen('screen-start');
    renderRoundOptions();
  });

  // 순위 화면 -> 처음으로
  btnRankingBack.addEventListener('click', () => {
    showScreen('screen-start');
  });

  // 링크 복사
  btnShare.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      const originalText = btnShare.textContent;
      btnShare.textContent = '복사되었어요!';
      setTimeout(() => {
        btnShare.textContent = originalText;
      }, 2000);
    } catch {
      alert('주소를 복사하지 못했습니다.');
    }
  });
}

// App Launch
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initApp();
});
