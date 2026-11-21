# 🖥️ MY-ARCHIVE 95 OS

> **Windows 95 + Neo-Brutalism 데스크톱 감성과 Google Apps Script 서버리스 아키텍처를 결합한 개인 문화·예술 감상 기록 웹 OS**

도서, 음악, 영화·시리즈 및 웹에서 발견한 콘텐츠를 한곳에 기록하고, 페이지 내부의 가상 브라우저(`EXPLORER95.EXE`)와 주크박스(`JUKEBOX 95`)를 통해 탐색부터 재생·감상 저장까지 레트로 OS 환경에서 완결할 수 있는 개인 아카이브 워크스테이션입니다.

---

## ✅ 지금까지 완료한 작업 (v1.5 코어 OS 및 탐색·재생 엔진)

### 1. Windows 95 + Neo-Brutalism 멀티 윈도우 데스크톱 셸
- **멀티 태스킹 창 관리 (`index.html`, `css/style.css`, `js/window-mgr.js`):** 다중 창 드래그 이동, 최소화/복원, 제목 표시줄 더블클릭 최대화, 시작 메뉴·하단 태스크바 창 전환 및 Web Audio API 기반 8비트 시스템 효과음을 구현했습니다.
- **데스크톱 개인화 & 디스플레이 등록 정보 (`DISPLAY95.EXE`):**
  - 바탕화면 우클릭 컨텍스트 메뉴 지원
  - 배경 테마·패턴 5종 전환 (클래식 틸, 미드나잇 블루, 95 체크 패턴, 플로피 그리드, 신스웨이브 퍼플)
  - **CRT 브라운관 스캔라인(주사선) 오버레이** 토글 및 워크스테이션 소유자 이름 설정

### 2. Google Apps Script 서버리스 백엔드 & 아카이브 CRUD
- **4대 시트 자동 생성 및 실시간 동기화 (`backend/Code.gs`, `js/archive-app.js`):** `Archive`, `Notes`, `Mailbox`, `Bookmarks` 시트를 자동 구성하고 실시간 CRUD를 지원합니다.
- **다중 소스 메타데이터 자동 수집 & 무결성 검증:**
  - **도서:** Google Books, Apple Books, Open Library API 연동
  - **음악:** Apple Music (KR/US) 및 YouTube 검색 연동
  - **영상:** iTunes Movie 및 TVMaze 시리즈 API 연동
  - **웹 URL 파서:** 일반 웹페이지나 YouTube URL 입력 시 제목·제작자·표지(Open Graph) 자동 추출
  - 동일 매체·동일 제목 중복 등록 차단(본인 ID 수정 시 예외 허용) 및 다중 필터·정렬 기능 적용
- **내장 기본 유틸리티:** 감상 통계 차트(`js/visualizer.js`), 퀵 메모장(`Notes`), 비밀 추천 우체통(`GmailApp` 이메일 즉시 알림), 레트로 미니게임 팩(`js/gamepack.js`)을 탑재했습니다.

### 3. 주크박스 YouTube 자동 검색 및 스트리밍 복구 (`JUKEBOX 95`)
- **InnerTube API 기반 검색 엔진 (`js/jukebox.js`, `backend/Code.gs`):** YouTube InnerTube 검색 및 HTML 파싱 기반 `ytsearch` 엔드포인트를 구축해 재생 실패 문제를 해결하고, 검색 결과를 `localStorage`에 캐싱해 재재생 속도를 높였습니다.
- **후보 전환 & 링크 영구 연결:** 검색된 상위 후보 `#1 ~ #5` 버튼으로 라이브·MV·공식 음원을 즉시 전환하거나, 원하는 YouTube URL을 직접 입력해 해당 트랙에 영구 연결할 수 있습니다.
- **탐색기 95 연동:** 주크박스에서 `[🌐 탐색기 95에서 찾기]`를 클릭하면 가상 브라우저가 열리며 해당 아티스트의 영상 목록을 바로 탐색할 수 있습니다.

