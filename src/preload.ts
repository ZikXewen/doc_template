import { contextBridge, ipcRenderer } from "electron";
import type { IpcApi } from "./ipcApi";
import { IpcMessages } from "./ipcMessages";

const ipcApi: IpcApi = {
  selectTemplateFile: () =>
    ipcRenderer.invoke(IpcMessages.SELECT_TEMPLATE_FILE),
  selectDatasheetFile: () =>
    ipcRenderer.invoke(IpcMessages.SELECT_DATASHEET_FILE),
  submitForm: (input) => ipcRenderer.invoke(IpcMessages.SUBMIT_FORM, input),
  openOutputFolder: () => ipcRenderer.invoke(IpcMessages.OPEN_OUTPUT_FOLDER),
  cancelOperation: () => ipcRenderer.invoke(IpcMessages.CANCEL_OPERATION),
  previewTemplateAndSheet: (templateFileName, datasheetFileName) =>
    ipcRenderer.invoke(IpcMessages.PREVIEW_TEMPLATE_AND_SHEET, templateFileName, datasheetFileName),
};

contextBridge.exposeInMainWorld("ipcApi", ipcApi);
contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    on: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    },
    removeListener: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, func);
    },
  },
});
contextBridge.exposeInMainWorld("settingsApi", {
  load: () => ipcRenderer.invoke("load_settings"),
  save: (settings: any) => ipcRenderer.invoke("save_settings", settings),
});
