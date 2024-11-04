// islands/UrlForm.tsx
import { useState } from "preact/hooks";

export default function UrlForm() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!url) return;

    try {
      const response = await fetch(`/api/fetchCalendar?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      setResult(data.result); // Set the formatted result returned by the API
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Enter URL:
          <input
            type="text"
            value={url}
            onInput={(e) => setUrl(e.currentTarget.value)}
            placeholder="https://example.com"
            required
          />
        </label>
        <button type="submit">Fetch Data</button>
      </form>
      {result && (
        <div>
          <h3>Formatted Result:</h3>
          <pre>
            <code>{result}</code> {/* Render inside <code> tags */}
          </pre>
        </div>
      )}
    </div>
  );
}
