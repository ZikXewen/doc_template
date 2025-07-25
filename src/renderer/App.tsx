import { FormEvent, useState } from "react";

export default function App() {
  const [templateFileName, setTemplateFileName] = useState("");
  const [datasheetFileName, setDatasheetFileName] = useState("");
  const [suffix, setSuffix] = useState("");

  const canSubmit = templateFileName && datasheetFileName && suffix;

  const selectTemplateFile = async () => {
    const file = await window.ipcApi.selectTemplateFile();
    if (file) setTemplateFileName(file);
  };

  const selectDatasheetFile = async () => {
    const file = await window.ipcApi.selectDatasheetFile();
    if (file) setDatasheetFileName(file);
  };

  const submitForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const ok = await window.ipcApi.submitForm({
      templateFileName,
      datasheetFileName,
      suffix,
    });
    if (ok) alert("Templating successful");
    else alert("An error occurred!");
  };

  return (
    <form onSubmit={submitForm}>
      <label htmlFor="selectTemplate">Select Template File</label>
      <input
        type="button"
        id="selectTemplate"
        name="selectTemplate"
        onClick={selectTemplateFile}
        value="Browse"
      />
      <label htmlFor="selectDatasheet">Select Datasheet File</label>
      <input
        type="button"
        id="selectDatasheet"
        name="selectDatasheet"
        onClick={selectDatasheetFile}
        value="Browse"
      />
      <label htmlFor="suffix">Output File Suffix</label>
      <input
        type="text"
        id="suffix"
        name="suffix"
        value={suffix}
        onChange={(e) => {
          setSuffix(e.currentTarget.value);
        }}
      />
      <input type="submit" value="Submit" disabled={!canSubmit} />
    </form>
  );
}
