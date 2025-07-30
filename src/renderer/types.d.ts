import type { IpcApi } from "../ipcApi"

declare global {
  interface Window {
    ipcApi: IpcApi;
    settingsApi: {
      load: () => Promise<any>;
      save: (settings: any) => Promise<void>;
    };
  }
}
