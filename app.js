playBtn.addEventListener('click', () => {
    // ሰርቨሩን "10 ብር ቀንስልኝ" ብሎ መጠየቅ
    fetch('/play-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 12345 }) // እዚህ ጋር ትክክለኛው የተጫዋች ID ይገባል
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            balanceDisplay.innerText = data.newBalance;
            alert("10 ብር ተቀንሷል! ወደ ጨዋታው በመግባት ላይ...");
            // ወደ ቢንጎ ሰንጠረዥ ይወስደዋል
            startBingoGame(); 
        } else {
            alert(data.message);
        }
    });
});
