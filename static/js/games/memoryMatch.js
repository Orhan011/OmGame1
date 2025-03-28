/**
 * Hafıza Kartları Oyunu
 * Modern, duyarlı (responsive) ve profesyonel sürüm
 * 
 * Özellikler:
 * - Animasyonlu kartlar ve efektler
 * - Ses efektleri
 * - İpucu sistemi
 * - Duraklatma özelliği
 * - Performans derecelendirmesi
 * - Duyarlı tasarım (mobil uyumlu)
 */
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const gameBoard = document.getElementById('memory-grid');
  const scoreDisplay = document.getElementById('score-display');
  const timerDisplay = document.getElementById('timer-display');
  const movesDisplay = document.getElementById('moves-display');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');
  const startBtn = document.getElementById('start-game');
  const pauseBtn = document.getElementById('pause-game');
  const resumeBtn = document.getElementById('resume-game');
  const hintBtn = document.getElementById('hint-button');
  const soundToggle = document.getElementById('sound-toggle');
  const gameContainer = document.getElementById('game-container');
  const introSection = document.getElementById('intro-section');
  const gameOverContainer = document.getElementById('game-over-container');
  const pauseOverlay = document.getElementById('pause-overlay');
  const finalScoreDisplay = document.getElementById('final-score');
  const finalTimeDisplay = document.getElementById('final-time');
  const finalMovesDisplay = document.getElementById('final-moves');
  const ratingText = document.getElementById('rating-text');
  const alertContainer = document.getElementById('alert-container');
  const copyScoreBtn = document.getElementById('copy-score');
  const shareScoreBtn = document.getElementById('share-score');
  
  // Game Configuration
  const TOTAL_PAIRS = 12;
  const LEVELS = {
    EASY: { gridSize: 4, cols: 4, pairs: 8, timeLimit: 120 },
    MEDIUM: { gridSize: 4, cols: 6, pairs: 12, timeLimit: 180 },
    HARD: { gridSize: 5, cols: 6, pairs: 15, timeLimit: 240 }
  };
  
  // Current game level
  let currentLevel = LEVELS.MEDIUM;
  
  // Card themes (emojis grouped by category)
  const THEMES = {
    ANIMALS: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄', '🦋'],
    FOODS: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🥝', '🍍', '🥥', '🥑', '🌮', '🍕', '🍦'],
    TRAVEL: ['🚗', '✈️', '🚀', '🚁', '🚂', '⛵', '🏎️', '🚲', '🛵', '🚢', '🚕', '🚑', '🚒', '🚓', '🏍️', '🛸'],
    SPORTS: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '⛳', '🏊', '🏄', '🧗', '🚴'],
    FACES: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😎', '🧐'],
    SPACE: ['🌞', '🌝', '🌛', '🌜', '☀️', '🌙', '⭐', '🌟', '💫', '✨', '☄️', '🌈', '☁️', '🌠', '🪐', '🌍']
  };
  
  // Select a random theme
  const selectedTheme = Object.keys(THEMES)[Math.floor(Math.random() * Object.keys(THEMES).length)];
  const symbols = THEMES[selectedTheme];
  
  // Audio
  const audioEnabled = true;
  const sounds = {
    flip: new Audio(),
    match: new Audio(),
    nomatch: new Audio(),
    win: new Audio(),
    hint: new Audio(),
    click: new Audio()
  };
  
  // Initialize audio stub paths (sounds can be loaded later if needed)
  for (const key in sounds) {
    sounds[key].volume = 0.5;
  }
  
  // Game state variables
  let cards = [];
  let score = 0;
  let baseScore = 100;
  let flippedCards = [];
  let matchedPairs = 0;
  let timer;
  let timerInterval;
  let timeStarted = 0;
  let timeElapsed = 0;
  let isPaused = false;
  let isGameActive = false;
  let movesCount = 0;
  let hintsUsed = 0;
  let lastHintTime = 0;
  let showingHint = false;
  let hintTimeout;
  
  // Add event listeners
  startBtn.addEventListener('click', startGame);
  pauseBtn.addEventListener('click', togglePause);
  resumeBtn.addEventListener('click', togglePause);
  hintBtn.addEventListener('click', showHint);
  soundToggle.addEventListener('click', toggleSound);
  document.getElementById('play-again').addEventListener('click', startGame);
  copyScoreBtn.addEventListener('click', copyScore);
  shareScoreBtn.addEventListener('click', shareScore);
  
  // Responsive sizing - recalculate card size on window resize
  window.addEventListener('resize', adjustCardSize);
  
  /**
   * Starts a new game
   */
  function startGame() {
    playSound('click');
    
    // Hide intro and game over, show game container
    introSection.style.display = 'none';
    gameContainer.style.display = 'block';
    gameOverContainer.style.display = 'none';
    pauseOverlay.style.display = 'none';
    
    // Reset game state
    cards = [];
    score = baseScore;
    flippedCards = [];
    matchedPairs = 0;
    movesCount = 0;
    hintsUsed = 0;
    isGameActive = true;
    isPaused = false;
    showingHint = false;
    
    if (hintTimeout) {
      clearTimeout(hintTimeout);
    }
    
    // Create card deck
    createCardDeck();
    
    // Render cards on board
    renderCards();
    
    // Adjust card size for responsive design
    adjustCardSize();
    
    // Update displays
    updateScoreDisplay();
    updateMovesDisplay();
    updateProgressDisplay();
    
    // Start the timer
    timeStarted = Date.now();
    timeElapsed = 0;
    
    if (timer) {
      clearInterval(timer);
    }
    
    timer = startTimer(currentLevel.timeLimit);
  }
  
  /**
   * Creates the deck of cards for the game
   */
  function createCardDeck() {
    // Create pairs of cards
    cards = [];
    
    // Shuffle and get symbols for this game
    const shuffledSymbols = shuffleArray([...symbols]);
    const gameSymbols = shuffledSymbols.slice(0, currentLevel.pairs);
    
    // Create pairs
    gameSymbols.forEach(symbol => {
      // Add two of each symbol
      cards.push(createCard(symbol));
      cards.push(createCard(symbol));
    });
    
    // Shuffle the cards
    cards = shuffleArray(cards);
  }
  
  /**
   * Creates a card object
   */
  function createCard(symbol) {
    return {
      symbol: symbol,
      isFlipped: false,
      isMatched: false,
      isAnimating: false,
      isRevealed: false  // For hints
    };
  }
  
  /**
   * Renders all cards on the game board
   */
  function renderCards() {
    gameBoard.innerHTML = '';
    
    // Set grid dimensions based on card count
    gameBoard.style.gridTemplateColumns = `repeat(${currentLevel.cols}, 1fr)`;
    
    // Create card elements
    cards.forEach((card, index) => {
      const cardElement = document.createElement('div');
      cardElement.className = 'memory-card';
      cardElement.dataset.index = index;
      
      // Add flipped class if card is flipped or matched
      if (card.isFlipped || card.isMatched) {
        cardElement.classList.add('flipped');
      }
      
      // Add matched class if card is matched
      if (card.isMatched) {
        cardElement.classList.add('matched');
      }
      
      // Add hint class if card is being revealed as a hint
      if (card.isRevealed) {
        cardElement.classList.add('hint');
      }
      
      // Create card front and back
      const cardFront = document.createElement('div');
      cardFront.className = 'memory-card__front';
      cardFront.innerHTML = card.symbol;
      
      const cardBack = document.createElement('div');
      cardBack.className = 'memory-card__back';
      
      // Append front and back to card
      cardElement.appendChild(cardFront);
      cardElement.appendChild(cardBack);
      
      // Add click handler
      cardElement.addEventListener('click', () => {
        if (
          isGameActive && 
          !isPaused && 
          !card.isFlipped && 
          !card.isMatched && 
          flippedCards.length < 2 &&
          !showingHint
        ) {
          flipCard(index);
        }
      });
      
      // Add the card to the game board
      gameBoard.appendChild(cardElement);
    });
  }
  
  /**
   * Flips a card at the given index
   */
  function flipCard(index) {
    if (flippedCards.length === 2) return;
    
    const card = cards[index];
    
    // Don't allow flipping if card is already being animated
    if (card.isAnimating) return;
    
    card.isFlipped = true;
    card.isAnimating = true;
    flippedCards.push(index);
    
    // Play flip sound
    playSound('flip');
    
    // Get the card element and add flipped class
    const cardElement = gameBoard.querySelector(`[data-index="${index}"]`);
    cardElement.classList.add('flipped');
    
    // Reset animation state after animation completes
    setTimeout(() => {
      card.isAnimating = false;
    }, 500); // Match transition time in CSS
    
    if (flippedCards.length === 2) {
      movesCount++;
      updateMovesDisplay();
      
      // Check for match after a small delay
      setTimeout(checkForMatch, 800);
    }
  }
  
  /**
   * Checks if the two flipped cards match
   */
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
      const matchPoints = 20;
      score += matchPoints;
      
      // Add match animation class
      const firstCardElement = gameBoard.querySelector(`[data-index="${firstCardIndex}"]`);
      const secondCardElement = gameBoard.querySelector(`[data-index="${secondCardIndex}"]`);
      
      firstCardElement.classList.add('matched', 'match-animation');
      secondCardElement.classList.add('matched', 'match-animation');
      
      // Play match sound
      playSound('match');
      
      // Update progress
      updateProgressDisplay();
      
      // Show message
      showAlert(`Eşleşme! +${matchPoints} puan`, 'success');
      
      // Check if all pairs are matched
      if (matchedPairs === currentLevel.pairs) {
        setTimeout(() => {
          endGame(true);
        }, 800);
        return;
      }
    } else {
      // No match
      playSound('nomatch');
      
      // Add no-match animation class
      const firstCardElement = gameBoard.querySelector(`[data-index="${firstCardIndex}"]`);
      const secondCardElement = gameBoard.querySelector(`[data-index="${secondCardIndex}"]`);
      
      firstCardElement.classList.add('no-match');
      secondCardElement.classList.add('no-match');
      
      // Reset flip state after animation
      setTimeout(() => {
        firstCard.isFlipped = false;
        secondCard.isFlipped = false;
        
        firstCardElement.classList.remove('flipped', 'no-match');
        secondCardElement.classList.remove('flipped', 'no-match');
        
        // Deduct points for incorrect match
        const penalty = 5;
        score = Math.max(0, score - penalty);
        updateScoreDisplay();
        
        // Show message
        showAlert(`Eşleşme bulunamadı. -${penalty} puan`, 'error');
      }, 1000);
    }
    
    // Reset flipped cards
    flippedCards = [];
    
    // Update score display
    updateScoreDisplay();
  }
  
  /**
   * Provides a hint by briefly revealing random unmatched cards
   */
  function showHint() {
    if (!isGameActive || isPaused || showingHint) return;
    
    // Check if enough time has passed since last hint
    const now = Date.now();
    if (now - lastHintTime < 10000) { // 10 seconds cooldown
      showAlert('İpucu kullanmak için 10 saniye beklemelisiniz', 'warning');
      return;
    }
    
    // Deduct points for using hint
    const hintCost = 10;
    score = Math.max(0, score - hintCost);
    hintsUsed++;
    lastHintTime = now;
    showingHint = true;
    
    // Play hint sound
    playSound('hint');
    
    // Get all unmatched and unflipped cards
    const unmatchedCardIndices = cards
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => !card.isMatched && !card.isFlipped)
      .map(({ index }) => index);
    
    // Shuffle the array and get the first 2 cards
    const hintIndices = shuffleArray(unmatchedCardIndices).slice(0, 2);
    
    // Mark cards as being revealed
    hintIndices.forEach(index => {
      cards[index].isRevealed = true;
    });
    
    // Render the cards to show the hint
    renderCards();
    
    // Show message
    showAlert(`İpucu gösteriliyor... -${hintCost} puan`, 'info');
    
    // Hide the hint after a delay
    hintTimeout = setTimeout(() => {
      hintIndices.forEach(index => {
        cards[index].isRevealed = false;
      });
      renderCards();
      showingHint = false;
    }, 1500);
    
    // Update score display
    updateScoreDisplay();
  }
  
  /**
   * Toggles sound on/off
   */
  function toggleSound() {
    const soundEnabled = soundToggle.classList.toggle('active');
    
    for (const sound in sounds) {
      sounds[sound].muted = !soundEnabled;
    }
    
    // Update icon
    soundToggle.innerHTML = soundEnabled ? 
      '<i class="fas fa-volume-up"></i>' : 
      '<i class="fas fa-volume-mute"></i>';
    
    // Show message
    showAlert(soundEnabled ? 'Ses açıldı' : 'Ses kapatıldı', 'info');
  }
  
  /**
   * Toggles game pause state
   */
  function togglePause() {
    isPaused = !isPaused;
    
    if (isPaused) {
      // Pause the game
      pauseOverlay.style.display = 'flex';
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    } else {
      // Resume the game
      pauseOverlay.style.display = 'none';
      // Only restart timer if game is still active
      if (isGameActive) {
        timerInterval = setInterval(updateTimer, 1000);
      }
    }
    
    playSound('click');
  }
  
  /**
   * Updates the score display
   */
  function updateScoreDisplay() {
    scoreDisplay.textContent = score;
  }
  
  /**
   * Updates the moves display
   */
  function updateMovesDisplay() {
    movesDisplay.textContent = movesCount;
  }
  
  /**
   * Updates the progress display
   */
  function updateProgressDisplay() {
    const progressPercentage = Math.floor((matchedPairs / currentLevel.pairs) * 100);
    progressBar.style.width = `${progressPercentage}%`;
    progressPercent.textContent = `${progressPercentage}%`;
  }
  
  /**
   * Starts the game timer
   */
  function startTimer(seconds) {
    let timeRemaining = seconds;
    updateTimerDisplay(timeRemaining);
    
    timerInterval = setInterval(updateTimer, 1000);
    
    return {
      stop: function() {
        clearInterval(timerInterval);
      },
      getTimeLeft: function() {
        return timeRemaining;
      }
    };
  }
  
  /**
   * Updates the timer
   */
  function updateTimer() {
    if (isPaused) return;
    
    timeElapsed++;
    const timeRemaining = currentLevel.timeLimit - timeElapsed;
    
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      endGame(false);
    } else {
      updateTimerDisplay(timeRemaining);
      
      // Low time warning
      if (timeRemaining <= 10) {
        timerDisplay.classList.add('time-warning');
      }
    }
  }
  
  /**
   * Updates the timer display
   */
  function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    timerDisplay.textContent = `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
  
  /**
   * Shows an alert message
   */
  function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `memory-alert-message ${type}`;
    alert.textContent = message;
    
    alertContainer.appendChild(alert);
    
    // Remove after animation completes
    setTimeout(() => {
      alert.classList.add('fade-out');
      setTimeout(() => {
        alertContainer.removeChild(alert);
      }, 500);
    }, 2000);
  }
  
  /**
   * Adjusts card size based on screen size
   */
  function adjustCardSize() {
    // Adjust card size based on container width and grid columns
    const boardWidth = gameBoard.offsetWidth;
    const optimalCardSize = Math.floor(boardWidth / currentLevel.cols) - 10; // 10px for margin
    
    // Set CSS variable for card size
    document.documentElement.style.setProperty('--memory-card-size', `${Math.min(optimalCardSize, 80)}px`);
  }
  
  /**
   * Plays a sound effect if audio is enabled
   */
  function playSound(soundName) {
    if (!audioEnabled || sounds[soundName].muted) {
      return;
    }
    
    try {
      sounds[soundName].currentTime = 0;
      sounds[soundName].play().catch(() => {
        // Ignore errors when sound can't be played
      });
    } catch (e) {
      // Ignore sound play errors
    }
  }
  
  /**
   * Calculates star rating based on performance
   */
  function calculateRating() {
    // Calculate rating based on moves, time, and hints used
    let stars = 5;
    
    // Penalize for excess moves
    const optimalMoves = currentLevel.pairs * 2;
    if (movesCount > optimalMoves * 2) {
      stars -= 2;
    } else if (movesCount > optimalMoves * 1.5) {
      stars -= 1;
    }
    
    // Penalize for hints
    stars -= Math.min(2, hintsUsed);
    
    // Ensure at least 1 star
    return Math.max(1, stars);
  }
  
  /**
   * Updates the rating display
   */
  function updateRatingDisplay(stars) {
    const ratingStars = document.querySelectorAll('.rating-stars i');
    
    for (let i = 0; i < ratingStars.length; i++) {
      if (i < stars) {
        ratingStars[i].className = 'fas fa-star';
      } else {
        ratingStars[i].className = 'far fa-star';
      }
    }
    
    // Update rating text
    const ratingTexts = {
      1: 'Acemi',
      2: 'Ortalama',
      3: 'İyi',
      4: 'Çok İyi',
      5: 'Mükemmel!'
    };
    
    ratingText.textContent = ratingTexts[stars] || 'İyi';
  }
  
  /**
   * Copies score to clipboard
   */
  function copyScore() {
    const scoreText = `Hafıza Kartları Oyunu Skorumu Gör: ${score} puan, Seviye: ${currentLevel.pairs} çift kartı ${movesCount} hamlede ${formatTime(timeElapsed)} sürede tamamladım!`;
    
    try {
      navigator.clipboard.writeText(scoreText).then(() => {
        showAlert('Skor kopyalandı!', 'success');
      }).catch(() => {
        showAlert('Kopyalama başarısız.', 'error');
      });
    } catch (e) {
      showAlert('Kopyalama başarısız.', 'error');
    }
    
    playSound('click');
  }
  
  /**
   * Shares score using Web Share API
   */
  function shareScore() {
    const scoreText = `Hafıza Kartları Oyunu Skorumu Gör: ${score} puan, Seviye: ${currentLevel.pairs} çift kartı ${movesCount} hamlede ${formatTime(timeElapsed)} sürede tamamladım!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Hafıza Kartları Skor',
        text: scoreText
      }).then(() => {
        showAlert('Başarıyla paylaşıldı!', 'success');
      }).catch(() => {
        // User cancelled or share failed
      });
    } else {
      copyScore();
    }
    
    playSound('click');
  }
  
  /**
   * Formats time in seconds to MM:SS format
   */
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  
  /**
   * Ends the game
   */
  function endGame(completed = false) {
    isGameActive = false;
    
    // Stop the timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // Calculate final score
    if (completed) {
      // Time bonus: 2 points per second remaining
      const timeRemaining = currentLevel.timeLimit - timeElapsed;
      const timeBonus = timeRemaining * 2;
      
      // Efficiency bonus for fewer moves
      const optimalMoves = currentLevel.pairs * 2;
      const moveRatio = optimalMoves / movesCount;
      const efficiencyBonus = Math.round(moveRatio * 50);
      
      // Add bonuses to score
      score += timeBonus + efficiencyBonus;
      
      // Play win sound
      playSound('win');
    }
    
    // Update displays
    finalScoreDisplay.textContent = score;
    finalTimeDisplay.textContent = formatTime(timeElapsed);
    finalMovesDisplay.textContent = movesCount;
    
    // Calculate and display rating
    const stars = calculateRating();
    updateRatingDisplay(stars);
    
    // Show game over screen
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'block';
    
    // Save score to leaderboard
    window.saveScore('memoryMatch', score);
  }
  
  /**
   * Shuffles an array
   */
  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
});
