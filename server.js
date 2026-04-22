const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// DATABASE CONNECTION
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "trincowaves"
});

db.connect(err => {
    if (err) {
        console.log("DB connection failed", err);
    } else {
        console.log("MySQL Connected");
    }
});

// REGISTER USER
app.post("/register", (req, res) => {
    const { name, email, password } = req.body;

    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.query(sql, [name, email, password], (err, result) => {
        if (err) {
            console.log(err);
            res.send("Registration failed");
        } else {
            res.send("User registered successfully");
        }
    });
});

// GET ALL USERS (ADMIN VIEW)
app.get("/users", (req, res) => {
    db.query("SELECT * FROM users", (err, result) => {
        if (err) {
            res.send(err);
        } else {
            res.json(result);
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
