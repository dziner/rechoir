# REchoir Review Todo

작성 기준: 원래 PRD/Claude Code 구현 방향은 존중한다. 크리티컬한 결함, 보안 문제, 데이터 손상 가능성, 명백한 유지보수 리스크를 우선 검출한다. YAGNI 관점에서는 "확연히 더 나은 단순화"가 있는 경우만 수정 제안하고, 애매한 취향성 리팩터링은 보류한다.

## 해야 할 일

- [ ] P1 공개 배포 전 인증 모델 결정: `sessionStorage` 평문 비밀번호 보관을 단기 서버 토큰 또는 재입력 방식으로 바꿀지 검토
- [ ] P1 공개 배포 전 CORS/rate limit 결정: `Access-Control-Allow-Origin: *` 유지 가능 범위와 비밀번호 시도 제한 방식 검토
- [ ] P1 배포 환경 확인: Netlify/CI Node 버전이 `package.json`의 `>=22.12` 조건을 만족하는지 확인
- [ ] P1 전체 플레이리스트 동기화 사용 시 Netlify에 `YOUTUBE_API_KEY` 설정 확인
- [ ] P2 테스트 보강 후보: `calcDerived`, `scoreSongs`, API validator 단위 테스트 추가
- [ ] P2 설정 공유 정책 확인: 추천 가중치/쿨다운이 사용자별 localStorage인지, 운영자 공용 Sheets 저장인지 결정
- [ ] P3 문서 보강 후보: README가 필요하면 Google Sheets 컬럼 구조, 환경변수, 배포 절차를 짧게 추가

## 완료

