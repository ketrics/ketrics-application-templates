import { useEffect, useState } from "react";
import { apiClient } from "./services";
import type { ApiResponse, Permissions } from "./types";

function App() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Capabilities of the current user, reported by the backend. Hiding a button
  // is a convenience only - every handler still calls requirePermission().
  const [permissions, setPermissions] = useState<Permissions>({
    canRead: false,
    canWrite: false,
    canExport: false,
    canApprove: false,
    userId: "",
    userName: "",
  });

  useEffect(() => {
    apiClient
      .run("getPermissions")
      .then((response) => setPermissions((response as ApiResponse<Permissions>).result))
      .catch(() => {
        // An unauthenticated or unauthorised user simply keeps the defaults.
      });
  }, []);

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
      const data = (await apiClient.run(fnName, payload)) as Record<string, unknown> | undefined;
      const downloadUrl = (data?.result as Record<string, unknown> | undefined)?.downloadUrl as string | undefined;
      if (downloadUrl) {
        // The backend sets Content-Disposition: attachment on the presigned
        // URL, so the browser downloads instead of navigating the iframe to S3
        // (which the platform CSP blocks).
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
      <p className="subtitle">
        SDK Feature Examples{permissions.userName ? ` — ${permissions.userName}` : ""}
      </p>

      <div className="sections">
        {permissions.canRead && (
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
        )}

        <div className="section">
          <h2>DocumentDB</h2>
          <div className="button-group">
            {permissions.canWrite && (
              <button
                onClick={() => runFunction("createDocument", { title: "New note", body: "Created from the UI" })}
                className="button"
                disabled={loading}
              >
                Create Note
              </button>
            )}
            {permissions.canRead && (
              <button onClick={() => runFunction("listDocuments", { limit: 20 })} className="button" disabled={loading}>
                List Notes
              </button>
            )}
          </div>
        </div>

        <div className="section">
          <h2>Volumes</h2>
          <div className="button-group">
            {permissions.canWrite && (
              <button onClick={() => runFunction("saveFile")} className="button" disabled={loading}>
                Save File
              </button>
            )}
            {permissions.canRead && (
              <button onClick={() => runFunction("readFile")} className="button" disabled={loading}>
                Read File
              </button>
            )}
            {permissions.canRead && (
              <button onClick={() => runFunction("listFiles", { prefix: "output/" })} className="button" disabled={loading}>
                List Files
              </button>
            )}
            {permissions.canRead && (
              <button onClick={() => handleDownload("generateDownloadUrl")} className="button" disabled={loading}>
                Download File
              </button>
            )}
            {permissions.canWrite && (
              <button onClick={() => runFunction("copyFile")} className="button" disabled={loading}>
                Copy File
              </button>
            )}
          </div>
        </div>

        <div className="section">
          <h2>Database</h2>
          <div className="button-group">
            {permissions.canRead && (
              <button onClick={() => runFunction("queryUsers", { limit: 5 })} className="button" disabled={loading}>
                Query Users
              </button>
            )}
            {permissions.canWrite && (
              <button
                onClick={() => runFunction("insertRecord", { name: "Test User", email: "test@example.com" })}
                className="button"
                disabled={loading}
              >
                Insert Record
              </button>
            )}
            {/* Guarded by "approve", which the approver role grants WITHOUT "write" */}
            {permissions.canApprove && (
              <button
                onClick={() => runFunction("transferFunds", { fromAccountId: 1, toAccountId: 2, amount: 100 })}
                className="button"
                disabled={loading}
              >
                Transfer Funds
              </button>
            )}
          </div>
        </div>

        {permissions.canExport && (
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
        )}

        {permissions.canRead && (
          <div className="section">
            <h2>Configuration</h2>
            <div className="button-group">
              <button onClick={() => runFunction("getSecret")} className="button" disabled={loading}>
                Get Secret
              </button>
              <button onClick={() => runFunction("getAppSettings")} className="button" disabled={loading}>
                Get Parameter
              </button>
              <button onClick={() => runFunction("getOptionalAppSettings")} className="button" disabled={loading}>
                Get Parameter (optional)
              </button>
            </div>
          </div>
        )}

        <div className="section">
          <h2>Messaging &amp; Jobs</h2>
          <div className="button-group">
            {permissions.canRead && (
              <button onClick={() => runFunction("listUsers")} className="button" disabled={loading}>
                List Users
              </button>
            )}
            {permissions.canWrite && (
              <button
                onClick={() => runFunction("sendNotification", { subject: "Test", body: "Hello from the app!" })}
                className="button"
                disabled={loading}
              >
                Send Notification
              </button>
            )}
            {permissions.canWrite && (
              <button onClick={() => runFunction("scheduleBackgroundJob")} className="button" disabled={loading}>
                Schedule Job
              </button>
            )}
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
          <li>DocumentDB storage (pk/sk CRUD with cursor pagination)</li>
          <li>Volume storage (save, read, list, download, copy files)</li>
          <li>SQL data connections (query, insert, transactions)</li>
          <li>Parameters (shared, unencrypted JSON configuration)</li>
          <li>Secret management (encrypted credentials)</li>
          <li>PDF document generation (simple and invoice-style)</li>
          <li>Excel workbook creation (single and multi-sheet)</li>
          <li>User messaging and notifications</li>
          <li>Background job scheduling</li>
          <li>External HTTP requests</li>
        </ul>
        <p>
          Buttons are hidden when the current user lacks the capability. That is a convenience only —
          every backend handler still guards itself with <code>requirePermission()</code>.
        </p>
      </div>
    </div>
  );
}

export default App;
