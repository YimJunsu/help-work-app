/**
 * TodoList Component
 *
 * 일일 할일 관리 페이지
 * - 할일 추가/수정/삭제
 * - 완료 상태 토글
 * - 드래그 앤 드롭으로 순서 변경
 * - 완료된 항목 일괄 삭제
 *
 * Features:
 * - iOS 스타일 인터랙션
 * - 부드러운 애니메이션 (삭제, 드래그)
 * - Empty State 디자인
 * - 필터링 (전체/진행중/완료)
 */

import { useState, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { CheckCheck, List, ListTodo, CheckCircle2, Circle } from 'lucide-react'
import { TodoAdd } from './TodoAdd'
import { TodoItem } from '../components/todo'
import { useTodos } from '../hooks/useTodos'
import { useDragAndDrop } from '../hooks/useDragAndDrop'
import { useDeleteAnimation } from '../hooks/useDeleteAnimation'
import type { Todo } from '../hooks/useTodos'

interface TodoListProps {
  onDialogChange?: (isOpen: boolean) => void
  onStatsChange?: (stats: { completed: number; total: number }) => void
}

/**
 * 필터 타입 정의
 */
type FilterType = 'all' | 'active' | 'completed'

export const TodoList = forwardRef<{ openAddDialog: () => void }, TodoListProps>(function TodoList({ onDialogChange, onStatsChange }, ref) {
  /* ============================================
     State Management
     ============================================ */

  // 다이얼로그 상태
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)

  // 필터 상태
  const [filter, setFilter] = useState<FilterType>('all')

  // 커스텀 훅
  const { todos, addTodo, toggleTodo, deleteTodo, clearCompletedTodos, reorderTodos } = useTodos()
  const { draggedItem, handleDragStart, handleDragOver, handleDrop, handleDragEnd } = useDragAndDrop<string>()
  const { deletingItems, deleteWithAnimation, deleteMultipleWithAnimation } = useDeleteAnimation<string>()

  /* ============================================
     Effects
     ============================================ */

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
   * 할일 추가/수정 핸들러
   */
  const handleAddTodo = useCallback((todo: { text: string; category?: string }) => {
    addTodo(todo, editingTodo)
    setEditingTodo(null)
  }, [addTodo, editingTodo])

  /**
   * 할일 수정 시작
   */
  const startEditTodo = useCallback((todo: Todo) => {
    setEditingTodo(todo)
    setShowAddDialog(true)
  }, [])

  /**
   * 할일 삭제 (애니메이션 포함)
   */
  const handleDeleteTodo = useCallback((id: string) => {
    deleteWithAnimation(id, deleteTodo)
  }, [deleteWithAnimation, deleteTodo])

  /**
   * 완료된 할일 모두 삭제
   */
  const handleClearCompleted = useCallback(() => {
    const completedIds = todos.filter(todo => todo.completed).map(todo => todo.id)
    deleteMultipleWithAnimation(completedIds, clearCompletedTodos)
  }, [todos, deleteMultipleWithAnimation, clearCompletedTodos])

  /* ============================================
     Computed Values
     ============================================ */

  /**
   * 통계 계산 (완료/전체)
   */
  const { completedCount, totalCount, activeCount } = useMemo(() => ({
    completedCount: todos.filter(todo => todo.completed).length,
    activeCount: todos.filter(todo => !todo.completed).length,
    totalCount: todos.length
  }), [todos])

  /**
   * 필터링된 할일 목록
   */
  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed)
      case 'completed':
        return todos.filter(todo => todo.completed)
      default:
        return todos
    }
  }, [todos, filter])

  /**
   * 통계 변경 알림 (부모 컴포넌트)
   */
  useEffect(() => {
    onStatsChange?.({ completed: completedCount, total: totalCount })
  }, [completedCount, totalCount, onStatsChange])

  /**
   * Ref를 통해 부모에서 다이얼로그 열기 기능 노출
   */
  useImperativeHandle(ref, () => ({
    openAddDialog: () => setShowAddDialog(true)
  }))

  /* ============================================
     Render
     ============================================ */

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        {/* 헤더 - 필터 & 액션 버튼 */}
        <CardHeader className="pb-3 pt-2 space-y-3">
          {/* 필터 버튼 그룹 - 밑줄 스타일 */}
          <div className="flex items-center gap-1 animate-fade-in border-b border-border">
            <button
              onClick={() => setFilter('all')}
              className={`
                relative h-10 px-4 flex items-center gap-2
                text-sm font-medium transition-all
                hover:text-foreground
                ${filter === 'all'
                  ? 'text-foreground'
                  : 'text-muted-foreground'
                }
              `}
            >
              <ListTodo className="w-4 h-4" />
              전체
              <span className="px-2 py-0.5 text-xs rounded-full bg-muted/50">
                {totalCount}
              </span>
              {/* 밑줄 인디케이터 */}
              {filter === 'all' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-slide-in-bottom" />
              )}
            </button>

            <button
              onClick={() => setFilter('active')}
              className={`
                relative h-10 px-4 flex items-center gap-2
                text-sm font-medium transition-all
                hover:text-foreground
                ${filter === 'active'
                  ? 'text-foreground'
                  : 'text-muted-foreground'
                }
              `}
            >
              <Circle className="w-4 h-4" />
              진행중
              <span className="px-2 py-0.5 text-xs rounded-full bg-muted/50">
                {activeCount}
              </span>
              {/* 밑줄 인디케이터 */}
              {filter === 'active' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-slide-in-bottom" />
              )}
            </button>

            <button
              onClick={() => setFilter('completed')}
              className={`
                relative h-10 px-4 flex items-center gap-2
                text-sm font-medium transition-all
                hover:text-foreground
                ${filter === 'completed'
                  ? 'text-foreground'
                  : 'text-muted-foreground'
                }
              `}
            >
              <CheckCircle2 className="w-4 h-4" />
              완료
              <span className="px-2 py-0.5 text-xs rounded-full bg-muted/50">
                {completedCount}
              </span>
              {/* 밑줄 인디케이터 */}
              {filter === 'completed' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-slide-in-bottom" />
              )}
            </button>

            {/* 완료 항목 정리 버튼 */}
            {completedCount > 0 && (
              <div className="flex-1 flex justify-end">
                <Button
                  onClick={handleClearCompleted}
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/15 active:scale-95 transition-all"
                  title="완료된 할 일 삭제"
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  <span className="text-sm">완료 항목 정리</span>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {/* 콘텐츠 - 할일 리스트 */}
        <CardContent className="space-y-4">
          {/* 할일 목록 */}
          <div className="space-y-3">
            {filteredTodos.map((todo, index) => (
              <div
                key={todo.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <TodoItem
                  todo={todo}
                  isDeleting={deletingItems.has(todo.id)}
                  isDragging={draggedItem === todo.id}
                  onToggle={toggleTodo}
                  onEdit={startEditTodo}
                  onDelete={handleDeleteTodo}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={(e, id) => handleDrop(e, id, reorderTodos)}
                  onDragEnd={handleDragEnd}
                />
              </div>
            ))}
          </div>

          {/* Empty State - 할일이 없을 때 */}
          {filteredTodos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
              {/* 아이콘 배경 효과 */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-8 rounded-3xl border-2 border-primary/20 backdrop-blur-sm">
                  <List className="w-16 h-16 mx-auto text-primary/40" strokeWidth={1.5} />
                </div>
              </div>

              {/* 안내 텍스트 */}
              <div className="mt-8 text-center space-y-2">
                <p className="text-lg font-semibold text-foreground/70">
                  {filter === 'active' && '진행중인 할 일이 없습니다'}
                  {filter === 'completed' && '완료된 할 일이 없습니다'}
                  {filter === 'all' && '할 일이 없습니다'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {filter === 'all' ? '오늘의 할 일을 추가해보세요!' : '다른 필터를 선택해보세요'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 할 일 추가/수정 다이얼로그 */}
      <TodoAdd
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open)
          onDialogChange?.(open)
          if (!open) setEditingTodo(null)
        }}
        onAddTodo={handleAddTodo}
        editingTodo={editingTodo}
      />
    </div>
  )
})
