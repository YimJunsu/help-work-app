import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Calendar as CalendarIcon, ArrowRight, CheckCircle2 } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface Schedule {
  id: number
  text: string
  completed: number | boolean
  category?: string
  dueDate?: string
  clientName?: string
  webData?: number | boolean
  createdAt: string
  updatedAt: string
}

interface TodoStats {
  date: string
  count: number
}

interface DashboardProps {
  onNavigate?: (page: 'dashboard' | 'todo' | 'ScheduleCheck' | 'memo' | 'fetch' | 'minigame' | 'userinfo') => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [todoStats, setTodoStats] = useState<TodoStats[]>([])
  const [userName, setUserName] = useState<string | null>(null)
  const [userBirthday, setUserBirthday] = useState<string | null>(null)

  useEffect(() => {
    loadSchedules()
    loadTodoStats()
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    if (window.electron) {
      const userInfo = await window.electron.ipcRenderer.invoke('userInfo:get')
      if (userInfo) {
        setUserName(userInfo.name)
        setUserBirthday(userInfo.birthday)
      }
    }
  }

  const loadSchedules = async () => {
    if (window.electron) {
      const schedules = await window.electron.ipcRenderer.invoke('schedules:getAll')
      setSchedules(schedules)
    }
  }

  const loadTodoStats = async () => {
    if (window.electron) {
      const today = new Date()
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

      const startDate = format(sevenDaysAgo, 'yyyy-MM-dd')
      const endDate = format(today, 'yyyy-MM-dd')

      const stats = await window.electron.ipcRenderer.invoke(
        'todoStats:getByDateRange',
        startDate,
        endDate
      )

      const statsMap = new Map(stats.map((s: any) => [s.date, s.count]))
      const chartData: TodoStats[] = []

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = format(date, 'yyyy-MM-dd')
        chartData.push({
          date: format(date, 'MM/dd'),
          count: (statsMap.get(dateStr) as number) || 0
        })
      }

      setTodoStats(chartData)
    }
  }

  const getUpcomingSchedules = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return schedules
      .filter(schedule => schedule.dueDate && !schedule.completed)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 2)
  }

  const getDDayText = (dueDate?: string) => {
    if (!dueDate) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)

    const diff = differenceInDays(due, today)

    if (diff === 0) return 'D-Day'
    if (diff < 0) return `D+${Math.abs(diff)}`
    return `D-${diff}`
  }

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'develop': return '개발/수정'
      case 'reflect': return '운영 반영'
      case 'inspection': return '서비스 점검'
      case 'ex': return '기타'
      default: return category
    }
  }

  const chartData = {
    labels: todoStats.map(stat => stat.date),
    datasets: [
      {
        label: '완료한 할 일',
        data: todoStats.map(stat => stat.count),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
    },
  }

  const upcomingSchedules = getUpcomingSchedules()

  const getGreetingMessage = () => {
    const hour = new Date().getHours()
    const name = userName || '사용자'

    // 생일 체크
    if (userBirthday) {
      const today = new Date()
      const birthday = new Date(userBirthday)
      if (today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate()) {
        return {
          message: `생일 축하합니다 ${name}님! 🎉`,
          isSpecial: true
        }
      }
    }

    // 시간대별 인사말
    if (hour >= 5 && hour < 12) {
      return {
        message: `좋은 아침입니다 ${name}님! 좋은 하루 되세요 ☀️`,
        isSpecial: false
      }
    } else if (hour >= 12 && hour < 18) {
      return {
        message: `${name}님 반갑습니다! 😊`,
        isSpecial: false
      }
    } else {
      return {
        message: `${name}님 오늘도 고생하셨습니다 🌙`,
        isSpecial: false
      }
    }
  }

  const greeting = getGreetingMessage()

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        <CardContent className="p-6 space-y-6">

          {/* 웰컴 헤더 */}
          <Card className={`border-2 ${greeting.isSpecial ? 'border-primary bg-gradient-to-r from-primary/10 to-primary/5 animate-pulse' : 'border-border/50 bg-gradient-to-r from-card to-card/50'} shadow-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground">
                    {greeting.message}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 메인 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 투두 달성 차트 - 2열 차지 */}
            <Card className="lg:col-span-2 border border-border/50 bg-gradient-to-br from-card to-card/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-card-foreground">
                      일일 할 일 달성 현황
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">최근 7일간의 완료 기록</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* 일정 카드 - 1열 차지 */}
            <Card className="border border-border/50 bg-gradient-to-br from-card to-card/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CalendarIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-card-foreground">
                        다가오는 일정
                      </CardTitle>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate?.('ScheduleCheck')}
                    className="text-xs hover:bg-primary/10 hover:text-primary"
                  >
                    더보기
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingSchedules.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">다가오는 일정이 없습니다</p>
                  </div>
                ) : (
                  upcomingSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="group p-3 rounded-lg border border-border/50 bg-gradient-to-br from-background/50 to-background/30 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {schedule.clientName && (
                              <span className="text-primary">
                                {schedule.clientName} · {' '}
                              </span>
                            )}
                            {schedule.text}
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            {schedule.category && (
                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                                {getCategoryLabel(schedule.category)}
                              </Badge>
                            )}
                            {schedule.dueDate && (
                              <Badge variant="outline" className="text-xs border-muted-foreground/20">
                                {format(new Date(schedule.dueDate), 'MM/dd (EEE)', { locale: ko })}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {schedule.dueDate && (
                          <Badge
                            className={`text-xs font-bold shrink-0 ${
                              getDDayText(schedule.dueDate) === 'D-Day'
                                ? 'bg-red-500 text-white shadow-sm'
                                : getDDayText(schedule.dueDate)?.startsWith('D-')
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-gray-400 dark:bg-gray-600 text-white'
                            }`}
                          >
                            {getDDayText(schedule.dueDate)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
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
