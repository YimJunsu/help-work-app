import { useState, useEffect } from 'react'

export type TodoPriority = 'A' | 'B' | 'C'

export interface Todo {
  id: string
  text: string
  completed: boolean
  category?: string
  priority: TodoPriority
  date: Date
}

/**
 * 투두 리스트를 관리하는 hook (localStorage 기반)
 */
export function useTodos() {
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
          date: new Date(todo.date),
          priority: todo.priority || 'C' // Default priority for existing todos
        }))
        .filter((todo: Todo) => {
          const todoDate = new Date(todo.date)
          todoDate.setHours(0, 0, 0, 0)
          return todoDate.getTime() >= threeDaysAgo.getTime()
        })
    }
    return []
  })

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dailyTodos', JSON.stringify(todos))
  }, [todos])

  const addTodo = (todo: { text: string; category?: string; priority?: TodoPriority }, editingTodo?: Todo | null) => {
    if (editingTodo) {
      // Update existing todo
      setTodos(todos.map(t =>
        t.id === editingTodo.id
          ? { ...t, text: todo.text, category: todo.category, priority: todo.priority || t.priority }
          : t
      ))
    } else {
      // Add new todo
      setTodos([
        ...todos,
        {
          id: Date.now().toString(),
          text: todo.text,
          completed: false,
          category: todo.category,
          priority: todo.priority || 'C',
          date: today
        }
      ])
    }
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id: string) => {
    setTodos(todos => todos.filter(todo => todo.id !== id))
  }

  const clearCompletedTodos = () => {
    setTodos(todos => todos.filter(todo => !todo.completed))
  }

  const reorderTodos = (draggedId: string, targetId: string) => {
    const draggedIndex = todos.findIndex(t => t.id === draggedId)
    const targetIndex = todos.findIndex(t => t.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
      return
    }

    const newTodos = [...todos]
    const [removed] = newTodos.splice(draggedIndex, 1)
    newTodos.splice(targetIndex, 0, removed)

    setTodos(newTodos)
  }

  // Sort todos by priority (A -> B -> C)
  const sortedTodos = [...todos].sort((a, b) => {
    const priorityOrder = { A: 0, B: 1, C: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return {
    todos: sortedTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompletedTodos,
    reorderTodos
  }
}