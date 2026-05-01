const firebase = require("firebase-admin");

// 🔥 INIT FIREBASE
firebase.initializeApp({
    credential: firebase.credential.applicationDefault(),
    databaseURL: "https://YOUR_PROJECT.firebaseio.com"
});

const db = firebase.database();

// ================= GAME CONFIG =================
let pool = [];
let called = [];
let players = {};
let selectionOpen = false;
let gameRunning = false;

// ================= INIT NUMBERS (1–75) =================
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

// ================= START SELECTION =================
function startSelection() {
    selectionOpen = true;
    gameRunning = false;
    initPool();
    called = [];

    db.ref("gameState").set({
        status: "WAITING",
        timer: 30,
        calledNumbers: []
    });

    let t = 30;

    const interval = setInterval(() => {
        t--;

        db.ref("gameState/timer").set(t);

        if (t <= 0) {
            clearInterval(interval);
            selectionOpen = false;
            startGame();
        }
    }, 1000);
}

// ================= PLAYER JOIN (1–5 CARDS ALLOWED) =================
function joinPlayer(userId, cardsCount = 1) {
    if (!selectionOpen) return "❌ Closed";

    if (players[userId]) return "❌ Already joined";

    if (cardsCount < 1 || cardsCount > 5) {
        return "❌ Invalid card count (1–5 only)";
    }

    let cards = [];

    for (let i = 0; i < cardsCount; i++) {
        cards.push(generateCard());
    }

    players[userId] = cards;

    db.ref("players/" + userId).set({
        cards
    });

    return "✅ Joined";
}

// ================= CARD GENERATION =================
function generateCard() {
    let card = [];

    for (let i = 0; i < 25; i++) {
        card.push(Math.floor(Math.random() * 75) + 1);
    }

    card[12] = "FREE";
    return card;
}

// ================= START GAME =================
function startGame() {
    gameRunning = true;

    db.ref("gameState").update({
        status: "PLAYING"
    });

    gameLoop();
}

// ================= GAME LOOP =================
function gameLoop() {
    const interval = setInterval(() => {

        if (!gameRunning || pool.length === 0) {
            clearInterval(interval);
            return;
        }

        const num = drawNumber();
        const label = getLabel(num);

        called.push(num);

        db.ref("gameState").update({
            currentNumber: `${label}-${num}`,
            calledNumbers: called
        });

        checkWinner();

    }, 3000);
}

// ================= DRAW NUMBER =================
function drawNumber() {
    let i = Math.floor(Math.random() * pool.length);
    return pool.splice(i, 1)[0];
}

// ================= LETTER =================
function getLabel(n) {
    if (n <= 15) return "B";
    if (n <= 30) return "I";
    if (n <= 45) return "N";
    if (n <= 60) return "G";
    return "O";
}

// ================= WIN CHECK =================
function checkWinner() {
    for (let userId in players) {
        let cards = players[userId];

        for (let card of cards) {
            if (isWin(card)) {
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
}

// ================= WIN RULE =================
function isWin(card) {
    return card.every(n =>
        n === "FREE" || called.includes(n)
    );
}

// ================= RESET =================
function resetGame() {
    selectionOpen = false;
    gameRunning = false;
    pool = [];
    called = [];
    players = {};

    db.ref("gameState").set({
        status: "IDLE",
        currentNumber: null,
        calledNumbers: [],
        winner: null
    });

    db.ref("players").remove();
}

// ================= EXPORT =================
module.exports = {
    startSelection,
    joinPlayer,
    resetGame
};