- [x] done P1 2026-06-29 룰 기반 자동 태그 적용: YouTube 제목/설명 메타데이터에서 주제, 분위기, 템포, 난이도, 현악 여부를 추론하고 기존 수동 태그는 가능한 범위에서 보존
- [x] done P1 2026-06-28 PRD 중복 카운트 복구: YouTube videoId 기준 곡 중복을 제목 정규화 기준으로 병합하고, 1부/2부 같은 날짜는 하나의 공연으로 기록
- [x] done P1 2026-06-28 라이브 Google Sheet 중복 정리: `songs` 183행을 139곡으로 압축하고 `performances` 167개 날짜별 기록 생성
- [x] done P1 2026-06-28 추천 정렬 기준 변경: 쿨다운 충족 후 오래 안 부른 순, 앵콜 적은 순, 난이도 낮은 순으로 정렬
- [x] done P1 2026-06-28 곡 DB 띄어쓰기 무시 병합 보강: `upsertSong`도 canonical title key로 기존 곡을 찾아 같은 곡 중복 생성 방지
- [x] done P2 2026-06-28 공식 제품명 표기 변경: 사용자 표시와 운영 문서에서 `REchoir` 사용
- [x] done P1 2026-06-28 Google Sheet 연결 실측 확인: 대상 문서는 `rechoir_DB`, `songs` 탭 `sheetId=1086318606`
- [x] done P1 2026-06-28 Google Sheet 행 위치 복구: Apps Script 체크박스 값 때문에 1001행부터 들어간 183곡을 2행부터 보이도록 압축 정리
- [x] done P1 2026-06-28 Sheets upsert 보강: `values.append` 대신 첫 빈 `id` 행에 직접 `update`하여 빈 체크박스 행 뒤로 밀리지 않도록 변경
- [x] done P1 2026-06-28 Apps Script 보강: `F2:F`, `J2:J` 전체 체크박스 생성을 중단하고 실제 데이터 행에만 체크박스 적용
- [x] done P1 2026-06-28 영상 제목 날짜 파서 보강: 실제 플레이리스트 형식인 `YYYY MM DD`도 공연일로 추출
- [x] done P1 2026-06-28 체크박스 validation 타입 복구: `active`/`strings`를 문자열 `TRUE`/`FALSE`가 아니라 boolean 값으로 저장하도록 변경하고 라이브 시트 183행 변환
- [x] done P1 2026-06-28 Google Sheets DB 대상 반영: `GOOGLE_SHEET_ID=1Z5JQhnLf8iF6XgJxnbJ6L7pYEyngFV0nU5elABw6eSw`
- [x] done P1 2026-06-28 플레이리스트 전체 동기화 공통화: YouTube Data API pagination을 `syncPlaylistIntoSheets()`로 분리
- [x] done P1 2026-06-28 빈 DB 자동 동기화 추가: `songs` 시트가 완전히 비어 있으면 첫 목록 조회에서 기본 플레이리스트 동기화 시도
- [x] done P1 2026-06-28 영상 제목 날짜 기반 공연일 계산: 수동 공연 기록이 없어도 제목 날짜를 `lastPerformedAt`으로 사용하고 총 공연 최소 1회 처리
- [x] done P1 2026-06-28 마지막 공연 표시 개선: `27주 전 (2025.04.23)` 형식으로 날짜 포함
- [x] done P1 2026-06-28 빈 Google Sheet 자동 스키마 생성: 서버가 `songs`/`performances` 시트와 헤더를 생성하도록 보강
- [x] done P1 2026-06-28 진입/새로고침 동기화 변경: 곡 목록 GET 요청마다 플레이리스트 전체 동기화 선행
- [x] done P2 2026-06-28 API 캐시 방지와 Dashboard 오류 표시 추가: `Cache-Control: no-store`, 데이터 로드 오류 메시지
- [x] done P2 2026-06-28 inactive 곡 중복 방지: sync 경로에서 active 필터 없는 `getAllSongs()` 사용
- [x] done P2 2026-06-28 동기화 설정 문서 업데이트: `YOUTUBE_PLAYLIST_ID`, `SYNC_PLAYLIST_ON_READ`, `YOUTUBE_API_KEY` 필요 조건 설명
- [x] done P1 2026-06-28 서비스 계정 JSON 키 커밋 방지: `.gitignore`에 `docs/*.json`, `*service-account*.json` 추가
- [x] done P2 2026-06-28 서비스 계정 JSON을 `GOOGLE_SERVICE_ACCOUNT_JSON` 값으로 변환하는 명령을 `docs/google-sheets-setup.md`에 추가
- [x] done P1 2026-06-28 Google Sheets 설정 문서 작성: `docs/google-sheets-setup.md`
- [x] done P1 2026-06-28 Apps Script 초기화 스크립트 작성: `scripts/google-apps-script/rechoir-db-setup.gs`
- [x] done P2 2026-06-28 `songs` 읽기 범위 정리: 실제 사용 컬럼에 맞춰 `songs!A2:K`
- [x] done P2 2026-06-28 Google Sheets 설정 반영 후 검증: Apps Script 문법 확인, `npm run typecheck`, `npm run build`, `npm audit --json`, `git diff --check`
- [x] done P2 2026-06-28 리뷰 문서 작성: `docs/review-2026-06-28.md`
- [x] done P2 2026-06-28 데모 서버 smoke 확인: `VITE_DEMO_MODE=true npm run dev:vite -- --host 127.0.0.1 --port 5173`, `/` 200 OK
- [x] done P1 2026-06-28 검증 완료: `npm run typecheck`, `npm run build`, `npm audit --json`
- [x] done P1 2026-06-28 보안 의존성 업데이트: `googleapis`, `vite`, `@vitejs/plugin-react`, `@types/node`
- [x] done P1 2026-06-28 Netlify Functions 타입체크 추가: `tsconfig.functions.json`, `npm run typecheck`
- [x] done P1 2026-06-28 API 입력 검증 추가: 곡 추가, 태그 수정, 공연 기록 추가 payload 400 처리
- [x] done P1 2026-06-28 비밀번호 비교 강화: 해시 후 `timingSafeEqual` 사용
- [x] done P1 2026-06-28 YouTube sync 개선: 실패 응답 처리, 기존 곡 메타데이터 변경 시 태그 보존 갱신
- [x] done P2 2026-06-28 클라이언트 안정성 개선: 깨진 localStorage fallback, YouTube ID 검증, 일부 URL 인코딩
- [x] done P2 2026-06-28 구조/YAGNI 리뷰: 현재 규모에서는 단일 Netlify 라우터, Google Sheets 저장소, 중복 derived 계산 유지가 적절하다고 판단
- [x] done P2 2026-06-28 사용자 흐름 리뷰: 추천, 라이브러리, 곡 상세, 기록, 설정/동기화 흐름 점검
- [x] done P1 2026-06-28 데이터 무결성 리뷰: Sheets upsert/update/append와 sync 동작 점검
- [x] done P1 2026-06-28 보안 리뷰: 비밀번호 처리, CORS, secret 노출 검색, dependency audit 점검
- [x] done P1 2026-06-28 검증 실행: 의존성 설치, 타입체크/빌드, 보안 감사 수행
- [x] done P1 2026-06-28 저장소 구조와 제품 의도 파악: 프론트, Netlify Functions, Google Sheets, 데모 모드 경계 정리
- [x] done P1 2026-06-28 초기 저장소 파일 목록과 Git 상태 확인
- [x] done P1 2026-06-28 기존 메모리에서 rechoir 관련 이전 맥락 검색: 관련 기록 없음

## 검토 로그

