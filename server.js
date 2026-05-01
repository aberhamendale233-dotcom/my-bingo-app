try {
    const express = require('express');
    const path = require('path');
    const sqlite3 = require('sqlite3').verbose();

    const app = express();
    const PORT = 3000;

    console.log("ሰርቨሩን ለማስነሳት በመሞከር ላይ...");

    const db = new sqlite3.Database(path.join(__dirname, 'bingo.db'), (err) => {
        if (err) console.error("ዳታቤዝ Error:", err.message);
        else console.log("ዳታቤዙ ተገናኝቷል።");
    });

    app.use(express.static(__dirname));

    app.listen(PORT, () => {
        console.log(`ተሳክቷል! ሰርቨሩ እዚህ ላይ እየሰራ ነው: http://localhost:${PORT}`);
    }).on('error', (e) => {
        console.error("የሰርቨር መነሳት ስህተት:", e.message);
    });

} catch (globalError) {
    console.error("በጣም አስከፊ ስህተት ተከስቷል:", globalError.message);
}
