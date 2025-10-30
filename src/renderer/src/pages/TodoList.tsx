import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Checkbox } from '../components/ui/checkbox'
import { Badge } from '../components/ui/badge'
import { Plus, Trash2, CheckCheck, List, Pencil } from 'lucide-react'
import { TodoAdd } from './TodoAdd'

interface Todo {
  id: string
  text: string
  completed: boolean
  category?: string
  date: Date
}

interface TodoListProps {
  onDialogChange?: (isOpen: boolean) => void
}

export function TodoList({ onDialogChange }: TodoListProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Load todos from localStorage on initial mount
  const [todos, setTodos] = useState<Todo[]>(() => {
    const savedTodos = localStorage.getItem('dailyTodos')
    if (savedTodos) {
      const parsedTodos = JSON.parse(savedTodos)
      // Convert date strings back to Date objects and filter todos from the last 3 days
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      threeDaysAgo.setHours(0, 0, 0, 0)

      return parsedTodos
        .map((todo: any) => ({
          ...todo,
          date: new Date(todo.date)
        }))
        .filter((todo: Todo) => {
          const todoDate = new Date(todo.date)
          todoDate.setHours(0, 0, 0, 0)
          return todoDate.getTime() >= threeDaysAgo.getTime()
        })
    }
    return []
  })
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [deletingTodos, setDeletingTodos] = useState<Set<string>>(new Set())
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [draggedTodo, setDraggedTodo] = useState<string | null>(null)

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dailyTodos', JSON.stringify(todos))
  }, [todos])

  useEffect(() => {
    onDialogChange?.(showAddDialog)
  }, [showAddDialog, onDialogChange])

  const addTodo = (todo: { text: string; category?: string }) => {
    if (editingTodo) {
      // Update existing todo
      setTodos(todos.map(t =>
        t.id === editingTodo.id
          ? { ...t, text: todo.text, category: todo.category }
          : t
      ))
      setEditingTodo(null)
    } else {
      // Add new todo
      setTodos([
        ...todos,
        {
          id: Date.now().toString(),
          text: todo.text,
          completed: false,
          category: todo.category,
          date: today
        }
      ])
    }
  }

  const startEditTodo = (todo: Todo) => {
    setEditingTodo(todo)
    setShowAddDialog(true)
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id: string) => {
    setDeletingTodos(prev => new Set([...prev, id]))
    setTimeout(() => {
      setTodos(todos => todos.filter(todo => todo.id !== id))
      setDeletingTodos(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }, 300)
  }

  const clearCompletedTodos = () => {
    const completedIds = todos.filter(todo => todo.completed).map(todo => todo.id)
    setDeletingTodos(new Set(completedIds))
    setTimeout(() => {
      setTodos(todos => todos.filter(todo => !todo.completed))
      setDeletingTodos(new Set())
    }, 300)
  }

  const handleDragStart = (e: React.DragEvent, todoId: string) => {
    setDraggedTodo(todoId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetTodoId: string) => {
    e.preventDefault()

    if (!draggedTodo || draggedTodo === targetTodoId) {
      setDraggedTodo(null)
      return
    }

    const draggedIndex = todos.findIndex(t => t.id === draggedTodo)
    const targetIndex = todos.findIndex(t => t.id === targetTodoId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTodo(null)
      return
    }

    const newTodos = [...todos]
    const [removed] = newTodos.splice(draggedIndex, 1)
    newTodos.splice(targetIndex, 0, removed)

    setTodos(newTodos)
    setDraggedTodo(null)
  }

  const handleDragEnd = () => {
    setDraggedTodo(null)
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
                  onClick={clearCompletedTodos}
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
              <Card
                key={todo.id}
                draggable
                onDragStart={(e) => handleDragStart(e, todo.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, todo.id)}
                onDragEnd={handleDragEnd}
                className={`border border-border bg-card/70 backdrop-blur-sm hover:shadow-md transition-all duration-300 cursor-move ${
                  deletingTodos.has(todo.id)
                    ? 'transform -translate-x-full opacity-0'
                    : 'transform translate-x-0 opacity-100'
                } ${draggedTodo === todo.id ? 'opacity-50' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium transition-all duration-200 ${todo.completed ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
                        {todo.text}
                      </span>
                      {todo.category && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                            {todo.category}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditTodo(todo)}
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTodo(todo.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
          if (!open) setEditingTodo(null)
        }}
        onAddTodo={addTodo}
        editingTodo={editingTodo}
      />
    </div>
  )
}
