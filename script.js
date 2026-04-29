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
const root = document.getElementById("game-root");

let myCardNum = null;

// የጨዋታ ሁኔታን መከታተል
db.ref("gameState").on("value", (snapshot) => {
    const data = snapshot.val() || { status: "WAITING", timer: 30 };
    
    if (data.status === "WAITING") {
        renderSelection(data.takenCards || {}, data.timer);
    } else {
        myCardNum ? renderGame(data.currentNum, data.calledNumbers || []) : renderWait();
    }
});

function renderSelection(takenCards, timer) {
    let gridHTML = "";
    for (let i = 1; i <= 80; i++) {
        const isTaken = !!takenCards[i];
        const color = isTaken ? "#ff4d4d" : "#16213e";
        gridHTML += `<button onclick="pick(${i}, ${isTaken})" class="num-btn" style="background:${color}; color:white;">${i}</button>`;
    }
    
    root.innerHTML = `
        <div class="container">
            <h2>🎰 BINGO LIVE 🎰</h2>
            <p style="color:#ffcc00; font-size:1.2rem;">ቆጠራ፡ ${timer} ሰከንድ</p>
            <div class="selection-grid">${gridHTML}</div>
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
    let pool = Array.from({length: 75}, (_, i) => i + 1);
    let called = [];
    const inv = setInterval(() => {
        if (pool.length === 0) return clearInterval(inv);
        let n = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        called.push(n);
        db.ref("gameState/currentNum").set(n);
        db.ref("gameState/calledNumbers").set(called);
    }, 3000); // 3 ሰከንድ
}

function renderGame(cur, all) {
    root.innerHTML = `
        <div class="container">
            <h1 style="font-size:5rem; color:#e94560;">${cur || "..."}</h1>
            <p>የእርስዎ ካርድ፦ ${myCardNum}</p>
            <p>ያለፉት ቁጥሮች፦ ${all.slice(-5).join(", ")}</p>
        </div>
    `;
}

function renderWait() {
    root.innerHTML = `
        <div class="container">
            <h2>ጨዋታ ተጀምሯል!</h2>
            <p>እባክዎ አዲስ ዙር እስኪጀምር ይጠብቁ።</p>
        </div>
    `;
}
