// ... የቀደመው የFirebase Config እንደተጠበቀ ሆኖ ...

db.ref("gameState").on("value", (snapshot) => {
    const data = snapshot.val() || { status: "WAITING", timer: 30 };
    const root = document.getElementById("game-root");
    if (!root) return;
    
    // 1. ካርዱ የሚታይበት (የመጀመሪያው ገጽ)
    if (data.status === "WAITING") {
        let gridHTML = "";
        for (let i = 1; i <= 80; i++) {
            const isTaken = !!(data.takenCards && data.takenCards[i]);
            // እያንዳንዱን ቁጥር እንደ ካርድ ቁልፍ ያደርገዋል
            gridHTML += `<button onclick="pick(${i}, ${isTaken})" class="${isTaken ? 'taken' : ''}" style="margin:2px; padding:10px; border-radius:5px;">${i}</button>`;
        }
        root.innerHTML = `
            <h2>🎰 BINGO LIVE 🎰</h2>
            <p style="color:#ffcc00;">ካርድዎን ይምረጡ!</p>
            <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:5px; max-width:400px; margin:auto;">
                ${gridHTML}
            </div>
        `;
    } 
    // 2. ጨዋታው ሲጀመር (የወጣው ቁጥር ማሳያ)
    else if (data.status === "PLAYING") {
        root.innerHTML = `
            <div class="current-number-ball">${data.currentNum || "..."}</div>
            <div class="player-card-box">
                <p>የእርስዎ ካርድ፡ <span style="color:#ffcc00; font-size:2rem;">${myCardNum || "---"}</span></p>
                <div class="history-list">
                    ${(data.calledNumbers || []).slice(-5).map(n => `<span class="history-item">${n}</span>`).join("")}
                </div>
            </div>
        `;
    }
});

// ... የተቀረው የ pick() እና startTimer() ኮድ ይቀጥላል ...
