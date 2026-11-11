const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000, // Timeout after 5 seconds instead of hanging
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Connection test failed:", err);
  } else {
    console.log("Connection test succeeded:", res.rows[0]);
  }
  pool.end();
});