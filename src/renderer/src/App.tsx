import { useState, useEffect } from "react"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
  SidebarFooter,
} from "./components/ui/sidebar"
import { ScheduleCheck } from "./pages/ScheduleCheck"
import { TodoList } from "./pages/TodoList"
import { Dashboard } from "./pages/Dashboard"
import Memo from "./pages/Memo"
import { MiniGame } from "./pages/MiniGame"
import { UserInfo } from "./pages/UserInfo"
import { CheckSquare, FileText, List, Palette, Moon, Sun, Download, ListTodo, Gamepad2, User, Calendar } from "lucide-react"
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ThemeSelector } from "./pages/ThemeSelector"
import { FetchSettings } from "./pages/FetchSettings"
import { Button } from "./components/ui/button"
import { Badge } from "./components/ui/badge"
import { toggleDarkMode, getDarkMode, applyTheme, applyShadcnTheme, tweakCNThemes } from "./lib/theme"

function App(): React.JSX.Element {
  // localStorage에서 테마를 불러오도록 초기값 설정
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('selected-theme') || 'shadcn'
  })

  const [currentPage, setCurrentPage] = useState<'dashboard' | 'todo' | 'ScheduleCheck' | 'memo' | 'fetch' | 'minigame' | 'userinfo'>('dashboard')
  const [showThemeDialog, setShowThemeDialog] = useState(false)
  const [hasTodoDialog, setHasTodoDialog] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => getDarkMode())
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)

  // 초기 렌더 시 localStorage에 저장된 테마를 실제로 적용
  useEffect(() => {
    if (currentTheme && currentTheme !== 'shadcn') {
      const theme = tweakCNThemes.find((t) => t.name === currentTheme)
      if (theme) {
        applyTheme(theme)
      }
    } else {
      applyShadcnTheme()
    }
  }, [currentTheme])

  const handleDarkModeToggle = () => {
    const newDarkMode = toggleDarkMode()
    setIsDarkMode(newDarkMode)
  }

  // 사용자 정보 불러오기
  useEffect(() => {
    const loadUserInfo = async () => {
      if (window.electron) {
        const userInfo = await window.electron.ipcRenderer.invoke('userInfo:get')
        if (userInfo) {
          setUserName(userInfo.name)
        } else {
          setUserName(null)
        }
      }
    }
    loadUserInfo()

    // 사용자 정보 업데이트 이벤트 리스너
    const handleUserInfoUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      setUserName(customEvent.detail.name)
    }

    window.addEventListener('userInfoUpdated', handleUserInfoUpdate)

    return () => {
      window.removeEventListener('userInfoUpdated', handleUserInfoUpdate)
    }
  }, [currentPage])

  // 업데이트 확인
  useEffect(() => {
    if (window.electron) {
      window.electron.ipcRenderer.on('update-available', () => {
        setUpdateAvailable(true)
      })

      window.electron.ipcRenderer.on('update-not-available', () => {
        setUpdateAvailable(false)
      })

      // 초기 업데이트 체크
      window.electron.ipcRenderer.send('check-for-updates')
    }

    return () => {
      if (window.electron) {
        window.electron.ipcRenderer.removeAllListeners('update-available')
        window.electron.ipcRenderer.removeAllListeners('update-not-available')
      }
    }
  }, [])

  // ` 키로 테마 다이얼로그 열기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '`') {
        if (showThemeDialog) {
          event.preventDefault()
          setShowThemeDialog(false)
          return
        }
        if (!hasTodoDialog) {
          event.preventDefault()
          setShowThemeDialog(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasTodoDialog, showThemeDialog])

  const handleThemeDialogChange = (open: boolean) => {
    setShowThemeDialog(open)
  }

  // 테마 변경 시 상태 업데이트 및 localStorage 저장
  const handleThemeChange = (themeName: string) => {
    setCurrentTheme(themeName)
    localStorage.setItem('selected-theme', themeName)
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar>
          <SidebarHeader>
            <div
              className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-accent/50 rounded-md transition-colors"
              onClick={() => setCurrentPage('dashboard')}
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <List className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Work Management</span>
                <span className="text-xs text-muted-foreground">WORK HELPER</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentPage === 'todo'}
                      onClick={() => setCurrentPage('todo')}
                    >
                      <ListTodo />
                      <span>Daily TodoList</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentPage === 'ScheduleCheck'}
                      onClick={() => setCurrentPage('ScheduleCheck')}
                    >
                      <CheckSquare />
                      <span>Schedule Check</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentPage === 'memo'}
                      onClick={() => setCurrentPage('memo')}
                    >
                      <FileText />
                      <span>Memo</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentPage === 'minigame'}
                      onClick={() => setCurrentPage('minigame')}
                    >
                      <Gamepad2 />
                      <span>Mini Game</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setShowThemeDialog(true)}>
                      <Palette />
                      <span>Theme</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentPage === 'fetch'}
                      onClick={() => setCurrentPage('fetch')}
                    >
                      <Download />
                      <span className="flex items-center gap-2">
                        Fetch
                        {updateAvailable && (
                          <Badge className="bg-red-500 text-white px-1.5 py-0 text-xs h-4 min-w-4 rounded-full flex items-center justify-center">
                            !
                          </Badge>
                        )}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentPage === 'userinfo'}
                      onClick={() => setCurrentPage('userinfo')}
                    >
                      <User />
                      <span>사용자 정보</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  `
                </kbd>
                <span>Click! You can change theme.</span>
              </div>
              <div className="text-sm font-medium text-card-foreground border-t border-border pt-3">
                {userName ? `Hello, ${userName}님!` : '사용자 정보 등록해주세요!'}
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  currentTheme !== 'shadcn' ? 'bg-primary' : 'bg-muted-foreground'
                }`}
              ></div>
              <span>{currentTheme !== 'shadcn' ? `TweakCN (${currentTheme})` : 'shadcn'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(), "yyyy년 MM월 dd일 (EEE)", { locale: ko })}</span>
            </div>
            <Button
              onClick={handleDarkModeToggle}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </header>
          <main className="flex-1 p-4">
            {currentPage === 'dashboard' ? (
              <Dashboard onNavigate={setCurrentPage} />
            ) : currentPage === 'todo' ? (
              <TodoList onDialogChange={setHasTodoDialog} />
            ) : currentPage === 'ScheduleCheck' ? (
              <ScheduleCheck onDialogChange={setHasTodoDialog} />
            ) : currentPage === 'memo' ? (
              <Memo onDialogChange={setHasTodoDialog} />
            ) : currentPage === 'fetch' ? (
              <FetchSettings />
            ) : currentPage === 'minigame' ? (
              <MiniGame />
            ) : currentPage === 'userinfo' ? (
              <UserInfo />
            ) : null}
          </main>
        </SidebarInset>
      </div>

      <ThemeSelector
        open={showThemeDialog}
        onOpenChange={handleThemeDialogChange}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />
    </SidebarProvider>
  )
}

export default App
