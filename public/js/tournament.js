// public/js/tournament.js
// 토너먼트 계산 함수 (순수 함수)

/**
 * 후보 수 이하의 2의 거듭제곱 배열 (4 이상, 작은 순)
 * @param {number} count 후보 수
 * @returns {number[]}
 */
export function getAvailableRoundSizes(count) {
  const sizes = [];
  let size = 4;
  while (size <= count) {
    sizes.push(size);
    size *= 2;
  }
  return sizes;
}

/**
 * Fisher–Yates 셔플 (새 배열 반환)
 * @template T
 * @param {T[]} array 
 * @returns {T[]}
 */
export function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * 토너먼트 초기 상태 생성
 * @param {string[]} candidateIds 전체 후보 id 배열
 * @param {number} roundSize 선택한 강 수
 * @returns {object}
 */
export function createTournament(candidateIds, roundSize) {
  const shuffledAll = shuffle(candidateIds);
  const selected = shuffledAll.slice(0, roundSize);

  return {
    playId: crypto.randomUUID(),
    roundSize,
    current: selected, // 순서 = 대진
    next: [],
    matchIndex: 0,
    matches: [],
    championId: null
  };
}

/**
 * 현재 매치 후보 [leftId, rightId]
 * @param {object} state 
 * @returns {[string, string]|null}
 */
export function getCurrentPair(state) {
  if (state.championId !== null) return null;
  const leftId = state.current[state.matchIndex * 2];
  const rightId = state.current[state.matchIndex * 2 + 1];
  return [leftId, rightId];
}

/**
 * 승자 선택 및 다음 상태 반환
 * @param {object} state 
 * @param {string} winnerId 
 * @returns {object}
 */
export function selectWinner(state, winnerId) {
  if (state.championId !== null) return state;

  const pair = getCurrentPair(state);
  if (!pair || (!pair.includes(winnerId))) {
    return state;
  }

  const [leftId, rightId] = pair;
  const loserId = winnerId === leftId ? rightId : leftId;

  const currentRoundMatches = state.current.length;
  const nextMatches = [
    ...state.matches,
    { round: currentRoundMatches, winnerId, loserId }
  ];

  const nextWinners = [...state.next, winnerId];
  const nextMatchIndex = state.matchIndex + 1;

  // 이번 라운드 매치가 모두 끝났는지 확인
  if (nextMatchIndex * 2 === state.current.length) {
    // 결승까지 모두 끝난 경우
    if (nextWinners.length === 1) {
      return {
        ...state,
        matches: nextMatches,
        next: nextWinners,
        matchIndex: nextMatchIndex,
        championId: nextWinners[0]
      };
    }

    // 다음 라운드로 전환 (승자 순서 유지, 다시 섞지 않음)
    return {
      ...state,
      matches: nextMatches,
      current: nextWinners,
      next: [],
      matchIndex: 0,
      championId: null
    };
  }

  // 이번 라운드 내 다음 매치로 이동
  return {
    ...state,
    matches: nextMatches,
    next: nextWinners,
    matchIndex: nextMatchIndex
  };
}

/**
 * 진행 정보 계산
 * @param {object} state 
 * @returns {{ roundLabel: string, current: number, total: number, done: number, totalMatches: number }}
 */
export function getProgress(state) {
  const currentCount = state.current.length;
  let roundLabel = '';
  if (currentCount === 2) {
    roundLabel = '결승';
  } else if (currentCount === 4) {
    roundLabel = '준결승';
  } else {
    roundLabel = `${currentCount}강`;
  }

  const current = state.matchIndex + 1;
  const total = currentCount / 2;
  const done = state.matches.length;
  const totalMatches = state.roundSize - 1;

  return {
    roundLabel,
    current,
    total,
    done,
    totalMatches
  };
}

/**
 * 토너먼트 종료 여부
 * @param {object} state 
 * @returns {boolean}
 */
export function isFinished(state) {
  return state.championId !== null;
}
