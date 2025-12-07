import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  onThemeChange: (callback: (isDark: boolean) => void) => {
    ipcRenderer.on('theme-changed', (_event, isDark) => callback(isDark))
  },
  closeNotification: () => {
    ipcRenderer.send('close-notification')
  }
}

// Always use contextBridge for security
// Context isolation should always be enabled for security reasons
try {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('electronAPI', api)
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  console.error('Failed to expose APIs to main world:', error)
  // If contextBridge fails, it means context isolation is not enabled
  // This is a security issue and should be addressed in main process
  throw new Error('Context isolation must be enabled for security')
}
