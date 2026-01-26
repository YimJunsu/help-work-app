import { useState, useEffect, useRef } from "react"
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
  SidebarMenuBadge,
} from "./components/ui/sidebar"
import { ScheduleCheck } from "./pages/ScheduleCheck"
import { TodoList } from "./pages/TodoList"
import { Dashboard } from "./pages/Dashboard"
import Memo from "./pages/Memo"
import { Settings } from "./pages/Settings"
import { UniSupport } from "./pages/UniSupport"
import { DinoGame } from "./pages/DinoGame"
import { ExchangeRate } from "./pages/ExchangeRate"
import { StockSimulator } from "./pages/StockSimulator"
import { CheckSquare, FileText, Settings as SettingsIcon, Moon, Sun, ListTodo, Headset, CirclePlus, CalendarDays } from "lucide-react"
import { Badge } from "./components/ui/badge"
import { Button } from "./components/ui/button"
import { toggleDarkMode, getDarkMode, applyTheme, applyShadcnTheme, tweakCNThemes } from "./lib/theme"
import { useUserInfo } from "./hooks/useUserInfo"
import { getGreetingMessage } from "./utils/greetingUtils"
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcut"
import { WorkBatteryIndicator } from "./components/WorkBatteryIndicator"
import uniFightingLogo from "./assets/uni_fighting.png"

