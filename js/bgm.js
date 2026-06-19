/**
 * bgm.js — 배경음악(BGM) 재생/정지 토글
 *
 * 담당:
 *   - CONFIG.bgm 경로의 오디오 파일 로드
 *   - #bgm-toggle 버튼 클릭으로 재생/정지 전환
 *   - 재생 중 버튼 아이콘: ♪ (정지 상태, 클릭 시 재생) / ♬ (재생 중, 클릭 시 정지)
 *   - 모바일 자동 재생 정책 대응: 첫 사용자 인터랙션 후 재생 시도
 *   - 오디오 파일 없거나 로드 실패 시 버튼 숨김 (조용히 처리)
 *   - loop: true (반복 재생)
 *   - 페이지 비활성화(visibilitychange) 시 자동 정지, 복귀 시 복원
 *
 * 의존: config.js (CONFIG.bgm)
 * 담당 요소: #bgm-toggle 버튼
 */

(function () {
  'use strict';

  var btn = document.getElementById('bgm-toggle');
  if (!btn) return;

  /* CONFIG.bgm이 비어 있으면 버튼 숨김 */
  var bgmSrc = (CONFIG && CONFIG.bgm) ? CONFIG.bgm.trim() : '';
  if (!bgmSrc) {
    btn.hidden = true;
    return;
  }

  var audio = new Audio();
  audio.loop = true;
  audio.preload = 'none'; /* 자동 다운로드 방지 — 첫 재생 시 로드 */

  /* 재생 상태 플래그 */
  var isPlaying = false;
  /* 사용자가 명시적으로 정지했는지 여부 (visibilitychange 복원 여부 판단) */
  var userPaused = false;

  /* ── 아이콘 / aria-label 갱신 ── */
  function updateBtn() {
    if (isPlaying) {
      btn.textContent = '♬';
      btn.setAttribute('aria-label', '배경음악 끄기');
      btn.classList.add('bgm-playing');
    } else {
      btn.textContent = '♪';
      btn.setAttribute('aria-label', '배경음악 켜기');
      btn.classList.remove('bgm-playing');
    }
  }

  /* ── 재생 시도 ── */
  function tryPlay() {
    /* 아직 src가 설정되지 않은 경우 설정 */
    if (!audio.src || audio.src === window.location.href) {
      audio.src = bgmSrc;
    }
    var promise = audio.play();
    if (promise !== undefined) {
      promise.then(function () {
        isPlaying = true;
        updateBtn();
      }).catch(function (err) {
        /* 자동재생 정책 차단 등 — 조용히 처리, 버튼 상태 유지 */
        isPlaying = false;
        updateBtn();
        /* 브라우저 정책 차단(NotAllowedError) 외 실제 파일 에러 시 버튼 숨김 */
        if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
          btn.hidden = true;
        }
      });
    } else {
      /* 구형 브라우저: Promise 미반환 */
      isPlaying = true;
      updateBtn();
    }
  }

  /* ── 정지 ── */
  function doPause() {
    audio.pause();
    isPlaying = false;
    updateBtn();
  }

  /* ── 오디오 에러: 파일 없음 등 → 버튼 숨김 ── */
  audio.addEventListener('error', function () {
    btn.hidden = true;
  });

  /* ── 버튼 클릭 토글 ── */
  btn.addEventListener('click', function () {
    if (isPlaying) {
      userPaused = true;
      doPause();
    } else {
      userPaused = false;
      tryPlay();
    }
  });

  /* ── 페이지 비활성화 시 정지, 복귀 시 복원 ── */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (isPlaying) {
        audio.pause();
        /* isPlaying 플래그는 true 유지 — 복귀 시 재시작 판단에 사용 */
      }
    } else {
      /* 사용자가 명시적으로 끄지 않았고, 재생 중이었으면 복원 */
      if (isPlaying && !userPaused) {
        tryPlay();
      }
    }
  });

  /* 초기 버튼 상태 설정 */
  updateBtn();

})();
