import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Supabase PostgreSQL connection (from Render ENV)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  family: 4   // ✅ FORCE IPv4 (THIS FIXES ENETUNREACH)
});


// ---------------- SUBMIT SCORE ----------------
app.post("/submit-score", async (req, res) => {
  try {
    const { name, score } = req.body;

    if (!name || typeof score !== "number") {
      return res.status(400).json({ error: "Invalid data" });
    }

    await pool.query(
      `
      insert into leaderboard (name, score)
      values ($1, $2)
      on conflict (name)
      do update set score = greatest(leaderboard.score, excluded.score)
      `,
      [name, score]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- GET LEADERBOARD ----------------
app.get("/leaderboard", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "select id, name, score from leaderboard order by score desc limit 10"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

