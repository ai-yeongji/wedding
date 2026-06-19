/**
 * guestbook.js — 방명록 섹션 + 모달 폼
 *
 * 담당:
 *   - #guestbook 섹션: "축하의 한마디" 제목 + 목록 + "방명록 남기기" 버튼
 *   - 로드 시 GET으로 방명록 목록 패치 → 카드 렌더링 (escapeHtml로 XSS 방지)
 *   - "방명록 남기기" 클릭 → #modal-root에 모달 폼 생성
 *   - 모달 폼: 이름, 비밀번호(삭제용), 메시지 → POST (type:'guestbook')
 *   - 성공 시 목록 새로고침 + 토스트 / 실패 시 모달 내 오류 메시지
 *   - CONFIG.appsScriptUrl 비어있으면 목록 "준비 중" 안내, 버튼 disabled
 *
 * 의존: config.js (CONFIG), ui.js (window.showToast, window.escapeHtml)
 * 렌더링 대상: #guestbook 섹션, #modal-root
 */

/* ─────────────────────────────────────────────────────────────────
   XSS 방지 헬퍼 — ui.js가 먼저 로드되면 그것을 사용, 없으면 자체 구현
───────────────────────────────────────────────────────────────── */
var gbEsc = window.escapeHtml || function(s) {
  return String(s).replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/* ─────────────────────────────────────────────────────────────────
   토스트 헬퍼 fallback
───────────────────────────────────────────────────────────────── */
var gbToast = window.showToast || function(msg) {
  alert(msg);
};


/* ─────────────────────────────────────────────────────────────────
   상수
───────────────────────────────────────────────────────────────── */
var GB_MODAL_ID = 'gb-modal';
var GB_LIST_ID  = 'gb-list';


/* ─────────────────────────────────────────────────────────────────
   formatDate(timestampStr)
   서버에서 받은 'YYYY-MM-DD HH:mm:ss' 문자열을
   'YYYY.MM.DD' 형태로 변환한다.
───────────────────────────────────────────────────────────────── */
function formatDate(timestampStr) {
  if (!timestampStr) return '';
  // 'YYYY-MM-DD HH:mm:ss' 또는 ISO 형식 모두 처리
  var parts = String(timestampStr).split(/[\s-]/);
  if (parts.length >= 3) {
    return parts[0] + '.' + parts[1] + '.' + parts[2].substring(0, 2);
  }
  return String(timestampStr).substring(0, 10).replace(/-/g, '.');
}


/* ─────────────────────────────────────────────────────────────────
   renderGuestbookList(entries)
   방명록 카드 목록을 #gb-list 요소에 렌더링한다.
   entries = [{ name, message, timestamp }, ...]
───────────────────────────────────────────────────────────────── */
function renderGuestbookList(entries) {
  var listEl = document.getElementById(GB_LIST_ID);
  if (!listEl) return;

  if (!entries || entries.length === 0) {
    listEl.innerHTML = [
      '<div class="gb-empty">',
        '<p class="gb-empty-text text-muted">아직 방명록이 없습니다.<br>첫 번째 축하 메시지를 남겨보세요!</p>',
      '</div>'
    ].join('');
    return;
  }

  // 카드 렌더링 — 모든 사용자 입력은 gbEsc()로 이스케이프
  var html = entries.map(function(entry) {
    return [
      '<article class="gb-card">',
        '<div class="gb-card-header">',
          '<span class="gb-card-name">', gbEsc(entry.name), '</span>',
          '<span class="gb-card-date">', gbEsc(formatDate(entry.timestamp)), '</span>',
        '</div>',
        '<p class="gb-card-message">', gbEsc(entry.message), '</p>',
      '</article>'
    ].join('');
  }).join('');

  listEl.innerHTML = html;
}


/* ─────────────────────────────────────────────────────────────────
   setGuestbookListState(state, errorMsg?)
   목록 영역의 로딩/오류/준비중 상태를 표시한다.
   state: 'loading' | 'error' | 'unavailable'
───────────────────────────────────────────────────────────────── */
function setGuestbookListState(state, errorMsg) {
  var listEl = document.getElementById(GB_LIST_ID);
  if (!listEl) return;

  if (state === 'loading') {
    listEl.innerHTML = [
      '<div class="gb-loading">',
        '<span class="spinner" aria-hidden="true"></span>',
        '<span class="gb-loading-text">방명록 불러오는 중…</span>',
      '</div>'
    ].join('');
  } else if (state === 'error') {
    var msg = errorMsg || '방명록을 불러오지 못했습니다.';
    listEl.innerHTML = [
      '<div class="gb-error error-message">',
        '<p>', gbEsc(msg), '</p>',
        '<button type="button" class="btn btn--outline gb-retry-btn">다시 시도</button>',
      '</div>'
    ].join('');
    var retryBtn = listEl.querySelector('.gb-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', loadGuestbookList);
    }
  } else if (state === 'unavailable') {
    listEl.innerHTML = [
      '<div class="gb-unavailable text-muted">',
        '<p>방명록 기능을 준비 중입니다.</p>',
      '</div>'
    ].join('');
  }
}


