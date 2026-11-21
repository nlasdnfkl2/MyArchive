# MY-ARCHIVE 95 OS

> **Windows 95 + Neo-Brutalism 데스크톱 감성과 Google Apps Script 서버리스 아키텍처를 결합한 개인 문화·예술 감상 기록 웹 OS**

도서, 음악, 영화·시리즈 및 웹에서 발견한 콘텐츠를 한곳에 기록하고, 페이지 내부의 가상 브라우저(`EXPLORER95.EXE`), 주크박스(`JUKEBOX 95`), 커뮤니티 피드(`COMMUNITY95.EXE`)를 통해 탐색부터 재생·감상 저장·공유까지 레트로 OS 환경에서 완결할 수 있는 아카이브 워크스테이션입니다.

---

## 지금까지 완료한 작업 (v2.0 코어 OS · 탐색/재생 · 커뮤니티 피드)

### 1. Windows 95 + Neo-Brutalism 멀티 윈도우 데스크톱 셸
- **멀티 태스킹 창 관리 (`index.html`, `css/style.css`, `js/window-mgr.js`):** 다중 창 드래그 이동, 최소화/복원, 제목 표시줄 더블클릭 최대화, 시작 메뉴·하단 태스크바 창 전환 및 Web Audio API 기반 8비트 시스템 효과음을 구현했습니다.
- **데스크톱 개인화 & 디스플레이 등록 정보 (`DISPLAY95.EXE`):**
  - 바탕화면 우클릭 컨텍스트 메뉴 지원
  - 배경 테마·패턴 5종 전환 (클래식 틸, 미드나잇 블루, 95 체크 패턴, 플로피 그리드, 신스웨이브 퍼플)
  - **CRT 브라운관 스캔라인(주사선) 오버레이** 토글 및 워크스테이션 소유자 이름 설정

### 2. Google Apps Script 서버리스 백엔드 & 아카이브 CRUD
- **시트 자동 생성 및 실시간 동기화 (`backend/Code.gs`, `js/archive-app.js`):** `Archive`, `Notes`, `Mailbox`, `Bookmarks` 등 핵심 시트를 자동 구성하고 실시간 CRUD 및 상호작용 데이터를 동기화합니다.
- **다중 소스 메타데이터 자동 수집 & 무결성 검증:**
  - **도서:** Google Books, Apple Books, Open Library API 연동
  - **음악:** Apple Music (KR/US) 및 YouTube 검색 연동
  - **영상:** iTunes Movie 및 TVMaze 시리즈 API 연동
  - **웹 URL 파서:** 일반 웹페이지나 YouTube URL 입력 시 제목·제작자·표지(Open Graph) 자동 추출
  - 동일 매체·동일 제목 중복 등록 차단(본인 ID 수정 시 예외 허용) 및 다중 필터·정렬 기능 적용
- **내장 기본 유틸리티:** 개인 감상 통계 차트(`js/visualizer.js`), 퀵 메모장(`Notes`), 비밀 추천 우체통(`GmailApp` 이메일 즉시 알림), 레트로 미니게임 팩(`js/gamepack.js`)을 탑재했습니다.

### 3. 주크박스 YouTube 자동 검색 및 스트리밍 복구 (`JUKEBOX 95`)
- **InnerTube API 기반 검색 엔진 (`js/jukebox.js`, `backend/Code.gs`):** YouTube InnerTube 검색 및 HTML 파싱 기반 `ytsearch` 엔드포인트를 구축해 재생 실패 문제를 해결하고, 검색 결과를 `localStorage`에 캐싱해 재재생 속도를 높였습니다.
- **후보 전환 & 링크 영구 연결:** 검색된 상위 후보 `#1 ~ #5` 버튼으로 라이브·MV·공식 음원을 즉시 전환하거나, 원하는 YouTube URL을 직접 입력해 해당 트랙에 영구 연결할 수 있습니다.
- **탐색기 95 연동:** 주크박스에서 `[탐색기 95에서 찾기]`를 클릭하면 가상 브라우저가 열리며 해당 아티스트의 영상 목록을 바로 탐색할 수 있습니다.

