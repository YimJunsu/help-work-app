# 업데이트 기능 테스트 가이드

## 개요
이 문서는 electron-updater를 사용한 자동 업데이트 기능을 테스트하는 방법을 설명합니다.

## 준비사항

### 1. GitHub 릴리즈 생성 및 설정
- GitHub 저장소의 Release 탭에서 새 릴리즈를 생성해야 합니다
- 릴리즈 태그는 `v{version}` 형식을 사용 (예: `v1.0.1`, `v1.1.0`)
- `package.json`의 `version` 필드와 맞춰야 합니다

### 2. 빌드 설정 확인
- `electron-builder.yml`에 GitHub 릴리즈 설정이 되어 있는지 확인:
  ```yaml
  publish:
    provider: github
    owner: YimJunsu
    repo: help-work-app
  ```

## 테스트 방법

### 방법 1: 로컬 개발 환경에서 시뮬레이션 테스트

개발 모드(`npm run dev`)에서는 실제 업데이트는 동작하지 않지만, FetchSettings 페이지의 UI 동작은 확인할 수 있습니다:

1. 개발 서버 실행:
   ```bash
   npm run dev
   ```

2. 앱 실행 후 FetchSettings 페이지로 이동
3. UI 요소 확인:
   - 현재 버전 표시
   - "업데이트 확인" 버튼
   - 업데이트 상태 카드
   - 다운로드 진행률
   - 릴리즈 노트 다이얼로그
   - 설치 확인 다이얼로그

### 방법 2: dev-app-update.yml을 사용한 로컬 테스트

로컬에서 실제 업데이트 동작을 테스트하려면:

1. `dev-app-update.yml` 파일 생성 (프로젝트 루트):
   ```yaml
   provider: github
   owner: YimJunsu
   repo: help-work-app
   ```

2. 현재 버전보다 높은 버전의 릴리즈를 GitHub에 미리 생성

3. 앱 빌드:
   ```bash
   npm run build:win
   ```

4. `dist` 폴더의 설치 파일로 앱 설치

5. 설치된 앱 실행 후 FetchSettings 페이지에서 업데이트 확인

### 방법 3: 실제 릴리즈 테스트 (권장)

실제 사용자 시나리오를 완전히 재현하는 방법:

#### 단계 1: 초기 버전 릴리즈
1. `package.json`의 `version`을 `1.0.0`으로 설정
2. 앱 빌드:
   ```bash
   npm run build:win
   ```
3. GitHub에서 `v1.0.0` 태그로 릴리즈 생성
4. 빌드된 설치 파일(`help-work-app-1.0.0-setup.exe`)을 릴리즈에 업로드
5. 이 버전을 설치

#### 단계 2: 업데이트 버전 릴리즈
1. `package.json`의 `version`을 `1.0.1`로 변경
2. 코드 변경사항 커밋
3. 앱 다시 빌드:
   ```bash
   npm run build:win
   ```
4. GitHub에서 `v1.0.1` 태그로 새 릴리즈 생성
5. 릴리즈 노트 작성 (Markdown 형식):
   ```markdown
   ## 주요 변경사항
   - 업데이트 UI 개선
   - 릴리즈 노트 다이얼로그 추가
   - 다운로드 진행률 표시 추가

   ## 버그 수정
   - 업데이트 확인 시 오류 수정
   ```
6. 빌드된 설치 파일을 릴리즈에 업로드

#### 단계 3: 업데이트 테스트
1. 이전 버전(1.0.0)이 설치된 상태에서 앱 실행
2. FetchSettings 페이지로 이동
3. 자동으로 업데이트 확인이 시작됨 (또는 "다시 확인" 버튼 클릭)
4. "업데이트 가능!" 메시지 확인
5. "변경 사항 보기" 버튼을 눌러 릴리즈 노트 확인
6. "업데이트 다운로드" 버튼 클릭
7. 다운로드 진행률 확인 (0% ~ 100%)
8. 다운로드 완료 후 자동으로 "업데이트 준비 완료" 다이얼로그 표시
9. "지금 설치" 버튼을 클릭하여 업데이트 설치
10. 앱이 자동으로 재시작되며 새 버전으로 업데이트됨
11. 업데이트 후 버전 확인 (v1.0.1)

## 테스트 체크리스트

- [ ] 현재 버전이 정확하게 표시됨
- [ ] 업데이트 확인 버튼이 동작함
- [ ] 업데이트 가능 시 "새 버전" 배지 표시
- [ ] 릴리즈 날짜가 정확하게 표시됨
- [ ] "변경 사항 보기" 버튼으로 릴리즈 노트 다이얼로그 열림
- [ ] 릴리즈 노트가 올바르게 포맷되어 표시됨
- [ ] 다운로드 시작 시 버튼이 비활성화됨
- [ ] 다운로드 진행률이 실시간으로 업데이트됨
- [ ] 다운로드 완료 시 설치 확인 다이얼로그가 자동으로 표시됨
- [ ] 설치 다이얼로그에서 릴리즈 노트 미리보기 표시
- [ ] "나중에" 버튼으로 다이얼로그를 닫을 수 있음
- [ ] "지금 설치" 버튼을 누르면 앱이 재시작됨
- [ ] 재시작 후 새 버전으로 업데이트됨
- [ ] 최신 버전에서는 "최신 버전" 메시지 표시

## 문제 해결

### 업데이트가 감지되지 않는 경우
1. `package.json`의 버전이 GitHub 릴리즈 태그와 일치하는지 확인
2. 릴리즈에 빌드 파일이 올바르게 업로드되었는지 확인
3. `electron-builder.yml`의 publish 설정 확인
4. 개발 모드가 아닌 빌드된 앱에서 테스트하는지 확인

### 서명 관련 오류
Windows에서 서명되지 않은 앱으로 테스트할 때:
- `electron-builder.yml`의 `win.sign: false` 설정 확인
- `win.verifyUpdateCodeSignature: false` 설정 확인

### GitHub API Rate Limit
너무 자주 업데이트를 확인하면 GitHub API 제한에 걸릴 수 있습니다:
- GitHub Personal Access Token을 사용하여 제한 완화 가능
- 환경변수 `GH_TOKEN` 또는 `GITHUB_TOKEN` 설정

## 추가 정보

### electron-updater 로그 확인
메인 프로세스에서 로그를 확인할 수 있습니다:
```typescript
autoUpdater.logger = require('electron-log')
autoUpdater.logger.transports.file.level = 'info'
```

### 자동 업데이트 비활성화 (개발 중)
개발 중에는 `is.dev` 체크로 자동 업데이트가 비활성화됩니다:
```typescript
ipcMain.on('check-for-updates', () => {
  if (!is.dev) {
    autoUpdater.checkForUpdates()
  }
})
```

## 참고 자료
- [electron-updater 공식 문서](https://www.electron.build/auto-update)
- [GitHub Releases 가이드](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)