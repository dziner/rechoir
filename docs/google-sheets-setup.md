# Google Sheets DB Setup

Rechoir는 Google Sheets를 간단한 운영 DB로 사용한다. 이 문서는 아래 스프레드시트를 Rechoir DB로 쓰기 위한 설정 절차다.

- Spreadsheet URL: https://docs.google.com/spreadsheets/d/1Z5JQhnLf8iF6XgJxnbJ6L7pYEyngFV0nU5elABw6eSw/edit?usp=sharing
- Spreadsheet ID: `1Z5JQhnLf8iF6XgJxnbJ6L7pYEyngFV0nU5elABw6eSw`

## 1. 시트 스키마

Rechoir 앱은 정확히 아래 두 시트 이름을 사용한다.

### `songs`

| Column | Field | Required | Example | Note |
| --- | --- | --- | --- | --- |
| A | `id` | yes | `M7lc1UVf-VE` | YouTube video ID. 앱의 곡 primary key다. |
| B | `title` | yes | `주 하나님 지으신 모든 세계` | 곡 제목 |
| C | `youtubeUrl` | yes | `https://www.youtube.com/watch?v=M7lc1UVf-VE` | 영상 URL |
| D | `thumbnail` | yes | `https://img.youtube.com/vi/M7lc1UVf-VE/maxresdefault.jpg` | 썸네일 URL |
| E | `publishedAt` | yes | `2026-06-28` | `yyyy-mm-dd` 형식 |
| F | `active` | yes | `TRUE` | `FALSE`면 앱 목록에서 제외 |
| G | `theme` | no | `찬양,감사` | 쉼표로 구분 |
| H | `tempo` | yes | `mid` | `slow`, `mid`, `fast` |
| I | `mood` | no | `경건,밝음` | 쉼표로 구분 |
| J | `strings` | yes | `FALSE` | 현악기 합주 여부 |
| K | `difficulty` | yes | `mid` | `low`, `mid`, `high` |

### `performances`

| Column | Field | Required | Example | Note |
| --- | --- | --- | --- | --- |
| A | `id` | yes | UUID | 공연 기록 primary key |
| B | `songId` | yes | `M7lc1UVf-VE` | `songs.id`와 매칭 |
| C | `date` | yes | `2026-06-28` | `yyyy-mm-dd` 형식 |
| D | `services` | yes | `1부,2부` | `1부`, `2부`, `1부,2부` |
| E | `type` | yes | `encore` | `new` 또는 `encore` |
| F | `note` | no | `부활절 특송` | 메모 |

## 2. Apps Script로 시트 초기화

Apps Script는 앱 런타임이 아니다. 시트 이름, 헤더, 체크박스, 드롭다운, 필터를 안전하게 적용하는 보조 도구다. 기존 데이터는 삭제하지 않는다.

1. 스프레드시트를 연다.
2. 메뉴에서 `Extensions > Apps Script`를 연다.
3. 기본 `Code.gs` 내용을 지우고 [scripts/google-apps-script/rechoir-db-setup.gs](../scripts/google-apps-script/rechoir-db-setup.gs)의 전체 코드를 붙여넣는다.
4. 저장한다.
5. 함수 선택 드롭다운에서 `setupRechoirDatabase`를 선택하고 `Run`을 누른다.
6. 최초 1회 권한 승인을 진행한다.
7. 스프레드시트로 돌아와 새로고침하면 `Rechoir` 메뉴가 생긴다.
8. 이후에는 `Rechoir > DB 시트 초기화/검증`으로 헤더/서식을 다시 적용할 수 있다.

참고: Apps Script의 `SpreadsheetApp`은 활성 스프레드시트 접근과 `openById` 접근을 지원하고, `newDataValidation()`으로 드롭다운 검증 규칙을 만들 수 있다. 공식 문서: https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app

## 3. Google Cloud 서비스 계정 설정

Netlify Function은 Apps Script가 아니라 Google Sheets API로 시트를 읽고 쓴다. 따라서 서비스 계정 JSON이 필요하다.

1. Google Cloud Console에서 프로젝트를 만든다.
2. `APIs & Services > Library`에서 `Google Sheets API`를 활성화한다.
3. `IAM & Admin > Service Accounts`에서 서비스 계정을 만든다.
4. 서비스 계정의 `Keys` 탭에서 `Add key > Create new key > JSON`을 선택해 JSON 키를 내려받는다.
5. JSON 안의 `client_email` 값을 복사한다.
6. Rechoir 스프레드시트의 `Share` 버튼을 누르고, 위 `client_email`을 `Editor` 권한으로 초대한다.
7. 내려받은 JSON 파일 내용 전체를 한 줄 JSON 문자열로 환경변수 `GOOGLE_SERVICE_ACCOUNT_JSON`에 넣는다.

