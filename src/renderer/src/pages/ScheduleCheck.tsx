import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Checkbox } from '../components/ui/checkbox'
import { Plus, CheckCheck, CalendarDays, List as ListIcon, Calendar as CalendarIcon, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ScheduleAdd } from './ScheduleAdd'
import { CategoryBadges, ScheduleListView, ScheduleCalendarView } from '../components/schedule'
import { useScheduleManagement } from '../hooks/useScheduleManagement'
import { useDragAndDrop } from '../hooks/useDragAndDrop'
import { useDeleteAnimation } from '../hooks/useDeleteAnimation'
import { useDateChangeDetection } from '../hooks/useDateChangeDetection'
import { getCategoryColor, getCategoryLabel } from '../utils/scheduleUtils'
import { getSchedulesForDate } from '../utils/calendarUtils'
import type { Schedule } from '../hooks/useSchedules'

interface ScheduleProps {
  onDialogChange?: (isOpen: boolean) => void
}

export function ScheduleCheck({ onDialogChange }: ScheduleProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [sortByLatest, setSortByLatest] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showScheduleListDialog, setShowScheduleListDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const {
    schedules,
    loadSchedules,
    addOrUpdateSchedule,
    toggleSchedule,
    deleteSchedule,
    clearCompletedSchedules,
    reorderSchedules
  } = useScheduleManagement()

  const { draggedItem, handleDragStart, handleDragOver, handleDrop, handleDragEnd } = useDragAndDrop<number>()
  const { deletingItems, deleteWithAnimation, deleteMultipleWithAnimation } = useDeleteAnimation<number>()

  // Auto-refresh when date changes (midnight detection)
  useDateChangeDetection(() => {
    loadSchedules()
  })

  useEffect(() => {
    onDialogChange?.(showAddDialog)
  }, [showAddDialog, onDialogChange])

  const handleAddOrUpdateSchedule = async (schedule: { text: string; category?: string; dueDate?: Date; clientName?: string; webData?: boolean }) => {
    await addOrUpdateSchedule(schedule, editingSchedule)
    setEditingSchedule(null)
  }

  const startEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setShowAddDialog(true)
  }

  const handleDeleteSchedule = (id: number) => {
    deleteWithAnimation(id, deleteSchedule)
  }

  const handleClearCompleted = () => {
    const completedIds = schedules.filter(schedule => schedule.completed).map(schedule => schedule.id)
    deleteMultipleWithAnimation(completedIds, clearCompletedSchedules)
  }

  // Filter schedules by category
  let filteredSchedules = selectedCategory
    ? selectedCategory === 'ex'
      ? schedules.filter(schedule => schedule.category?.startsWith('기타-'))
      : schedules.filter(schedule => schedule.category === selectedCategory)
    : schedules

  // Sort by deadline if enabled
  if (sortByLatest) {
    filteredSchedules = [...filteredSchedules].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
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
                  onClick={handleClearCompleted}
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

          <CategoryBadges
            schedules={schedules}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </CardHeader>

        <CardContent className="space-y-4">
          {viewMode === 'list' ? (
            <ScheduleListView
              schedules={filteredSchedules}
              deletingSchedules={deletingItems}
              draggedSchedule={draggedItem}
              sortByLatest={sortByLatest}
              selectedCategory={selectedCategory}
              onToggle={toggleSchedule}
              onEdit={startEditSchedule}
              onDelete={handleDeleteSchedule}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={(e, id) => handleDrop(e, id, reorderSchedules)}
              onDragEnd={handleDragEnd}
            />
          ) : (
            <ScheduleCalendarView
              schedules={filteredSchedules}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onScheduleClick={startEditSchedule}
              onScheduleDelete={handleDeleteSchedule}
              onDateClick={(date) => {
                setSelectedDate(date)
                setShowScheduleListDialog(true)
              }}
            />
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
        onAddSchedule={handleAddOrUpdateSchedule}
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
            {selectedDate && getSchedulesForDate(filteredSchedules, selectedDate).map((schedule) => (
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
                        onClick={() => handleDeleteSchedule(schedule.id)}
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