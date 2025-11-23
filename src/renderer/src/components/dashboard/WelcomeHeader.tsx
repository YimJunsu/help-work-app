import { CardContent } from '../ui/card'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { GreetingMessage } from '../../utils/greetingUtils'

interface WelcomeHeaderProps {
  greeting: GreetingMessage
}

export function WelcomeHeader({ greeting }: WelcomeHeaderProps) {
  const isSpecial = greeting.isSpecial

  return (
    <div
      className={`
        w-full rounded-3xl p-3   /* padding 5 → 3 로 감소 */
        backdrop-blur-2xl shadow-lg border
        transition-all
        ${
        isSpecial
          ? 'bg-gradient-to-br from-yellow-300/60 via-orange-300/40 to-pink-300/40 border-white/30 animate-pulse'
          : 'bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20 border-white/20'
      }
      `}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-2">
          <div>
            {/* 메인 인사 */}
            <h2
              className={`
                text-xl font-semibold   /* 2xl → xl 로 약간 축소 */
                ${
                isSpecial
                  ? 'text-yellow-900 dark:text-yellow-200 drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]'
                  : 'text-gray-900 dark:text-gray-100'
              }
              `}
            >
              {greeting.message}
            </h2>

            {/* 날짜 */}
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 opacity-80">
              {format(new Date(), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
            </p>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
