/**
 * countdown.js - 달력 + D-day 카운트다운
 *
 * 담당:
 *   - CONFIG.wedding.date(ISO 8601)를 기준으로 D-day 계산
 *   - 1초마다 남은 일/시/분/초 업데이트 (setInterval)
 *   - 결혼식 월의 달력 그리드 생성 (일~토, 7열)
 *   - 결혼식 날짜 셀에 .calendar-highlight 포인트 컬러 적용
 *   - 이미 지난 날짜면 "D+{n}" 형식 표시
 *
 * 의존: config.js (CONFIG.wedding.date, CONFIG.wedding.dateText, CONFIG.groom, CONFIG.bride)
 * 렌더링 대상: #calendar 섹션
 */

/* -----------------------------------------------------------------
   달력 그리드 생성
----------------------------------------------------------------- */
function buildCalendar(targetDate) {
  var year        = targetDate.getFullYear();
  var month       = targetDate.getMonth();       // 0-based
  var weddingDay  = targetDate.getDate();

  // 해당 월 1일 요일(0=일, 6=토)과 마지막 날짜
  var firstDayOfWeek = new Date(year, month, 1).getDay();
  var lastDate        = new Date(year, month + 1, 0).getDate();

  var dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  // 요일 헤더 행
  var headerCells = dayNames.map(function(d, i) {
    var cls = i === 0
      ? 'calendar-dow calendar-dow--sun'
      : (i === 6 ? 'calendar-dow calendar-dow--sat' : 'calendar-dow');
    return '<div class="' + cls + '">' + d + '</div>';
  }).join('');

  // 날짜 셀 (앞 공백 + 날짜들)
  var cells = '';
  for (var i = 0; i < firstDayOfWeek; i++) {
    cells += '<div class="calendar-cell calendar-cell--empty"></div>';
  }
  for (var d = 1; d <= lastDate; d++) {
    var colIdx = (firstDayOfWeek + d - 1) % 7; // 0=일, 6=토
    var cls = 'calendar-cell';
    if (colIdx === 0) cls += ' calendar-cell--sun';
    if (colIdx === 6) cls += ' calendar-cell--sat';
    if (d === weddingDay) cls += ' calendar-highlight';
    cells += '<div class="' + cls + '">' + d + '</div>';
  }

  // 월 헤더 레이블
  var monthLabel = year + '년 ' + (month + 1) + '월';

  return '<div class="calendar-month">' + monthLabel + '</div>'
       + '<div class="calendar-grid">' + headerCells + cells + '</div>';
}


/* -----------------------------------------------------------------
   D-day 카운트다운 계산
----------------------------------------------------------------- */
function calcDiff(targetDate, now) {
  var diff    = targetDate - now; // ms
  var isPast  = diff < 0;
  var absDiff = Math.abs(diff);

  var totalSec = Math.floor(absDiff / 1000);
  var days  = Math.floor(totalSec / 86400);
  var hours = Math.floor((totalSec % 86400) / 3600);
  var mins  = Math.floor((totalSec % 3600) / 60);
  var secs  = totalSec % 60;

  return { isPast: isPast, days: days, hours: hours, mins: mins, secs: secs };
}

function pad2(n) {
  return String(n).padStart(2, '0');
}


/* -----------------------------------------------------------------
   #calendar 섹션 초기화 및 렌더링
----------------------------------------------------------------- */
function initCalendar() {
  var section = document.getElementById('calendar');
  if (!section) return;

  var targetDate = new Date(CONFIG.wedding.date);
  var g = CONFIG.groom;
  var b = CONFIG.bride;

  // escapeHtml은 ui.js에서 window에 노출됨. 없으면 간단 fallback 사용
  var esc = (typeof escapeHtml === 'function') ? escapeHtml : function(s) { return s; };

  // 구조 삽입
  section.innerHTML =
    '<h2 class="section-title">'
  +   '<span class="en">Calendar</span>'
  +   '날짜'
  + '</h2>'

  // 결혼식 날짜 텍스트
  + '<p class="calendar-date-text font-display">' + esc(CONFIG.wedding.dateText) + '</p>'

  // 달력 그리드
  + '<div class="calendar-wrap">' + buildCalendar(targetDate) + '</div>'

  // D-day 카운트다운
  + '<div class="countdown-wrap">'
  +   '<p class="countdown-label" id="countdown-label"></p>'
  +   '<div class="countdown-blocks" id="countdown-blocks">'
  +     '<div class="countdown-block">'
  +       '<span class="countdown-num" id="cd-days">--</span>'
  +       '<span class="countdown-unit">일</span>'
  +     '</div>'
  +     '<div class="countdown-sep">:</div>'
  +     '<div class="countdown-block">'
  +       '<span class="countdown-num" id="cd-hours">--</span>'
  +       '<span class="countdown-unit">시간</span>'
  +     '</div>'
  +     '<div class="countdown-sep">:</div>'
  +     '<div class="countdown-block">'
  +       '<span class="countdown-num" id="cd-mins">--</span>'
  +       '<span class="countdown-unit">분</span>'
  +     '</div>'
  +     '<div class="countdown-sep">:</div>'
  +     '<div class="countdown-block">'
  +       '<span class="countdown-num" id="cd-secs">--</span>'
  +       '<span class="countdown-unit">초</span>'
  +     '</div>'
  +   '</div>'
  + '</div>';

  // tick 함수: 1초마다 카운트다운 업데이트
  function tick() {
    var now = new Date();
    var diff = calcDiff(targetDate, now);

    var labelEl = document.getElementById('countdown-label');
    var daysEl  = document.getElementById('cd-days');
    var hoursEl = document.getElementById('cd-hours');
    var minsEl  = document.getElementById('cd-mins');
    var secsEl  = document.getElementById('cd-secs');

    if (!labelEl) return; // DOM에서 섹션이 사라진 경우 방어

    if (diff.isPast) {
      labelEl.textContent = g.name + '님과 ' + b.name + '님의 결혼식이 ' + diff.days + '일 지났습니다.';
    } else if (diff.days === 0 && diff.hours === 0 && diff.mins === 0 && diff.secs === 0) {
      labelEl.textContent = '오늘이 결혼식 날입니다!';
    } else {
      labelEl.textContent = g.name + '님과 ' + b.name + '님의 결혼식까지';
    }

    daysEl.textContent  = String(diff.days);
    hoursEl.textContent = pad2(diff.hours);
    minsEl.textContent  = pad2(diff.mins);
    secsEl.textContent  = pad2(diff.secs);
  }

  // 즉시 1회 실행 후 1초마다 갱신
  tick();
  setInterval(tick, 1000);
}


/* -----------------------------------------------------------------
   초기화 진입점
----------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', initCalendar);
