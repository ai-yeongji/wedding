/**
 * rsvp.js — 참석 여부 섹션 + 모달 폼
 *
 * 담당:
 *   - #rsvp 섹션: 안내 문구 + "참석 여부 전달하기" 버튼 렌더링
 *   - 버튼 클릭 → #modal-root에 모달 폼 생성
 *   - 모달 폼: 구분(신랑측/신부측), 참석여부, 이름(필수), 동행 인원, 식사 여부, 메시지
 *   - 유효성 검사 후 fetch POST (Content-Type: text/plain, CORS preflight 회피)
 *   - 로딩 스피너 → 성공 토스트 + 모달 닫기 / 실패 토스트
 *   - CONFIG.appsScriptUrl 비어있으면 버튼 disabled + "준비 중" 안내
 *
 * 의존: config.js (CONFIG), ui.js (window.showToast, window.escapeHtml)
 * 렌더링 대상: #rsvp 섹션, #modal-root
 */

/* ─────────────────────────────────────────────────────────────────
   XSS 방지 헬퍼 — ui.js가 먼저 로드되면 그것을 사용, 없으면 자체 구현
───────────────────────────────────────────────────────────────── */
var esc = window.escapeHtml || function(s) {
  return String(s).replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/* ─────────────────────────────────────────────────────────────────
   토스트 헬퍼 fallback
───────────────────────────────────────────────────────────────── */
var toast = window.showToast || function(msg) {
  alert(msg);
};


/* ─────────────────────────────────────────────────────────────────
   상수
───────────────────────────────────────────────────────────────── */
var RSVP_MODAL_ID = 'rsvp-modal';


/* ─────────────────────────────────────────────────────────────────
   openRsvpModal()
   #modal-root에 참석 여부 모달 폼을 삽입하고 표시한다.
───────────────────────────────────────────────────────────────── */
function openRsvpModal() {
  var modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  // body 스크롤 잠금
  document.body.style.overflow = 'hidden';

  modalRoot.innerHTML = [
    '<div class="modal-content rsvp-modal-content" id="', RSVP_MODAL_ID, '" role="document">',
      '<button class="modal-close rsvp-modal-close" aria-label="닫기" type="button">&times;</button>',
      '<div class="rsvp-modal-inner">',
        '<h3 class="rsvp-modal-title font-display">참석 여부 전달</h3>',

        /* ── 에러/성공 메시지 영역 ── */
        '<div id="rsvp-msg" class="rsvp-msg" role="alert" aria-live="polite"></div>',

        '<form id="rsvp-form" class="rsvp-form" novalidate>',

          /* 구분: 신랑측 / 신부측 토글 */
          '<div class="rsvp-field">',
            '<span class="rsvp-label">구분 <span class="rsvp-required">*</span></span>',
            '<div class="rsvp-toggle-group" role="group" aria-label="구분 선택">',
              '<label class="rsvp-toggle-label">',
                '<input type="radio" name="side" value="신랑측" checked class="rsvp-radio">',
                '<span class="rsvp-toggle-btn">신랑측</span>',
              '</label>',
              '<label class="rsvp-toggle-label">',
                '<input type="radio" name="side" value="신부측" class="rsvp-radio">',
                '<span class="rsvp-toggle-btn">신부측</span>',
              '</label>',
            '</div>',
          '</div>',

          /* 참석 여부 */
          '<div class="rsvp-field">',
            '<span class="rsvp-label">참석 여부 <span class="rsvp-required">*</span></span>',
            '<div class="rsvp-toggle-group" role="group" aria-label="참석 여부 선택">',
              '<label class="rsvp-toggle-label">',
                '<input type="radio" name="attendance" value="참석" checked class="rsvp-radio">',
                '<span class="rsvp-toggle-btn">참석</span>',
              '</label>',
              '<label class="rsvp-toggle-label">',
                '<input type="radio" name="attendance" value="불참" class="rsvp-radio">',
                '<span class="rsvp-toggle-btn">불참</span>',
              '</label>',
            '</div>',
          '</div>',

          /* 이름 */
          '<div class="rsvp-field">',
            '<label class="rsvp-label" for="rsvp-name">',
              '이름 <span class="rsvp-required">*</span>',
            '</label>',
            '<input type="text" id="rsvp-name" name="name" class="rsvp-input"',
              ' placeholder="홍길동" autocomplete="name" maxlength="20">',
          '</div>',

          /* 동행 인원 */
          '<div class="rsvp-field">',
            '<label class="rsvp-label" for="rsvp-party">동행 인원</label>',
            '<select id="rsvp-party" name="partySize" class="rsvp-select">',
              '<option value="0">본인만 참석 (0명 동행)</option>',
              '<option value="1">1명 동행</option>',
              '<option value="2">2명 동행</option>',
              '<option value="3">3명 동행</option>',
              '<option value="4">4명 이상 동행</option>',
            '</select>',
          '</div>',

          /* 식사 여부 */
          '<div class="rsvp-field">',
            '<span class="rsvp-label">식사 여부</span>',
            '<div class="rsvp-toggle-group" role="group" aria-label="식사 여부 선택">',
              '<label class="rsvp-toggle-label">',
                '<input type="radio" name="mealYn" value="예" class="rsvp-radio">',
                '<span class="rsvp-toggle-btn">예</span>',
              '</label>',
              '<label class="rsvp-toggle-label">',
                '<input type="radio" name="mealYn" value="아니오" class="rsvp-radio">',
                '<span class="rsvp-toggle-btn">아니오</span>',
              '</label>',
              '<label class="rsvp-toggle-label">',
                '<input type="radio" name="mealYn" value="미정" checked class="rsvp-radio">',
                '<span class="rsvp-toggle-btn">미정</span>',
              '</label>',
            '</div>',
          '</div>',

          /* 메시지 */
          '<div class="rsvp-field">',
            '<label class="rsvp-label" for="rsvp-message">메시지 (선택)</label>',
            '<textarea id="rsvp-message" name="message" class="rsvp-textarea"',
              ' placeholder="축하 메시지를 남겨주세요." maxlength="200" rows="3"></textarea>',
          '</div>',

          /* 제출/취소 버튼 */
          '<div class="rsvp-btn-row">',
            '<button type="button" class="btn btn--ghost rsvp-cancel-btn">취소</button>',
            '<button type="submit" class="btn btn--primary rsvp-submit-btn" id="rsvp-submit">',
              '전달하기',
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
  var form       = document.getElementById('rsvp-form');
  var closeBtn   = modalRoot.querySelector('.rsvp-modal-close');
  var cancelBtn  = modalRoot.querySelector('.rsvp-cancel-btn');

  closeBtn.addEventListener('click', closeRsvpModal);
  cancelBtn.addEventListener('click', closeRsvpModal);

  // 배경(오버레이) 클릭으로 닫기
  modalRoot.addEventListener('click', function onOverlayClick(ev) {
    if (ev.target === modalRoot) {
      closeRsvpModal();
      modalRoot.removeEventListener('click', onOverlayClick);
    }
  });

  // ESC 키로 닫기
  document.addEventListener('keydown', onRsvpEsc);

  // 포커스 트랩: Tab/Shift+Tab이 모달 내 포커스 가능 요소들 사이에서만 순환
  document.addEventListener('keydown', trapRsvpFocus);

  // 폼 제출
  form.addEventListener('submit', handleRsvpSubmit);

  // 첫 입력 필드에 포커스
  var nameInput = document.getElementById('rsvp-name');
  if (nameInput) nameInput.focus();
}


/* ─────────────────────────────────────────────────────────────────
   closeRsvpModal()
   모달을 닫고 body 스크롤 복원, ESC 리스너 제거
───────────────────────────────────────────────────────────────── */
function closeRsvpModal() {
  var modalRoot = document.getElementById('modal-root');
  if (modalRoot) {
    modalRoot.removeAttribute('role');
    modalRoot.removeAttribute('aria-modal');
    modalRoot.setAttribute('aria-hidden', 'true');
    modalRoot.innerHTML = '';
  }
  document.body.style.overflow = '';
  document.removeEventListener('keydown', onRsvpEsc);
  document.removeEventListener('keydown', trapRsvpFocus);
}


/* ─────────────────────────────────────────────────────────────────
   onRsvpEsc(e)
   ESC 키 이벤트 핸들러 (모달 열린 동안만 등록)
───────────────────────────────────────────────────────────────── */
function onRsvpEsc(e) {
  if (e.key === 'Escape' || e.keyCode === 27) {
    closeRsvpModal();
  }
}


/* ─────────────────────────────────────────────────────────────────
   trapRsvpFocus(e)
   Tab/Shift+Tab 이동을 모달 내 포커스 가능 요소로 제한한다.
───────────────────────────────────────────────────────────────── */
function trapRsvpFocus(e) {
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
   getFormValue(form, name)
   폼에서 name에 해당하는 라디오 또는 셀렉트/텍스트 값을 반환한다.
───────────────────────────────────────────────────────────────── */
function getFormValue(form, name) {
  var el = form.elements[name];
  if (!el) return '';
  // RadioNodeList
  if (el.length !== undefined && typeof el.value !== 'undefined') return el.value;
  return el.value || '';
}


/* ─────────────────────────────────────────────────────────────────
   showRsvpMsg(text, isError)
   모달 내 메시지 영역에 에러 또는 성공 메시지를 표시한다.
───────────────────────────────────────────────────────────────── */
function showRsvpMsg(text, isError) {
  var msgEl = document.getElementById('rsvp-msg');
  if (!msgEl) return;
  msgEl.className = 'rsvp-msg ' + (isError ? 'error-message' : 'success-message');
  msgEl.textContent = text;
}


/* ─────────────────────────────────────────────────────────────────
   setRsvpLoading(isLoading)
   제출 버튼을 스피너/원래 텍스트로 전환한다.
───────────────────────────────────────────────────────────────── */
function setRsvpLoading(isLoading) {
  var btn = document.getElementById('rsvp-submit');
  if (!btn) return;
  if (isLoading) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> 전송 중…';
  } else {
    btn.disabled = false;
    btn.innerHTML = '전달하기';
  }
}


/* ─────────────────────────────────────────────────────────────────
   handleRsvpSubmit(e)
   폼 제출 이벤트 처리: 유효성 검사 → fetch POST → 결과 처리
───────────────────────────────────────────────────────────────── */
function handleRsvpSubmit(e) {
  e.preventDefault();

  var form = e.target;

  // 필수 필드 수집
  var name       = (form.elements['name']       ? form.elements['name'].value       : '').trim();
  var side       = getFormValue(form, 'side');
  var attendance = getFormValue(form, 'attendance');
  var partySize  = getFormValue(form, 'partySize');
  var mealYn     = getFormValue(form, 'mealYn');
  var message    = (form.elements['message']    ? form.elements['message'].value    : '').trim();

  // 클라이언트 유효성 검사
  if (!name) {
    showRsvpMsg('이름을 입력해 주세요.', true);
    var nameInput = document.getElementById('rsvp-name');
    if (nameInput) nameInput.focus();
    return;
  }
  if (!attendance) {
    showRsvpMsg('참석 여부를 선택해 주세요.', true);
    return;
  }

  var url = (typeof CONFIG !== 'undefined') ? CONFIG.appsScriptUrl : '';
  if (!url) {
    showRsvpMsg('현재 제출 기능을 준비 중입니다. 잠시 후 다시 시도해 주세요.', true);
    return;
  }

  var payload = {
    type:       'rsvp',
    side:       side,
    attendance: attendance,
    name:       name,
    partySize:  partySize,
    mealYn:     mealYn,
    message:    message
  };

  setRsvpLoading(true);

  /* ── fetch POST
     Content-Type: text/plain;charset=utf-8
     → Simple Request로 처리 → CORS preflight(OPTIONS) 회피
     Apps Script doPost에서 e.postData.contents를 JSON.parse 한다.
  ── */
  fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body:    JSON.stringify(payload)
  })
  .then(function(res) {
    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }
    return res.json();
  })
  .then(function(data) {
    setRsvpLoading(false);
    if (data.ok) {
      toast('참석 여부가 전달되었습니다. 감사합니다!');
      closeRsvpModal();
    } else {
      // 서버에서 반환한 구체적 오류 메시지 표시
      showRsvpMsg(data.message || '제출 중 오류가 발생했습니다.', true);
    }
  })
  .catch(function(err) {
    setRsvpLoading(false);
    showRsvpMsg('네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.', true);
  });
}


