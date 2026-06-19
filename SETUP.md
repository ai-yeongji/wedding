# 📖 청첩장 설정 & 배포 가이드

이 문서만 따라 하면 **내 데이터로 교체 → 무료 배포**까지 끝납니다.
코드는 건드릴 필요 없고, 대부분 `js/config.js` 한 파일만 고치면 됩니다.

---

## 0. 한눈에 보는 순서

1. [내 정보 입력 (`js/config.js`)](#1-내-정보-입력)
2. [사진 넣기](#2-사진-넣기)
3. [배경음악 넣기 (선택)](#3-배경음악-넣기-선택)
4. [RSVP·방명록 백엔드 연결 (Google Apps Script)](#4-rsvp방명록-백엔드-연결)
5. [지도 설정 (선택)](#5-지도-설정-선택)
6. [GitHub Pages로 배포](#6-github-pages로-배포)
7. [공유 미리보기(OG 태그) 마무리](#7-공유-미리보기-마무리)

> 💡 4·5번(백엔드·지도)은 비워둬도 사이트는 정상 작동합니다. 해당 버튼만 "준비 중"으로 비활성화됩니다. 나중에 채워도 됩니다.

---

## 1. 내 정보 입력

`js/config.js` 파일을 열어 값만 바꾸세요. **따옴표 안의 글자만** 수정하면 됩니다.

```js
groom: {            // 신랑
  name: '홍길동',          // 한글 이름
  nameEn: 'Hong Gildong',  // 영문 이름
  father: '홍판서',         // 신랑 아버지
  mother: '춘섬',           // 신랑 어머니
  order: '아들',            // '장남' / '차남' / '아들' 등
  phone: '010-0000-0000'   // 신랑 연락처
},
bride: { ... },     // 신부 (위와 동일 구조, '장녀'/'차녀'/'딸')

wedding: {
  date: '2027-01-24T13:10:00',   // ★ 카운트다운/달력 계산용 (YYYY-MM-DDTHH:mm:ss)
  dateText: '2027년 1월 24일 일요일 오후 1시 10분',  // 화면 표시용 문구
  venue: '여의도 웨딩컨벤션',     // 예식장 이름
  hall: '3층 그랜드홀',          // 홀/층
  address: '서울특별시 영등포구 여의대로 14',  // 도로명 주소
  lat: 37.5216243,               // 위도  (지도용 — 5번 참고)
  lng: 126.919167                // 경도
},

greeting: '인사말...\n줄바꿈은 \\n 으로',   // 인사말 (\n = 줄바꿈)

accounts: {         // 마음 전하실 곳 (계좌)
  groom: [ { bank: '국민은행', holder: '홍길동', number: '000000-00-000000' } ],
  bride: [ { bank: '신한은행', holder: '성춘향', number: '000-000-000000' } ]
  // 여러 계좌면 { ... }, { ... } 처럼 콤마로 추가
},

contacts: {         // 전화/문자 버튼 (phone이 ''이면 그 버튼은 자동 숨김)
  groomSide: [ { label: '신랑', phone: '010-...' }, { label: '신랑 아버지', phone: '' }, ... ],
  brideSide: [ ... ]
},
```

> ⚠️ **주의**: 각 줄 끝의 콤마(`,`)와 따옴표(`'`)를 지우지 마세요. 구조가 깨지면 페이지가 안 뜹니다.
> 수정 후 `node --check js/config.js` 로 문법 확인 가능 (선택).

---

## 2. 사진 넣기

`images/` 폴더에 아래 파일명으로 사진을 넣으세요. **이미 원본 24장이 `images/raw_images/`에 있고, 그중 추려서 최적화한 사진이 배치되어 있습니다.**

| 파일명 | 용도 | 현재 상태 |
|---|---|---|
| `images/main_visual.jpg` | 커버(대표) 사진 — 세로형 권장 | ✅ 배치됨 |
| `images/g1.jpg` ~ `g8.jpg` | 갤러리 8장 | ✅ 배치됨 |

**다른 사진으로 바꾸려면**: 같은 파일명으로 덮어쓰거나, `images/raw_images/`의 원본을 골라
`sips -Z 1200 원본.JPEG --out images/g1.jpg` 처럼 줄여서 교체하세요. (한 장당 1MB 이하 권장)

갤러리 장수를 늘리거나 줄이려면 `config.js`의 `gallery: [...]` 배열을 수정하면 됩니다.

---

## 3. 배경음악 넣기 (선택)

1. 저작권 문제 없는 음원(또는 본인 보유 음원) `mp3` 파일을 준비.
2. `audio/bgm.mp3` 로 저장 (파일명 그대로).
3. 끝. 우측 상단 ♪ 버튼으로 켜고 끌 수 있습니다.

> 파일이 없으면 ♪ 버튼은 자동으로 숨겨집니다. 다른 파일명을 쓰려면 `config.js`의 `bgm: 'audio/...'` 수정.
> 📌 모바일 브라우저는 자동재생을 막으므로, 방문자가 화면을 한 번 터치하면 재생됩니다.

---

## 4. RSVP·방명록 백엔드 연결

RSVP(참석여부)와 방명록을 실제로 **저장·조회**하려면 Google Sheets + Apps Script를 연결합니다. (무료, Google 계정만 있으면 됨)

### 4-1. 스프레드시트 만들기
1. [sheets.new](https://sheets.new) 로 새 구글 시트 생성. 이름은 자유 (예: "청첩장 응답").

### 4-2. 스크립트 붙여넣기
2. 시트 상단 메뉴 **확장 프로그램 → Apps Script** 클릭.
3. 열린 편집기의 기존 코드를 모두 지우고, 이 프로젝트의 **`apps-script/Code.gs`** 내용을 전부 복사해 붙여넣기.
4. 💾 저장 (Ctrl/Cmd + S).

### 4-3. 웹 앱으로 배포
5. 우측 상단 **배포 → 새 배포** 클릭.
6. 톱니바퀴(유형 선택) → **웹 앱** 선택.
7. 설정:
   - 실행 계정: **나(본인)**
   - 액세스 권한: **모든 사용자** ← 꼭 이걸로 (방문자가 호출해야 하므로)
8. **배포** → 권한 승인(본인 계정) → 완료되면 나오는 **웹 앱 URL** 복사.
   (`https://script.google.com/macros/s/........./exec` 형태)

### 4-4. URL 연결
9. `js/config.js` 의 `appsScriptUrl: ''` 에 복사한 URL을 붙여넣기:
   ```js
   appsScriptUrl: 'https://script.google.com/macros/s/.../exec',
   ```
10. 끝! 이제 RSVP·방명록이 시트의 `RSVP` / `Guestbook` 탭에 자동 기록됩니다. (탭은 첫 제출 시 자동 생성)

> 🔒 방명록 비밀번호는 시트에 **평문 저장하지 않고 해시(SHA-256)** 로만 저장됩니다.
> 코드를 수정한 뒤에는 **새 버전으로 다시 배포**해야 반영됩니다 (배포 → 배포 관리 → 편집 → 새 버전).

---

## 5. 지도 설정 (선택)

기본값(키 없음)으로도 **길찾기 버튼(네이버/카카오/티맵)과 "구글지도에서 보기"** 는 동작합니다.
지도를 페이지에 **임베드(직접 표시)** 하려면 카카오 키가 필요합니다.

1. 예식장 **좌표(위경도)** 확인 → `config.js`의 `lat`, `lng` 입력.
   - 👍 **구글맵(가장 쉬움)**: [google.com/maps](https://www.google.com/maps)에서 예식장 검색 → 핀 **우클릭** → 맨 위에 뜨는 `위도, 경도` 숫자 클릭(복사됨).
   - ⚠️ 카카오맵 웹은 핀 우클릭으로 좌표가 안 나옵니다(빈 지점 클릭해야 함). 구글맵을 권장.
   - (현재 노블발렌티 대치점 좌표는 카카오 공식 데이터에서 추출해 입력되어 있음)
2. 카카오 지도 임베드(선택): [Kakao Developers](https://developers.kakao.com) → 애플리케이션 추가 →
   **JavaScript 키** 발급 → **플랫폼 > Web**에 배포 도메인(예: `https://내아이디.github.io`) 등록 →
   `config.js`의 `kakaoMapJsKey: ''` 에 입력.

> 카카오톡 공유 버튼도 같은 방식으로 `shareKakaoKey`에 JavaScript 키를 넣으면 활성화됩니다. (없으면 "링크 복사"만 표시)

---

## 6. GitHub Pages로 배포

무료로 `https://내아이디.github.io/` 주소를 받습니다.

> 🔐 **개인정보 보호 구조 (중요)**
> - `js/config.js` (실제 이름·계좌·연락처) 는 `.gitignore` 에 등록되어 **git/GitHub 저장소·히스토리에 올라가지 않습니다.**
> - 저장소에는 빈 템플릿 `js/config.sample.js` 만 공개됩니다.
> - `index.html` 의 `noindex` 메타 + `robots.txt` 로 **검색엔진·봇 수집을 차단**합니다.
> - ⚠️ 단, **배포된 웹페이지는 config.js 를 불러와야 작동**하므로, 배포 시에는 config.js 가 사이트에 포함됩니다.
>   → 즉 계좌·연락처는 git 코드엔 안 남지만, **사이트 접속자가 개발자도구(F12)로는 볼 수 있습니다** (모든 청첩장 공통).
>   더 강하게 숨기려면 계좌·연락처를 백엔드(Apps Script)에서 내려주는 방식이 필요합니다.

### 배포 방법 — config.js를 포함해서 올리기

`.gitignore` 때문에 일반 `git add .` 로는 config.js가 안 올라갑니다. 배포 브랜치에는 **강제로 포함**시켜야 합니다.

```bash
cd /Users/yeongji/Documents/LLM/w-agent

# 1) (최초 1회) 저장소 만들고 config 없이 코드부터 올리기
git add -A
git commit -m "feat: 모바일 청첩장"
git branch -M main
gh repo create ai-yeongji.github.io --public --source=. --remote=origin --push

# 2) 실제 데이터가 든 config.js를 배포에만 강제 포함 (-f = .gitignore 무시)
git add -f js/config.js
git commit -m "deploy: config 포함"
git push

# 3) GitHub Pages 활성화
#    Settings → Pages → Source: Deploy from a branch → main / (root) → Save
#    또는: gh api -X POST repos/ai-yeongji/ai-yeongji.github.io/pages -f source.branch=main -f source.path=/
```

1~2분 후 `https://ai-yeongji.github.io/` 에서 확인됩니다.

> 💡 정보를 수정하면 `git add -f js/config.js && git commit -m "update" && git push` 로 다시 올리면 됩니다.
> 💡 GitHub Pages는 **HTTPS**라 클립보드 복사·BGM이 정상 동작합니다.
>
> 📌 **계좌·연락처를 git 히스토리에 정말 1줄도 안 남기고 싶다면**: 위 2번을 생략하고,
> config.js를 GitHub 웹 UI에서 직접 업로드(Add file → Upload)하거나, 배포용 임시 브랜치에만 올리는 방법도 있습니다.
> 가장 확실한 건 [별도 문서의 "백엔드 분리" 방식](#) 이지만 설정이 더 복잡합니다. 필요하면 도와드릴 수 있습니다.

---

## 7. 공유 미리보기 마무리

카카오톡/SNS로 링크를 보낼 때 뜨는 미리보기(제목·이미지)를 맞추려면,
`index.html` 상단의 **Open Graph 태그**에서 `https://example.com` 을 실제 배포 주소로 바꾸세요:

```html
<meta property="og:title"       content="홍길동 ♡ 성춘향 결혼합니다" />
<meta property="og:image"       content="https://내아이디.github.io/wedding-card/images/main_visual.jpg" />
<meta property="og:url"         content="https://내아이디.github.io/wedding-card/" />
```

---

## 🧪 로컬에서 미리보기

```bash
cd /Users/yeongji/Documents/LLM/w-agent
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

---

## ✅ 최종 체크리스트

- [ ] `config.js` — 이름/날짜/장소/계좌/연락처 내 정보로 교체
- [ ] `images/main_visual.jpg`, `g1~g8.jpg` 사진 확인
- [ ] (선택) `audio/bgm.mp3` 배경음악
- [ ] (선택) Apps Script 배포 → `appsScriptUrl` 입력 → RSVP·방명록 테스트
- [ ] (선택) `lat`/`lng`, `kakaoMapJsKey`, `shareKakaoKey`
- [ ] GitHub Pages 배포
- [ ] OG 태그 URL을 실제 주소로 교체
- [ ] 📱 실제 휴대폰에서 최종 확인
