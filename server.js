const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');

// .env ፋይልን ለማንበብ
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ዳታቤዙን ማገናኘት
const db = new sqlite3.Database('./bingo.db', (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to bingo.db");
    }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname))); // HTML, CSS እና JS ፋይሎችን ለማቅረብ

// 1. የተጫዋች ሂሳብ ለማየት (GET Balance)
app.get('/api/balance/:userId', (req, res) => {
    const userId = req.params.userId;
    db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (row) {
            res.json({ balance: row.balance });
        } else {
            // ተጫዋቹ ከሌለ በ 0 ሂሳብ መመዝገብ
            db.run("INSERT INTO users (id, balance) VALUES (?, ?)", [userId, 0]);
            res.json({ balance: 0 });
        }
    });
});

// 2. 10 ብር ለመቀነስ (PLAY 10 Logic)
app.post('/api/play', (req, res) => {
    const { userId } = req.body;
    
    db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
        if (row && row.balance >= 10) {
            const newBalance = row.balance - 10;
            db.run("UPDATE users SET balance = ? WHERE id = ?", [newBalance, userId], (err) => {
                if (!err) {
                    res.json({ success: true, newBalance: newBalance });
                } else {
                    res.json({ success: false, message: "Error updating balance" });
                }
            });
        } else {
            res.json({ success: false, message: "በቂ ሂሳብ የሎትም!" });
        }
    });
});

// 3. ዋናውን ገጽ ለመክፈት
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ሰርቨሩን ማስነሳት
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
