import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { CheckCheck, List } from 'lucide-react'
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

export const TodoList = forwardRef<{ openAddDialog: () => void }, TodoListProps>(function TodoList({ onDialogChange, onStatsChange }, ref) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)

  const { todos, addTodo, toggleTodo, deleteTodo, clearCompletedTodos, reorderTodos } = useTodos()
  const { draggedItem, handleDragStart, handleDragOver, handleDrop, handleDragEnd } = useDragAndDrop<string>()
  const { deletingItems, deleteWithAnimation, deleteMultipleWithAnimation } = useDeleteAnimation<string>()

  // Notify parent when dialog state changes
  useState(() => {
    onDialogChange?.(showAddDialog)
  })

  const handleAddTodo = (todo: { text: string; category?: string }) => {
    addTodo(todo, editingTodo)
    setEditingTodo(null)
  }

  const startEditTodo = (todo: Todo) => {
    setEditingTodo(todo)
    setShowAddDialog(true)
  }

  const handleDeleteTodo = (id: string) => {
    deleteWithAnimation(id, deleteTodo)
  }

  const handleClearCompleted = () => {
    const completedIds = todos.filter(todo => todo.completed).map(todo => todo.id)
    deleteMultipleWithAnimation(completedIds, clearCompletedTodos)
  }

  const completedCount = todos.filter(todo => todo.completed).length
  const totalCount = todos.length

  // Notify parent when stats change
  useEffect(() => {
    onStatsChange?.({ completed: completedCount, total: totalCount })
  }, [completedCount, totalCount, onStatsChange])

  // Expose openAddDialog to parent
  useImperativeHandle(ref, () => ({
    openAddDialog: () => setShowAddDialog(true)
  }))

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        <CardHeader className="pb-3 pt-2">
          {completedCount > 0 && (
            <div className="flex items-center justify-end">
              <Button
                onClick={handleClearCompleted}
                variant="ghost"
                size="sm"
                className="h-9 px-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/15 active:scale-95 transition-all"
                title="완료된 할 일 삭제"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                <span className="text-sm">완료 항목 정리</span>
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
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
            ))}
          </div>

          {todos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-8 rounded-3xl border-2 border-primary/20 backdrop-blur-sm">
                  <List className="w-16 h-16 mx-auto text-primary/40" strokeWidth={1.5} />
                </div>
              </div>
              <div className="mt-8 text-center space-y-2">
                <p className="text-lg font-semibold text-foreground/70">할 일이 없습니다</p>
                <p className="text-sm text-muted-foreground">
                  오늘의 할 일을 추가해보세요!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 할 일 추가 다이얼로그 */}
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
