import { useState } from "react";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!username.trim()) return;

    setStatus("loading");
    setError("");
    setData(null);

    try {
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
          {/* Profile card */}
          <section className="card profile-card">
            <div className="avatar-wrapper">
              <img
                src={data.profile.avatar_url}
                alt={data.profile.login}
                className="avatar"
              />
            </div>
            <h2>{data.profile.name || data.profile.login}</h2>
            <p className="bio">
              {data.profile.bio || "This user has not added a bio yet."}
            </p>

            <div className="stats-row">
              <div>
                <span className="stat-label">Followers</span>
                <span className="stat-value">
                  {data.profile.followers ?? 0}
                </span>
              </div>
              <div>
                <span className="stat-label">Following</span>
                <span className="stat-value">
                  {data.profile.following ?? 0}
                </span>
              </div>
              <div>
                <span className="stat-label">Public Repos</span>
                <span className="stat-value">
                  {data.profile.public_repos ?? 0}
                </span>
              </div>
            </div>

            <a
              href={data.profile.html_url}
              target="_blank"
              rel="noreferrer"
              className="profile-link"
            >
              View on GitHub →
            </a>
          </section>

          {/* Repos card */}
          <section className="card repos-card">
            <h3>Recent Repositories</h3>
            <ul className="repo-list">
              {data.repos.length === 0 && (
                <li className="muted">No public repositories found.</li>
              )}
              {data.repos.map((repo) => (
                <li key={repo.id} className="repo-item">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="repo-name"
                  >
                    {repo.name}
                  </a>
                  <p className="repo-desc">
                    {repo.description || "No description."}
                  </p>
                  <div className="repo-meta">
                    <span className="pill">
                      {repo.language || "Unknown language"}
                    </span>
                    <span className="stars">⭐ {repo.stargazers_count}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* AI summary card */}
          <section className="card summary-card">
            <h3>AI Summary</h3>
            <p className="summary-text">
              {data.aiSummary || "AI summary unavailable."}
            </p>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;