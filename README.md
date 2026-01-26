# Help Work App 🚀

**Modern Professional Workspace with Apple Elegance**

업무 관리를 도와주는 Electron 기반 데스크톱 애플리케이션입니다.
React 19 + TypeScript로 개발되었으며, iOS 스타일의 세련된 UI/UX를 제공합니다.

---

## ✨ 주요 기능

### 📊 Dashboard
- 날씨 정보 실시간 표시
- 다가오는 일정 (D-day 카운트)
- 오늘의 할일 요약
- 최근 메모
- 할일 통계 차트

### ✅ Daily TodoList
- 일일 할일 관리
- 완료/미완료 상태 관리
- 카테고리별 분류

### 📅 Schedule Check
- 일정 관리
- 카테고리별 분류 (개발/수정, 운영 반영, 서비스 점검)
- 마감일 설정
- 캘린더/리스트 뷰 전환

### 📝 Memo
- 빠른 메모 작성 및 관리
- Rich Text Editor 지원

### 🎮 RestTime
- Dino Game
- 환율 정보
- 주식 시뮬레이터

---

## 🎨 디자인 시스템

### 테마
**7가지 테마 + 다크모드 지원**
- shadcn (기본)
- Default (클래식 무채색)
- iOS (Apple 블루)
- Green (차분한 그린)
- Soft Pink (파스텔 핑크)
- Twitter (트위터 블루)
- Claude (오렌지 액센트)

### UI/UX 특징
- **iOS 스타일 인터랙션** - 부드러운 애니메이션 및 트랜지션
- **반응형 레이아웃** - Desktop/Tablet/Mobile 지원
- **접근성 강화** - WCAG AAA 기준 준수, 키보드 네비게이션
- **다크모드** - 눈의 피로를 줄이는 저채도 컬러

---

## ⌨️ 키보드 단축키

| 단축키 | 기능 |
|--------|------|
| `` ` `` | 테마 설정 열기 |
| `ESC` | 창 최소화 |
| `Ctrl+N` | 새 항목 추가 (현재 페이지) |
| `Ctrl+D` | 다크모드 토글 |

---

## 🛠️ 기술 스택

- **Electron** - 크로스 플랫폼 데스크톱 앱
- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **Radix UI** - 접근성 높은 UI 컴포넌트
- **better-sqlite3** - 로컬 데이터베이스
- **Chart.js** - 데이터 시각화

---

## ⚡ 성능 최적화

### 빌드 최적화
- **GZIP & Brotli 압축** - 파일 크기 최소화 (10KB 이상 파일)
- **코드 스플리팅** - 벤더 라이브러리 분리
  - vendor-react (React, ReactDOM)
  - vendor-ui (Radix UI)
  - vendor-chart (Chart.js)
  - vendor-date (date-fns)
  - vendor-icons (lucide-react)
- **Tree Shaking** - 사용하지 않는 코드 제거
- **CSS 코드 스플리팅** - CSS 파일 분리
- **Minification** - esbuild 기반 최소화

### 런타임 최적화
- **메모이제이션** - useCallback, useMemo 활용
- **가상화** - 긴 리스트 최적화
- **Lazy Loading** - 필요시 컴포넌트 로드
- **이미지 최적화** - 적절한 포맷 및 크기

## 권장 IDE 설정

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## 프로젝트 설정

### 설치

```bash
npm install
```

### 개발 모드 실행

```bash
npm run dev
```

### 빌드

#### Windows 사용자

Windows에서 빌드하려면 **관리자 권한**으로 터미널을 실행하거나, **개발자 모드**를 활성화해야 합니다.

**개발자 모드 활성화 방법:**
1. 설정 > 업데이트 및 보안 > 개발자용
2. "개발자 모드" 켜기

그 후 다음 명령어를 실행:
```bash
npm run build:win
```

빌드가 완료되면 `dist` 폴더에 설치 파일이 생성됩니다.

#### macOS 사용자

```bash
npm run build:mac
```

#### Linux 사용자

```bash
npm run build:linux
```

## 배포

### Windows
- NSIS 설치 프로그램이 생성됩니다
- 위치: `dist/Help Work App Setup {version}.exe`

### macOS
- DMG 및 ZIP 파일이 생성됩니다
- 위치: `dist/`

### Linux
- AppImage 및 DEB 패키지가 생성됩니다
- 위치: `dist/`

## 기술 스택

- **Electron** - 크로스 플랫폼 데스크톱 앱
- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **Radix UI** - UI 컴포넌트
- **better-sqlite3** - 로컬 데이터베이스

## 라이선스

MIT
