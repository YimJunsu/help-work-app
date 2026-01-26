/**
 * useMediaQuery Hook
 *
 * 미디어 쿼리를 감지하는 커스텀 훅
 * 반응형 디자인에 활용 - 화면 크기에 따른 조건부 렌더링
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)')
 * const isDesktop = useMediaQuery('(min-width: 1024px)')
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
 */

import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  // SSR 대응 - 초기값 false
  const [matches, setMatches] = useState<boolean>(false)

  useEffect(() => {
    // MediaQueryList 객체 생성
    const media = window.matchMedia(query)

    // 초기값 설정
    setMatches(media.matches)

    // 변경 감지 리스너
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // 이벤트 리스너 등록 (최신 브라우저)
    if (media.addEventListener) {
      media.addEventListener('change', listener)
    } else {
      // 레거시 브라우저 지원
      media.addListener(listener)
    }

    // 클린업
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener)
      } else {
        media.removeListener(listener)
      }
    }
  }, [query])

  return matches
}

/**
 * 자주 사용하는 미디어 쿼리 Preset
 */
export const BREAKPOINTS = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const

/**
 * Preset 기반 편의 훅
 */
export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  return useMediaQuery(BREAKPOINTS[breakpoint])
}
