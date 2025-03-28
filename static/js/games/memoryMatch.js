document.addEventListener('DOMContentLoaded', function() {
  const gameBoard = document.getElementById('memory-grid');
  const scoreDisplay = document.getElementById('score-display');
  const timerDisplay = document.getElementById('timer-display');
  const startBtn = document.getElementById('start-game');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const finalScoreDisplay = document.getElementById('final-score');
  
  // Game state variables
  let cards = [];
  let score = 0;
  let flippedCards = [];
  let matchedPairs = 0;
  let timer;
  let isGameActive = false;
  let movesCount = 0;
  
  // Card symbols (using emoji for simplicity)
  const symbols = [
    '🚀', '🌟', '🍕', '🎮', '🎵', '🌈', '🍦', '🎨', '🚲', '🎭', '📚', '🔮'
  ];
  
  startBtn.addEventListener('click', startGame);
  
  function startGame() {
    // Hide start button, show game
    startBtn.style.display = 'none';
    gameContainer.style.display = 'block';
    gameOverContainer.style.display = 'none';
    
    // Reset game state
    cards = [];
    score = 100; // Start with 100 points
    flippedCards = [];
    matchedPairs = 0;
    movesCount = 0;
    isGameActive = true;
    
    // Create card deck - 24 cards (12 pairs)
    createCardDeck();
    
    // Render cards on board
    renderCards();
    
    // Update score display
    updateScoreDisplay();
    
    // Start the timer (120 seconds)
    timer = window.startTimer(120, 'timer-display', endGame);
  }
  
  function createCardDeck() {
    // Create pairs of cards
    cards = [];
    
    // Get 12 symbols for pairs
    const gameSymbols = symbols.slice(0, 12);
    
    // Create pairs
    gameSymbols.forEach(symbol => {
      // Add two of each symbol
      cards.push(createCard(symbol));
      cards.push(createCard(symbol));
    });
    
    // Shuffle the cards
    cards = shuffleArray(cards);
  }
  
  function createCard(symbol) {
    return {
      symbol: symbol,
      isFlipped: false,
      isMatched: false
    };
  }
  
  function renderCards() {
    gameBoard.innerHTML = '';
    
    cards.forEach((card, index) => {
      const cardElement = document.createElement('div');
      cardElement.className = 'memory-card';
      cardElement.dataset.index = index;
      
      if (card.isFlipped || card.isMatched) {
        cardElement.innerHTML = `<span>${card.symbol}</span>`;
        cardElement.classList.add('flipped');
        
        if (card.isMatched) {
          cardElement.classList.add('matched');
        }
      } else {
        cardElement.innerHTML = `<span>?</span>`;
      }
      
      cardElement.addEventListener('click', () => {
        if (isGameActive && !card.isFlipped && !card.isMatched && flippedCards.length < 2) {
          flipCard(index);
        }
      });
      
      gameBoard.appendChild(cardElement);
    });
  }
  
  function flipCard(index) {
    if (flippedCards.length === 2) return;
    
    const card = cards[index];
    card.isFlipped = true;
    flippedCards.push(index);
    
    renderCards();
    
    if (flippedCards.length === 2) {
      movesCount++;
      
      // Check for match after a small delay
      setTimeout(checkForMatch, 1000);
    }
  }
  
  function checkForMatch() {
    const firstCardIndex = flippedCards[0];
    const secondCardIndex = flippedCards[1];
    
    const firstCard = cards[firstCardIndex];
    const secondCard = cards[secondCardIndex];
    
    if (firstCard.symbol === secondCard.symbol) {
      // Match found
      firstCard.isMatched = true;
      secondCard.isMatched = true;
      matchedPairs++;
      
      // Award points for match
      score += 20;
      
      // Check if all pairs are matched
      if (matchedPairs === symbols.length) {
        endGame(true);
        return;
      }
    } else {
      // No match
      firstCard.isFlipped = false;
      secondCard.isFlipped = false;
      
      // Deduct points for incorrect match
      score = Math.max(0, score - 5);
    }
    
    // Reset flipped cards
    flippedCards = [];
    
    // Update score and render cards
    updateScoreDisplay();
    renderCards();
  }
  
  function updateScoreDisplay() {
    scoreDisplay.textContent = score;
  }
  
  function endGame(completed = false) {
    isGameActive = false;
    
    // Stop the timer
    if (timer && timer.stop) {
      timer.stop();
    }
    
    // If game completed before time ran out, add bonus
    if (completed) {
      const timeLeft = timer.getTimeLeft();
      const timeBonus = timeLeft * 2; // 2 points per second left
      score += timeBonus;
    }
    
    // Show game over screen
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'block';
    finalScoreDisplay.textContent = score;
    
    // Save score
    window.saveScore('memoryMatch', score);
    
    // Add play again button functionality
    document.getElementById('play-again').addEventListener('click', startGame);
  }
  
  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
});
