import { app, shell, BrowserWindow, ipcMain, nativeTheme, Tray, Menu, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, closeDatabase } from './database'
import { registerIpcHandlers, setupAllScheduleNotifications } from './ipcHandlers'

let mainWindow: BrowserWindow | null = null
let splashWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

function createSplashWindow(): void {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    transparent: false,
    frame: false,
    alwaysOnTop: true,
    center: true,
    skipTaskbar: true,
    resizable: false,
    icon: icon,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0f172a' : '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js')
    }
  })

  // 로딩 화면 HTML 파일 로드
  if (is.dev) {
    splashWindow.loadFile(join(__dirname, '../../resources/splash.html'))
  } else {
    splashWindow.loadFile(join(process.resourcesPath, 'splash.html'))
  }

  // 로딩 창이 준비되면 다크모드 상태 전송
  splashWindow.webContents.on('did-finish-load', () => {
    const isDarkMode = nativeTheme.shouldUseDarkColors
    splashWindow?.webContents.send('theme-changed', isDarkMode)
  })

  // 다크모드 변경 감지
  nativeTheme.on('updated', () => {
    const isDarkMode = nativeTheme.shouldUseDarkColors
    splashWindow?.webContents.send('theme-changed', isDarkMode)
  })
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0f172a' : '#ffffff',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    // 최소 1.5초간 로딩 창 표시를 위한 타이머
    setTimeout(() => {
      // 로딩 창 닫기
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close()
        splashWindow = null
      }
      mainWindow?.show()
    }, 1500)
  })

  // 창 닫기 버튼을 눌렀을 때 최소화로 변경
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
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

function createTray(): void {
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Work Management 열기',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: '종료',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('Work Management')
  tray.setContextMenu(contextMenu)

  // 트레이 아이콘 클릭 시 창 표시
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
}

// GPU 캐시 오류 방지를 위한 설정
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
app.commandLine.appendSwitch('disable-gpu-program-cache')

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

  // Geolocation 권한 자동 허용
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'geolocation') {
      callback(true) // 위치 정보 권한 허용
    } else {
      callback(false)
    }
  })

  // Initialize database
  initDatabase()

  // Create splash window first
  createSplashWindow()

  // Create main window
  createWindow()

  // Create system tray
  createTray()

  // Register all IPC handlers
  if (mainWindow) {
    registerIpcHandlers(mainWindow)
  }

  // Setup schedule notification timers for all existing schedules
  setupAllScheduleNotifications()

  // 앱 종료 IPC 핸들러
  ipcMain.on('quit-app', () => {
    isQuitting = true
    app.quit()
  })

  // 창 최소화 IPC 핸들러
  ipcMain.on('minimize-window', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide()
    }
  })

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
