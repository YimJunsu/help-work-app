import { ElectronAPI } from '@electron-toolkit/preload'

interface ExtendedElectronAPI extends ElectronAPI {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => void
    on: (channel: string, func: (...args: any[]) => void) => void
    removeAllListeners: (channel: string) => void
    invoke: (channel: string, ...args: any[]) => Promise<any>
  }
}

declare global {
  interface Window {
    electron: ExtendedElectronAPI
    api: unknown
  }
}
