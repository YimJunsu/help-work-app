import { ipcMain, BrowserWindow, shell, Notification } from 'electron'
import { is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import {
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  deleteCompletedSchedules,
  getAllMemos,
  createMemo,
  updateMemo,
  deleteMemo,
  getTodoStatsByDateRange,
  getTodoStatByDate,
  incrementTodoStat,
  resetTodoStat,
  getAllTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  deleteCompletedTodos,
  getUserInfo,
  createOrUpdateUserInfo
} from './database'
import {
  loginToUniPost,
  fetchRequestHistory,
  logoutFromUniPost,
  isUniPostLoggedIn,
  toggleUniPostWindow
} from './unipost'
import { encryptPassword } from './crypto'

// 알람 확인된 스케줄 ID를 저장하는 Set
const notifiedSchedules = new Set<number>()

// 스케줄별 타이머를 저장하는 Map
const scheduleTimers = new Map<number, NodeJS.Timeout>()

// 알림 클릭 시 창 포커스를 위한 mainWindow 참조
let storedMainWindow: BrowserWindow | null = null

/**
 * 모든 IPC 핸들러를 등록하는 함수
 */
export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  storedMainWindow = mainWindow
  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Debug: Get database path
  ipcMain.handle('get-db-path', () => {
    const { app } = require('electron')
    const path = require('path')
    const userDataPath = app.getPath('userData')
    const dbPath = path.join(userDataPath, 'datas', 'schedules.db')
    console.log('[IPC] Database path:', dbPath)
    return dbPath
  })

  // Schedule IPC handlers
  registerScheduleHandlers()

  // Memo IPC handlers
  registerMemoHandlers()

  // TodoStats IPC handlers
  registerTodoStatsHandlers()

  // Todos IPC handlers
  registerTodosHandlers()

  // UserInfo IPC handlers
  registerUserInfoHandlers()

  // UniPost IPC handlers
  registerUniPostHandlers()

  // Auto-updater IPC handlers
  registerAutoUpdaterHandlers(mainWindow)

  // Open external URL
  ipcMain.on('open-external', (_event, url: string) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      shell.openExternal(url)
    }
  })

  // UniPedia IPC handlers
  registerUnipediaHandlers()
}

/**
 * Schedule 관련 IPC 핸들러
 */
function registerScheduleHandlers(): void {
  ipcMain.handle('schedules:getAll', () => {
    return getAllSchedules()
  })

  ipcMain.handle('schedules:create', (_event, schedule) => {
    const newSchedule = createSchedule({
      text: schedule.text,
      completed: schedule.completed,
      category: schedule.category,
      dueDate: schedule.dueDate ? new Date(schedule.dueDate) : undefined,
      dueTime: schedule.dueTime,
      clientName: schedule.clientName,
      requestNumber: schedule.requestNumber,
      webData: schedule.webData,
      repeatType: schedule.repeatType,
      repeatValue: schedule.repeatValue
    })

    // 새로 생성된 스케줄에 대한 알람 타이머 설정 (마감일 일정 또는 매주/매월 반복 일정)
    if (newSchedule) {
      scheduleNotification(newSchedule)
    }

    return newSchedule
  })

  ipcMain.handle('schedules:update', (_event, id, updates: {
    text?: string
    completed?: boolean
    category?: string
    dueDate?: string | null
    dueTime?: string | null
    clientName?: string
    requestNumber?: string
    webData?: boolean
    repeatType?: string
    repeatValue?: number | null
  }) => {
    const updatedSchedule = updateSchedule(id, {
      text: updates.text,
      completed: updates.completed,
      category: updates.category,
      dueDate: updates.dueDate !== undefined
        ? updates.dueDate ? new Date(updates.dueDate) : null
        : undefined,
      dueTime: updates.dueTime,
      clientName: updates.clientName,
      requestNumber: updates.requestNumber,
      webData: updates.webData,
      repeatType: updates.repeatType,
      repeatValue: updates.repeatValue
    })

    // 수정된 스케줄에 대한 알람 타이머 재설정
    if (updatedSchedule) {
      // 완료된 경우 타이머 제거
      if (updatedSchedule.completed) {
        const timer = scheduleTimers.get(id)
        if (timer) {
          clearTimeout(timer)
          scheduleTimers.delete(id)
        }
      } else {
        // 완료되지 않은 경우 타이머 재설정
        scheduleNotification(updatedSchedule)
      }
    }

    return updatedSchedule
  })

  ipcMain.handle('schedules:delete', (_event, id) => {
    // 타이머 제거
    const timer = scheduleTimers.get(id)
    if (timer) {
      clearTimeout(timer)
      scheduleTimers.delete(id)
    }

    return deleteSchedule(id)
  })

  ipcMain.handle('schedules:deleteCompleted', () => {
    // 모든 타이머 재설정 (삭제된 스케줄들의 타이머 정리)
    setupAllScheduleNotifications()
    return deleteCompletedSchedules()
  })
}

