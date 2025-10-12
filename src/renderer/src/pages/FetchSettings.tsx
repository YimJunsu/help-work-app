import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Download, CheckCircle, RefreshCw } from 'lucide-react'

export function FetchSettings() {
  const [currentVersion, setCurrentVersion] = useState<string>('1.0.0')
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false)
  const [updateInfo, setUpdateInfo] = useState<{ version: string } | null>(null)
  const [checking, setChecking] = useState<boolean>(false)
  const [downloading, setDownloading] = useState<boolean>(false)

  useEffect(() => {
    // 현재 버전 가져오기
    if (window.electron) {
      window.electron.ipcRenderer.invoke('get-app-version').then((version: string) => {
        setCurrentVersion(version)
      }).catch(() => {
        // 버전 정보를 가져오지 못한 경우 기본값 사용
        setCurrentVersion('1.0.0')
      })
    }

    // 업데이트 체크
    checkForUpdates()

    // 업데이트 이벤트 리스너
    if (window.electron) {
      window.electron.ipcRenderer.on('update-available', (_event, info) => {
        setUpdateAvailable(true)
        setUpdateInfo(info)
        setChecking(false)
      })

      window.electron.ipcRenderer.on('update-not-available', () => {
        setUpdateAvailable(false)
        setUpdateInfo(null)
        setChecking(false)
      })

      window.electron.ipcRenderer.on('update-downloaded', () => {
        setDownloading(false)
      })

      window.electron.ipcRenderer.on('download-progress', (_event, progressInfo) => {
        console.log('Download progress:', progressInfo.percent)
      })
    }

    return () => {
      // 클린업
      if (window.electron) {
        window.electron.ipcRenderer.removeAllListeners('update-available')
        window.electron.ipcRenderer.removeAllListeners('update-not-available')
        window.electron.ipcRenderer.removeAllListeners('update-downloaded')
        window.electron.ipcRenderer.removeAllListeners('download-progress')
      }
    }
  }, [])

  const checkForUpdates = () => {
    setChecking(true)
    if (window.electron) {
      window.electron.ipcRenderer.send('check-for-updates')
    } else {
      // 개발 환경에서는 업데이트를 시뮬레이션
      setTimeout(() => {
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

  const downloadUpdate = () => {
    setDownloading(true)
    if (window.electron) {
      window.electron.ipcRenderer.send('download-update')
    }
  }

  const installUpdate = () => {
    if (window.electron) {
      window.electron.ipcRenderer.send('quit-and-install')
    }
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
                    </div>
                    <Badge className="bg-primary text-primary-foreground">
                      새 버전
                    </Badge>
                  </div>
                  <Button
                    onClick={downloading ? installUpdate : downloadUpdate}
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
                        업데이트 하기
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
    </div>
  )
}
