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
        root.innerHTML = `<div style="text-align:center; padding:50px; color:#ffcc00;"><h2>ጨዋታው ተጠናቋል!</h2><p>አስተዳዳሪው አዲስ ዙር እስኪጀምር ይጠብቁ።</p></div>`;
        return;
    }

    if (data.status === "WAITING") {
        let gridHTML = "";
        for (let i = 1; i <= 80; i++) {
            const isTaken = !!(data.takenCards && data.takenCards[i]);
            gridHTML += `<button onclick="pick(${i}, ${isTaken})" style="background:${isTaken ? '#ff4d4d' : '#16213e'}; color:white; border:1px solid #4cc9f0; padding:12px; cursor:pointer; border-radius:5px; font-weight:bold;">${i}</button>`;
        }
        root.innerHTML = `
            <div style="text-align:center; padding:10px;">
                <h2 style="color:#4cc9f0; text-shadow: 0 0 10px #4cc9f0;">🎰 BINGO LIVE 🎰</h2>
                <div style="background:#e94560; color:white; padding:10px; border-radius:50px; display:inline-block; margin-bottom:15px; font-weight:bold;">ቆጠራ፡ ${data.timer} ሰከንድ</div>
                <div style="display:grid; grid-template-columns:repeat(8, 1fr); gap:5px; max-width:500px; margin:auto;">${gridHTML}</div>
            </div>
        `;
    } else {
        // ቁጥር መጥራት ሲጀምር (PLAYING MODE)
        const calledList = data.calledNumbers || [];
        root.innerHTML = `
            <div style="text-align:center; padding:20px; font-family:sans-serif;">
                <h2 style="color:#e94560; margin-bottom:5px;">የወጣው ቁጥር</h2>
                <div style="width:120px; height:120px; line-height:120px; background:#00f5d4; color:#1a1a2e; font-size:4rem; font-weight:bold; border-radius:50%; margin: 20px auto; box-shadow: 0 0 20px #00f5d4;">${data.currentNum || "..."}</div>
                
                <div style="background:#16213e; padding:20px; border-radius:15px; border:2px solid #4cc9f0; margin-top:20px;">
                    <p style="color:#4cc9f0; font-size:1.2rem;">የእርስዎ ካርድ</p>
                    <div style="font-size:3rem; color:#ffcc00; font-weight:bold; margin:10px 0;">${myCardNum || "አልመረጡም"}</div>
                    
                    <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
                    
                    <p style="color:#aaa;">ያለፉት ቁጥሮች</p>
                    <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px; font-size:1.1rem; color:white;">
                        ${calledList.map(num => `<span style="background:#333; padding:5px 10px; border-radius:5px;">${num}</span>`).join("")}
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
        // ቁጥሩን እና ሙሉ ዝርዝሩን በአንድ ላይ አፕዴት ያደርጋል
        db.ref("gameState").update({
            currentNum: n,
            calledNumbers: called
        });
    }, 3000);
}
