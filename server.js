import express from "express";
import cors from "cors";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;
const app = express();

app.use(cors());
app.use(express.json());

// ----- dirname fix (ES module) -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----- CONFIG -----
const ADMIN_PASSWORD = "admin123"; // 🔴 CHANGE THIS
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// =================================================
// ================= GAME APIs =====================
// =================================================

// Submit / update score
app.post("/submit-score", async (req, res) => {
  const { name, score } = req.body;

  if (!name || typeof score !== "number") {
    return res.status(400).json({ error: "Invalid data" });
  }

  await pool.query(
    `
    insert into leaderboard (name, score)
    values ($1, $2)
    on conflict (name)
    do update set
      score = greatest(leaderboard.score, excluded.score),
      created_at = now()
    `,
    [name, score]
  );

  res.json({ success: true });
});

// Top 10 leaderboard (for game)
app.get("/leaderboard", async (req, res) => {
  const { rows } = await pool.query(
    `
    select id, name, score
    from leaderboard
    order by score desc
    limit 10
    `
  );
  res.json(rows);
});

// =================================================
// ================= ADMIN PAGE ====================
// =================================================

// Serve admin page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// Get ALL players
app.post("/admin/all", async (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const { rows } = await pool.query(
    "select id, name, score from leaderboard order by score desc"
  );

  res.json(rows);
});

// Update player (name + score)
app.post("/admin/update", async (req, res) => {
  const { password, id, name, score } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  await pool.query(
    "update leaderboard set name=$1, score=$2 where id=$3",
    [name, score, id]
  );

  res.json({ success: true });
});

// Delete player
app.post("/admin/delete", async (req, res) => {
  const { password, id } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  await pool.query("delete from leaderboard where id=$1", [id]);
  res.json({ success: true });
});

// =================================================
// ================= START =========================
// =================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
