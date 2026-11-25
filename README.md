# MY-ARCHIVE 95 OS

> Windows 95 + Neo-Brutalism 데스크톱과 Google Apps Script 백엔드를 결합한 개인 문화·예술 감상 기록 웹 OS

도서, 음악, 영화·시리즈, 웹 콘텐츠를 기록하고 내장 앱으로 탐색·재생·통계·공유까지 한 환경에서 처리하는 웹 워크스테이션입니다.

- **배포:** <https://nlasdnfkl2.github.io/MyArchive/>

---

## 주요 기능

- **아카이브 & 메타데이터:** GAS 시트 연동 기록 CRUD, 도서·음악·영상·웹 URL 메타데이터 자동 수집 및 중복 방지
- **내장 앱 & 미니게임:** `DATANODE95.EXE`(노드 맵·통계), `TIMELINE95.EXE`, `MOODPICK.EXE`, `QUIZ95.EXE`, `CALENDAR95.EXE`, `STAMP95.EXE`, `NOTEPAD95.EXE`, `MAILBOX95.EXE`, `GAMEPACK95.EXE`
- **주크박스 & 브라우저:** `JUKEBOX 95`(YouTube 검색·캐싱·후보 전환), `EXPLORER95.EXE`(인앱 재생·리더모드·북마크·즉석 기록)
- **공개 광장:** 공개 피드, 통계·차트, 검색/필터/정렬, 좋아요·댓글·스크랩

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
