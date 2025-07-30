import { app, dialog, ipcMain, shell } from "electron";
import type { IpcSubmitFormInput } from "../ipcApi";
import { IpcMessages } from "../ipcMessages";
import { generateDocs, previewTemplateAndSheet } from "./automate";
import * as path from "path";
import fs from "node:fs";

let cancelRequested = false;

const SETTINGS_FILE = path.join(app.getPath("userData"), "settings.json");

type Settings = {
  templateFileName?: string;
  datasheetFileName?: string;
  suffix?: string;
  outputDir?: string;
};

function loadSettings(): Settings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

function saveSettings(settings: Settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch {}
}

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
  ipcMain.handle(IpcMessages.PREVIEW_TEMPLATE_AND_SHEET, async (_, templateFileName: string, datasheetFileName: string) => {
    return await previewTemplateAndSheet(templateFileName, datasheetFileName);
  });
  ipcMain.handle("load_settings", () => loadSettings());
  ipcMain.handle("save_settings", (_event, settings: Settings) => saveSettings(settings));
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
