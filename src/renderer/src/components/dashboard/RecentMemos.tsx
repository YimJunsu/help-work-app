import { useMemo } from 'react'
import { CardContent, CardTitle } from '../ui/card'
import { FileText, ArrowRight, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useMemos } from '../../hooks/useMemos'

interface RecentMemosProps {
  onNavigate?: (page: 'dashboard' | 'todo' | 'ScheduleCheck' | 'memo' | 'fetch' | 'minigame' | 'userinfo' | 'unisupport') => void
}

export function RecentMemos({ onNavigate }: RecentMemosProps) {
  const { memos } = useMemos()

  const recentMemos = useMemo(() => {
    return [...memos]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
  }, [memos])

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

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
          <div className="p-2 rounded-xl bg-amber-500/20 backdrop-blur-md">
            <FileText className="w-5 h-5 text-amber-600 dark:text-amber-300" />
          </div>
          <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-200">
            최근 메모
          </CardTitle>
        </div>

        <button
          onClick={() => onNavigate?.('memo')}
          className="flex items-center text-sm text-amber-600 dark:text-amber-300 hover:opacity-70 transition"
        >
          더보기
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Content */}
      <CardContent className="p-0 space-y-2">
        {recentMemos.length === 0 ? (
          <div className="text-center py-8">
            <div
              onClick={() => onNavigate?.('memo')}
              className="
                inline-flex flex-col items-center gap-3 p-4 rounded-2xl
                bg-white/30 dark:bg-slate-800/40 backdrop-blur-xl
                border border-white/20 dark:border-slate-700/20
                cursor-pointer hover:bg-white/40 dark:hover:bg-slate-800/60
                transition-all duration-200
              "
            >
              <div className="p-3 rounded-full bg-amber-500/20">
                <Plus className="w-6 h-6 text-amber-600 dark:text-amber-300" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                첫 메모를 작성해보세요!
              </p>
            </div>
          </div>
        ) : (
          recentMemos.map((memo) => (
            <div
              key={memo.id}
              onClick={() => onNavigate?.('memo')}
              className="
                p-3 rounded-2xl
                bg-white/30 dark:bg-slate-800/40 backdrop-blur-xl
                border border-white/20 dark:border-slate-700/20
                shadow-sm hover:shadow-md hover:bg-white/40 dark:hover:bg-slate-800/60
                transition-all duration-200 cursor-pointer
              "
            >
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-300 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-100 line-clamp-2 mb-1">
                    {truncateText(memo.content)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(memo.updatedAt), 'MM/dd HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </div>
  )
}