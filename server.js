const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.send("ሰርቨሩ በትክክል እየሰራ ነው!");
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
