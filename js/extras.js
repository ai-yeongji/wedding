/**
 * extras.js — 마음 전하실 곳(계좌 아코디언) + 공유하기 섹션
 *
 * 담당:
 *   - #accounts 섹션: CONFIG.accounts.groom / bride 배열을
 *     신랑측/신부측 아코디언으로 렌더링, 계좌번호 클립보드 복사
 *   - #share 섹션: 현재 URL 복사 버튼,
 *     CONFIG.shareKakaoKey 있으면 카카오톡 공유 버튼(없으면 숨김)
 *
 * 의존: config.js (CONFIG.accounts, CONFIG.shareKakaoKey, CONFIG.wedding, CONFIG.groom, CONFIG.bride)
 */

(function () {
  'use strict';

  /* ── showToast fallback ── */
  var _showToast = window.showToast || function (msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { t.classList.add('show'); });
    });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.parentNode && t.parentNode.removeChild(t); }, 400);
    }, 2500);
  };

  /* ── 민감정보 디코드 헬퍼 (ui.js fallback 포함) ── */
  var _decode = window.decodeSensitive || function (s) {
    if (!s) return '';
    try {
      var bin = atob(s);
      var bytes = Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
      return new TextDecoder('utf-8').decode(bytes);
    } catch (e) { return s; }
  };

  /* ── 클립보드 복사 헬퍼 ── */
  function copyToClipboard(text, successMsg) {
    successMsg = successMsg || '복사되었습니다.';
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        _showToast(successMsg);
      }).catch(function () {
        _fallbackCopy(text, successMsg);
      });
    } else {
      _fallbackCopy(text, successMsg);
    }
  }

  function _fallbackCopy(text, successMsg) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      _showToast(ok ? successMsg : '복사: ' + text);
    } catch (e) {
      _showToast('복사: ' + text);
    }
  }

  /* ── HTML 이스케이프 ── */
  var _escapeHtml = window.escapeHtml || function (str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  /* ════════════════════════════════════════════
     #accounts 섹션 — 계좌 아코디언
  ════════════════════════════════════════════ */
  function initAccounts() {
    var section = document.getElementById('accounts');
    if (!section) return;

    var sides = [
      { label: '신랑측', key: 'groom' },
      { label: '신부측', key: 'bride' }
    ];

    sides.forEach(function (side) {
      var items = (CONFIG.accounts && CONFIG.accounts[side.key]) || [];
      if (!items.length) return;

      /* 아코디언 래퍼 */
      var accordion = document.createElement('div');
      accordion.className = 'accordion';

      /* 아코디언 헤더 (토글 버튼) */
      var headerId = 'acc-header-' + side.key;
      var bodyId   = 'acc-body-' + side.key;

      var header = document.createElement('button');
      header.type = 'button';
      header.id = headerId;
      header.className = 'accordion__header';
      header.setAttribute('aria-expanded', 'false');
      header.setAttribute('aria-controls', bodyId);
      header.innerHTML =
        '<span class="accordion__title">' + _escapeHtml(side.label) + '</span>' +
        '<span class="accordion__arrow" aria-hidden="true">&#8964;</span>'; /* ⌄ */

      /* 아코디언 본문 (기본 숨김) */
      var body = document.createElement('div');
      body.id = bodyId;
      body.className = 'accordion__body';
      body.setAttribute('aria-labelledby', headerId);
      body.setAttribute('hidden', '');

      /* 각 계좌 카드 */
      items.forEach(function (acc) {
        var card = document.createElement('div');
        card.className = 'account-card';

        /* 계좌번호는 config에 Base64로 저장됨 → 디코드해서 표시/복사 */
        var accNumber = _decode(acc.number);

        var info = document.createElement('div');
        info.className = 'account-card__info';
        info.innerHTML =
          '<span class="account-card__bank">' + _escapeHtml(acc.bank) + '</span>' +
          '<span class="account-card__holder">' + _escapeHtml(acc.holder) + '</span>' +
          '<span class="account-card__number">' + _escapeHtml(accNumber) + '</span>';

        var copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'btn btn--outline account-card__copy';
        copyBtn.setAttribute('aria-label', acc.holder + ' 계좌번호 복사');
        copyBtn.textContent = '복사';

        /* 클로저로 디코드된 번호 캡처 */
        (function (number, holder) {
          copyBtn.addEventListener('click', function () {
            copyToClipboard(number, holder + ' 계좌번호가 복사되었습니다.');
          });
        })(accNumber, acc.holder);

        card.appendChild(info);
        card.appendChild(copyBtn);
        body.appendChild(card);
      });

      /* 토글 동작 */
      header.addEventListener('click', function () {
        var expanded = header.getAttribute('aria-expanded') === 'true';
        header.setAttribute('aria-expanded', String(!expanded));
        if (expanded) {
          body.setAttribute('hidden', '');
          header.querySelector('.accordion__arrow').innerHTML = '&#8964;'; /* ⌄ */
        } else {
          body.removeAttribute('hidden');
          header.querySelector('.accordion__arrow').innerHTML = '&#8963;'; /* ⌃ */
        }
      });

      accordion.appendChild(header);
      accordion.appendChild(body);
      section.appendChild(accordion);
    });
  }

  /* ════════════════════════════════════════════
     #share 섹션 — 공유하기
  ════════════════════════════════════════════ */
  function initShare() {
    var section = document.getElementById('share');
    if (!section) return;

    var desc = document.createElement('p');
    desc.className = 'share-desc';
    desc.textContent = '소중한 분들께 청첩장을 전해보세요.';
    section.appendChild(desc);

    var btnGroup = document.createElement('div');
    btnGroup.className = 'share-btn-group';

    /* ── URL 복사 버튼 ── */
    var urlCopyBtn = document.createElement('button');
    urlCopyBtn.type = 'button';
    urlCopyBtn.className = 'btn btn--outline btn--full share-btn share-btn--copy';
    urlCopyBtn.innerHTML = '&#128279; 링크 복사';
    urlCopyBtn.addEventListener('click', function () {
      copyToClipboard(window.location.href, '청첩장 링크가 복사되었습니다.');
    });
    btnGroup.appendChild(urlCopyBtn);

    /* ── 카카오톡 공유 버튼 (키 있을 때만) ── */
    var kakaoKey = (CONFIG && CONFIG.shareKakaoKey) ? CONFIG.shareKakaoKey.trim() : '';
    if (kakaoKey) {
      var kakaoBtn = document.createElement('button');
      kakaoBtn.type = 'button';
      kakaoBtn.id = 'kakao-share-btn';
      kakaoBtn.className = 'btn btn--primary btn--full share-btn share-btn--kakao';
      kakaoBtn.innerHTML = '&#128172; 카카오톡 공유';
      kakaoBtn.addEventListener('click', function () {
        _initKakaoShare(kakaoKey);
      });
      btnGroup.appendChild(kakaoBtn);
    }

    section.appendChild(btnGroup);
  }

  /* ── 카카오 SDK 초기화 및 공유 ── */
  var _kakaoSdkLoaded = false;
  var _kakaoSdkLoading = false;
  var _kakaoSdkQueue = [];

  function _initKakaoShare(key) {
    if (_kakaoSdkLoaded) {
      _doKakaoShare(key);
      return;
    }
    _kakaoSdkQueue.push(function () { _doKakaoShare(key); });
    if (_kakaoSdkLoading) return;
    _kakaoSdkLoading = true;

    var script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = function () {
      _kakaoSdkLoaded = true;
      _kakaoSdkLoading = false;
      /* SDK 초기화 */
      if (window.Kakao && !Kakao.isInitialized()) {
        try { Kakao.init(key); } catch (e) { /* 이미 초기화됨 */ }
      }
      _kakaoSdkQueue.forEach(function (fn) { fn(); });
      _kakaoSdkQueue = [];
    };
    script.onerror = function () {
      _kakaoSdkLoaded = false;
      _kakaoSdkLoading = false;
      _showToast('카카오 공유를 사용할 수 없습니다. 링크를 직접 복사해 주세요.');
      copyToClipboard(window.location.href, '청첩장 링크가 복사되었습니다.');
      _kakaoSdkQueue = [];
    };
    document.head.appendChild(script);
  }

  function _doKakaoShare(key) {
    if (!window.Kakao) { return; }
    if (!Kakao.isInitialized()) {
      try { Kakao.init(key); } catch (e) { /* 이미 초기화됨 */ }
    }

    var w = CONFIG.wedding || {};
    var groomName = (CONFIG.groom && CONFIG.groom.name) || '신랑';
    var brideName = (CONFIG.bride && CONFIG.bride.name) || '신부';
    var title = groomName + ' ♡ ' + brideName + ' 결혼합니다';
    var description = w.dateText || '';
    var pageUrl = window.location.href;
    /* OG 이미지: <meta property="og:image"> 값 재사용 */
    var ogImgMeta = document.querySelector('meta[property="og:image"]');
    var imageUrl = ogImgMeta ? ogImgMeta.getAttribute('content') : '';

    try {
      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: title,
          description: description,
          imageUrl: imageUrl,
          link: {
            mobileWebUrl: pageUrl,
            webUrl: pageUrl
          }
        },
        buttons: [
          {
            title: '청첩장 보기',
            link: { mobileWebUrl: pageUrl, webUrl: pageUrl }
          }
        ]
      });
    } catch (e) {
      /* 공유 실패 시 링크 복사로 fallback */
      _showToast('카카오 공유에 실패했습니다. 링크를 복사합니다.');
      copyToClipboard(pageUrl, '청첩장 링크가 복사되었습니다.');
    }
  }

  /* ── DOM 준비 후 실행 ── */
  function init() {
    initAccounts();
    initShare();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
