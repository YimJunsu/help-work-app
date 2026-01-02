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
        w-full rounded-3xl p-4
        bg-gradient-to-b from-white/40 to-white/20
        dark:from-slate-800/40 dark:to-slate-900/20
        backdrop-blur-2xl border border-white/20 shadow-lg
      "
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-xl bg-green-500/20 backdrop-blur-md">
          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-300" />
        </div>
        <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-200">
          오늘의 할 일
        </CardTitle>
      </div>

      {/* Content */}
      <CardContent className="p-0 space-y-4">
        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {todayStats.completed}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">완료</span>
            </div>
            <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
            <div className="flex items-center gap-2">
              <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {todayStats.total - todayStats.completed}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">남음</span>
            </div>
          </div>

          {/* Percentage Circle */}
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - todayStats.percentage / 100)}`}
                className="text-green-500 dark:text-green-400 transition-all duration-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                {todayStats.percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-out"
              style={{ width: `${todayStats.percentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {todayStats.total === 0
              ? '오늘 할 일을 추가해보세요!'
              : todayStats.completed === todayStats.total
              ? '🎉 오늘 할 일을 모두 완료했어요!'
              : `${todayStats.total}개 중 ${todayStats.completed}개 완료`}
          </p>
        </div>
      </CardContent>
    </div>
  )
}