/* ─────────────────────────────────────────────────────────────────
   loadGuestbookList()
   서버에서 방명록 목록을 GET으로 가져와 렌더링한다.
───────────────────────────────────────────────────────────────── */
function loadGuestbookList() {
  var url = (typeof CONFIG !== 'undefined') ? CONFIG.appsScriptUrl : '';
  if (!url) {
    setGuestbookListState('unavailable');
    return;
  }

  setGuestbookListState('loading');

  fetch(url + '?type=guestbook', {
    method: 'GET'
  })
  .then(function(res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
  .then(function(data) {
    if (data.ok) {
      renderGuestbookList(data.data || []);
    } else {
      setGuestbookListState('error', data.message || '오류가 발생했습니다.');
    }
  })
  .catch(function() {
    setGuestbookListState('error', '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.');
  });
}


/* ─────────────────────────────────────────────────────────────────
   openGuestbookModal()
   #modal-root에 방명록 작성 모달을 삽입하고 표시한다.
───────────────────────────────────────────────────────────────── */
function openGuestbookModal() {
  var modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  // body 스크롤 잠금
  document.body.style.overflow = 'hidden';

  modalRoot.innerHTML = [
    '<div class="modal-content gb-modal-content" id="', GB_MODAL_ID, '" role="document">',
      '<button class="modal-close gb-modal-close" aria-label="닫기" type="button">&times;</button>',
      '<div class="gb-modal-inner">',
        '<h3 class="gb-modal-title font-display">방명록 남기기</h3>',

        /* 에러/성공 메시지 영역 */
        '<div id="gb-msg" class="gb-msg" role="alert" aria-live="polite"></div>',

        '<form id="gb-form" class="gb-form" novalidate>',

          /* 이름 */
          '<div class="gb-field">',
            '<label class="gb-label" for="gb-name">',
              '이름 <span class="gb-required">*</span>',
            '</label>',
            '<input type="text" id="gb-name" name="name" class="gb-input"',
              ' placeholder="홍길동" autocomplete="name" maxlength="20">',
          '</div>',

          /* 비밀번호 (삭제용) */
          '<div class="gb-field">',
            '<label class="gb-label" for="gb-password">',
              '비밀번호 <span class="gb-label-sub">(삭제 시 사용)</span>',
            '</label>',
            '<input type="password" id="gb-password" name="password" class="gb-input"',
              ' placeholder="숫자 4자리 이상" maxlength="30" autocomplete="new-password">',
          '</div>',

          /* 메시지 */
          '<div class="gb-field">',
            '<label class="gb-label" for="gb-message">',
              '메시지 <span class="gb-required">*</span>',
            '</label>',
            '<textarea id="gb-message" name="message" class="gb-textarea"',
              ' placeholder="따뜻한 축하 메시지를 남겨주세요." maxlength="300" rows="4"></textarea>',
          '</div>',

          /* 제출/취소 버튼 */
          '<div class="gb-btn-row">',
            '<button type="button" class="btn btn--ghost gb-cancel-btn">취소</button>',
            '<button type="submit" class="btn btn--primary gb-submit-btn" id="gb-submit">',
              '등록하기',
            '</button>',
          '</div>',

        '</form>',
      '</div>',
    '</div>'
  ].join('');

  // 모달 루트 표시 + 접근성 속성 설정
  modalRoot.setAttribute('role', 'dialog');
  modalRoot.setAttribute('aria-modal', 'true');
  modalRoot.setAttribute('aria-hidden', 'false');

  // 이벤트 바인딩
  var form      = document.getElementById('gb-form');
  var closeBtn  = modalRoot.querySelector('.gb-modal-close');
  var cancelBtn = modalRoot.querySelector('.gb-cancel-btn');

  closeBtn.addEventListener('click', closeGuestbookModal);
  cancelBtn.addEventListener('click', closeGuestbookModal);

  // 배경(오버레이) 클릭으로 닫기
  modalRoot.addEventListener('click', function onOverlayClick(ev) {
    if (ev.target === modalRoot) {
      closeGuestbookModal();
      modalRoot.removeEventListener('click', onOverlayClick);
    }
  });

  // ESC 키로 닫기
  document.addEventListener('keydown', onGbEsc);

  // 포커스 트랩: Tab/Shift+Tab이 모달 내 포커스 가능 요소들 사이에서만 순환
  document.addEventListener('keydown', trapGbFocus);

  // 폼 제출
  form.addEventListener('submit', handleGuestbookSubmit);

  // 첫 입력 필드에 포커스
  var nameInput = document.getElementById('gb-name');
  if (nameInput) nameInput.focus();
}


/* ─────────────────────────────────────────────────────────────────
   closeGuestbookModal()
   모달을 닫고 body 스크롤 복원, ESC 리스너 제거
───────────────────────────────────────────────────────────────── */
function closeGuestbookModal() {
  var modalRoot = document.getElementById('modal-root');
  if (modalRoot) {
    modalRoot.removeAttribute('role');
    modalRoot.removeAttribute('aria-modal');
    modalRoot.setAttribute('aria-hidden', 'true');
    modalRoot.innerHTML = '';
  }
  document.body.style.overflow = '';
  document.removeEventListener('keydown', onGbEsc);
  document.removeEventListener('keydown', trapGbFocus);
}


/* ─────────────────────────────────────────────────────────────────
   onGbEsc(e)
   ESC 키 이벤트 핸들러 (모달 열린 동안만 등록)
───────────────────────────────────────────────────────────────── */
function onGbEsc(e) {
  if (e.key === 'Escape' || e.keyCode === 27) {
    closeGuestbookModal();
  }
}


/* ─────────────────────────────────────────────────────────────────
   trapGbFocus(e)
   Tab/Shift+Tab 이동을 모달 내 포커스 가능 요소로 제한한다.
───────────────────────────────────────────────────────────────── */
function trapGbFocus(e) {
  if (e.key !== 'Tab') return;
  var modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;
  var focusable = modalRoot.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return;
  var first = focusable[0];
  var last  = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}


/* ─────────────────────────────────────────────────────────────────
   showGbMsg(text, isError)
   모달 내 메시지 영역에 오류 또는 성공 메시지를 표시한다.
───────────────────────────────────────────────────────────────── */
function showGbMsg(text, isError) {
  var msgEl = document.getElementById('gb-msg');
  if (!msgEl) return;
  msgEl.className = 'gb-msg ' + (isError ? 'error-message' : 'success-message');
  msgEl.textContent = text;
}


/* ─────────────────────────────────────────────────────────────────
   setGbLoading(isLoading)
   제출 버튼을 스피너/원래 텍스트로 전환한다.
───────────────────────────────────────────────────────────────── */
function setGbLoading(isLoading) {
  var btn = document.getElementById('gb-submit');
  if (!btn) return;
  if (isLoading) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> 등록 중…';
  } else {
    btn.disabled = false;
    btn.innerHTML = '등록하기';
  }
}


/* ─────────────────────────────────────────────────────────────────
   handleGuestbookSubmit(e)
   폼 제출 이벤트 처리: 유효성 검사 → fetch POST → 결과 처리
───────────────────────────────────────────────────────────────── */
function handleGuestbookSubmit(e) {
  e.preventDefault();

  var form = e.target;
  var name     = (form.elements['name']     ? form.elements['name'].value.trim()    : '');
  var password = (form.elements['password'] ? form.elements['password'].value       : '');
  var message  = (form.elements['message']  ? form.elements['message'].value.trim() : '');

  // 클라이언트 유효성 검사
  if (!name) {
    showGbMsg('이름을 입력해 주세요.', true);
    var nameInput = document.getElementById('gb-name');
    if (nameInput) nameInput.focus();
    return;
  }
  if (!message) {
    showGbMsg('메시지를 입력해 주세요.', true);
    var msgInput = document.getElementById('gb-message');
    if (msgInput) msgInput.focus();
    return;
  }

  var url = (typeof CONFIG !== 'undefined') ? CONFIG.appsScriptUrl : '';
  if (!url) {
    showGbMsg('현재 방명록 기능을 준비 중입니다.', true);
    return;
  }

  var payload = {
    type:     'guestbook',
    name:     name,
    password: password,   // 평문 전송 — 서버에서 SHA-256 해시 후 저장
    message:  message
  };

  setGbLoading(true);

  /* ── fetch POST
     Content-Type: text/plain;charset=utf-8
     → Simple Request → CORS preflight 회피
     서버(Code.gs doPost)에서 e.postData.contents를 JSON.parse 한다.
  ── */
  fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body:    JSON.stringify(payload)
  })
  .then(function(res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
  .then(function(data) {
    setGbLoading(false);
    if (data.ok) {
      closeGuestbookModal();
      gbToast('방명록이 등록되었습니다. 감사합니다!');
      // 목록 새로고침
      loadGuestbookList();
    } else {
      showGbMsg(data.message || '등록 중 오류가 발생했습니다.', true);
    }
  })
  .catch(function() {
    setGbLoading(false);
    showGbMsg('네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.', true);
  });
}


/* ─────────────────────────────────────────────────────────────────
   initGuestbook()
   #guestbook 섹션 구조를 렌더링하고 목록을 로드한다.
───────────────────────────────────────────────────────────────── */
function initGuestbook() {
  var section = document.getElementById('guestbook');
  if (!section) return;

  var hasUrl = (typeof CONFIG !== 'undefined') && !!CONFIG.appsScriptUrl;

  section.innerHTML = [
    '<h2 class="section-title">',
      '<span class="en">Guestbook</span>',
      '방명록',
    '</h2>',

    '<p class="gb-intro-text">',
      '축하의 한마디를 남겨주세요.',
    '</p>',

    /* 방명록 목록 영역 */
    '<div class="gb-list-wrap">',
      '<div id="', GB_LIST_ID, '" class="gb-list" aria-live="polite"></div>',
    '</div>',

    /* 방명록 남기기 버튼 */
    '<div class="gb-action text-center">',
      '<button',
        ' type="button"',
        ' class="btn btn--primary gb-open-btn"',
        hasUrl ? '' : ' disabled aria-disabled="true"',
        ' id="gb-open-btn"',
      '>',
        '방명록 남기기',
      '</button>',
    '</div>'
  ].join('');

  // 목록 초기 로드
  loadGuestbookList();

  // 버튼 이벤트 (URL 있을 때만)
  if (hasUrl) {
    var openBtn = document.getElementById('gb-open-btn');
    if (openBtn) {
      openBtn.addEventListener('click', openGuestbookModal);
    }
  }
}


/* ─────────────────────────────────────────────────────────────────
   DOMContentLoaded 진입점
───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  initGuestbook();
});
