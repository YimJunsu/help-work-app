/**
 * ThemeSelector Component
 *
 * 테마 선택 UI - 7가지 테마 중 선택
 * - shadcn (기본)
 * - Default, iOS, Green, Soft Pink, Twitter, Claude
 *
 * Features:
 * - 그리드 레이아웃 (2열)
 * - 테마별 대표 컬러 프리뷰
 * - 선택된 테마 강조 (ring)
 * - 부드러운 hover 효과
 */

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { tweakCNThemes, applyTheme, applyShadcnTheme, type Theme } from '../lib/theme'
import { Palette, Check } from 'lucide-react'

interface ThemeSelectorProps {
  currentTheme: string
  onThemeChange: (theme: string) => void
}

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  /**
   * 커스텀 테마 선택 핸들러
   */
  const handleThemeSelect = (theme: Theme) => {
    applyTheme(theme)
    localStorage.setItem('selected-theme', theme.name)
    onThemeChange(theme.name)
  }

  /**
   * Shadcn 기본 테마 선택 핸들러
   */
  const handleShadcnSelect = () => {
    applyShadcnTheme()
    localStorage.setItem('selected-theme', 'shadcn')
    onThemeChange('shadcn')
  }

  return (
    <div className="w-full p-6 animate-fade-in">
      <Card className="border shadow-sm">
        {/* 헤더 - 아이콘 + 제목 */}
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
          <div className="animate-fade-in">
            <Card
              className={`
                cursor-pointer transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                active:scale-[0.98]
                ${currentTheme === 'shadcn' ? 'ring-2 ring-primary shadow-md' : ''}
              `}
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
          <div className="animate-fade-in animate-delay-100">
            {/* 2열 그리드 레이아웃 */}
            <div className="grid grid-cols-2 gap-3">
              {tweakCNThemes.map((theme, index) => (
                <Card
                  key={theme.name}
                  className={`
                    cursor-pointer transition-all duration-200
                    hover:shadow-md hover:-translate-y-0.5
                    active:scale-[0.98]
                    ${currentTheme === theme.name ? 'ring-2 ring-primary shadow-md' : ''}
                  `}
                  onClick={() => handleThemeSelect(theme)}
                  style={{ animationDelay: `${(index + 1) * 50}ms` }}
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