### 4. 가상 웹·유튜브 탐색기 & 즉석 감상 기록 (`EXPLORER95.EXE`)
- **인앱 YouTube 95 검색 & 재생 (`js/browser-app.js`):** 주소창에 검색어 또는 `yt:검색어`를 입력하면 가상 브라우저 뷰포트 안에서 YouTube 영상을 검색하고 즉시 재생합니다.
- **하이브리드 웹 서핑 (`리더모드` ↔ `라이브프레임`):** `X-Frame-Options`가 걸린 일반 웹페이지도 1995년 웹 문서 스타일의 **리더모드**로 본문 요약·표지·하이퍼링크를 추출해 클릭하며 파도타기 탐색을 할 수 있습니다.
- **즉석 감상 기록 & 즐겨찾기:** 탐색 중인 영상이나 웹페이지 정보를 자동으로 불러와 별점과 한줄평만 적고 시트에 즉시 저장(`💾 이 페이지 감상 기록하기`)하는 기능과 매체별 즐겨찾기(`Bookmarks`) 서랍을 구현했습니다.

---

## 📁 현재 디렉터리 구조

```text
MyArchive-main/
├── index.html                 # 메인 OS 데스크톱 셸 (바탕화면 아이콘, 플로팅 창, 태스크바)
├── README.md                  # 프로젝트 개요, 완료 내역 및 v2.0 개발 로드맵
├── css/
│   └── style.css              # Windows 95 입체 UI + Neo-Brutalism 스타일, 배경 테마, CRT 효과
├── js/
│   ├── config.js              # GAS Web App URL 설정, 로컬 스토리지 키, 공통 유틸리티
│   ├── window-mgr.js          # 창 드래그·포커스·최소화, 8비트 사운드, Win95 알림창
│   ├── archive-app.js         # 감상 기록 CRUD, 다중 소스 검색, 메모장, 비밀 우체통
│   ├── visualizer.js          # 감상 통계 차트 시각화 모듈
│   ├── jukebox.js             # JUKEBOX 95 (YouTube 자동 검색·캐싱·후보 전환 플레이어)
│   ├── browser-app.js         # EXPLORER95.EXE 가상 브라우저, 북마크, DISPLAY95.EXE, 우클릭 메뉴
│   └── gamepack.js            # 내장 레트로 미니게임 팩
└── backend/
    └── Code.gs                # Google Apps Script 서버리스 API (시트 CRUD, YouTube/웹 파서, 이메일 알림)
```

---

## ⚙️ 설치 및 Google Apps Script 배포 방법

1. **Google Sheets 및 Apps Script 연결**
   - 새 Google 스프레드시트를 생성한 뒤 **[확장 프로그램] > [Apps Script]**를 엽니다.
   - `backend/Code.gs`의 전체 코드를 붙여넣고 저장합니다. (`Archive`, `Notes`, `Mailbox`, `Bookmarks` 시트는 첫 실행 시 자동 생성됩니다.)
2. **웹 앱(Web App) 배포**
   - Apps Script 우측 상단 **[배포] > [새 배포]**를 클릭합니다.
   - 유형: **웹 앱** / 다음 사용자 권한으로 실행: **나 (Me)** / 액세스 권한: **모든 사용자 (Anyone)**로 설정 후 배포합니다.
   - 발급된 `https://script.google.com/macros/s/.../exec` URL을 `js/config.js`의 `GAS_WEB_APP_URL`에 입력합니다.
   - *주의: `backend/Code.gs`를 수정한 뒤에는 반드시 **[배포] > [배포 관리] > 수정(연필) > 새 버전 > [배포]**를 진행해야 프론트엔드에 반영됩니다.*

---

## 🚀 앞으로 할 일 (v2.0 고도화 로드맵)

강의 커리큘럼(9~13주차) 핵심 원리와 **PRD 기반 4단계 개발 전략(뼈대 → 기능 → 디자인 → 점검)**을 적용해 다음 3단계로 고도화를 진행합니다.

