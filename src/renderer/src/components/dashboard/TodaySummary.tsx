import { useMemo } from 'react'
import { CardContent, CardTitle } from '../ui/card'
import { CheckCircle2, Circle, TrendingUp } from 'lucide-react'
import { useTodos } from '../../hooks/useTodos'

export function TodaySummary() {
  const { todos } = useTodos()

  const todayStats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayTodos = todos.filter(todo => {
      const todoDate = new Date(todo.date)
      todoDate.setHours(0, 0, 0, 0)
      return todoDate.getTime() === today.getTime()
    })

    const completed = todayTodos.filter(todo => todo.completed).length
    const total = todayTodos.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return { completed, total, percentage }
  }, [todos])

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
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <TrendingUp className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </div>
        <CardTitle className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
          오늘의 할 일
        </CardTitle>
      </div>

      {/* Content */}
      <CardContent className="p-0 space-y-5">
        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-700">
                <CheckCircle2 className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </div>
              <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tabular-nums">
                {todayStats.completed}
              </span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">완료</span>
            </div>
            <div className="w-px h-10 bg-slate-300/50 dark:bg-slate-600/50" />
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                <Circle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tabular-nums">
                {todayStats.total - todayStats.completed}
              </span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">남음</span>
            </div>
          </div>

          {/* Percentage Circle */}
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90 drop-shadow-sm">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="7"
                fill="none"
                className="text-gray-200/50 dark:text-gray-700/50"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="url(#gradient)"
                strokeWidth="7"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - todayStats.percentage / 100)}`}
                className="transition-all duration-700 ease-out"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgb(71 85 105)" />
                  <stop offset="100%" stopColor="rgb(51 65 85)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-extrabold text-gray-900 dark:text-gray-50 tabular-nums">
                {todayStats.percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="relative w-full h-3 bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
            <div
              className="absolute inset-0 bg-gradient-to-r from-slate-500 via-slate-600 to-slate-700 dark:from-slate-400 dark:via-slate-500 dark:to-slate-600 transition-all duration-700 ease-out rounded-full shadow-lg"
              style={{ width: `${todayStats.percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center leading-relaxed">
            {todayStats.total === 0
              ? '💡 오늘 할 일을 추가해보세요!'
              : todayStats.completed === todayStats.total
              ? '🎉 오늘 할 일을 모두 완료했어요!'
              : `${todayStats.total}개 중 ${todayStats.completed}개 완료`}
          </p>
        </div>
      </CardContent>
    </div>
  )
}