- 2026-06-28 시작: `/Users/jinuk/_DEV/rechoir`에서 리뷰 진행. 현재 브랜치는 `claude/rechoir-encore-service-u6nceq`.
- 2026-06-28 초기 관찰: Vite/React 프론트엔드와 Netlify Functions API, Google Sheets 저장소, YouTube playlist sync로 구성된 소형 서비스 구조로 보임.
- 2026-06-28 최초 `npm audit`: high 1건, moderate 5건. 주로 Vite 개발 서버 계열과 `googleapis` 하위 의존성.
- 2026-06-28 의존성 업데이트 후 `npm audit`: 취약점 0건.
- 2026-06-28 `npm run build`: 성공. 빌드 과정에 Netlify Functions 타입체크 포함.
- 2026-06-28 demo mode Vite 서버 확인: `http://127.0.0.1:5173/` 200 OK.
- 2026-06-28 secret 검색 결과: 실제 키 원문은 발견되지 않음. 남은 구조 리스크는 `sessionStorage` 비밀번호 보관과 wildcard CORS.
- 2026-06-28 사용자가 지정한 DB 스프레드시트 ID를 `.env.example`과 설정 문서에 반영.
- 2026-06-28 서비스 계정 키 파일이 `docs/boxwood-sector-491202-h1-d135bd9ef92d.json`에 있으나 untracked 상태임을 확인. 커밋 방지용 `.gitignore` 규칙 추가.
- 2026-06-28 Google Cloud 서비스 계정 설정 7번을 위해 JSON 키 파일을 한 줄 환경변수 값으로 변환하는 `node -e ... | pbcopy` 명령을 문서화.
- 2026-06-28 Apps Script는 런타임 API가 아니라 `songs`/`performances` 시트 헤더, 필터, 체크박스, 드롭다운을 적용하는 초기화 도구로 제공.
- 2026-06-28 설정 반영 후 `npm run typecheck`, `npm run build`, `npm audit --json`, `git diff --check` 성공.
- 2026-06-28 플레이리스트 전체 동기화는 YouTube Data API `playlistItems` 페이지네이션으로 처리. API key가 없으면 전체 목록 보장은 하지 않음.
- 2026-06-28 초기에는 빈 DB 첫 조회 시 자동 import를 시도하도록 구성했으나, 이후 사용자 요청에 따라 모든 곡 목록 조회마다 동기화하도록 확장.
- 2026-06-28 공연 통계 보정: `calcDerived`가 영상 제목의 날짜를 공연일 후보로 합산하도록 변경. 지원 형식은 `YYYY.MM.DD`, `YYYY-MM-DD`, `YYYY/MM/DD`, `YYYY년 M월 D일`.
- 2026-06-28 Google Sheets 연동 보강: 비어 있는 새 스프레드시트여도 API가 `songs`/`performances` 시트와 헤더를 자동 생성하도록 변경.
- 2026-06-28 사용자의 요청에 따라 `SYNC_PLAYLIST_ON_READ=true` 기본값으로 사이트 진입/새로고침 시마다 Google Sheet와 YouTube playlist를 동기화하도록 변경.
- 2026-06-28 실측 결과: 지정 스프레드시트는 맞고 `songs` 탭에 183곡이 존재했으나, Apps Script가 만든 빈 체크박스 값 때문에 API append가 1001행부터 데이터를 추가해 상단이 비어 보였음.
- 2026-06-28 복구 작업: `songs`의 ID 있는 183개 행을 2행부터 재배치하고, 185행 이하의 이전 위치/빈 체크박스 값을 정리.
- 2026-06-28 재발 방지: 서버 upsert를 첫 빈 `id` 행 직접 쓰기로 변경하고, Apps Script 체크박스 적용 범위를 실제 데이터 행으로 제한.
- 2026-06-28 체크박스 경고 원인: `active`, `strings` 열은 checkbox validation이지만 값이 문자열 `"TRUE"`/`"FALSE"`라 Invalid가 표시됨. 서버 쓰기와 Apps Script를 boolean 저장으로 변경하고 라이브 `songs!F2:F184`, `songs!J2:J184`를 변환.
- 2026-06-28 PRD 기준 재확인: 같은 곡을 1부/2부에 부른 경우는 하나의 공연으로 카운트해야 함. 기존 sync는 YouTube videoId마다 곡을 생성해 `I AM 1부`, `I AM 2부`가 별도 곡으로 노출됨.
- 2026-06-28 중복 병합 적용: 제목에서 날짜, `콰이어`, `1부`/`2부`, 일부 예배/행사 표기를 제거한 canonical key로 곡을 병합. 라이브 시트는 `songs` 183행에서 139곡으로 정리, `I AM`은 하나의 곡과 4개 날짜별 공연으로 정리됨.
- 2026-06-28 추천 정렬 변경: 기존 score desc 정렬은 52주 이상 휴식곡이 같은 점수로 묶이는 문제가 있어, 명시적 우선순위 정렬로 변경.
- 2026-06-28 곡 병합 보강: canonical key는 띄어쓰기와 주요 구두점을 제거해 비교하며, 수동 추가/동기화 저장 시에도 같은 canonical key면 기존 곡 행을 갱신.
- 2026-06-28 라이브 DB 추가 정리: `영원부터영원까지`/`영원부터영원까지 추수감사` 잔여 중복을 1곡으로 병합하고 공연 기록은 `2025-11-16`, `1부,2부` 한 행으로 정리.
- 2026-06-29 태그 자동화 1차 적용: AI 호출 없이 제목/설명 키워드 룰로 `theme`, `mood`, `tempo`, `difficulty`, `strings`를 추론한다. 수동 지정된 `theme`/`mood`와 기본값이 아닌 `tempo`/`difficulty`는 유지한다.
- 2026-06-29 라이브 DB 태그 백필: 현재 제목 기준으로 `songs` 139곡 중 62행의 기본/빈 태그를 갱신. 확인 결과 `theme` 46행, `mood` 52행, `tempo != mid` 20행, `difficulty != mid` 7행, `strings` 2행.
