let userData = { name: "", phone: "" };
let playersCount = 0;
let gameStatus = "WAITING"; 
let calledNumbers = [];
const ENTRY_FEE = 10;
const MIN_PLAYERS = 10;
const MAX_PLAYERS = 80;

// 1. ገጹ ሲከፈት ተጫዋቹ ቀድሞ መመዝገቡን ያረጋግጣል
window.onload = function() {
    const savedUser = localStorage.getItem('bingo_user');
    if (savedUser) {
        userData = JSON.parse(savedUser);
        showGameArea();
    }
};

// 2. ተጫዋቹን የመመዝገብ ስራ
function saveUserKYC() {
    const name = document.getElementById('user-name').value;
    const phone = document.getElementById('user-phone').value;
    if (name.length < 3 || phone.length < 10) {
        alert("እባክዎ ትክክለኛ ስም እና ስልክ ያስገቡ!");
        return;
    }
    userData = { name, phone };
    localStorage.setItem('bingo_user', JSON.stringify(userData));
    showGameArea();
}

function showGameArea() {
    document.getElementById('kyc-section').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    updateDashboard();
}

// 3. የጨዋታው ዳሽቦርድ (ኮሚሽን እና ቆጣሪ)
function updateDashboard() {
    const totalPool = playersCount * ENTRY_FEE;
    const adminCut = totalPool * 0.15;
    const prize = totalPool - adminCut;
    
    document.getElementById('status-dashboard').innerHTML = `
        <div style="font-size: 0.9rem; text-align: left;">
            <p>👤 ተጫዋች: <b>${userData.name}</b></p>
            <p>👥 ተጫዋቾች: <b style="color:#ffcc00">${playersCount} / 80</b></p>
            <p>💰 ጠቅላላ: <b>${totalPool} ETB</b> | 🏆 ሽልማት (85%): <b style="color:#00ff00">${prize} ETB</b></p>
            <hr>
            <div id="game-info" style="font-size: 1.1rem; text-align: center; color: #ff4d4d; font-weight: bold;">
                ${gameStatus === "WAITING" ? `ቢያንስ ${MIN_PLAYERS - playersCount} ተጫዋች ይቀራል...` : "በዝግጅት ላይ..."}
            </div>
            <div id="current-num" style="font-size: 3.5rem; text-align: center; color: #ffcc00; font-weight: bold; margin-top: 5px;"></div>
        </div>
    `;
}

// 4. ጨዋታውን የመቀላቀል ስራ
function joinGame() {
    if (gameStatus !== "WAITING") return;
    playersCount++;
    generateCard();
    if (playersCount >= MIN_PLAYERS) startCountdown();
    updateDashboard();
}

// 5. የ30 ሰከንድ ቆጠራ
function startCountdown() {
    gameStatus = "COUNTDOWN";
    let timeLeft = 30;
    const timer = setInterval(() => {
        const info = document.getElementById('game-info');
        if(info) info.innerText = `ጨዋታው በ ${timeLeft} ሰከንድ ይጀምራል...`;
        timeLeft--;
        if (timeLeft < 0) { 
            clearInterval(timer); 
            startGame(); 
        }
    }, 1000);
}

// 6. ጨዋታው ሲጀመር (በየ 3 ሰከንዱ ቁጥር መጥራት)
function startGame() {
    gameStatus = "PLAYING";
    const info = document.getElementById('game-info');
    if(info) info.innerText = "ጨዋታው ተጀምሯል!";
    
    const gameLoop = setInterval(() => {
        if (gameStatus !== "PLAYING") { clearInterval(gameLoop); return; }
        
        let num;
        do { num = Math.floor(Math.random() * 75) + 1; } while (calledNumbers.includes(num));
        calledNumbers.push(num);
        
        const numDisplay = document.getElementById('current-num');
        if(numDisplay) numDisplay.innerText = num;

        // በካርዱ ላይ ካለ አውቶማቲክ ምልክት ያደርጋል
        document.querySelectorAll('.cell').forEach(cell => {
            if (parseInt(cell.innerText) === num) cell.classList.add('marked');
        });
        
        checkWin();
    }, 3000); 
}

// 7. አሸናፊ መኖሩን መፈተሽ (Horizontal & Vertical)
function checkWin() {
    const cells = Array.from(document.querySelectorAll('.cell'));
    const grid = [];
    while(cells.length) grid.push(cells.splice(0, 5));

    for (let i = 0; i < 5; i++) {
        if (grid[i].every(c => c.classList.contains('marked'))) return announceWinner("Horizontal");
        if (grid.every(row => row[i].classList.contains('marked'))) return announceWinner("Vertical");
    }
}

// 8. አሸናፊውን ይፋ ማድረግ
function announceWinner(type) {
    gameStatus = "FINISHED";
    const prize = (playersCount * ENTRY_FEE) * 0.85;
    alert(`BINGO! 🎉\nአሸናፊ: ${userData.name}\nስልክ: ${userData.phone}\nሽልማት: ${prize} ETB\nመስመር: ${type}`);
    location.reload(); // ለቀጣይ ጨዋታ ገጹን ያድሳል
}

// 9. ካርድ ማመንጨት
function generateCard() {
    const card = document.getElementById('bingo-card');
    if(!card) return;
    card.innerHTML = '';
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const cell = document.createElement('div');
            cell.className = (r === 2 && c === 2) ? 'cell free marked' : 'cell';
            cell.innerText = (r === 2 && c === 2) ? 'FREE' : Math.floor(Math.random() * 15) + (c * 15 + 1);
            card.appendChild(cell);
        }
    }
}

document.getElementById('new-card-btn').onclick = joinGame;
