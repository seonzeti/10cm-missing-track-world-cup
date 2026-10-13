# THE MISSING TRACKS — Design System

2026 10CM FAN CONCERT *THE MISSING TRACKS* (Festival de Centiners) 포스터 4종과 웹 시안 1종을 기반으로 정리한 디자인 가이드입니다.  
모든 결과물(웹, SNS 카드, 굿즈, 안내물)은 이 문서를 기준으로 제작합니다.

---

# 1. Concept

## 핵심 키워드
**사건 파일(Case File) · 사라진 곡을 추적하는 탐정 서사 · 필름 누아르 · 미니멀 타이포**

- 공연 3일을 **3개의 사건(CASE)**으로 정의합니다.
- 화면은 **어두운 사진 + 강한 흰색 타이포 + 작은 정보 텍스트**의 대비로 구성합니다.
- 장식은 최소화하고, *조명·그림자·종이 질감*으로 분위기를 만듭니다.

## 사건(Day) 구성

| CASE | 날짜 | 부제 | 무드 | 포인트 컬러 |
|---|---|---|---|---|
| No.1009 | 10/9 (금) 6PM | 10CM, About That Bitterness | 어둠 속 한 줄기 빛, 따뜻한 앰버 | Amber |
| No.1010 | 10/10 (토) 6PM | Dreams Come True | 세피아, 위에서 내려다본 시점, 긴 그림자 | Sepia |
| No.1011 | 10/11 (일) 6PM | Into Your 10CM | 흑백 + 차가운 원형 스포트라이트 | Spot Blue |
| 통합 | 10/9–11 | THE MISSING TRACKS | 찢어진 종이 콜라주, 3일 요약 | Signal Yellow |

장소는 모든 CASE 공통 **OLYMPIC HALL**입니다.

---

# 2. Color

## 기본 팔레트

```css
:root {
  /* Base */
  --ink:        #0A0A0A;  /* 메인 배경, 거의 검정 */
  --ink-soft:   #161513;  /* 카드/섹션 배경 */
  --paper:      #F4F2EC;  /* 메인 텍스트, 오프화이트 */
  --paper-dim:  #A9A59C;  /* 보조 텍스트, 캡션 */
  --line:       #3A3833;  /* 구분선, 점선 테두리 */

  /* Accent (한 화면에 1개만 사용) */
  --signal:     #E9E23A;  /* 통합 포인트: 시그널 옐로 */
  --amber:      #C8732E;  /* CASE 1009 */
  --sepia:      #8A6E4E;  /* CASE 1010 */
  --spot-blue:  #C9D4F2;  /* CASE 1011 스포트라이트 */
}
```

## 사용 규칙
1. 배경은 `--ink`, 텍스트는 `--paper`를 기본으로 사용합니다.
2. 포인트 컬러는 **한 화면에 한 가지만** 사용합니다.
3. 포인트 컬러는 **타이틀의 한 단어 또는 짧은 라벨**에만 적용합니다.  
   예) 타이틀에서 `MISSING`만 `--signal`로 표시

- **Acceptable:** `THE` `TRACKS`는 흰색, `MISSING`만 옐로
- **Unacceptable:** 본문 문단 전체를 옐로로 칠하기, 옐로와 앰버를 한 화면에 함께 사용하기

---

# 3. Typography

## 폰트 구성

| 역할 | 폰트 | 설정 | 근거(포스터) |
|---|---|---|---|
| 한글 전체 | **Pretendard** | 400–700 | 기본 폰트 |
| 영문 디스플레이 타이틀 | **Archivo** (Expanded) | `wdth 125`, `wght 900`, 대문자 | `THE MISSING TRACKS` — 넓고 매우 두꺼운 그로테스크 |
| 영문 CASE 타이틀 | **Archivo** | `wdth 100`, `wght 700–800`, 대문자 | `CASE No.1009 : …` — 굵고 단단한 산세리프 |
| 영문 정보·본문 | **Pretendard** (라틴 글리프) | 400–500 | 날짜, 장소, 하단 서사 문단 — 담백한 네오 그로테스크 |
| 파일 라벨·메타 정보 | **JetBrains Mono** | 400–500, 자간 넓게 | 웹 시안의 `FILE No. 1010 · DAY 2` 등 |

> 라이선스가 있다면 디스플레이 타이틀은 *Druk Wide Heavy*로 대체하면 포스터와 가장 가깝습니다.

