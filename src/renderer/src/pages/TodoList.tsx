import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Plus, CheckCheck, List } from 'lucide-react'
import { TodoAdd } from './TodoAdd'
import { TodoItem } from '../components/todo'
import { useTodos } from '../hooks/useTodos'
import { useDragAndDrop } from '../hooks/useDragAndDrop'
import { useDeleteAnimation } from '../hooks/useDeleteAnimation'
import type { Todo } from '../hooks/useTodos'

interface TodoListProps {
  onDialogChange?: (isOpen: boolean) => void
}

export function TodoList({ onDialogChange }: TodoListProps) {
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

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 border-0 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between min-h-[60px]">
            <CardTitle className="text-2xl font-bold text-card-foreground leading-tight">Daily Todo List</CardTitle>
            <div className="flex items-center gap-2 h-full">
              <Badge variant="secondary" className="text-sm font-medium">
                {completedCount}/{totalCount} 완료
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
              <Button onClick={() => setShowAddDialog(true)} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-md transition-all duration-200">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
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
            <div className="text-center py-8 text-muted-foreground">
              <List className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">오늘의 할 일이 없습니다</p>
              <p className="text-sm">새로운 할 일을 추가해보세요!</p>
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
}