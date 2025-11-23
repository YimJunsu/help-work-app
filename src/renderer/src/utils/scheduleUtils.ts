import { differenceInDays } from 'date-fns'

/**
 * D-Day 텍스트를 반환하는 함수
 */
export function getDDayText(dueDate?: string): string | null {
  if (!dueDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)

  const diff = differenceInDays(due, today)

  if (diff === 0) return 'D-Day'
  if (diff < 0) return `D+${Math.abs(diff)}`
  return `D-${diff}`
}

/**
 * D-Day 상태를 반환하는 함수
 */
export function getDDayStatus(dueDate?: string): 'dday' | 'tomorrow' | 'normal' | null {
  if (!dueDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)

  const diff = differenceInDays(due, today)

  if (diff === 0) return 'dday'
  if (diff === 1) return 'tomorrow'
  return 'normal'
}

/**
 * 카테고리 라벨을 반환하는 함수
 */
export function getCategoryLabel(category?: string): string | undefined {
  if (category?.startsWith('기타-')) {
    return category
  }
  switch (category) {
    case 'develop': return '개발/수정'
    case 'reflect': return '운영 반영'
    case 'inspection': return '서비스 점검'
    default: return category
  }
}

/**
 * 카테고리 색상을 반환하는 함수
 */
export function getCategoryColor(category?: string): string {
  if (category?.startsWith('기타-')) {
    return 'bg-muted/50 text-muted-foreground dark:bg-muted dark:text-foreground border border-border'
  }
  switch (category) {
    case 'develop': return 'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary border border-primary/30'
    case 'reflect': return 'bg-accent/20 text-accent-foreground dark:bg-accent/30 dark:text-accent-foreground border border-accent/30'
    case 'inspection': return 'bg-secondary/30 text-secondary-foreground dark:bg-secondary/40 dark:text-secondary-foreground border border-secondary/40'
    default: return 'bg-muted/50 text-muted-foreground dark:bg-muted dark:text-foreground border border-border'
  }
}

/**
 * 카테고리 뱃지 색상을 반환하는 함수
 */
export function getCategoryBadgeColor(categoryId: string | null, isSelected: boolean): string {
  if (isSelected) {
    switch (categoryId) {
      case 'develop': return 'bg-blue-200 text-blue-800 hover:bg-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700'
      case 'reflect': return 'bg-green-200 text-green-800 hover:bg-green-300 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700'
      case 'inspection': return 'bg-purple-200 text-purple-800 hover:bg-purple-300 dark:bg-purple-800 dark:text-purple-100 dark:hover:bg-purple-700'
      case 'ex': return 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300 dark:bg-yellow-800 dark:text-yellow-100 dark:hover:bg-yellow-700'
      default: return 'bg-foreground text-background hover:bg-foreground/90'
    }
  } else {
    switch (categoryId) {
      case 'develop': return 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60'
      case 'reflect': return 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/60'
      case 'inspection': return 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-900/60'
      case 'ex': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:hover:bg-yellow-900/60'
      default: return 'bg-muted text-muted-foreground hover:bg-muted/80'
    }
  }
}

/**
 * 캘린더 아이템 색상을 반환하는 함수
 */
export function getCalendarItemColor(category?: string): string {
  if (category?.startsWith('기타-')) {
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
  }
  switch (category) {
    case 'develop':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    case 'reflect':
      return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    case 'inspection':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300'
  }
}