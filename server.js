const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const PORT = 3000;

const db = new sqlite3.Database('./bingo.db', (err) => {
    if (err) console.error("Database error:", err.message);
    else console.log("Connected to bingo.db");
});

app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/balance/:userId', (req, res) => {
    const userId = req.params.userId;
    db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
        if (row) res.json({ balance: row.balance });
        else res.json({ balance: 0 });
    });
});

app.post('/api/play', (req, res) => {
    const { userId } = req.body;
    db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
        if (row && row.balance >= 10) {
            const newBalance = row.balance - 10;
            db.run("UPDATE users SET balance = ? WHERE id = ?", [newBalance, userId], () => {
                res.json({ success: true, newBalance: newBalance });
            });
        } else {
            res.json({ success: false, message: "በቂ ሂሳብ የሎትም!" });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
