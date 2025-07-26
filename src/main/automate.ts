// Based from https://github.com/Billy19191/automate-word-insert/blob/main/automate.mjs

import util from "node:util";
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import libre from "libreoffice-convert";
import type { IpcSubmitFormInput } from "../ipcApi";

const convert = util.promisify(libre.convert)

export async function generateDocs({
  templateFileName,
  datasheetFileName,
  suffix,
}: IpcSubmitFormInput) {
  try {
    const outputDir = "output";
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(datasheetFileName);
    const worksheet = workbook.getWorksheet(1);

    const templateContent = fs.readFileSync(templateFileName, "binary");

    let successCount = 0;
    let errorCount = 0;

    for (const row of worksheet?.getRows(2, worksheet.rowCount - 1) || []) {
      const companyHeader = row.getCell("A").text?.trim() || "";
      const companyNumber = row.getCell("B").text?.trim() || "";
      const companyInitial = row.getCell("C").text?.trim() || "";
      const dueDate = row.getCell("D").text?.trim() || "";
      const address = row.getCell("E").text?.trim() || "";

      if (
        !companyHeader ||
        !companyNumber ||
        !companyInitial ||
        !dueDate ||
        !address
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
          CompanyNumber: companyNumber,
          CompanyInitial: companyInitial,
          CompanyHeader: companyHeader,
          DueDate: dueDate,
          Address: address,
        });

        const docBuffer = doc.getZip().generate({ type: "nodebuffer" });
        const docxFilename = `${companyNumber}_${companyInitial}${suffix}.docx`;
        const docxPath = path.join(outputDir, docxFilename);
        fs.writeFileSync(docxPath, docBuffer);

        try {
          const pdfBuffer = await convert(docBuffer, ".pdf", undefined)
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
    }

    console.log(`\nProcess completed!`);
    console.log(`Successful: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
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
