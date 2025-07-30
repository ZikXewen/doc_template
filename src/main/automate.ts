// Based from https://github.com/Billy19191/automate-word-insert/blob/main/automate.mjs

import util from "node:util";
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import libre from "libreoffice-convert";
import type { IpcSubmitFormInput } from "../ipcApi";
import { BrowserWindow } from "electron";

const convert = util.promisify(libre.convert);

export async function generateDocs(
  { templateFileName, datasheetFileName, suffix }: IpcSubmitFormInput,
  isCancelled?: () => boolean
) {
  try {
    const outputDir = "output";
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(datasheetFileName);
    const worksheet = workbook.getWorksheet(1);

    const templateContent = fs.readFileSync(templateFileName, "binary");

    let successCount = 0;
    let errorCount = 0;

    const rows = worksheet?.getRows(2, worksheet.rowCount - 1) || [];
    const total = rows.length;

    // Get the main window to send progress
    const win = BrowserWindow.getAllWindows()[0];

    let current = 0;
    for (const row of rows) {
      const companyHeader = row.getCell("A").text?.trim() || "";
      const companyNumber = row.getCell("B").text?.trim() || "";
      const companyInitial = row.getCell("C").text?.trim() || "";
      const input1 = row.getCell("D").text?.trim() || "";
      const input2 = row.getCell("E").text?.trim() || "";
      const input3 = row.getCell("F").text?.trim() || "";
      const input4 = row.getCell("G").text?.trim() || "";
      const input5 = row.getCell("G").text?.trim() || "";

      if (isCancelled && isCancelled()) {
        console.log("Operation cancelled by user.");
        break;
      }

      if (
        !companyHeader ||
        !companyNumber ||
        !companyInitial ||
        !input1 ||
        !input2 ||
        !input3 ||
        !input4 ||
        !input5
      ) {
        console.log(`Skipping row with missing data: ${companyNumber}`);
        continue;
      }

      try {
        const docZip = new PizZip(templateContent);
        const doc = new Docxtemplater(docZip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        doc.render({
          CompanyHeader: companyHeader,
          CompanyNumber: companyNumber,
          CompanyInitial: companyInitial,
          Input1: input1,
          Input2: input2,
          Input3: input3,
          Input4: input4,
          Input5: input5,
        });

        const docBuffer = doc.getZip().generate({ type: "nodebuffer" });
        const docxFilename = `${companyNumber}_${companyInitial}${suffix}.docx`;
        const docxPath = path.join(outputDir, docxFilename);
        fs.writeFileSync(docxPath, docBuffer);

        try {
          const pdfBuffer = await convert(docBuffer, ".pdf", undefined);
          const pdfFilename = `${companyNumber}_${companyInitial}${suffix}.pdf`;
          const pdfPath = path.join(outputDir, pdfFilename);
          fs.writeFileSync(pdfPath, pdfBuffer);
          console.log(`Generated PDF: ${pdfFilename}`);
          successCount++;
        } catch (pdfError) {
          console.error(
            `PDF conversion failed for ${companyNumber}:`,
            (pdfError as Error).message,
          );
        }
      } catch (renderError) {
        console.error(
          `Failed to process row ${companyNumber}:`,
          (renderError as Error).message,
        );
        errorCount++;
      }

      current++;
      // Send progress to renderer
      console.log("Sending progress", { current, total });
      win?.webContents.send("progress", { current, total });
    }

    console.log(`\nProcess completed!`);
    console.log(`Successful: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    // Send 100% progress at the end
    win?.webContents.send("progress", { current: total, total });

    return true;
  } catch (error: unknown) {
    if (!(error instanceof Error) || error.name !== "TemplateError") {
      console.error("An unexpected error occurred: ", error);
    } else {
      console.error("\nTEMPLATE FORMATTING ERROR");
      console.error(
        "Your Word document has formatting issues that break the template variables.",
      );
      console.error("\nTO FIX:");
      console.error("1. Open mailmerge.docx in Microsoft Word");
      console.error("2. Select all text (Ctrl+A)");
      console.error("3. Remove formatting (Ctrl+Shift+N)");
      console.error(
        "4. Make sure variables like {{CompanyHeader}} are typed fresh",
      );
      console.error("5. Save and try again");
    }
    return false;
  }
}
