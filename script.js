const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// የጨዋታ ሁኔታዎች
let gameState = "WAITING"; // WAITING or PLAYING
let countdown = 35;
let drawnNumbers = [];
let activePlayers = []; // { id, name, card, selectedNum }
let gameInterval;

// 1. አዲስ ዙር መጀመሪያ (35 ሰከንድ ቆጠራ)
function startNewRound() {
    gameState = "WAITING";
    countdown = 35;
    drawnNumbers = [];
    activePlayers = []; 
    
    io.emit('game_state_update', { state: gameState, countdown });

    let waitInterval = setInterval(() => {
        countdown--;
        io.emit('timer_update', countdown);

        if (countdown <= 0) {
            clearInterval(waitInterval);
            if (activePlayers.length > 0) {
                beginDrawingNumbers();
            } else {
                startNewRound(); // ተጫዋች ከሌለ እንደገና ይቆጥራል
            }
        }
    }, 1000);
}

// 2. ቁጥር ማውጣት (በየ 3 ሰከንዱ)
function beginDrawingNumbers() {
    gameState = "PLAYING";
    io.emit('game_state_update', { state: gameState });

    gameInterval = setInterval(() => {
        if (drawnNumbers.length >= 75) {
            stopGame(null);
            return;
        }

        let newNumber = Math.floor(Math.random() * 75) + 1;
        while (drawnNumbers.includes(newNumber)) {
            newNumber = Math.floor(Math.random() * 75) + 1;
        }
        drawnNumbers.push(newNumber);
        io.emit('new_number', { number: newNumber, drawn: drawnNumbers });

        // አሸናፊ መኖሩን ቼክ ማድረግ
        let winners = checkWinners();
        if (winners.length > 0) {
            stopGame(winners);
        }
    }, 3000);
}

// 3. አሸናፊ ማረጋገጫ (Horizontal & Vertical)
function checkWinners() {
    let winners = [];
    activePlayers.forEach(player => {
        if (hasWon(player.card, drawnNumbers)) {
            winners.push(player);
        }
    });
    return winners;
}

function hasWon(card, drawn) {
    // Horizontal Check
    for (let row of card) {
        if (row.every(num => num === "FREE" || drawn.includes(num))) return true;
    }
    // Vertical Check
    for (let col = 0; col < 5; col++) {
        let columnNumbers = [card[0][col], card[1][col], card[2][col], card[3][col], card[4][col]];
        if (columnNumbers.every(num => num === "FREE" || drawn.includes(num))) return true;
    }
    return false;
}

// 4. ጨዋታውን ማቆም (ለ 4 ሰከንድ ውጤት ማሳየት)
function stopGame(winners) {
    clearInterval(gameInterval);
    io.emit('game_over', { winners });

    setTimeout(() => {
        startNewRound();
    }, 4000); 
}

// 5. ተጫዋች ሲቀላቀል (1-150 ቁጥር ምርጫ እና 10 ETB)
io.on('connection', (socket) => {
    socket.on('join_game', (data) => {
        if (gameState === "WAITING" && countdown > 0) {
            // እዚህ ጋር የ 10 ETB ክፍያ እና የካርድ አሰጣጥ ሎጂክ ይገባል
            let playerCard = generateBingoCard(); 
            activePlayers.push({ id: socket.id, name: data.name, card: playerCard, selectedNum: data.num });
            socket.emit('card_assigned', playerCard);
        } else {
            socket.emit('error', "ጨዋታ ተጀምሯል! 'Watching Only' ላይ ኖት።");
        }
    });
});

function generateBingoCard() {
    // 5x5 ካርድ መሃል ላይ "FREE" ያለው የሚሰራ ፈንክሽን
    let card = Array.from({ length: 5 }, () => Array(5).fill(0));
    // (B, I, N, G, O ህግን ጠብቆ የሚሞላ...)
    card[2][2] = "FREE"; 
    return card;
}

server.listen(3000, () => console.log('Server running on port 3000'));
