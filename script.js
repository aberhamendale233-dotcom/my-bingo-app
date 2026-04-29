const cardContainer = document.getElementById('bingo-card');
const newCardBtn = document.getElementById('new-card-btn');
const statusContainer = document.createElement('div');
document.querySelector('.container').insertBefore(statusContainer, cardContainer);

// Game Settings
const ENTRY_FEE = 10;
const MIN_PLAYERS = 10;
const MAX_PLAYERS = 80;
const CALL_SPEED = 3000; // 3 ሰከንድ

let playersCount = 0;
let gameStatus = "WAITING"; // WAITING, COUNTDOWN, PLAYING, FINISHED
let calledNumbers = [];
let myCardNumbers = [];
let countdownTimer;

function updateUI() {
    const totalPool = playersCount * ENTRY_FEE;
    const adminCut = totalPool * 0.15;
    const winnerPrize = totalPool - adminCut;

    statusContainer.innerHTML = `
        <div style="background: #16213e; padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #00d2ff;">
            <p>👥 ተጫዋቾች: <b style="color: #ffcc00;">${playersCount} / ${MAX_PLAYERS}</b></p>
            <p>💰 ጠቅላላ: <b>${totalPool} ETB</b> | 🏆 ሽልማት: <b style="color: #00ff00;">${winnerPrize} ETB</b></p>
            <div id="game-info" style="font-weight: bold; font-size: 1.2rem; color: #ff4d4d; margin-top: 10px;">
                ${gameStatus === "WAITING" ? `ቢያንስ ${MIN_PLAYERS - playersCount} ሰው ይቀራል...` : ""}
            </div>
            <div id="called-number-display" style="font-size: 2.5rem; color: #ffcc00; margin-top: 10px;"></div>
        </div>
    `;
}

function joinGame() {
    if (gameStatus === "WAITING" && playersCount < MAX_PLAYERS) {
        playersCount++;
        generateCard();
        if (playersCount >= MIN_PLAYERS) {
            startCountdown();
        }
        updateUI();
    }
}

function startCountdown() {
    gameStatus = "COUNTDOWN";
    let timeLeft = 30;
    const info = document.getElementById('game-info');
    
    countdownTimer = setInterval(() => {
        info.innerText = `ጨዋታው በ ${timeLeft} ሰከንድ ይጀምራል...`;
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(countdownTimer);
            startGame();
        }
    }, 1000);
}

function startGame() {
    gameStatus = "PLAYING";
    calledNumbers = [];
    document.getElementById('game-info').innerText = "ጨዋታው ተጀምሯል!";
    
    const gameLoop = setInterval(() => {
        if (gameStatus !== "PLAYING") {
            clearInterval(gameLoop);
            return;
        }

        let num;
        do { num = Math.floor(Math.random() * 75) + 1; } while (calledNumbers.includes(num));
        calledNumbers.push(num);
        
        document.getElementById('called-number-display').innerText = num;
        highlightMyCard(num);
        checkWin();
    }, CALL_SPEED);
}

function highlightMyCard(num) {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        if (parseInt(cell.innerText) === num) {
            cell.classList.add('marked');
        }
    });
}

function checkWin() {
    const cells = Array.from(document.querySelectorAll('.cell'));
    const grid = [];
    while(cells.length) grid.push(cells.splice(0, 5));

    // Horizontal check
    for (let r = 0; r < 5; r++) {
        if (grid[r].every(c => c.classList.contains('marked'))) return announceWinner("Horizontal Line!");
    }

    // Vertical check
    for (let c = 0; c < 5; c++) {
        let colMarked = true;
        for (let r = 0; r < 5; r++) {
            if (!grid[r][c].classList.contains('marked')) colMarked = false;
        }
        if (colMarked) return announceWinner("Vertical Line!");
    }
}

function announceWinner(type) {
    gameStatus = "FINISHED";
    const totalPool = playersCount * ENTRY_FEE;
    const prize = totalPool * 0.85;
    
    alert(`BINGO! በ ${type} አሸንፈሃል። \nሽልማትህ: ${prize} ETB (15% ተቀንሷል)`);
    
    // ከ 10 ሰከንድ በኋላ አዲስ ጨዋታ
    setTimeout(() => {
        playersCount = 0;
        gameStatus = "WAITING";
        calledNumbers = [];
        updateUI();
        cardContainer.innerHTML = '';
    }, 10000);
}

function generateCard() {
    cardContainer.innerHTML = '';
    const columns = [
        getRand(1, 15), getRand(16, 30), getRand(31, 45), getRand(46, 60), getRand(61, 75)
    ];

    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            if (r === 2 && c === 2) {
                cell.innerText = "FREE";
                cell.classList.add('free', 'marked');
            } else {
                cell.innerText = columns[c][r];
            }
            cardContainer.appendChild(cell);
        }
    }
}

function getRand(min, max) {
    let nums = [];
    while(nums.length < 5) {
        let r = Math.floor(Math.random() * (max - min + 1)) + min;
        if(!nums.includes(r)) nums.push(r);
    }
    return nums;
}

newCardBtn.onclick = joinGame;
updateUI();
