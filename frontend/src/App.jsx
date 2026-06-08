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

    <section className="card">
      <img
        src={data.profile.avatar_url}
        alt={data.profile.login}
        width="120"
      />

      <h2>{data.profile.name}</h2>
      <p>@{data.profile.login}</p>

      <p>{data.profile.bio}</p>

      <p>
        Followers: {data.profile.followers} | Repos: {data.profile.public_repos}
      </p>
    </section>

    <section className="card">
      <h2>AI Summary</h2>

      <p>{data.aiSummary}</p>
    </section>

    <section className="card">
      <h2>Repositories</h2>

      {data.repos.map((repo) => (
        <div key={repo.id}>
          <h3>{repo.name}</h3>

          <p>{repo.description || "No description"}</p>

          <small>
            {repo.language} • ⭐ {repo.stargazers_count}
          </small>

          <hr />
        </div>
      ))}
    </section>

  </main>
)}
    </div>
  );
}

export default App;
