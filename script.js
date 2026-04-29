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
            gridHTML += `<button onclick="pick(${i}, ${isTaken})" style="background:${isTaken ? '#ff4d4d' : '#16213e'}; color:white; border:none; padding:10px; border-radius:5px;">${i}</button>`;
        }
        root.innerHTML = `<h2>🎰 BINGO 🎰</h2><p>ቆጠራ፡ ${data.timer} ሰከንድ</p><div style="display:grid; grid-template-columns:repeat(8, 1fr); gap:5px;">${gridHTML}</div>`;
    } else {
        root.innerHTML = `<h2>የወጣው ቁጥር</h2><h1 style="font-size:4rem; color:#00f5d4;">${data.currentNum || "..."}</h1><p>የእርስዎ፦ ${myCardNum || "አልመረጡም"}</p><p>ያለፉት፦ ${(data.calledNumbers || []).slice(-5).join(", ")}</p>`;
    }
});

window.pick = function(n, taken) {
    if (taken || myCardNum) return;
    myCardNum = n;
    db.ref(`gameState/takenCards/${n}`).set(true);
    db.ref("gameState/timer").once("value", s => { if(s.val() === 30) startTimer(); });
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
            setTimeout(() => db.ref("gameState").set({ status: "WAITING", timer: 30 }), 5000); // ጨዋታው ሲያልቅ Reset ማድረጊያ
            return;
        }
        let n = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        called.push(n);
        db.ref("gameState/currentNum").set(n);
        db.ref("gameState/calledNumbers").set(called);
    }, 3000);
}
