/**
 * WorkBatteryIndicator Component
 *
 * 근무 시간 기반 배터리 인디케이터
 * - 09:00 ~ 18:00: 배터리 아이콘 (100% → 0%)
 * - 18:30 ~ 다음날 09:00: 집 아이콘
 *
 * Features:
 * - 실시간 시간 업데이트 (1분마다)
 * - 부드러운 애니메이션
 * - 배터리 레벨별 색상 변화
 */

import { useState, useEffect } from 'react'
import {
  Battery,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  Home
} from 'lucide-react'

export function WorkBatteryIndicator() {
  const [currentTime, setCurrentTime] = useState(new Date())

  /**
   * 1분마다 현재 시간 업데이트
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // 1분마다 업데이트

    return () => clearInterval(timer)
  }, [])

  /**
   * 배터리 퍼센트 계산
   * 09:00 = 100%, 18:00 = 0%
   * 선형적으로 감소
   */
  const getBatteryPercentage = (): number => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    const totalMinutes = hours * 60 + minutes

    // 09:00 (540분) ~ 18:00 (1080분)
    const workStart = 9 * 60 // 540분
    const workEnd = 18 * 60 // 1080분
    const workDuration = workEnd - workStart // 540분 (9시간)

    if (totalMinutes < workStart) {
      // 09:00 이전
      return 100
    } else if (totalMinutes >= workEnd) {
      // 18:00 이후
      return 0
    } else {
      // 09:00 ~ 18:00 사이
      const elapsedMinutes = totalMinutes - workStart
      const percentage = 100 - (elapsedMinutes / workDuration) * 100
      return Math.max(0, Math.min(100, percentage))
    }
  }

  /**
   * 집/배터리 아이콘 표시 여부
   * 18:30 ~ 다음날 09:00: 집 아이콘
   */
  const shouldShowHomeIcon = (): boolean => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    const totalMinutes = hours * 60 + minutes

    // 18:30 (1110분) ~ 23:59 또는 00:00 ~ 09:00 (540분)
    const homeStart = 18 * 60 + 30 // 1110분 (18:30)
    const workStart = 9 * 60 // 540분 (09:00)

    return totalMinutes >= homeStart || totalMinutes < workStart
  }

  /**
   * 배터리 레벨에 따른 아이콘 선택
   */
  const getBatteryIcon = (percentage: number) => {
    if (percentage > 75) {
      return BatteryFull
    } else if (percentage > 50) {
      return BatteryMedium
    } else if (percentage > 25) {
      return BatteryLow
    } else if (percentage > 0) {
      return BatteryWarning
    } else {
      return Battery
    }
  }

  /**
   * 배터리 레벨에 따른 색상
   */
  const getBatteryColor = (percentage: number): string => {
    if (percentage > 75) {
      return 'text-green-600 dark:text-green-400'
    } else if (percentage > 50) {
      return 'text-blue-600 dark:text-blue-400'
    } else if (percentage > 25) {
      return 'text-orange-600 dark:text-orange-400'
    } else {
      return 'text-red-600 dark:text-red-400'
    }
  }

  /**
   * 상태 메시지
   */
  const getStatusMessage = (percentage: number): string => {
    if (percentage > 75) {
      return '근무 시작!'
    } else if (percentage > 50) {
      return '업무 중 이상 무.'
    } else if (percentage > 25) {
      return '조금만 더 참자!'
    } else if (percentage > 0) {
      return '집가서 빨리 충전하자..'
    } else {
      return '퇴근 시간!'
    }
  }

  const showHome = shouldShowHomeIcon()
  const batteryPercentage = getBatteryPercentage()
  const BatteryIcon = getBatteryIcon(batteryPercentage)
  const batteryColor = getBatteryColor(batteryPercentage)
  const statusMessage = getStatusMessage(batteryPercentage)

  return (
    <div
      className="
        group relative flex items-center gap-2 px-3 py-1.5 rounded-full
        bg-muted/50 hover:bg-muted/80
        border border-border/50
        transition-all duration-200
        cursor-pointer
      "
      title={showHome ? '집에서 휴식 중' : `${Math.round(batteryPercentage)}% - ${statusMessage}`}
    >
      {showHome ? (
        // 집 아이콘 (18:30 ~ 09:00)
        <>
          <Home className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-foreground tabular-nums">
            휴식
          </span>
        </>
      ) : (
        // 배터리 아이콘 (09:00 ~ 18:00)
        <>
          <BatteryIcon className={`w-5 h-5 ${batteryColor}`} />
          <span className={`text-sm font-semibold tabular-nums ${batteryColor}`}>
            {Math.round(batteryPercentage)}%
          </span>
        </>
      )}

      {/* 호버 시 상세 정보 표시 */}
      <div
        className="
          absolute top-full right-0 mt-2 px-3 py-2 rounded-lg
          bg-popover border border-border shadow-lg
          opacity-0 group-hover:opacity-100
          pointer-events-none
          transition-opacity duration-200
          whitespace-nowrap
          z-50
        "
      >
        <div className="text-xs font-medium text-popover-foreground">
          {showHome ? (
            <>
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-primary" />
                <span>집에서 휴식 중</span>
              </div>
              <div className="mt-1 text-muted-foreground">
                {currentTime.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <BatteryIcon className={`w-4 h-4 ${batteryColor}`} />
                <span className={batteryColor}>{statusMessage}</span>
              </div>
              <div className="mt-1 text-muted-foreground">
                {currentTime.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {' · '}
                {Math.round(batteryPercentage)}% 남음
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