function App(): React.JSX.Element {
  /* ============================================
     State Management
     ============================================ */

  // 테마 상태 - localStorage에서 로드
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('selected-theme') || 'shadcn'
  })

  // 현재 페이지 상태
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'todo' | 'ScheduleCheck' | 'unisupport' | 'memo' | 'fetch' | 'userinfo' | 'minigame' | 'dinogame' | 'exchangerate' | 'stocksim'>('dashboard')

  // 설정 다이얼로그 상태
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [settingsInitialPage, setSettingsInitialPage] = useState<'userinfo' | 'fetch' | 'theme'>('userinfo')

  // 다이얼로그 오픈 여부 (키보드 단축키 충돌 방지용)
  const [hasTodoDialog, setHasTodoDialog] = useState(false)

  // 다크모드 상태
  const [isDarkMode, setIsDarkMode] = useState(() => getDarkMode())

  // 업데이트 가능 여부
  const [updateAvailable, setUpdateAvailable] = useState(false)

  // 사용자 정보
  const [userName, setUserName] = useState<string | null>(null)

  // UI 상태
  const [todoStats, setTodoStats] = useState({ completed: 0, total: 0 })
  const [scheduleStats, setScheduleStats] = useState({ completed: 0, total: 0 })
  const [memoCount, setMemoCount] = useState(0)

  // Refs - 자식 컴포넌트 메서드 호출용
  const todoListRef = useRef<{ openAddDialog: () => void }>(null)
  const scheduleCheckRef = useRef<{ openAddDialog: () => void; toggleViewMode: () => void }>(null)
  const memoRef = useRef<{ openAddDialog: () => void }>(null)

  // 사용자 정보 훅
  const { userBirthday } = useUserInfo()

  /* ============================================
     Effects & Handlers
     ============================================ */

  /**
   * 테마 초기화 및 변경 처리
   * localStorage에 저장된 테마를 앱 시작 시 적용
   */
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

  /**
   * 다크모드 토글 핸들러
   */
  const handleDarkModeToggle = () => {
    const newDarkMode = toggleDarkMode()
    setIsDarkMode(newDarkMode)
  }

  // 초기 통계 로드 (앱 시작 시)
  useEffect(() => {
    const loadInitialStats = async () => {
      // Todo 통계 (localStorage에서 직접 로드)
      const savedTodos = localStorage.getItem('dailyTodos')
      if (savedTodos) {
        const parsedTodos = JSON.parse(savedTodos)
        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
        threeDaysAgo.setHours(0, 0, 0, 0)

        const todos = parsedTodos
          .map((todo: any) => ({
            ...todo,
            date: new Date(todo.date),
          }))
          .filter((todo: any) => {
            const todoDate = new Date(todo.date)
            todoDate.setHours(0, 0, 0, 0)
            return todoDate.getTime() >= threeDaysAgo.getTime()
          })

        const completedCount = todos.filter((todo: any) => todo.completed).length
        setTodoStats({ completed: completedCount, total: todos.length })
      }

      // Schedule 통계 (IPC를 통해 로드)
      if (window.electron) {
        const schedules = await window.electron.ipcRenderer.invoke('schedules:getAll')
        const completedCount = schedules.filter((schedule: any) => schedule.completed).length
        setScheduleStats({ completed: completedCount, total: schedules.length })

        // Memo 개수 (IPC를 통해 로드)
        const memos = await window.electron.ipcRenderer.invoke('memos:getAll')
        setMemoCount(memos.length)
      }
    }

    loadInitialStats()
  }, [])

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

  /**
   * 키보드 단축키 설정
   * - `: 테마 설정 열기
   * - ESC: 창 최소화 (다이얼로그가 없을 때만)
   * - Ctrl+N: 새 할일/일정/메모 추가 (현재 페이지에 따라)
   * - Ctrl+D: 다크모드 토글
   */
  useKeyboardShortcuts([
    {
      // 백틱(`) - 테마 설정 열기
      config: { key: '`', preventDefault: true },
      handler: () => {
        if (!hasTodoDialog && !showSettingsDialog) {
          setSettingsInitialPage('theme')
          setShowSettingsDialog(true)
        }
      },
    },
    {
      // ESC - 창 최소화
      config: { key: 'Escape', preventDefault: false },
      handler: () => {
        if (!hasTodoDialog && !showSettingsDialog) {
          if (window.electron) {
            window.electron.ipcRenderer.send('minimize-window')
          }
        }
      },
    },
    {
      // Ctrl+N - 새 항목 추가
      config: { key: 'n', ctrlKey: true, preventDefault: true },
      handler: () => {
        if (!hasTodoDialog && !showSettingsDialog) {
          if (currentPage === 'todo') {
            todoListRef.current?.openAddDialog()
          } else if (currentPage === 'ScheduleCheck') {
            scheduleCheckRef.current?.openAddDialog()
          } else if (currentPage === 'memo') {
            memoRef.current?.openAddDialog()
          }
        }
      },
    },
    {
      // Ctrl+D - 다크모드 토글
      config: { key: 'd', ctrlKey: true, preventDefault: true },
      handler: () => {
        handleDarkModeToggle()
      },
    },
  ], [hasTodoDialog, showSettingsDialog, currentPage])

  /**
   * 테마 변경 핸들러
   * 상태 업데이트 및 localStorage 저장
   */
  const handleThemeChange = (themeName: string) => {
    setCurrentTheme(themeName)
    localStorage.setItem('selected-theme', themeName)
  }

  /* ============================================
     Render
     ============================================ */

  return (
    <SidebarProvider>
      {/* 메인 컨테이너 */}
      <div className="min-h-screen flex w-full bg-background">
        {/* 사이드바 네비게이션 */}
        <Sidebar variant="floating">
          {/* ========================================
              Sidebar Header - 로고 & 브랜딩
              ======================================== */}
          <SidebarHeader>
            <div
              className="group flex items-center gap-3 px-2 py-2 cursor-pointer rounded-lg transition-all duration-200 hover:bg-accent/50 active:scale-[0.98]"
              onClick={() => setCurrentPage('dashboard')}
            >
              {/* 로고 아이콘 */}
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow overflow-hidden">
                <img
                  src={uniFightingLogo}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* 브랜딩 텍스트 */}
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight">Work Management</span>
                <span className="text-[10px] text-muted-foreground tracking-wider uppercase">당신의 업무 도우미</span>
              </div>
            </div>
          </SidebarHeader>

          {/* ========================================
              Sidebar Content - 메인 메뉴
              ======================================== */}
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Daily TodoList - 통계 뱃지 포함 */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentPage === 'todo'}
                      onClick={() => setCurrentPage('todo')}
                    >
                      <ListTodo />
                      <span>Daily TodoList</span>
                      {todoStats.total > 0 && (
                        <SidebarMenuBadge>
                          {todoStats.completed}/{todoStats.total}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Schedule Check - 통계 뱃지 포함 */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentPage === 'ScheduleCheck'}
                      onClick={() => setCurrentPage('ScheduleCheck')}
                    >
                      <CheckSquare />
                      <span>Schedule Check</span>
                      {scheduleStats.total > 0 && (
                        <SidebarMenuBadge>
                          {scheduleStats.completed}/{scheduleStats.total}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Memo - 개수 뱃지 포함 */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentPage === 'memo'}
                      onClick={() => setCurrentPage('memo')}
                    >
                      <FileText />
                      <span>Memo</span>
                      {memoCount > 0 && (
                        <SidebarMenuBadge>{memoCount}</SidebarMenuBadge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* UniSupport */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentPage === 'unisupport'}
                      onClick={() => setCurrentPage('unisupport')}
                    >
                      <Headset />
                      <span>UniSupport</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* ========================================
              Sidebar Footer - 설정 & 사용자 정보
              ======================================== */}
          <SidebarFooter>
            <SidebarSeparator />

            {/* Settings 버튼 */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => {
                      setSettingsInitialPage('userinfo')
                      setShowSettingsDialog(true)
                    }}>
                      <SettingsIcon />
                      <span>Settings</span>
                      {updateAvailable && (
                        <span className="ml-auto w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* 사용자 정보 */}
            <div className="px-3 py-3 space-y-3">
              <div className="px-2 py-2 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="text-sm font-semibold text-foreground">
                  {userName ? (
                    <>
                      <span className="text-primary">안녕하세요,</span> {userName}님!
                    </>
                  ) : (
                    <span className="text-muted-foreground text-xs">사용자 정보를 등록해주세요</span>
                  )}
                </div>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-3 flex-1">
              {currentPage === 'dashboard' && (
                <h1 className="text-lg font-semibold">
                  {getGreetingMessage(userName, userBirthday).message}
                </h1>
              )}
              {currentPage === 'todo' && (
                <>
                  <h1 className="text-lg font-semibold">Daily TodoList</h1>
                  <Badge variant="secondary" className="text-sm font-medium">
                    {todoStats.completed}/{todoStats.total} 완료
                  </Badge>
                </>
              )}
              {currentPage === 'ScheduleCheck' && (
                <>
                  <h1 className="text-lg font-semibold">Schedule Check</h1>
                  <Badge variant="secondary" className="text-sm font-medium">
                    {scheduleStats.completed}/{scheduleStats.total} 완료
                  </Badge>
                </>
              )}
              {currentPage === 'memo' && (
                <>
                  <h1 className="text-lg font-semibold">Memo</h1>
                  <Badge variant="secondary" className="text-sm font-medium">
                    {memoCount}개
                  </Badge>
                </>
              )}
              {currentPage === 'unisupport' && (
                <h1 className="text-lg font-semibold">UniSupport 요청 내역</h1>
              )}
              {currentPage === 'dinogame' && (
                <h1 className="text-lg font-semibold">Dino Game</h1>
              )}
              {currentPage === 'exchangerate' && (
                <h1 className="text-lg font-semibold">Exchange Rate</h1>
              )}
              {currentPage === 'stocksim' && (
                <h1 className="text-lg font-semibold">Stock Simulator</h1>
              )}
            </div>
            {currentPage === 'ScheduleCheck' && (
              <Button
                onClick={() => scheduleCheckRef.current?.toggleViewMode()}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <CalendarDays className="w-5 h-5" />
              </Button>
            )}
            {(currentPage === 'todo' || currentPage === 'ScheduleCheck' || currentPage === 'memo') && (
              <Button
                onClick={() => {
                  if (currentPage === 'todo') todoListRef.current?.openAddDialog()
                  else if (currentPage === 'ScheduleCheck') scheduleCheckRef.current?.openAddDialog()
                  else if (currentPage === 'memo') memoRef.current?.openAddDialog()
                }}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <CirclePlus className="w-5 h-5" />
              </Button>
            )}
            <Button
              onClick={handleDarkModeToggle}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <SidebarTrigger className="-ml-1" />
            <WorkBatteryIndicator />
          </header>
          <div className="flex-1 p-4 overflow-auto">
            {currentPage === 'dashboard' ? (
              <Dashboard onNavigate={setCurrentPage} />
            ) : currentPage === 'todo' ? (
              <TodoList ref={todoListRef} onDialogChange={setHasTodoDialog} onStatsChange={setTodoStats} />
            ) : currentPage === 'ScheduleCheck' ? (
              <ScheduleCheck ref={scheduleCheckRef} onDialogChange={setHasTodoDialog} onStatsChange={setScheduleStats} />
            ) : currentPage === 'unisupport' ? (
              <UniSupport />
            ) : currentPage === 'memo' ? (
              <Memo ref={memoRef} onDialogChange={setHasTodoDialog} onCountChange={setMemoCount} />
            ) : currentPage === 'dinogame' ? (
              <DinoGame />
            ) : currentPage === 'exchangerate' ? (
              <ExchangeRate />
            ) : currentPage === 'stocksim' ? (
              <StockSimulator />
            ) : null}
          </div>
        </SidebarInset>
      </div>

      <Settings
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        updateAvailable={updateAvailable}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        initialPage={settingsInitialPage}
      />
    </SidebarProvider>
  )
}

export default App
