import { ipcMain, BrowserWindow, screen, shell } from 'electron'
import { join } from 'path'
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

// 현재 표시 중인 알림 창들
const notificationWindows: BrowserWindow[] = []

/**
 * 모든 IPC 핸들러를 등록하는 함수
 */
export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Debug: Get database path
  ipcMain.handle('get-db-path', () => {
    const { app } = require('electron')
    const path = require('path')
    const userDataPath = app.getPath('userData')
    const dbPath = path.join(userDataPath, 'schedules.db')
    console.log('[IPC] Database path:', dbPath)
    return dbPath
  })

  // Schedule IPC handlers
  registerScheduleHandlers()

  // Memo IPC handlers
  registerMemoHandlers()

  // TodoStats IPC handlers
  registerTodoStatsHandlers()

  // UserInfo IPC handlers
  registerUserInfoHandlers()

  // UniPost IPC handlers
  registerUniPostHandlers()

  // Auto-updater IPC handlers
  registerAutoUpdaterHandlers(mainWindow)

  // Notification handlers
  ipcMain.on('close-notification', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      const index = notificationWindows.indexOf(win)
      if (index > -1) {
        notificationWindows.splice(index, 1)
      }
      win.close()
    }
  })

  // Open external URL
  ipcMain.on('open-external', (_event, url: string) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      shell.openExternal(url)
    }
  })
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
      clientName: schedule.clientName,
      requestNumber: schedule.requestNumber,
      webData: schedule.webData
    })

    // 새로 생성된 스케줄에 대한 알람 타이머 설정
    if (newSchedule && newSchedule.dueDate) {
      scheduleNotification(newSchedule)
    }

    return newSchedule
  })

  ipcMain.handle('schedules:update', (_event, id, updates: {
    text?: string
    completed?: boolean
    category?: string
    dueDate?: string | null
    clientName?: string
    requestNumber?: string
    webData?: boolean
  }) => {
    const updatedSchedule = updateSchedule(id, {
      text: updates.text,
      completed: updates.completed,
      category: updates.category,
      dueDate: updates.dueDate !== undefined
        ? updates.dueDate ? new Date(updates.dueDate) : null
        : undefined,
      clientName: updates.clientName,
      requestNumber: updates.requestNumber,
      webData: updates.webData
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
      content: memo.content
    })
  })

  ipcMain.handle('memos:update', (_event, id, updates) => {
    return updateMemo(id, {
      content: updates.content
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
  if (process.platform === 'darwin') {
    autoUpdater.allowDowngrade = false
    autoUpdater.autoDownload = false
  }

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
  })
}

/**
 * 개별 스케줄에 대한 알람 표시
 */
function showScheduleNotification(schedule: { id: number; text: string; clientName?: string | null }): void {
  if (notifiedSchedules.has(schedule.id)) return

  // 화면 정보 가져오기
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  // 알림 창 위치 계산 (우측 하단)
  const notificationWidth = 380
  const notificationHeight = 140
  const margin = 16
  const x = width - notificationWidth - margin
  const y = height - notificationHeight - margin - (notificationWindows.length * (notificationHeight + margin))

  // URL 파라미터 생성
  const params = new URLSearchParams({
    message: schedule.text,
    ...(schedule.clientName && { client: schedule.clientName })
  })

  // 알림 창 생성
  const notificationWindow = new BrowserWindow({
    width: notificationWidth,
    height: notificationHeight,
    x: x,
    y: y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true, // Enable sandbox for security
      devTools: false // Disable DevTools for notification windows
    }
  })

  // HTML 파일 로드
  if (is.dev) {
    notificationWindow.loadFile(join(__dirname, '../../resources/notification.html'), {
      search: params.toString()
    })
  } else {
    notificationWindow.loadFile(join(process.resourcesPath, 'notification.html'), {
      search: params.toString()
    })
  }

  // 창이 준비되면 표시
  notificationWindow.once('ready-to-show', () => {
    notificationWindow.show()
  })

  // 창이 닫히면 배열에서 제거
  notificationWindow.on('closed', () => {
    const index = notificationWindows.indexOf(notificationWindow)
    if (index > -1) {
      notificationWindows.splice(index, 1)
    }
  })

  // 배열에 추가
  notificationWindows.push(notificationWindow)

  // 알람 보낸 스케줄로 기록
  notifiedSchedules.add(schedule.id)

  // 1시간 후에 알람 기록 삭제 (재알람 가능하도록)
  setTimeout(() => {
    notifiedSchedules.delete(schedule.id)
  }, 60 * 60 * 1000)
}

/**
 * 개별 스케줄에 대한 타이머 설정
 */
function scheduleNotification(schedule: { id: number; text: string; dueDate?: string | Date; clientName?: string | null; completed: number }): void {
  // 기존 타이머가 있으면 제거
  const existingTimer = scheduleTimers.get(schedule.id)
  if (existingTimer) {
    clearTimeout(existingTimer)
    scheduleTimers.delete(schedule.id)
  }

  // 완료되었거나 날짜가 없으면 리턴
  if (schedule.completed || !schedule.dueDate) return

  const now = new Date()
  const dueDate = new Date(schedule.dueDate)
  const timeDiff = dueDate.getTime() - now.getTime()

  // 이미 지난 시간이면 리턴
  if (timeDiff < 0) return

  // 최대 타이머 시간 제한 (약 24.8일)
  const MAX_TIMEOUT = 2147483647

  if (timeDiff <= MAX_TIMEOUT) {
    // 정확한 시간에 알람 설정
    const timer = setTimeout(() => {
      showScheduleNotification(schedule)
      scheduleTimers.delete(schedule.id)
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