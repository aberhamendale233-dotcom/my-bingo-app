// Game Configurations
const ADMIN_COMMISSION_RATE = 0.15;
const CALL_INTERVAL = 3000; // 3 ሰከንድ
const BET_AMOUNT = 10;      // የአንድ ካርድ ዋጋ
const WAIT_TIME = 30000;    // 30 ሰከንድ የዝግጅት ጊዜ

let calledNumbers = [];
let playersCount = Math.floor(Math.random() * 100) + 10; // ለሙከራ ያህል
let gameStatus = "WAITING"; // WAITING or PLAYING

const statusText = document.createElement('div');
statusText.id = "game-status";
document.querySelector('.container').insertBefore(statusText, document.getElementById('bingo-card'));

function updateDashboard() {
    const totalPool = playersCount * BET_AMOUNT;
    const adminCut = totalPool * ADMIN_COMMISSION_RATE;
    const winnerPrize = totalPool - adminCut;

    statusText.innerHTML = `
        <div style="background: #16213e; padding: 10px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #00d2ff;">
            <p>👥 ተጫዋቾች: <b>${playersCount}</b> | 💰 ጠቅላላ ገቢ: <b>${totalPool} ETB</b></p>
            <p>🏢 የአድሚን ኮሚሽን (15%): <b style="color: #ffcc00;">${adminCut} ETB</b></p>
            <p>🏆 ለአሸናፊው የሚከፈል (85%): <b style="color: #00ff00;">${winnerPrize} ETB</b></p>
            <h2 id="timer-display"></h2>
        </div>
    `;
}

function startNewGame() {
    gameStatus = "WAITING";
    calledNumbers = [];
    let timeLeft = WAIT_TIME / 1000;

    const timerInterval = setInterval(() => {
        document.getElementById('timer-display').innerText = `ቀጣይ ጨዋታ በ ${timeLeft} ሰከንድ ይጀምራል...`;
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(timerInterval);
            playBingo();
        }
    }, 1000);
    
    updateDashboard();
    generateCard(); // አዲስ ካርድ ለተጫዋቹ መስጠት
}

function playBingo() {
    gameStatus = "PLAYING";
    document.getElementById('timer-display').innerText = "ጨዋታው ተጀምሯል!";
    
    const gameInterval = setInterval(() => {
        if (calledNumbers.length >= 75 || gameStatus === "FINISHED") {
            clearInterval(gameInterval);
            return;
        }

        let nextNum;
        do {
            nextNum = Math.floor(Math.random() * 75) + 1;
        } while (calledNumbers.includes(nextNum));

        calledNumbers.push(nextNum);
        announceNumber(nextNum);
        checkAutoWin(); // አሸናፊ መኖሩን በየጊዜው መፈተሽ
    }, CALL_INTERVAL);
}

function announceNumber(num) {
    const msg = document.createElement('div');
    msg.style.fontSize = "2rem";
    msg.style.color = "#ffcc00";
    msg.innerText = `የወጣ ቁጥር: ${num}`;
    // አድሚኑ ቁጥሮቹን እንዲያይ እዚህ ጋር display ማድረግ ይቻላል
    console.log("Called:", num);
}

function checkAutoWin() {
    // እዚህ ጋር በ Horizontal ወይም Vertical መስመር የሞላ ካርድ ካለ 
    // ጨዋታውን አቁሞ አሸናፊውን ይፋ ያደርጋል
    // ለአሁኑ በሙከራ ደረጃ (Simulated win):
    if (calledNumbers.length > 40 && Math.random() > 0.9) {
        gameStatus = "FINISHED";
        alert("BINGO! ጨዋታው ተጠናቋል። አሸናፊው ተለይቷል።");
        setTimeout(startNewGame, 5000); // ከ 5 ሰከንድ በኋላ አዲስ ዙር
    }
}

// መጀመሪያ ሲጀምር
startNewGame();
