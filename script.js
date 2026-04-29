// Firebase Configuration (ከ Screenshot 175 የተወሰደ)
const firebaseConfig = {
  apiKey: "AIzaSyCtLHUAuFZNeWDCx2-1W8ZZDa43gRDjLFc",
  authDomain: "my-bingo-app-cdc12.firebaseapp.com",
  databaseURL: "https://my-bingo-app-cdc12-default-rtdb.firebaseio.com",
  projectId: "my-bingo-app-cdc12",
  storageBucket: "my-bingo-app-cdc12.firebasestorage.app",
  messagingSenderId: "793283320707",
  appId: "1:793283320707:web:4a6de806ba7a3048eaf4b6",
  measurementId: "G-6YP0VH4Z58"
};

// Firebase Initialize
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Telegram WebApp Setup
let tg = window.Telegram.WebApp;
tg.expand();

let myCardNum = null;
let userData = { 
    name: tg.initDataUnsafe?.user?.first_name || "ተጫዋች", 
    id: tg.initDataUnsafe?.user?.id || Math.floor(Math.random() * 1000) 
};

// የጨዋታውን ሁኔታ ከዳታቤዝ መከታተል
db.ref("gameState").on("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) {
        // ዳታቤዙ ባዶ ከሆነ ማስጀመሪያ መረጃ መሙላት
        db.ref("gameState").set({ status: "WAITING", timer: 30, currentNum: 0 });
        return;
    }

    if (data.status === "WAITING") {
        showSelectionScreen(data.takenCards || {}, data.timer);
    } else if (data.status === "PLAYING") {
        if (myCardNum) {
            showGameScreen(data.currentNum, data.calledNumbers || []);
        } else {
            showWaitScreen();
        }
    }
});

// 1. የካርድ ምርጫ ገጽ (1-80)
function showSelectionScreen(takenCards, timer) {
    let gridHTML = "";
    for (let i = 1; i <= 80; i++) {
        // የተያዙ ካርዶች በቀይ ቀለም እንዲታዩ (Red Color)
        const isTaken = takenCards[i] ? "background-color: #ff4d4d; cursor: not-allowed;" : "background-color: #16213e; cursor: pointer;";
        gridHTML += `<button class="num-btn" style="${isTaken} color: white; padding: 15px 5px; border: 1px solid #0f3460; border-radius: 5px;" onclick="pickCard(${i}, ${!!takenCards[i]})">${i}</button>`;
    }

    document.body.innerHTML = `
        <div class="container" style="text-align: center; font-family: sans-serif; color: white; background-color: #1a1a2e; min-height: 100vh; padding: 20px;">
            <h2>🎰 BINGO LIVE 🎰</h2>
            <div class="card-box" style="background: #0f3460; padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                <h3>ካርድ ይምረጡ (1-80)</h3>
                <p id="timer-text" style="color: #ffcc00; font-weight: bold; font-size: 1.2rem;">
                    ${timer < 30 ? `ቆጠራ፡ ${timer} ሰከንድ` : "የመጀመሪያው ተጫዋች ሲመርጥ ቆጠራ ይጀምራል"}
                </p>
                <div class="selection-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; max-height: 400px; overflow-y: auto; padding: 10px;">
                    ${gridHTML}
                </div>
            </div>
        </div>
    `;
}

// ካርድ የመምረጥ ተግባር
window.pickCard = function(num, isTaken) {
    if (isTaken) return alert("ይህ ካርድ ተይዟል!");
    if (myCardNum) return alert("ቀድሞውኑ ካርድ መርጠዋል!");

    myCardNum = num;
    db.ref(`gameState/takenCards/${num}`).set(userData.name);
    
    db.ref("gameState/timer").once("value", (s) => {
        // የመጀመሪያው ተጫዋች ከሆነ ቆጠራ ይጀምራል
        if (s.val() === 30) startGlobalTimer();
    });
};

// 2. የ30 ሰከንድ ቆጠራ Logic
function startGlobalTimer() {
    let timeLeft = 30;
    const interval = setInterval(() => {
        timeLeft--;
        db.ref("gameState/timer").set(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(interval);
            db.ref("gameState/status").set("PLAYING");
            startAutoCalling();
        }
    }, 1000);
}

// 3. አውቶማቲክ ጥሪ በየ 3 ሰከንዱ
function startAutoCalling() {
    let pool = Array.from({length: 75}, (_, i) => i + 1);
    let called = [];
    
    const callInterval = setInterval(() => {
        if (pool.length === 0) {
            clearInterval(callInterval);
            setTimeout(resetGame, 10000); // ጨዋታው ሲያልቅ ከ10 ሰከንድ በኋላ አዲስ ዙር ያዘጋጃል
            return;
        }
        
        let randomIndex = Math.floor(Math.random() * pool.length);
        let num = pool.splice(randomIndex, 1)[0];
        called.push(num);
        
        db.ref("gameState/currentNum").set(num);
        db.ref("gameState/calledNumbers").set(called);
    }, 3000); // ጥሪው በየ 3 ሰከንዱ ይሆናል
}

// 4. የጨዋታ ገጽ
function showGameScreen(currentNum, calledNumbers) {
    document.body.innerHTML = `
        <div class="container" style="text-align: center; font-family: sans-serif; color: white; background-color: #1a1a2e; min-height: 100vh; padding: 20px;">
            <div class="card-box" style="background: #0f3460; padding: 30px; border-radius: 10px;">
                <h1 style="font-size: 4rem; color: #e94560; margin: 0;">${currentNum || "..."}</h1>
                <p style="font-size: 1.2rem;">የእርስዎ ካርድ ቁጥር፦ <span style="color: #ffcc00; font-weight: bold;">${myCardNum}</span></p>
                <hr style="border: 0.5px solid #533483; margin: 20px 0;">
                <p>የወጡ ቁጥሮች፦ ${calledNumbers.slice(-5).join(", ")}</p>
                <div style="font-size: 0.8rem; color: #aaa;">ጠቅላላ የወጡ፦ ${calledNumbers.length}/75</div>
            </div>
        </div>
    `;
}

// 5. መጠበቂያ ገጽ (ጨዋታ ከተጀመረ በኋላ ለሚመጡ)
function showWaitScreen() {
    document.body.innerHTML = `
        <div class="container" style="text-align: center; font-family: sans-serif; color: white; background-color: #1a1a2e; min-height: 100vh; padding: 40px;">
            <div class="card-box" style="background: #0f3460; padding: 30px; border-radius: 10px;">
                <h2 style="color: #ff4d4d;">ጨዋታ ተጀምሯል!</h2>
                <p>እባክዎ አሁን ያለው ጨዋታ እስኪያልቅ ይጠብቁ።</p>
                <p>አዲስ ዙር ሲጀመር ካርድ መያዝ ይችላሉ።</p>
                <div style="border: 4px solid #f3f3f3; border-top: 4px solid #e94560; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 20px auto;"></div>
            </div>
        </div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `;
}

function resetGame() {
    db.ref("gameState").set({
        status: "WAITING",
        timer: 30,
        currentNum: 0,
        takenCards: {},
        calledNumbers: []
    });
    myCardNum = null;
}
