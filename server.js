import express from "express";
import fs from "fs";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const FILE = "./scores.json";
const ADMIN_PASSWORD = "u7gokubca"; // change this

// ---------- UTIL ----------
function loadScores() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE));
}

function saveScores(scores) {
  fs.writeFileSync(FILE, JSON.stringify(scores, null, 2));
}

// ---------- GAME API ----------
app.post("/submit-score", (req, res) => {
  const { name, score } = req.body;
  if (!name || typeof score !== "number") {
    return res.status(400).json({ error: "Invalid data" });
  }

  let scores = loadScores();
  scores = scores.filter(s => s.name !== name);
  scores.push({ name, score });
  scores.sort((a, b) => b.score - a.score);

  saveScores(scores);
  res.json({ success: true });
});

app.get("/leaderboard", (req, res) => {
  const scores = loadScores();
  res.json(scores.slice(0, 10));
});

// ---------- ADMIN WEB PAGE ----------
app.get("/admin", (req, res) => {
  res.sendFile(path.resolve("admin.html"));
});

// ---------- ADMIN API ----------
app.post("/admin/update", (req, res) => {
  const { password, name, score } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  let scores = loadScores();
  scores = scores.filter(s => s.name !== name);
  scores.push({ name, score });
  scores.sort((a, b) => b.score - a.score);

  saveScores(scores);
  res.json({ success: true });
});

app.post("/admin/delete", (req, res) => {
  const { password, name } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  let scores = loadScores();
  scores = scores.filter(s => s.name !== name);

  saveScores(scores);
  res.json({ success: true });
});

// ---------- START ----------
app.listen(3000, () => {
  console.log("Leaderboard server running");
});
