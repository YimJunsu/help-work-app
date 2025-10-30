import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Checkbox } from '../components/ui/checkbox'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Plus, Trash2, Calendar as CalendarIcon, List as ListIcon, CodeXml, Send, BadgeCheck, CheckCheck, Pencil, AlertCircle, MoreHorizontal, CalendarDays, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, getDay } from 'date-fns'
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showScheduleListDialog, setShowScheduleListDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Load schedules from database on mount
  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    if (window.electron) {
      const loadedSchedules = await window.electron.ipcRenderer.invoke('schedules:getAll')

      // Auto-complete overdue schedules
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (const schedule of loadedSchedules) {
        if (!schedule.completed && schedule.dueDate) {
          const dueDate = new Date(schedule.dueDate)
          dueDate.setHours(0, 0, 0, 0)

          // If due date is in the past, mark as completed
          if (dueDate < today) {
            await window.electron.ipcRenderer.invoke('schedules:update', schedule.id, {
              completed: true
            })
            schedule.completed = true
          }
        }
      }

      // Load saved order from localStorage
      const savedOrder = localStorage.getItem('scheduleOrder')
      if (savedOrder) {
        try {
          const orderArray: number[] = JSON.parse(savedOrder)
          // Sort schedules according to saved order
          const orderedSchedules = [...loadedSchedules].sort((a, b) => {
            const indexA = orderArray.indexOf(a.id)
            const indexB = orderArray.indexOf(b.id)
            // Items not in order array go to the end
            if (indexA === -1 && indexB === -1) return 0
            if (indexA === -1) return 1
            if (indexB === -1) return -1
            return indexA - indexB
          })
          setSchedules(orderedSchedules)
        } catch (e) {
          setSchedules(loadedSchedules)
        }
      } else {
        setSchedules(loadedSchedules)
      }
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

    // Save new order to localStorage
    const orderArray = newSchedules.map(s => s.id)
    localStorage.setItem('scheduleOrder', JSON.stringify(orderArray))

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
    if (category?.startsWith('기타-')) {
      return 'bg-muted/50 text-muted-foreground dark:bg-muted dark:text-foreground border border-border'
    }
    switch (category) {
      case 'develop': return 'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary border border-primary/30'
      case 'reflect': return 'bg-accent/20 text-accent-foreground dark:bg-accent/30 dark:text-accent-foreground border border-accent/30'
      case 'inspection': return 'bg-secondary/30 text-secondary-foreground dark:bg-secondary/40 dark:text-secondary-foreground border border-secondary/40'
      case 'guide': return 'bg-sky-100/50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border border-sky-300/30'
      default: return 'bg-muted/50 text-muted-foreground dark:bg-muted dark:text-foreground border border-border'
    }
  }

  const getCategoryLabel = (category?: string) => {
    if (category?.startsWith('기타-')) {
      return category
    }
    switch (category) {
      case 'develop': return '개발/수정'
      case 'reflect': return '운영 반영'
      case 'inspection': return '서비스 점검'
      case 'guide': return '사용/원인안내'
      default: return category
    }
  }

  const categories = [
    { id: null, name: '전체', icon: ListIcon, count: schedules.length },
    { id: 'develop', name: '개발/수정', icon: CodeXml, count: schedules.filter(s => s.category === 'develop').length },
    { id: 'reflect', name: '운영 반영', icon: Send, count: schedules.filter(s => s.category === 'reflect').length },
    { id: 'inspection', name: '서비스 점검', icon: BadgeCheck, count: schedules.filter(s => s.category === 'inspection').length },
    { id: 'guide', name: '사용/원인안내', icon: Info, count: schedules.filter(s => s.category === 'guide').length },
    { id: 'ex', name: '기타', icon: MoreHorizontal, count: schedules.filter(s => s.category?.startsWith('기타-')).length }
  ]

  const getCategoryBadgeColor = (categoryId: string | null, isSelected: boolean) => {
    if (isSelected) {
      switch (categoryId) {
        case 'develop': return 'bg-blue-200 text-blue-800 hover:bg-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700'
        case 'reflect': return 'bg-green-200 text-green-800 hover:bg-green-300 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700'
        case 'inspection': return 'bg-purple-200 text-purple-800 hover:bg-purple-300 dark:bg-purple-800 dark:text-purple-100 dark:hover:bg-purple-700'
        case 'guide': return 'bg-sky-200 text-sky-800 hover:bg-sky-300 dark:bg-sky-800 dark:text-sky-100 dark:hover:bg-sky-700'
        case 'ex': return 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300 dark:bg-yellow-800 dark:text-yellow-100 dark:hover:bg-yellow-700'
        default: return 'bg-foreground text-background hover:bg-foreground/90'
      }
    } else {
      switch (categoryId) {
        case 'develop': return 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60'
        case 'reflect': return 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/60'
        case 'inspection': return 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-900/60'
        case 'guide': return 'bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:hover:bg-sky-900/60'
        case 'ex': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:hover:bg-yellow-900/60'
        default: return 'bg-muted text-muted-foreground hover:bg-muted/80'
      }
    }
  }

  let filteredSchedules = selectedCategory
    ? selectedCategory === 'ex'
      ? schedules.filter(schedule => schedule.category?.startsWith('기타-'))
      : schedules.filter(schedule => schedule.category === selectedCategory)
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

  // Calendar view helpers
  const getSchedulesForDate = (date: Date) => {
    return filteredSchedules.filter(schedule => {
      if (!schedule.dueDate) return false
      const scheduleDate = new Date(schedule.dueDate)
      return isSameDay(scheduleDate, date)
    })
  }

  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }

  const getCalendarItemColor = (category?: string) => {
    if (category?.startsWith('기타-')) {
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
    }
    switch (category) {
      case 'develop':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
      case 'reflect':
        return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
      case 'inspection':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
      case 'guide':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300'
    }
  }

  const calendarDays = generateCalendarDays()

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
              <Button
                onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                variant="ghost"
                size="sm"
                className={`transition-all duration-200 ${viewMode === 'calendar' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
                title={viewMode === 'list' ? '달력 보기' : '리스트 보기'}
              >
                {viewMode === 'list' ? <CalendarDays className="w-4 h-4" /> : <ListIcon className="w-4 h-4" />}
              </Button>
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
          {viewMode === 'list' ? (
            // List View
            <>
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
                  <ListIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">{selectedCategory ? '해당 카테고리에 일정이 없습니다' : '일정이 없습니다'}</p>
                  <p className="text-sm">새로운 일정을 추가해보세요</p>
                </div>
              )}
            </>
          ) : (
            // Calendar View
            <div className="space-y-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-lg font-bold">
                  {format(currentMonth, 'yyyy년 M월', { locale: ko })}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Weekday Headers */}
                {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                  <div
                    key={day}
                    className={`text-center text-sm font-bold py-2 ${
                      i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground'
                    }`}
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {calendarDays.map((day) => {
                  const daySchedules = getSchedulesForDate(day)
                  const isToday = isSameDay(day, new Date())
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const dayOfWeek = getDay(day)

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[100px] border border-border rounded-lg p-1 ${
                        isCurrentMonth ? 'bg-card' : 'bg-muted/30'
                      } ${isToday ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div
                        className={`text-xs font-semibold mb-1 ${
                          dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-muted-foreground'
                        } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                      >
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {daySchedules.slice(0, 2).map((schedule) => (
                          <div
                            key={schedule.id}
                            className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-all truncate relative group ${
                              schedule.completed
                                ? 'bg-muted text-muted-foreground line-through'
                                : getCalendarItemColor(schedule.category)
                            }`}
                            title={`${schedule.clientName ? `[${schedule.clientName}] ` : ''}${schedule.text}`}
                          >
                            <div
                              onClick={() => startEditSchedule(schedule)}
                              className="pr-5"
                            >
                              {schedule.clientName ? `${schedule.clientName.substring(0, 8)}...` : schedule.text.substring(0, 10)}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteSchedule(schedule.id)
                              }}
                              className="absolute right-0.5 top-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {daySchedules.length > 2 && (
                          <div
                            className="text-xs text-primary font-semibold text-center cursor-pointer hover:bg-primary/10 rounded py-0.5 transition-colors"
                            onClick={() => {
                              setSelectedDate(day)
                              setShowScheduleListDialog(true)
                            }}
                          >
                            +{daySchedules.length - 2}개
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
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

      {/* 날짜별 스케줄 목록 다이얼로그 */}
      <Dialog open={showScheduleListDialog} onOpenChange={setShowScheduleListDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {selectedDate && format(selectedDate, 'yyyy년 M월 d일', { locale: ko })} 일정
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {selectedDate && getSchedulesForDate(selectedDate).map((schedule) => (
              <Card
                key={schedule.id}
                className={`border border-border transition-all duration-200 hover:shadow-md ${
                  schedule.completed ? 'bg-muted/50' : 'bg-card'
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={Boolean(schedule.completed)}
                      onCheckedChange={() => toggleSchedule(schedule.id)}
                      className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium ${
                          schedule.completed
                            ? 'line-through text-muted-foreground'
                            : 'text-card-foreground'
                        }`}
                      >
                        {schedule.clientName && (
                          <>
                            <span className="font-bold">{schedule.clientName}</span>
                            <span> - {schedule.text}</span>
                          </>
                        )}
                        {!schedule.clientName && schedule.text}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {schedule.category && (
                          <Badge variant="secondary" className={`text-xs ${getCategoryColor(schedule.category)}`}>
                            {getCategoryLabel(schedule.category)}
                          </Badge>
                        )}
                        {schedule.category === 'reflect' && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              schedule.webData === 1 || schedule.webData === true
                                ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-400 dark:border-green-700'
                                : 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-400 dark:border-red-700'
                            }`}
                          >
                            {schedule.webData === 1 || schedule.webData === true ? 'O' : 'X'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          startEditSchedule(schedule)
                          setShowScheduleListDialog(false)
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSchedule(schedule.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}