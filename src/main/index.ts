import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import {
  initDatabase,
  closeDatabase,
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

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // DevTools 콘솔 오류 무시 설정
  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow?.webContents.executeJavaScript(`
      const originalError = console.error;
      console.error = function(...args) {
        const message = args.join(' ');
        if (message.includes('Autofill.enable') || message.includes('Autofill.setAddresses')) {
          return;
        }
        originalError.apply(console, args);
      };
    `)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize database
  initDatabase()

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Database IPC handlers
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

  // Memo IPC handlers
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

  // TodoStats IPC handlers
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

  // UserInfo IPC handlers
  ipcMain.handle('userInfo:get', () => {
    return getUserInfo()
  })

  ipcMain.handle('userInfo:createOrUpdate', (_event, userInfo) => {
    return createOrUpdateUserInfo({
      name: userInfo.name,
      birthday: userInfo.birthday
    })
  })

  // Auto-updater IPC handlers
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
    return app.getVersion()
  })

  // Auto-updater configuration
  if (process.platform === 'darwin') {
    autoUpdater.allowDowngrade = false
    autoUpdater.autoDownload = false
  }

  // Auto-updater events
  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', info)
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update-not-available')
  })

  autoUpdater.on('download-progress', (progressInfo) => {
    mainWindow?.webContents.send('download-progress', progressInfo)
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-downloaded')
  })

  autoUpdater.on('error', (error) => {
    console.error('Auto-update error:', error)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
