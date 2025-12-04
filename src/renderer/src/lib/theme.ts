export interface Theme {
  name: string
  className: string
}

export const tweakCNThemes: Theme[] = [
  { name: 'Default', className: 'theme-default' },
  { name: 'iOS', className: 'theme-ios' },
  { name: 'Blue', className: 'theme-blue' },
  { name: 'Green', className: 'theme-green' },
  { name: 'Purple', className: 'theme-purple' },
  { name: 'Soft Pink', className: 'theme-soft-pink' },
  { name: 'Twitter', className: 'theme-twitter' },
  { name: 'Claude', className: 'theme-claude' },
  { name: 'DOOM64', className: 'theme-doom64' },
  { name: 'Kodama-Grove', className: 'theme-Kodama-Grove' },
]

export function applyTheme(theme: Theme) {
  const root = document.documentElement

  // Remove all theme classes
  root.classList.remove(
    'theme-default',
    'theme-ios',
    'theme-blue',
    'theme-green',
    'theme-purple',
    'theme-soft-pink',
    'theme-twitter',
    'theme-claude',
    'theme-shadcn',
    'theme-doom64',
    'theme-Kodama-Grove'
  )

  // Add the new theme class
  root.classList.add(theme.className)

  console.log('Applied theme:', theme.name, 'with class:', theme.className)
}

export function applyShadcnTheme() {
  const root = document.documentElement

  // Remove all theme classes
  root.classList.remove(
    'theme-default',
    'theme-ios',
    'theme-blue',
    'theme-green',
    'theme-purple',
    'theme-soft-pink',
    'theme-twitter',
    'theme-claude',
    'theme-shadcn',
    'theme-doom64',
    'theme-Kodama-Grove'
  )

  // shadcn is the default, so no class needed
  console.log('Applied shadcn theme (default)')
}

export function getCurrentTheme(): string {
  const root = document.documentElement
  const classList = root.classList

  for (const theme of tweakCNThemes) {
    if (classList.contains(theme.className)) {
      return theme.name
    }
  }

  return 'shadcn'
}

export function toggleDarkMode(): boolean {
  const root = document.documentElement
  const isDark = root.classList.contains('dark')

  if (isDark) {
    root.classList.remove('dark')
    localStorage.setItem('darkMode', 'false')
    return false
  } else {
    root.classList.add('dark')
    localStorage.setItem('darkMode', 'true')
    return true
  }
}

export function getDarkMode(): boolean {
  if (typeof window === 'undefined') return false

  const stored = localStorage.getItem('darkMode')
  if (stored !== null) {
    const isDark = stored === 'true'
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
    return isDark
  }

  // 시스템 기본값 사용
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (prefersDark) {
    document.documentElement.classList.add('dark')
  }
  return prefersDark
}
