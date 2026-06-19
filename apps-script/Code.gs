/**
 * Code.gs — 모바일 청첩장 백엔드 (Google Apps Script)
 *
 * ─────────────────────────────────────────────────────────────────
 * [배포 방법]
 * 1. Google Sheets에서 새 스프레드시트를 만든다.
 * 2. 상단 메뉴 → 확장 프로그램 → Apps Script 를 클릭한다.
 * 3. 기존 코드를 전부 지우고, 이 파일의 내용을 그대로 붙여넣는다.
 * 4. 상단 메뉴 → 배포 → 새 배포 를 클릭한다.
 * 5. 유형 선택 → 웹 앱 을 선택한다.
 * 6. "다음 사용자로 실행" → 나(본인 계정) 선택.
 *    "액세스 권한이 있는 사용자" → 모든 사용자(익명 포함) 선택.
 * 7. 배포 버튼 클릭 → 권한 검토 → 허용.
 * 8. 배포 완료 후 표시되는 "웹 앱 URL"을 복사한다.
 * 9. js/config.js 의 CONFIG.appsScriptUrl 값에 해당 URL을 붙여넣는다.
 *
 * ※ 코드 수정 후에는 "새 배포" 또는 "배포 관리 → 버전 업데이트"를 해야 반영된다.
 * ─────────────────────────────────────────────────────────────────
 *
 * 시트 구조:
 *   - RSVP 탭: timestamp | side | attendance | name | partySize | mealYn | message
 *   - Guestbook 탭: timestamp | name | passwordHash | message
 *
 * CORS 설계:
 *   Apps Script 웹앱은 응답에 Access-Control-Allow-Origin 헤더를 임의로
 *   추가할 수 없다. 따라서 프론트에서 POST 시 Content-Type을 'text/plain'으로
 *   보내 Simple Request로 처리하여 preflight(OPTIONS)를 우회한다.
 *   Apps Script가 웹앱으로 배포되면 Google 인프라가 CORS 응답을 자동 처리한다.
 */

/* ─────────────────────────────────────────────────────────────────
   상수: 시트 이름 및 헤더 정의
───────────────────────────────────────────────────────────────── */
var SHEET_RSVP      = 'RSVP';
var SHEET_GUESTBOOK = 'Guestbook';

var RSVP_HEADERS      = ['timestamp', 'side', 'attendance', 'name', 'partySize', 'mealYn', 'message'];
var GUESTBOOK_HEADERS = ['timestamp', 'name', 'passwordHash', 'message'];


/* ─────────────────────────────────────────────────────────────────
   getOrCreateSheet(name, headers)
   시트가 없으면 생성 후 헤더 행을 삽입하고 반환한다.
   이미 있으면 그대로 반환한다.
───────────────────────────────────────────────────────────────── */
function getOrCreateSheet(name, headers) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    // 헤더 행 스타일: 굵게 + 배경색
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0ede8');
    sheet.setFrozenRows(1);
  }

  return sheet;
}


/* ─────────────────────────────────────────────────────────────────
   jsonResponse(data)
   JSON 직렬화 후 ContentService로 반환 (MimeType: JSON)
───────────────────────────────────────────────────────────────── */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}


/* ─────────────────────────────────────────────────────────────────
   sanitizeSheetCell(val)
   사용자 입력 값이 스프레드시트 수식 인젝션 문자(= + - @ 탭 CR)로
   시작하면 앞에 작은따옴표를 붙여 텍스트로 강제한다.
   timestamp, passwordHash 같은 서버 생성 값에는 적용하지 않는다.
───────────────────────────────────────────────────────────────── */
function sanitizeSheetCell(val) {
  var s = String(val == null ? '' : val).trim();
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}


