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
if (tg) { tg.expand(); tg.ready(); }

const user = tg?.initDataUnsafe?.user || { id: "guest_" + Math.floor(Math.random() * 10000), first_name: "ተጫዋች" };
const userId = user.id;

let myFullCard = []; 

// 1. የተጫዋቹን ካርድ መከታተል
db.ref(`players/${userId}`).on("value", (snapshot) => {
    myFullCard = snapshot.exists() ? snapshot.val().card : [];
});

// 2. ዋናው የጨዋታ መቆጣጠሪያ
db.ref("gameState").on("value", (snapshot) => {
    const data = snapshot.val() || { status: "WAITING", timer: 30 };
    const root = document.getElementById("game-root");
    if (!root) return;
    
    // *** አሸናፊ ሲኖር ለሁሉም ሰው የሚታየው ክፍል ***
    if (data.winner) {
        root.innerHTML = `
            <div style="text-align:center; background:#1a1a2e; padding:30px; border-radius:25px; border: 4px solid #ffd700; box-shadow: 0 0 20px rgba(255,215,0,0.4);">
                <h1 style="color:#ffd700; font-size:3.5rem; margin:0; text-shadow: 2px 2px #000;">BINGO!</h1>
                <div style="margin:20px 0;">
                    <div style="background:#ffd700; color:#1a1a2e; padding:12px 25px; border-radius:15px; display:inline-block; font-weight:bold; font-size:1.3rem;">
                        🏆 አሸናፊ: ${data.winnerName}
                    </div>
                </div>
                <p style="color:white; font-size:1.1rem; margin-bottom:15px;">የአሸናፊው ካርድ ይህንን ይመስላል፡</p>
                <div style="transform: scale(0.85);">${renderBingoGrid(data.winnerCard, data.calledNumbers || [])}</div>
                <button onclick="db.ref('gameState').remove(); location.reload();" style="margin-top:25px; background:#ffd700; border:none; padding:12px 30px; border-radius:10px; font-weight:bold; cursor:pointer;">አዲስ ጨዋታ ጀምር</button>
            </div>
        `;
        return;
    }

    // WAITING ሁኔታ
    if (data.status === "WAITING") {
        let gridHTML = "";
        for (let i = 1; i <= 80; i++) {
            const isTaken = !!(data.takenCards && data.takenCards[i]);
            gridHTML += `<button onclick="generateBingoCard(${i}, ${isTaken})" style="width:38px; height:38px; margin:2px; border-radius:8px; border:none; background:${isTaken ? '#444' : '#1f4068'}; color:white; font-weight:bold; cursor:pointer;">${i}</button>`;
        }
        root.innerHTML = `
            <div style="text-align:center; color:#ffd700; margin-bottom:20px;">
                <h3 style="margin:0;">${myFullCard.length > 0 ? "ተመዝግበዋል! ቆይ..." : "ካርድ ይምረጡ"}</h3>
                <h1 style="font-size:3rem; margin:0;">⏱ ${data.timer}s</h1>
            </div>
            <div style="display:flex; flex-wrap:wrap; justify-content:center; background:rgba(255,255,255,0.05); padding:10px; border-radius:15px;">${gridHTML}</div>
            ${myFullCard.length > 0 ? `<div style="margin-top:20px;">${renderBingoGrid(myFullCard, [])}</div>` : ""}
        `;
    } 
    // PLAYING ሁኔታ
    else {
        const calledNumbers = data.calledNumbers || [];
        
        // አሸናፊነትን ቼክ ማድረግ
        if (myFullCard.length > 0 && !data.winner && checkWin(myFullCard, calledNumbers)) {
            db.ref("gameState").update({ 
                winner: userId, 
                winnerName: user.first_name,
                winnerCard: myFullCard 
            });
        }

        root.innerHTML = `
            <div style="text-align:center; margin-bottom:20px;">
                <div style="background:#ffd700; color:#1a1a2e; width:100px; height:100px; border-radius:50%; display:flex; justify-content:center; align-items:center; font-size:2.2rem; font-weight:bold; margin:0 auto; border:5px solid #fff; box-shadow: 0 0 15px rgba(255,215,0,0.3);">
                    ${data.currentNum || "..."}
                </div>
            </div>
            ${myFullCard.length > 0 ? renderBingoGrid(myFullCard, calledNumbers) : `<div style="text-align:center; color:white; padding:40px; background:rgba(255,255,255,0.05); border-radius:20px;"><h2>በመጠባበቅ ላይ...</h2><p>ይህ ዙር እንዳለቀ ካርድ መምረጥ ይችላሉ</p></div>`}
        `;
    }
});

// ካርድ መምረጫ
window.generateBingoCard = function(n, taken) {
    if (taken || (myFullCard && myFullCard.length > 0)) return;
    
    db.ref("gameState").once("value", (snapshot) => {
        const data = snapshot.val();
        if (!data || data.winner || data.status === "FINISHED" || !data.status) {
            startTimer();
        }
    });

    let b = getRange(1, 15, 5), i = getRange(16, 30, 5), n_c = getRange(31, 45, 4), g = getRange(46, 60, 5), o = getRange(61, 75, 5);
    n_c.splice(2, 0, "FREE"); 
    let newCard = [...b, ...i, ...n_c, ...g, ...o];

    db.ref(`players/${userId}`).set({ name: user.first_name, card: newCard });
    db.ref(`gameState/takenCards/${n}`).set(true);
};

function renderBingoGrid(card, called) {
    if (!card || card.length === 0) return "";
    const letters = ['B', 'I', 'N', 'G', 'O'];
    let gridHTML = "";
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            let num = card[col * 5 + row];
            const isHit = called.includes(num) || num === "FREE";
            gridHTML += `<div style="background:${isHit ? '#e94560' : '#1f4068'}; color:white; height:45px; display:flex; justify-content:center; align-items:center; font-weight:bold; border-radius:8px; font-size:1.1rem; border:1px solid rgba(0,0,0,0.1);">${num}</div>`;
        }
    }
    return `<div style="background:white; padding:12px; border-radius:18px; width:100%; max-width:300px; margin:auto;"><div style="display:grid; grid-template-columns:repeat(5, 1fr); margin-bottom:10px;">${letters.map(l => `<div style="color:#1a1a2e; font-weight:900; text-align:center;">${l}</div>`).join('')}</div><div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:5px;">${gridHTML}</div></div>`;
}

function checkWin(card, called) {
    const p = [[0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24], [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24], [0,6,12,18,24], [4,8,12,16,20]];
    return p.some(a => a.every(i => called.includes(card[i]) || card[i] === "FREE"));
}

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
    db.ref("players").remove(); 
    db.ref("gameState").set({ status: "WAITING", timer: t, takenCards: {}, calledNumbers: [], winner: null });
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
            if (s.exists() || pool.length === 0) { 
                clearInterval(gameInterval); 
                return; 
            }
            let n = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
            let l = (n <= 15) ? "B" : (n <= 30) ? "I" : (n <= 45) ? "N" : (n <= 60) ? "G" : "O";
            called.push(n);
            db.ref("gameState").update({ currentNum: l + "-" + n, calledNumbers: called });
        });
    }, 4000);
}
