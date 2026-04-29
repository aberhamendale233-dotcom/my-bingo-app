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
let tg = window.Telegram.WebApp;
tg.expand();

let myCardNum = null;
let userData = { name: tg.initDataUnsafe?.user?.first_name || "ተጫዋች" };

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
        const isTaken = takenCards[i];
        // የተያዙ ካርዶች ቀይ (Red) ቀለም እንዲሆኑ
        const style = isTaken ? "background:#ff4d4d; color:white; cursor:not-allowed;" : "background:#16213e; color:white; cursor:pointer;";
        gridHTML += `<button onclick="pick(${i}, ${!!isTaken})" style="${style} padding:15px 5px; border:1px solid #0f3460; border-radius:5px;">${i}</button>`;
    }
    document.body.innerHTML = `<div style="text-align:center; color:white; background:#1a1a2e; padding:20px;">
        <h2>BINGO LIVE</h2>
        <p style="color:#ffcc00;">ቆጠራ፡ ${timer} ሰከንድ</p>
        <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:8px;">${gridHTML}</div>
    </div>`;
}

window.pick = function(n, taken) {
    if (taken || myCardNum) return;
    myCardNum = n;
    db.ref(`gameState/takenCards/${n}`).set(userData.name);
    db.ref("gameState/timer").once("value", s => { if(s.val() === 30) startTimer(); });
};

function startTimer() {
    let t = 30;
    const inv = setInterval(() => {
        t--; db.ref("gameState/timer").set(t);
        if (t <= 0) { clearInterval(inv); db.ref("gameState/status").set("PLAYING"); callNum(); }
    }, 1000);
}

function callNum() {
    let p = Array.from({length:75}, (_,i)=>i+1), c = [];
    const inv = setInterval(() => {
        if (!p.length) return clearInterval(inv);
        let n = p.splice(Math.floor(Math.random()*p.length),1)[0];
        c.push(n);
        db.ref("gameState/currentNum").set(n);
        db.ref("gameState/calledNumbers").set(c);
    }, 3000); // 3 ሰከንድ
}

function renderGame(cur, all) {
    document.body.innerHTML = `<div style="text-align:center; color:white; padding:40px; background:#1a1a2e; height:100vh;">
        <h1 style="font-size:5rem; color:#e94560;">${cur || "..." }</h1>
        <p>የእርስዎ ካርድ፦ ${myCardNum}</p>
        <p>ያለፉት ቁጥሮች፦ ${all.slice(-5).join(", ")}</p>
    </div>`;
}

function renderWait() {
    document.body.innerHTML = `<div style="text-align:center; color:white; padding:40px; background:#1a1a2e; height:100vh;">
        <h2>ጨዋታ ተጀምሯል!</h2><p>እባክዎ አዲስ ዙር እስኪጀምር ይጠብቁ።</p>
    </div>`;
}
