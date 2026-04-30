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

const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) tg.expand();

const user = tg?.initDataUnsafe?.user || { id: "guest_" + Math.floor(Math.random() * 10000), first_name: "ተጫዋች" };
const userId = user.id;

let myFullCard = []; 

// የተጫዋቹን ካርድ መከታተል
db.ref(`players/${userId}`).on("value", (snapshot) => {
    if (snapshot.exists()) {
        myFullCard = snapshot.val().card;
    } else {
        myFullCard = [];
    }
});

// ዋናው የጨዋታ መቆጣጠሪያ
db.ref("gameState").on("value", (snapshot) => {
    const data = snapshot.val() || { status: "WAITING", timer: 30 };
    const root = document.getElementById("game-root");
    if (!root) return;
    
    // 1. አሸናፊ ካለ የአሸናፊውን ካርድ ለሁሉም ማሳየት (Screenshot (155)_2.jpg መሰረት)
    if (data.winner) {
        root.innerHTML = `
            <div style="text-align:center; background:#1a1a2e; padding:20px; border-radius:20px; border: 2px solid #ffd700; box-shadow: 0 0 20px rgba(255,215,0,0.3);">
                <h1 style="color:#ffd700; font-size:2.5rem; margin:0;">🎊 BINGO! 🎊</h1>
                <div style="margin:15px 0;">
                    <div style="background:#ffd700; color:#1a1a2e; padding:10px; border-radius:10px; display:inline-block; font-weight:bold;">
                        🏆 አሸናፊ: ${data.winnerName}
                    </div>
                </div>
                <h4 style="color:white; margin-bottom:10px; font-size:0.9rem; letter-spacing:1px;">WINNING CARD VIEW</h4>
                <div style="transform: scale(0.9);">${renderBingoGrid(data.winnerCard, data.calledNumbers || [])}</div>
                <button onclick="location.reload()" style="background:#e94560; color:white; border:none; padding:12px 30px; border-radius:10px; cursor:pointer; font-weight:bold; margin-top:20px;">ቀጣይ ጨዋታ</button>
            </div>
        `;
        return;
    }

    // 2. የ30 ሰከንድ ቆጠራ (WAITING)
    if (data.status === "WAITING") {
        let gridHTML = "";
        for (let i = 1; i <= 80; i++) {
            const isTaken = !!(data.takenCards && data.takenCards[i]);
            gridHTML += `<button onclick="generateBingoCard(${i}, ${isTaken})" style="width:38px; height:38px; margin:2px; border-radius:5px; border:none; background:${isTaken ? '#444' : '#1f4068'}; color:white; font-size:0.8rem; cursor:pointer;">${i}</button>`;
        }
        root.innerHTML = `
            <div style="text-align:center; color:#ffd700; margin-bottom:15px;">
                <h3 style="margin:0;">${myFullCard.length > 0 ? "ተመዝግበዋል! ቆይ..." : "ካርድ ይምረጡ"}</h3>
                <h1 style="font-size:3rem; margin:0;">⏱ ${data.timer}s</h1>
            </div>
            <div style="display:flex; flex-wrap:wrap; justify-content:center;">${gridHTML}</div>
            ${myFullCard.length > 0 ? `<div style="margin-top:20px;">${renderBingoGrid(myFullCard, [])}</div>` : ""}
        `;
    } 
    // 3. ጨዋታው ሲጀመር (PLAYING)
    else {
        const calledNumbers = data.calledNumbers || [];
        
        // ካርድ ያለው ተጫዋች ካሸነፈ ወዲያውኑ መመዝገብ
        if (myFullCard.length > 0 && checkWin(myFullCard, calledNumbers)) {
            db.ref("gameState").update({ 
                winner: userId, 
                winnerName: user.first_name,
                winnerCard: myFullCard 
            });
        }

        root.innerHTML = `
            <div style="text-align:center; margin-bottom:15px;">
                <div style="background:#ffd700; color:#1a1a2e; width:90px; height:90px; border-radius:50%; display:flex; justify-content:center; align-items:center; font-size:2rem; font-weight:bold; margin:0 auto; border:4px solid #fff;">
                    ${data.currentNum || "..."}
                </div>
            </div>
            ${myFullCard.length > 0 ? renderBingoGrid(myFullCard, calledNumbers) : `
                <div style="text-align:center; padding:30px; background:rgba(0,0,0,0.4); border-radius:15px; color:white;">
                    <h2 style="color:#e94560;">WATCHING ONLY</h2>
                    <p>ይህ ዙር አልፎዎታል:: ቀጣዩን ይጠብቁ::</p>
                    <div style="display:flex; flex-wrap:wrap; gap:5px; justify-content:center; margin-top:20px; opacity:0.6;">
                        ${calledNumbers.slice(-10).map(n => `<div style="background:#1f4068; padding:5px 10px; border-radius:50%; font-size:0.8rem;">${n}</div>`).join('')}
                    </div>
                </div>
            `}
        `;
    }
});

