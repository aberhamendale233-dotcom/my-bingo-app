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
let myCardNum = null;

db.ref("gameState").on("value", (snapshot) => {
    const data = snapshot.val() || { status: "WAITING", timer: 30 };
    const root = document.getElementById("game-root");
    if (!root) return;
    
    if (data.status === "WAITING") {
        let gridHTML = "";
        for (let i = 1; i <= 80; i++) {
            const isTaken = !!(data.takenCards && data.takenCards[i]);
            gridHTML += `<button onclick="pick(${i}, ${isTaken})" class="${isTaken ? 'taken' : ''}">${i}</button>`;
        }
        root.innerHTML = `
            <h2>🎰 BINGO LIVE 🎰</h2>
            <div style="background:#e94560; padding:5px 15px; border-radius:20px; display:inline-block; margin-bottom:15px;">ቆጠራ፡ ${data.timer}s</div>
            <div class="grid-container">${gridHTML}</div>
        `;
    } else {
        const calledList = data.calledNumbers || [];
        root.innerHTML = `
            <h2>የወጣው ቁጥር</h2>
            <div class="current-number-ball">${data.currentNum || "..."}</div>
            <div class="player-card-box">
                <p style="color:#4cc9f0;">የእርስዎ ካርድ</p>
                <div style="font-size:3rem; color:#ffcc00; font-weight:bold;">${myCardNum || "---"}</div>
                <div style="margin-top:15px;">
                    <p style="color:#aaa; font-size:0.7rem;">ያለፉ ቁጥሮች</p>
                    <div class="history-list">
                        ${calledList.slice(-12).map(n => `<span class="history-item">${n}</span>`).join("")}
                    </div>
                </div>
            </div>
        `;
    }
});

window.pick = function(n, taken) {
    if (taken || myCardNum) return;
    myCardNum = n;
    db.ref(`gameState/takenCards/${n}`).set(true);
    db.ref("gameState/timer").once("value", s => {
        if (!s.exists() || s.val() === 30) startTimer();
    });
};

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
    let pool = Array.from({length: 80}, (_, i) => i + 1);
    let called = [];
    const inv = setInterval(() => {
        if (pool.length === 0) {
            clearInterval(inv);
            db.ref("gameState/status").set("FINISHED");
            return;
        }
        let n = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        called.push(n);
        db.ref("gameState").update({ currentNum: n, calledNumbers: called });
    }, 3500);
}
