import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
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
    console.log('Applying theme:', theme.name)
    applyTheme(theme)
    onThemeChange(theme.name)
    onOpenChange(false)
  }

  const handleShadcnSelect = () => {
    console.log('Applying shadcn theme')
    applyShadcnTheme()
    onThemeChange('shadcn')
    onOpenChange(false)
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ✅ 수정 1: 스크롤바 깨짐 방지를 위해 pr-2 (오른쪽 패딩) 추가.
        ✅ 수정 2: radius를 rounded-xl로 적용.
      */}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto pr-2 rounded-xl bg-background/95 backdrop-blur-md border-2 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Palette className="w-6 h-6 text-primary" />
            테마 선택
          </DialogTitle>
          <DialogDescription>
            나만의 색상 테마를 선택하세요. 기본 테마 또는 개성있는 다양한 테마 중에서 선택할 수 있어요!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* shadcn 기본 테마 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">기본 테마</h3>
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
            <h3 className="text-lg font-semibold mb-3">TweakCN 테마</h3>
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
                        <div className="text-sm text-muted-foreground">TweakCN 테마</div>
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
                          {theme.name === 'Purple' && (
                            <>
                              <div className="w-4 h-4 rounded-full bg-purple-600 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-purple-400 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-purple-200 border border-gray-300"></div>
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
                          {theme.name === 'DOOM64' && (
                            <>
                              <div className="w-4 h-4 rounded-full bg-red-600 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-green-500 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-yellow-500 border border-gray-300"></div>
                            </>
                          )}
                          {theme.name === 'Kodama-Grove' && (
                            <>
                              <div className="w-4 h-4 rounded-full bg-green-700 border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-white border border-gray-300"></div>
                              <div className="w-4 h-4 rounded-full bg-yellow-950 border border-gray-300"></div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {theme.name !== 'Default' && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          OKLCH 색상 시스템
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          {/* ✅ 수정 3: 닫기 버튼을 variant="ghost"로 변경하여 테두리 제거 및 자연스러운 스타일 적용
          */}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            X
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
