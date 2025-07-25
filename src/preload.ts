import { contextBridge, ipcRenderer } from "electron";
import type { IpcApi } from "./ipcApi";
import { IpcMessages } from "./ipcMessages";

const ipcApi: IpcApi = {
  selectTemplateFile: () =>
    ipcRenderer.invoke(IpcMessages.SELECT_TEMPLATE_FILE),
  selectDatasheetFile: () =>
    ipcRenderer.invoke(IpcMessages.SELECT_DATASHEET_FILE),
  submitForm: (input) => ipcRenderer.invoke(IpcMessages.SUBMIT_FORM, input),
};

contextBridge.exposeInMainWorld("ipcApi", ipcApi);
