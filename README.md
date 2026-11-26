# MY-ARCHIVE 95 OS

> Windows 95 + Neo-Brutalism 데스크톱과 Google Apps Script 백엔드를 결합한 개인 문화·예술 감상 기록 웹 OS

도서, 음악, 영화·시리즈, 웹 콘텐츠를 기록하고 내장 앱으로 탐색·재생·통계·공유까지 한 환경에서 처리하는 웹 워크스테이션입니다.

- **배포:** <https://nlasdnfkl2.github.io/MyArchive/>

---

## 주요 기능

- **아카이브 & 메타데이터:** 도서·음악·영화·시리즈·웹 콘텐츠 감상 기록의 등록, 탐색, 타임라인 조회, 평점·통계 확인 및 로컬 캐시·Google Apps Script 연동을 지원합니다.
- **내장 앱 & 미니게임:** 멀티 윈도우 매니저(`window-mgr.js`), 테마 및 CRT·화면 보호기·작업 관리자 제어, 위젯(`win95-widgets.js`)과 함께 **GAMEPACK95.EXE** 통합 실행기(`gamepack.js`) 기반의 **카드 솔리테어 95**, **지뢰찾기 95 (8x8)**, **레트로 윷놀이 vs AI**, **작품 별점 하이로우**를 제공합니다.
- **주크박스 & 브라우저:** 내장 주크박스(`jukebox.js`), 비주얼라이저(`visualizer.js`), 내장 브라우저(`browser-app.js`)를 통해 감상 콘텐츠와 미디어·웹 리소스를 한 데스크톱 환경에서 다룰 수 있습니다.
- **공개 광장:** 커뮤니티·공유 공간(`community-app.js`)을 통해 감상 기록과 콘텐츠를 둘러보고 공유할 수 있습니다.

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
│   ├── game-hilo.js
│   ├── game-minesweeper.js
│   ├── game-solitaire.js
│   ├── game-yut.js
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
