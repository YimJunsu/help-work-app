import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Checkbox } from '../components/ui/checkbox'
import { Badge } from '../components/ui/badge'
import { Plus, Trash2, Calendar as CalendarIcon, List, CodeXml, Send, BadgeCheck, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ScheduleAdd } from './ScheduleAdd'

interface Schedule {
  id: number
  text: string
  completed: number | boolean
  category?: string
  dueDate?: string
  clientName?: string
  webData?: number | boolean
  createdAt?: string
  updatedAt?: string
}

interface ScheduleProps {
  onDialogChange?: (isOpen: boolean) => void
}

export function ScheduleCheck({ onDialogChange }: ScheduleProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [deletingSchedules, setDeletingSchedules] = useState<Set<number>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Load schedules from database on mount
  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    if (window.electron) {
      const schedules = await window.electron.ipcRenderer.invoke('schedules:getAll')
      setSchedules(schedules)
    }
  }

  useEffect(() => {
    onDialogChange?.(showAddDialog)
  }, [showAddDialog, onDialogChange])

  const addSchedule = async (schedule: { text: string; category?: string; dueDate?: Date; clientName?: string; webData?: boolean }) => {
    if (window.electron) {
      await window.electron.ipcRenderer.invoke('schedules:create', {
        text: schedule.text,
        completed: false,
        category: schedule.category,
        dueDate: schedule.dueDate?.toISOString(),
        clientName: schedule.clientName,
        webData: schedule.webData
      })
      await loadSchedules()
    }
  }

  const toggleSchedule = async (id: number) => {
    const schedule = schedules.find(s => s.id === id)
    if (schedule && window.electron) {
      await window.electron.ipcRenderer.invoke('schedules:update', id, {
        completed: !schedule.completed
      })
      await loadSchedules()
    }
  }

  const deleteSchedule = (id: number) => {
    setDeletingSchedules(prev => new Set([...prev, id]))
    setTimeout(async () => {
      if (window.electron) {
        await window.electron.ipcRenderer.invoke('schedules:delete', id)
        await loadSchedules()
      }
      setDeletingSchedules(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }, 300)
  }

  const clearCompletedSchedules = () => {
    const completedIds = schedules.filter(schedule => schedule.completed).map(schedule => schedule.id)
    setDeletingSchedules(new Set(completedIds))
    setTimeout(async () => {
      if (window.electron) {
        await window.electron.ipcRenderer.invoke('schedules:deleteCompleted')
        await loadSchedules()
      }
      setDeletingSchedules(new Set())
    }, 300)
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'develop': return 'bg-gray-100 text-primary'
      case 'reflect': return 'bg-gray-100 text-accent-foreground'
      case 'inspection': return 'bg-gray-100 text-secondary-foreground'
      case 'ex': return 'bg-gray-100 text-muted-foreground'
      default: return 'bg-gray-100 text-muted-foreground'
    }
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

  const categories = [
    { id: null, name: '전체', icon: List, count: schedules.length },
    { id: 'develop', name: '개발/수정', icon: CodeXml, count: schedules.filter(s => s.category === 'develop').length },
    { id: 'reflect', name: '운영 반영', icon: Send, count: schedules.filter(s => s.category === 'reflect').length },
    { id: 'inspection', name: '서비스 점검', icon: BadgeCheck, count: schedules.filter(s => s.category === 'inspection').length }
  ]

  const getCategoryBadgeColor = (categoryId: string | null, isSelected: boolean) => {
    if (isSelected) {
      switch (categoryId) {
        case 'develop': return 'bg-primary text-primary-foreground hover:bg-primary/90'
        case 'reflect': return 'bg-accent text-accent-foreground hover:bg-accent/90'
        case 'inspection': return 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
        default: return 'bg-foreground text-background hover:bg-foreground/90'
      }
    } else {
      switch (categoryId) {
        case 'develop': return 'bg-primary/10 text-primary hover:bg-primary/20'
        case 'reflect': return 'bg-accent/10 text-accent-foreground hover:bg-accent/20'
        case 'inspection': return 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        default: return 'bg-muted text-muted-foreground hover:bg-muted/80'
      }
    }
  }

  const filteredSchedules = selectedCategory
    ? schedules.filter(schedule => schedule.category === selectedCategory)
    : schedules

  const completedCount = filteredSchedules.filter(schedule => schedule.completed).length
  const totalCount = filteredSchedules.length

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between min-h-[60px]">
            <div className="flex flex-col justify-center">
              <CardTitle className="text-2xl font-bold text-card-foreground leading-tight">Work Schedule Check</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">업무 스케줄 확인</p>
            </div>
            <div className="flex items-center gap-2 h-full">
              <Badge variant="secondary" className="text-sm font-medium">
                {completedCount}/{totalCount} 완료
              </Badge>
              {completedCount > 0 && (
                <Button
                  onClick={clearCompletedSchedules}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="완료된 할 일 삭제"
                >
                  <CheckCheck className="w-4 h-4" />
                </Button>
              )}
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-primary border border-border" />
                <div className="w-3 h-3 rounded-full bg-secondary border border-border" />
                <div className="w-3 h-3 rounded-full bg-accent border border-border" />
              </div>
              <Button onClick={() => setShowAddDialog(true)} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-md transition-all duration-200">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon
              const isSelected = selectedCategory === category.id
              return (
                <Badge
                  key={category.id}
                  className={`cursor-pointer px-3 py-1.5 text-sm font-medium transition-all duration-200 border-0 ${getCategoryBadgeColor(category.id, isSelected)}`}
                  onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                >
                  <Icon className="w-3 h-3 mr-1.5" />
                  {category.name}
                  <span className="ml-1.5 text-xs opacity-75">{category.count}</span>
                </Badge>
              )
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            {filteredSchedules.map((schedule) => (
              <Card
                key={schedule.id}
                className={`border border-border bg-card/70 backdrop-blur-sm hover:shadow-md transition-all duration-300 ${
                  deletingSchedules.has(schedule.id)
                    ? 'transform -translate-x-full opacity-0'
                    : 'transform translate-x-0 opacity-100'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={Boolean(schedule.completed)}
                      onCheckedChange={() => toggleSchedule(schedule.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm transition-all duration-200 ${schedule.completed ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
                        {schedule.clientName && (
                          <>
                            <span className="font-bold">{schedule.clientName}</span>
                            <span className="font-medium"> - {schedule.text}</span>
                          </>
                        )}
                        {!schedule.clientName && (
                          <span className="font-medium">{schedule.text}</span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {schedule.category && (
                          <Badge variant="secondary" className={`text-xs ${getCategoryColor(schedule.category)}`}>
                            {getCategoryLabel(schedule.category)}
                          </Badge>
                        )}
                        {schedule.dueDate && (
                          <Badge variant="outline" className="text-xs bg-accent/10 text-accent-foreground border-border">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {format(new Date(schedule.dueDate), "MM/dd", { locale: ko })}
                          </Badge>
                        )}
                        {schedule.category === 'reflect' && (
                          <Badge variant="outline" className={`text-xs ${(schedule.webData === 1 || schedule.webData === true) ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                            {(schedule.webData === 1 || schedule.webData === true) ? 'O' : 'X'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSchedule(schedule.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSchedules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <List className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">{selectedCategory ? '해당 카테고리에 일정이 없습니다' : '일정이 없습니다'}</p>
              <p className="text-sm">새로운 일정을 추가해보세요</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 일정추가 다이얼로그 */}
      <ScheduleAdd
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAddSchedule={addSchedule}
      />
    </div>
  )
}
