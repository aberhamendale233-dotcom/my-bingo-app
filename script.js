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
let lastCalledNum = ""; 

db.ref(`players/${userId}`).on("value", (snapshot) => {
    myFullCard = snapshot.exists() ? snapshot.val().card : [];
});

function speakNumber(text) {
    if ('speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance();
        msg.text = text;
        msg.lang = 'en-US';
        msg.rate = 1.0; 
        window.speechSynthesis.speak(msg);
    }
}

db.ref("gameState").on("value", (snapshot) => {
    const data = snapshot.val() || { status: "IDLE" };
    const root = document.getElementById("game-root");
    if (!root) return;
    
    if (data.winner) {
        root.innerHTML = `
            <div style="text-align:center; background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); padding:25px; border-radius:30px; border: 3px solid #ffd700; box-shadow: 0 0 40px rgba(255,215,0,0.3); max-width:350px; margin:auto;">
                <h1 style="color:#ffd700; font-size:2.8rem; margin:0;">🎊 BINGO! 🎊</h1>
                <div style="margin:20px 0;">
                    <div style="background:#ffd700; color:#1a1a2e; padding:10px 25px; border-radius:50px; font-weight:900; font-size:1.4rem;">
                        ${data.winnerName}
                    </div>
                </div>
                <div style="transform: scale(0.8);">${renderBingoGrid(data.winnerCard, data.calledNumbers || [])}</div>
            </div>
        `;
        if (data.winner === userId) {
            setTimeout(() => { db.ref("gameState").remove(); db.ref("players").remove(); }, 3000);
        }
        return;
    }

    if (data.status === "WAITING" || data.status === "IDLE") {
        let gridHTML = "";
        for (let i = 1; i <= 80; i++) {
            const isTaken = !!(data.takenCards && data.takenCards[i]);
            gridHTML += `<button onclick="selectCard(${i}, ${isTaken})" style="width:38px; height:38px; margin:2px; border-radius:8px; border:none; background:${isTaken ? '#444' : '#1f4068'}; color:white; font-weight:bold;">${i}</button>`;
        }
        root.innerHTML = `
            <div style="text-align:center; color:#ffd700; margin-bottom:20px;">
                <h3>${data.status === "IDLE" ? "ለመጀመር ቁጥር ይምረጡ" : "ጨዋታው ሊጀምር ነው..."}</h3>
                <h1 style="font-size:3.5rem; margin:0;">⏱ ${data.timer || 30}s</h1>
            </div>
            <div style="display:flex; flex-wrap:wrap; justify-content:center;">${gridHTML}</div>
        `;
    } 
    else if (data.status === "PLAYING") {
        const calledNumbers = data.calledNumbers || [];
        
        if (data.currentNum && data.currentNum !== lastCalledNum) {
            lastCalledNum = data.currentNum;
            speakNumber(data.currentNum.replace("-", " "));
        }

        if (myFullCard.length > 0 && !data.winner && checkWin(myFullCard, calledNumbers)) {
            db.ref("gameState").update({ winner: userId, winnerName: user.first_name, winnerCard: myFullCard });
        }

        // ያለፉ 3 ቁጥሮችን ማዘጋጀት
        const history = calledNumbers.slice(-4, -1).reverse();
        const historyHTML = history.map(n => {
            let l = (n <= 15) ? "B" : (n <= 30) ? "I" : (n <= 45) ? "N" : (n <= 60) ? "G" : "O";
            return `<div style="background:rgba(255,255,255,0.2); color:white; width:45px; height:45px; border-radius:50%; display:flex; justify-content:center; align-items:center; font-size:0.8rem; font-weight:bold; margin:0 5px;">${l}-${n}</div>`;
        }).join('');

        root.innerHTML = `
            <div style="text-align:center; margin-bottom:20px;">
                <div style="background:#ffd700; color:#1a1a2e; width:110px; height:110px; border-radius:50%; display:flex; justify-content:center; align-items:center; font-size:2.5rem; font-weight:900; margin:0 auto; border:6px solid #fff; box-shadow: 0 0 20px rgba(255,215,0,0.4);">
                    ${data.currentNum || "..."}
                </div>
                <div style="display:flex; justify-content:center; margin-top:15px; min-height:45px;">
                    ${historyHTML}
                </div>
            </div>
            ${myFullCard.length > 0 ? renderBingoGrid(myFullCard, calledNumbers) : `<div style="text-align:center; color:white;"><h3>ተመልካች ነዎት</h3></div>`}
        `;
    }
});

window.selectCard = function(n, taken) {
    if (taken || myFullCard.length > 0) return;
    db.ref("gameState").once("value", (snapshot) => {
        const data = snapshot.val();
        if (!data || data.status === "IDLE") startGlobalTimer();
    });
    let b = getRange(1, 15, 5), i = getRange(16, 30, 5), n_c = getRange(31, 45, 4), g = getRange(46, 60, 5), o = getRange(61, 75, 5);
    n_c.splice(2, 0, "FREE"); 
    let newCard = [...b, ...i, ...n_c, ...g, ...o];
    db.ref(`players/${userId}`).set({ name: user.first_name, card: newCard });
    db.ref(`gameState/takenCards/${n}`).set(true);
};

function startGlobalTimer() {
    let t = 30;
    db.ref("gameState").update({ status: "WAITING", timer: t, winner: null, calledNumbers: [] });
    const timerInterval = setInterval(() => {
        t--;
        db.ref("gameState/timer").set(t);
        if (t <= 0) { clearInterval(timerInterval); db.ref("gameState/status").set("PLAYING"); callNumbers(); }
    }, 1000);
}

function callNumbers() {
    let pool = Array.from({length: 75}, (_, i) => i + 1);
    let called = [];
    const gameInterval = setInterval(() => {
        db.ref("gameState/winner").once("value", (s) => {
            if (s.exists() || pool.length === 0) { clearInterval(gameInterval); return; }
            let n = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
            let l = (n <= 15) ? "B" : (n <= 30) ? "I" : (n <= 45) ? "N" : (n <= 60) ? "G" : "O";
            called.push(n);
            db.ref("gameState").update({ currentNum: l + "-" + n, calledNumbers: called });
        });
    }, 3000);
}

function renderBingoGrid(card, called) {
    if (!card || card.length === 0) return "";
    const letters = ['B', 'I', 'N', 'G', 'O'];
    let gridHTML = "";
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            let num = card[col * 5 + row];
            const isHit = called.includes(num) || num === "FREE";
            const isLatest = called[called.length - 1] === num;
            gridHTML += `<div style="background:${isHit ? (isLatest ? '#ff0000' : '#e94560') : '#1f4068'}; color:white; height:40px; display:flex; justify-content:center; align-items:center; font-weight:bold; border-radius:5px; font-size:0.9rem;">${num}</div>`;
        }
    }
    return `<div style="background:white; padding:10px; border-radius:10px; width:260px; margin:auto;"><div style="display:grid; grid-template-columns:repeat(5, 1fr); margin-bottom:5px;">${letters.map(l => `<div style="text-align:center; font-weight:bold; color:#1a1a2e;">${l}</div>`).join('')}</div><div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:3px;">${gridHTML}</div></div>`;
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
