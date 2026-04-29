// Firebase Configuration (ከ Screenshot 184 የተወሰደ)
const firebaseConfig = {
  apiKey: "AIzaSyCtLHUAuFZNeWDCx2-1W8ZZDa43gRDjLFc",
  authDomain: "my-bingo-app-cdc12.firebaseapp.com",
  databaseURL: "https://my-bingo-app-cdc12-default-rtdb.firebaseio.com",
  projectId: "my-bingo-app-cdc12",
  storageBucket: "my-bingo-app-cdc12.firebasestorage.app",
  messagingSenderId: "793283320707",
  appId: "1:793283320707:web:4a6de806ba7a3048eaf4b6"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

db.ref("gameState").on("value", (snapshot) => {
    const data = snapshot.val() || { status: "WAITING", timer: 30 };
    const root = document.getElementById("game-root");
    
    if (data.status === "WAITING") {
        let gridHTML = "";
        for (let i = 1; i <= 80; i++) {
            const isTaken = data.takenCards && data.takenCards[i];
            const color = isTaken ? "#ff4d4d" : "#16213e"; // የተያዘ በቀይ
            gridHTML += `<button onclick="pick(${i}, ${!!isTaken})" style="background:${color}; color:white; padding:15px 5px; border:none; border-radius:5px;">${i}</button>`;
        }
        root.innerHTML = `
            <div style="padding:20px;">
                <h2>🎰 BINGO LIVE 🎰</h2>
                <p style="color:#ffcc00;">ቆጠራ፡ ${data.timer} ሰከንድ</p>
                <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:8px;">${gridHTML}</div>
            </div>`;
    } else {
        root.innerHTML = `<div style="padding:50px;"><h1>ቁጥሩ፡ ${data.currentNum || "..."}</h1></div>`;
    }
});

window.pick = function(n, taken) {
    if (taken) return alert("ይህ ቁጥር ተይዟል!");
    db.ref(`gameState/takenCards/${n}`).set("User");
    db.ref("gameState/timer").once("value", s => { if(s.val() === 30) startTimer(); });
};

function startTimer() {
    let t = 30;
    const inv = setInterval(() => {
        t--; db.ref("gameState/timer").set(t);
        if (t <= 0) { 
            clearInterval(inv); 
            db.ref("gameState/status").set("PLAYING"); 
            // ጥሪ በየ 3 ሰከንዱ እዚህ ይጀምራል
        }
    }, 1000);
}
