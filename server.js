const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// ዳታቤዙን ማገናኘት
const db = new sqlite3.Database('./bingo.db', (err) => {
    if (err) console.error("Database connection error:", err.message);
    else console.log("Connected to bingo.db database.");
});

app.use(express.json());
app.use(express.static(__dirname));

// የገንዘብ መጠን ለማየት
app.get('/api/balance/:userId', (req, res) => {
    const userId = req.params.userId;
    db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
        if (row) res.json({ balance: row.balance });
        else res.json({ balance: 0 });
    });
});

// ሰርቨሩን ማስነሳት
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
