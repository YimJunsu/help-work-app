import { Card, CardContent } from '../components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import { useDateChangeDetection } from '../hooks/useDateChangeDetection'
import { useSchedules } from '../hooks/useSchedules'
import { useTodoStats } from '../hooks/useTodoStats'
import { useUserInfo } from '../hooks/useUserInfo'
import { getGreetingMessage } from '../utils/greetingUtils'
import { WelcomeHeader, TodoStatsChart, UpcomingSchedules } from '../components/dashboard'

interface DashboardProps {
  onNavigate?: (page: 'dashboard' | 'todo' | 'ScheduleCheck' | 'memo' | 'minigame' | 'animalrace') => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { schedules, loadSchedules } = useSchedules()
  const { todoStats } = useTodoStats()
  const { userName, userBirthday } = useUserInfo()

  // Auto-refresh when date changes (midnight detection)
  useDateChangeDetection(() => {
    loadSchedules() // Reload schedules to update D-day status
  })

  const greeting = getGreetingMessage(userName, userBirthday)

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        <CardContent className="p-6 space-y-6">

          {/* 웰컴 헤더 */}
          <WelcomeHeader greeting={greeting} />

          {/* 메인 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 투두 달성 차트 - 2열 차지 */}
            <TodoStatsChart todoStats={todoStats} />

            {/* 일정 카드 - 1열 차지 */}
            <UpcomingSchedules schedules={schedules} onNavigate={onNavigate} />
          </div>

          {/* 하단 플레이스홀더 */}
          <Card className="border border-dashed border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/5 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-primary/40" />
                </div>
                <p className="text-lg font-semibold text-muted-foreground/80">추후 추가 예정</p>
                <p className="text-sm mt-2 text-muted-foreground/60">더 많은 기능이 곧 추가됩니다!</p>
              </div>
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
  )
}