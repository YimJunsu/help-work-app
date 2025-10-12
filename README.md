# Help Work App

업무 관리를 도와주는 Electron 애플리케이션입니다. React와 TypeScript로 개발되었습니다.

## 주요 기능

- 일정 관리 (Todo List)
- 카테고리별 분류 (개발/수정, 운영 반영, 서비스 점검)
- 마감일 설정
- 로컬 데이터베이스 (better-sqlite3)

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