### 4. 가상 웹·유튜브 탐색기 & 즉석 감상 기록 (`EXPLORER95.EXE`)
- **인앱 YouTube 95 검색 & 재생 (`js/browser-app.js`):** 주소창에 검색어 또는 `yt:검색어`를 입력하면 가상 브라우저 뷰포트 안에서 YouTube 영상을 검색하고 즉시 재생합니다.
- **하이브리드 웹 서핑 (`리더모드` / `라이브프레임`):** `X-Frame-Options`가 걸린 일반 웹페이지도 1995년 웹 문서 스타일의 **리더모드**로 본문 요약·표지·하이퍼링크를 추출해 클릭하며 파도타기 탐색을 할 수 있습니다.
- **즉석 감상 기록 & 즐겨찾기:** 탐색 중인 영상이나 웹페이지 정보를 자동으로 불러와 별점과 한줄평만 적고 시트에 즉시 저장(`이 페이지 감상 기록하기`)하는 기능과 매체별 즐겨찾기(`Bookmarks`) 서랍을 구현했습니다.

### 5. 커뮤니티 SNS 피드 & 전체 통계 대시보드 (`COMMUNITY95.EXE`)
- **공유 피드 및 계정 모드 연동 (`js/community-app.js`):** 개인 계정과 공용 워크스테이션 계정을 구분해 표시하며, 공개 설정(`shared !== 'N'`)된 아카이브 기록을 타임라인 형태로 모아봅니다.
- **커뮤니티 전체 통계 대시보드:** 전체 공유 게시글 수, 참여 이용자 수, 커뮤니티 평균 평점, 인기 공유 매체, 활발한 공유 멤버 KPI 카드 및 전체 매체 분포·월별 공유 추이 차트를 제공합니다.
- **다중 필터·정렬 & 소셜 인터랙션:** 매체별·작성자별·최소 별점 필터와 최신순/좋아요순/별점순 정렬, 통합 검색을 지원합니다. 각 게시글에 좋아요 토글(`toggle_like`), 한줄 댓글 작성·조회(`add_comment`), 타 이용자 추천작을 내 비공개 아카이브로 복사하는 **내 아카이브로 담기(스크랩)** 기능을 구현했습니다.

---

## 현재 디렉터리 구조

```text
MyArchive-main/
├── index.html                 # 메인 OS 데스크톱 셸 (바탕화면 아이콘, 플로팅 창, 태스크바)
├── README.md                  # 프로젝트 개요, 완료 내역 및 향후 개발 로드맵
├── css/
│   └── style.css              # Windows 95 입체 UI + Neo-Brutalism 스타일, 배경 테마, CRT 효과
├── js/
│   ├── config.js              # GAS Web App URL 설정, 로컬 스토리지 키, 공통 유틸리티
│   ├── window-mgr.js          # 창 드래그·포커스·최소화, 8비트 사운드, Win95 알림창
│   ├── archive-app.js         # 감상 기록 CRUD, 다중 소스 검색, 메모장, 비밀 우체통
│   ├── visualizer.js          # 개인 감상 통계 차트 시각화 모듈
│   ├── community-app.js       # COMMUNITY95.EXE 커뮤니티 SNS 피드, 전체 통계, 좋아요·댓글·스크랩
│   ├── jukebox.js             # JUKEBOX 95 (YouTube 자동 검색·캐싱·후보 전환 플레이어)
│   ├── browser-app.js         # EXPLORER95.EXE 가상 브라우저, 북마크, DISPLAY95.EXE, 우클릭 메뉴
│   └── gamepack.js            # 내장 레트로 미니게임 팩
└── backend/
    └── Code.gs                # Google Apps Script 서버리스 API (시트 CRUD, 피드 상호작용, 파서, 메일 알림)
