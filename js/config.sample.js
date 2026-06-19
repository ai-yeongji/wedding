/**
 * config.sample.js — 설정 템플릿 (공개용 / 빈 값)
 *
 * ⚠️ 이 파일은 구조만 보여주는 샘플입니다. 실제 사용 파일이 아닙니다.
 *
 * 사용법:
 *   1. 이 파일을 같은 폴더에 js/config.js 로 복사
 *   2. config.js 에 본인의 실제 값(이름·날짜·계좌·연락처 등) 입력
 *   3. config.js 는 .gitignore 에 등록되어 git/GitHub 에 올라가지 않습니다
 *      → 개인정보(계좌·연락처)가 저장소 코드·히스토리에 남지 않음
 *   4. 배포 시에는 config.js 가 사이트에 포함되어야 합니다 (SETUP.md 참고)
 */

const CONFIG = {

  /* 1. 신랑 정보 */
  groom: {
    name: '',          // 한글 이름 (예: 홍길동)
    nameEn: '',        // 영문 이름 (예: Hong Gildong)
    father: '',        // 아버지 성함
    mother: '',        // 어머니 성함
    order: '아들',      // '장남' | '차남' | '아들' 등
    phone: ''          // 신랑 연락처
  },

  /* 2. 신부 정보 */
  bride: {
    name: '',
    nameEn: '',
    father: '',
    mother: '',
    order: '딸',        // '장녀' | '차녀' | '딸' 등
    phone: ''
  },

  /* 3. 결혼식 정보 */
  wedding: {
    date: '2027-01-01T12:00:00',                 // ISO 8601 — 카운트다운/달력 계산용
    dateText: '2027년 1월 1일 토요일 낮 12시',     // 화면 표시용 문구
    venue: '',                                    // 예식장 상호
    hall: '',                                     // 홀/층
    address: '',                                  // 도로명 주소
    lat: 0,                                        // 위도 (구글맵 핀 우클릭으로 확인)
    lng: 0                                         // 경도
  },

  /* 4. 인사말 (\n = 줄바꿈) */
  greeting: '',

  /* 5. 갤러리 이미지 목록 */
  gallery: [
    'images/g1.jpg',
    'images/g2.jpg',
    'images/g3.jpg',
    'images/g4.jpg',
    'images/g5.jpg',
    'images/g6.jpg',
    'images/g7.jpg',
    'images/g8.jpg'
  ],

  /* 6. 커버(메인) 대표 이미지 */
  mainVisual: 'images/main_visual.jpg',

  /* 7. 계좌 정보 — 마음 전하실 곳 */
  accounts: {
    groom: [
      { bank: '', holder: '', number: '' }
    ],
    bride: [
      { bank: '', holder: '', number: '' }
    ]
  },

  /* 8. 연락처 (전화/문자 버튼) — phone 이 ''이면 해당 버튼 자동 숨김 */
  contacts: {
    groomSide: [
      { label: '신랑', phone: '' },
      { label: '신랑 아버지', phone: '' },
      { label: '신랑 어머니', phone: '' }
    ],
    brideSide: [
      { label: '신부', phone: '' },
      { label: '신부 아버지', phone: '' },
      { label: '신부 어머니', phone: '' }
    ]
  },

  /* 9. 카카오 지도 JS API 키 (비우면 길찾기 링크로 fallback) */
  kakaoMapJsKey: '',

  /* 10. Google Apps Script 웹앱 URL (RSVP·방명록 — 비우면 버튼 disabled) */
  appsScriptUrl: '',

  /* 11. BGM 파일 경로 */
  bgm: 'audio/bgm.mp3',

  /* 12. 카카오톡 공유 SDK 앱 키 (선택) */
  shareKakaoKey: ''

};
