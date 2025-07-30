import { FormEvent, useEffect, useState } from "react";

function truncate(path: string, len = 30) {
  if (path.length <= len) return path;
  return "..." + path.slice(-len);
}

export default function App() {
  const [templateFileName, setTemplateFileName] = useState("");
  const [datasheetFileName, setDatasheetFileName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [rememberDatasheet, setRememberDatasheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [preview, setPreview] = useState<{
    templateVariables: string[];
    datasheetColumns: string[];
  } | null>(null);

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
      setProgress(data);
    };
    window.electron?.ipcRenderer?.on("progress", handler);
    return () => {
      window.electron?.ipcRenderer?.removeListener("progress", handler);
    };
  }, []);

  useEffect(() => {
    // Fetch preview when both files are selected
    if (templateFileName && datasheetFileName) {
      window.ipcApi
        .previewTemplateAndSheet(templateFileName, datasheetFileName)
        .then(setPreview)
        .catch(() => setPreview(null));
    } else {
      setPreview(null);
    }
  }, [templateFileName, datasheetFileName]);



  // Only load datasheet if rememberDatasheet was true last session
  useEffect(() => {
    window.settingsApi?.load().then((settings) => {
      if (settings?.rememberDatasheet) {
        setRememberDatasheet(true);
        if (settings?.datasheetFileName) setDatasheetFileName(settings.datasheetFileName);
      }
    });
  }, []);

  // Save datasheet only if rememberDatasheet is checked
  useEffect(() => {
    if (rememberDatasheet) {
      window.settingsApi?.save({
        datasheetFileName,
        rememberDatasheet: true,
      });
    } else {
      window.settingsApi?.save({
        datasheetFileName: "",
        rememberDatasheet: false,
      });
    }
  }, [datasheetFileName, rememberDatasheet]);

  const buttonStyle = {
    width: "100%",
    marginBottom: "1.2rem",
    background: "#232a34",
    color: "#7ee7ff",
    border: "1.5px solid #7ee7ff",
    fontWeight: 600,
    letterSpacing: "0.02em",
    fontSize: "1.05rem",
    boxShadow: "0 2px 8px #0ff2, 0 0px 1px #fff",
    transition: "background 0.2s",
    borderRadius: 8,
    padding: "0.8rem",
    cursor: "pointer"
  };

  // Validation logic
  const alwaysUsedColumns = ["CompanyNumber", "CompanyInitials"];
  let unusedInTemplate: string[] = [];
  if (preview) {
    const templateVars = preview.templateVariables.map(v => v.trim().toLowerCase());
    const sheetCols = preview.datasheetColumns.map(c => c.trim().toLowerCase());
    unusedInTemplate = preview.datasheetColumns.filter(
      c => !templateVars.includes(c.trim().toLowerCase()) && !alwaysUsedColumns.map(a => a.toLowerCase()).includes(c.trim().toLowerCase())
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(120deg, #181c24 0%, #232a34 100%)",
        fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif",
        color: "#e3e8ef",
        overflow: "hidden",
      }}
    >
      <form
        onSubmit={submitForm}
        style={{
          background: "rgba(36, 44, 62, 0.82)",
          borderRadius: 18,
          boxShadow: "0 4px 32px 0 rgba(0,255,255,0.08), 0 1.5px 0 #7ee7ff44",
          padding: "clamp(1.2rem, 6vw, 2.5rem)",
          minWidth: 280,
          maxWidth: 520,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "1.1rem",
          border: "1.5px solid #7ee7ff33",
          backdropFilter: "blur(8px)",
          position: "relative",
          transition: "padding 0.3s"
        }}
      >
        <h1
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: "2.1rem",
            fontWeight: 800,
            letterSpacing: "0.06em",
            margin: "0 0 1.3rem 0",
            color: "#fff",
            textShadow: "0 0 12px #000, 0 0 2px #000, 0 1px 0 #fff2",
            fontFamily: "'Orbitron', 'Segoe UI', 'Roboto', 'Arial', sans-serif",
            textTransform: "uppercase",
            filter: "brightness(1.15)"
          }}
        >
          Document Templater
        </h1>
        {/* Template Variables Preview */}
        {preview && (
          <div style={{
            margin: "0 0 1.2rem 0",
            padding: "1rem",
            background: "#232a34",
            borderRadius: 8,
            fontSize: "1.01rem",
            border: "1.5px solid #7ee7ff",
            color: "#7ee7ff",
            boxShadow: "0 2px 8px #0ff2, 0 0px 1px #fff"
          }}>
            <div>
              <b>Datasheet Columns:</b>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {preview.datasheetColumns.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            {unusedInTemplate.length > 0 && (
              <div style={{ color: "#ffb347", marginTop: 12 }}>
                <b>Unused in Template:</b>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {unusedInTemplate.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {/* File selectors */}
        <button
          type="button"
          className="button"
          style={{
            ...buttonStyle,
            background: templateFileName ? "#1ecb6b" : buttonStyle.background,
            color: templateFileName ? "#fff" : buttonStyle.color,
            border: templateFileName ? "1.5px solid #1ecb6b" : buttonStyle.border,
          }}
          onClick={selectTemplateFile}
        >
          {templateFileName ? "Template selected" : "Select Template File"}
        </button>
        <button
          type="button"
          className="button"
          style={{
            ...buttonStyle,
            background: datasheetFileName ? "#1ecb6b" : buttonStyle.background,
            color: datasheetFileName ? "#fff" : buttonStyle.color,
            border: datasheetFileName ? "1.5px solid #1ecb6b" : buttonStyle.border,
          }}
          onClick={selectDatasheetFile}
        >
          {datasheetFileName ? "Sheet selected" : "Select Datasheet File"}
        </button>
        {/* Remember checkbox */}
        <label style={{ color: "#7ee7ff", fontSize: "0.98rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={rememberDatasheet}
            onChange={e => setRememberDatasheet(e.target.checked)}
            style={{ accentColor: "#1ecb6b" }}
          />
          Remember datasheet for next session
        </label>
        <button
          type="button"
          className="button"
          style={buttonStyle}
          onClick={() => window.ipcApi.openOutputFolder()}
        >
          Open Output Folder
        </button>
        {/* Output Suffix */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="suffix" style={{ color: "#7ee7ff" }}>Output File Suffix</label>
          <input
            type="text"
            id="suffix"
            name="suffix"
            value={suffix}
            onChange={(e) => setSuffix(e.currentTarget.value)}
            className="input"
            style={{
              marginBottom: 0,
              background: "#232a34",
              color: "#fff",
              border: "1.5px solid #7ee7ff",
              fontWeight: 500,
              fontSize: "1.01rem"
            }}
          />
        </div>
        {/* Submit Button */}
        <input
          type="submit"
          value={isSubmitting ? "Loading..." : "Submit"}
          disabled={!canSubmit}
          className="submit-button"
          style={{
            marginBottom: "0.2rem",
            background: "#7ee7ff",
            color: "#232a34",
            fontWeight: 700,
            fontSize: "1.08rem",
            border: "none",
            boxShadow: "0 2px 8px #0ff2, 0 0px 1px #fff",
            letterSpacing: "0.02em",
            cursor: canSubmit ? "pointer" : "not-allowed"
          }}
        />
        {/* Cancel Button */}
        {isSubmitting && (
          <button
            type="button"
            className="button"
            style={{
              width: "100%",
              marginBottom: "1.2rem",
              background: "#ff3c6a",
              color: "#fff",
              border: "1.5px solid #ff3c6a",
              fontWeight: 600,
              letterSpacing: "0.02em",
              fontSize: "1.05rem",
              boxShadow: "0 2px 8px #ff3c6a44, 0 0px 1px #fff",
              borderRadius: 8,
              padding: "0.8rem",
              cursor: "pointer"
            }}
            onClick={async () => {
              await window.ipcApi.cancelOperation();
              setIsSubmitting(false);
            }}
          >
            Cancel Operation
          </button>
        )}
        {/* Progress Bar */}
        {progress && (
          <div style={{ width: "100%", margin: "0.5rem 0" }}>
            <div style={{
              width: "100%",
              background: "#232a34",
              borderRadius: 6,
              overflow: "hidden",
              height: 18,
              marginBottom: 2,
              border: "1.5px solid #7ee7ff44"
            }}>
              <div
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                  background: "linear-gradient(90deg, #7ee7ff 0%, #00ffd0 100%)",
                  height: "100%",
                  transition: "width 0.2s",
                }}
              />
            </div>
            <div style={{ textAlign: "center", fontSize: "0.95rem", color: "#7ee7ff" }}>
              {progress.current} / {progress.total} processed
            </div>
          </div>
        )}
        <div style={{
          fontSize: "0.93rem",
          color: "#7ee7ff99",
          textAlign: "center",
          marginTop: "0.8rem"
        }}>
          <span style={{ fontWeight: 600 }}>ZikXewen / Osunagi / Billy191</span> &copy; 2025
        </div>
      </form>
    </div>
  );
}
