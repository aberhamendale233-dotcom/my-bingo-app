function callNumbers() {
    let pool = Array.from({length: 75}, (_, i) => i + 1);
    let called = [];
    
    const inv = setInterval(() => {
        if (pool.length === 0) {
            clearInterval(inv);
            db.ref("gameState/status").set("FINISHED");
            return;
        }
        
        let n = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        
        // ቁጥሩ የትኛው ፊደል ስር እንደሚወድቅ መለየት
        let letter = "";
        if (n <= 15) letter = "B";
        else if (n <= 30) letter = "I";
        else if (n <= 45) letter = "N";
        else if (n <= 60) letter = "G";
        else letter = "O";
        
        // ፊደሉን እና ቁጥሩን አጣምሮ መላክ (ለምሳሌ፡ B-12)
        let displayNum = letter + "-" + n;
        called.push(n);
        
        db.ref("gameState").update({ 
            currentNum: displayNum, 
            calledNumbers: called 
        });
    }, 4000);
}
