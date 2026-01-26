/**
 * ScheduleCheck Component
 *
 * 일정 관리 페이지
 * - 일정 추가/수정/삭제
 * - 카테고리별 필터링 (개발/수정, 운영 반영, 서비스 점검, 기타)
 * - 리스트/캘린더 뷰 전환
 * - 드래그 앤 드롭으로 순서 변경
 * - D-day 카운트
 *
 * Features:
 * - 리스트 뷰: 날짜순 정렬, 카테고리 필터
 * - 캘린더 뷰: 월별 일정 표시, 날짜 클릭으로 일정 조회/추가
 * - 부드러운 애니메이션 효과
 * - 완료된 일정 일괄 삭제
 */

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
  /* ============================================
     State Management
     ============================================ */

  // 다이얼로그 상태
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showScheduleListDialog, setShowScheduleListDialog] = useState(false)

  // 선택/편집 상태
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [initialScheduleDate, setInitialScheduleDate] = useState<Date | null>(null)

  // 뷰 모드 (리스트/캘린더)
  const [viewMode, setViewMode] = useState<"list" | "calendar">(() => "list")
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // 커스텀 훅
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

  /* ============================================
     Effects
     ============================================ */

  /**
   * 자정 감지 및 자동 새로고침
   * D-day 카운트가 정확하게 업데이트되도록
   */
  useDateChangeDetection(() => {
    loadSchedules()
  })

  /**
   * 다이얼로그 상태 변경 알림 (부모 컴포넌트)
   */
  useEffect(() => {
    onDialogChange?.(showAddDialog)
  }, [showAddDialog, onDialogChange])

  /* ============================================
     Handlers
     ============================================ */

  /**
   * 일정 추가/수정 핸들러
   */
  const handleAddOrUpdateSchedule = useCallback(async (schedule: { text: string; category?: string; dueDate?: Date; clientName?: string; requestNumber?: string; webData?: boolean }) => {
    await addOrUpdateSchedule(schedule, editingSchedule)
    setEditingSchedule(null)
  }, [addOrUpdateSchedule, editingSchedule])

  /**
   * 일정 수정 시작
   */
  const startEditSchedule = useCallback((schedule: Schedule) => {
    setEditingSchedule(schedule)
    setShowAddDialog(true)
  }, [])

  /**
   * 일정 삭제 (애니메이션 포함)
   */
  const handleDeleteSchedule = useCallback((id: number) => {
    deleteWithAnimation(id, deleteSchedule)
  }, [deleteWithAnimation, deleteSchedule])

  /**
   * 완료된 일정 모두 삭제
   */
  const handleClearCompleted = useCallback(() => {
    const completedIds = schedules.filter(schedule => schedule.completed).map(schedule => schedule.id)
    deleteMultipleWithAnimation(completedIds, clearCompletedSchedules)
  }, [schedules, deleteMultipleWithAnimation, clearCompletedSchedules])

  /* ============================================
     Computed Values
     ============================================ */

  /**
   * 카테고리별 필터링된 일정 목록
   * 날짜순으로 정렬
   */
  const filteredSchedules = useMemo(() => {
    let filtered = selectedCategory
      ? selectedCategory === 'ex'
        ? schedules.filter(schedule => schedule.category?.startsWith('기타-'))
        : schedules.filter(schedule => schedule.category === selectedCategory)
      : schedules

    // 날짜순 정렬 (오름차순)
    return [...filtered].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
  }, [schedules, selectedCategory])

  /**
   * 통계 계산 (완료/전체)
   */
  const completedCount = useMemo(() => filteredSchedules.filter(schedule => schedule.completed).length, [filteredSchedules])
  const totalCount = useMemo(() => filteredSchedules.length, [filteredSchedules])

  /**
   * 통계 변경 알림 (부모 컴포넌트)
   */
  useEffect(() => {
    onStatsChange?.({ completed: completedCount, total: totalCount })
  }, [completedCount, totalCount, onStatsChange])

  /**
   * Ref를 통해 부모에서 다이얼로그 열기 & 뷰 모드 전환 기능 노출
   */
  useImperativeHandle(ref, () => ({
    openAddDialog: () => setShowAddDialog(true),
    toggleViewMode: () => setViewMode(prev => prev === 'list' ? 'calendar' : 'list')
  }))

  /* ============================================
     Render
     ============================================ */

  // TypeScript narrowing 방지를 위한 변수 선언
  const mode = viewMode

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        {/* 헤더 - 카테고리 필터 & 액션 버튼 */}
        <CardHeader className={mode === 'calendar' ? 'pb-2 pt-2' : 'pb-2 pt-0'}>
          <div className="flex items-center justify-between gap-2 animate-fade-in">
            {/* 카테고리 필터 뱃지 */}
            <CategoryBadges
              schedules={schedules}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              viewMode={mode}
            />

            {/* 완료 항목 정리 버튼 */}
            {completedCount > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  onClick={handleClearCompleted}
                  variant="ghost"
                  size="sm"
                  className={`
                    text-muted-foreground hover:text-destructive hover:bg-destructive/10
                    transition-all active:scale-95
                    ${mode === 'calendar' ? 'h-6 w-6 p-0' : ''}
                  `}
                  title="완료된 일정 삭제"
                >
                  <CheckCheck className={mode === 'calendar' ? 'w-3 h-3' : 'w-4 h-4'} />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {/* 콘텐츠 - 리스트 or 캘린더 뷰 */}
        <CardContent className={mode === 'calendar' ? 'space-y-2 pt-2' : 'space-y-4 pt-2'}>
          {mode === 'list' ? (
            /* 리스트 뷰 */
            <div className="animate-fade-in">
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
            </div>
          ) : (
            /* 캘린더 뷰 */
            <div className="animate-fade-in">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* 일정 추가/수정 다이얼로그 */}
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

      {/* 날짜별 일정 목록 다이얼로그 (캘린더 뷰에서 날짜 클릭 시) */}
      <Dialog open={showScheduleListDialog} onOpenChange={setShowScheduleListDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-between">
              {/* 선택된 날짜 표시 */}
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">
                  {selectedDate && format(selectedDate, 'yyyy년 M월 d일', { locale: ko })} 일정
                </span>
              </div>

              {/* 일정 추가 버튼 */}
              <Button
                size="sm"
                onClick={() => {
                  setInitialScheduleDate(selectedDate)
                  setShowScheduleListDialog(false)
                  setShowAddDialog(true)
                }}
                className="h-8 rounded-lg"
              >
                + 추가
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* 해당 날짜의 일정 목록 */}
          <div className="space-y-2 mt-4">
            {selectedDate &&
              getSchedulesForDate(filteredSchedules, selectedDate).map((schedule, index) => (
                <Card
                  key={schedule.id}
                  className={`
                    border border-border transition-all duration-200
                    hover:shadow-md hover:-translate-y-0.5
                    animate-fade-in
                    ${schedule.completed ? 'bg-muted/50' : 'bg-card'}
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      {/* 체크박스 */}
                      <Checkbox
                        checked={Boolean(schedule.completed)}
                        onCheckedChange={() => toggleSchedule(schedule.id)}
                        className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />

                      {/* 일정 내용 */}
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

                        {/* 카테고리 & 웹 데이터 뱃지 */}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {schedule.category && (
                            <Badge variant="secondary" className={`text-xs ${getCategoryColor(schedule.category)}`}>
                              {getCategoryLabel(schedule.category)}
                            </Badge>
                          )}

                          {/* 운영 반영 카테고리의 경우 웹 데이터 여부 표시 */}
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

                      {/* 액션 버튼 (수정/삭제) */}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            startEditSchedule(schedule)
                            setShowScheduleListDialog(false)
                          }}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all active:scale-95"
                          title="수정"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-95"
                          title="삭제"
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
