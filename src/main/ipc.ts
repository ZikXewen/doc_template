import { app, dialog, ipcMain, shell } from "electron";
import type { IpcSubmitFormInput } from "../ipcApi";
import { IpcMessages } from "../ipcMessages";
import { generateDocs } from "./automate";
import * as path from "path";

let cancelRequested = false;

export function setupIpcListeners() {
  ipcMain.handle(IpcMessages.SELECT_TEMPLATE_FILE, selectTemplateFile);
  ipcMain.handle(IpcMessages.SELECT_DATASHEET_FILE, selectDatasheetFile);
  ipcMain.handle(IpcMessages.SUBMIT_FORM, (_, input: IpcSubmitFormInput) =>
    submitForm(input),
  );
  ipcMain.handle(IpcMessages.OPEN_OUTPUT_FOLDER, openOutputFolder);
  ipcMain.handle(IpcMessages.CANCEL_OPERATION, () => {
    cancelRequested = true;
  });
}

async function openOutputFolder() {
  // Use process.resourcesPath in production, app.getAppPath() in dev
  const isPackaged = app.isPackaged;
  const basePath = isPackaged ? process.resourcesPath : app.getAppPath();
  // Go up one directory from resourcesPath to reach the exe folder
  const outputPath = isPackaged
    ? path.join(process.resourcesPath, "..", "output")
    : path.join(app.getAppPath(), "output");
  await shell.openPath(outputPath);
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
  cancelRequested = false;
  return await generateDocs(input, () => cancelRequested);
}
