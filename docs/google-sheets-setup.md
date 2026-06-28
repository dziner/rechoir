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
| F | `active` | yes | 체크됨 | checkbox boolean. 체크 해제면 앱 목록에서 제외 |
| G | `theme` | no | `찬양,감사` | 쉼표로 구분 |
| H | `tempo` | yes | `mid` | `slow`, `mid`, `fast` |
| I | `mood` | no | `경건,밝음` | 쉼표로 구분 |
| J | `strings` | yes | 체크 해제 | checkbox boolean. 현악기 합주 여부 |
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

## 2. 시트 초기화

Netlify Function은 `songs`와 `performances` 시트가 없으면 자동으로 만들고, 1행 헤더를 적용한다. 즉 앱 배포 후 첫 API 호출만으로 최소 DB 구조는 만들어진다.

Apps Script는 앱 런타임이 아니다. 체크박스, 드롭다운, 필터, 컬럼 너비 같은 스프레드시트 편집 편의 서식을 적용하는 선택 보조 도구다. 기존 데이터는 삭제하지 않는다.

주의: 체크박스는 실제 곡 데이터가 있는 행에만 적용한다. 빈 전체 컬럼에 체크박스를 미리 깔면 Google Sheets API가 빈 행을 데이터 행으로 오해해 새 곡이 1000행 아래에 붙을 수 있다. 또한 `active`, `strings`에는 텍스트 `"TRUE"`/`"FALSE"`가 아니라 체크박스의 boolean 값이 들어가야 한다.

1. 스프레드시트를 연다.
2. 메뉴에서 `Extensions > Apps Script`를 연다.
3. 기본 `Code.gs` 내용을 지우고 [scripts/google-apps-script/rechoir-db-setup.gs](../scripts/google-apps-script/rechoir-db-setup.gs)의 전체 코드를 붙여넣는다.
4. 저장한다.
5. 함수 선택 드롭다운에서 `setupRechoirDatabase`를 선택하고 `Run`을 누른다.
6. 최초 1회 권한 승인을 진행한다.
7. 스프레드시트로 돌아와 새로고침하면 `Rechoir` 메뉴가 생긴다.
8. 이후에는 `Rechoir > DB 시트 초기화/검증`으로 헤더/서식을 다시 적용할 수 있다.

앱이 자동 생성하는 최소 구조만으로 운영할 수도 있지만, 사람이 Google Sheet를 직접 편집할 계획이면 Apps Script를 한 번 실행해두는 것을 권장한다.

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
SYNC_PLAYLIST_ON_READ=true
VITE_DEMO_MODE=false
```

주의:

- `GOOGLE_SERVICE_ACCOUNT_JSON`, `EDIT_PASSWORD`, `YOUTUBE_API_KEY`는 절대 git에 커밋하지 않는다.
- Netlify에 넣을 때 JSON 줄바꿈이 깨지면 `private_key`의 줄바꿈이 `\n`으로 유지되는지 확인한다.
- 플레이리스트의 전체 영상 목록을 가져오려면 `YOUTUBE_API_KEY`가 필요하다.
- `YOUTUBE_PLAYLIST_ID`를 생략하면 기본값 `PLeFx2jWRL18F8RYKiXudh4F7u-4PukfS7`를 사용한다.
- `SYNC_PLAYLIST_ON_READ=true`이면 사이트 진입/새로고침으로 곡 목록을 읽을 때마다 플레이리스트 전체 동기화를 먼저 시도한다.
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

- 빈 스프레드시트라면 배포된 앱을 한 번 열거나 설정 화면에서 `플레이리스트 동기화`를 누르면 서버가 `songs`/`performances` 시트와 헤더를 자동 생성한다.
- `SYNC_PLAYLIST_ON_READ=true`와 `YOUTUBE_API_KEY`가 설정되어 있으면, 앱이 곡 목록을 읽을 때마다 먼저 기본 플레이리스트의 영상 목록을 Google Sheets에 반영한다.
- 설정 화면의 `플레이리스트 동기화` 버튼은 `YOUTUBE_PLAYLIST_ID`의 모든 페이지를 순회해 전체 목록을 가져온다.
- 플레이리스트에서 가져온 영상은 제목 안의 날짜를 기본 공연일로 사용한다. 지원 형식은 `2025.04.23`, `2025-04-23`, `2025/04/23`, `2025 04 23`, `2025년 4월 23일`이다.
- 제목에서 날짜가 추출되면 별도 공연 기록이 없어도 총 공연 수는 최소 1회로 계산하고, 마지막 공연은 `27주 전 (2025.04.23)`처럼 표시한다.
- 앱에서 곡을 직접 추가하면 `songs`에 행이 추가된다.
- 공연 기록을 저장하면 `performances`에 행이 추가된다.
- `2부` 공연 기록이 있으면 앱이 읽기 시점에 `2부성가대` 자동 태그를 계산한다.
- 태그 편집은 `songs`의 `theme`, `tempo`, `mood`, `strings`, `difficulty`만 갱신한다.
- Google Sheet에서 수동 편집할 때는 `id`와 `songId` 값을 임의로 바꾸지 않는 것이 안전하다.

## 7. 문제 해결

### 동기화 완료인데 `songs` 상단이 비어 보이는 경우

확인할 것:

1. URL이 `https://docs.google.com/spreadsheets/d/1Z5JQhnLf8iF6XgJxnbJ6L7pYEyngFV0nU5elABw6eSw/edit`인지 확인한다.
2. `songs` 탭의 `sheetId`가 `1086318606`인지 확인한다.
3. 필터가 켜져 있다면 필터 조건을 모두 해제한다.
4. 2행부터 비어 있는데 아래쪽 1000행 근처에 데이터가 있다면, 예전 Apps Script가 만든 빈 체크박스 행 때문에 append 위치가 밀린 상태다.

2026-06-28 현재 라이브 시트는 183개 곡을 `songs!A2:K184`로 압축 정리했다. 서버도 새 곡을 `append`하지 않고 첫 빈 `id` 행에 직접 쓰도록 변경했기 때문에 같은 현상이 반복되지 않아야 한다.

### `active` 또는 `strings`에 Invalid 경고가 뜨는 경우

원인:

- 해당 열은 Google Sheets checkbox validation이다.
- 텍스트 `"TRUE"`/`"FALSE"`를 직접 입력하면 화면에는 TRUE/FALSE처럼 보이지만 validation 규칙에는 맞지 않는다.
- 서버와 Apps Script는 2026-06-28 이후 boolean 값으로 쓰도록 변경했다.

수동으로 고칠 때는 셀에 텍스트를 타이핑하지 말고 체크박스를 클릭한다. 기존 라이브 시트의 `songs!F2:F184`, `songs!J2:J184`는 boolean 값으로 변환 완료했다.
