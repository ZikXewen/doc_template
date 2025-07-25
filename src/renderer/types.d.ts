import type { IpcApi } from "../ipcApi"

declare global {
  interface Window {
    ipcApi: IpcApi
  }
}
