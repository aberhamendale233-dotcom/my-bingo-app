body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    /* ባግራውንዱን እንደ ምስሉ ጥቁር ሰማያዊ ያደርገዋል */
    background-color: #1a1a2e; 
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
}

#game-root {
    width: 100%;
    max-width: 400px;
    padding: 20px;
    text-align: center;
}

/* የካርዱ ጀርባ ነጭ እንዲሆን */
.bingo-card-5x5 {
    background: #ffffff;
    padding: 15px;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    margin-top: 20px;
}

/* ትልቁ የቁጥር ማሳያ ክብ (Ball) */
.current-number-ball {
    width: 100px;
    height: 100px;
    background: radial-gradient(circle at 30% 30%, #ffd700, #ff8c00);
    border-radius: 50%;
    margin: 20px auto;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2rem;
    font-weight: bold;
    color: #1a1a2e;
    border: 5px solid #ffffff;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
}

/* የቁጥሮች መምረጫ ግሪድ */
.grid-container {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    background: #16213e;
    padding: 15px;
    border-radius: 15px;
}

button {
    background: #0f3460;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.3s;
}

button:hover {
    background: #e94560;
}

button.taken {
    background: #555 !important;
    cursor: not-allowed;
    opacity: 0.5;
}

h2 {
    color: #ffd700;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}
