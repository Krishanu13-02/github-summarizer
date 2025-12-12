import "dotenv/config";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { OpenAI } from "openai";
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 4000;

// ----------------- HF / OpenAI client (Hugging Face router) -----------------
if (!process.env.HF_TOKEN) {
  console.warn("Warning: HF_TOKEN is not set in backend/.env – AI summaries will fail.");
}

const hf = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
});

app.use(cors());
app.use(express.json());

// ----------------- MongoDB connection & model -----------------
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours cache TTL

if (!process.env.MONGO_URI) {
  console.warn("Warning: MONGO_URI is missing in backend/.env — caching will be disabled.");
} else {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));
}

// Define schema & model (if Mongo available)
const userSummarySchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    profile: { type: Object, required: true },
    repos: { type: [Object], required: true },
    aiSummary: { type: String, required: true },
    lastFetched: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const UserSummary =
  mongoose.models?.UserSummary || mongoose.model?.("UserSummary", userSummarySchema);

// ----------------- GitHub helpers -----------------
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

// ----------------- AI summarizer using HuggingFace router -----------------
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
                r.stargazers_count ?? 0
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

// ----------------- API Route with caching -----------------
// GET /api/github/:username?force=true
app.get("/api/github/:username", async (req, res) => {
  const { username } = req.params;
  const force = req.query.force === "true";
  const normalized = username.trim().toLowerCase();

  try {
    // If mongoose not connected, skip cache and behave like original file
    const mongoReady = mongoose.connection?.readyState === 1;

    // Try cached entry
    if (mongoReady && !force) {
      const cached = await UserSummary.findOne({ username: normalized }).lean();
      if (cached && cached.lastFetched) {
        const age = Date.now() - new Date(cached.lastFetched).getTime();
        if (age < CACHE_TTL_MS) {
          // Serve cached
          console.log("💾 Serving from cache:", normalized);
          return res.json({
            profile: cached.profile,
            repos: cached.repos,
            aiSummary: cached.aiSummary,
            cached: true,
          });
        }
      }
    }

    // Fetch fresh from GitHub
    console.log("🌐 Fetching fresh data for:", normalized);
    const profile = await getGithubProfile(normalized);
    const repos = await getGithubRepos(normalized);

    let aiSummary;
    try {
      aiSummary = await generateAiSummary(profile, repos);
    } catch (err) {
      console.error("AI summary error:", err);
      // graceful fallback text (keeps response shape)
      aiSummary =
        "AI could not generate a summary at the moment, but the profile and repositories are shown above.";
    }

    // Save/upsert to Mongo if ready
    if (mongoReady) {
      await UserSummary.findOneAndUpdate(
        { username: normalized },
        {
          username: normalized,
          profile,
          repos,
          aiSummary,
          lastFetched: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    // Return fresh result
    return res.json({ profile, repos, aiSummary, cached: false });
  } catch (err) {
    console.error("Route error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Keep server listen as before
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
