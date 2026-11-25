# MY-ARCHIVE 95 OS

> **Windows 95 + Neo-Brutalism 데스크톱 감성과 Google Apps Script 서버리스 아키텍처를 결합한 개인 문화·예술 감상 기록 웹 OS**

도서, 음악, 영화·시리즈 및 웹에서 발견한 콘텐츠를 한곳에 기록하고, 페이지 내부의 가상 브라우저(`EXPLORER95.EXE`), 주크박스(`JUKEBOX 95`), 커뮤니티 피드(`COMMUNITY95.EXE`), 포트폴리오 창(`PORTFOLIO95.EXE`)을 통해 탐색부터 재생·감상 저장·공유까지 레트로 OS 환경에서 완결할 수 있는 아카이브 워크스테이션입니다.

- **배포 URL:** <https://nlasdnfkl2.github.io/MyArchive/>

---

## 주요 구현 기능 (최종 버전)

### 1. Windows 95 + Neo-Brutalism 멀티 윈도우 데스크톱 셸 & 부팅 시퀀스
- **대기 화면, 3D/BIOS 애니메이션 & 로그온 (`js/boot-wait.js`, `js/boot-animation.js`, `js/boot-login.js`, `index.html`):**
  - 첫 클릭 전 신호 대기 노이즈·마키·3D 타이틀 레이어 및 "딸-깍" 이중 클릭 사운드(`js/boot-wait.js`)
  - 3D CRT 회전/줌 애니메이션, 최초 실행 텍스트 SETUP 화면, BIOS POST(메모리 체크, 드라이브 인식, CMOS 이스터에그) 및 부팅 스플래시(`js/boot-animation.js`)
  - 개인 계정 로그인(4자리 PIN), 신규 계정 가입, 비밀번호 없는 **공용 단말기** 접속 모드, 유저 검색, 상단 계정 배지 클릭을 통한 **계정 설정** 및 로그아웃/재시동(`js/boot-login.js`)
- **멀티 태스킹 창 관리 & 위젯 (`index.html`, `css/style.css`, `js/window-mgr.js`, `js/win95-widgets.js`):**
  - 플로팅 창 드래그 이동, 포커스 전환, 최소화/닫기, 시작 메뉴·하단 작업표시줄 창 전환 및 계단식 배열(Cascade)
  - `Ctrl+Alt+Delete` **Windows 95 작업 관리자**, 화면 보호기, 블루스크린(BSOD) 시연 및 Web Audio API 기반 8비트 시스템 효과음 지원
  - 포트폴리오 가상 창(`#win-portfolio`), 제작자 및 라이선스 정보 창(`openAboutAndLicenseWindow`, `LICENSE` 연계), 바탕화면 위젯 연동
  - 유니코드 이모지 대신 16×16 도트 픽셀 SVG(`crispEdges`)와 입체 베벨(Bevel)을 적용한 UI
- **디스플레이 등록 정보 (`DISPLAY95.EXE`):**
  - 바탕화면 테마·패턴 전환 (`teal`, `navy`, `olive`, `plum`, `brick`, `matrix`, `grid`)
  - **CRT 브라운관 스캔라인(주사선) 오버레이** 실시간 토글 및 워크스테이션 개인화 설정

### 2. Google Apps Script 서버리스 백엔드 & 아카이브 CRUD
- **시트 자동 생성 및 실시간 동기화 (`js/config.js`, `js/archive-app.js`, `js/boot-login.js`):**
  - `Archive`, `Users`, `Notes`, `Mailbox`, `Bookmarks`, `Likes`, `Comments` 시트와 연동해 CRUD 및 상호작용 데이터를 동기화합니다.
  - 상단 상태 표시줄에서 실시간 동기화 상태(`동기화 중` / `동기화 완료` / `동기화 실패`)를 표시합니다.
- **다중 소스 메타데이터 자동 수집 & 중복 방지:**
  - **도서:** Google Books, Apple Books, Open Library API 연동
  - **음악:** Apple Music (KR/US) 및 YouTube 검색 연동
  - **영상:** iTunes Movie 및 TVMaze 시리즈 API 연동
  - **웹 URL 파서:** 웹페이지·YouTube URL 입력 시 제목·제작자·표지(Open Graph) 추출
  - 동일 매체·동일 제목 중복 등록 차단(본인 항목 수정 시 예외) 및 매체·평점·키워드 필터링
- **내장 유틸리티 & 생산성 도구 (`js/archive-app.js`, `js/visualizer.js`, `js/gamepack.js`):**
  - **감상 통계 & 물리 노드 맵 (`DATANODE95.EXE`):** Canvas 물리 엔진 노드 그래프, 워드클라우드 필터, 매체별 비중·취향 편중도·최장 연속 감상 일수 분석, 조회 범위 전환(`내 계정 전체` vs `공개 + 공용 계정`)
  - **연대기 & 큐레이션 도구:** 감상 연대기 및 상·하반기 성향 비교(`TIMELINE95.EXE`), 기분별 명작 추천기(`MOODPICK.EXE`), 초성 힌트 기억력 퀴즈(`QUIZ95.EXE`), 월력·기념일 관리(`CALENDAR95.EXE`), 열람 인장 및 문화생활 가계부 영수증(`STAMP95.EXE`)
  - **레트로 미니게임 팩 (`GAMEPACK95.EXE`):** 클론다이크 솔리테어 95, 지뢰찾기 95, 12장 카드 뒤집기, 별점 하이로우 대결
  - **간이 메모장 & 전자 우체통:** 비망록 동기화(`NOTEPAD95.EXE`) 및 명작 추천 메시지 전송·QR 공유(`MAILBOX95.EXE`)

