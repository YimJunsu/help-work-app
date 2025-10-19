import { ipcMain, BrowserWindow } from 'electron'
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

/**
 * 모든 IPC 핸들러를 등록하는 함수
 */
export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Schedule IPC handlers
  registerScheduleHandlers()

  // Memo IPC handlers
  registerMemoHandlers()

  // TodoStats IPC handlers
  registerTodoStatsHandlers()

  // UserInfo IPC handlers
  registerUserInfoHandlers()

  // Auto-updater IPC handlers
  registerAutoUpdaterHandlers(mainWindow)
}

/**
 * Schedule 관련 IPC 핸들러
 */
function registerScheduleHandlers(): void {
  ipcMain.handle('schedules:getAll', () => {
    return getAllSchedules()
  })

  ipcMain.handle('schedules:create', (_event, schedule) => {
    return createSchedule({
      text: schedule.text,
      completed: schedule.completed,
      category: schedule.category,
      dueDate: schedule.dueDate ? new Date(schedule.dueDate) : undefined,
      clientName: schedule.clientName,
      webData: schedule.webData
    })
  })

  ipcMain.handle('schedules:update', (_event, id, updates) => {
    return updateSchedule(id, {
      text: updates.text,
      completed: updates.completed,
      category: updates.category,
      dueDate: updates.dueDate !== undefined
        ? updates.dueDate ? new Date(updates.dueDate) : null
        : undefined
    })
  })

  ipcMain.handle('schedules:delete', (_event, id) => {
    return deleteSchedule(id)
  })

  ipcMain.handle('schedules:deleteCompleted', () => {
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
    return createOrUpdateUserInfo({
      name: userInfo.name,
      birthday: userInfo.birthday
    })
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