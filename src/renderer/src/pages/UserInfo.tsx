import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { User, Calendar, Save } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface UserInfo {
  id: number
  name: string
  birthday: string
  createdAt: string
  updatedAt: string
}

export function UserInfo() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [name, setName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    if (window.electron) {
      const info = await window.electron.ipcRenderer.invoke('userInfo:get')
      if (info) {
        setUserInfo(info)
        setName(info.name)
        setBirthday(info.birthday)
      } else {
        setIsEditing(true)
      }
    }
  }

  const handleSave = async () => {
    if (!name.trim() || !birthday) {
      alert('이름과 생일을 모두 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      if (window.electron) {
        const savedInfo = await window.electron.ipcRenderer.invoke('userInfo:createOrUpdate', {
          name: name.trim(),
          birthday
        })
        setUserInfo(savedInfo)
        setIsEditing(false)

        // 사용자 정보 업데이트 이벤트 발생
        window.dispatchEvent(new CustomEvent('userInfoUpdated', {
          detail: { name: savedInfo.name }
        }))
      }
    } catch (error) {
      console.error('Failed to save user info:', error)
      alert('저장 중 오류가 발생했습니다.')
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
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-card-foreground">
                  사용자 정보
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  정보를 입력 해주세요.
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Card className="border border-border/50 bg-gradient-to-br from-card to-card/50 shadow-sm">
            <CardContent className="p-6 space-y-6">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      이름
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="이름을 입력하세요"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthday" className="text-sm font-medium">
                      생일
                    </Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? '저장 중...' : '저장'}
                    </Button>
                    {userInfo && (
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        disabled={isSaving}
                      >
                        취소
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
                      <User className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">이름</p>
                        <p className="text-lg font-semibold text-card-foreground">
                          {userInfo?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">생일</p>
                        <p className="text-lg font-semibold text-card-foreground">
                          {userInfo?.birthday &&
                            format(new Date(userInfo.birthday), 'yyyy년 MM월 dd일', {
                              locale: ko
                            })}
                          <span className="text-sm text-muted-foreground ml-2">
                            ({userInfo?.birthday && getAge(userInfo.birthday)}세)
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    className="w-full"
                  >
                    정보 수정
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {!isEditing && userInfo && (
            <Card className="border border-dashed border-border/50 bg-muted/30">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">
                  마지막 수정: {format(new Date(userInfo.updatedAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
