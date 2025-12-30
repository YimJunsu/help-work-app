import { useState, useEffect } from 'react'

export interface Schedule {
  id: number
  text: string
  completed: number | boolean
  category?: string
  dueDate?: string
  clientName?: string
  requestNumber?: string
  webData?: number | boolean
  createdAt: string
  updatedAt: string
}

/**
 * 스케줄 데이터를 관리하는 hook
 */
export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadSchedules = async () => {
    if (window.electron) {
      setIsLoading(true)
      const schedules = await window.electron.ipcRenderer.invoke('schedules:getAll')
      setSchedules(schedules)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSchedules()
  }, [])

  return { schedules, isLoading, loadSchedules }
}