function renderBingoGrid(card, called) {
    if (!card || card.length === 0) return "";
    const letters = ['B', 'I', 'N', 'G', 'O'];
    let gridHTML = "";
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            let num = card[col * 5 + row];
            const isHit = called.includes(num) || num === "FREE";
            gridHTML += `<div style="background:${isHit ? '#e94560' : '#1f4068'}; color:white; height:45px; display:flex; justify-content:center; align-items:center; font-weight:bold; border-radius:5px; border:1px solid #16213e; font-size:1.1rem;">${num}</div>`;
        }
    }
    return `
        <div style="background:white; padding:10px; border-radius:15px; width:100%; max-width:300px; margin:auto;">
            <div style="display:grid; grid-template-columns:repeat(5, 1fr); margin-bottom:8px;">
                ${letters.map(l => `<div style="color:#1a1a2e; font-weight:900; text-align:center;">${l}</div>`).join('')}
            </div>
            <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:4px;">
                ${gridHTML}
            </div>
        </div>`;
}

function checkWin(card, called) {
    const p = [[0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24], [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24], [0,6,12,18,24], [4,8,12,16,20]];
    return p.some(a => a.every(i => called.includes(card[i]) || card[i] === "FREE"));
}

window.generateBingoCard = function(n, taken) {
    if (taken || myFullCard.length > 0) return;
    let b = getRange(1, 15, 5), i = getRange(16, 30, 5), n_c = getRange(31, 45, 4), g = getRange(46, 60, 5), o = getRange(61, 75, 5);
    n_c.splice(2, 0, "FREE"); 
    myFullCard = [...b, ...i, ...n_c, ...g, ...o];
    db.ref(`players/${userId}`).set({ name: user.first_name, card: myFullCard });
    db.ref(`gameState/takenCards/${n}`).set(true);
    db.ref("gameState/timer").once("value", s => { if (!s.exists() || s.val() === 30) startTimer(); });
};

function getRange(min, max, count) {
    let a = [];
    while(a.length < count) {
        let r = Math.floor(Math.random() * (max - min + 1)) + min;
        if(!a.includes(r)) a.push(r);
    }
    return a.sort((x, y) => x - y);
}

function startTimer() {
    let t = 30;
    db.ref("gameState").update({ status: "WAITING", winner: null, winnerName: null, winnerCard: null, calledNumbers: [] });
    const timer = setInterval(() => {
        t--;
        db.ref("gameState/timer").set(t);
        if (t <= 0) { clearInterval(timer); db.ref("gameState/status").set("PLAYING"); callNumbers(); }
    }, 1000);
}

function callNumbers() {
    let pool = Array.from({length: 75}, (_, i) => i + 1);
    let called = [];
    let gameInterval = setInterval(() => {
        db.ref("gameState/winner").once("value", (s) => {
            if (s.exists() || pool.length === 0) { clearInterval(gameInterval); return; }
            let n = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
            let l = (n <= 15) ? "B" : (n <= 30) ? "I" : (n <= 45) ? "N" : (n <= 60) ? "G" : "O";
            called.push(n);
            db.ref("gameState").update({ currentNum: l + "-" + n, calledNumbers: called });
        });
    }, 4000);
}
