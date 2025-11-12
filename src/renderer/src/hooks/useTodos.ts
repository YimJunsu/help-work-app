import { useState, useEffect } from 'react'

export interface Todo {
  id: string
  text: string
  completed: boolean
  category?: string
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

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dailyTodos', JSON.stringify(todos))
  }, [todos])

  const addTodo = (todo: { text: string; category?: string }, editingTodo?: Todo | null) => {
    if (editingTodo) {
      // Update existing todo
      setTodos(todos.map(t =>
        t.id === editingTodo.id
          ? { ...t, text: todo.text, category: todo.category }
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

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompletedTodos,
    reorderTodos
  }
}