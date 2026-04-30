const firebaseConfig = {
  apiKey: "AIzaSyCtLHUAuFZNeWDCx2-1W8ZZDa43gRDjLFc",
  authDomain: "my-bingo-app-cdc12.firebaseapp.com",
  databaseURL: "https://my-bingo-app-cdc12-default-rtdb.firebaseio.com",
  projectId: "my-bingo-app-cdc12",
  storageBucket: "my-bingo-app-cdc12.firebasestorage.app",
  messagingSenderId: "793283320707",
  appId: "1:793283320707:web:4a6de806ba7a3048eaf4b6"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.database();
let myFullCard = []; // የ25 ቁጥሮች ዝርዝር

db.ref("gameState").on("value", (snapshot) => {
    const data = snapshot.val() || { status: "WAITING", timer: 30 };
    const root = document.getElementById("game-root");
    if (!root) return;
    
    if (data.status === "WAITING") {
        // ገና ካርድ ካልመረጠ 1-80 ቁጥሮችን አሳይ
        if (myFullCard.length === 0) {
            let gridHTML = "";
            for (let i = 1; i <= 80; i++) {
                const isTaken = !!(data.takenCards && data.takenCards[i]);
                gridHTML += `<button onclick="generateBingoCard(${i}, ${isTaken})" class="${isTaken ? 'taken' : ''}">${i}</button>`;
            }
            root.innerHTML = `<h2>🎰 ካርድ ይምረጡ (1-80) 🎰</h2><div class="grid-container">${gridHTML}</div>`;
        } 
        // ካርድ መርጦ ከሆነ የመረጠውን 5x5 ካርድ አሳይ
        else {
            root.innerHTML = `
                <h2>የእርስዎ ካርድ ተዘጋጅቷል!</h2>
                <p>ጨዋታው እስኪጀምር ይጠብቁ... (${data.timer}s)</p>
                <div class="bingo-card-5x5">${renderBingoGrid(myFullCard, [])}</div>
            `;
        }
    } else {
        // ጨዋታው ሲጀመር (PLAYING)
        const calledNumbers = data.calledNumbers || [];
        root.innerHTML = `
            <div class="current-number-ball">${data.currentNum || "..." }</div>
            <div class="bingo-card-5x5">${renderBingoGrid(myFullCard, calledNumbers)}</div>
            <div class="history-list">
                ${calledNumbers.slice(-10).map(n => `<span class="history-item">${n}</span>`).join("")}
            </div>
        `;
    }
});

// 5x5 ካርድ የሚሰራው ፈንክሽን
window.generateBingoCard = function(n, taken) {
    if (taken || myFullCard.length > 0) return;
    
    let numbers = [];
    while(numbers.length < 24) {
        let r = Math.floor(Math.random() * 75) + 1;
        if(numbers.indexOf(r) === -1) numbers.push(r);
    }
    // በመሃል ላይ FREE ቦታ ለመተው
    numbers.splice(12, 0, "FREE"); 
    myFullCard = numbers;

    db.ref(`gameState/takenCards/${n}`).set(true);
    db.ref("gameState/timer").once("value", s => {
        if (!s.exists() || s.val() === 30) startTimer();
    });
};

// ካርዱን በ HTML መልክ የሚያዘጋጅ
function renderBingoGrid(card, called) {
    return `
        <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:5px; background:#fff; padding:10px; border-radius:10px;">
            ${card.map(num => {
                const isHit = called.includes(num) || num === "FREE";
                return `<div style="background:${isHit ? '#e94560' : '#1f4068'}; color:white; padding:10px 2px; font-weight:bold; border-radius:5px; font-size:0.8rem;">${num}</div>`;
            }).join("")}
        </div>
    `;
}

function startTimer() {
    let t = 30;
    const inv = setInterval(() => {
        t--;
        db.ref("gameState/timer").set(t);
        if (t <= 0) {
            clearInterval(inv);
            db.ref("gameState/status").set("PLAYING");
            callNumbers();
        }
    }, 1000);
}

function callNumbers() {
    let pool = Array.from({length: 75}, (_, i) => i + 1);
    let called = [];
    const inv = setInterval(() => {
        if (pool.length === 0) { clearInterval(inv); return; }
        let n = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        called.push(n);
        db.ref("gameState").update({ currentNum: n, calledNumbers: called });
    }, 4000);
}
