import { useState } from "react";
import { apiClient } from "./services";

function App() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runEcho = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiClient.run("echo", { message: "Hello from Ketrics!" });
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
      <p className="subtitle">Blank Template</p>

      <div className="section">
        <button onClick={runEcho} className="button" disabled={loading}>
          {loading ? "Running..." : "Echo"}
        </button>
      </div>

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
