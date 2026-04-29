const firebaseConfig = {
  apiKey: "AIzaSyCtLHUAuFZNeWDCx2-1W8ZZDa43gRDjLFc",
  authDomain: "my-bingo-app-cdc12.firebaseapp.com",
  databaseURL: "https://my-bingo-app-cdc12-default-rtdb.firebaseio.com",
  projectId: "my-bingo-app-cdc12",
  storageBucket: "my-bingo-app-cdc12.firebasestorage.app",
  messagingSenderId: "793283320707",
  appId: "1:793283320707:web:4a6de806ba7a3048eaf4b6"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let myCardNum = null;

// የጨዋታ ሁኔታን መከታተል
db.ref("gameState").on("value", (snapshot) => {
    const data = snapshot.val() || { status: "WAITING", timer: 30 };
    const root = document.getElementById("game-root");
    
    if (data.status === "WAITING") {
        renderSelection(data.takenCards || {}, data.timer, root);
    } else {
        renderGame(data.currentNum, data.calledNumbers || [], root);
    }
});

function renderSelection(takenCards, timer, root) {
    let gridHTML = "";
    for (let i = 1; i <= 80; i++) {
        const isTaken = !!takenCards[i];
        const color = isTaken ? "#ff4d4d" : "#16213e";
        gridHTML += `<button onclick="pick(${i}, ${isTaken})" style="background:${color}; color:white; padding:15px 5px; border:none; border-radius:5px; font-weight:bold;">${i}</button>`;
    }
    
    root.innerHTML = `
        <div style="padding:20px; text-align:center;">
            <h2 style="color:#4cc9f0;">🎰 BINGO LIVE 🎰</h2>
            <p style="color:#ffcc00; font-size:1.3rem; font-weight:bold;">ቆጠራ፡ ${timer} ሰከንድ</p>
            <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:8px;">${gridHTML}</div>
        </div>
    `;
}

window.pick = function(n, taken) {
    if (taken || myCardNum) return;
    myCardNum = n;
    db.ref(`gameState/takenCards/${n}`).set("User");
    db.ref("gameState/timer").once("value", s => {
        if(s.val() === 30) startTimer();
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
            // ጨዋታው ሲያልቅ ከ10 ሰከንድ በኋላ ሪሴት ያደርጋል
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
    }, 3000); 
}

function renderGame(cur, all, root) {
    root.innerHTML = `
        <div style="padding:40px; text-align:center;">
            <h2 style="color:#e94560;">የወጣው ቁጥር</h2>
            <h1 style="font-size:6rem; margin:20px 0; color:#00f5d4;">${cur || "..."}</h1>
            <div style="background:#16213e; padding:15px; border-radius:10px;">
                <p>የእርስዎ ካርድ፦ <span style="color:#ffcc00; font-size:1.5rem;">${myCardNum || "አልተመረጠም"}</span></p>
                <p style="word-wrap: break-word;">ያለፉት ቁጥሮች፦ ${all.slice(-10).join(", ")}</p>
            </div>
        </div>
    `;
}
