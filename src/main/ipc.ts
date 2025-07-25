import { dialog, ipcMain } from "electron";
import type { IpcSubmitFormInput } from "../ipcApi";
import { IpcMessages } from "../ipcMessages";

export function setupIpcListeners() {
  ipcMain.handle(IpcMessages.SELECT_TEMPLATE_FILE, selectTemplateFile);
  ipcMain.handle(IpcMessages.SELECT_DATASHEET_FILE, selectDatasheetFile);
  ipcMain.handle(IpcMessages.SUBMIT_FORM, (_, input: IpcSubmitFormInput) =>
    submitForm(input),
  );
}

async function selectTemplateFile() {
  const result = await dialog.showOpenDialog({
    title: "Select Template File",
    filters: [{ name: "Documents", extensions: ["doc", "docx"] }],
    properties: ["openFile"],
  });
  if (result.filePaths.length === 1) return result.filePaths[0];
  return null;
}

async function selectDatasheetFile() {
  const result = await dialog.showOpenDialog({
    title: "Select Datasheet File",
    filters: [{ name: "Datasheets", extensions: ["xls", "xlsx"] }],
    properties: ["openFile"],
  });
  if (result.filePaths.length === 1) return result.filePaths[0];
  return null;
}

async function submitForm(input: IpcSubmitFormInput) {
  console.log(IpcMessages.SUBMIT_FORM, input);
}
