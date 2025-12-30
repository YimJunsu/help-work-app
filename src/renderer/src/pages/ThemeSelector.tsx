import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { tweakCNThemes, applyTheme, applyShadcnTheme, type Theme } from '../lib/theme'
import { Palette, Check } from 'lucide-react'

interface ThemeSelectorProps {
  currentTheme: string
  onThemeChange: (theme: string) => void
}

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  const handleThemeSelect = (theme: Theme) => {
    applyTheme(theme)
    localStorage.setItem('selected-theme', theme.name)
    onThemeChange(theme.name)
  }

  const handleShadcnSelect = () => {
    applyShadcnTheme()
    localStorage.setItem('selected-theme', 'shadcn')
    onThemeChange('shadcn')
  }

  return (
    <div className="w-full p-6">
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">테마 설정</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                나만의 색상 테마를 선택하세요
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-5">
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
            <div className="grid grid-cols-2 gap-3">
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
        </CardContent>
      </Card>
    </div>
  )
}
