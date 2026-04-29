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
    
    if (data.status === "FINISHED") {
        root.innerHTML = `
            <div class="player-card-box">
                <h2 style="color:#ffcc00;">ዙሩ ተጠናቋል!</h2>
                <p>አድሚኑ አዲስ ዙር እስኪጀምር ይጠብቁ።</p>
                <button onclick="location.reload()" style="margin-top:20px;">Refresh</button>
            </div>`;
        return;
    }

    if (data.status === "WAITING") {
        let gridHTML = "";
        for (let i = 1; i <= 80; i++) {
            const isTaken = !!(data.takenCards && data.takenCards[i]);
            gridHTML += `<button onclick="pick(${i}, ${isTaken})" class="${isTaken ? 'taken' : ''}">${i}</button>`;
        }
        root.innerHTML = `
            <h2>🎰 BINGO LIVE 🎰</h2>
            <div style="background:#e94560; color:white; padding:8px 20px; border-radius:50px; display:inline-block; margin-bottom:20px; font-weight:bold; box-shadow:0 0 10px #e94560;">
                ቆጠራ፡ ${data.timer}s
            </div>
            <div class="grid-container">${gridHTML}</div>
        `;
    } else {
        const calledList = data.calledNumbers || [];
        root.innerHTML = `
            <div style="text-align:center;">
                <h2 style="color:#e94560; font-size:1.5rem;">የወጣው ቁጥር</h2>
                <div class="current-number-ball">${data.currentNum || "..."}</div>
                
                <div class="player-card-box">
                    <p style="color:#4cc9f0; font-weight:bold; margin-bottom:5px;">የእርስዎ ካርድ</p>
                    <div style="font-size:3.5rem; color:#ffcc00; font-weight:900; text-shadow:0 0 15px rgba(255,204,0,0.4);">${myCardNum || "---"}</div>
                    
                    <div style="margin-top:25px;">
                        <p style="color:#aaa; font-size:0.8rem; text-transform:uppercase;">ያለፉ ቁጥሮች</p>
                        <div class="history-list">
                            ${calledList.slice(-10).map(num => `<span class="history-item">${num}</span>`).join("")}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
});

window.pick = function(n, taken) {
    if (taken || myCardNum) return;
    db.ref("gameState/status").once("value", s => {
        if (s.val() === "FINISHED" || s.val() === "PLAYING") return;
        myCardNum = n;
        db.ref(`gameState/takenCards/${n}`).set(true);
        db.ref("gameState/timer").once("value", tSnap => {
            if (!tSnap.exists() || tSnap.val() === 30) startTimer();
        });
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
