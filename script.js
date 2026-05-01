const firebase = require("firebase-admin");

// 🔥 Firebase setup (add your serviceAccount.json)
firebase.initializeApp({
    credential: firebase.credential.applicationDefault(),
    databaseURL: "https://YOUR_PROJECT.firebaseio.com"
});

const db = firebase.database();

// ================= GAME STATE =================
let pool = [];
let calledNumbers = [];
let players = {};
let gameRunning = false;
let currentRoom = "room1";

// ================= INIT =================
function initPool() {
    pool = Array.from({ length: 75 }, (_, i) => i + 1);
    shuffle(pool);
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

// ================= GAME START =================
function startGame() {
    console.log("🎰 Game Starting...");
    gameRunning = true;

    initPool();
    calledNumbers = [];

    db.ref("gameState").set({
        status: "PLAYING",
        calledNumbers: [],
        currentNumber: null,
        winner: null
    });

    gameLoop();
}

// ================= NUMBER CALL LOOP =================
function gameLoop() {
    const interval = setInterval(() => {
        if (!gameRunning || pool.length === 0) {
            clearInterval(interval);
            return;
        }

        const num = pool.pop();
        const letter = getLetter(num);
        const full = `${letter}-${num}`;

        calledNumbers.push(num);

        console.log("📢 Called:", full);

        db.ref("gameState").update({
            currentNumber: full,
            calledNumbers: calledNumbers
        });

        checkWinner();

    }, 3000);
}

// ================= LETTER SYSTEM =================
function getLetter(n) {
    if (n <= 15) return "B";
    if (n <= 30) return "I";
    if (n <= 45) return "N";
    if (n <= 60) return "G";
    return "O";
}

// ================= PLAYER JOIN =================
function addPlayer(userId, card) {
    players[userId] = card;

    db.ref("players/" + userId).set({
        card,
        joinedAt: Date.now()
    });

    console.log("👤 Player joined:", userId);
}

// ================= WIN CHECK =================
function checkWinner() {
    for (let userId in players) {
        const card = players[userId];

        if (isWinner(card)) {
            console.log("🏆 WINNER:", userId);

            gameRunning = false;

            db.ref("gameState").update({
                winner: userId,
                status: "FINISHED"
            });

            return;
        }
    }
}

// ================= WIN LOGIC =================
function isWinner(card) {
    return card.every(num =>
        calledNumbers.includes(num) || num === "FREE"
    );
}

// ================= RESET GAME =================
function resetGame() {
    gameRunning = false;
    pool = [];
    calledNumbers = [];
    players = {};

    db.ref("gameState").set({
        status: "IDLE",
        calledNumbers: [],
        currentNumber: null,
        winner: null
    });

    db.ref("players").remove();

    console.log("🔄 Game Reset");
}

// ================= EXPORT (OPTIONAL API USE) =================
module.exports = {
    startGame,
    addPlayer,
    resetGame
};

// ================= AUTO START =================
setTimeout(() => {
    startGame();
}, 3000);
