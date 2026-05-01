const playBtn = document.getElementById('play-btn');
const balanceDisplay = document.getElementById('balance');

// 1. ገጹ ሲከፈት ትክክለኛውን ሂሳብ ከሰርቨር ማምጣት
function updateBalance() {
    // እዚህ ጋር '12345' በተጫዋቹ ትክክለኛ ID መተካት አለበት
    const userId = "12345"; 

    fetch(`/api/balance/${userId}`)
        .then(res => res.json())
        .then(data => {
            balanceDisplay.innerText = data.balance;
        })
        .catch(err => console.error("Balance ማምጣት አልተቻለም:", err));
}

// ገጹ እንደተከፈተ ሂሳቡን አሳይ
updateBalance();

// 2. PLAY 10 ሲጫን የሚሰራው
playBtn.addEventListener('click', () => {
    const userId = "12345";

    fetch('/api/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // ሂሳቡን በስክሪኑ ላይ አድስ
            balanceDisplay.innerText = data.newBalance;
            alert("10 ብር ተቀንሷል! መልካም እድል!");
            
            // እዚህ ጋር ወደ ቢንጎ ሰንጠረዥ ይወስደዋል
            // startBingoGame(); 
        } else {
            // በቂ ሂሳብ ከሌለው ወይም error ካለ
            alert(data.message);
        }
    })
    .catch(err => {
        console.error("Error:", err);
        alert("ከሰርቨር ጋር መገናኘት አልተቻለም!");
    });
});
