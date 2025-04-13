
/**
 * Memory Match 3D Oyunu
 * Modern ve tamamen işlevsel 3D efektli hafıza kartları oyunu
 */

document.addEventListener('DOMContentLoaded', function() {
  // Game state
  const gameState = {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    totalPairs: 0,
    moves: 0,
    timer: 0,
    timerInterval: null,
    gameActive: false,
    difficulty: 'easy',
    hintsUsed: 0,
    lastCardPositions: {} // Kartların son görülen konumlarını tutmak için
  };
  
  // Card icons for different categories
  const cardIcons = {
    nature: ['fa-leaf', 'fa-tree', 'fa-snowflake', 'fa-sun', 'fa-mountain', 'fa-cloud', 'fa-water', 'fa-fire', 'fa-wind', 'fa-rainbow', 'fa-seedling', 'fa-flower', 'fa-umbrella-beach', 'fa-meteor', 'fa-campground', 'fa-moon'],
    animal: ['fa-dog', 'fa-cat', 'fa-horse', 'fa-fish', 'fa-dragon', 'fa-hippo', 'fa-spider', 'fa-kiwi-bird', 'fa-frog', 'fa-dove', 'fa-crow', 'fa-otter', 'fa-horse-head', 'fa-paw', 'fa-bug', 'fa-feather'],
    food: ['fa-pizza-slice', 'fa-hamburger', 'fa-ice-cream', 'fa-cookie', 'fa-candy-cane', 'fa-apple-alt', 'fa-carrot', 'fa-coffee', 'fa-egg', 'fa-bread-slice', 'fa-cheese', 'fa-hotdog', 'fa-drumstick-bite', 'fa-pepper-hot', 'fa-lemon', 'fa-bacon'],
    travel: ['fa-plane', 'fa-car', 'fa-bicycle', 'fa-ship', 'fa-subway', 'fa-train', 'fa-bus', 'fa-helicopter', 'fa-truck', 'fa-motorcycle', 'fa-shuttle-van', 'fa-taxi', 'fa-tram', 'fa-car-side', 'fa-rocket', 'fa-parachute-box'],
    tech: ['fa-laptop', 'fa-mobile-alt', 'fa-headphones', 'fa-camera', 'fa-tv', 'fa-gamepad', 'fa-keyboard', 'fa-mouse', 'fa-microchip', 'fa-battery-full', 'fa-plug', 'fa-satellite-dish', 'fa-server', 'fa-tablet-alt', 'fa-desktop', 'fa-print'],
    sport: ['fa-football-ball', 'fa-basketball-ball', 'fa-baseball-ball', 'fa-volleyball-ball', 'fa-golf-ball', 'fa-table-tennis', 'fa-bowling-ball', 'fa-dumbbell', 'fa-running', 'fa-swimmer', 'fa-biking', 'fa-skiing', 'fa-skating', 'fa-snowboarding', 'fa-hockey-puck', 'fa-hiking']
  };
  
  // DOM elements
  const boardElement = document.getElementById('memory-board');
  const movesDisplay = document.getElementById('moves-count');
  const timerDisplay = document.getElementById('timer');
  const difficultySelect = document.getElementById('difficulty-select');
  const newGameBtn = document.getElementById('new-game-btn');
  const helpBtn = document.getElementById('help-btn');
  const hintBtn = document.getElementById('hint-btn');
  const helpPanel = document.getElementById('help-panel');
  const closeHelpBtn = document.getElementById('close-help-btn');
  const soundToggle = document.getElementById('sound-effects');
  const animationsToggle = document.getElementById('animations');
  
  // Sounds
  const sounds = {
    flip: new Audio('/static/sounds/card-flip.mp3'),
    match: new Audio('/static/sounds/match.mp3'),
    noMatch: new Audio('/static/sounds/no-match.mp3'),
    complete: new Audio('/static/sounds/game-complete.mp3'),
    hint: new Audio('/static/sounds/hint.mp3')
  };
  
  // Modal elements
  const resultModal = new bootstrap.Modal(document.getElementById('result-modal'));
  const resultTime = document.getElementById('result-time');
  const resultMoves = document.getElementById('result-moves');
  const resultDifficulty = document.getElementById('result-difficulty');
  const newGameModalBtn = document.getElementById('new-game-modal');
  
  // Hint modal elements
  const hintModal = new bootstrap.Modal(document.getElementById('hint-modal'));
  const hintText = document.getElementById('hint-text');
  const showHintBtn = document.getElementById('show-hint-btn');
  
  // Initialize game
  function initGame() {
    // Set difficulty settings
    setDifficultySettings();
    
    // Reset game state
    gameState.cards = [];
    gameState.flippedCards = [];
    gameState.matchedPairs = 0;
    gameState.moves = 0;
    gameState.hintsUsed = 0;
    gameState.lastCardPositions = {};
    
    // Reset timer
    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
    }
    gameState.timer = 0;
    updateTimerDisplay();
    
    // Reset moves display
    updateMovesDisplay();
    
    // Create card deck
    createCardDeck();
    
    // Render board
    renderBoard();
    
    // Start the game
    gameState.gameActive = true;
    startTimer();
  }
  
  // Set difficulty settings
  function setDifficultySettings() {
    gameState.difficulty = difficultySelect.value;
    
    switch (gameState.difficulty) {
      case 'easy':
        gameState.boardSize = 4; // 4x4 board
        gameState.totalPairs = 8;
        break;
      case 'medium':
        gameState.boardSize = 6; // 6x6 board
        gameState.totalPairs = 18;
        break;
      case 'hard':
        gameState.boardSize = 8; // 8x8 board
        gameState.totalPairs = 32;
        break;
    }
  }
  
  // Create card deck
  function createCardDeck() {
    const categories = Object.keys(cardIcons);
    let selectedIcons = [];
    
    // Select icons from different categories
    for (let i = 0; i < gameState.totalPairs; i++) {
      const category = categories[i % categories.length];
      const availableIcons = cardIcons[category].filter(icon => !selectedIcons.includes(`${category}:${icon}`));
      
      if (availableIcons.length > 0) {
        const icon = availableIcons[Math.floor(Math.random() * availableIcons.length)];
        selectedIcons.push(`${category}:${icon}`);
      } else {
        // If no more icons in this category, try another
        for (const cat of categories) {
          const availIcons = cardIcons[cat].filter(icon => !selectedIcons.includes(`${cat}:${icon}`));
          if (availIcons.length > 0) {
            const icon = availIcons[Math.floor(Math.random() * availIcons.length)];
            selectedIcons.push(`${cat}:${icon}`);
            break;
          }
        }
      }
    }
    
    // Create pairs
    const cardPairs = [];
    selectedIcons.forEach((iconInfo, index) => {
      const [category, icon] = iconInfo.split(':');
      
      // Create two cards with the same icon
      for (let i = 0; i < 2; i++) {
        cardPairs.push({
          id: `card-${index}-${i}`,
          icon: icon,
          type: category,
          flipped: false,
          matched: false
        });
      }
    });
    
    // Shuffle cards
    gameState.cards = shuffleArray(cardPairs);
  }
  
  // Shuffle array (Fisher-Yates algorithm)
  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
  
  // Render game board
  function renderBoard() {
    boardElement.innerHTML = '';
    
    // Set grid columns based on board size
    boardElement.style.gridTemplateColumns = `repeat(${gameState.boardSize}, 1fr)`;
    
    // Create and add card elements
    gameState.cards.forEach((card, index) => {
      const cardElement = document.createElement('div');
      cardElement.className = 'card';
      cardElement.id = card.id;
      cardElement.dataset.index = index;
      cardElement.dataset.type = card.type;
      
      // Handle card click
      cardElement.addEventListener('click', () => handleCardClick(index));
      
      // Create card faces
      const cardFront = document.createElement('div');
      cardFront.className = 'card-face card-front';
      
      const cardBack = document.createElement('div');
      cardBack.className = 'card-face card-back';
      cardBack.innerHTML = `<i class="fas ${card.icon}"></i>`;
      
      // Add faces to card
      cardElement.appendChild(cardFront);
      cardElement.appendChild(cardBack);
      
      // Add card to board
      boardElement.appendChild(cardElement);
    });
  }
  
  // Handle card click
  function handleCardClick(index) {
    if (!gameState.gameActive) return;
    
    const card = gameState.cards[index];
    const cardElement = document.getElementById(card.id);
    
    // Ignore if card is already flipped or matched
    if (card.flipped || card.matched) return;
    
    // Ignore if two cards are already flipped
    if (gameState.flippedCards.length >= 2) return;
    
    // Flip the card
    card.flipped = true;
    cardElement.classList.add('flipped');
    
    // Play flip sound
    if (soundToggle.checked) {
      sounds.flip.currentTime = 0;
      sounds.flip.play();
    }
    
    // Save last seen position
    gameState.lastCardPositions[card.icon] = gameState.lastCardPositions[card.icon] || [];
    if (!gameState.lastCardPositions[card.icon].includes(index)) {
      gameState.lastCardPositions[card.icon].push(index);
    }
    
    // Add to flipped cards
    gameState.flippedCards.push(index);
    
    // Check if two cards are flipped
    if (gameState.flippedCards.length === 2) {
      // Increment moves
      gameState.moves++;
      updateMovesDisplay();
      
      // Call move handler if exists
      if (typeof window.memoryMatchGame.onMove === 'function') {
        window.memoryMatchGame.onMove(gameState.moves);
      }
      
      // Check for match
      const card1 = gameState.cards[gameState.flippedCards[0]];
      const card2 = gameState.cards[gameState.flippedCards[1]];
      
      if (card1.icon === card2.icon) {
        // Match found
        handleMatch();
      } else {
        // No match
        handleNoMatch();
      }
    }
  }
  
  // Handle matching cards
  function handleMatch() {
    // Mark cards as matched
    gameState.flippedCards.forEach(index => {
      const card = gameState.cards[index];
      const cardElement = document.getElementById(card.id);
      
      card.matched = true;
      
      // Apply matched animation with delay
      setTimeout(() => {
        cardElement.classList.add('matched');
        
        // Play match sound
        if (soundToggle.checked) {
          sounds.match.currentTime = 0;
          sounds.match.play();
        }
      }, 300);
    });
    
    // Increment matched pairs
    gameState.matchedPairs++;
    
    // Reset flipped cards
    gameState.flippedCards = [];
    
    // Check for game completion
    if (gameState.matchedPairs === gameState.totalPairs) {
      setTimeout(() => {
        endGame();
      }, 500);
    }
  }
  
  // Handle non-matching cards
  function handleNoMatch() {
    // Play no match sound
    if (soundToggle.checked) {
      setTimeout(() => {
        sounds.noMatch.currentTime = 0;
        sounds.noMatch.play();
      }, 300);
    }
    
    // Flip cards back with delay
    setTimeout(() => {
      gameState.flippedCards.forEach(index => {
        const card = gameState.cards[index];
        const cardElement = document.getElementById(card.id);
        
        card.flipped = false;
        cardElement.classList.remove('flipped');
      });
      
      // Reset flipped cards
      gameState.flippedCards = [];
    }, 1000);
  }
  
  // End game
  function endGame() {
    gameState.gameActive = false;
    clearInterval(gameState.timerInterval);
    
    // Play complete sound
    if (soundToggle.checked) {
      sounds.complete.currentTime = 0;
      sounds.complete.play();
    }
    
    // Set result modal content
    resultTime.textContent = formatTime(gameState.timer);
    resultMoves.textContent = gameState.moves;
    
    switch (gameState.difficulty) {
      case 'easy':
        resultDifficulty.textContent = 'Kolay';
        break;
      case 'medium':
        resultDifficulty.textContent = 'Orta';
        break;
      case 'hard':
        resultDifficulty.textContent = 'Zor';
        break;
    }
    
    // Call completion handler if exists
    if (typeof window.memoryMatchGame.onComplete === 'function') {
      window.memoryMatchGame.onComplete({
        time: gameState.timer,
        moves: gameState.moves,
        difficulty: gameState.difficulty,
        hints: gameState.hintsUsed
      });
    }
    
    // Show modal
    resultModal.show();
  }
  
  // Start timer
  function startTimer() {
    gameState.timerInterval = setInterval(() => {
      gameState.timer++;
      updateTimerDisplay();
    }, 1000);
  }
  
  // Update timer display
  function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(gameState.timer);
  }
  
  // Update moves display
  function updateMovesDisplay() {
    movesDisplay.textContent = gameState.moves;
  }
  
  // Format time as MM:SS
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Show hint
  function showHint() {
    if (!gameState.gameActive) {
      hintText.textContent = "Oyun henüz başlamadı. Önce yeni bir oyun başlatın.";
      hintModal.show();
      return;
    }
    
    // Get unmatched cards
    const unmatchedCards = gameState.cards.filter(card => !card.matched);
    if (unmatchedCards.length === 0) {
      hintText.textContent = "Tüm kartlar eşleştirildi! Tebrikler!";
      hintModal.show();
      return;
    }
    
    // Find potential matches (cards with pairs that have been seen)
    let potentialMatches = [];
    
    for (const icon in gameState.lastCardPositions) {
      // If we have seen both cards of a pair and at least one is still unmatched
      if (gameState.lastCardPositions[icon].length >= 2) {
        const positions = gameState.lastCardPositions[icon];
        const unmatchedPositions = positions.filter(pos => !gameState.cards[pos].matched);
        
        if (unmatchedPositions.length > 0) {
          potentialMatches.push({
            icon: icon,
            positions: unmatchedPositions
          });
        }
      }
    }
    
    // Choose hint based on potential matches
    if (potentialMatches.length > 0) {
      // Select a random potential match
      const match = potentialMatches[Math.floor(Math.random() * potentialMatches.length)];
      
      // Get the card positions
      const positions = match.positions;
      
      // Create hint text
      hintText.textContent = `Şu an için bir eşleşme var. Hatırlamaya çalışın!`;
      
      // Set up hint button
      showHintBtn.onclick = function() {
        // Increment hint counter
        gameState.hintsUsed++;
        
        // Call hint handler if exists
        if (typeof window.memoryMatchGame.onHint === 'function') {
          window.memoryMatchGame.onHint();
        }
        
        // Play hint sound
        if (soundToggle.checked) {
          sounds.hint.currentTime = 0;
          sounds.hint.play();
        }
        
        // Highlight the matching cards
        positions.forEach(pos => {
          const cardElement = document.getElementById(gameState.cards[pos].id);
          cardElement.style.animation = 'highlight 1.5s 2';
          
          // Remove animation after it completes
          setTimeout(() => {
            cardElement.style.animation = '';
          }, 3000);
        });
        
        hintModal.hide();
      };
      
    } else {
      // No potential matches, give a more general hint
      hintText.textContent = "Henüz yeterli kart açılmadı. Biraz daha ilerlemeyi deneyin.";
      showHintBtn.onclick = function() {
        hintModal.hide();
      };
    }
    
    hintModal.show();
  }
  
  // Toggle help panel
  function toggleHelpPanel() {
    helpPanel.classList.toggle('hidden');
  }
  
  // Event listeners
  newGameBtn.addEventListener('click', initGame);
  newGameModalBtn.addEventListener('click', () => {
    resultModal.hide();
    initGame();
  });
  
  difficultySelect.addEventListener('change', () => {
    // Only change difficulty if no game is active or confirm from user
    if (!gameState.gameActive || confirm('Şu anki oyunu bırakıp yeni bir oyun başlatmak istediğinize emin misiniz?')) {
      initGame();
    } else {
      // Reset select to current difficulty
      difficultySelect.value = gameState.difficulty;
    }
  });
  
  helpBtn.addEventListener('click', toggleHelpPanel);
  closeHelpBtn.addEventListener('click', toggleHelpPanel);
  hintBtn.addEventListener('click', showHint);
  
  // Create global game object for integration
  window.memoryMatchGame = {
    initGame: initGame,
    difficulty: gameState.difficulty,
    onMove: null,
    onHint: null,
    onComplete: null,
    useHint: showHint
  };
  
  // Start game on page load
  initGame();
});
