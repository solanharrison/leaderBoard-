import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// ---- dirname fix (ES module) ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- TEMP IN-MEMORY DATA ----
let players = [];
let nextId = 1;

const ADMIN_PASSWORD = "admin123"; // demo only

// ================= GAME APIs =================

// Submit or update score
app.post("/submit-score", (req, res) => {
  const { name, score } = req.body;

  if (!name || typeof score !== "number") {
    return res.status(400).json({ error: "Invalid data" });
  }

  let player = players.find(p => p.name === name);

  if (!player) {
    player = { id: nextId++, name, score };
    players.push(player);
  } else {
    player.score = Math.max(player.score, score);
  }

  players.sort((a, b) => b.score - a.score);

  res.json({ success: true });
});

// Get top 10 leaderboard
app.get("/leaderboard", (req, res) => {
  res.json(players.slice(0, 10));
});

// ================= ADMIN =================

// Serve admin page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// Get all players
app.post("/admin/all", (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  res.json(players);
});

// Update player
app.post("/admin/update", (req, res) => {
  const { password, id, name, score } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const player = players.find(p => p.id === id);
  if (!player) return res.status(404).json({ error: "Not found" });

  player.name = name;
  player.score = score;

  players.sort((a, b) => b.score - a.score);

  res.json({ success: true });
});

// Delete player
app.post("/admin/delete", (req, res) => {
  const { password, id } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  players = players.filter(p => p.id !== id);
  res.json({ success: true });
});

// ================= START =================

const PORT = 3000;
app.listen(PORT, () => {
  console.log("TEMP leaderboard server running on port " + PORT);
});
