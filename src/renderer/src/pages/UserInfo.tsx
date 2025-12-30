import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { User, Calendar, Save, Shield, CheckCircle, AlertCircle, X } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface UserInfo {
  id: number
  name: string
  birthday: string
  supportId?: string
  supportPw?: string
  createdAt: string
  updatedAt: string
}

interface Toast {
  type: 'success' | 'error'
  message: string
}

export function UserInfo() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [name, setName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [supportId, setSupportId] = useState('')
  const [supportPw, setSupportPw] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    loadUserInfo()
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
  }

  const loadUserInfo = async () => {
    if (window.electron) {
      const info = await window.electron.ipcRenderer.invoke('userInfo:get')
      if (info) {
        setUserInfo(info)
        setName(info.name)
        setBirthday(info.birthday)
        setSupportId(info.supportId || '')
        // Don't display the encrypted password, just show if it's set
        setSupportPw('')
      } else {
        setIsEditing(true)
      }
    }
  }

  const handleSave = async () => {
    if (!name.trim() || !birthday) {
      showToast('error', '이름과 생일을 모두 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      if (window.electron) {
        const updateData: any = {
          name: name.trim(),
          birthday
        }

        // Check if user is trying to update support credentials
        const hasSupportId = supportId.trim()
        const hasSupportPw = supportPw.trim()
        const hadPreviousPw = userInfo?.supportPw

        // Validate: if user enters ID, they must also enter password (unless password was already saved)
        if (hasSupportId && !hasSupportPw && !hadPreviousPw) {
          showToast('error', 'UniPost ID를 입력했다면 비밀번호도 함께 입력해주세요.')
          setIsSaving(false)
          return
        }

        // Only update support credentials if they were provided
        if (hasSupportId) {
          updateData.supportId = supportId.trim()
        }
        if (hasSupportPw) {
          updateData.supportPw = supportPw.trim()
        }

        const savedInfo = await window.electron.ipcRenderer.invoke('userInfo:createOrUpdate', updateData)
        setUserInfo(savedInfo)
        setIsEditing(false)
        setSupportPw('') // Clear password field after saving

        // 사용자 정보 업데이트 이벤트 발생
        window.dispatchEvent(new CustomEvent('userInfoUpdated', {
          detail: { name: savedInfo.name }
        }))

        showToast('success', '저장되었습니다.')
      }
    } catch (error) {
      console.error('Failed to save user info:', error)
      showToast('error', '저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (userInfo) {
      setName(userInfo.name)
      setBirthday(userInfo.birthday)
      setSupportId(userInfo.supportId || '')
      setSupportPw('')
      setIsEditing(false)
    }
  }

  const getAge = (birthday: string) => {
    const birthDate = new Date(birthday)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="w-full p-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
          <div
            className={`flex items-start gap-3 p-3 rounded-lg shadow-lg border min-w-[280px] max-w-md ${
              toast.type === 'success'
                ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  toast.type === 'success'
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-red-900 dark:text-red-100'
                }`}
              >
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className={`flex-shrink-0 ${
                toast.type === 'success'
                  ? 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200'
                  : 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">사용자 정보</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">정보를 입력해주세요</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          <div className="space-y-2.5">
            {/* 기본 정보 */}
            {isEditing ? (
              <>
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-sm font-medium">
                    이름
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="birthday" className="text-sm font-medium">
                    생일
                  </Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">이름</p>
                    <p className="text-base font-semibold">{userInfo?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">생일</p>
                    <p className="text-base font-semibold">
                      {userInfo?.birthday &&
                        format(new Date(userInfo.birthday), 'yyyy년 MM월 dd일', {
                          locale: ko
                        })}
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({userInfo?.birthday && getAge(userInfo.birthday)}세)
                      </span>
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* UniPost 계정 */}
            <div className="space-y-1.5 pt-2.5 border-t">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-primary" />
                <Label className="text-sm font-semibold">UniPost 계정</Label>
              </div>

              {isEditing ? (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="supportId" className="text-sm font-medium text-muted-foreground">
                      ID
                    </Label>
                    <Input
                      id="supportId"
                      type="text"
                      placeholder="UniPost ID (선택)"
                      value={supportId}
                      onChange={(e) => setSupportId(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="supportPw" className="text-sm font-medium text-muted-foreground">
                      PASSWORD
                    </Label>
                    <Input
                      id="supportPw"
                      type="password"
                      placeholder={userInfo?.supportPw ? "변경하려면 새 비밀번호 입력" : "비밀번호 (선택)"}
                      value={supportPw}
                      onChange={(e) => setSupportPw(e.target.value)}
                    />
                    {userInfo?.supportPw && !supportPw && (
                      <p className="text-xs text-muted-foreground leading-tight mt-1">
                        * 비밀번호가 저장되어 있습니다.
                      </p>
                    )}
                  </div>
                </>
              ) : userInfo?.supportId ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">UniPost ID</p>
                    <p className="text-base font-semibold">{userInfo.supportId}</p>
                    {userInfo.supportPw && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        비밀번호 저장됨
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  UniPost 계정 정보가 등록되지 않았습니다
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-0.5">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? '저장 중...' : '저장'}
                  </Button>
                  {userInfo && (
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      disabled={isSaving}
                      className="px-6"
                    >
                      취소
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  className="w-full"
                >
                  정보 수정
                </Button>
              )}
            </div>

            {!isEditing && userInfo && (
              <div className="pt-3 border-t border-dashed">
                <p className="text-xs text-muted-foreground text-center">
                  마지막 수정: {format(new Date(userInfo.updatedAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
