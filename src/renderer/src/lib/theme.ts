/**
 * Theme Management System
 *
 * 테마 관리 유틸리티 함수 모음
 * - 7가지 테마 지원 (shadcn + 6개 커스텀)
 * - 다크모드 토글
 * - localStorage 영속성
 */

/**
 * 테마 인터페이스
 */
export interface Theme {
  name: string        // 테마 이름 (표시용)
  className: string   // CSS 클래스명
}

/**
 * 사용 가능한 테마 목록
 * globals.css에 정의된 테마와 매칭
 */
export const tweakCNThemes: Theme[] = [
  { name: 'Default', className: 'theme-default' },      // 클래식 무채색
  { name: 'iOS', className: 'theme-ios' },              // Apple 블루
  { name: 'Green', className: 'theme-green' },          // 차분한 그린
  { name: 'Soft Pink', className: 'theme-soft-pink' },  // 파스텔 핑크
  { name: 'Twitter', className: 'theme-twitter' },      // 트위터 블루
  { name: 'Claude', className: 'theme-claude' },        // 오렌지 액센트
]

/**
 * 테마 적용
 * @param theme - 적용할 테마 객체
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement

  // 기존 테마 클래스 모두 제거
  root.classList.remove(
    'theme-default',
    'theme-ios',
    'theme-green',
    'theme-soft-pink',
    'theme-twitter',
    'theme-claude',
    'theme-shadcn'
  )

  // 새 테마 클래스 추가
  root.classList.add(theme.className)

  console.log('✓ 테마 적용:', theme.name)
}

/**
 * Shadcn 기본 테마 적용
 * CSS 변수 기본값 사용 (클래스 없음)
 */
export function applyShadcnTheme(): void {
  const root = document.documentElement

  // 모든 테마 클래스 제거
  root.classList.remove(
    'theme-default',
    'theme-ios',
    'theme-green',
    'theme-soft-pink',
    'theme-twitter',
    'theme-claude',
    'theme-shadcn'
  )

  console.log('✓ 테마 적용: shadcn (기본)')
}

/**
 * 현재 활성화된 테마 가져오기
 * @returns 테마 이름 (string)
 */
export function getCurrentTheme(): string {
  const root = document.documentElement
  const classList = root.classList

  // 현재 적용된 테마 클래스 찾기
  for (const theme of tweakCNThemes) {
    if (classList.contains(theme.className)) {
      return theme.name
    }
  }

  // 테마 클래스가 없으면 기본 테마
  return 'shadcn'
}

/**
 * 다크모드 토글
 * @returns 토글 후 다크모드 상태 (true: 다크, false: 라이트)
 */
export function toggleDarkMode(): boolean {
  const root = document.documentElement
  const isDark = root.classList.contains('dark')

  if (isDark) {
    // 라이트 모드로 전환
    root.classList.remove('dark')
    localStorage.setItem('darkMode', 'false')
    return false
  } else {
    // 다크 모드로 전환
    root.classList.add('dark')
    localStorage.setItem('darkMode', 'true')
    return true
  }
}

/**
 * 다크모드 상태 가져오기 (초기화)
 * localStorage > 시스템 설정 순서로 확인
 * @returns 다크모드 여부 (boolean)
 */
export function getDarkMode(): boolean {
  // SSR 환경 대응
  if (typeof window === 'undefined') return false

  // 1. localStorage 확인
  const stored = localStorage.getItem('darkMode')
  if (stored !== null) {
    const isDark = stored === 'true'
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
    return isDark
  }

  // 2. 시스템 설정 사용
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (prefersDark) {
    document.documentElement.classList.add('dark')
  }
  return prefersDark
}
