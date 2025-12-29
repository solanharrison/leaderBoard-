import express from "express";
import fs from "fs";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// --- FIX FOR __dirname (ES MODULE) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIG ---
const FILE = path.join(__dirname, "scores.json");
const ADMIN_PASSWORD = "admin123"; // 🔴 CHANGE THIS

// --- UTIL FUNCTIONS ---
function loadScores() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}

function saveScores(scores) {
  fs.writeFileSync(FILE, JSON.stringify(scores, null, 2));
}

// =======================================================
// =================== GAME APIs ==========================
// =======================================================

// Submit / update player score (Unity)
app.post("/submit-score", (req, res) => {
  const { name, score } = req.body;

  if (!name || typeof score !== "number") {
    return res.status(400).json({ error: "Invalid data" });
  }

  let scores = loadScores();

  // remove old entry for same player
  scores = scores.filter(p => p.name !== name);

  scores.push({ name, score });

  // sort high → low
  scores.sort((a, b) => b.score - a.score);

  saveScores(scores);
  res.json({ success: true });
});

// Leaderboard for game (TOP 10)
app.get("/leaderboard", (req, res) => {
  const scores = loadScores();
  res.json(scores.slice(0, 10));
});

// =======================================================
// =================== ADMIN PAGE =========================
// =======================================================

// Serve admin webpage
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// Get ALL players (admin only)
app.post("/admin/all", (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  res.json(loadScores());
});

// Update player name + score
app.post("/admin/update", (req, res) => {
  const { password, oldName, name, score } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  let scores = loadScores();

  scores = scores.filter(p => p.name !== oldName);
  scores.push({ name, score });
  scores.sort((a, b) => b.score - a.score);

  saveScores(scores);
  res.json({ success: true });
});

// Delete player
app.post("/admin/delete", (req, res) => {
  const { password, name } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  let scores = loadScores();
  scores = scores.filter(p => p.name !== name);

  saveScores(scores);
  res.json({ success: true });
});

// =======================================================
// =================== START SERVER =======================
// =======================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Leaderboard server running on port " + PORT);
});