/**
 * Memo 관련 IPC 핸들러
 */
function registerMemoHandlers(): void {
  ipcMain.handle('memos:getAll', () => {
    return getAllMemos()
  })

  ipcMain.handle('memos:create', (_event, memo) => {
    return createMemo({
      title: memo.title,
      content: memo.content,
      color: memo.color
    })
  })

  ipcMain.handle('memos:update', (_event, id, updates) => {
    return updateMemo(id, {
      title: updates.title,
      content: updates.content,
      color: updates.color
    })
  })

  ipcMain.handle('memos:delete', (_event, id) => {
    return deleteMemo(id)
  })
}

/**
 * TodoStats 관련 IPC 핸들러
 */
function registerTodoStatsHandlers(): void {
  ipcMain.handle('todoStats:getByDateRange', (_event, startDate, endDate) => {
    return getTodoStatsByDateRange(startDate, endDate)
  })

  ipcMain.handle('todoStats:getByDate', (_event, date) => {
    return getTodoStatByDate(date)
  })

  ipcMain.handle('todoStats:increment', (_event, date) => {
    return incrementTodoStat(date)
  })

  ipcMain.handle('todoStats:reset', (_event, date) => {
    return resetTodoStat(date)
  })
}

/**
 * Todos 관련 IPC 핸들러
 */
function registerTodosHandlers(): void {
  ipcMain.handle('todos:getAll', () => {
    return getAllTodos()
  })

  ipcMain.handle('todos:create', (_event, todo) => {
    return createTodo({ text: todo.text, priority: todo.priority })
  })

  ipcMain.handle('todos:update', (_event, id, updates) => {
    return updateTodo(id, {
      text: updates.text,
      completed: updates.completed,
      priority: updates.priority
    })
  })

  ipcMain.handle('todos:delete', (_event, id) => {
    return deleteTodo(id)
  })

  ipcMain.handle('todos:deleteCompleted', () => {
    return deleteCompletedTodos()
  })
}

/**
 * UserInfo 관련 IPC 핸들러
 */
function registerUserInfoHandlers(): void {
  ipcMain.handle('userInfo:get', () => {
    return getUserInfo()
  })

  ipcMain.handle('userInfo:createOrUpdate', (_event, userInfo) => {
    // Encrypt password if provided
    let encryptedPw = userInfo.supportPw
    if (userInfo.supportPw && !userInfo.supportPw.includes(':')) {
      // Only encrypt if it's not already encrypted (encrypted format includes ':')
      encryptedPw = encryptPassword(userInfo.supportPw)
    }

    return createOrUpdateUserInfo({
      name: userInfo.name,
      birthday: userInfo.birthday,
      supportId: userInfo.supportId,
      supportPw: encryptedPw,
      supportPartType: userInfo.supportPartType
    })
  })
}

/**
 * UniPost 관련 IPC 핸들러
 */
