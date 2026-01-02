import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Loader2, RefreshCw, ExternalLink, AlertCircle, Headset } from 'lucide-react'

interface UniPostRequest {
  id: string
  title: string
  status: string
  submissionDate: string
  requestType?: string
  requestor?: string
  handler?: string
  detailUrl?: string
}

// Module-level cache for requests data
let cachedRequests: UniPostRequest[] = []
let cachedError: string | null = null
let isCacheInitialized = false

export function UniSupport() {
  const [requests, setRequests] = useState<UniPostRequest[]>(cachedRequests)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(cachedError)

  useEffect(() => {
    // Only initialize data if cache is not initialized
    if (!isCacheInitialized) {
      initializeData()
    }
  }, [])

  const initializeData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!window.electron) {
        throw new Error('Electron API not available')
      }

      // Load user name
      const userInfo = await window.electron.ipcRenderer.invoke('userInfo:get')
      if (!userInfo?.name) {
        setError('⚠️ 사용자 정보가 없습니다.\n\n설정 → 사용자 정보에서 이름과 UniPost 계정 정보를 입력해주세요.')
        setIsLoading(false)
        return
      }

      // Auto-login with stored credentials
      const loginResult = await window.electron.ipcRenderer.invoke('unipost:loginWithStored')

      if (loginResult.success) {
        // Auto-fetch requests after successful login
        await fetchRequestsInternal(userInfo.name)
        isCacheInitialized = true
      } else {
        let errorMessage = loginResult.error || '로그인에 실패했습니다.'

        if (loginResult.error?.includes('No stored credentials')) {
          errorMessage = '⚠️ 저장된 UniPost 계정 정보가 없습니다.\n\n설정 → 사용자 정보에서 UniPost 지원 ID와 비밀번호를 입력해주세요.'
        } else if (loginResult.error?.includes('Failed to decrypt')) {
          errorMessage = '⚠️ 비밀번호 복호화에 실패했습니다.\n\n설정에서 비밀번호를 다시 저장해주세요.'
        } else if (loginResult.error?.includes('Missing credentials')) {
          errorMessage = '⚠️ 계정 정보가 완전하지 않습니다.\n\n설정 → 사용자 정보에서 UniPost 지원 ID와 비밀번호를 모두 입력해주세요.'
        } else if (loginResult.error?.includes('Login failed')) {
          errorMessage = '⚠️ 로그인에 실패했습니다.\n\n계정 정보를 확인하거나, UniPost 사이트에서 직접 로그인이 가능한지 확인해주세요.'
        }

        setError(errorMessage)
        cachedError = errorMessage
      }
    } catch (error: any) {
      console.error('Initialize error:', error)
      const errorMessage = error.message || '초기화 중 오류가 발생했습니다.'
      setError(errorMessage)
      cachedError = errorMessage
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRequestsInternal = async (name: string) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('unipost:fetchRequests', name)

      if (result.success) {
        const data = result.data || []
        setRequests(data)
        cachedRequests = data // Update cache
        if (data.length === 0) {
          const errorMsg = '진행 중인 요청이 없습니다.'
          setError(errorMsg)
          cachedError = errorMsg
        } else {
          cachedError = null
        }
      } else {
        const errorMsg = result.error || '요청 내역을 가져오는데 실패했습니다.'
        setError(errorMsg)
        cachedError = errorMsg
      }
    } catch (error: any) {
      console.error('Fetch requests error:', error)
      const errorMsg = error.message || '요청 내역을 가져오는 중 오류가 발생했습니다.'
      setError(errorMsg)
      cachedError = errorMsg
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    setError(null)
    cachedError = null

    try {
      if (!window.electron) {
        throw new Error('Electron API not available')
      }

      // Get user name
      const userInfo = await window.electron.ipcRenderer.invoke('userInfo:get')
      if (!userInfo?.name) {
        const errorMsg = '⚠️ 사용자 정보가 없습니다.\n\n설정 → 사용자 정보에서 이름과 UniPost 계정 정보를 입력해주세요.'
        setError(errorMsg)
        cachedError = errorMsg
        setIsLoading(false)
        return
      }

      // Check if already logged in
      const isLoggedIn = await window.electron.ipcRenderer.invoke('unipost:isLoggedIn')

      if (!isLoggedIn) {
        // Need to login first
        const loginResult = await window.electron.ipcRenderer.invoke('unipost:loginWithStored')

        if (!loginResult.success) {
          let errorMessage = loginResult.error || '로그인에 실패했습니다.'

          if (loginResult.error?.includes('No stored credentials')) {
            errorMessage = '⚠️ 저장된 UniPost 계정 정보가 없습니다.\n\n설정 → 사용자 정보에서 UniPost 지원 ID와 비밀번호를 입력해주세요.'
          } else if (loginResult.error?.includes('Failed to decrypt')) {
            errorMessage = '⚠️ 비밀번호 복호화에 실패했습니다.\n\n설정에서 비밀번호를 다시 저장해주세요.'
          } else if (loginResult.error?.includes('Missing credentials')) {
            errorMessage = '⚠️ 계정 정보가 완전하지 않습니다.\n\n설정 → 사용자 정보에서 UniPost 지원 ID와 비밀번호를 모두 입력해주세요.'
          } else if (loginResult.error?.includes('Login failed')) {
            errorMessage = '⚠️ 로그인에 실패했습니다.\n\n계정 정보를 확인하거나, UniPost 사이트에서 직접 로그인이 가능한지 확인해주세요.'
          }

          setError(errorMessage)
          cachedError = errorMessage
          setIsLoading(false)
          return
        }
      }

      // Fetch fresh data (no logout needed - reuse existing session)
      await fetchRequestsInternal(userInfo.name)
    } catch (error: any) {
      console.error('Refresh error:', error)
      const errorMsg = error.message || '새로고침 중 오류가 발생했습니다.'
      setError(errorMsg)
      cachedError = errorMsg
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    if (status.includes('진행') || status.includes('Progress')) {
      return 'default'
    } else if (status.includes('완료') || status.includes('Complete')) {
      return 'secondary'
    } else if (status.includes('대기') || status.includes('Pending')) {
      return 'outline'
    }
    return 'default'
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-4">
      <Card className="flex-1 border shadow-sm flex flex-col">
        <CardHeader className="pb-3 border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Headset className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold text-card-foreground">
              UniSupport 요청 내역
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-3 pt-3">
          {/* Status bar: Loading state or Request count with refresh button */}
          <div className="mb-2">
            {isLoading ? (
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-primary">데이터를 불러오는 중입니다...</p>
                </div>
              </div>
            ) : requests.length > 0 ? (
              <div className="p-2 rounded-lg bg-muted/50 border border-border flex items-center justify-between">
                <div className="text-xs text-muted-foreground font-medium">
                  총 <span className="text-primary font-semibold">{requests.length}</span>개의 요청
                </div>
                <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading} className="shadow-sm h-7 text-xs px-2.5">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  새로고침
                </Button>
              </div>
            ) : null}
          </div>

          {error && !isLoading && (
            <div className="mb-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-destructive whitespace-pre-line">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && requests.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="p-3 rounded-full bg-muted w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">요청 내역이 없습니다</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  현재 진행 중인 지원 요청이 없습니다.
                </p>
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  새로고침
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-auto flex-1 -mx-3 -mb-3">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-border text-xs">
                  <thead className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-tight w-20">
                        접수번호
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-tight">
                        제목
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-tight w-24">
                        상태
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-tight w-20">
                        처리자
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-tight w-24">
                        접수일
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-tight w-28">
                        유형
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border/50">
                    {requests.map((req) => (
                      <tr
                        key={req.id}
                        className="hover:bg-accent/30 transition-all duration-150"
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          <button
                            onClick={() => {
                              if (req.id && window.electron) {
                                const url = `https://114.unipost.co.kr/home.uni?access=list&srIdx=${req.id}`
                                window.electron.ipcRenderer.send('open-external', url)
                              }
                            }}
                            className="text-xs font-mono text-primary hover:text-primary/70 hover:underline font-semibold transition-colors"
                          >
                            {req.id}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => {
                              if (req.id && window.electron) {
                                const url = `https://114.unipost.co.kr/home.uni?access=list&srIdx=${req.id}`
                                window.electron.ipcRenderer.send('open-external', url)
                              }
                            }}
                            className="text-xs text-card-foreground hover:text-primary text-left line-clamp-2 max-w-lg transition-colors font-medium"
                          >
                            {req.title}
                          </button>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(req.status)} className="text-xs font-medium px-2 py-0.5">
                            {req.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-card-foreground font-medium">
                          {req.handler || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                          {formatDate(req.submissionDate)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                          {req.requestType || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