### 3. 주크박스 YouTube 자동 검색 및 스트리밍 플레이어 (`JUKEBOX 95`)
- **검색 & 캐싱 (`js/jukebox.js`):** YouTube 검색 결과를 `localStorage`에 캐싱해 재재생 속도를 높였습니다.
- **후보 전환 & URL 연결:** 상위 후보 `#1 ~ #5` 전환 및 트랙별 YouTube URL 직접 연결을 지원합니다.
- **탐색기 95 양방향 연동:** `[탐색기 95에서 찾기]` 및 `[주크박스 95에서 듣기]` 간 트랙·영상 연동을 제공합니다.

### 4. 가상 웹·유튜브 탐색기 & 즉석 감상 기록 (`EXPLORER95.EXE`)
- **인앱 YouTube 95 검색 & 재생 (`js/browser-app.js`):** 검색어 또는 `yt:검색어` 입력으로 가상 뷰포트 내 검색 및 재생을 지원합니다.
- **리더모드 / 라이브프레임:** 외부 임베드 제한 페이지도 본문·표지·링크 중심의 리더모드로 탐색할 수 있습니다.
- **즉석 감상 기록 & 즐겨찾기:** 현재 탐색 중인 콘텐츠 정보를 불러와 감상록으로 바로 저장하고, 매체별 북마크(`Bookmarks`)를 관리합니다.

### 5. 전체 공개 자료실 · 광장 피드 & 전체 통계 대시보드 (`COMMUNITY95.EXE`)
- **공유 피드 (`js/community-app.js`):** 개인 계정과 공용 단말기 계정을 구분하며, 공개(`shared !== 'N'`) 기록을 모아 보여줍니다.
- **커뮤니티 전체 통계:** 공유 게시글 수, 참여 이용자 수, 평균 평점, 인기 매체, 활발한 공유 멤버 지표 및 분포·추이 차트를 제공합니다.
- **필터·정렬 & 소셜 기능:** 매체·작성자·별점 필터, 최신순/좋아요순/별점순 정렬, 검색, 좋아요 토글, 댓글 작성/조회, 타 이용자 기록을 내 아카이브로 담기(스크랩) 기능을 지원합니다.

---

## 디렉터리 구조

```text
MyArchive/
├── css/
│   └── style.css              # Windows 95 입체 UI + Neo-Brutalism 스타일, 배경 테마, CRT 효과
├── js/
│   ├── archive-app.js         # 감상 기록 CRUD, 다중 소스 검색, 월력·기분추천·퀴즈·연대기·인장·메모장·우체통
│   ├── boot-animation.js      # 3D CRT 애니메이션, 초기 SETUP, BIOS POST 부팅 시퀀스, 스플래시
│   ├── boot-login.js          # 로그인/회원가입, 유저 검색, 계정 설정 모달, 동기화 훅 및 부팅 진입점
│   ├── boot-wait.js           # 신호 대기 노이즈·마키·3D 타이틀 및 "딸-깍" 이중 클릭 사운드
│   ├── browser-app.js         # EXPLORER95.EXE 가상 브라우저, 북마크, DISPLAY95.EXE, 우클릭 메뉴
│   ├── community-app.js       # COMMUNITY95.EXE 공개 자료실 광장 피드, 전체 통계, 좋아요·댓글·스크랩
│   ├── config.js              # GAS Web App URL 설정, 로컬 스토리지 캐시, 권한 판별 및 공통 유틸리티
│   ├── gamepack.js            # 내장 레트로 미니게임 팩 (솔리테어 95, 지뢰찾기 95, 카드 뒤집기, 하이로우)
│   ├── jukebox.js             # JUKEBOX 95 (YouTube 자동 검색·캐싱·후보 전환 스테레오 플레이어)
│   ├── visualizer.js          # Canvas 물리 데이터 노드 맵, 워드클라우드, 편중도 통계 진단
│   ├── win95-widgets.js       # 바탕화면 위젯(CD Player, Mood Music AI, Clock 95, Calendar 95 등) 모듈
│   └── window-mgr.js          # 창 드래그·포커스·최소화, 포트폴리오 가상 창, 제작자·라이선스 창, 7종 테마, 작업 관리자, BSOD
├── LICENSE                    # 프로젝트 라이선스 정보
├── README.md                  # 프로젝트 개요 및 주요 구현 기능 문서
└── index.html                 # 메인 OS 데스크톱 셸 (바탕화면 아이콘, 플로팅 창, 태스크바, 스크립트 로더)
