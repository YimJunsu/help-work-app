/**
 * useKeyboardShortcut Hook
 *
 * 키보드 단축키를 등록하는 커스텀 훅
 * 생산성 향상을 위한 키보드 인터랙션 지원
 *
 * @example
 * // Ctrl+K 단축키 등록
 * useKeyboardShortcut({ key: 'k', ctrlKey: true }, () => {
 *   openSearchModal()
 * })
 *
 * // ESC 단축키 등록
 * useKeyboardShortcut({ key: 'Escape' }, () => {
 *   closeModal()
 * })
 */

import { useEffect, useCallback } from 'react'

interface ShortcutConfig {
  /** 키 이름 (예: 'k', 'Enter', 'Escape') */
  key: string
  /** Ctrl 키 필요 여부 (Mac: Cmd) */
  ctrlKey?: boolean
  /** Alt 키 필요 여부 */
  altKey?: boolean
  /** Shift 키 필요 여부 */
  shiftKey?: boolean
  /** 메타 키 필요 여부 (Mac: Cmd, Windows: Win) */
  metaKey?: boolean
  /** 기본 동작 방지 여부 */
  preventDefault?: boolean
}

type ShortcutCallback = (event: KeyboardEvent) => void

export function useKeyboardShortcut(
  config: ShortcutConfig,
  callback: ShortcutCallback,
  dependencies: React.DependencyList = []
): void {
  const {
    key,
    ctrlKey = false,
    altKey = false,
    shiftKey = false,
    metaKey = false,
    preventDefault = true,
  } = config

  // 콜백 메모이제이션
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 키 일치 확인 (대소문자 구분 없음)
      const keyMatch = event.key.toLowerCase() === key.toLowerCase()

      // 모디파이어 키 확인
      const ctrlMatch = ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
      const altMatch = altKey ? event.altKey : !event.altKey
      const shiftMatch = shiftKey ? event.shiftKey : !event.shiftKey
      const metaMatch = metaKey ? event.metaKey : true

      // 모든 조건 만족 시 콜백 실행
      if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
        if (preventDefault) {
          event.preventDefault()
        }
        callback(event)
      }
    },
    [key, ctrlKey, altKey, shiftKey, metaKey, preventDefault, callback, ...dependencies]
  )

  useEffect(() => {
    // 키보드 이벤트 리스너 등록
    window.addEventListener('keydown', handleKeyDown)

    // 클린업
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

/**
 * 여러 단축키를 한번에 등록하는 훅
 *
 * @example
 * useKeyboardShortcuts([
 *   { config: { key: 'k', ctrlKey: true }, handler: openSearch },
 *   { config: { key: 'n', ctrlKey: true }, handler: createNew },
 * ])
 */
export function useKeyboardShortcuts(
  shortcuts: Array<{ config: ShortcutConfig; handler: ShortcutCallback }>,
  dependencies: React.DependencyList = []
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach(({ config, handler }) => {
        const {
          key,
          ctrlKey = false,
          altKey = false,
          shiftKey = false,
          metaKey = false,
          preventDefault = true,
        } = config

        const keyMatch = event.key.toLowerCase() === key.toLowerCase()
        const ctrlMatch = ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
        const altMatch = altKey ? event.altKey : !event.altKey
        const shiftMatch = shiftKey ? event.shiftKey : !event.shiftKey
        const metaMatch = metaKey ? event.metaKey : true

        if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
          if (preventDefault) {
            event.preventDefault()
          }
          handler(event)
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [...dependencies, shortcuts])
}
