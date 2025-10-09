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
import Memo from "./pages/Memo"
import { CheckSquare, Settings, List, Palette, Moon, Sun } from "lucide-react"
import { ThemeSelector } from "./pages/ThemeSelector"
import { Button } from "./components/ui/button"
import { toggleDarkMode, getDarkMode } from "./lib/theme"

function App(): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState<'ScheduleCheck' | 'memo'>('ScheduleCheck')
  const [showThemeDialog, setShowThemeDialog] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('shadcn')
  const [hasTodoDialog, setHasTodoDialog] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => getDarkMode())

  const handleDarkModeToggle = () => {
    const newDarkMode = toggleDarkMode()
    setIsDarkMode(newDarkMode)
  }

  // ` 키로 테마 다이얼로그 열기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ` 키를 눌렀을 때 (백틱)
      if (event.key === '`') {
        // 다이얼로그가 이미 열려있으면 닫기
        if (showThemeDialog) {
          event.preventDefault()
          setShowThemeDialog(false)
          return
        }
        // TodoList의 다이얼로그가 열려있지 않은 경우에만 테마 다이얼로그 열기
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <List className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">To-Do App</span>
                <span className="text-xs text-muted-foreground">Schedule Management</span>
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
                      <Settings />
                      <span>Memo</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

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
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div className="px-4 py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  `
                </kbd>
                <span>to change theme</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Button onClick={handleDarkModeToggle} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1">
              <div className={`w-2 h-2 rounded-full ${currentTheme !== 'shadcn' ? 'bg-primary' : 'bg-muted-foreground'}`}></div>
              <span>{currentTheme !== 'shadcn' ? `TweakCN (${currentTheme})` : 'shadcn'}</span>
            </div>
          </header>
          <main className="flex-1 p-4">
            {currentPage === 'ScheduleCheck' ? (
              <ScheduleCheck onDialogChange={setHasTodoDialog} />
            ) : currentPage === 'memo' ? (
              <Memo />
            ) : null}
          </main>
        </SidebarInset>
      </div>

      <ThemeSelector
        open={showThemeDialog}
        onOpenChange={handleThemeDialogChange}
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
      />
    </SidebarProvider>
  )
}

export default App
