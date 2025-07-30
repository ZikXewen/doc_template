import { FormEvent, useEffect, useState } from "react";

function truncate(path: string, len = 30) {
  if (path.length <= len) return path;
  return "..." + path.slice(-len);
}

export default function App() {
  const [templateFileName, setTemplateFileName] = useState("");
  const [datasheetFileName, setDatasheetFileName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

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
    setProgress(null); // Reset progress bar at start
    const ok = await window.ipcApi.submitForm({
      templateFileName,
      datasheetFileName,
      suffix,
    });
    if (ok) alert("Templating successful");
    else alert("An error occurred!");
    setIsSubmitting(false);
    setProgress(null); // Hide progress bar after done
  };

  useEffect(() => {
    const handler = (data: { current: number; total: number }) => {
      console.log("Progress event received", data);
      setProgress(data);
    };
    window.electron?.ipcRenderer?.on("progress", handler);
    return () => {
      window.electron?.ipcRenderer?.removeListener("progress", handler);
    };
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f8f9fa"
    }}>
      <form
        onSubmit={submitForm}
        className="form"
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          padding: "2rem 2.5rem",
          minWidth: 340,
          maxWidth: 380,
          width: "100%",
        }}
      >
        <h1 style={{ marginBottom: "1.2rem", fontSize: "1.6rem" }}>Document Templater</h1>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label htmlFor="selectTemplate">Template File</label>
          <input
            type="button"
            id="selectTemplate"
            name="selectTemplate"
            onClick={selectTemplateFile}
            value={truncate(templateFileName) || "Browse"}
            className="button"
            style={{ marginBottom: 0 }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label htmlFor="selectDatasheet">Datasheet File</label>
          <input
            type="button"
            id="selectDatasheet"
            name="selectDatasheet"
            onClick={selectDatasheetFile}
            value={truncate(datasheetFileName) || "Browse"}
            className="button"
            style={{ marginBottom: 0 }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: "1.2rem" }}>
          <label htmlFor="suffix">Output File Suffix</label>
          <input
            type="text"
            id="suffix"
            name="suffix"
            value={suffix}
            onChange={(e) => setSuffix(e.currentTarget.value)}
            className="input"
            style={{ marginBottom: 0 }}
          />
        </div>
        <input
          type="submit"
          value={isSubmitting ? "Loading..." : "Submit"}
          disabled={!canSubmit}
          className="submit-button"
          style={{ marginBottom: "0.7rem" }}
        />
        <button
          type="button"
          className="button"
          style={{
            marginBottom: "0.7rem",
            background: "#e9ecef",
            color: "#222",
            border: "1px solid #ccc"
          }}
          onClick={() => window.ipcApi.openOutputFolder()}
        >
          Open Output Folder
        </button>
        {isSubmitting && (
          <button
            type="button"
            className="button"
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              marginBottom: "0.7rem"
            }}
            onClick={async () => {
              await window.ipcApi.cancelOperation();
              setIsSubmitting(false);
            }}
          >
            Cancel Operation
          </button>
        )}
        {progress && (
          <div style={{ width: "100%", margin: "0.5rem 0" }}>
            <div style={{
              width: "100%",
              background: "#e9ecef",
              borderRadius: 6,
              overflow: "hidden",
              height: 18,
              marginBottom: 2,
            }}>
              <div
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                  background: "#007bff",
                  height: "100%",
                  transition: "width 0.2s",
                }}
              />
            </div>
            <div style={{ textAlign: "center", fontSize: "0.95rem" }}>
              {progress.current} / {progress.total} processed
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
