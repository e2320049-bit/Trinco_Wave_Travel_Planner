const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// ✅ CONNECT TO phpMyAdmin (MySQL)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // leave empty (XAMPP default)
    database: 'travel_planner'
});

// Check connection
db.connect(err => {
    if (err) {
        console.log("❌ DB Error:", err);
    } else {
        console.log("✅ Connected to MySQL!");
    }
});

// ✅ GET PLACES
app.get('/api/places', (req, res) => {
    db.query("SELECT * FROM places", (err, result) => {
        if (err) return res.send(err);
        res.json(result);
    });
});

// ✅ LOGIN
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE username=? AND password=?",
        [username, password],
        (err, result) => {
            if (result.length === 0) {
                return res.json({ success: false });
            }
            res.json({ success: true, user: result[0] });
        }
    );
});

// ✅ REGISTER
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    db.query(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, password],
        (err, result) => {
            res.json({ success: true });
        }
    );
});

// START SERVER
app.listen(port, () => {
    console.log("🚀 Server running on http://localhost:3000");
});
