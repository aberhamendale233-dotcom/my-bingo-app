const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let gameState = "WAITING"; // WAITING, PLAYING
let countdown = 35;
let drawnNumbers = [];
let gameInterval;

function startNewRound() {
    gameState = "WAITING";
    countdown = 35;
    drawnNumbers = [];
    
    console.log("አዲስ ዙር ለመጀመር 35 ሰከንድ ቆጠራ ተጀምሯል...");
    
    let waitInterval = setInterval(() => {
        countdown--;
        // ለሁሉም ተጫዋቾች የቀረውን ሰከንድ ላክ
        io.emit('timer_update', { countdown, state: gameState });

        if (countdown <= 0) {
            clearInterval(waitInterval);
            beginDrawingNumbers();
        }
    }, 1000);
}

function beginDrawingNumbers() {
    gameState = "PLAYING";
    console.log("ጨዋታ ተጀምሯል! ማንም መግባት አይችልም።");
    io.emit('game_started', { state: gameState });

    gameInterval = setInterval(() => {
        if (drawnNumbers.length >= 75) {
            stopGame("No one won, numbers exhausted");
            return;
        }

        // በየ 3 ሰከንዱ አዲስ ቁጥር ማውጣት
        let newNumber = Math.floor(Math.random() * 75) + 1;
        while (drawnNumbers.includes(newNumber)) {
            newNumber = Math.floor(Math.random() * 75) + 1;
        }
        
        drawnNumbers.push(newNumber);
        io.emit('new_number', { number: newNumber, allNumbers: drawnNumbers });

        // እዚህ ጋር አሸናፊ መኖሩን በሰርቨር በኩል ቼክ ታደርጋለህ
        // let winner = checkWinners(drawnNumbers); 
        // if (winner) stopGame(winner);

    }, 3000);
}

function stopGame(winnerData) {
    clearInterval(gameInterval);
    console.log("ጨዋታው ተጠናቋል!");
    io.emit('game_over', { winner: winnerData });

    // አሸናፊው ከታወቀ በኋላ ወደ አዲስ ዙር ቆጠራ ይመለሳል
    setTimeout(() => {
        startNewRound();
    }, 5000); // 5 ሰከንድ ውጤቱን ለማሳየት
}

startNewRound();