function registerUniPostHandlers(): void {
  // Login to UniPost
  ipcMain.handle('unipost:login', async (_event, userId, password) => {
    try {
      // Encrypt password before storing/using
      const encryptedPassword = encryptPassword(password)
      const result = await loginToUniPost(userId, encryptedPassword)
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Login with stored credentials
  ipcMain.handle('unipost:loginWithStored', async () => {
    try {
      const userInfo = getUserInfo()
      if (!userInfo || !userInfo.supportId || !userInfo.supportPw) {
        return { success: false, error: 'No stored credentials found' }
      }

      const result = await loginToUniPost(userInfo.supportId, userInfo.supportPw)
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Fetch request history
  ipcMain.handle('unipost:fetchRequests', async (_event, userName) => {
    try {
      // Get supportPartType from user info
      const userInfo = getUserInfo()
      const supportPartType = userInfo?.supportPartType || ''

      console.log('=== unipost:fetchRequests ===')
      console.log('userInfo:', userInfo)
      console.log('supportPartType from DB:', supportPartType)

      const requests = await fetchRequestHistory(userName, supportPartType)
      return { success: true, data: requests }
    } catch (error: any) {
      return { success: false, error: error.message, data: [] }
    }
  })

  // Check login status
  ipcMain.handle('unipost:isLoggedIn', () => {
    return isUniPostLoggedIn()
  })

  // Logout
  ipcMain.handle('unipost:logout', async () => {
    try {
      await logoutFromUniPost()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Toggle window visibility (for debugging)
  ipcMain.handle('unipost:toggleWindow', (_event, show) => {
    try {
      toggleUniPostWindow(show)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}

/**
 * Auto-updater 관련 IPC 핸들러
 */
function registerAutoUpdaterHandlers(mainWindow: BrowserWindow): void {
  // IPC handlers
  ipcMain.on('check-for-updates', () => {
    if (!is.dev) {
      autoUpdater.checkForUpdates()
    }
  })

  ipcMain.on('download-update', () => {
    if (!is.dev) {
      autoUpdater.downloadUpdate()
    }
  })

  ipcMain.on('quit-and-install', () => {
    if (!is.dev) {
      autoUpdater.quitAndInstall()
    }
  })

  ipcMain.handle('get-app-version', () => {
    return require('electron').app.getVersion()
  })

  // Auto-updater configuration
  autoUpdater.allowDowngrade = false
  autoUpdater.autoDownload = false

  // Auto-updater events
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info)
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update-not-available')
  })

  autoUpdater.on('download-progress', (progressInfo) => {
    mainWindow.webContents.send('download-progress', progressInfo)
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded')
  })

  autoUpdater.on('error', (error) => {
    console.error('Auto-update error:', error)
    mainWindow.webContents.send('update-error', error?.message || String(error))
  })

  // 앱 시작 후 자동 업데이트 확인 (5초 딜레이)
  if (!is.dev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.error('Auto-update check failed:', err)
      })
    }, 5000)
  }
}

/**
 * UniPedia 관련 IPC 핸들러
 * Main 프로세스에서 백엔드 REST API를 호출하고 렌더러에 결과를 전달합니다.
 */
function registerUnipediaHandlers(): void {
  const BASE_URL = 'http://192.168.10.122:3001/api'

  ipcMain.handle('unipedia:chat', async (_event, query: string) => {
    try {
      const res = await fetch(`${BASE_URL}/unipedia/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(60_000),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const status = res.status
        if (status === 429) {
          return { success: false, error: 'RATE_LIMITED' }
        }
        if (status === 503) {
          return { success: false, error: 'SERVICE_UNAVAILABLE' }
        }
        return { success: false, error: 'SERVER_ERROR', message: (body as { error?: string }).error ?? `HTTP ${status}` }
      }

      return await res.json()
    } catch (err: unknown) {
      const e = err as { name?: string; code?: string }
      if (e.name === 'TimeoutError' || e.name === 'AbortError' || e.code === 'ECONNREFUSED') {
        return { success: false, error: 'CONNECTION_FAILED' }
      }
      return { success: false, error: 'UNKNOWN' }
    }
  })
}

/**
 * 개별 스케줄에 대한 알림 표시
 * - 앱 포커스 상태: 렌더러로 IPC 전송 → 인앱 토스트
 * - 앱 비포커스 상태: Windows 네이티브 알림
 */
function showScheduleNotification(schedule: { id: number; text: string; clientName?: string | null }): void {
  if (notifiedSchedules.has(schedule.id)) return

  const title = schedule.clientName
    ? `[${schedule.clientName}] 스케줄 마감`
    : '스케줄 마감 알림'

  const isFocused =
    storedMainWindow &&
    !storedMainWindow.isDestroyed() &&
    storedMainWindow.isFocused()

  if (isFocused) {
    // 앱이 포커스 상태 → 인앱 토스트
    storedMainWindow!.webContents.send('schedule:notify', {
      title,
      body: schedule.text,
    })
  } else {
    // 앱이 비포커스 상태 → Windows 네이티브 알림
    if (Notification.isSupported()) {
      const notification = new Notification({
        title,
        body: schedule.text,
      })

      notification.on('click', () => {
        if (storedMainWindow && !storedMainWindow.isDestroyed()) {
          if (!storedMainWindow.isVisible()) storedMainWindow.show()
          storedMainWindow.focus()
        }
      })

      notification.show()
    }
  }

  // 알람 보낸 스케줄로 기록
  notifiedSchedules.add(schedule.id)

  // 1시간 후에 알람 기록 삭제 (재알람 가능하도록)
  setTimeout(() => {
    notifiedSchedules.delete(schedule.id)
  }, 60 * 60 * 1000)
}

/**
 * dueTime("HH:mm") 문자열을 시/분으로 분해
 */
function parseDueTime(dueTime?: string | null): { hours: number; minutes: number } {
  let hours = 0
  let minutes = 0
  if (dueTime) {
    const parts = dueTime.split(':')
    hours = Number(parts[0])
    minutes = Number(parts[1])
  }
  return { hours, minutes }
}

/**
 * 매주/매월 반복 일정의 다음 알림 시각 계산
 * - weekly: repeatValue = 요일 (0:일 ~ 6:토)
 * - monthly: repeatValue = 일자 (1~31, 해당 월에 없는 날짜면 말일로 보정)
 */
function getNextRepeatOccurrence(
  repeatType: string,
  repeatValue: number,
  dueTime: string | null | undefined,
  from: Date,
): Date | null {
  const { hours, minutes } = parseDueTime(dueTime)

  if (repeatType === 'weekly') {
    const candidate = new Date(from.getFullYear(), from.getMonth(), from.getDate(), hours, minutes, 0, 0)
    let diff = (repeatValue - candidate.getDay() + 7) % 7
    if (diff === 0 && candidate.getTime() <= from.getTime()) diff = 7
    candidate.setDate(candidate.getDate() + diff)
    return candidate
  }

  if (repeatType === 'monthly') {
    const buildDate = (year: number, month: number): Date => {
      // 해당 월의 마지막 날짜로 보정 (ex. 2월 30일 → 2월 28/29일)
      const lastDay = new Date(year, month + 1, 0).getDate()
      const day = Math.min(repeatValue, lastDay)
      return new Date(year, month, day, hours, minutes, 0, 0)
    }

    let year = from.getFullYear()
    let month = from.getMonth()
    let candidate = buildDate(year, month)

    if (candidate.getTime() <= from.getTime()) {
      month += 1
      if (month > 11) {
        month = 0
        year += 1
      }
      candidate = buildDate(year, month)
    }

    return candidate
  }

  return null
}

/**
 * 개별 스케줄에 대한 타이머 설정
 * - 일반 일정: dueDate + dueTime 기준 1회성 알림
 * - 반복 일정(매주/매월): repeatType + repeatValue + dueTime 기준으로 다음 알림 시각 계산 후,
 *   알림 표시 시 다음 회차를 다시 계산해 재설정 (영구 반복)
 */
function scheduleNotification(schedule: {
  id: number
  text: string
  dueDate?: string | Date | null
  dueTime?: string | null
  clientName?: string | null
  completed: number
  repeatType?: string
  repeatValue?: number | null
}): void {
  // 기존 타이머가 있으면 제거
  const existingTimer = scheduleTimers.get(schedule.id)
  if (existingTimer) {
    clearTimeout(existingTimer)
    scheduleTimers.delete(schedule.id)
  }

  // 완료된 스케줄은 알림을 설정하지 않음
  if (schedule.completed) return

  const now = new Date()
  const isRepeating = !!schedule.repeatType && schedule.repeatType !== 'none'

  let notifyAt: Date | null = null

  if (isRepeating) {
    if (schedule.repeatValue === null || schedule.repeatValue === undefined) return
    notifyAt = getNextRepeatOccurrence(schedule.repeatType!, schedule.repeatValue, schedule.dueTime, now)
  } else {
    if (!schedule.dueDate) return

    // ISO 문자열에서 날짜 부분(YYYY-MM-DD)만 추출 후 로컬 시간으로 조합
    const dueDateStr = typeof schedule.dueDate === 'string'
      ? schedule.dueDate
      : schedule.dueDate.toISOString()
    const datePart = dueDateStr.substring(0, 10) // "2025-01-15"
    const [year, month, day] = datePart.split('-').map(Number)
    const { hours, minutes } = parseDueTime(schedule.dueTime)

    // 로컬 시간 기준으로 알림 시각 생성
    notifyAt = new Date(year, month - 1, day, hours, minutes, 0, 0)
  }

  if (!notifyAt) return

  const timeDiff = notifyAt.getTime() - now.getTime()

  // 이미 지난 시간이면 리턴 (반복 일정은 항상 미래 시각만 계산되므로 해당 없음)
  if (timeDiff < 0) return

  // 최대 타이머 시간 제한 (약 24.8일)
  const MAX_TIMEOUT = 2147483647

  if (timeDiff <= MAX_TIMEOUT) {
    // 정확한 시간에 알람 설정
    const timer = setTimeout(() => {
      showScheduleNotification(schedule)
      scheduleTimers.delete(schedule.id)

      // 반복 일정이면 다음 회차 알림을 다시 계산해 설정
      if (isRepeating) {
        scheduleNotification(schedule)
      }
    }, timeDiff)

    scheduleTimers.set(schedule.id, timer)
  }
}

/**
 * 모든 스케줄에 대한 알람 타이머 재설정
 */
export function setupAllScheduleNotifications(): void {
  try {
    // 모든 기존 타이머 제거
    scheduleTimers.forEach((timer) => clearTimeout(timer))
    scheduleTimers.clear()

    // 모든 스케줄 가져오기
    const schedules = getAllSchedules()

    // 각 스케줄에 대해 타이머 설정
    schedules.forEach((schedule) => {
      scheduleNotification(schedule)
    })

    console.log(`Set up notifications for ${scheduleTimers.size} schedules`)
  } catch (error) {
    console.error('Setup schedule notifications error:', error)
  }
}
