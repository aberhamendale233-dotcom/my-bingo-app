const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ፋይሎቹ የሚገኙበትን ፎልደር ማሳወቅ
app.use(express.static(path.join(__dirname)));

// ዋናውን ገጽ (index.html) መክፈት
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ሰርቨሩን ማስነሳት
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
