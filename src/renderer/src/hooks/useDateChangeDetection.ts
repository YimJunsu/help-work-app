import { useState, useEffect } from 'react'

/**
 * 날짜 변경을 감지하는 hook (자정이 지나면 콜백 실행)
 */
export function useDateChangeDetection(onDateChange?: () => void) {
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date()
      const currentDateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
      const stateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`

      if (currentDateKey !== stateKey) {
        setCurrentDate(now)
        onDateChange?.()
      }
    }

    // Check every minute for date changes
    const intervalId = setInterval(checkDateChange, 60000)

    return () => clearInterval(intervalId)
  }, [currentDate, onDateChange])

  return currentDate
}