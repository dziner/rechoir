const RECHOIR_SPREADSHEET_ID = '1Z5JQhnLf8iF6XgJxnbJ6L7pYEyngFV0nU5elABw6eSw';

const SONG_HEADERS = [
  'id',
  'title',
  'youtubeUrl',
  'thumbnail',
  'publishedAt',
  'active',
  'theme',
  'tempo',
  'mood',
  'strings',
  'difficulty',
];

const PERFORMANCE_HEADERS = [
  'id',
  'songId',
  'date',
  'services',
  'type',
  'note',
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Rechoir')
    .addItem('DB 시트 초기화/검증', 'setupRechoirDatabase')
    .addItem('헤더만 다시 적용', 'applyRechoirHeaders')
    .addItem('현재 DB 상태 보기', 'showRechoirStatus')
    .addToUi();
}

function setupRechoirDatabase() {
  const ss = getRechoirSpreadsheet_();
  const songs = ensureSheet_(ss, 'songs', SONG_HEADERS.length);
  const performances = ensureSheet_(ss, 'performances', PERFORMANCE_HEADERS.length);

  setupSongsSheet_(songs);
  setupPerformancesSheet_(performances);
  removeDefaultSheetIfEmpty_(ss);

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('Rechoir DB 시트 초기화가 완료되었습니다.');
}

function applyRechoirHeaders() {
  const ss = getRechoirSpreadsheet_();
  setupSongsSheet_(ensureSheet_(ss, 'songs', SONG_HEADERS.length));
  setupPerformancesSheet_(ensureSheet_(ss, 'performances', PERFORMANCE_HEADERS.length));

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('Rechoir 헤더와 서식이 다시 적용되었습니다.');
}

function showRechoirStatus() {
  const ss = getRechoirSpreadsheet_();
  const songs = ss.getSheetByName('songs');
  const performances = ss.getSheetByName('performances');
  const songRows = songs ? Math.max(songs.getLastRow() - 1, 0) : 0;
  const performanceRows = performances ? Math.max(performances.getLastRow() - 1, 0) : 0;

  SpreadsheetApp.getUi().alert(
    [
      `Spreadsheet ID: ${ss.getId()}`,
      `songs rows: ${songRows}`,
      `performances rows: ${performanceRows}`,
      '',
      'Rechoir 앱은 songs와 performances 시트를 사용합니다.',
    ].join('\n'),
  );
}

function setupSongsSheet_(sheet) {
  applyHeader_(sheet, SONG_HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange('A:K').setVerticalAlignment('middle');
  sheet.getRange('A:A').setNumberFormat('@');
  sheet.getRange('B:D').setNumberFormat('@');
  sheet.getRange('E:E').setNumberFormat('yyyy-mm-dd');
  sheet.getRange('G:G').setNumberFormat('@');
  sheet.getRange('I:I').setNumberFormat('@');
  applySongCheckboxes_(sheet);
  sheet.getRange('H2:H').setDataValidation(listRule_(['slow', 'mid', 'fast']));
  sheet.getRange('K2:K').setDataValidation(listRule_(['low', 'mid', 'high']));
  sheet.setColumnWidths(1, 1, 130);
  sheet.setColumnWidths(2, 1, 260);
  sheet.setColumnWidths(3, 2, 280);
  sheet.setColumnWidths(5, 1, 110);
  sheet.setColumnWidths(6, 1, 80);
  sheet.setColumnWidths(7, 3, 160);
  sheet.setColumnWidths(10, 2, 110);
  ensureFilter_(sheet, SONG_HEADERS.length);
}

function applySongCheckboxes_(sheet) {
  sheet.getRange('F2:F').clearDataValidations();
  sheet.getRange('J2:J').clearDataValidations();

  const lastDataRow = getLastDataRowById_(sheet);
  if (lastDataRow < 2) return;

  sheet.getRange(2, 6, lastDataRow - 1, 1).insertCheckboxes();
  sheet.getRange(2, 10, lastDataRow - 1, 1).insertCheckboxes();
}

function getLastDataRowById_(sheet) {
  const maxRows = Math.max(sheet.getLastRow(), 2);
  const ids = sheet.getRange(2, 1, maxRows - 1, 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (ids[i][0]) return i + 2;
  }
  return 1;
}

function setupPerformancesSheet_(sheet) {
  applyHeader_(sheet, PERFORMANCE_HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange('A:F').setVerticalAlignment('middle');
  sheet.getRange('A:B').setNumberFormat('@');
  sheet.getRange('C:C').setNumberFormat('yyyy-mm-dd');
  sheet.getRange('D2:D').setDataValidation(listRule_(['1부', '2부', '1부,2부']));
  sheet.getRange('E2:E').setDataValidation(listRule_(['new', 'encore']));
  sheet.setColumnWidths(1, 1, 180);
  sheet.setColumnWidths(2, 1, 130);
  sheet.setColumnWidths(3, 1, 110);
  sheet.setColumnWidths(4, 2, 110);
  sheet.setColumnWidths(6, 1, 280);
  ensureFilter_(sheet, PERFORMANCE_HEADERS.length);
}

function applyHeader_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#1f2937')
    .setFontColor('#ffffff');
}

function ensureSheet_(ss, name, minColumns) {
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getMaxColumns() < minColumns) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), minColumns - sheet.getMaxColumns());
  }
  if (sheet.getMaxRows() < 200) {
    sheet.insertRowsAfter(sheet.getMaxRows(), 200 - sheet.getMaxRows());
  }
  return sheet;
}

function ensureFilter_(sheet, columnCount) {
  const existingFilter = sheet.getFilter();
  if (existingFilter) existingFilter.remove();
  sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 2), columnCount).createFilter();
}

function listRule_(values) {
  return SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
}

function removeDefaultSheetIfEmpty_(ss) {
  const sheet = ss.getSheetByName('Sheet1');
  if (!sheet || ss.getSheets().length <= 1) return;
  if (sheet.getLastRow() === 0 || (sheet.getLastRow() === 1 && sheet.getLastColumn() === 1 && !sheet.getRange('A1').getValue())) {
    ss.deleteSheet(sheet);
  }
}

function getRechoirSpreadsheet_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active && active.getId() === RECHOIR_SPREADSHEET_ID) return active;
  return SpreadsheetApp.openById(RECHOIR_SPREADSHEET_ID);
}
