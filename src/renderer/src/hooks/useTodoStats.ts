import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export interface TodoStats {
  date: string
  count: number
}

/**
 * 투두 통계 데이터를 관리하는 hook (최근 7일간)
 */
export function useTodoStats() {
  const [todoStats, setTodoStats] = useState<TodoStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadTodoStats = async () => {
    if (window.electron) {
      setIsLoading(true)
      const today = new Date()
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

      const startDate = format(sevenDaysAgo, 'yyyy-MM-dd')
      const endDate = format(today, 'yyyy-MM-dd')

      const stats = await window.electron.ipcRenderer.invoke(
        'todoStats:getByDateRange',
        startDate,
        endDate
      )

      const statsMap = new Map(stats.map((s: any) => [s.date, s.count]))
      const chartData: TodoStats[] = []

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = format(date, 'yyyy-MM-dd')
        chartData.push({
          date: format(date, 'MM/dd'),
          count: (statsMap.get(dateStr) as number) || 0
        })
      }

      setTodoStats(chartData)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTodoStats()
  }, [])

  return { todoStats, isLoading, loadTodoStats }
}