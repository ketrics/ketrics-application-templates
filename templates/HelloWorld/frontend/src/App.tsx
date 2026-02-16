import { useState } from "react";
import { apiClient } from "./services";

function App() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runFunction = async (fnName: string, payload?: unknown) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiClient.run(fnName, payload);
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fnName: string, payload?: unknown) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiClient.run(fnName, payload);
      const downloadUrl = data?.result?.downloadUrl;
      if (downloadUrl) {
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setResult(`Download started. URL: ${downloadUrl}`);
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>Ketrics Application</h1>
      <p className="subtitle">SDK Feature Examples</p>

      <div className="sections">
        <div className="section">
          <h2>General</h2>
          <div className="button-group">
            <button onClick={() => runFunction("echo", { message: "Hello!" })} className="button" disabled={loading}>
              Echo
            </button>
            <button onClick={() => runFunction("info")} className="button" disabled={loading}>
              Info
            </button>
            <button onClick={() => runFunction("fetchExternalApi")} className="button" disabled={loading}>
              HTTP Request
            </button>
          </div>
        </div>

        <div className="section">
          <h2>Volumes</h2>
          <div className="button-group">
            <button onClick={() => runFunction("saveFile")} className="button" disabled={loading}>
              Save File
            </button>
            <button onClick={() => runFunction("readFile")} className="button" disabled={loading}>
              Read File
            </button>
            <button onClick={() => runFunction("listFiles", { prefix: "output/" })} className="button" disabled={loading}>
              List Files
            </button>
            <button onClick={() => handleDownload("generateDownloadUrl")} className="button" disabled={loading}>
              Download File
            </button>
            <button onClick={() => runFunction("copyFile")} className="button" disabled={loading}>
              Copy File
            </button>
          </div>
        </div>

        <div className="section">
          <h2>Database</h2>
          <div className="button-group">
            <button onClick={() => runFunction("queryUsers", { limit: 5 })} className="button" disabled={loading}>
              Query Users
            </button>
            <button onClick={() => runFunction("insertRecord", { name: "Test User", email: "test@example.com" })} className="button" disabled={loading}>
              Insert Record
            </button>
            <button onClick={() => runFunction("transferFunds", { fromAccountId: 1, toAccountId: 2, amount: 100 })} className="button" disabled={loading}>
              Transfer Funds
            </button>
          </div>
        </div>

        <div className="section">
          <h2>Documents</h2>
          <div className="button-group">
            <button onClick={() => handleDownload("createSimplePdf")} className="button" disabled={loading}>
              Create PDF
            </button>
            <button onClick={() => handleDownload("createInvoicePdf")} className="button" disabled={loading}>
              Create Invoice PDF
            </button>
            <button onClick={() => handleDownload("createSpreadsheet")} className="button" disabled={loading}>
              Create Spreadsheet
            </button>
            <button onClick={() => handleDownload("exportDataToExcel")} className="button" disabled={loading}>
              Export to Excel
            </button>
          </div>
        </div>

        <div className="section">
          <h2>Messaging & Jobs</h2>
          <div className="button-group">
            <button onClick={() => runFunction("sendNotification", { subject: "Test", body: "Hello from the app!" })} className="button" disabled={loading}>
              Send Notification
            </button>
            <button onClick={() => runFunction("scheduleBackgroundJob")} className="button" disabled={loading}>
              Schedule Job
            </button>
            <button onClick={() => runFunction("getSecret")} className="button" disabled={loading}>
              Get Secret
            </button>
          </div>
        </div>
      </div>

      {loading && <p className="loading">Running...</p>}
      {error && <p className="error">{error}</p>}
      {result && (
        <div className="result">
          <pre>{result}</pre>
        </div>
      )}

      <div className="info">
        <h2>About</h2>
        <p>This application demonstrates the Ketrics SDK features:</p>
        <ul>
          <li>Volume storage (save, read, list, download, copy files)</li>
          <li>Database connections (query, insert, transactions)</li>
          <li>PDF document generation (simple and invoice-style)</li>
          <li>Excel workbook creation (single and multi-sheet)</li>
          <li>User messaging and notifications</li>
          <li>Background job scheduling</li>
          <li>Secret management</li>
          <li>External HTTP requests</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
