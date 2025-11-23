import { Button } from '../ui/button'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { format, isSameMonth, isSameDay, getDay, addMonths, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Schedule } from '../../hooks/useSchedules'
import { getCalendarItemColor } from '../../utils/scheduleUtils'
import { generateCalendarDays, getSchedulesForDate } from '../../utils/calendarUtils'

interface ScheduleCalendarViewProps {
  schedules: Schedule[]
  currentMonth: Date
  onMonthChange: (date: Date) => void
  onScheduleClick: (schedule: Schedule) => void
  onScheduleDelete: (id: number) => void
  onDateClick: (date: Date) => void
}

export function ScheduleCalendarView({
  schedules,
  currentMonth,
  onMonthChange,
  onScheduleClick,
  onScheduleDelete,
  onDateClick
}: ScheduleCalendarViewProps) {
  const calendarDays = generateCalendarDays(currentMonth)

  return (
    <div className="space-y-3">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          className="h-8"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-base font-bold">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          className="h-8"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday Headers */}
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <div
            key={day}
            className={`text-center text-xs font-bold py-1.5 ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground'
            }`}
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day) => {
          const daySchedules = getSchedulesForDate(schedules, day)
          const isToday = isSameDay(day, new Date())
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const dayOfWeek = getDay(day)

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[70px] border border-border rounded-lg p-1 ${
                isCurrentMonth ? 'bg-card' : 'bg-muted/30'
              } ${isToday ? 'ring-2 ring-primary' : ''}`}
            >
              <div
                className={`text-xs font-semibold mb-1 ${
                  dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-muted-foreground'
                } ${!isCurrentMonth ? 'opacity-50' : ''}`}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {daySchedules.slice(0, 1).map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`text-[10px] px-1 py-0.5 rounded cursor-pointer hover:opacity-80 transition-all truncate relative group ${
                      schedule.completed
                        ? 'bg-muted text-muted-foreground line-through'
                        : getCalendarItemColor(schedule.category)
                    }`}
                    title={`${schedule.clientName ? `[${schedule.clientName}] ` : ''}${schedule.text}`}
                  >
                    <div
                      onClick={() => onScheduleClick(schedule)}
                      className="pr-4"
                    >
                      {schedule.clientName ? `${schedule.clientName.substring(0, 7)}` : schedule.text.substring(0, 9)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onScheduleDelete(schedule.id)
                      }}
                      className="absolute right-0.5 top-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {daySchedules.length > 2 && (
                  <div
                    className="text-[10px] text-primary font-semibold text-center cursor-pointer hover:bg-primary/10 rounded py-0.5 transition-colors"
                    onClick={() => onDateClick(day)}
                  >
                    +{daySchedules.length - 2}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
