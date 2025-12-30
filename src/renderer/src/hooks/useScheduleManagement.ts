import { useState, useEffect } from 'react'
import type { Schedule } from './useSchedules'

/**
 * 스케줄 CRUD 및 정렬/필터링을 관리하는 고급 hook
 */
export function useScheduleManagement() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadSchedules = async () => {
    if (window.electron) {
      setIsLoading(true)
      const loadedSchedules = await window.electron.ipcRenderer.invoke('schedules:getAll')

      // Auto-complete overdue schedules
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (const schedule of loadedSchedules) {
        if (!schedule.completed && schedule.dueDate) {
          const dueDate = new Date(schedule.dueDate)
          dueDate.setHours(0, 0, 0, 0)

          // If due date is in the past, mark as completed
          if (dueDate < today) {
            await window.electron.ipcRenderer.invoke('schedules:update', schedule.id, {
              completed: true
            })
            schedule.completed = true
          }
        }
      }

      // Load saved order from localStorage
      const savedOrder = localStorage.getItem('scheduleOrder')
      if (savedOrder) {
        try {
          const orderArray: number[] = JSON.parse(savedOrder)
          // Sort schedules according to saved order
          const orderedSchedules = [...loadedSchedules].sort((a, b) => {
            const indexA = orderArray.indexOf(a.id)
            const indexB = orderArray.indexOf(b.id)
            // Items not in order array go to the end
            if (indexA === -1 && indexB === -1) return 0
            if (indexA === -1) return 1
            if (indexB === -1) return -1
            return indexA - indexB
          })
          setSchedules(orderedSchedules)
        } catch (e) {
          setSchedules(loadedSchedules)
        }
      } else {
        setSchedules(loadedSchedules)
      }
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSchedules()
  }, [])

  const addOrUpdateSchedule = async (
    schedule: { text: string; category?: string; dueDate?: Date; clientName?: string; requestNumber?: string; webData?: boolean },
    editingSchedule?: Schedule | null
  ) => {
    if (window.electron) {
      if (editingSchedule) {
        // Update existing schedule
        await window.electron.ipcRenderer.invoke('schedules:update', editingSchedule.id, {
          text: schedule.text,
          category: schedule.category,
          dueDate: schedule.dueDate?.toISOString(),
          clientName: schedule.clientName,
          requestNumber: schedule.requestNumber,
          webData: schedule.webData
        })
      } else {
        // Create new schedule
        await window.electron.ipcRenderer.invoke('schedules:create', {
          text: schedule.text,
          completed: false,
          category: schedule.category,
          dueDate: schedule.dueDate?.toISOString(),
          clientName: schedule.clientName,
          requestNumber: schedule.requestNumber,
          webData: schedule.webData
        })
      }
      await loadSchedules()
    }
  }

  const toggleSchedule = async (id: number) => {
    const schedule = schedules.find(s => s.id === id)
    if (schedule && window.electron) {
      await window.electron.ipcRenderer.invoke('schedules:update', id, {
        completed: !schedule.completed
      })
      await loadSchedules()
    }
  }

  const deleteSchedule = async (id: number) => {
    if (window.electron) {
      await window.electron.ipcRenderer.invoke('schedules:delete', id)
      await loadSchedules()
    }
  }

  const clearCompletedSchedules = async () => {
    if (window.electron) {
      await window.electron.ipcRenderer.invoke('schedules:deleteCompleted')
      await loadSchedules()
    }
  }

  const reorderSchedules = (draggedId: number, targetId: number) => {
    const draggedIndex = schedules.findIndex(s => s.id === draggedId)
    const targetIndex = schedules.findIndex(s => s.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
      return
    }

    const newSchedules = [...schedules]
    const [removed] = newSchedules.splice(draggedIndex, 1)
    newSchedules.splice(targetIndex, 0, removed)

    setSchedules(newSchedules)

    // Save new order to localStorage
    const orderArray = newSchedules.map(s => s.id)
    localStorage.setItem('scheduleOrder', JSON.stringify(orderArray))
  }

  return {
    schedules,
    isLoading,
    loadSchedules,
    addOrUpdateSchedule,
    toggleSchedule,
    deleteSchedule,
    clearCompletedSchedules,
    reorderSchedules
  }
}