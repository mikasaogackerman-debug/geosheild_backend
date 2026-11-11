const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

console.log("#####", process.env.DATABASE_URL);
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// DATABASE CONNECTION CHECK
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database Connection Failed:", err.message);
  } else {
    console.log("✅ Database Connected Successfully at:", res.rows[0].now);
  }
});

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.post("/signup", async (req, res) => {
  console.log("#### ", req.body);
  const { user_id, username, email, user_pass, user_contact } = req.body;

  try {
    const query =
      "INSERT INTO users (user_id, username, email, user_pass, user_contact) VALUES ($1, $2, $3, $4, $5) RETURNING *";
    const values = [user_id, username, email, user_pass, user_contact];

    const result = await pool.query(query, values);
    console.log("********");

    res.status(201).json({ message: "Signup completed", user: result.rows[0] });
  } catch (err) {
    console.log("111111111", err);
    res.status(500).send("Database error during signup");
  }
});

app.post("/login", async (req, res) => {
  console.log("walaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  console.log(req.body);
  const { email, user_pass } = req.body;

  try {
    const query = "SELECT * FROM users WHERE email = $1";
    const values = [email];

    const result = await pool.query(query, values);
    console.log("**************** ");

    if (result.rows.length === 0) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const user = result.rows[0];

    console.log("################## " + user);

    if (user.user_pass !== user_pass) {
      return res.status(401).json({ message: "Invalid password" });
    }

    console.log("**************login successfully completed!");

    res.status(200).json({ message: "Login completed ", user: user });
  } catch (err) {
    console.log("############", err);
    res.status(500).send("Database error during login");
  }
});

app.put("/changepass", async (req, res) => {
  console.log(req.body);
  const { email, current_pass, new_pass } = req.body;

  try {
    const query = "SELECT * FROM users WHERE email = $1";
    const values = [email];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    if (user.user_pass !== current_pass) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const updateQuery = "UPDATE users SET user_pass = $1 WHERE email = $2";
    const updateValues = [new_pass, email];

    await pool.query(updateQuery, updateValues);

    return res
      .status(200)
      .json({ message: "Password updated", user_pass: user });
  } catch (err) {
    console.log("Change password error:", err);

    return res
      .status(500)
      .json({ message: "Database error while changing password" });
  }
});

app.get("/profile", async (req, res) => {
  console.log(req.query);
  const { email } = req.query;

  try {
    const query = "SELECT * FROM users WHERE email = $1";
    const values = [email];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = result.rows[0];

    return res.status(200).json({
      message: "Profile fetched successfully",
      user: user,
    });
  } catch (err) {
    console.log("Profile error:", err);

    return res.status(500).json({
      message: "Database error while fetching profile",
    });
  }
});



const crypto = require("crypto");

// 100000 - 999999, always 6 digit
function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

app.post("/emergency_contact", async (req, res) => {
  console.log(req.body);

  const { user_id, contact_name, contact_number } = req.body;

  try {
    const code = generateCode();

    const query =
      "INSERT INTO emergency_contacts(user_id, contact_name, contact_number, code, fcm_token) VALUES ($1, $2, $3, $4, $5) RETURNING *";

    const values = [
      user_id,
      contact_name,
      contact_number,
      code,
      null
    ];

    const result = await pool.query(query, values);

    return res.status(201).json({
      message: "Emergency contact added",
      code: code,
      contact: result.rows[0],
    });

  } catch (err) {
    console.log("Emergency contact error:", err);

    return res.status(500).json({
      message: "Database error while adding emergency contact",
    });
  }
});

app.get("/emergency_contact", async (req, res) => {
  console.log(req.query);
  const { email } = req.query;

  try {
    const query = "SELECT * FROM emergency_contacts WHERE email = $1";
    const values = [email];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    return res
      .status(200)
      .json({
        message: "Emergency contacts fetched successfully",
        contacts: result.rows,
      });
  } catch (err) {
    console.log("Get emergency contacts error:", err);

    return res.status(500).json({
      message: "Database error while fetching emergency contacts",
      error: err.message,
    });
  }
});

app.put("/emergency_contact", async (req, res) => {
  console.log(req.body);
  const { contact_id, contact_name, contact_number, relationship } = req.body;

  try {
    const query =
      "UPDATE emergency_contacts SET contact_name = $1, contact_number = $2, relationship = $3 WHERE contact_id = $4 RETURNING *";
    const values = [contact_name, contact_number, relationship, contact_id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Contact not found" });
    }

    return res
      .status(200)
      .json({ message: "Emergency contact updated", contact: result.rows[0] });
  } catch (err) {
    console.log("Update emergency contact error:", err);
    return res
      .status(500)
      .json({ message: "Database error while updating emergency contact" });
  }
});

app.delete("/emergency_contact", async (req, res) => {
  console.log(req.body);
  const { contact_id } = req.body;

  try {
    const query =
      "DELETE FROM emergency_contacts WHERE contact_id = $1 RETURNING *";
    const values = [contact_id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "contact not found" });
    }

    return res
      .status(200)
      .json({ message: "Successfully deleted", contact: result.rows[0] });
  } catch (err) {
    console.log("Delete emergency contact error:", err);
    return res
      .status(500)
      .json({ message: "Database error while deleting emergency contact" });
  }
});

app.post("/location", async (req, res) => {
  console.log(req.body);
  const { email, latitude, longitude } = req.body;

  try {
    const query =
      "INSERT INTO user_locations(email, latitude, longitude) VALUES ($1, $2, $3)RETURNING *";
    const values = [email, latitude, longitude];

    const result = await pool.query(query, values);

    return res
      .status(201)
      .json({
        message: "Location saved successfully",
        location: result.rows[0],
      });
  } catch (err) {
    console.log("Location error:", err);
    return res
      .status(500)
      .json({ message: "Database error while saving location" });
  }
});

app.get("/location", async (req, res) => {
  const { email } = req.query;

  try {
    const query =
      "SELECT * FROM user_locations WHERE email = $1 ORDER BY created_at DESC LIMIT 1";
    const values = [email];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Location not found" });
    }

    return res
      .status(200)
      .json({
        message: "Latest location fetched successfully",
        location: result.rows,
      });
  } catch (err) {
    console.log("Get location error:", err);
    return res
      .status(500)
      .json({ message: "Database error while fetching location" });
  }
});

app.post("/emergency", async (req, res) => {
  console.log(req.body);
  const { email, latitude, longitude } = req.body;

  try {
    // 1. Save emergency
    const emergencyQuery =
      "INSERT INTO emergencies(email, latitude, longitude) VALUES ($1, $2, $3) RETURNING *";
    const emergencyValues = [email, latitude, longitude];

    const emergencyResult = await pool.query(emergencyQuery, emergencyValues);

    // 2. Get emergency contacts
    const contactQuery =
      "SELECT contact_id, contact_name, contact_number, relationship FROM emergency_contacts WHERE email = $1";
    const contactValues = [email];

    const contactResult = await pool.query(contactQuery, contactValues);

    // 3. Send response
    return res
      .status(201)
      .json({
        message: "SOS activated",
        emergency: emergencyResult.rows[0],
        contacts: contactResult.rows,
      });
  } catch (err) {
    console.log("SOS error:", err);
    return res
      .status(500)
      .json({ message: "Database error while activating SOS" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
