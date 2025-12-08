import "dotenv/config";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { OpenAI } from "openai";

const app = express();
const PORT = 4000;

// Hugging Face via OpenAI client
if (!process.env.HF_TOKEN) {
  console.warn(
    "Warning: HF_TOKEN is not set in backend/.env – AI summaries will fail."
  );
}

const hf = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
});

app.use(cors());
app.use(express.json());

// ---------- GitHub helpers ----------
async function getGithubProfile(username) {
  const res = await fetch(`https://api.github.com/users/${username}`);
  if (!res.ok) {
    throw new Error("GitHub user not found");
  }
  return res.json();
}

async function getGithubRepos(username) {
  const res = await fetch(
    `https://api.github.com/users/${username}/repos?sort=updated&per_page=5`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch repositories");
  }
  return res.json();
}

// ---------- AI summarizer using HuggingFace router ----------
async function generateAiSummary(profile, repos) {
  if (!process.env.HF_TOKEN) {
    throw new Error("HF_TOKEN is not set in .env");
  }

  const name = profile.name || profile.login;

  const basicInfo = `
Name: ${name}
Bio: ${profile.bio || "No bio"}
Followers: ${profile.followers}
Public repos: ${profile.public_repos}
Location: ${profile.location || "Not specified"}
`.trim();

  const repoLines =
    repos.length === 0
      ? "This user has no public repositories."
      : repos
          .slice(0, 5)
          .map(
            (r, i) =>
              `${i + 1}. ${r.name} — ${
                r.description || "No description"
              } (Language: ${r.language || "Unknown"}, Stars: ${
                r.stargazers_count
              })`
          )
          .join("\n");

  const prompt = `
You are an AI assistant that summarizes GitHub developers.

Here is the profile and their repositories:

Profile:
${basicInfo}

Repositories:
${repoLines}

Write a friendly, detailed, professional summary (3–5 sentences) describing:
- what this developer is good at,
- their skills,
- their project style,
- what they seem to focus on,
- any strengths you can infer.

Return ONLY the summary. No headings, no bullet points, no extra explanations.
`.trim();

  try {
    const completion = await hf.chat.completions.create({
      model: "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
      messages: [{ role: "user", content: prompt }],
    });

    const message = completion.choices?.[0]?.message?.content;
    if (!message) {
      throw new Error("No message content returned from HF router");
    }
    return message.trim();
  } catch (err) {
    console.error("HF router error:", err);
    throw new Error("Failed to generate AI summary");
  }
}

// ---------- Main API route ----------
app.get("/api/github/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const profile = await getGithubProfile(username);
    const repos = await getGithubRepos(username);

    let aiSummary;
    try {
      aiSummary = await generateAiSummary(profile, repos);
    } catch (err) {
      console.error("AI summary error:", err);
      aiSummary =
        "AI could not generate a summary at the moment, but the profile and repositories are shown above.";
    }

    res.json({
      profile,
      repos,
      aiSummary,
    });
  } catch (err) {
    console.error("Route error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});