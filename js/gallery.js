/**
 * gallery.js - 이미지 갤러리 + 라이트박스
 *
 * 담당:
 *   - CONFIG.gallery 배열로 터치 스와이프 가능한 캐러셀 렌더링
 *   - 좌우 화살표(❮ ❯) 및 인디케이터 닷(●) 네비게이션
 *   - 이미지 클릭 시 라이트박스(#modal-root에 삽입) 열기
 *   - 라이트박스 내 좌우 화살표 + 터치 스와이프 지원
 *   - 이미지 로드 에러 시 .img-placeholder fallback
 *   - 외부 클릭 또는 닫기 버튼으로 라이트박스 닫기
 *
 * 의존: config.js (CONFIG.gallery)
 * 렌더링 대상: #gallery 섹션, #modal-root
 */

(function () {
  'use strict';

  /* -----------------------------------------------------------------
     캐러셀 상태
  ----------------------------------------------------------------- */
  var images = [];         // CONFIG.gallery 배열
  var currentIdx = 0;      // 현재 표시 인덱스
  var isDragging = false;  // 터치/드래그 중 여부
  var startX = 0;          // 터치 시작 X 좌표
  var diffX = 0;           // 터치 이동 거리

  /* -----------------------------------------------------------------
     헬퍼: 이미지 <img> 요소 생성 (onerror fallback 포함)
  ----------------------------------------------------------------- */
  function makeImg(src, alt, cls) {
    var img = document.createElement('img');
    // 캐시 무효화: 이미지 경로에 ?v=버전 부착
    var ver = (typeof CONFIG !== 'undefined' && CONFIG.assetVersion) ? ('?v=' + CONFIG.assetVersion) : '';
    img.src = src + ver;
    img.alt = alt || '';
    if (cls) img.className = cls;
    img.onerror = function () {
      this.style.display = 'none';
      var parent = this.parentElement;
      if (parent) parent.classList.add('img-placeholder');
    };
    return img;
  }

  /* -----------------------------------------------------------------
     캐러셀 렌더링
  ----------------------------------------------------------------- */
  function renderCarousel(section) {
    if (!images.length) {
      section.innerHTML += '<p class="gallery-empty text-muted text-center">준비된 사진이 없습니다.</p>';
      return;
    }

    // 캐러셀 컨테이너
    var wrapper = document.createElement('div');
    wrapper.className = 'carousel-wrapper';

    // 슬라이드 트랙
    var track = document.createElement('div');
    track.className = 'carousel-track';
    track.id = 'carousel-track';

    images.forEach(function (src, i) {
      var slide = document.createElement('div');
      slide.className = 'carousel-slide';
      slide.setAttribute('role', 'img');
      slide.setAttribute('aria-label', '갤러리 사진 ' + (i + 1));

      var img = makeImg(src, '갤러리 사진 ' + (i + 1), 'carousel-img');

      // 이미지 클릭 -> 라이트박스 열기
      slide.addEventListener('click', function () {
        if (Math.abs(diffX) < 8) {  // 스와이프와 클릭 구분
          openLightbox(i);
        }
      });

      slide.appendChild(img);
      track.appendChild(slide);
    });

    // 좌우 화살표
    var btnPrev = document.createElement('button');
    btnPrev.className = 'carousel-btn carousel-btn--prev';
    btnPrev.innerHTML = '&#10094;';
    btnPrev.setAttribute('aria-label', '이전 사진');
    btnPrev.addEventListener('click', function () { moveCarousel(-1); });

    var btnNext = document.createElement('button');
    btnNext.className = 'carousel-btn carousel-btn--next';
    btnNext.innerHTML = '&#10095;';
    btnNext.setAttribute('aria-label', '다음 사진');
    btnNext.addEventListener('click', function () { moveCarousel(1); });

    // 인디케이터 닷
    var dots = document.createElement('div');
    dots.className = 'carousel-dots';
    dots.id = 'carousel-dots';
    images.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' carousel-dot--active' : '');
      dot.setAttribute('aria-label', (i + 1) + '번째 사진');
      dot.addEventListener('click', function () { goTo(i); });
      dots.appendChild(dot);
    });

    wrapper.appendChild(track);
    wrapper.appendChild(btnPrev);
    wrapper.appendChild(btnNext);
    section.appendChild(wrapper);
    section.appendChild(dots);

    // 터치 이벤트 등록
    track.addEventListener('touchstart', onTouchStart, { passive: true });
    track.addEventListener('touchmove', onTouchMove, { passive: true });
    track.addEventListener('touchend', onTouchEnd);

    // 초기 위치
    updateCarousel();
  }

  /* -----------------------------------------------------------------
     캐러셀 위치 업데이트
  ----------------------------------------------------------------- */
  function updateCarousel() {
    var track = document.getElementById('carousel-track');
    if (!track) return;

    track.style.transform = 'translateX(' + (-currentIdx * 100) + '%)';

    // 인디케이터 닷 활성화
    var dots = document.querySelectorAll('.carousel-dot');
    dots.forEach(function (dot, i) {
      dot.classList.toggle('carousel-dot--active', i === currentIdx);
    });
  }

  function goTo(idx) {
    currentIdx = Math.max(0, Math.min(idx, images.length - 1));
    updateCarousel();
  }

  function moveCarousel(dir) {
    var next = currentIdx + dir;
    if (next < 0) next = images.length - 1;
    if (next >= images.length) next = 0;
    goTo(next);
  }

  /* -----------------------------------------------------------------
     터치 스와이프 핸들러
  ----------------------------------------------------------------- */
  function onTouchStart(e) {
    startX = e.touches[0].clientX;
    diffX = 0;
    isDragging = true;
  }

  function onTouchMove(e) {
    if (!isDragging) return;
    diffX = e.touches[0].clientX - startX;
  }

  function onTouchEnd() {
    if (!isDragging) return;
    isDragging = false;
    var threshold = 50; // 최소 스와이프 거리 (px)
    if (diffX < -threshold) {
      moveCarousel(1);  // 왼쪽 스와이프 -> 다음
    } else if (diffX > threshold) {
      moveCarousel(-1); // 오른쪽 스와이프 -> 이전
    }
  }


  /* -----------------------------------------------------------------
     라이트박스 열기/닫기
  ----------------------------------------------------------------- */
  var lbCurrentIdx = 0;
  var lbStartX = 0;
  var lbDiffX = 0;

  function openLightbox(idx) {
    lbCurrentIdx = idx;
    var modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = '';
    modalRoot.setAttribute('role', 'dialog');
    modalRoot.setAttribute('aria-modal', 'true');
    modalRoot.setAttribute('aria-hidden', 'false');

    var box = document.createElement('div');
    box.className = 'lightbox';

    // 닫기 버튼
    var closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', '닫기');
    closeBtn.addEventListener('click', closeLightbox);

    // 이미지 영역
    var imgWrap = document.createElement('div');
    imgWrap.className = 'lightbox-img-wrap';
    imgWrap.id = 'lb-img-wrap';

    // 좌우 화살표
    var prevBtn = document.createElement('button');
    prevBtn.className = 'lightbox-btn lightbox-btn--prev';
    prevBtn.innerHTML = '&#10094;';
    prevBtn.setAttribute('aria-label', '이전 사진');
    prevBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      moveLightbox(-1);
    });

    var nextBtn = document.createElement('button');
    nextBtn.className = 'lightbox-btn lightbox-btn--next';
    nextBtn.innerHTML = '&#10095;';
    nextBtn.setAttribute('aria-label', '다음 사진');
    nextBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      moveLightbox(1);
    });

    // 페이지 표시 (n / total)
    var counter = document.createElement('p');
    counter.className = 'lightbox-counter';
    counter.id = 'lb-counter';

    box.appendChild(closeBtn);
    box.appendChild(prevBtn);
    box.appendChild(imgWrap);
    box.appendChild(nextBtn);
    box.appendChild(counter);
    modalRoot.appendChild(box);

    // 배경 클릭 -> 닫기
    modalRoot.addEventListener('click', function (e) {
      if (e.target === modalRoot) closeLightbox();
    });

    // 터치 스와이프
    imgWrap.addEventListener('touchstart', function (e) {
      lbStartX = e.touches[0].clientX;
      lbDiffX = 0;
    }, { passive: true });
    imgWrap.addEventListener('touchmove', function (e) {
      lbDiffX = e.touches[0].clientX - lbStartX;
    }, { passive: true });
    imgWrap.addEventListener('touchend', function () {
      if (lbDiffX < -50) moveLightbox(1);
      else if (lbDiffX > 50) moveLightbox(-1);
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', onLbKeydown);

    // 포커스 트랩
    document.addEventListener('keydown', trapLbFocus);

    updateLightbox();

    // 닫기 버튼으로 초기 포커스 이동
    closeBtn.focus();
  }

  function updateLightbox() {
    var imgWrap = document.getElementById('lb-img-wrap');
    var counter = document.getElementById('lb-counter');
    if (!imgWrap) return;

    imgWrap.innerHTML = '';
    var img = makeImg(images[lbCurrentIdx], '갤러리 사진 ' + (lbCurrentIdx + 1), 'lightbox-img');
    imgWrap.appendChild(img);

    if (counter) {
      counter.textContent = (lbCurrentIdx + 1) + ' / ' + images.length;
    }
  }

  function moveLightbox(dir) {
    lbCurrentIdx = lbCurrentIdx + dir;
    if (lbCurrentIdx < 0) lbCurrentIdx = images.length - 1;
    if (lbCurrentIdx >= images.length) lbCurrentIdx = 0;
    updateLightbox();
  }

  function closeLightbox() {
    var modalRoot = document.getElementById('modal-root');
    if (modalRoot) {
      modalRoot.removeAttribute('role');
      modalRoot.removeAttribute('aria-modal');
      modalRoot.setAttribute('aria-hidden', 'true');
      modalRoot.innerHTML = '';
    }
    document.removeEventListener('keydown', onLbKeydown);
    document.removeEventListener('keydown', trapLbFocus);
  }

  function trapLbFocus(e) {
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

  function onLbKeydown(e) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') moveLightbox(-1);
    if (e.key === 'ArrowRight') moveLightbox(1);
  }


  /* -----------------------------------------------------------------
     #gallery 섹션 초기화
  ----------------------------------------------------------------- */
  function initGallery() {
    var section = document.getElementById('gallery');
    if (!section) return;

    images = Array.isArray(CONFIG.gallery) ? CONFIG.gallery : [];

    section.innerHTML =
      '<h2 class="section-title">'
    +   '<span class="en">Gallery</span>'
    +   '갤러리'
    + '</h2>';

    renderCarousel(section);

    // 전체보기 버튼
    if (images.length) {
      var viewAllBtn = document.createElement('button');
      viewAllBtn.type = 'button';
      viewAllBtn.className = 'gallery-viewall';
      viewAllBtn.textContent = '사진 전체보기';
      viewAllBtn.addEventListener('click', openGridView);
      section.appendChild(viewAllBtn);
    }
  }

  /* -----------------------------------------------------------------
     전체보기 (그리드) 오버레이
  ----------------------------------------------------------------- */
  function openGridView() {
    var modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = '';
    modalRoot.setAttribute('role', 'dialog');
    modalRoot.setAttribute('aria-modal', 'true');
    modalRoot.setAttribute('aria-hidden', 'false');

    var view = document.createElement('div');
    view.className = 'gallery-grid-view';

    // 상단 바 (제목 + 닫기)
    var bar = document.createElement('div');
    bar.className = 'gallery-grid-view__bar';
    var title = document.createElement('span');
    title.className = 'gallery-grid-view__title';
    title.textContent = '갤러리';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'gallery-grid-view__close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', '닫기');
    closeBtn.addEventListener('click', closeGridView);
    bar.appendChild(title);
    bar.appendChild(closeBtn);

    // 썸네일 그리드
    var grid = document.createElement('div');
    grid.className = 'gallery-grid';
    images.forEach(function (src, i) {
      var cell = document.createElement('figure');
      cell.className = 'gallery-grid__cell';
      var img = makeImg(src, '갤러리 사진 ' + (i + 1));
      cell.appendChild(img);
      // 썸네일 탭 → 라이트박스로 전체 사진 보기
      cell.addEventListener('click', function () {
        closeGridView();
        openLightbox(i);
      });
      grid.appendChild(cell);
    });

    view.appendChild(bar);
    view.appendChild(grid);
    modalRoot.appendChild(view);

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onGridKeydown);
    closeBtn.focus();
  }

  function closeGridView() {
    var modalRoot = document.getElementById('modal-root');
    if (modalRoot) {
      modalRoot.removeAttribute('role');
      modalRoot.removeAttribute('aria-modal');
      modalRoot.setAttribute('aria-hidden', 'true');
      modalRoot.innerHTML = '';
    }
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onGridKeydown);
  }

  function onGridKeydown(e) {
    if (e.key === 'Escape') closeGridView();
  }


  /* -----------------------------------------------------------------
     초기화 진입점
  ----------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', initGallery);

}());
