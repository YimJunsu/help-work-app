import { useMemo } from 'react'
import { CardContent, CardTitle } from '../ui/card'
import { Calendar as CalendarIcon, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Schedule } from '../../hooks/useSchedules'
import { getDDayText, getCategoryLabel } from '../../utils/scheduleUtils'

interface UpcomingSchedulesProps {
  schedules: Schedule[]
  onNavigate?: (page: 'dashboard' | 'todo' | 'ScheduleCheck' | 'memo' | 'fetch' | 'minigame' | 'userinfo') => void
}

export function UpcomingSchedules({ schedules, onNavigate }: UpcomingSchedulesProps) {
  const upcomingSchedules = useMemo(() => {
    return schedules
      .filter(schedule => schedule.dueDate && !schedule.completed)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 2)
  }, [schedules])

  return (
    <div
      className="
        w-full rounded-3xl p-4
        bg-gradient-to-b from-white/40 to-white/20
        dark:from-slate-800/40 dark:to-slate-900/20
        backdrop-blur-2xl border border-white/20 shadow-lg
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/20 backdrop-blur-md">
            <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
          </div>
          <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-200">
            다가오는 일정
          </CardTitle>
        </div>

        <button
          onClick={() => onNavigate?.('ScheduleCheck')}
          className="flex items-center text-sm text-blue-600 dark:text-blue-300 hover:opacity-70 transition"
        >
          더보기
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Content */}
      <CardContent className="p-0 space-y-3">
        {upcomingSchedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-300">
            <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">다가오는 일정이 없습니다</p>
          </div>
        ) : (
          upcomingSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className="
                p-3 rounded-2xl
                bg-white/30 dark:bg-slate-800/40 backdrop-blur-xl
                border border-white/20 dark:border-slate-700/20
                shadow-sm hover:shadow-md
                transition-all duration-200
              "
            >
              <div className="flex items-start justify-between gap-2">
                {/* Left */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">
                    {schedule.clientName && (
                      <span className="text-blue-600 dark:text-blue-300">
                        {schedule.clientName} ·{' '}
                      </span>
                    )}
                    {schedule.text}
                  </div>

                  {/* Badges */}
                  <div className="flex gap-1 mt-2">
                    {schedule.category && (
                      <span className="
                        text-[10px] px-2 py-0.5 rounded-full
                        bg-blue-500/20 text-blue-700 dark:text-blue-300 dark:bg-blue-400/20
                      ">
                        {getCategoryLabel(schedule.category)}
                      </span>
                    )}

                    {schedule.dueDate && (
                      <span className="
                        text-[10px] px-2 py-0.5 rounded-full
                        bg-gray-500/20 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300
                      ">
                        {format(new Date(schedule.dueDate), 'MM/dd (EEE)', { locale: ko })}
                      </span>
                    )}
                  </div>
                </div>

                {/* D-DAY Badge */}
                {schedule.dueDate && (
                  <span
                    className={`
                      text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0
                      ${
                      getDDayText(schedule.dueDate) === 'D-Day'
                        ? 'bg-red-500 text-white'
                        : getDDayText(schedule.dueDate)?.startsWith('D-')
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-400 dark:bg-gray-600 text-white'
                    }
                    `}
                  >
                    {getDDayText(schedule.dueDate)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </div>
  )
}
