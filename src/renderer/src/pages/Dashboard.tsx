import { Card, CardContent } from '../components/ui/card'
import { useDateChangeDetection } from '../hooks/useDateChangeDetection'
import { useSchedules } from '../hooks/useSchedules'
import { useUserInfo } from '../hooks/useUserInfo'
import { getGreetingMessage } from '../utils/greetingUtils'
import { WelcomeHeader, UpcomingSchedules } from '../components/dashboard'
import { WeatherWidget } from '../components/dashboard/WeatherWidget'

interface DashboardProps { onNavigate?: (page: | 'dashboard' | 'todo' | 'ScheduleCheck' | 'memo' | 'minigame' | 'animalrace' | 'fetch' | 'userinfo') => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { schedules, loadSchedules } = useSchedules()
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

          {/* 다가오는 일정 */}
          <UpcomingSchedules schedules={schedules} onNavigate={onNavigate} />

          {/* 날씨 정보 */}
          <WeatherWidget />

        </CardContent>
      </Card>
    </div>
  )
}