/* ─────────────────────────────────────────────────────────────────
   initRsvp()
   #rsvp 섹션에 안내 문구와 버튼을 렌더링한다.
   CONFIG.appsScriptUrl이 비어있으면 버튼 disabled + 준비 중 안내.
───────────────────────────────────────────────────────────────── */
function initRsvp() {
  var section = document.getElementById('rsvp');
  if (!section) return;

  var hasUrl = (typeof CONFIG !== 'undefined') && !!CONFIG.appsScriptUrl;

  // 섹션 내부 기존 TODO 주석·텍스트 초기화
  section.innerHTML = [
    '<h2 class="section-title">',
      '<span class="en">RSVP</span>',
      '참석 여부',
    '</h2>',

    '<div class="rsvp-intro">',
      '<p class="rsvp-intro-text">',
        '참석 여부를 알려주시면 준비하는 데 큰 도움이 됩니다.<br>',
        '부담 없이 전달해 주세요.',
      '</p>',
      hasUrl ? '' : [
        '<p class="rsvp-notice text-muted">',
          '참석 여부 접수 기능을 준비 중입니다.',
        '</p>'
      ].join(''),
    '</div>',

    '<div class="rsvp-action text-center">',
      '<button',
        ' type="button"',
        ' class="btn btn--primary rsvp-open-btn"',
        hasUrl ? '' : ' disabled aria-disabled="true"',
        ' id="rsvp-open-btn"',
      '>',
        '참석 여부 전달하기',
      '</button>',
    '</div>'
  ].join('');

  if (hasUrl) {
    var openBtn = document.getElementById('rsvp-open-btn');
    if (openBtn) {
      openBtn.addEventListener('click', openRsvpModal);
    }
  }
}


/* ─────────────────────────────────────────────────────────────────
   DOMContentLoaded 진입점
───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  initRsvp();
});
