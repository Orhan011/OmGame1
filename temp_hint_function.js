  // Show a hint by highlighting a tile that should be moved
  function showHint() {
    // Play hint sound
    const hintSound = new Audio('/static/sounds/hint.mp3');
    hintSound.play();
    
    // Find a tile that's not in its correct position
    let incorrectTiles = [];
    tiles.forEach((tile, index) => {
      if (tile.textContent && parseInt(tile.textContent) !== index + 1) {
        incorrectTiles.push(tile);
      }
    });
    
    if (incorrectTiles.length === 0) {
      return; // All tiles are in correct position
    }
    
    // Select a random incorrect tile
    const randomTile = incorrectTiles[Math.floor(Math.random() * incorrectTiles.length)];
    
    // Highlight the tile
    const originalBackground = randomTile.style.background;
    randomTile.style.background = '#ffe066';
    randomTile.style.boxShadow = '0 0 10px rgba(255, 224, 102, 0.8)';
    
    // Add pulsing animation class
    randomTile.classList.add('pulse-hint');
    
    // Show a tooltip with the correct position
    const tileValue = parseInt(randomTile.textContent);
    const correctRow = Math.floor((tileValue - 1) / boardSize);
    const correctCol = (tileValue - 1) % boardSize;
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'hint-tooltip';
    tooltip.textContent = `Correct position: Row ${correctRow + 1}, Column ${correctCol + 1}`;
    document.body.appendChild(tooltip);
    
    // Position tooltip
    const tileRect = randomTile.getBoundingClientRect();
    tooltip.style.top = `${tileRect.top - tooltip.offsetHeight - 10}px`;
    tooltip.style.left = `${tileRect.left + (tileRect.width - tooltip.offsetWidth) / 2}px`;
    
    // Remove hint after 3 seconds
    setTimeout(() => {
      randomTile.style.background = originalBackground;
      randomTile.style.boxShadow = '';
      randomTile.classList.remove('pulse-hint');
      tooltip.remove();
    }, 3000);
    
    // Increase move count as penalty
    moves += 2;
    movesDisplay.textContent = moves;
  }
