import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../components/ui/dialog'
import { Download, CheckCircle, RefreshCw, Info } from 'lucide-react'
import { sanitizeMarkdown } from '../lib/sanitize'

interface UpdateInfo {
  version: string
  releaseNotes?: string | Array<{ version: string; note: string }>
  releaseDate?: string
  files?: unknown[]
}

export function FetchSettings() {
  const [currentVersion, setCurrentVersion] = useState<string>('1.0.0')
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [checking, setChecking] = useState<boolean>(false)
  const [downloading, setDownloading] = useState<boolean>(false)
  const [downloadProgress, setDownloadProgress] = useState<number>(0)
  const [showReleaseNotes, setShowReleaseNotes] = useState<boolean>(false)
  const [showInstallDialog, setShowInstallDialog] = useState<boolean>(false)

  useEffect((): (() => void) => {
    // 현재 버전 가져오기
    if (window.electron) {
      window.electron.ipcRenderer.invoke('get-app-version').then((version: string): void => {
        setCurrentVersion(version)
      }).catch((): void => {
        // 버전 정보를 가져오지 못한 경우 기본값 사용
        setCurrentVersion('1.0.0')
      })
    }

    // 업데이트 체크
    checkForUpdates()

    // 업데이트 이벤트 리스너
    if (window.electron) {
      window.electron.ipcRenderer.on('update-available', (_event, info): void => {
        setUpdateAvailable(true)
        setUpdateInfo(info)
        setChecking(false)
      })

      window.electron.ipcRenderer.on('update-not-available', (): void => {
        setUpdateAvailable(false)
        setUpdateInfo(null)
        setChecking(false)
      })

      window.electron.ipcRenderer.on('update-downloaded', (): void => {
        setDownloading(false)
        setShowInstallDialog(true)
      })

      window.electron.ipcRenderer.on('download-progress', (_event, progressInfo): void => {
        setDownloadProgress(Math.round(progressInfo.percent))
        console.log('Download progress:', progressInfo.percent)
      })
    }

    return (): void => {
      // 클린업
      if (window.electron) {
        window.electron.ipcRenderer.removeAllListeners('update-available')
        window.electron.ipcRenderer.removeAllListeners('update-not-available')
        window.electron.ipcRenderer.removeAllListeners('update-downloaded')
        window.electron.ipcRenderer.removeAllListeners('download-progress')
      }
    }
  }, [])

  const checkForUpdates = (): void => {
    setChecking(true)
    if (window.electron) {
      window.electron.ipcRenderer.send('check-for-updates')
    } else {
      // 개발 환경에서는 업데이트를 시뮬레이션
      setTimeout((): void => {
        setChecking(false)
        // 시뮬레이션: 50% 확률로 업데이트 가능
        const hasUpdate = Math.random() > 0.5
        setUpdateAvailable(hasUpdate)
        if (hasUpdate) {
          setUpdateInfo({ version: '1.0.1' })
        }
      }, 1000)
    }
  }

  const downloadUpdate = (): void => {
    setDownloading(true)
    setDownloadProgress(0)
    if (window.electron) {
      window.electron.ipcRenderer.send('download-update')
    }
  }

  const installUpdate = (): void => {
    if (window.electron) {
      window.electron.ipcRenderer.send('quit-and-install')
      setShowInstallDialog(false)
    }
  }

  // 마크다운을 HTML로 변환 (간단한 변환)
  const parseMarkdown = (markdown: string): string => {
    let html = markdown

    // 헤딩 변환 (### -> <h3>)
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold mb-2 mt-4">$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mb-2 mt-4">$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mb-3 mt-4">$1</h1>')

    // 볼드 텍스트 변환 (**text** -> <strong>)
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold">$1</strong>')

    // 이탤릭 변환 (*text* -> <em>)
    html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')

    // 링크 변환 ([text](url) -> <a>)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-primary hover:underline" target="_blank">$1</a>')

    // 리스트 변환 (- item -> <li>)
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')

    // 코드 블록 변환 (`code` -> <code>)
    html = html.replace(/`([^`]+)`/gim, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')

    // 줄바꿈 변환
    html = html.replace(/\n/gim, '<br>')

    return html
  }

  const formatReleaseNotes = (notes?: string | Array<{ version: string; note: string }>): string => {
    if (!notes) return '릴리즈 노트가 없습니다.'

    if (typeof notes === 'string') {
      return sanitizeMarkdown(parseMarkdown(notes))
    }

    return sanitizeMarkdown(notes.map(item => `<div><strong>버전 ${item.version}:</strong><br>${parseMarkdown(item.note)}</div>`).join('<br><br>'))
  }

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-card-foreground flex items-center gap-2">
              <Download className="w-6 h-6 text-primary" />
              Update Manager
            </CardTitle>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-primary border border-border" />
              <div className="w-3 h-3 rounded-full bg-secondary border border-border" />
              <div className="w-3 h-3 rounded-full bg-accent border border-border" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            앱 버전 정보 및 업데이트를 확인하세요.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 현재 버전 정보 */}
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">현재 버전</div>
                  <div className="text-lg font-semibold">v{currentVersion}</div>
                </div>
                <Badge variant="outline" className="text-xs">
                  설치됨
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 업데이트 상태 */}
          {checking ? (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                  <div className="flex-1">
                    <div className="font-medium">업데이트 확인 중...</div>
                    <div className="text-sm text-muted-foreground">잠시만 기다려주세요</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : updateAvailable && updateInfo ? (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-primary">업데이트 가능!</div>
                      <div className="text-sm text-muted-foreground">
                        새 버전: v{updateInfo.version}
                      </div>
                      {updateInfo.releaseDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          릴리즈: {new Date(updateInfo.releaseDate).toLocaleDateString('ko-KR')}
                        </div>
                      )}
                    </div>
                    <Badge className="bg-primary text-primary-foreground">
                      새 버전
                    </Badge>
                  </div>

                  {/* 릴리즈 노트 버튼 */}
                  {updateInfo.releaseNotes && (
                    <Button
                      onClick={(): void => setShowReleaseNotes(true)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Info className="w-4 h-4 mr-2" />
                      변경 사항 보기
                    </Button>
                  )}

                  {/* 다운로드 진행률 */}
                  {downloading && downloadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>다운로드 중...</span>
                        <span>{downloadProgress}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={downloadUpdate}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        다운로드 중...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        업데이트 다운로드
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <div className="font-medium text-green-700 dark:text-green-400">최신 버전</div>
                    <div className="text-sm text-muted-foreground">
                      현재 최신 버전을 사용하고 있습니다
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 다시 확인 버튼 */}
          <Button
            onClick={checkForUpdates}
            variant="outline"
            className="w-full"
            disabled={checking}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            다시 확인
          </Button>
        </CardContent>
      </Card>

      {/* 릴리즈 노트 다이얼로그 */}
      <Dialog open={showReleaseNotes} onOpenChange={setShowReleaseNotes}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              버전 {updateInfo?.version} 변경 사항
            </DialogTitle>
            <DialogDescription>
              이번 업데이트에서 변경된 내용을 확인하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div
              className="bg-muted/50 rounded-lg p-4 prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: formatReleaseNotes(updateInfo?.releaseNotes) }}
            />
          </div>
          <DialogFooter>
            <Button onClick={(): void => setShowReleaseNotes(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 설치 확인 다이얼로그 */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              업데이트 준비 완료
            </DialogTitle>
            <DialogDescription>
              업데이트가 다운로드되었습니다. 지금 설치하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="font-medium">버전 {updateInfo?.version}</div>
                  {updateInfo?.releaseDate && (
                    <div className="text-sm text-muted-foreground">
                      릴리즈: {new Date(updateInfo.releaseDate).toLocaleDateString('ko-KR')}
                    </div>
                  )}
                  {updateInfo?.releaseNotes && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm font-medium mb-2">주요 변경 사항:</div>
                      <div
                        className="text-sm text-muted-foreground max-h-32 overflow-y-auto prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: formatReleaseNotes(updateInfo.releaseNotes) }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                앱이 재시작되며, 저장하지 않은 작업이 있다면 손실될 수 있습니다.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={(): void => setShowInstallDialog(false)}
            >
              나중에
            </Button>
            <Button
              onClick={installUpdate}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Download className="w-4 h-4 mr-2" />
              지금 설치
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
