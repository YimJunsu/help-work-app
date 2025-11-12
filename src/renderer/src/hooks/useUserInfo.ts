import { useState, useEffect } from 'react'

export interface UserInfo {
  name: string | null
  birthday: string | null
}

/**
 * 사용자 정보를 관리하는 hook
 */
export function useUserInfo() {
  const [userName, setUserName] = useState<string | null>(null)
  const [userBirthday, setUserBirthday] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUserInfo = async () => {
    if (window.electron) {
      setIsLoading(true)
      const userInfo = await window.electron.ipcRenderer.invoke('userInfo:get')
      if (userInfo) {
        setUserName(userInfo.name)
        setUserBirthday(userInfo.birthday)
      }
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUserInfo()
  }, [])

  return { userName, userBirthday, isLoading, loadUserInfo }
}