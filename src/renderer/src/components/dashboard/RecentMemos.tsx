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
            <FileText className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </div>
          <CardTitle className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
            최근 메모
          </CardTitle>
        </div>

        <button
          onClick={() => onNavigate?.('memo')}
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
        {recentMemos.length === 0 ? (
          <div className="text-center py-10">
            <div
              onClick={() => onNavigate?.('memo')}
              className="
                inline-flex flex-col items-center gap-4 p-6 rounded-3xl
                bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl
                border-2 border-dashed border-slate-300/40 dark:border-slate-700/30
                cursor-pointer hover:border-slate-400/60 dark:hover:border-slate-600/50
                hover:bg-white/70 dark:hover:bg-slate-800/70
                active:scale-95 transition-all duration-200
              "
            >
              <div className="relative">
                <div className="absolute inset-0 bg-slate-500/5 blur-xl rounded-full" />
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-slate-100/50 to-slate-200/30 dark:from-slate-800/50 dark:to-slate-700/30 border border-slate-200/50 dark:border-slate-700/50">
                  <Plus className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                첫 메모를 작성해보세요!
              </p>
            </div>
          </div>
        ) : (
          recentMemos.map((memo, index) => (
            <div
              key={memo.id}
              onClick={() => onNavigate?.('memo')}
              className="
                group/memo p-4 rounded-[20px]
                bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl
                border border-white/40 dark:border-slate-700/30
                shadow-sm hover:shadow-lg hover:scale-[1.02]
                hover:bg-white/80 dark:hover:bg-slate-800/80
                transition-all duration-200 cursor-pointer active:scale-[0.98]
              "
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 group-hover/memo:bg-slate-300 dark:group-hover/memo:bg-slate-600 transition-colors">
                  <FileText className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2 mb-2 leading-relaxed">
                    {truncateText(memo.content)}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-slate-400/60" />
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {format(new Date(memo.updatedAt), 'MM/dd HH:mm', { locale: ko })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </div>
  )
}