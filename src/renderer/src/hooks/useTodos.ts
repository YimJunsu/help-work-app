import { useState, useEffect } from 'react'

export type TodoPriority = 'A' | 'B' | 'C'

export interface Todo {
  id: string
  text: string
  completed: boolean
  category?: string
  priority: TodoPriority
  date: Date
  order?: number // 사용자 지정 순서 (드래그앤드롭으로 변경 가능)
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
      setTodos(todos.map(t => {
        if (t.id === editingTodo.id) {
          const newPriority = todo.priority || t.priority
          // 우선순위가 변경되면 order를 제거하여 우선순위 순으로 재정렬
          const shouldResetOrder = newPriority !== t.priority
          return {
            ...t,
            text: todo.text,
            category: todo.category,
            priority: newPriority,
            order: shouldResetOrder ? undefined : t.order
          }
        }
        return t
      }))
    } else {
      // Add new todo (order 없이 추가하면 우선순위 순으로 정렬됨)
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

  // Sort todos
  // - order가 있으면 order 순으로 정렬 (사용자가 드래그앤드롭으로 순서 변경한 경우)
  // - order가 없으면 우선순위 순으로 정렬 (A -> B -> C)
  const sortTodos = (todoList: Todo[]) => {
    return [...todoList].sort((a, b) => {
      // 둘 다 order가 있으면 order 기준 정렬
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order
      }
      // 둘 중 하나만 order가 있으면 order가 있는 것을 우선
      if (a.order !== undefined) return -1
      if (b.order !== undefined) return 1

      // 둘 다 order가 없으면 우선순위 기준 정렬
      const priorityOrder = { A: 0, B: 1, C: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  const reorderTodos = (draggedId: string, targetId: string) => {
    // 현재 정렬된 순서를 기준으로 인덱스를 찾음
    const sortedList = sortTodos(todos)
    const draggedIndex = sortedList.findIndex(t => t.id === draggedId)
    const targetIndex = sortedList.findIndex(t => t.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
      return
    }

    // 정렬된 배열에서 순서 변경
    const newTodos = [...sortedList]
    const [removed] = newTodos.splice(draggedIndex, 1)
    newTodos.splice(targetIndex, 0, removed)

    // 드래그앤드롭 후 모든 항목에 order를 부여하여 현재 순서 유지
    const todosWithOrder = newTodos.map((todo, index) => ({
      ...todo,
      order: index
    }))

    setTodos(todosWithOrder)
  }

  const sortedTodos = sortTodos(todos)

  return {
    todos: sortedTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompletedTodos,
    reorderTodos
  }
}