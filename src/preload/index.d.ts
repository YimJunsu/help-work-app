import { ElectronAPI } from '@electron-toolkit/preload'

interface ExtendedElectronAPI extends ElectronAPI {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => void
    on: (channel: string, func: (...args: any[]) => void) => void
    removeAllListeners: (channel: string) => void
    invoke: (channel: string, ...args: any[]) => Promise<any>
  }
}

interface AppAPI {
  onThemeChange: (callback: (isDark: boolean) => void) => void
  onScheduleNotify: (callback: (data: { title: string; body: string }) => void) => void
  closeNotification: () => void
}

declare global {
  interface Window {
    electron: ExtendedElectronAPI
    api: AppAPI
    electronAPI: AppAPI
  }
}
