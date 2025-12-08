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
        `http://localhost:4000/api/github/${username.trim()}`
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
      <h1>GitHub Summarizer</h1>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Enter GitHub username (e.g. torvalds)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button type="submit">Summarize</button>
      </form>

      {status === "loading" && <p>Loading...</p>}
      {status === "error" && <p className="error">{error}</p>}

      {data && (
        <div className="result">
          <div className="profile-card">
            <img
              src={data.profile.avatar_url}
              alt={data.profile.login}
              className="avatar"
            />
            <h2>{data.profile.name || data.profile.login}</h2>
            <p className="bio">{data.profile.bio || "No bio provided."}</p>
            <p>
              <strong>Followers:</strong> {data.profile.followers} •{" "}
              <strong>Following:</strong> {data.profile.following}
            </p>
            <p>
              <strong>Public repos:</strong> {data.profile.public_repos}
            </p>
            <a
              href={data.profile.html_url}
              target="_blank"
              rel="noreferrer"
            >
              View on GitHub
            </a>
          </div>

          <div className="repos">
            <h3>Recent Repositories</h3>
            <ul>
              {data.repos.map((repo) => (
                <li key={repo.id}>
                  <a href={repo.html_url} target="_blank" rel="noreferrer">
                    {repo.name}
                  </a>
                  <p>{repo.description || "No description."}</p>
                  <small>
                    {repo.language || "Unknown"} • ⭐ {repo.stargazers_count}
                  </small>
                </li>
              ))}
            </ul>
          </div>

          {/* 🔥 AI summary from backend */}
          <div className="summary-text">
            <h3>AI Summary</h3>
            <p>{data.aiSummary || "AI summary unavailable."}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;