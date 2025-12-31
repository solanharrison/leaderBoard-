import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;
const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.postgresql://postgres:u7gokubca1234%40@db.snvhljmipliosubaqstz.supabase.co:5432/postgres,
  ssl: { rejectUnauthorized: false }
});

app.post("/submit", async (req,res)=>{
  const { name, score } = req.body;
  await pool.query(
    "insert into leaderboard(name,score) values($1,$2)",
    [name, score]
  );
  res.json({ok:true});
});

app.get("/leaderboard", async (req,res)=>{
  const { rows } = await pool.query(
    "select * from leaderboard order by score desc limit 10"
  );
  res.json(rows);
});

app.listen(3000);
