import { Card, CardContent } from '../components/ui/card'
import { useDateChangeDetection } from '../hooks/useDateChangeDetection'
import { useSchedules } from '../hooks/useSchedules'
import { useTodoStats } from '../hooks/useTodoStats'
import { UpcomingSchedules } from '../components/dashboard'
import { WeatherWidget } from '../components/dashboard/WeatherWidget'
import { TodaySummary } from '../components/dashboard/TodaySummary'
import { RecentMemos } from '../components/dashboard/RecentMemos'
import { TodoStatsChart } from '../components/dashboard/TodoStatsChart'

interface DashboardProps {
  onNavigate?: (page: 'dashboard' | 'todo' | 'ScheduleCheck' | 'unisupport' | 'memo' | 'fetch' | 'userinfo' | 'minigame') => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { schedules, loadSchedules } = useSchedules()
  const { todoStats } = useTodoStats()

  // Auto-refresh when date changes (midnight detection)
  useDateChangeDetection(() => {
    loadSchedules() // Reload schedules to update D-day status
  })

  return (
    <div className="w-full h-full flex flex-col overflow-auto">
      <Card className="flex-1 border-0 bg-card">
        <CardContent className="p-4 space-y-4">

          {/* 날씨 정보 */}
          <WeatherWidget />

          {/* 다가오는 일정 */}
          <UpcomingSchedules schedules={schedules} onNavigate={onNavigate} />

          {/* 2열 그리드: 오늘의 할일 + 최근 메모 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TodaySummary />
            <RecentMemos onNavigate={onNavigate} />
          </div>

          {/* 할일 통계 차트 */}
          {todoStats.length > 0 && (
            <div className="mt-2">
              <TodoStatsChart todoStats={todoStats} />
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
