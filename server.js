import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const FILE = "./scores.json";

// Load scores
function loadScores() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE));
}

// Save scores
function saveScores(scores) {
  fs.writeFileSync(FILE, JSON.stringify(scores, null, 2));
}

// Submit score
app.post("/submit-score", (req, res) => {
  const { name, score } = req.body;
  if (!name || typeof score !== "number") {
    return res.status(400).send("Invalid data");
  }

  let scores = loadScores();

  // remove old score of same player
  scores = scores.filter(s => s.name !== name);

  scores.push({ name, score });

  // sort descending
  scores.sort((a, b) => b.score - a.score);

  // keep top 10
  scores = scores.slice(0, 10);

  saveScores(scores);
  res.json({ success: true });
});

// Get leaderboard
app.get("/leaderboard", (req, res) => {
  const scores = loadScores();
  res.json(scores.slice(0, 3)); // top 3
});

app.listen(3000, () => {
  console.log("Leaderboard server running");
});
