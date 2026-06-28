import { google, type sheets_v4 } from 'googleapis';

export interface Song {
  id: string;
  title: string;
  youtubeUrl: string;
  thumbnail: string;
  publishedAt: string;
  active: boolean;
  tags: {
    theme: string[];
    tempo: string;
    mood: string[];
    strings: boolean;
    difficulty: string;
    auto: string[];
  };
}

export interface PerformanceLog {
  id: string;
  songId: string;
  date: string;
  services: string[];
  type: string;
  note: string;
}

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

const schemaInitBySheetId = new Map<string, Promise<void>>();

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set');
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheetId() {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error('GOOGLE_SHEET_ID not set');
  return id;
}

async function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

async function getSheetContext() {
  const sheets = await getSheets();
  const sheetId = getSheetId();
  await ensureSchema(sheets, sheetId);
  return { sheets, sheetId };
}

async function ensureSchema(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
): Promise<void> {
  let init = schemaInitBySheetId.get(spreadsheetId);
  if (!init) {
    init = ensureSchemaOnce(sheets, spreadsheetId).catch(error => {
      schemaInitBySheetId.delete(spreadsheetId);
      throw error;
    });
    schemaInitBySheetId.set(spreadsheetId, init);
  }
  await init;
}

async function ensureSchemaOnce(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
): Promise<void> {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });
  const titles = new Set(
    (metadata.data.sheets ?? [])
      .map(sheet => sheet.properties?.title)
      .filter((title): title is string => Boolean(title)),
  );

  const requests: sheets_v4.Schema$Request[] = [];
  if (!titles.has('songs')) {
    requests.push({
      addSheet: {
        properties: {
          title: 'songs',
          gridProperties: { rowCount: 200, columnCount: SONG_HEADERS.length, frozenRowCount: 1 },
        },
      },
    });
  }
  if (!titles.has('performances')) {
    requests.push({
      addSheet: {
        properties: {
          title: 'performances',
          gridProperties: {
            rowCount: 200,
            columnCount: PERFORMANCE_HEADERS.length,
            frozenRowCount: 1,
          },
        },
      },
    });
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: 'songs!A1:K1', values: [SONG_HEADERS] },
        { range: 'performances!A1:F1', values: [PERFORMANCE_HEADERS] },
      ],
    },
  });
}

function csvToArray(s: string): string[] {
  return s ? s.split(',').map(x => x.trim()).filter(Boolean) : [];
}

function arrayToCsv(a: string[]): string {
  return a.join(',');
}

// --- Songs ---

export async function getSongs(): Promise<Song[]> {
  const { sheets, sheetId } = await getSheetContext();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'songs!A2:K',
  });
  const rows = res.data.values ?? [];
  return rowsToSongs(rows).filter(song => song.active);
}

export async function getAllSongs(): Promise<Song[]> {
  const { sheets, sheetId } = await getSheetContext();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'songs!A2:K',
  });
  return rowsToSongs(res.data.values ?? []);
}

function cell(row: unknown[], index: number): string {
  return String(row[index] ?? '');
}

function rowsToSongs(rows: unknown[][]): Song[] {
  return rows
    .filter(r => r[0])
    .map(r => ({
      id: cell(r, 0),
      title: cell(r, 1),
      youtubeUrl: cell(r, 2) || `https://www.youtube.com/watch?v=${cell(r, 0)}`,
      thumbnail:
        cell(r, 3) || `https://img.youtube.com/vi/${cell(r, 0)}/maxresdefault.jpg`,
      publishedAt: cell(r, 4),
      active: cell(r, 5) !== 'FALSE',
      tags: {
        theme: csvToArray(cell(r, 6)),
        tempo: cell(r, 7) || 'mid',
        mood: csvToArray(cell(r, 8)),
        strings: cell(r, 9) === 'TRUE',
        difficulty: cell(r, 10) || 'mid',
        auto: [],
      },
    }));
}

export async function upsertSong(song: Song): Promise<void> {
  const { sheets, sheetId } = await getSheetContext();

  // Find existing row
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'songs!A:A',
  });
  const ids = (res.data.values ?? []).map(r => r[0]);
  const rowIndex = ids.indexOf(song.id);

  const values = [[
    song.id,
    song.title,
    song.youtubeUrl,
    song.thumbnail,
    song.publishedAt,
    song.active ? 'TRUE' : 'FALSE',
    arrayToCsv(song.tags.theme),
    song.tags.tempo,
    arrayToCsv(song.tags.mood),
    song.tags.strings ? 'TRUE' : 'FALSE',
    song.tags.difficulty,
  ]];

  if (rowIndex <= 0) {
    // Append new row
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'songs!A:K',
      valueInputOption: 'RAW',
      requestBody: { values },
    });
  } else {
    // Update existing row
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `songs!A${rowIndex + 1}:K${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
  }
}

export async function updateSongTags(
  songId: string,
  tags: Partial<Song['tags']>,
): Promise<void> {
  const { sheets, sheetId } = await getSheetContext();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'songs!A:K',
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === songId);
  if (rowIndex < 0) throw new Error('Song not found');

  const existingRow = rows[rowIndex];
  const merged = {
    theme: tags.theme ?? csvToArray(existingRow[6] ?? ''),
    tempo: tags.tempo ?? existingRow[7] ?? 'mid',
    mood: tags.mood ?? csvToArray(existingRow[8] ?? ''),
    strings: tags.strings !== undefined ? tags.strings : existingRow[9] === 'TRUE',
    difficulty: tags.difficulty ?? existingRow[10] ?? 'mid',
  };

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `songs!G${rowIndex + 1}:K${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        arrayToCsv(merged.theme),
        merged.tempo,
        arrayToCsv(merged.mood),
        merged.strings ? 'TRUE' : 'FALSE',
        merged.difficulty,
      ]],
    },
  });
}

// --- Performances ---

export async function getPerformances(songId?: string): Promise<PerformanceLog[]> {
  const { sheets, sheetId } = await getSheetContext();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'performances!A2:F',
  });
  const rows = res.data.values ?? [];
  const all = rows
    .filter(r => r[0])
    .map(r => ({
      id: r[0] ?? '',
      songId: r[1] ?? '',
      date: r[2] ?? '',
      services: csvToArray(r[3] ?? '1부'),
      type: r[4] ?? 'encore',
      note: r[5] ?? '',
    }));
  return songId ? all.filter(p => p.songId === songId) : all;
}

export async function appendPerformance(perf: Omit<PerformanceLog, 'id'> & { id: string }): Promise<void> {
  const { sheets, sheetId } = await getSheetContext();
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'performances!A:F',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        perf.id,
        perf.songId,
        perf.date,
        arrayToCsv(perf.services),
        perf.type,
        perf.note,
      ]],
    },
  });
}
