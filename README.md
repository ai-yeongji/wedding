# 💌 모바일 청첩장 (Mobile Wedding Invitation)

순수 HTML/CSS/JS로 만든 **모바일 청첩장**입니다. 빌드 도구·프레임워크 없이 GitHub Pages 같은 정적 호스팅에 그대로 올릴 수 있습니다.

> 레퍼런스 포맷 기반 재구현 · 데이터/사진은 `js/config.js`로 교체.

## ✨ 구성

커버 → 인사말 → 달력+D-Day 카운트다운 → 갤러리(스와이프) → 오시는 길(지도·길찾기) → 마음 전하실 곳(계좌) → 참석여부(RSVP) → 방명록 → 공유 → 푸터, 그리고 배경음악 토글.

## 🚀 시작하기

**모든 설정·배포 방법은 [SETUP.md](SETUP.md) 를 참고하세요.**

핵심: `js/config.js` 한 파일에 모든 데이터(이름·날짜·장소·계좌·사진 목록 등)가 모여 있습니다. 이 파일만 수정하면 됩니다.

```bash
# 로컬 미리보기
python3 -m http.server 8000   # → http://localhost:8000
```

## 📁 구조

```
├─ index.html          단일 페이지
├─ css/style.css       스타일 (CSS 변수 기반 테마)
├─ js/
│  ├─ config.js        ★ 모든 데이터 (여기만 수정)
│  ├─ ui.js            커버·인사말·푸터·스크롤 애니메이션·토스트
│  ├─ countdown.js     달력 + D-Day 카운트다운
│  ├─ gallery.js       갤러리 캐러셀 + 라이트박스
│  ├─ map.js           지도 + 길찾기 + 연락처
│  ├─ extras.js        계좌 아코디언 + 공유
│  ├─ rsvp.js          참석여부 폼
│  ├─ guestbook.js     방명록
│  └─ bgm.js           배경음악 토글
├─ images/             사진 (main_visual.jpg, g1~g8.jpg)
├─ audio/              bgm.mp3 (선택)
└─ apps-script/Code.gs RSVP·방명록 백엔드 (Google Apps Script)
```

## 🔧 기술

- Vanilla JS (의존성 0), CSS 변수 테마, IntersectionObserver 스크롤 애니메이션
- RSVP·방명록: **Google Apps Script + Sheets** (서버리스, 무료)
- 보안: 사용자 입력 XSS 이스케이프, 방명록 비밀번호 SHA-256 해시, 시트 수식 인젝션 방어
- 접근성: 모달 `role="dialog"`·포커스 트랩·ESC 닫기, 사용자 핀치-줌 허용

## 📝 라이선스

개인 청첩장 용도. 사진·음원의 저작권은 각 권리자에게 있습니다.