### Phase 1. 데이터 영속성 및 모바일 접근성 확보
- [ ] **오프라인 우선(`LocalStorage`) 0.1초 부팅 (`js/config.js`, `js/archive-app.js`):** 앱 실행 시 로컬 캐시 데이터를 먼저 화면에 띄운 뒤 백그라운드에서 구글 시트와 동기화하여 초기 로딩 대기를 제거합니다. (Base64 원본 이미지 대신 텍스트 메타데이터·URL 중심 경량 캐싱)
- [ ] **모바일 반응형 OS 셸 & PWA (`manifest.json`, `css/style.css`):** `768px` 이하 모바일 화면에서 가로 스크롤 없는 단일 창 전체 화면 모드와 하단 고정 바 UI를 적용하고, 스마트폰 '홈 화면에 추가'를 지원합니다.
- [ ] **원클릭 접속 QR 코드 모달 (`js/window-mgr.js`):** 배포된 GitHub Pages 주소를 즉시 QR 코드로 생성하여 스마트폰 접속과 지인 공유를 간편하게 만듭니다.

### Phase 2. 탐색 · 시각화 · 게이미피케이션 고도화
- [ ] **감상 일정 달력 & D-Day 트래커 (`CALENDAR95.EXE`):** `watchDate` 기준 월별 표지·스티커 달력과 기대작 개봉일·공연일·완독 목표일 D-Day 카운터를 구현합니다.
- [ ] **가로 스크롤 연표 & 상·하반기 레이더 비교 차트 (`TIMELINE95.EXE`, `js/visualizer.js`):** 시간순 감상 노드 연표와 함께 상·하반기 매체·장르 비중을 비교하는 다각형 레이더 차트, 차트 PNG 저장, 연속 기록 일수(Streak)·취향 편중도 자동 진단을 추가합니다.
- [ ] **감정별 큐레이션 & 아카이브 복습 퀴즈 (`MOODPICK.EXE`, `QUIZ95.EXE`):** 기분 상태별 비연속 랜덤 추천기와 내 한줄평·제작자 데이터를 문제 은행으로 삼는 4지선다·초성 힌트 퀴즈를 제작합니다.

### Phase 3. AI OCR 자동 입력 · 문화 가계부 · 소셜 방명록
- [ ] **데이터 스키마 확장 (`backend/Code.gs`):** `Archive` 시트에 `비용(Price)`과 `감정태그(Mood)` 열을 추가하고, 작품별 댓글·추천을 관리하는 `Guestbook` 시트를 신설합니다.
- [ ] **AI 표지·티켓 OCR 자동 인식 (`js/archive-app.js`):** 책 표지나 티켓·영수증 이미지를 업로드하면(`1MB` 이하 클라이언트 압축) 작품명·날짜·금액을 자동 추출해 입력 폼에 채웁니다.
- [ ] **문화생활 가계부 & 감열지 영수증 (`BUDGET95.EXE`):** 월별 문화 예산 한도 및 초과 경고 락(Lock), Win95 감열지 스타일 소비 회고 영수증 인쇄/PDF 출력을 구현합니다.
- [ ] **커스텀 디지털 도장 & 작품별 방명록 (`STAMP95.EXE`, `GUESTBOX.EXE`):** 투명 배경 PNG 인증 도장 생성기와 관리자 비밀번호 기반 방명록 승인·삭제 기능을 완성합니다.

---

## 📋 품질 검수(QA) 체크리스트

- [ ] 빈칸 제출 차단, 동일 매체·제목 중복 등록 방지(본인 ID 수정 예외), 삭제 2단계 확인 팝업이 정상 작동하는가?
- [ ] 카테고리·평점·기간 필터 전환 시 총 건수, 평균 평점, 예산 잔액, 레이더 차트 수치가 정확히 동기화되는가?
- [ ] 오프라인 새로고침 시 `LocalStorage` 캐시로 즉시 열람되며, 모바일 화면에서 가로 스크롤 없이 모든 창을 조작할 수 있는가?
- [ ] `backend/Code.gs` 수정 후 **Google Apps Script [새 배포]**를 완료해 프론트엔드와 최신 버전이 일치하는가?
