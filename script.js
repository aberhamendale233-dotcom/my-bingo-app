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
    
    // ቆጠራው እስኪያልቅ (0 እስኪሆን) ድረስ ቁጥሮቹ (1-80) አይጠፉም
    if (data.status === "WAITING") {
        let gridHTML = "";
        for (let i = 1; i <= 80; i++) {
            const isTaken = !!(data.takenCards && data.takenCards[i]);
            gridHTML += `<button onclick="pick(${i}, ${isTaken})" style="background:${isTaken ? '#ff4d4d' : '#16213e'}; color:white; border:none; padding:10px; cursor:pointer; border-radius:5px; font-weight:bold;">${i}</button>`;
        }
        root.innerHTML = `
            <h2 style="color:#4cc9f0;">🎰 BINGO LIVE 🎰</h2>
            <p style="font-size:1.5rem; color:#ffcc00; font-weight:bold;">ቆጠራ፡ ${data.timer} ሰከንድ</p>
            <div style="display:grid; grid-template-columns:repeat(8, 1fr); gap:5px; max-width:500px; margin:auto;">${gridHTML}</div>
        `;
    } else {
        // 30 ሰከንዱ አልቆ "PLAYING" ሲሆን ብቻ ነው ይህ የሚመጣው
        root.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <h2 style="color:#e94560;">የወጣው ቁጥር</h2>
                <h1 style="font-size:6rem; color:#00f5d4;">${data.currentNum || "..."}</h1>
                <div style="background:#16213e; padding:15px; border-radius:10px;">
                    <p>የእርስዎ ካርድ፦ <span style="color:#ffcc00; font-weight:bold;">${myCardNum || "አልመረጡም"}</span></p>
                    <p>ያለፉት ቁጥሮች፦ ${(data.calledNumbers || []).slice(-8).join(", ")}</p>
                </div>
            </div>
        `;
    }
});

window.pick = function(n, taken) {
    if (taken || myCardNum) return;
    myCardNum = n;
    db.ref(`gameState/takenCards/${n}`).set(true);
    
    // ቆጠራው ገና ካልጀመረ (30 ከሆነ) እንዲጀምር ያደርጋል
    db.ref("gameState/timer").once("value", s => {
        if (!s.exists() || s.val() === 30) {
            startTimer();
        }
    });
};

function startTimer() {
    let t = 30;
    const inv = setInterval(() => {
        t--;
        db.ref("gameState/timer").set(t);
        if (t <= 0) {
            clearInterval(inv);
            // ቆጠራው 0 ሲገባ ብቻ ነው "PLAYING" የሚሆነው
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
            // ጨዋታው ሲያልቅ ወደ መጀመሪያው (WAITING) እንዲመለስ ዳታቤዙን ያጠፋል
            setTimeout(() => db.ref("gameState").remove(), 10000);
            return;
        }
        let n = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        called.push(n);
        db.ref("gameState/currentNum").set(n);
        db.ref("gameState/calledNumbers").set(called);
    }, 3000);
}
