# MY-ARCHIVE 95 OS

> Windows 95 + Neo-Brutalism 데스크톱과 Google Apps Script 서버리스 백엔드를 결합한 개인 문화·예술 감상 기록 웹 OS

도서, 음악, 영화·시리즈, 웹 콘텐츠를 기록하고 내장 앱(`EXPLORER95.EXE`, `JUKEBOX 95`, `COMMUNITY95.EXE`, `PORTFOLIO95.EXE`, `DATANODE95.EXE` 등)으로 탐색·재생·통계·공유까지 한 환경에서 처리하는 워크스테이션입니다.

- **배포 URL:** <https://nlasdnfkl2.github.io/MyArchive/>

---

## 주요 기능

- **부팅 & 데스크톱 셸 (`brutal-preloader.js`, `boot-*.js`, `shell-builder.js`, `window-mgr.js`, `win95-widgets.js`, `style.css`, `test.txt`):**
  - 팝아트/네오 브루탈리즘 모듈 프리로더(가중치 기반 순차 진행, 완료 배너 연출 후 TV 전원 꺼짐 전환) 및 `test.txt` 인코딩(2진수·Base64) 디코딩 기반 테이프 삽입·역재생 가속 사운드
  - 대기 화면(노이즈·마키·3D 타이틀·"딸-깍" 스위치 사운드·`test.txt` 순방향 크로스페이드 루프 및 부팅 애니메이션 시작 시점까지 재생 유지) → 3D CRT/SETUP/BIOS POST/스플래시 → PIN 로그인·신규 가입·공용 단말기·계정 설정
  - 멀티 윈도우 드래그·포커스·최소화·태스크바·계단식 배열, 작업 관리자(`Ctrl+Alt+Delete`), 화면 보호기, BSOD, 8비트 효과음, 바탕화면 위젯 및 `DISPLAY95.EXE` 테마·CRT 스캔라인 토글
- **아카이브 CRUD & 자동 메타데이터 (`config.js`, `archive-app.js`):**
  - GAS 시트(`Archive`, `Users`, `Notes`, `Mailbox`, `Bookmarks`, `Likes`, `Comments`) 연동 및 상단 동기화 상태 표시
  - 도서(Google/Apple Books, Open Library), 음악(Apple Music, YouTube), 영상(iTunes Movie, TVMaze), 웹 URL 파서 자동 수집 및 중복 등록 방지
- **내장 유틸리티 & 미니게임 (`archive-app.js`, `visualizer.js`, `gamepack.js`):**
  - `DATANODE95.EXE`(물리 노드 맵·워드클라우드·편중도·연속 감상 일수), `TIMELINE95.EXE`, `MOODPICK.EXE`, `QUIZ95.EXE`, `CALENDAR95.EXE`, `STAMP95.EXE`(인장·가계부 영수증 인쇄), `NOTEPAD95.EXE`, `MAILBOX95.EXE`(QR 공유), `GAMEPACK95.EXE`(솔리테어·지뢰찾기·카드 뒤집기·하이로우)
- **주크박스 & 가상 브라우저 (`jukebox.js`, `browser-app.js`):**
  - `JUKEBOX 95`: YouTube 자동 검색·`localStorage` 캐싱·`#1~#5` 후보 전환·탐색기 양방향 연동
  - `EXPLORER95.EXE`: 인앱 YouTube 검색/재생, 리더모드·라이브프레임, 즉석 감상 기록 및 북마크 관리
- **공개 광장 피드 (`community-app.js`):**
  - 공개 기록 피드, 전체 통계·차트, 필터/정렬/검색, 좋아요·댓글·내 아카이브 스크랩

---

## 디렉터리 구조

```text
MyArchive/
├── css/
│   └── style.css
├── js/
│   ├── archive-app.js
│   ├── boot-animation.js
│   ├── boot-controller.js
│   ├── boot-login.js
│   ├── boot-wait.js
│   ├── browser-app.js
│   ├── brutal-preloader.js
│   ├── community-app.js
│   ├── config.js
│   ├── gamepack.js
│   ├── jukebox.js
│   ├── shell-builder.js
│   ├── visualizer.js
│   ├── win95-widgets.js
│   └── window-mgr.js
├── LICENSE
├── README.md
├── index.html
└── test.txt
