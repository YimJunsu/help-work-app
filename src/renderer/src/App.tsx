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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "./components/ui/sidebar"
import { ScheduleCheck } from "./pages/ScheduleCheck"
import { TodoList } from "./pages/TodoList"
import { Dashboard } from "./pages/Dashboard"
import Memo from "./pages/Memo"
import { MiniGame } from "./pages/MiniGame"
import { AnimalRace } from "./pages/AnimalRace"
import { Settings } from "./pages/Settings"
import { CheckSquare, FileText, List, Settings as SettingsIcon, Moon, Sun, ListTodo, Gamepad2, Calendar, Mail, HelpCircle, Sheet as SheetIcon, Headset, ChevronDown, Clover } from "lucide-react"
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ThemeSelector } from "./pages/ThemeSelector"
import { Button } from "./components/ui/button"
import { toggleDarkMode, getDarkMode, applyTheme, applyShadcnTheme, tweakCNThemes } from "./lib/theme"

function App(): React.JSX.Element {
  // localStorage에서 테마를 불러오도록 초기값 설정
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('selected-theme') || 'shadcn'
  })

  const [currentPage, setCurrentPage] = useState<'dashboard' | 'todo' | 'ScheduleCheck' | 'memo' | 'minigame' | 'animalrace' | 'fetch' | 'userinfo'>('dashboard')
  const [showThemeDialog, setShowThemeDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [hasTodoDialog, setHasTodoDialog] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => getDarkMode())
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false)

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

  // ` 키로 테마 다이얼로그 열기, ESC 키로 창 최소화
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
      } else if (event.key === 'Escape') {
        // ESC 키로 창 최소화
        if (!hasTodoDialog && !showThemeDialog && !showSettingsDialog) {
          event.preventDefault()
          if (window.electron) {
            window.electron.ipcRenderer.send('minimize-window')
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasTodoDialog, showThemeDialog, showSettingsDialog])

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
                      isActive={currentPage === 'minigame' || currentPage === 'animalrace'}
                      onClick={() => setIsGameMenuOpen(!isGameMenuOpen)}
                    >
                      <Gamepad2 />
                      <span>RestTime</span>
                      <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${isGameMenuOpen ? 'rotate-180' : ''}`} />
                    </SidebarMenuButton>
                    {isGameMenuOpen && (
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            isActive={currentPage === 'minigame'}
                            onClick={() => setCurrentPage('minigame')}
                          >
                            <span>테트리스</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            isActive={currentPage === 'animalrace'}
                            onClick={() => setCurrentPage('animalrace')}
                          >
                            <span>사다리타기</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            onClick={() => window.open("https://extra-yolanthe-junsu-d39ff72a.koyeb.app/", "_blank")}
                          >
                            <span>멍~때리기</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setShowSettingsDialog(true)}>
                      <SettingsIcon />
                      <span className="flex items-center gap-2">
                        Settings
                        {updateAvailable && (
                          <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
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
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="-ml-1" />
            <div
              className="flex items-center gap-1 cursor-pointer animate-pulse"
              onClick={() => setShowThemeDialog(true)}
              title="테마 변경"
            >
              {currentTheme === 'shadcn' ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-gray-900 dark:bg-gray-100 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-700 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-100 dark:bg-gray-800 border border-border"></div>
                </>
              ) : currentTheme === 'Default' ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-gray-900 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-600 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-300 border border-border"></div>
                </>
              ) : currentTheme === 'Blue' ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-blue-600 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-blue-400 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-blue-200 border border-border"></div>
                </>
              ) : currentTheme === 'Green' ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-green-600 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-green-200 border border-border"></div>
                </>
              ) : currentTheme === 'Purple' ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-purple-600 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-purple-400 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-purple-200 border border-border"></div>
                </>
              ) : currentTheme === 'Twitter' ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-blue-500 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-sky-400 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-blue-300 border border-border"></div>
                </>
              ) : currentTheme === 'Claude' ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-orange-600 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-orange-400 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-orange-200 border border-border"></div>
                </>
              ) : currentTheme === 'DOOM64' ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-red-600 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 border border-border"></div>
                </>
              ) : currentTheme === 'Kodama-Grove' ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-green-700 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-white border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-950 border border-border"></div>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 rounded-full bg-primary border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-primary/70 border border-border"></div>
                  <div className="w-3 h-3 rounded-full bg-primary/40 border border-border"></div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1">
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
          <main className="flex-1 p-4 overflow-auto">
            {currentPage === 'dashboard' ? (
              <Dashboard onNavigate={setCurrentPage} />
            ) : currentPage === 'todo' ? (
              <TodoList onDialogChange={setHasTodoDialog} />
            ) : currentPage === 'ScheduleCheck' ? (
              <ScheduleCheck onDialogChange={setHasTodoDialog} />
            ) : currentPage === 'memo' ? (
              <Memo onDialogChange={setHasTodoDialog} />
            ) : currentPage === 'minigame' ? (
              <MiniGame />
            ) : currentPage === 'animalrace' ? (
              <AnimalRace />
            ) : null}
          </main>

          {/* 고정 링크 버튼 */}
          <footer className="sticky bottom-0 z-10 flex h-14 shrink-0 items-center justify-center gap-2 border-t px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://unipost.hanbiro.net/ngw/app/#/', '_blank')}
              className="bg-background hover:bg-accent transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              Mail
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://114.unipost.co.kr/home.uni', '_blank')}
              className="bg-background hover:bg-accent transition-colors"
            >
              <Headset className="w-4 h-4 mr-2" />
              Support
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://helper.unipost.co.kr/', '_blank')}
              className="bg-background hover:bg-accent transition-colors"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Helper
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://docs.google.com/spreadsheets/d/1BCPNsO72naoZqlz1dX8RhZrdnQrhbHF8wWJ0pGFzj1o/edit?gid=1322866646#gid=1322866646', '_blank')}
              className="bg-background hover:bg-accent transition-colors"
            >
              <SheetIcon className="w-4 h-4 mr-2" />
              Sheet
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://lotto-mate.kr/', '_blank')}
              className="bg-background hover:bg-accent transition-colors"
            >
              <Clover className="w-4 h-4 mr-2" />
              Lotto
            </Button>
          </footer>
        </SidebarInset>
      </div>

      <Settings
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        updateAvailable={updateAvailable}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />

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
