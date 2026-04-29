const cardContainer = document.getElementById('bingo-card');
const newCardBtn = document.getElementById('new-card-btn');

// በዘፈቀደ የማይደገሙ ቁጥሮችን ለማመንጨት
function getRandomNumbers(min, max, count) {
    let numbers = [];
    while (numbers.length < count) {
        let r = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!numbers.includes(r)) numbers.push(r);
    }
    return numbers;
}

function generateCard() {
    cardContainer.innerHTML = ''; // የቆየውን ካርድ ማጽጃ
    
    // የቢንጎ ህግ (B:1-15, I:16-30, N:31-45, G:46-60, O:61-75)
    const columns = [
        getRandomNumbers(1, 15, 5),
        getRandomNumbers(16, 30, 5),
        getRandomNumbers(31, 45, 5),
        getRandomNumbers(46, 60, 5),
        getRandomNumbers(61, 75, 5)
    ];

    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            let value = columns[col][row];

            // መሃልኛው ክፍል (Row 2, Column 2) ነጻ እንዲሆን
            if (row === 2 && col === 2) {
                cell.innerText = "FREE";
                cell.classList.add('free', 'marked'); 
            } else {
                cell.innerText = value;
                cell.onclick = function() {
                    cell.classList.toggle('marked');
                };
            }
            cardContainer.appendChild(cell);
        }
    }
}

// ገጹ ሲከፈት መጀመሪያ ካርድ እንዲያመነጭ
generateCard();

// አዲስ ካርድ ሲፈለግ
newCardBtn.onclick = generateCard;
