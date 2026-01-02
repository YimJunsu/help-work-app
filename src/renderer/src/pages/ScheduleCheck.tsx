import { useState, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Checkbox } from '../components/ui/checkbox'
import { CheckCheck, Calendar as CalendarIcon, Pencil, Trash2 } from 'lucide-react'
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
  onStatsChange?: (stats: { completed: number; total: number }) => void
}

export const ScheduleCheck = forwardRef<{ openAddDialog: () => void; toggleViewMode: () => void }, ScheduleProps>(function ScheduleCheck({ onDialogChange, onStatsChange }, ref) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "calendar">(() => "list")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showScheduleListDialog, setShowScheduleListDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [initialScheduleDate, setInitialScheduleDate] = useState<Date | null>(null)

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

  useDateChangeDetection(() => {
    loadSchedules()
  })

  useEffect(() => {
    onDialogChange?.(showAddDialog)
  }, [showAddDialog, onDialogChange])

  const handleAddOrUpdateSchedule = useCallback(async (schedule: { text: string; category?: string; dueDate?: Date; clientName?: string; requestNumber?: string; webData?: boolean }) => {
    await addOrUpdateSchedule(schedule, editingSchedule)
    setEditingSchedule(null)
  }, [addOrUpdateSchedule, editingSchedule])

  const startEditSchedule = useCallback((schedule: Schedule) => {
    setEditingSchedule(schedule)
    setShowAddDialog(true)
  }, [])

  const handleDeleteSchedule = useCallback((id: number) => {
    deleteWithAnimation(id, deleteSchedule)
  }, [deleteWithAnimation, deleteSchedule])

  const handleClearCompleted = useCallback(() => {
    const completedIds = schedules.filter(schedule => schedule.completed).map(schedule => schedule.id)
    deleteMultipleWithAnimation(completedIds, clearCompletedSchedules)
  }, [schedules, deleteMultipleWithAnimation, clearCompletedSchedules])

  const filteredSchedules = useMemo(() => {
    let filtered = selectedCategory
      ? selectedCategory === 'ex'
        ? schedules.filter(schedule => schedule.category?.startsWith('기타-'))
        : schedules.filter(schedule => schedule.category === selectedCategory)
      : schedules

    // 기본적으로 날짜 순으로 정렬
    return [...filtered].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
  }, [schedules, selectedCategory])

  const completedCount = useMemo(() => filteredSchedules.filter(schedule => schedule.completed).length, [filteredSchedules])
  const totalCount = useMemo(() => filteredSchedules.length, [filteredSchedules])

  // Notify parent when stats change
  useEffect(() => {
    onStatsChange?.({ completed: completedCount, total: totalCount })
  }, [completedCount, totalCount, onStatsChange])

  // Expose openAddDialog and toggleViewMode to parent
  useImperativeHandle(ref, () => ({
    openAddDialog: () => setShowAddDialog(true),
    toggleViewMode: () => setViewMode(prev => prev === 'list' ? 'calendar' : 'list')
  }))

  // Narrowing 방지: viewMode를 JSX 비교문 위에서 따로 변수 선언
  const mode = viewMode

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        <CardHeader className={mode === 'calendar' ? 'pb-2 pt-2' : 'pb-2 pt-0'}>
          {mode === 'list' ? (
            // 리스트 모드
            <div className="flex items-center justify-between gap-2">
              <CategoryBadges
                schedules={schedules}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                viewMode={mode}
              />
              {completedCount > 0 && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    onClick={handleClearCompleted}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // 달력 모드
            <div className="flex items-center justify-between gap-2">
              <CategoryBadges
                schedules={schedules}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                viewMode={mode}
              />
              {completedCount > 0 && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    onClick={handleClearCompleted}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-6 w-6 p-0"
                  >
                    <CheckCheck className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        {/* 여기서도 mode로 비교 */}
        <CardContent className={mode === 'calendar' ? 'space-y-2 pt-2' : 'space-y-4 pt-2'}>
          {mode === 'list' ? (
            <ScheduleListView
              schedules={filteredSchedules}
              deletingSchedules={deletingItems}
              draggedSchedule={draggedItem}
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
              onEmptyDateClick={(date) => {
                setInitialScheduleDate(date)
                setShowAddDialog(true)
              }}
            />
          )}
        </CardContent>
      </Card>

      <ScheduleAdd
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open)
          if (!open) {
            setEditingSchedule(null)
            setInitialScheduleDate(null)
          }
        }}
        onAddSchedule={handleAddOrUpdateSchedule}
        editingSchedule={editingSchedule}
        initialDate={initialScheduleDate}
      />

      <Dialog open={showScheduleListDialog} onOpenChange={setShowScheduleListDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                {selectedDate && format(selectedDate, 'yyyy년 M월 d일', { locale: ko })} 일정
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setInitialScheduleDate(selectedDate)
                  setShowScheduleListDialog(false)
                  setShowAddDialog(true)
                }}
                className="h-8"
              >
                + 추가
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 mt-4">
            {selectedDate &&
              getSchedulesForDate(filteredSchedules, selectedDate).map((schedule) => (
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
                            schedule.completed ? 'line-through text-muted-foreground' : 'text-card-foreground'
                          }`}
                        >
                          {schedule.clientName ? (
                            <>
                              <span className="font-bold">{schedule.clientName}</span>
                              <span> - {schedule.text}</span>
                            </>
                          ) : (
                            schedule.text
                          )}
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
})
