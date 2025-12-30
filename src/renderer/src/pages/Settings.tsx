import React, { useState } from 'react'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { Button } from '../components/ui/button'
import { Settings as SettingsIcon, Palette, Download, User, Power } from 'lucide-react'
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
  initialPage?: SettingsPage
}

type SettingsPage = 'userinfo' | 'fetch' | 'theme'

export function Settings({ open, onOpenChange, updateAvailable, currentTheme, onThemeChange, initialPage = 'userinfo' }: SettingsProps) {
  const [currentPage, setCurrentPage] = useState<SettingsPage>(initialPage)
  const [showQuitDialog, setShowQuitDialog] = useState(false)

  // initialPage가 변경되면 currentPage도 업데이트
  React.useEffect(() => {
    if (open) {
      setCurrentPage(initialPage)
    }
  }, [open, initialPage])

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
        <DialogContent className="max-w-4xl h-[75vh] max-h-[700px] p-0 gap-0 flex flex-col">
          <div className="flex flex-1 min-h-0">
            {/* 사이드바 */}
            <div className="w-56 border-r bg-muted/20 p-4 flex flex-col gap-4 shrink-0">
              <div className="flex items-center gap-2 px-1">
                <SettingsIcon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">설정</h2>
              </div>

              <nav className="space-y-1">
                <Button
                  variant={currentPage === 'userinfo' ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start h-10 text-sm',
                    currentPage === 'userinfo' && 'bg-secondary shadow-sm'
                  )}
                  onClick={() => setCurrentPage('userinfo')}
                >
                  <User className="w-4 h-4 mr-2.5" />
                  사용자 정보
                </Button>

                <Button
                  variant={currentPage === 'theme' ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start h-10 text-sm',
                    currentPage === 'theme' && 'bg-secondary shadow-sm'
                  )}
                  onClick={() => setCurrentPage('theme')}
                >
                  <Palette className="w-4 h-4 mr-2.5" />
                  테마
                </Button>

                <Button
                  variant={currentPage === 'fetch' ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start h-10 text-sm',
                    currentPage === 'fetch' && 'bg-secondary shadow-sm'
                  )}
                  onClick={() => setCurrentPage('fetch')}
                >
                  <Download className="w-4 h-4 mr-2.5" />
                  업데이트
                  {updateAvailable && (
                    <span className="ml-auto w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
                  )}
                </Button>
              </nav>

              {/* 종료 버튼 */}
              <div className="mt-auto pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleQuitClick}
                >
                  <Power className="w-4 h-4 mr-2.5" />
                  프로그램 종료
                </Button>
              </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
              {currentPage === 'userinfo' && <UserInfo />}
              {currentPage === 'theme' && <ThemeSelector currentTheme={currentTheme} onThemeChange={onThemeChange} />}
              {currentPage === 'fetch' && <FetchSettings />}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
