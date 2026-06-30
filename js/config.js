/**
 * config.js — 모바일 청첩장 전역 설정 파일
 *
 * ★ 이 파일 하나만 수정하면 청첩장 전체 내용이 바뀝니다.
 * 실제 정보로 교체 후 배포하세요.
 *
 * 로드 순서: 반드시 다른 모든 JS 파일보다 먼저 로드되어야 합니다.
 *   index.html → <script defer src="js/config.js"> (첫 번째)
 */

const CONFIG = {

  /* ─────────────────────────────────────────
   * 1. 신랑 정보
   *    사용처: #cover 커버 섹션 이름 표시,
   *             #accounts 계좌 정보,
   *             #rsvp 참석여부 폼,
   *             contacts 전화/문자 버튼
   * ───────────────────────────────────────── */
  groom: {
    name: '유동윤',          // 한글 이름 — 커버/인사말/계좌 섹션에 표시
    nameEn: 'Dongyun You',  // 영문 이름 — 커버 서브텍스트 또는 장식용
    father: '유재선',         // 아버지 이름 — 커버 혼주 표시
    mother: '이금민',           // 어머니 이름 — 커버 혼주 표시
    order: '아들',            // '장남' | '차남' | '아들' 등 — 커버 혼주 레이블
    phone: ''                // (미사용) 실제 연락처는 아래 contacts에 Base64로 저장
  },

  /* ─────────────────────────────────────────
   * 2. 신부 정보
   *    사용처: 신랑과 동일 (반대편 표시)
   * ───────────────────────────────────────── */
  bride: {
    name: '노영지',
    nameEn: 'Yeongji Noh',
    father: '노정태',
    mother: '양명숙',
    order: '딸',             // '장녀' | '차녀' | '딸' 등
    phone: ''                // (미사용) 실제 연락처는 아래 contacts에 Base64로 저장
  },

  /* ─────────────────────────────────────────
   * 3. 결혼식 정보
   *    사용처: #calendar 달력·카운트다운,
   *             #location 오시는 길,
   *             OG 메타태그 (index.html head)
   * ───────────────────────────────────────── */
  wedding: {
    date: '2026-10-03T11:00:00',           // ISO 8601 — countdown.js가 D-day 계산에 사용
    dateText: '2026년 10월 03일 토요일 오전 11시', // 사람이 읽는 형식 — calendar/cover 섹션 표시
    venue: '노블발렌티 대치점',              // 웨딩홀 상호 — location 섹션 헤더
    hall: 'B1층 단독홀',                   // 홀 이름 — location 섹션 서브텍스트 (S타워 지하1층)
    address: '서울특별시 강남구 영동대로 325', // 도로명 주소 (S타워) — location 섹션 + 지도 링크
    lat: 37.5033072,                        // 위도 — 카카오맵 공식 데이터(WTM→WGS84 변환) 검증값
    lng: 127.0655632                        // 경도 — 카카오맵 공식 데이터(WTM→WGS84 변환) 검증값
  },

  /* ─────────────────────────────────────────
   * 4. 인사말
   *    사용처: #greeting 섹션
   *    greetingQuote: 상단 인용구 (명조 강조), greetingAuthor: 출처
   *    greeting: 본문 인사말 (\n 은 줄바꿈으로 처리)
   * ───────────────────────────────────────── */
  greetingQuote: '우리가 사랑할 때,\n우리는 우주에서 가장 온전하고 완전한 존재가 된다.',
  greetingAuthor: '헤르만 헤세',
  greeting: '서로를 만나 비로소 온전해진 저희 두 사람이\n이제 평생을 함께하려 합니다.\n그 시작의 자리에 소중한 분들을 모시오니\n따뜻한 마음으로 함께 축복해 주시면 감사하겠습니다.',

  /* ─────────────────────────────────────────
   * 5. 갤러리 이미지 목록
   *    galleryFeatured: 캐러셀(슬라이드)용 대표 사진 (가볍게 8~10장 권장)
   *    gallery:         '사진 전체보기' 그리드용 전체 사진
   *    (galleryFeatured가 비어 있으면 gallery 전체가 캐러셀에도 표시됨)
   *    권장: 최대 1MB/장
   * ───────────────────────────────────────── */
  galleryFeatured: [
    'images/g4.jpg',   // 커플 사진 (첫 슬라이드)
    'images/g1.jpg',
    'images/g7.jpg',
    'images/g9.jpg',
    'images/g11.jpg',
    'images/g13.jpg',
    'images/g16.jpg',
    'images/g19.jpg',
    'images/g21.jpg',
    'images/g23.jpg',
    'images/g20.jpg'   // 신랑 독사진 (마지막 슬라이드)
  ],
  gallery: [
    'images/g1.jpg', 'images/g2.jpg', 'images/g3.jpg', 'images/g4.jpg',
    'images/g5.jpg', 'images/g6.jpg', 'images/g7.jpg', 'images/g8.jpg',
    'images/g9.jpg', 'images/g10.jpg', 'images/g11.jpg', 'images/g12.jpg',
    'images/g13.jpg', 'images/g14.jpg', 'images/g15.jpg', 'images/g16.jpg',
    'images/g17.jpg', 'images/g18.jpg', 'images/g19.jpg', 'images/g20.jpg',
    'images/g21.jpg', 'images/g22.jpg', 'images/g23.jpg', 'images/g24.jpg'
  ],

  /* ─────────────────────────────────────────
   * 6. 커버(메인) 대표 이미지
   *    사용처: #cover 섹션 히어로 배경/이미지
   *    권장: 세로형(9:16 또는 3:4), 최대 2MB
   * ───────────────────────────────────────── */
  mainVisual: 'images/main_visual.jpg',

  /* ─────────────────────────────────────────
   * 7. 계좌 정보
   *    사용처: #accounts 섹션 — 신랑측/신부측 펼침 + 복사
   *    ⚠️ number는 Base64 인코딩 값 (소스에 평문 노출 방지)
   *       인코딩 방법: 브라우저 콘솔(F12)에서 btoa('계좌번호') 실행 후 결과 붙여넣기
   *       예: btoa('000-000-000000') → 그 결과를 number에 입력
   * ───────────────────────────────────────── */
  accounts: {
    groom: [
      { bank: '우리은행', holder: '유동윤', number: 'MTAwLTI4NTItNjU1OTc2' }
    ],
    bride: [
      { bank: '신한은행', holder: '노영지', number: 'MTEwLTQ5OC0yNDI2MTM=' }
    ]
  },

  /* ─────────────────────────────────────────
   * 8. 연락처 (전화/문자 버튼)
   *    사용처: #location 오시는 길 — 전화/문자 버튼
   *    ⚠️ phone은 Base64 인코딩 값 (소스에 평문 노출 방지)
   *    phone이 빈 문자열('')이면 해당 항목 숨김
   * ───────────────────────────────────────── */
  contacts: {
    groomSide: [
      { label: '신랑', phone: 'MDEwLTcxMzItMTcyOA==' },
      { label: '신랑 아버지', phone: '' },
      { label: '신랑 어머니', phone: '' }
    ],
    brideSide: [
      { label: '신부', phone: 'MDEwLTk1MTEtMzM1Mw==' },
      { label: '신부 아버지', phone: '' },
      { label: '신부 어머니', phone: '' }
    ]
  },

  /* ─────────────────────────────────────────
   * 8-2. 교통편 안내
   *    사용처: #location '오시는 길' — 지도 아래 항목별 안내
   *    title(교통수단) + body(설명). 필요 없으면 빈 배열 [] 로.
   *    아래는 노블발렌티 대치점(영동대로 325, S타워) 기준 초안 — 확인 후 수정하세요.
   * ───────────────────────────────────────── */
  transport: [
    { title: '🚇 지하철', body: '2호선 삼성역 3번 출구 앞 30M 전방 셔틀버스 수시 운영\n(도보 이용시 약 9분 소요)' },
    { title: '🚌 버스', body: '휘문고교 사거리 버스 정류장 (ID 23-245)' },
    { title: '🚗 자가용', body: "내비게이션에 '노블발렌티 대치점' 또는 '영동대로 325' 검색" },
    { title: '🅿️ 주차', body: '건물 내 지하 주차장 무료 이용 가능 (2시간 무료)\n최대 500대 수용 (만차 시 인근 공영주차장 이용해 주세요)' }
  ],

  /* ─────────────────────────────────────────
   * 9. 카카오 지도 JS API 키
   *    사용처: map.js — 카카오 지도 SDK 초기화
   *    비어있으면 정적 이미지(staticmap) 또는 구글맵 링크로 fallback
   *    발급: https://developers.kakao.com → 내 애플리케이션 → 앱 키 → JavaScript 키
   * ───────────────────────────────────────── */
  kakaoMapJsKey: '',

  /* ─────────────────────────────────────────
   * 10. Google Apps Script 웹앱 URL
   *     사용처: rsvp.js (참석여부 폼 제출),
   *              guestbook.js (방명록 읽기/쓰기)
   *     발급: apps-script/ 폴더의 스크립트를 배포하면 URL 생성됨
   *     비어있으면 폼 제출 버튼을 disabled 처리
   * ───────────────────────────────────────── */
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbzvjPioLmKLHiPugvd5XOl_BOHQVDeHO_ZXyI5EYlMcf9opCiyHF4is7s1SZNXXVpPAMA/exec',

  /* ─────────────────────────────────────────
   * 11. BGM 파일 경로
   *     사용처: bgm.js — Audio API 소스로 사용
   *     audio/ 폴더에 mp3 파일을 넣고 경로 수정
   *     권장: 루프 가능한 배경음악, 2~5MB 이하
   * ───────────────────────────────────────── */
  bgm: 'audio/bgm.mp3',

  /* ─────────────────────────────────────────
   * 12. 카카오톡 공유 SDK 앱 키
   *     사용처: #share 섹션 — 카카오톡으로 청첩장 공유
   *     발급: https://developers.kakao.com → 내 애플리케이션 → 앱 키 → JavaScript 키
   *     비어있으면 카카오 공유 버튼 숨김 또는 URL 복사로 fallback
   * ───────────────────────────────────────── */
  shareKakaoKey: '',

  /* ─────────────────────────────────────────
   * 13. 에셋 버전 (캐시 무효화)
   *     사진을 교체하거나 파일을 수정한 뒤, 하객 브라우저가 옛 캐시를
   *     계속 보여주는 것을 막으려면 이 숫자/문자를 바꿔서 배포하세요.
   *     (이미지 src 뒤에 ?v=값 이 자동으로 붙습니다)
   * ───────────────────────────────────────── */
  assetVersion: '20260630b'

};

/* 외부 모듈에서 CONFIG를 읽을 수 있도록 전역 노출 (모듈 번들러 없이 사용) */
// CONFIG는 var/const 전역 선언이므로 window.CONFIG로도 접근 가능
