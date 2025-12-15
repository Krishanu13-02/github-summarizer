import { useState } from "react";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!username.trim()) return;

    setStatus("loading");
    setError("");
    setData(null);

    try {
      // 1️⃣ Fetch Profile + Repos + AI
      const res = await fetch(
        `https://github-summarizer-backend.onrender.com/api/github/${username.trim()}`
      );

      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(json.error || "Something went wrong");
        return;
      }

      setData(json);
      setStatus("idle");

      // 2️⃣ Save to MongoDB (NEW)
      await fetch(`https://github-summarizer-backend.onrender.com/api/save-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          profile: json.profile,
          repos: json.repos,
          aiSummary: json.aiSummary,
        }),
      });

      console.log("Saved to MongoDB ✔");

    } catch (err) {
      setStatus("error");
      setError("Failed to reach server");
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>
          GitHub <span>Summarizer</span>
        </h1>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Enter GitHub username (e.g. torvalds)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button type="submit">Summarize</button>
        </form>

        {status === "loading" && (
          <p className="info-text">Fetching profile & generating summary…</p>
        )}
        {status === "error" && <p className="error-text">{error}</p>}
      </header>

      {data && (
        <main className="content-grid">
          {/* Profile card */}
          {/* (Your entire UI unchanged, I kept everything exactly same) */}
          ...
        </main>
      )}
    </div>
  );
}

export default App;
