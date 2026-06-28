import { google } from 'googleapis';

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

function csvToArray(s: string): string[] {
  return s ? s.split(',').map(x => x.trim()).filter(Boolean) : [];
}

function arrayToCsv(a: string[]): string {
  return a.join(',');
}

// --- Songs ---

export async function getSongs(): Promise<Song[]> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: 'songs!A2:L',
  });
  const rows = res.data.values ?? [];
  return rows
    .filter(r => r[0] && r[5] !== 'FALSE')
    .map(r => ({
      id: r[0] ?? '',
      title: r[1] ?? '',
      youtubeUrl: r[2] ?? `https://www.youtube.com/watch?v=${r[0]}`,
      thumbnail:
        r[3] ?? `https://img.youtube.com/vi/${r[0]}/maxresdefault.jpg`,
      publishedAt: r[4] ?? '',
      active: r[5] !== 'FALSE',
      tags: {
        theme: csvToArray(r[6] ?? ''),
        tempo: r[7] ?? 'mid',
        mood: csvToArray(r[8] ?? ''),
        strings: r[9] === 'TRUE',
        difficulty: r[10] ?? 'mid',
        auto: [],
      },
    }));
}

export async function upsertSong(song: Song): Promise<void> {
  const sheets = await getSheets();
  const sheetId = getSheetId();

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
  const sheets = await getSheets();
  const sheetId = getSheetId();

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
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
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
  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
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
