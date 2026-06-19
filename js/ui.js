/**
 * ui.js — 공통 UI 유틸리티
 *
 * 담당:
 *   - 스크롤 페이드인 (IntersectionObserver)
 *   - 토스트 알림 메시지
 *   - 공통 DOM 헬퍼 함수
 *   - 섹션 공통 초기화 (#cover, #greeting, #footer)
 *
 * 의존: config.js (CONFIG 전역 객체)
 * 공용 API (window 노출):
 *   - window.showToast(msg, duration?)
 *   - window.escapeHtml(str)
 */

/* ─────────────────────────────────────────────────────────────────
   1. 공용 헬퍼 함수
───────────────────────────────────────────────────────────────── */

/**
 * escapeHtml(str) — XSS 방지용 HTML 이스케이프
 * 다른 에이전트(guestbook.js 등)가 사용자 입력을 DOM에 삽입할 때 반드시 사용.
 * @param {string} str - 원본 문자열
 * @returns {string} 이스케이프된 문자열
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
window.escapeHtml = escapeHtml;

/**
 * decodeSensitive(encoded) — Base64로 인코딩된 민감정보(계좌·연락처) 디코딩
 * config.js에는 평문 대신 Base64 문자열로 저장하여 소스에 번호가 그대로
 * 노출되는 것을 막는다(봇·자동수집 회피용. 암호화는 아님).
 * UTF-8 안전 디코딩(한글 등). 빈 값/비인코딩 값은 원본을 그대로 반환.
 * @param {string} encoded - Base64 문자열
 * @returns {string} 디코딩된 평문
 */
function decodeSensitive(encoded) {
  if (!encoded) return '';
  try {
    var bin = atob(encoded);
    // UTF-8 디코딩 (한글 등 멀티바이트 안전)
    var bytes = Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    // 인코딩되지 않은 값(평문)이 들어온 경우 그대로 반환
    return encoded;
  }
}
window.decodeSensitive = decodeSensitive;

/**
 * showToast(msg, duration?) — 화면 하단 토스트 메시지 표시
 * 계좌 복사, URL 복사 완료 등 짧은 피드백에 사용.
 * 중복 호출 시 이전 토스트를 즉시 교체한다.
 * @param {string} msg      - 표시할 메시지
 * @param {number} duration - 자동 사라짐 시간(ms), 기본 2200
 */
function showToast(msg, duration) {
  duration = duration || 2200;

  // 이미 표시 중인 토스트가 있으면 제거
  const existing = document.querySelector('.toast');
  if (existing) {
    clearTimeout(existing._hideTimer);
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);

  // 다음 프레임에서 .show 추가해야 CSS transition이 동작
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  toast._hideTimer = setTimeout(() => {
    toast.classList.remove('show');
    // transition 끝난 뒤 DOM에서 제거 (0.3s transition 기준)
    setTimeout(() => toast.remove(), 350);
  }, duration);
}
window.showToast = showToast;


/* ─────────────────────────────────────────────────────────────────
   2. 스크롤 페이드인 (IntersectionObserver)
   .fade-in 요소가 뷰포트 20% 이상 진입하면 .visible 추가
───────────────────────────────────────────────────────────────── */
function initFadeIn() {
  // prefers-reduced-motion 설정 시 즉시 모두 표시
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // 한 번 보이면 더 이상 관찰 불필요
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 } // 뷰포트에 12% 이상 진입 시 트리거
  );

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}