## 폰트 로드

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=JetBrains+Mono:wght@400;500&display=swap">
```

```css
:root {
  --font-base:    "Pretendard Variable", Pretendard, system-ui, sans-serif;
  --font-display: "Archivo", "Pretendard Variable", sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;
}
.display {
  font-family: var(--font-display);
  font-variation-settings: "wdth" 125;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 0.88;
  letter-spacing: -0.01em;
}
```

## 타입 스케일

| 토큰 | 크기 (모바일 → 데스크톱) | 행간 | 용도 |
|---|---|---|---|
| `display-xl` | 56 → 128px | 0.88 | `THE MISSING TRACKS` |
| `display-md` | 28 → 48px | 1.0 | `2026 10CM FAN CONCERT` |
| `case-title` | 18 → 28px | 1.1 | `CASE No.1010 : DREAMS COME TRUE` |
| `ko-heading` | 20 → 28px | 1.35 | 한글 제목 (Pretendard 700) |
| `info` | 15 → 18px | 1.25 | 요일 / 날짜 / 시간 / 장소 |
| `body` | 13 → 15px | 1.5 | 서사 문단 |
| `meta` | 11 → 12px | 1.4 | 모노 라벨, 자간 `0.2em` |

## 타이포 규칙
1. 디스플레이 타이틀은 `THE` 한 줄 + `MISSING TRACKS` 한 줄로 쌓고, `THE`는 가운데 위에 작게 올립니다.
2. 영문 정보 텍스트는 **대문자**로 쓰고, 날짜는 `SATURDAY,` 다음 줄에 `10TH OCTOBER 6:00 PM` 형식으로 줄을 나눕니다.
3. 서사 문단은 **양끝 정렬**, 화면 가로 폭 전체를 사용하며 3–4줄로 유지합니다.
4. 한글과 영문을 한 줄에 함께 쓸 때는 Pretendard로 통일합니다.

---

# 4. Layout

## 그리드
- 포스터 비율: **3 : 4** (예: 1500 × 2000px)
- 바깥 여백: 가로 폭의 **4%** (웹 모바일은 16px)
- 12컬럼 그리드, 정보 블록은 **좌측 상단** 또는 **좌측 중단**에 배치합니다.

## 정보 위계 (위에서 아래로)
1. 상단 바: `2026 10CM FAN CONCERT` (좌) · 스폰서 로고 줄 (우)
2. 일정 블록: 요일, 날짜, 시간, `OLYMPIC HALL`
3. 사진 영역 (화면의 50–70%)
4. 엠블럼 락업 (가운데 정렬)
5. 디스플레이 타이틀 `THE MISSING TRACKS`
6. CASE 타이틀
7. 서사 문단 (최하단 또는 최상단, 전체 폭)

## 스폰서 로고 줄
- 순서: **10CM · CAM · Wonderwall. · fromm · FREAK**
- 흰색 단색, 높이는 `info` 텍스트 대문자 높이와 맞춥니다.

---

# 5. Graphic Elements

## 엠블럼 락업
타원 안의 안경 아이콘 + 그 아래 3줄 텍스트로 구성합니다.

```
   ( 안경 아이콘 )
FESTIVAL DE CENTINERS
 2026 OFFICIAL SELECTION
  THE MISSING TRACKS
```
- 첫 줄은 Archivo 700, 아래 두 줄은 더 작게. 전체 가운데 정렬, 흰색 단색.

## 사건 파일 모티프
- **파일 라벨:** 점선 테두리 박스 안에 모노 텍스트  
  예) `FILE No. 1010 · DAY 2 · 사건 진행 중`
- **넘버링:** 날짜를 사건 번호로 사용 (`1009`, `1010`, `1011`) — 사물함 번호판 `10-09`, `10-11` 같은 표기도 허용
- **빈칸 필드:** `SUSPECT: ____` 처럼 채워지지 않은 항목으로 미스터리를 표현

## 질감과 이미지
- 사진은 **저조도, 강한 명암 대비, 필름 그레인**을 유지합니다.
- 통합 비주얼은 **찢어진 종이 가장자리**로 여러 CASE 사진을 겹칩니다.
- CASE 1011은 **원형 스포트라이트**(흰색→`--spot-blue` 가장자리)로 인물을 감쌉니다.
- 구분선은 `--line` 색의 1px 실선 또는 점선을 사용합니다.

---

# 6. Components (웹)

| 컴포넌트 | 스타일 |
|---|---|
| 버튼 (Primary) | `--paper` 배경, `--ink` 텍스트, 모서리 0, Archivo 700 대문자 |
| 버튼 (Ghost) | 투명 배경, 1px `--paper` 테두리 |
| CASE 카드 | `--ink-soft` 배경, 상단에 모노 라벨, 하단에 CASE 타이틀, 해당 CASE 포인트 컬러 1px 상단 보더 |
| 일정 행 | `날짜 · 시간 · 장소`를 가운데 점(`·`)으로 연결, 위아래 1px `--line` |
| 상태 배지 | 모노 텍스트 + 점선 테두리 (예: `사건 진행 중`, `CASE CLOSED`) |

- 모서리는 **0 또는 2px 이하**로 유지합니다.
- 그림자 대신 **명도 차와 선**으로 깊이를 표현합니다.
- 모션은 느린 페이드(400–600ms)와 스포트라이트 이동 정도로 절제합니다.

---

# 7. 톤 & 카피

- 영문 카피는 **사건 기록 같은 담담한 서술체**로 씁니다. (예: *The second case. …*)
- 한글 카피는 짧은 명사형으로 씁니다. (예: *사라진 곡을 찾아서*)
- 모든 CASE는 `CASE No.날짜 : 부제` 형식을 지킵니다.

---

# 8. 최종 점검 체크리스트

결과물을 완성하기 전에 아래 항목을 하나씩 확인합니다.

1. 배경은 어둡고, 텍스트는 오프화이트인가?
2. 포인트 컬러는 한 가지, 한 단어에만 쓰였는가?
3. 한글은 Pretendard, 영문 타이틀은 Archivo Expanded 900인가?
4. 날짜·장소·CASE 번호가 정확한가? (1009 금 / 1010 토 / 1011 일, 6PM, OLYMPIC HALL)
5. 엠블럼 락업과 스폰서 로고 줄이 포함되었는가?
6. 사진에 그레인과 강한 명암이 유지되는가?
