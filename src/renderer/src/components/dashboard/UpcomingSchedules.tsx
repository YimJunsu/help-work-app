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
        group w-full rounded-[28px] p-5
        bg-gradient-to-br from-slate-50/80 to-slate-100/50
        dark:from-slate-900/40 dark:to-slate-800/30
        backdrop-blur-2xl border border-slate-200/40 dark:border-slate-700/30
        shadow-lg shadow-slate-500/5 dark:shadow-slate-900/10
        hover:shadow-xl hover:shadow-slate-500/10 dark:hover:shadow-slate-900/20
        transition-all duration-300
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <CalendarIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </div>
          <CardTitle className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
            다가오는 일정
          </CardTitle>
        </div>

        <button
          onClick={() => onNavigate?.('ScheduleCheck')}
          className="
            flex items-center gap-1 px-3 py-1.5 rounded-full
            text-sm font-medium text-slate-600 dark:text-slate-400
            bg-slate-100 dark:bg-slate-800
            hover:bg-slate-200 dark:hover:bg-slate-700
            active:scale-95 transition-all duration-200
          "
        >
          더보기
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <CardContent className="p-0 space-y-3">
        {upcomingSchedules.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-slate-500/5 blur-2xl rounded-full" />
              <div className="relative p-4 rounded-3xl bg-gradient-to-br from-slate-100/50 to-slate-200/30 dark:from-slate-800/50 dark:to-slate-700/30 border border-slate-200/50 dark:border-slate-700/50">
                <CalendarIcon className="w-12 h-12 mx-auto text-slate-400/60 dark:text-slate-500/50" />
              </div>
            </div>
            <p className="text-sm font-semibold mt-4 text-gray-600 dark:text-gray-400">다가오는 일정이 없습니다</p>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-500">새로운 일정을 추가해보세요</p>
          </div>
        ) : (
          upcomingSchedules.map((schedule, index) => (
            <div
              key={schedule.id}
              className="
                p-4 rounded-[20px]
                bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl
                border border-white/40 dark:border-slate-700/30
                shadow-sm hover:shadow-lg hover:scale-[1.02]
                hover:bg-white/80 dark:hover:bg-slate-800/80
                transition-all duration-200 active:scale-[0.98]
                cursor-pointer
              "
              style={{ animationDelay: `${index * 50}ms` }}
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
                        bg-slate-200/80 text-slate-700 dark:text-slate-300 dark:bg-slate-700/60
                      ">
                        {getCategoryLabel(schedule.category)}
                      </span>
                    )}

                    {schedule.dueDate && (
                      <span className="
                        text-[10px] px-2 py-0.5 rounded-full
                        bg-slate-200/60 dark:bg-slate-700/40 text-slate-600 dark:text-slate-400
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