/* ─────────────────────────────────────────────────────────────────
   3. #cover 섹션 렌더링
   CONFIG.mainVisual, groom, bride, wedding 정보로 커버 구성
───────────────────────────────────────────────────────────────── */
function initCover() {
  const section = document.getElementById('cover');
  if (!section) return;

  const g = CONFIG.groom;
  const b = CONFIG.bride;
  const w = CONFIG.wedding;

  // 커버에는 성을 뗀 이름만 표시 (레퍼런스 스타일: "동윤 🤍 영지")
  // 한국 이름 통념상 3글자면 성 1글자 제거, 그 외 길이는 원본 유지(안전)
  const givenName = (full) => (full && full.length === 3) ? full.slice(1) : full;
  const gName = givenName(g.name);
  const bName = givenName(b.name);

  // 캐시 무효화: 이미지 src 뒤에 ?v=버전 부착
  const ver = CONFIG.assetVersion ? ('?v=' + CONFIG.assetVersion) : '';
  const mainSrc = CONFIG.mainVisual ? (CONFIG.mainVisual + ver) : '';

  section.innerHTML = `
    <!-- 사진 레이어 (인물이 가려지지 않도록 글자와 분리) -->
    <div class="cover-photo" id="cover-photo">
      <img class="cover-img" id="cover-img"
           src="${escapeHtml(mainSrc)}"
           alt="${escapeHtml(g.name)}과 ${escapeHtml(b.name)}의 결혼식 대표 사진" />
    </div>

    <!-- 콘텐츠 레이어 (사진 아래) -->
    <div class="cover-content">
      <!-- 상단 영문 레이블 -->
      <p class="cover-label">We are getting married</p>

      <!-- 신랑 🤍 신부 이름 (성 제외, 명조) -->
      <div class="cover-names">
        <span class="cover-name">${escapeHtml(gName)}</span>
        <span class="cover-heart">🤍</span>
        <span class="cover-name">${escapeHtml(bName)}</span>
      </div>

      <!-- 날짜 -->
      <p class="cover-date">${escapeHtml(w.dateText)}</p>

      <!-- 예식장명 -->
      <p class="cover-venue">${escapeHtml(w.venue)}</p>
    </div>
  `;

  // 이미지 로드 실패 시 placeholder 처리
  const imgEl = document.getElementById('cover-img');
  const photoEl = document.getElementById('cover-photo');
  if (CONFIG.mainVisual && imgEl) {
    imgEl.onerror = () => {
      imgEl.style.display = 'none';
      photoEl.classList.add('img-placeholder');
    };
  } else if (photoEl) {
    photoEl.classList.add('img-placeholder');
  }
}


/* ─────────────────────────────────────────────────────────────────
   4. #greeting 섹션 렌더링
   CONFIG.greeting(\n→줄바꿈), 양가 혼주 표기
───────────────────────────────────────────────────────────────── */
function initGreeting() {
  const section = document.getElementById('greeting');
  if (!section) return;

  const g = CONFIG.groom;
  const b = CONFIG.bride;

  // 혼주 라인 생성 헬퍼
  // 예: "홍판서 · 춘섬의 장남 홍길동"
  function buildParentsLine(father, mother, order, name) {
    const parents = [father, mother].filter(Boolean).join(' · ');
    return `${escapeHtml(parents)}의 ${escapeHtml(order)} ${escapeHtml(name)}`;
  }

  section.innerHTML = `
    <h2 class="section-title">
      <span class="en">Invitation</span>
      인사말
    </h2>

    <!-- 인사말 본문: white-space:pre-line으로 \n 처리 -->
    <div class="greeting-text font-display">${escapeHtml(CONFIG.greeting)}</div>

    <!-- 양가 혼주 표기 -->
    <div class="greeting-parents">
      <div class="greeting-parents-row">
        <span class="greeting-parents-label">신랑측</span>
        <span class="greeting-parents-line">${buildParentsLine(g.father, g.mother, g.order, g.name)}</span>
      </div>
      <div class="greeting-parents-row">
        <span class="greeting-parents-label">신부측</span>
        <span class="greeting-parents-line">${buildParentsLine(b.father, b.mother, b.order, b.name)}</span>
      </div>
    </div>
  `;
}


/* ─────────────────────────────────────────────────────────────────
   5. #footer 섹션 렌더링
   신랑♡신부 이름 + 연도 기반 카피라이트
───────────────────────────────────────────────────────────────── */
function initFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;

  const g = CONFIG.groom;
  const b = CONFIG.bride;
  const year = new Date(CONFIG.wedding.date).getFullYear();

  footer.innerHTML = `
    <p class="footer-names font-display">${escapeHtml(g.name)} ♡ ${escapeHtml(b.name)}</p>
    <p class="footer-copy">&copy; ${year}. All rights reserved.</p>
  `;
}


/* ─────────────────────────────────────────────────────────────────
   6. 초기화 진입점
───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initCover();
  initGreeting();
  initFooter();
  initFadeIn();
});
