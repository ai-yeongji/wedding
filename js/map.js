/**
 * map.js — 오시는 길 (지도 + 길찾기 + 연락처)
 *
 * 담당:
 *   - CONFIG.kakaoMapJsKey가 있으면 카카오 지도 SDK 동적 로드 및 초기화
 *     → CONFIG.wedding.lat / CONFIG.wedding.lng 위치에 마커 표시
 *   - 키가 비어있으면 회색 플레이스홀더 + "지도 보기" 안내 fallback
 *   - CONFIG.wedding.venue / hall / address 텍스트 렌더링
 *   - 주소 복사 버튼 (clipboard API + execCommand fallback)
 *   - 네이버지도 / 카카오맵 / 티맵 길찾기 버튼
 *   - CONFIG.contacts 기반 전화/문자 버튼 렌더링 (phone 빈 값 숨김)
 *
 * 의존: config.js (CONFIG.wedding, CONFIG.kakaoMapJsKey, CONFIG.contacts)
 * 렌더링 대상: #location 섹션
 */

(function () {
  'use strict';

  /* ── 헬퍼: showToast fallback (ui.js가 없어도 동작) ── */
  var _showToast = window.showToast || function (msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    // 다음 프레임에 .show 추가 (트랜지션 발동)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { t.classList.add('show'); });
    });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.parentNode && t.parentNode.removeChild(t); }, 400);
    }, 2500);
  };

  /* ── 헬퍼: HTML 이스케이프 ── */
  var _escapeHtml = window.escapeHtml || function (str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  /* ── 헬퍼: 민감정보(연락처) Base64 디코드 (ui.js fallback 포함) ── */
  var _decode = window.decodeSensitive || function (s) {
    if (!s) return '';
    try {
      var bin = atob(s);
      var bytes = Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
      return new TextDecoder('utf-8').decode(bytes);
    } catch (e) { return s; }
  };

  /* ── 헬퍼: 클립보드 복사 (https/localhost 전용, execCommand fallback 포함) ── */
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

  /* ── 길찾기 URL 생성 ── */
  function buildNavLinks(venue, address, lat, lng) {
    var encodedAddr = encodeURIComponent(address);
    var encodedVenue = encodeURIComponent(venue);
    return {
      naver: 'https://map.naver.com/v5/search/' + encodedAddr,
      kakao: 'https://map.kakao.com/link/to/' + encodedVenue + ',' + lat + ',' + lng,
      tmap:  'https://tmap.life/' + encodedAddr  // 티맵 웹 검색 링크
    };
  }

  /* ── 카카오 지도 SDK 동적 로드 ── */
  function loadKakaoMapSdk(key, callback) {
    var script = document.createElement('script');
    script.src = '//dapi.kakao.com/v2/maps/sdk.js?appkey=' + key + '&autoload=false';
    script.onload = function () {
      kakao.maps.load(callback);
    };
    script.onerror = function () {
      callback(new Error('카카오 지도 SDK 로드 실패'));
    };
    document.head.appendChild(script);
  }

  /* ── 카카오 SDK 지도 렌더링 ── */
  function renderKakaoMap(container, lat, lng, venue) {
    var options = {
      center: new kakao.maps.LatLng(lat, lng),
      level: 3
    };
    var map = new kakao.maps.Map(container, options);

    // 마커
    var markerPos = new kakao.maps.LatLng(lat, lng);
    var marker = new kakao.maps.Marker({ position: markerPos });
    marker.setMap(map);

    // 인포윈도우
    var infowindow = new kakao.maps.InfoWindow({
      content: '<div style="padding:6px 10px;font-size:13px;white-space:nowrap;">' + _escapeHtml(venue) + '</div>'
    });
    infowindow.open(map, marker);
  }

  /* ── 구글맵 iframe (API 키 불필요) ──
     검색어(예식장명+주소)로 표시해 좌표 오차의 영향을 받지 않음 */
  function renderGoogleMapEmbed(container, venue, address) {
    var query = encodeURIComponent((venue ? venue + ' ' : '') + address);
    var src = 'https://maps.google.com/maps?q=' + query + '&t=&z=16&ie=UTF8&iwloc=&output=embed';
    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = _escapeHtml(venue || address) + ' 지도';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.setAttribute('allowfullscreen', '');
    iframe.style.cssText = 'width:100%;height:100%;border:0;display:block;';
    container.innerHTML = '';
    container.appendChild(iframe);
  }

  /* ── 지도 플레이스홀더 (구글맵 로드 자체가 불가한 극단적 fallback) ── */
  function renderMapPlaceholder(container, address, lat, lng) {
    var googleUrl = 'https://maps.google.com/?q=' + lat + ',' + lng;
    container.innerHTML =
      '<div class="map-placeholder">' +
        '<p class="map-placeholder__icon">📍</p>' +
        '<p class="map-placeholder__text">' + _escapeHtml(address) + '</p>' +
        '<a href="' + googleUrl + '" target="_blank" rel="noopener noreferrer" ' +
           'class="btn btn--outline map-placeholder__link">구글지도에서 보기</a>' +
      '</div>';
  }

  /* ── 교통편 안내 렌더링 (CONFIG.transport) ── */
  function renderTransport(container, transport) {
    if (!Array.isArray(transport) || !transport.length) return;

    var wrap = document.createElement('div');
    wrap.className = 'transport-list';

    transport.forEach(function (item) {
      if (!item || (!item.title && !item.body)) return;
      var el = document.createElement('div');
      el.className = 'transport-item';
      el.innerHTML =
        '<p class="transport-item__title">' + _escapeHtml(item.title || '') + '</p>' +
        '<p class="transport-item__body">' + _escapeHtml(item.body || '') + '</p>';
      wrap.appendChild(el);
    });

    container.appendChild(wrap);
  }

  /* ── 연락처 버튼 렌더링 ── */
  function renderContacts(container, contacts) {
    var sides = [
      { label: '신랑측', items: contacts.groomSide },
      { label: '신부측', items: contacts.brideSide }
    ];

    sides.forEach(function (side) {
      // phone 값이 있는 항목만 필터
      var validItems = (side.items || []).filter(function (c) { return c.phone && c.phone.trim(); });
      if (!validItems.length) return;

      var groupEl = document.createElement('div');
      groupEl.className = 'contact-group';

      var labelEl = document.createElement('p');
      labelEl.className = 'contact-group__label';
      labelEl.textContent = side.label;
      groupEl.appendChild(labelEl);

      var rowsEl = document.createElement('div');
      rowsEl.className = 'contact-rows';

      validItems.forEach(function (c) {
        // 연락처는 config에 Base64로 저장됨 → 디코드해서 tel:/sms: 링크 구성
        var phone = _decode(c.phone).replace(/-/g, '');

        var rowEl = document.createElement('div');
        rowEl.className = 'contact-row';

        var nameEl = document.createElement('span');
        nameEl.className = 'contact-row__name';
        nameEl.textContent = c.label;
        rowEl.appendChild(nameEl);

        var btnsEl = document.createElement('div');
        btnsEl.className = 'contact-row__btns';

        // 전화 버튼
        var telBtn = document.createElement('a');
        telBtn.href = 'tel:' + phone;
        telBtn.className = 'btn btn--ghost btn--contact';
        telBtn.setAttribute('aria-label', c.label + ' 전화 걸기');
        telBtn.innerHTML = '&#128222; 전화';
        btnsEl.appendChild(telBtn);

        // 문자 버튼
        var smsBtn = document.createElement('a');
        smsBtn.href = 'sms:' + phone;
        smsBtn.className = 'btn btn--ghost btn--contact';
        smsBtn.setAttribute('aria-label', c.label + ' 문자 보내기');
        smsBtn.innerHTML = '&#128172; 문자';
        btnsEl.appendChild(smsBtn);

        rowEl.appendChild(btnsEl);
        rowsEl.appendChild(rowEl);
      });

      groupEl.appendChild(rowsEl);
      container.appendChild(groupEl);
    });
  }

  /* ── #location 섹션 초기화 ── */
  function initLocation() {
    var section = document.getElementById('location');
    if (!section) return;

    var w = CONFIG.wedding;
    var lat = w.lat;
    var lng = w.lng;
    var venue = w.venue || '';
    var hall = w.hall || '';
    var address = w.address || '';
    var navLinks = buildNavLinks(venue, address, lat, lng);

    /* 장소 정보 텍스트 */
    var venueEl = document.createElement('div');
    venueEl.className = 'location-venue';
    venueEl.innerHTML =
      '<p class="location-venue__name">' + _escapeHtml(venue) + '</p>' +
      (hall ? '<p class="location-venue__hall">' + _escapeHtml(hall) + '</p>' : '') +
      '<p class="location-venue__address">' + _escapeHtml(address) + '</p>';
    section.appendChild(venueEl);

    /* 주소 복사 버튼 */
    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn--outline btn--full location-copy-btn';
    copyBtn.textContent = '주소 복사';
    copyBtn.addEventListener('click', function () {
      copyToClipboard(address, '주소가 복사되었습니다.');
    });
    section.appendChild(copyBtn);

    /* 지도 컨테이너 */
    var mapWrap = document.createElement('div');
    mapWrap.className = 'map-wrap';
    var mapEl = document.createElement('div');
    mapEl.id = 'kakao-map';
    mapEl.className = 'map-canvas';
    mapWrap.appendChild(mapEl);
    section.appendChild(mapWrap);

    /* 지도 렌더링
       - CONFIG.kakaoMapJsKey가 있으면 카카오 SDK 지도 (정확한 마커)
       - 없으면 구글맵 iframe (API 키 불필요, 기본) */
    var kakaoKey = CONFIG.kakaoMapJsKey;
    if (kakaoKey && kakaoKey.trim()) {
      loadKakaoMapSdk(kakaoKey, function (err) {
        if (err) {
          renderGoogleMapEmbed(mapEl, venue, address);
        } else {
          try {
            renderKakaoMap(mapEl, lat, lng, venue);
          } catch (e) {
            renderGoogleMapEmbed(mapEl, venue, address);
          }
        }
      });
    } else {
      /* 키 없음 → 구글맵 iframe (팀원과 동일 방식) */
      renderGoogleMapEmbed(mapEl, venue, address);
    }

    /* 길찾기 버튼 3종 */
    var navEl = document.createElement('div');
    navEl.className = 'map-nav-btns';
    navEl.innerHTML =
      '<a href="' + navLinks.naver + '" target="_blank" rel="noopener noreferrer" ' +
         'class="btn btn--ghost map-nav-btn" aria-label="네이버지도로 길찾기">' +
         '<span class="map-nav-btn__icon naver-icon"></span>네이버지도</a>' +
      '<a href="' + navLinks.kakao + '" target="_blank" rel="noopener noreferrer" ' +
         'class="btn btn--ghost map-nav-btn" aria-label="카카오맵으로 길찾기">' +
         '<span class="map-nav-btn__icon kakao-icon"></span>카카오맵</a>' +
      '<a href="' + navLinks.tmap + '" target="_blank" rel="noopener noreferrer" ' +
         'class="btn btn--ghost map-nav-btn" aria-label="티맵으로 길찾기">' +
         '<span class="map-nav-btn__icon tmap-icon"></span>티맵</a>';
    section.appendChild(navEl);

    /* 교통편 안내 */
    renderTransport(section, CONFIG.transport);

    /* 연락처 */
    var contactWrap = document.createElement('div');
    contactWrap.className = 'location-contacts';

    var contactTitle = document.createElement('p');
    contactTitle.className = 'location-contacts__title';
    contactTitle.textContent = '연락처';
    contactWrap.appendChild(contactTitle);

    renderContacts(contactWrap, CONFIG.contacts);
    section.appendChild(contactWrap);
  }

  /* DOM 준비 후 실행 */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLocation);
  } else {
    initLocation();
  }

})();
