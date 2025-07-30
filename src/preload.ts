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
