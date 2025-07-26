import { FormEvent, useState } from "react";

function truncate(path: string, len = 30) {
  if (path.length <= len) return path;
  return "..." + path.slice(-len);
}

export default function App() {
  const [templateFileName, setTemplateFileName] = useState("");
  const [datasheetFileName, setDatasheetFileName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    templateFileName && datasheetFileName && suffix && !isSubmitting;

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
    setIsSubmitting(true);
    const ok = await window.ipcApi.submitForm({
      templateFileName,
      datasheetFileName,
      suffix,
    });
    if (ok) alert("Templating successful");
    else alert("An error occurred!");
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={submitForm} className="form">
      <h1>Document Templater</h1>
      <div className="form-group">
        <label htmlFor="selectTemplate">Template File</label>
        <input
          type="button"
          id="selectTemplate"
          name="selectTemplate"
          onClick={selectTemplateFile}
          value={truncate(templateFileName) || "Browse"}
          className="button"
        />
      </div>
      <div className="form-group">
        <label htmlFor="selectDatasheet">Datasheet File</label>
        <input
          type="button"
          id="selectDatasheet"
          name="selectDatasheet"
          onClick={selectDatasheetFile}
          value={truncate(datasheetFileName) || "Browse"}
          className="button"
        />
      </div>
      <div className="form-group">
        <label htmlFor="suffix">Output File Suffix</label>
        <input
          type="text"
          id="suffix"
          name="suffix"
          value={suffix}
          onChange={(e) => setSuffix(e.currentTarget.value)}
          className="input"
        />
      </div>
      <input
        type="submit"
        value={isSubmitting ? "Loading..." : "Submit"}
        disabled={!canSubmit}
        className="submit-button"
      />
    </form>
  );
}
