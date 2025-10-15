import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Checkbox } from '../components/ui/checkbox'
import { Badge } from '../components/ui/badge'
import { Plus, Trash2, Calendar as CalendarIcon, List, CodeXml, Send, BadgeCheck, CheckCheck, Pencil, AlertCircle } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
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
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [draggedSchedule, setDraggedSchedule] = useState<number | null>(null)
  const [sortByLatest, setSortByLatest] = useState(false)

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

  const addOrUpdateSchedule = async (schedule: { text: string; category?: string; dueDate?: Date; clientName?: string; webData?: boolean }) => {
    if (window.electron) {
      if (editingSchedule) {
        // Update existing schedule
        await window.electron.ipcRenderer.invoke('schedules:update', editingSchedule.id, {
          text: schedule.text,
          category: schedule.category,
          dueDate: schedule.dueDate?.toISOString(),
          clientName: schedule.clientName,
          webData: schedule.webData
        })
        setEditingSchedule(null)
      } else {
        // Create new schedule
        await window.electron.ipcRenderer.invoke('schedules:create', {
          text: schedule.text,
          completed: false,
          category: schedule.category,
          dueDate: schedule.dueDate?.toISOString(),
          clientName: schedule.clientName,
          webData: schedule.webData
        })
      }
      await loadSchedules()
    }
  }

  const startEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setShowAddDialog(true)
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

  const handleDragStart = (e: React.DragEvent, scheduleId: number) => {
    setDraggedSchedule(scheduleId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetScheduleId: number) => {
    e.preventDefault()

    if (!draggedSchedule || draggedSchedule === targetScheduleId) {
      setDraggedSchedule(null)
      return
    }

    const draggedIndex = schedules.findIndex(s => s.id === draggedSchedule)
    const targetIndex = schedules.findIndex(s => s.id === targetScheduleId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedSchedule(null)
      return
    }

    const newSchedules = [...schedules]
    const [removed] = newSchedules.splice(draggedIndex, 1)
    newSchedules.splice(targetIndex, 0, removed)

    setSchedules(newSchedules)
    setDraggedSchedule(null)
  }

  const handleDragEnd = () => {
    setDraggedSchedule(null)
  }

  const getDDayStatus = (dueDate?: string) => {
    if (!dueDate) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)

    const diff = differenceInDays(due, today)

    if (diff === 0) return 'dday'
    if (diff === 1) return 'tomorrow'
    return 'normal'
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'develop': return 'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary border border-primary/30'
      case 'reflect': return 'bg-accent/20 text-accent-foreground dark:bg-accent/30 dark:text-accent-foreground border border-accent/30'
      case 'inspection': return 'bg-secondary/30 text-secondary-foreground dark:bg-secondary/40 dark:text-secondary-foreground border border-secondary/40'
      case 'ex': return 'bg-muted/50 text-muted-foreground dark:bg-muted dark:text-foreground border border-border'
      default: return 'bg-muted/50 text-muted-foreground dark:bg-muted dark:text-foreground border border-border'
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

  let filteredSchedules = selectedCategory
    ? schedules.filter(schedule => schedule.category === selectedCategory)
    : schedules

  // Sort by deadline (dueDate) if enabled
  if (sortByLatest) {
    filteredSchedules = [...filteredSchedules].sort((a, b) => {
      // Sort by dueDate - items without dueDate go to the end
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1

      const dateA = new Date(a.dueDate).getTime()
      const dateB = new Date(b.dueDate).getTime()
      return dateA - dateB // Earliest deadline first
    })
  }

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
              <Badge
                variant="secondary"
                className={`text-sm font-medium cursor-pointer transition-all duration-200 ${sortByLatest ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                onClick={() => setSortByLatest(!sortByLatest)}
              >
                Latest
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
            {filteredSchedules.map((schedule) => {
              const ddayStatus = getDDayStatus(schedule.dueDate)
              return (
                <Card
                  key={schedule.id}
                  draggable={!sortByLatest}
                  onDragStart={(e) => handleDragStart(e, schedule.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, schedule.id)}
                  onDragEnd={handleDragEnd}
                  className={`border border-border bg-card/70 backdrop-blur-sm hover:shadow-md transition-all duration-300 ${!sortByLatest ? 'cursor-move' : ''} ${
                    deletingSchedules.has(schedule.id)
                      ? 'transform -translate-x-full opacity-0'
                      : 'transform translate-x-0 opacity-100'
                  } ${draggedSchedule === schedule.id ? 'opacity-50' : ''}`}
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
                            <Badge variant="outline" className={`text-xs ${(schedule.webData === 1 || schedule.webData === true) ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-400 dark:border-green-700' : 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-400 dark:border-red-700'}`}>
                              {(schedule.webData === 1 || schedule.webData === true) ? 'O' : 'X'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditSchedule(schedule)}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSchedule(schedule.id)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {ddayStatus && (
                        <div className={`relative ${ddayStatus === 'dday' ? 'animate-bounce' : ''}`}>
                          {ddayStatus === 'dday' && (
                            <div className="absolute inset-0 animate-ping">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            </div>
                          )}
                          <AlertCircle
                            className={`w-4 h-4 relative ${
                              ddayStatus === 'dday'
                                ? 'text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]'
                                : ddayStatus === 'tomorrow'
                                ? 'text-orange-500 drop-shadow-[0_0_4px_rgba(249,115,22,0.6)]'
                                : 'text-green-500'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
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

      {/* 일정추가/수정 다이얼로그 */}
      <ScheduleAdd
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open)
          if (!open) setEditingSchedule(null)
        }}
        onAddSchedule={addOrUpdateSchedule}
        editingSchedule={editingSchedule}
      />
    </div>
  )
}
