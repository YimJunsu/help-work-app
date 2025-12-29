import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog'
import { Card, CardContent } from '../components/ui/card'
import { tweakCNThemes, applyTheme, applyShadcnTheme, type Theme } from '../lib/theme'
import { Palette, Check } from 'lucide-react'

interface ThemeSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTheme: string
  onThemeChange: (theme: string) => void
}

export function ThemeSelector({ open, onOpenChange, currentTheme, onThemeChange }: ThemeSelectorProps) {
  const handleThemeSelect = (theme: Theme) => {
    applyTheme(theme)
    localStorage.setItem('selected-theme', theme.name) // ✅ 저장
    onThemeChange(theme.name)
    onOpenChange(false)
  }

  const handleShadcnSelect = () => {
    applyShadcnTheme()
    localStorage.setItem('selected-theme', 'shadcn') // ✅ 저장
    onThemeChange('shadcn')
    onOpenChange(false)
  }



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ✅ 수정 1: 스크롤바 깨짐 방지를 위해 pr-2 (오른쪽 패딩) 추가.
        ✅ 수정 2: radius를 rounded-xl로 적용.
      */}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto pr-4 rounded-xl bg-background/95 backdrop-blur-md border-2 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Palette className="w-6 h-6 text-primary" />
            커스텀 테마 선택
          </DialogTitle>
          <DialogDescription>
            나만의 색상 테마를 선택하세요. 기본 테마 또는 개성있는 다양한 테마 중에서 선택할 수 있어요!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* shadcn 기본 테마 */}
          <div>
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                currentTheme === 'shadcn' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={handleShadcnSelect}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">shadcn/ui</div>
                    <div className="text-sm text-muted-foreground">기본 테마</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentTheme === 'shadcn' && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-full bg-gray-900 dark:bg-gray-100"></div>
                      <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                      <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TweakCN 테마들 */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tweakCNThemes.map((theme) => (
                <Card
                  key={theme.name}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    currentTheme === theme.name ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleThemeSelect(theme)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{theme.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentTheme === theme.name && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                        <div className="flex gap-1">
                          {theme.name === 'Default' && (
                            <>
                              <div className="w-4 h-4 rounded-full bg-gray-900 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-gray-600 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-gray-300 border border-gray-300"></div>
                            </>
                          )}
                          {theme.name === 'iOS' && (
                            <>
                              <div className="w-4 h-4 rounded-full bg-blue-500 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-gray-200 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-gray-900 dark:bg-gray-100 border border-gray-300"></div>
                            </>
                          )}
                          {theme.name === 'Blue' && (
                            <>
                              <div className="w-4 h-4 rounded-full bg-blue-600 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-blue-400 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-blue-200 border border-gray-300"></div>
                            </>
                          )}
                          {theme.name === 'Green' && (
                            <>
                              <div className="w-4 h-4 rounded-full bg-green-600 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-green-400 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-green-200 border border-gray-300"></div>
                            </>
                          )}
                          {theme.name === 'Soft Pink' && (
                            <>
                              <div className="w-4 h-4 rounded-full bg-pink-400 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-pink-300 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-pink-100 border border-gray-300"></div>
                            </>
                          )}
                          {theme.name === 'Twitter' && (
                            <>
                              <div className="w-4 h-4 rounded-full bg-blue-500 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-sky-400 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-blue-300 border border-gray-300"></div>
                            </>
                          )}
                          {theme.name === 'Claude' && (
                            <>
                              <div className="w-4 h-4 rounded-full bg-orange-600 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-orange-400 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-orange-200 border border-gray-300"></div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
