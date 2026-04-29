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

// የጨዋታውን ሁኔታ (State) ከዳታቤዝ መከታተል
db.ref("gameState").on("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) {
        // ዳታቤዙ ባዶ ከሆነ መጀመሪያ WAITING እናድርገው
        db.ref("gameState").set({ status: "WAITING", timer: 30, currentNum: 0 });
        return;
    }

    if (data.status === "WAITING") {
        updateSelectionScreen(data.takenCards || {}, data.timer);
    } else if (data.status === "PLAYING") {
        if (myCardNum) {
            updateGameScreen(data.currentNum, data.calledNumbers || []);
        } else {
            showWaitScreen();
        }
    }
});

// --- 1. የካርድ ምርጫ ገጽ ---
function updateSelectionScreen(takenCards, timer) {
    document.body.innerHTML = `
        <div class="container">
            <h2>🎰 BINGO LIVE 🎰</h2>
            <div class="card-box">
                <h3>ካርድ ይምረጡ (1-80)</h3>
                <p style="color: #ffcc00; font-weight: bold;">ቆጠራ፡ ${timer} ሰከንድ</p>
                <div class="selection-grid" id="grid"></div>
            </div>
        </div>
    `;

    const grid = document.getElementById("grid");
    for (let i = 1; i <= 80; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        btn.className = takenCards[i] ? "num-btn taken" : "num-btn";
        btn.onclick = () => {
            if (!takenCards[i] && !myCardNum) {
                myCardNum = i;
                db.ref(`gameState/takenCards/${i}`).set(userData.name);
                if (timer === 30) startGlobalTimer(); // የመጀመሪያው ሰው ሲመርጥ ቆጠራ ይጀምራል
            }
        };
        grid.appendChild(btn);
    }
}

// --- 2. የ30 ሰከንድ ቆጠራ Logic ---
function startGlobalTimer() {
    let timeLeft = 30;
    const interval = setInterval(() => {
        timeLeft--;
        db.ref("gameState/timer").set(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(interval);
            db.ref("gameState/status").set("PLAYING");
            db.ref("gameState/calledNumbers").set([]);
            startAutoCalling(); // አውቶማቲክ ቁጥር መጥራት ይጀምራል
        }
    }, 1000);
}

// --- 3. አውቶማቲክ ቁጥር መጥራት ---
function startAutoCalling() {
    let pool = Array.from({length: 75}, (_, i) => i + 1);
    let called = [];
    
    const callInterval = setInterval(() => {
        if (pool.length === 0) { clearInterval(callInterval); return; }
        
        let randomIndex = Math.floor(Math.random() * pool.length);
        let num = pool.splice(randomIndex, 1)[0];
        called.push(num);
        
        db.ref("gameState/currentNum").set(num);
        db.ref("gameState/calledNumbers").set(called);

        // አሸናፊ ከተገኘ እዚህ ጋር ቼክ ማድረግ ይቻላል (ለጊዜው 20 ቁጥር ሲወጣ ይቁም)
        if (called.length >= 75) {
            clearInterval(callInterval);
            setTimeout(() => db.ref("gameState").set({ status: "WAITING", timer: 30 }), 5000);
        }
    }, 4000); // በየ 4 ሰከንዱ ቁጥር ይጠራል
}

// --- 4. የጨዋታ ገጽ እና መጠበቂያ ---
function showWaitScreen() {
    document.body.innerHTML = `
        <div class="container">
            <div class="card-box">
                <h2 style="color: #ff4d4d;">ጨዋታ ተጀምሯል!</h2>
                <p>እባክዎ አሁን ያለው ጨዋታ እስኪያልቅ ይጠብቁ...</p>
                <div class="loader"></div>
            </div>
        </div>
    `;
}

function updateGameScreen(currentNum, calledNumbers) {
    // እዚህ ጋር የቢንጎ ካርዱን እና የወጣውን ቁጥር የምናሳይበት ገጽ
    document.body.innerHTML = `
        <div class="container">
            <div class="card-box">
                <h2>ቁጥር፡ ${currentNum}</h2>
                <p>የተመረጠው ካርድ፡ ${myCardNum}</p>
                <div id="bingo-card" class="grid-container"></div>
            </div>
        </div>
    `;
    // የካርድ ግሪዱን እዚህ መሥራት ይቻላል...
}
