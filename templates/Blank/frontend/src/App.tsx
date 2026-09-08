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

  return (
    <div className="app">
      <h1>Ketrics Application</h1>
      <p className="subtitle">
        Blank Template{permissions.userName ? ` — ${permissions.userName}` : ""}
      </p>

      <div className="section">
        <div className="button-group">
          {permissions.canRead && (
            <button
              onClick={() => runFunction("echo", { message: "Hello from Ketrics!" })}
              className="button"
              disabled={loading}
            >
              Echo
            </button>
          )}
          {permissions.canRead && (
            <button onClick={() => runFunction("greet")} className="button" disabled={loading}>
              Greet
            </button>
          )}
          {permissions.canWrite && (
            <button
              onClick={() => runFunction("notifyMe", { subject: "Hello", body: "Sent from the Blank template." })}
              className="button"
              disabled={loading}
            >
              Notify Me
            </button>
          )}
        </div>
      </div>

      {loading && <p className="loading">Running...</p>}
      {error && <p className="error">{error}</p>}
      {result && (
        <div className="result">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
