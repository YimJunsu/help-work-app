import { useState } from 'react'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { Button } from '../components/ui/button'
import { Settings as SettingsIcon, Palette, Download, User, X, Power } from 'lucide-react'
import { UserInfo } from './UserInfo'
import { FetchSettings } from './FetchSettings'
import { ThemeSelector } from './ThemeSelector'
import { cn } from '../lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'

interface SettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  updateAvailable: boolean
  currentTheme: string
  onThemeChange: (theme: string) => void
}

type SettingsPage = 'userinfo' | 'fetch' | 'theme'

export function Settings({ open, onOpenChange, updateAvailable, currentTheme, onThemeChange }: SettingsProps) {
  const [currentPage, setCurrentPage] = useState<SettingsPage>('userinfo')
  const [showThemeDialog, setShowThemeDialog] = useState(false)
  const [showQuitDialog, setShowQuitDialog] = useState(false)

  const handleThemeClick = () => {
    setShowThemeDialog(true)
  }

  const handleThemeDialogChange = (open: boolean) => {
    setShowThemeDialog(open)
  }

  const handleQuitClick = () => {
    setShowQuitDialog(true)
  }

  const handleConfirmQuit = () => {
    if (window.electron) {
      window.electron.ipcRenderer.send('quit-app')
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0">
          <div className="flex h-full">
            {/* 사이드바 */}
            <div className="w-64 border-r bg-muted/30 p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-6 px-2">
                <SettingsIcon className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Settings</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-8 w-8"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <nav className="space-y-1 flex-1">
                <Button
                  variant={currentPage === 'userinfo' ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    currentPage === 'userinfo' && 'bg-secondary'
                  )}
                  onClick={() => setCurrentPage('userinfo')}
                >
                  <User className="w-4 h-4 mr-2" />
                  사용자 정보
                </Button>

                <Button
                  variant={currentPage === 'theme' ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    currentPage === 'theme' && 'bg-secondary'
                  )}
                  onClick={handleThemeClick}
                >
                  <Palette className="w-4 h-4 mr-2" />
                  테마
                </Button>

                <Button
                  variant={currentPage === 'fetch' ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    currentPage === 'fetch' && 'bg-secondary'
                  )}
                  onClick={() => setCurrentPage('fetch')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  업데이트
                  {updateAvailable && (
                    <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Button>
              </nav>

              {/* 종료 버튼 */}
              <div className="pt-4 border-t mt-4">
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleQuitClick}
                >
                  <Power className="w-4 h-4 mr-2" />
                  프로그램 종료
                </Button>
              </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="flex-1 overflow-auto p-6">
              {currentPage === 'userinfo' && <UserInfo />}
              {currentPage === 'fetch' && <FetchSettings />}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 테마 선택 다이얼로그 */}
      <ThemeSelector
        open={showThemeDialog}
        onOpenChange={handleThemeDialogChange}
        currentTheme={currentTheme}
        onThemeChange={onThemeChange}
      />

      {/* 종료 확인 다이얼로그 */}
      <AlertDialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로그램을 종료하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              프로그램을 종료하면 모든 작업이 저장되고 앱이 완전히 종료됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>아니요</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmQuit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              예, 종료합니다
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}