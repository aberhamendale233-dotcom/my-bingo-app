const firebaseConfig = {
  apiKey: "AIzaSyCtLHUAuFZNeWDCx2-1W8ZZDa43gRDjLFc",
  authDomain: "my-bingo-app-cdc12.firebaseapp.com",
  databaseURL: "https://my-bingo-app-cdc12-default-rtdb.firebaseio.com",
  projectId: "my-bingo-app-cdc12",
  storageBucket: "my-bingo-app-cdc12.firebasestorage.app",
  messagingSenderId: "793283320707",
  appId: "1:793283320707:web:4a6de806ba7a3048eaf4b6"
};

// Firebase መጀመር
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
let myCardNum = null;

// የጨዋታውን ሁኔታ መከታተል
db.ref("gameState").on("value", (snapshot) => {
    const data = snapshot.val() || { status: "WAITING", timer: 30 };
    const root = document.getElementById("game-root");
    if (!root) return;
    
    if (data.status === "WAITING") {
        let gridHTML = "";
        for (let i = 1; i <= 80; i++) {
            const isTaken = !!(data.takenCards && data.takenCards[i]);
            gridHTML += `<button onclick="pick(${i}, ${isTaken})" style="background:${isTaken ? '#ff4d4d' : '#16213e'}; color:white; border:none; padding:10px; cursor:pointer; border-radius:5px; font-weight:bold;">${i}</button>`;
        }
        root.innerHTML = `
            <div style="text-align:center;">
                <h2 style="color:#4cc9f0;">🎰 BINGO LIVE 🎰</h2>
                <p style="font-size:1.5rem; color:#ffcc00; font-weight:bold;">ቆጠራ፡ ${data.timer} ሰከንድ</p>
                <div style="display:grid; grid-template-columns:repeat(8, 1fr); gap:5px; max-width:500px; margin:auto;">${gridHTML}</div>
            </div>
        `;
    } else {
        root.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <h2 style="color:#e94560;">የወጣው ቁጥር</h2>
                <h1 style="font-size:6rem; color:#00f5d4; margin:10px 0;">${data.currentNum || "..."}</h1>
                <div style="background:#1b1b2f; padding:15px; border-radius:10px; border:1px solid #4cc9f0;">
                    <p style="font-size:1.2rem;">የእርስዎ ካርድ፦ <span style="color:#ffcc00; font-weight:bold;">${myCardNum || "አልመረጡም"}</span></p>
                    <p style="color:#aaa;">ያለፉት ቁጥሮች፦ ${(data.calledNumbers || []).slice(-8).join(", ")}</p>
                </div>
            </div>
        `;
    }
});

// ቁጥር መምረጫ
window.pick = function(n, taken) {
    if (taken || myCardNum) return;
    myCardNum = n;
    db.ref(`gameState/takenCards/${n}`).set(true);
    
    // የመጀመሪያው ሰው ሲመርጥ ቆጠራው ይጀምራል
    db.ref("gameState/timer").once("value", s => {
        if (s.val() === 30 || !s.exists()) {
            startTimer();
        }
    });
};

// የ30 ሰከንድ ቆጠራ
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

// ቁጥሮችን በየተራ መጥራት
function callNumbers() {
    let pool = Array.from({length: 80}, (_, i) => i + 1);
    let called = [];
    const inv = setInterval(() => {
        if (pool.length === 0) {
            clearInterval(inv);
            // ጨዋታው ሲያልቅ Reset ማድረጊያ
            setTimeout(() => {
                db.ref("gameState").set({ status: "WAITING", timer: 30, takenCards: {}, calledNumbers: [] });
            }, 10000);
            return;
        }
        let randomIndex = Math.floor(Math.random() * pool.length);
        let n = pool.splice(randomIndex, 1)[0];
        called.push(n);
        db.ref("gameState/currentNum").set(n);
        db.ref("gameState/calledNumbers").set(called);
    }, 3000); // በየ 3 ሰከንዱ
}
