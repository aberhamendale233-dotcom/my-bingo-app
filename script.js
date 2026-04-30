function renderBingoGrid(card, called) {
    const letters = ['B', 'I', 'N', 'G', 'O'];
    
    return `
        <div style="background: white; padding: 10px; border-radius: 15px; box-shadow: 0 10px 20px rgba(0,0,0,0.3);">
            <!-- B-I-N-G-O ጽሁፍ -->
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); margin-bottom: 10px;">
                ${letters.map(letter => `
                    <div style="color: #1a1a2e; font-weight: 900; font-size: 1.2rem; text-align: center;">${letter}</div>
                `).join('')}
            </div>
            
            <!-- የቁጥሮች ሰንጠረዥ -->
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px;">
                ${card.map(num => {
                    const isHit = called.includes(num) || num === "FREE";
                    return `
                        <div style="
                            background: ${isHit ? '#e94560' : '#1f4068'}; 
                            color: white; 
                            height: 45px; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            font-weight: bold; 
                            border-radius: 8px; 
                            font-size: 0.9rem;
                            transition: 0.3s;
                            ${num === "FREE" ? 'font-size: 0.6rem; background: #ff4d4d;' : ''}
                        ">
                            ${num}
                        </div>`;
                }).join("")}
            </div>
        </div>
    `;
}