/* ─────────────────────────────────────────────────────────────────
   hashPassword(plainText)
   SHA-256 해시를 hex 문자열로 반환한다.
   Google Apps Script의 Utilities.computeDigest 사용.
───────────────────────────────────────────────────────────────── */
function hashPassword(plainText) {
  if (!plainText) return '';
  var bytes  = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    plainText,
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(b) {
    var hex = (b & 0xff).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}


/* ─────────────────────────────────────────────────────────────────
   formatTimestamp(date)
   Date 객체를 'YYYY-MM-DD HH:mm:ss' 형식 문자열로 변환한다.
───────────────────────────────────────────────────────────────── */
function formatTimestamp(date) {
  var pad = function(n) { return n < 10 ? '0' + n : String(n); };
  return [
    date.getFullYear(), '-',
    pad(date.getMonth() + 1), '-',
    pad(date.getDate()), ' ',
    pad(date.getHours()), ':',
    pad(date.getMinutes()), ':',
    pad(date.getSeconds())
  ].join('');
}


/* ─────────────────────────────────────────────────────────────────
   doGet(e)
   GET 요청 처리.
   e.parameter.type === 'guestbook' 이면 방명록 최신순 목록 반환.
   passwordHash 필드는 응답에서 제외한다.
   RSVP 목록은 비공개로 반환하지 않는다.

   요청:
     GET {webAppUrl}?type=guestbook

   응답:
     { ok: true, data: [ { name, message, timestamp }, ... ] }
     또는
     { ok: false, error: "..." }
───────────────────────────────────────────────────────────────── */
function doGet(e) {
  try {
    var type = e.parameter.type || '';

    if (type === 'guestbook') {
      var sheet = getOrCreateSheet(SHEET_GUESTBOOK, GUESTBOOK_HEADERS);
      var rows  = sheet.getDataRange().getValues();

      if (rows.length <= 1) {
        // 헤더 행만 있는 경우 — 빈 목록 반환
        return jsonResponse({ ok: true, data: [] });
      }

      var headers = rows[0]; // ['timestamp', 'name', 'passwordHash', 'message']
      var tsIdx   = headers.indexOf('timestamp');
      var nameIdx = headers.indexOf('name');
      var msgIdx  = headers.indexOf('message');
      // passwordHash 인덱스는 의도적으로 사용하지 않음 (응답 제외)

      // 데이터 행(1행 이후)을 역순으로 정렬해 최신순으로 반환
      var dataRows = rows.slice(1).reverse();

      var entries = dataRows.map(function(row) {
        return {
          timestamp: row[tsIdx] ? String(row[tsIdx]) : '',
          name:      row[nameIdx] ? String(row[nameIdx]) : '',
          message:   row[msgIdx]  ? String(row[msgIdx])  : ''
        };
      });

      return jsonResponse({ ok: true, data: entries });
    }

    // 지원하지 않는 type
    return jsonResponse({ ok: false, error: 'INVALID_TYPE', message: '지원하지 않는 요청 유형입니다.' });

  } catch (err) {
    return jsonResponse({ ok: false, error: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' });
  }
}


/* ─────────────────────────────────────────────────────────────────
   doPost(e)
   POST 요청 처리.
   Content-Type: text/plain 으로 수신 → JSON.parse 처리.
   payload.type 에 따라 RSVP 또는 Guestbook 시트에 행 추가.

   [RSVP 요청]
     Body (JSON 문자열):
     {
       "type":       "rsvp",
       "side":       "신랑측" | "신부측",
       "attendance": "참석" | "불참",
       "name":       "홍길동",          // 필수
       "partySize":  "2",               // 동행 인원 (문자열 또는 숫자)
       "mealYn":     "예" | "아니오" | "미정",
       "message":    "축하합니다"       // 선택
     }

   [Guestbook 요청]
     Body (JSON 문자열):
     {
       "type":     "guestbook",
       "name":     "홍길동",          // 필수
       "password": "1234",            // 평문 — 서버에서 SHA-256 해시 후 저장
       "message":  "축하합니다"       // 필수
     }

   [공통 성공 응답]
     { ok: true, message: "저장되었습니다." }

   [공통 실패 응답]
     { ok: false, error: "VALIDATION_ERROR" | "SERVER_ERROR" | "INVALID_TYPE", message: "..." }
───────────────────────────────────────────────────────────────── */
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: 'BAD_REQUEST', message: '요청 본문이 없습니다.' });
    }
    var raw     = e.postData.contents;
    var payload = JSON.parse(raw);
    var type    = payload.type || '';
    var now     = formatTimestamp(new Date());

    /* ── RSVP 처리 ─────────────────────────────────────────── */
    if (type === 'rsvp') {
      // 필수 필드 검증
      if (!payload.name || !String(payload.name).trim()) {
        return jsonResponse({ ok: false, error: 'VALIDATION_ERROR', message: '이름을 입력해 주세요.' });
      }
      if (!payload.attendance) {
        return jsonResponse({ ok: false, error: 'VALIDATION_ERROR', message: '참석 여부를 선택해 주세요.' });
      }

      var sheet = getOrCreateSheet(SHEET_RSVP, RSVP_HEADERS);
      sheet.appendRow([
        now,
        sanitizeSheetCell(payload.side       || ''),
        sanitizeSheetCell(payload.attendance || ''),
        sanitizeSheetCell(String(payload.name || '').trim()),
        sanitizeSheetCell(payload.partySize  || '0'),
        sanitizeSheetCell(payload.mealYn     || '미정'),
        sanitizeSheetCell(String(payload.message || '').trim())
      ]);

      return jsonResponse({ ok: true, message: '참석 여부가 접수되었습니다. 감사합니다.' });
    }

    /* ── Guestbook 처리 ─────────────────────────────────────── */
    if (type === 'guestbook') {
      // 필수 필드 검증
      if (!payload.name || !String(payload.name).trim()) {
        return jsonResponse({ ok: false, error: 'VALIDATION_ERROR', message: '이름을 입력해 주세요.' });
      }
      if (!payload.message || !String(payload.message).trim()) {
        return jsonResponse({ ok: false, error: 'VALIDATION_ERROR', message: '메시지를 입력해 주세요.' });
      }

      var pwHash = hashPassword(String(payload.password || ''));
      var gbSheet = getOrCreateSheet(SHEET_GUESTBOOK, GUESTBOOK_HEADERS);
      gbSheet.appendRow([
        now,
        sanitizeSheetCell(String(payload.name).trim()),
        pwHash,
        sanitizeSheetCell(String(payload.message).trim())
      ]);

      return jsonResponse({ ok: true, message: '방명록이 등록되었습니다.' });
    }

    /* ── 지원하지 않는 type ───────────────────────────────── */
    return jsonResponse({ ok: false, error: 'INVALID_TYPE', message: '지원하지 않는 요청 유형입니다.' });

  } catch (err) {
    return jsonResponse({ ok: false, error: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' });
  }
}
