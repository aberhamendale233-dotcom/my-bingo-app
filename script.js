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

db.ref(`players/${userId}`).on("value", (snapshot) => {
    myFullCard = snapshot.exists() ? snapshot.val().card : [];
});

// ዋናው የጨዋታ መቆጣጠሪያ
db.ref("gameState").on("value", (snapshot) => {
    const data = snapshot.val() || { status: "WAITING", timer: 30 };
    const root = document.getElementById("game-root");
    if (!root) return;
    
    // 🏆 አሸናፊ ሲኖር ለሁሉም ተጫዋች የሚታይ ዲዛይን
    if (data.winner) {
        root.innerHTML = `
            <div style="text-align:center; background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); padding:25px; border-radius:30px; border: 3px solid #ffd700; box-shadow: 0 0 40px rgba(255,215,0,0.3); max-width:350px; margin:auto;">
                <h1 style="color:#ffd700; font-size:2.8rem; margin:0; font-family: 'Arial Black', sans-serif; letter-spacing: 2px;">🎊 BINGO! 🎊</h1>
                
                <div style="margin:20px 0;">
                    <span style="color:#fff; font-size:1.1rem; opacity:0.8;">WINNER</span>
                    <div style="background:#ffd700; color:#1a1a2e; padding:10px 25px; border-radius:50px; display:inline-block; font-weight:900; font-size:1.4rem; margin-top:5px; box-shadow: 0 4px 15px rgba(255,215,0,0.4);">
                        ${data.winnerName}
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.05); padding:15px; border-radius:20px; border: 1px solid rgba(255,215,0,0.2);">
                    <p style="color:#ffd700; font-weight:bold; margin-bottom:10px; font-size:0.9rem; text-transform:uppercase;">Winning Card View</p>
                    <div style="transform: scale(0.9);">${renderBingoGrid(data.winnerCard, data.calledNumbers || [])}</div>
                </div>

                <button onclick="location.reload();" style="margin-top:25px; background:transparent; border: 2px solid #ffd700; color:#ffd700; padding:10px 25px; border-radius:12px; font-weight:bold; cursor:pointer; transition: 0.3s;">አዲስ ጨዋታ ለመጀመር ይጫኑ</button>
                <p style="color:rgba(255,255,255,0.5); font-size:0.8rem; margin-top:15px;">@win333bingo_bot</p>
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
                <h3 style="margin:0; font-size:1rem;">${myFullCard.length > 0 ? "ተመዝግበዋል! ቆይ..." : "ካርድ ይምረጡ"}</h3>
                <h1 style="font-size:3.5rem; margin:0; text-shadow: 0 0 15px rgba(255,215,0,0.3);">⏱ ${data.timer}s</h1>
            </div>
            <div style="display:flex; flex-wrap:wrap; justify-content:center; background:rgba(255,255,255,0.03); padding:10px; border-radius:15px;">${gridHTML}</div>
            ${myFullCard.length > 0 ? `<div style="margin-top:20px; opacity:0.6;">${renderBingoGrid(myFullCard, [])}</div>` : ""}
        `;
    } 
    // PLAYING ሁኔታ
    else {
        const calledNumbers = data.calledNumbers || [];
        
        if (myFullCard.length > 0 && !data.winner && checkWin(myFullCard, calledNumbers)) {
            db.ref("gameState").update({ winner: userId, winnerName: user.first_name, winnerCard: myFullCard });
        }

        root.innerHTML = `
            <div style="text-align:center; margin-bottom:25px;">
                <div style="background:#ffd700; color:#1a1a2e; width:110px; height:110px; border-radius:50%; display:flex; justify-content:center; align-items:center; font-size:2.5rem; font-weight:900; margin:0 auto; border:6px solid #fff; box-shadow: 0 0 25px rgba(255,215,0,0.5);">
                    ${data.currentNum || "..."}
                </div>
            </div>
            ${myFullCard.length > 0 ? renderBingoGrid(myFullCard, calledNumbers) : `<div style="text-align:center; color:white; padding:40px; background:rgba(255,255,255,0.05); border-radius:25px; border:1px dashed rgba(255,255,255,0.2);"><h2>WATCHING</h2><p>ቀጣዩን ዙር ይጠብቁ</p></div>`}
        `;
    }
});

window.generateBingoCard = function(n, taken) {
    if (taken || (myFullCard && myFullCard.length > 0)) return;
    db.ref("gameState").once("value", (snapshot) => {
        const data = snapshot.val();
        if (!data || data.winner || data.status === "FINISHED") startTimer();
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
            gridHTML += `<div style="background:${isHit ? '#e94560' : '#1f4068'}; color:white; height:42px; display:flex; justify-content:center; align-items:center; font-weight:bold; border-radius:8px; font-size:1rem; border:1px solid rgba(0,0,0,0.1);">${num}</div>`;
        }
    }
    return `<div style="background:white; padding:10px; border-radius:15px; width:100%; max-width:280px; margin:auto;"><div style="display:grid; grid-template-columns:repeat(5, 1fr); margin-bottom:8px;">${letters.map(l => `<div style="color:#1a1a2e; font-weight:900; text-align:center; font-size:1.1rem;">${l}</div>`).join('')}</div><div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:4px;">${gridHTML}</div></div>`;
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
