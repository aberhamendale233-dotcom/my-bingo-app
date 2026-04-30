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

// የቴሌግራም ተጠቃሚ መረጃን ማግኘት
const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe?.user || { id: "guest_" + Math.floor(Math.random() * 1000), first_name: "Guest" };
const userId = user.id;

let myFullCard = []; 

// ተጫዋቹ ቀድሞ የመረጠው ካርድ ካለ ከዳታቤዝ መጫን
db.ref(`players/${userId}`).once("value", (snapshot) => {
    if (snapshot.exists()) {
        myFullCard = snapshot.val().card;
    }
});

db.ref("gameState").on("value", (snapshot) => {
    const data = snapshot.val() || { status: "WAITING", timer: 30 };
    const root = document.getElementById("game-root");
    if (!root) return;
    
    if (data.status === "WAITING") {
        let gridHTML = "";
        for (let i = 1; i <= 80; i++) {
            const isTaken = !!(data.takenCards && data.takenCards[i]);
            gridHTML += `<button onclick="generateBingoCard(${i}, ${isTaken})" class="${isTaken ? 'taken' : ''}">${i}</button>`;
        }
        
        let statusMsg = myFullCard.length > 0 
            ? `<div style="margin-bottom:20px; color:#ffd700;"><h3>ሰላም ${user.first_name}! ተዘጋጅተዋል... (${data.timer}s)</h3></div>` 
            : `<h2>🎰 ${user.first_name} ካርድ ይምረጡ 🎰</h2>`;

        root.innerHTML = `
            ${statusMsg}
            <div class="grid-container">${gridHTML}</div>
            ${myFullCard.length > 0 ? `<div class="bingo-card-5x5">${renderBingoGrid(myFullCard, [])}</div>` : ""}
        `;
    } else {
        const calledNumbers = data.calledNumbers || [];
        root.innerHTML = `
            <div style="color:white; margin-bottom:10px;">ተጫዋች: ${user.first_name}</div>
            <div class="number-display-box">
                <div class="bingo-ball-call">${data.currentNum || "..."}</div>
            </div>
            <div class="bingo-card-5x5">${renderBingoGrid(myFullCard, calledNumbers)}</div>
        `;
    }
});

function renderBingoGrid(card, called) {
    const letters = ['B', 'I', 'N', 'G', 'O'];
    let gridHTML = "";
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            let num = card[col * 5 + row];
            const isHit = called.includes(num) || num === "FREE";
            gridHTML += `<div style="background:${isHit ? '#e94560' : '#1f4068'}; color:white; height:40px; display:flex; justify-content:center; align-items:center; font-weight:bold; border-radius:5px; font-size:0.8rem;">${num}</div>`;
        }
    }
    return `
        <div style="background: white; padding: 10px; border-radius: 15px;">
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); margin-bottom: 8px;">
                ${letters.map(l => `<div style="color:#1a1a2e; font-weight:900; text-align:center;">${l}</div>`).join('')}
            </div>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px;">${gridHTML}</div>
        </div>
    `;
}

window.generateBingoCard = function(n, taken) {
    if (taken || myFullCard.length > 0) return;
    
    let b = getRange(1, 15, 5);
    let i = getRange(16, 30, 5);
    let n_col = getRange(31, 45, 4);
    let g = getRange(46, 60, 5);
    let o = getRange(61, 75, 5);
    n_col.splice(2, 0, "FREE"); 
    
    myFullCard = [...b, ...i, ...n_col, ...g, ...o];
    
    // የተጫዋቹን መረጃ እና ካርድ በራሱ ID ሴቭ ማድረግ
    db.ref(`players/${userId}`).set({
        name: user.first_name,
        card: myFullCard,
        chosenSpot: n
    });

    db.ref(`gameState/takenCards/${n}`).set(true);
    db.ref("gameState/timer").once("value", s => { 
        if (!s.exists() || s.val() === 30) startTimer(); 
    });
};

function getRange(min, max, count) {
    let arr = [];
    while(arr.length < count) {
        let r = Math.floor(Math.random() * (max - min + 1)) + min;
        if(arr.indexOf(r) === -1) arr.push(r);
    }
    return arr.sort((a, b) => a - b);
}

function startTimer() {
    let t = 30;
    db.ref("gameState/status").set("WAITING");
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
        let letter = (n <= 15) ? "B" : (n <= 30) ? "I" : (n <= 45) ? "N" : (n <= 60) ? "G" : "O";
        called.push(n);
        db.ref("gameState").update({ currentNum: letter + "-" + n, calledNumbers: called });
    }, 4000);
}
