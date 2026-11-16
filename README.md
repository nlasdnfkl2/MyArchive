# PRD: MY-ARCHIVE 95 OS — 감상 아카이빙 및 취향 데이터 노드 OS

| 문서 버전 | 작성일 | 대상 시스템 | 아키텍처 |
| :--- | :--- | :--- | :--- |
| **v2.0** | 2026-11-17 | Web Frontend + Google Apps Script | Modular Vanilla JS / Google Sheets CRUD |

---

## 1. 제품 개요 (Product Overview)

### 1.1 추진 배경 및 목적
**MY-ARCHIVE 95 OS**는 도서·음악·영상 등 개인의 문화 감상 이력을 **Windows 95 + Neo-Brutalism 데스크톱 환경**에서 직관적으로 기록·관리·시각화하는 웹 애플리케이션입니다. 별도의 유료 서버나 데이터베이스 구축 없이 **Google Sheets와 Google Apps Script(GAS)**를 백엔드로 활용하여 영구 저장소와 다중 소스 메타데이터 자동 검색을 제공합니다.

### 1.2 핵심 가치 제안
* **모듈형 멀티 윈도우 데스크톱 UX:** 모든 탐색기 및 팝업 창을 자유롭게 드래그·최소화·포커싱할 수 있는 OS형 작업 공간 제공.
* **원클릭 메타데이터 수집:** 작품명·유사어·URL 입력만으로 Google Books, Apple Music, Deezer, MusicBrainz, YouTube 데이터를 통합 검색하여 자동 입력(내부 유사도 점수는 숨기고 순위만 깔끔하게 노출).
* **선택형 고밀도 데이터 시각화:** 평상시에는 직관적인 KPI 카드와 기본 통계 차트(매체 비율·월별 추이)를 유지하고, 사용자가 실행을 선택한 시점에만 **키워드 워드클라우드** 및 **인터랙티브 데이터 관계 노드 맵**을 동적 생성.

---

## 2. 시스템 아키텍처 및 파일 구조 (System Architecture & File Structure)

유지보수성과 모듈 독립성을 확보하기 위해 스타일시트와 기능별 스크립트를 분리하고, 로컬(`file://`) 및 정적 호스팅(GitHub Pages 등) 환경 모두에서 CORS 제약 없이 동작하도록 구성합니다.

### 2.1 디렉터리 트리
```text
my-archive-95/
├── index.html                  # 메인 데스크톱 셸(바탕화면 아이콘, 메뉴바, 작업표시줄, 창 컨테이너)
├── PRD.md                      # 제품 요구사항 정의서 및 구현 계획 문서
├── css/
│   └── style.css               # Win95 입체 베벨, Neo-Brutalism 테두리/그림자, 커서, 테마 스타일
├── js/
│   ├── config.js               # 전역 상태, API 엔드포인트, 8비트 사운드 합성기, 부팅/BSOD/화면보호기
│   ├── window-mgr.js           # 창 포커스(z-index), 작업표시줄 동기화, 점선/실시간 드래그, 위젯·미니게임
│   ├── visualizer.js           # 선택형 워드클라우드 추출기 및 Canvas 물리 기반 데이터 노드 엔진
│   └── archive-app.js          # Google Sheets CRUD(조회·등록·수정·삭제), 기본 통계 차트, 상세/연관추천, 메모장
└── backend/                    # Google Apps Script 프로젝트 파일
    ├── Code.gs                 # doGet / doPost 라우팅 및 Archive / Notes 시트 CRUD 처리
    └── SearchService.gs        # 다중 외부 API 검색, OpenGraph 파싱, 관련도 내부 정렬 로직