로컬에 받은 키 파일이 예를 들어 `docs/boxwood-sector-491202-h1-d135bd9ef92d.json`라면, 아래 명령으로 Netlify UI에 붙여넣을 값을 클립보드에 복사할 수 있다.

```bash
node -e "const fs=require('fs'); process.stdout.write(JSON.stringify(JSON.parse(fs.readFileSync('docs/boxwood-sector-491202-h1-d135bd9ef92d.json','utf8'))))" | pbcopy
```

로컬 `.env`에 직접 추가하려면, `.env`에 기존 `GOOGLE_SERVICE_ACCOUNT_JSON=` 줄이 없는지 먼저 확인한 뒤 아래처럼 추가한다.

```bash
printf 'GOOGLE_SERVICE_ACCOUNT_JSON=' >> .env
node -e "const fs=require('fs'); process.stdout.write(JSON.stringify(JSON.parse(fs.readFileSync('docs/boxwood-sector-491202-h1-d135bd9ef92d.json','utf8'))))" >> .env
printf '\n' >> .env
```

키 파일은 절대 커밋하지 않는다. 환경변수 입력이 끝났으면 저장소 밖으로 옮기거나 삭제하는 것이 안전하다.

공식 문서:

- Google Sheets API Node.js quickstart: https://developers.google.com/workspace/sheets/api/quickstart/nodejs
- Google Workspace credentials guide: https://developers.google.com/workspace/guides/create-credentials
- Service account key guide: https://docs.cloud.google.com/iam/docs/keys-create-delete

## 4. 환경변수

로컬 `.env` 또는 Netlify environment variables에 아래 값을 설정한다.

```bash
GOOGLE_SHEET_ID=1Z5JQhnLf8iF6XgJxnbJ6L7pYEyngFV0nU5elABw6eSw
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"..."}
EDIT_PASSWORD=운영자가_정한_편집_비밀번호
YOUTUBE_API_KEY=선택값
YOUTUBE_PLAYLIST_ID=PLeFx2jWRL18F8RYKiXudh4F7u-4PukfS7
AUTO_SYNC_PLAYLIST_ON_EMPTY=true
VITE_DEMO_MODE=false
```

주의:

- `GOOGLE_SERVICE_ACCOUNT_JSON`, `EDIT_PASSWORD`, `YOUTUBE_API_KEY`는 절대 git에 커밋하지 않는다.
- Netlify에 넣을 때 JSON 줄바꿈이 깨지면 `private_key`의 줄바꿈이 `\n`으로 유지되는지 확인한다.
- 플레이리스트의 전체 영상 목록을 가져오려면 `YOUTUBE_API_KEY`가 필요하다.
- `YOUTUBE_PLAYLIST_ID`를 생략하면 기본값 `PLeFx2jWRL18F8RYKiXudh4F7u-4PukfS7`를 사용한다.
- `AUTO_SYNC_PLAYLIST_ON_EMPTY=true`이면 `songs` 시트가 완전히 비어 있을 때 첫 곡 목록 조회에서 플레이리스트 전체 동기화를 한 번 시도한다.
- `YOUTUBE_API_KEY`가 없으면 전체 플레이리스트 동기화는 실패하지만, 곡 직접 추가와 공연 기록 기능은 사용할 수 있다.

## 5. 로컬 확인

```bash
npm ci
npm run typecheck
npm run build
npm run dev
```

로컬에서 실제 Google Sheets를 보려면 `VITE_DEMO_MODE=false`여야 한다. `VITE_DEMO_MODE=true`면 Google Sheets 대신 브라우저 localStorage의 데모 데이터를 쓴다.

## 6. 운영 메모

- Google Sheets의 `songs` 시트가 비어 있고 `YOUTUBE_API_KEY`가 설정되어 있으면, 앱이 첫 곡 목록 조회 때 기본 플레이리스트의 영상 목록을 자동으로 가져온다.
- 설정 화면의 `플레이리스트 동기화` 버튼은 `YOUTUBE_PLAYLIST_ID`의 모든 페이지를 순회해 전체 목록을 가져온다.
- 앱에서 곡을 직접 추가하면 `songs`에 행이 추가된다.
- 공연 기록을 저장하면 `performances`에 행이 추가된다.
- `2부` 공연 기록이 있으면 앱이 읽기 시점에 `2부성가대` 자동 태그를 계산한다.
- 태그 편집은 `songs`의 `theme`, `tempo`, `mood`, `strings`, `difficulty`만 갱신한다.
- Google Sheet에서 수동 편집할 때는 `id`와 `songId` 값을 임의로 바꾸지 않는 것이 안전하다.
