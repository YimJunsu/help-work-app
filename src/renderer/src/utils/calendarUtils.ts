import { startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay } from 'date-fns'
import type { Schedule } from '../hooks/useSchedules'

/**
 * 달력 날짜 배열을 생성하는 함수
 */
export function generateCalendarDays(currentMonth: Date): Date[] {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
}

/**
 * 특정 날짜의 스케줄을 가져오는 함수
 */
export function getSchedulesForDate(schedules: Schedule[], date: Date): Schedule[] {
  return schedules.filter(schedule => {
    if (!schedule.dueDate) return false
    const scheduleDate = new Date(schedule.dueDate)
    return isSameDay(scheduleDate, date)
  })
}