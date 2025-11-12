import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
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
  const getUpcomingSchedules = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return schedules
      .filter(schedule => schedule.dueDate && !schedule.completed)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 2)
  }

  const upcomingSchedules = getUpcomingSchedules()

  return (
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
  )
}