/**
 * Hafıza Kartları (Memory Card Game)
 * 
 * Profesyonel ve interaktif hafıza kartları oyunu
 * Gelişmiş özellikler: Farklı temalar, zorluk seviyeleri, ipuçları ve puan sistemi
 */
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const gameIntro = document.getElementById('gameIntro');
  const gameBoard = document.getElementById('gameBoard');
  const gameResults = document.getElementById('gameResults');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const memoryGrid = document.getElementById('memoryGrid');
  const startGameBtn = document.getElementById('startGame');
  const pauseGameBtn = document.getElementById('pauseGame');
  const resumeBtn = document.getElementById('resumeBtn');
  const soundToggleBtn = document.getElementById('soundToggle');
  const hintBtn = document.getElementById('hintBtn');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const saveScoreBtn = document.getElementById('saveScoreBtn');
  
  // Game display elements
  const scoreDisplay = document.getElementById('score');
  const timerDisplay = document.getElementById('timer');
  const movesDisplay = document.getElementById('moves');
  const progressBar = document.getElementById('progressBar');
  const progressPercent = document.getElementById('progressPercent');
  const currentThemeDisplay = document.getElementById('currentTheme');
  const hintCounter = document.querySelector('.hint-counter');
  
  // Result elements
  const finalScore = document.getElementById('finalScore');
  const finalTime = document.getElementById('finalTime');
  const finalMoves = document.getElementById('finalMoves');
  const performanceStars = document.getElementById('performanceStars');
  const performanceText = document.getElementById('performanceText');
  
  // Level buttons
  const levelButtons = document.querySelectorAll('.level-btn:not(.theme-btn)');
  const themeButtons = document.querySelectorAll('.theme-btn');
  
  // Game state variables
  let cards = [];
  let flippedCards = [];
  let matchedPairs = 0;
  let totalPairs = 0;
  let moves = 0;
  let score = 0;
  let hintsLeft = 3;
  let timer = 0;
  let timerInterval;
  let gamePaused = false;
  let soundEnabled = true;
  let currentLevel = 'easy';
  let currentTheme = 'animals';
  let rows = 3; // Default rows
  let cols = 4; // Default columns
  
  // Game configuration
  const levelConfig = {
    easy: { rows: 3, cols: 4, timeBonus: 500, movePenalty: 2 },
    medium: { rows: 3, cols: 6, timeBonus: 750, movePenalty: 1 },
    hard: { rows: 3, cols: 10, timeBonus: 1000, movePenalty: 0.5 }
  };
  
  // Theme configuration with emojis
  const themes = {
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄', '🦋', '🐝', '🐙', '🦑', '🦈', '🐊', '🦓', '🦒', '🦔', '🐘', '🦍', '🐆', '🦬', '🦥', '🐦', '🦅'],
    fruits: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥦', '🥬', '🧄', '🧅', '🍄', '🥜', '🌰', '🥐'],
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨'],
    shapes: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🔺', '🔻', '💠', '🔷', '🔶', '🔹', '🔸', '♠️', '♥️', '♦️', '♣️', '🎴', '🃏', '🀄', '🎭', '🎯', '🎲', '🎮', '🎰', '🧩', '🎪', '🎨', '🎺']
  };
  
  // Audio effects
  const sounds = {
    flip: new Audio('/static/sounds/card-flip.mp3'),
    match: new Audio('/static/sounds/match.mp3'),
    noMatch: new Audio('/static/sounds/no-match.mp3'),
    gameComplete: new Audio('/static/sounds/game-complete.mp3'),
    hint: new Audio('/static/sounds/hint.mp3')
  };
  
  /**
   * Initialize game sounds with placeholder paths, files will be created later
   */
  function initSounds() {
    try {
      // Set volume for all sounds
      Object.values(sounds).forEach(sound => {
        if (sound && sound instanceof Audio) {
          sound.volume = 0.5;
          
          // Create a placeholder for missing sounds
          sound.onerror = function() {
            try {
              // Use an existing sound file if the specific one isn't found
              const fallbackSounds = {
                'flip': '/static/sounds/click.mp3',
                'match': '/static/sounds/correct.mp3',
                'noMatch': '/static/sounds/wrong.mp3',
                'gameComplete': '/static/sounds/success.mp3',
                'hint': '/static/sounds/click.mp3'
              };
              
              // Get the sound name from src path
              const soundName = this.src.split('/').pop().split('.')[0];
              
              // Try to use fallback sound if available
              if (fallbackSounds[soundName]) {
                this.src = fallbackSounds[soundName];
              } else {
                // Disable sound as last resort
                soundEnabled = false;
                console.log('Sound file not found, disabling sound');
              }
            } catch (e) {
              console.error('Error handling sound fallback:', e);
              soundEnabled = false;
            }
          };
        }
      });
    } catch (e) {
      console.error('Error initializing sounds:', e);
      soundEnabled = false;
    }
  }
  
  /**
   * Play a sound effect if sound is enabled
   * @param {string} soundName - The name of the sound to play
   */
  function playSound(soundName) {
    try {
      if (soundEnabled && sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        const playPromise = sounds[soundName].play();
        
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.log('Sound play error:', e);
            // Autoplay engellenmesi durumunda sesler kapatılsın
            if (e.name === 'NotAllowedError') {
              soundEnabled = false;
              if (soundToggleBtn) {
                const soundIcon = soundToggleBtn.querySelector('i');
                if (soundIcon) soundIcon.className = 'bi bi-volume-mute-fill';
              }
            }
          });
        }
      }
    } catch (e) {
      console.error('Error playing sound:', e);
      soundEnabled = false;
    }
  }
  
  /**
   * Initialize the game
   */
  function init() {
    initSounds();
    setupEventListeners();
    updateHintDisplay();
  }
  
  /**
   * Set up all event listeners
   */
  function setupEventListeners() {
    // Start game button
    if (startGameBtn) {
      startGameBtn.addEventListener('click', startGame);
    } else {
      console.error("startGameBtn bulunamadı!");
    }
    
    // Level selection
    if (levelButtons && levelButtons.length > 0) {
      levelButtons.forEach(button => {
        button.addEventListener('click', () => {
          levelButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          currentLevel = button.dataset.level;
          rows = levelConfig[currentLevel].rows;
          cols = levelConfig[currentLevel].cols;
        });
      });
    } else {
      console.error("levelButtons bulunamadı veya boş!");
    }
    
    // Theme selection
    themeButtons.forEach(button => {
      button.addEventListener('click', () => {
        themeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentTheme = button.dataset.theme;
        currentThemeDisplay.textContent = capitalizeFirstLetter(currentTheme);
      });
    });
    
    // Game controls
    pauseGameBtn.addEventListener('click', togglePause);
    resumeBtn.addEventListener('click', togglePause);
    soundToggleBtn.addEventListener('click', toggleSound);
    hintBtn.addEventListener('click', useHint);
    
    // Result actions
    playAgainBtn.addEventListener('click', resetGame);
    saveScoreBtn.addEventListener('click', saveScore);
  }
  
  /**
   * Start the game
   */
  function startGame() {
    try {
      // Elementlerin var olduğunu kontrol et
      if (!gameIntro || !gameBoard || !memoryGrid) {
        console.error("Gerekli elementler bulunamadı!");
        return;
      }
      
      // Hide intro, show game board
      if (gameIntro) gameIntro.style.display = 'none';
      if (gameResults) gameResults.style.display = 'none';
      if (gameBoard) gameBoard.style.display = 'block';
      
      // Reset game state
      resetGameState();
      
      // Generate cards
      generateCards();
      
      // Start timer
      startTimer();
      
      // Update theme display
      if (currentThemeDisplay) currentThemeDisplay.textContent = capitalizeFirstLetter(currentTheme);
      
      // Show game board with animation
      if (gameBoard) {
        gameBoard.classList.add('animate__animated', 'animate__fadeIn');
        setTimeout(() => gameBoard.classList.remove('animate__animated', 'animate__fadeIn'), 1000);
      }
      
      console.log("Oyun başarıyla başlatıldı.");
    } catch (error) {
      console.error("Oyun başlatılırken hata oluştu:", error);
      // Hata durumunda kullanıcıya görsel geri bildirim
      showAlert("Oyun başlatılırken bir hata oluştu. Lütfen sayfayı yenileyin.", "error");
    }
  }
  
  /**
   * Generate memory cards based on current settings
   */
  function generateCards() {
    // Clear previous cards
    memoryGrid.innerHTML = '';
    
    // Apply grid styles based on difficulty level
    memoryGrid.className = 'memory-grid';
    
    // Add difficulty-specific grid class
    if (currentLevel === 'easy') {
      memoryGrid.classList.add('grid-easy');
    } else if (currentLevel === 'medium') {
      memoryGrid.classList.add('grid-medium');
    } else if (currentLevel === 'hard') {
      memoryGrid.classList.add('grid-hard');
    }
    
    // Determine number of pairs needed
    totalPairs = (rows * cols) / 2;
    
    // Get symbols for current theme
    const themeSymbols = themes[currentTheme];
    
    // Create pairs array
    const pairs = [];
    for (let i = 0; i < totalPairs; i++) {
      // Use modulo to cycle through available symbols if we need more than we have
      const symbolIndex = i % themeSymbols.length;
      pairs.push(themeSymbols[symbolIndex]);
      pairs.push(themeSymbols[symbolIndex]);
    }
    
    // Shuffle the pairs
    const shuffledPairs = shuffleArray(pairs);
    
    // Create card elements
    cards = [];
    shuffledPairs.forEach((symbol, index) => {
      const card = createCard(index, symbol);
      memoryGrid.appendChild(card);
      cards.push(card);
    });
  }
  
  /**
   * Create a single card element
   * @param {number} id - Card unique identifier
   * @param {string} symbol - Card symbol/emoji
   * @returns {HTMLElement} - The card DOM element
   */
  function createCard(id, symbol) {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.dataset.id = id;
    card.dataset.symbol = symbol;
    
    const frontFace = document.createElement('div');
    frontFace.className = 'memory-card__front';
    frontFace.textContent = symbol;
    
    const backFace = document.createElement('div');
    backFace.className = 'memory-card__back';
    
    card.appendChild(frontFace);
    card.appendChild(backFace);
    
    // Add click event
    card.addEventListener('click', flipCard);
    
    return card;
  }
  
  /**
   * Handle card flip
   * @param {Event} e - Click event
   */
  function flipCard(e) {
    // Ignore if game is paused
    if (gamePaused) return;
    
    const card = e.currentTarget;
    
    // Ignore if the card is already flipped or matched
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    
    // Ignore if two cards are already flipped
    if (flippedCards.length === 2) return;
    
    // Play flip sound
    playSound('flip');
    
    // Flip the card
    card.classList.add('flipped');
    flippedCards.push(card);
    
    // Check for match if two cards are flipped
    if (flippedCards.length === 2) {
      moves++;
      movesDisplay.textContent = moves;
      checkForMatch();
    }
  }
  
  /**
   * Check if the two flipped cards match
   */
  function checkForMatch() {
    const [firstCard, secondCard] = flippedCards;
    
    // Get symbols from cards
    const firstSymbol = firstCard.dataset.symbol;
    const secondSymbol = secondCard.dataset.symbol;
    
    // Check if symbols match
    if (firstSymbol === secondSymbol) {
      handleMatch(firstCard, secondCard);
    } else {
      handleMismatch(firstCard, secondCard);
    }
  }
  
  /**
   * Handle matching cards
   * @param {HTMLElement} firstCard - First card element
   * @param {HTMLElement} secondCard - Second card element
   */
  function handleMatch(firstCard, secondCard) {
    // Mark cards as matched
    firstCard.classList.add('matched', 'match-animation');
    secondCard.classList.add('matched', 'match-animation');
    
    // Play match sound
    playSound('match');
    
    // Calculate points (base + time bonus)
    const basePoints = 10;
    const timeBonus = Math.max(0, levelConfig[currentLevel].timeBonus - timer);
    const pointsEarned = basePoints + Math.floor(timeBonus / 10);
    
    // Update score
    score += pointsEarned;
    scoreDisplay.textContent = score;
    
    // Show success message
    showAlert(`+${pointsEarned} Puan! 🎉`, 'success');
    
    // Increase matched pairs
    matchedPairs++;
    
    // Update progress
    updateProgress();
    
    // Reset flipped cards
    flippedCards = [];
    
    // Check if game is complete
    if (matchedPairs === totalPairs) {
      setTimeout(endGame, 1000);
    }
    
    // Remove animation class after animation completes
    setTimeout(() => {
      firstCard.classList.remove('match-animation');
      secondCard.classList.remove('match-animation');
    }, 600);
  }
  
  /**
   * Handle mismatched cards
   * @param {HTMLElement} firstCard - First card element
   * @param {HTMLElement} secondCard - Second card element
   */
  function handleMismatch(firstCard, secondCard) {
    // Add no-match animation class
    firstCard.classList.add('no-match');
    secondCard.classList.add('no-match');
    
    // Play no match sound
    playSound('noMatch');
    
    // Apply move penalty
    const movePenalty = levelConfig[currentLevel].movePenalty;
    if (movePenalty > 0) {
      score = Math.max(0, score - movePenalty);
      scoreDisplay.textContent = score;
    }
    
    // Flip cards back after a delay
    setTimeout(() => {
      firstCard.classList.remove('flipped', 'no-match');
      secondCard.classList.remove('flipped', 'no-match');
      flippedCards = [];
    }, 1000);
  }
  
  /**
   * Show an alert message
   * @param {string} message - Message to display
   * @param {string} type - Alert type (success, error, warning, info)
   */
  function showAlert(message, type = 'info') {
    const alerts = document.getElementById('gameAlerts');
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `memory-alert-message ${type}`;
    alert.textContent = message;
    
    // Add to alerts container
    alerts.appendChild(alert);
    
    // Remove after delay
    setTimeout(() => {
      alert.classList.add('fade-out');
      setTimeout(() => alert.remove(), 500);
    }, 2000);
  }
  
  /**
   * Update the progress bar
   */
  function updateProgress() {
    const progress = (matchedPairs / totalPairs) * 100;
    progressBar.style.width = `${progress}%`;
    progressPercent.textContent = `${Math.round(progress)}%`;
  }
  
  /**
   * Start the game timer
   */
  function startTimer() {
    timer = 0;
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
      if (!gamePaused) {
        timer++;
        updateTimerDisplay();
      }
    }, 1000);
  }
  
  /**
   * Update the timer display
   */
  function updateTimerDisplay() {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  /**
   * Toggle game pause state
   */
  function togglePause() {
    gamePaused = !gamePaused;
    
    if (gamePaused) {
      pauseOverlay.style.display = 'flex';
    } else {
      pauseOverlay.style.display = 'none';
    }
  }
  
  /**
   * Toggle sound on/off
   */
  function toggleSound() {
    soundEnabled = !soundEnabled;
    
    const soundIcon = soundToggleBtn.querySelector('i');
    if (soundEnabled) {
      soundIcon.className = 'bi bi-volume-up-fill';
    } else {
      soundIcon.className = 'bi bi-volume-mute-fill';
    }
  }
  
  /**
   * Use a hint to reveal a pair briefly
   */
  function useHint() {
    if (hintsLeft <= 0 || gamePaused || matchedPairs === totalPairs) {
      return;
    }
    
    // Find an unmatched pair
    const unmatchedCards = cards.filter(card => !card.classList.contains('matched'));
    if (unmatchedCards.length === 0) return;
    
    // Group by symbols
    const cardsBySymbol = {};
    unmatchedCards.forEach(card => {
      const symbol = card.dataset.symbol;
      if (!cardsBySymbol[symbol]) {
        cardsBySymbol[symbol] = [];
      }
      cardsBySymbol[symbol].push(card);
    });
    
    // Find a symbol with exactly 2 cards (a complete pair)
    const availablePairs = Object.values(cardsBySymbol).filter(group => group.length === 2);
    
    if (availablePairs.length === 0) return;
    
    // Select a random pair
    const selectedPair = availablePairs[Math.floor(Math.random() * availablePairs.length)];
    
    // Highlight the pair briefly
    selectedPair.forEach(card => card.classList.add('hint'));
    
    // Play hint sound
    playSound('hint');
    
    // Decrease available hints
    hintsLeft--;
    updateHintDisplay();
    
    // Remove highlight after a delay
    setTimeout(() => {
      selectedPair.forEach(card => card.classList.remove('hint'));
    }, 1500);
  }
  
  /**
   * Update the hint counter display
   */
  function updateHintDisplay() {
    hintCounter.textContent = hintsLeft;
    if (hintsLeft <= 0) {
      hintBtn.classList.add('disabled');
    } else {
      hintBtn.classList.remove('disabled');
    }
  }
  
  /**
   * End the game and show results
   */
  function endGame() {
    // Stop the timer
    clearInterval(timerInterval);
    
    // Play completion sound
    playSound('gameComplete');
    
    // Calculate final score
    const timeBonus = Math.max(0, 1000 - timer);
    const movePenalty = Math.max(0, moves - (totalPairs * 2));
    const finalScoreValue = score + Math.floor(timeBonus / 10) - movePenalty;
    
    // Update results display
    finalScore.textContent = finalScoreValue;
    finalTime.textContent = timerDisplay.textContent;
    finalMoves.textContent = moves;
    
    // Calculate star rating
    const perfectMoves = totalPairs * 2;
    const moveEfficiency = perfectMoves / moves;
    const timeEfficiency = 1 - (timer / (totalPairs * 10));
    const overallRating = (moveEfficiency * 0.6 + timeEfficiency * 0.4) * 5;
    
    // Update star display
    updateStarRating(overallRating);
    
    // Hide game board, show results
    gameBoard.style.display = 'none';
    gameResults.style.display = 'block';
    
    // Add animation to results
    gameResults.classList.add('animate__animated', 'animate__fadeIn');
    setTimeout(() => gameResults.classList.remove('animate__animated', 'animate__fadeIn'), 1000);
  }
  
  /**
   * Update the star rating display
   * @param {number} rating - Rating from 0-5
   */
  function updateStarRating(rating) {
    // Round to nearest half star
    const roundedRating = Math.round(rating * 2) / 2;
    
    // Update stars
    const stars = performanceStars.querySelectorAll('i');
    stars.forEach((star, index) => {
      if (index + 1 <= roundedRating) {
        star.className = 'bi bi-star-fill';
      } else if (index + 0.5 === roundedRating) {
        star.className = 'bi bi-star-half';
      } else {
        star.className = 'bi bi-star';
      }
    });
    
    // Update performance text
    if (roundedRating >= 4.5) {
      performanceText.textContent = 'Mükemmel! 🏆';
    } else if (roundedRating >= 3.5) {
      performanceText.textContent = 'Çok İyi! 🎉';
    } else if (roundedRating >= 2.5) {
      performanceText.textContent = 'İyi Performans! 👍';
    } else if (roundedRating >= 1.5) {
      performanceText.textContent = 'İyi Çalışma 👌';
    } else {
      performanceText.textContent = 'Gelişim Gösteriyorsun 💪';
    }
  }
  
  /**
   * Reset the game state
   */
  function resetGameState() {
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    totalPairs = 0;
    moves = 0;
    score = 0;
    hintsLeft = 3;
    timer = 0;
    
    // Clear timer
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    
    // Reset displays
    scoreDisplay.textContent = '0';
    movesDisplay.textContent = '0';
    timerDisplay.textContent = '00:00';
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
    
    // Reset game state
    gamePaused = false;
    pauseOverlay.style.display = 'none';
    
    // Update hint display
    updateHintDisplay();
  }
  
  /**
   * Reset and restart the game
   */
  function resetGame() {
    gameResults.style.display = 'none';
    startGame();
  }
  
  /**
   * Save the player's score to the database
   */
  function saveScore() {
    // Disable button to prevent multiple submissions
    saveScoreBtn.disabled = true;
    
    // Get final score from display
    const finalScoreValue = parseInt(finalScore.textContent);
    
    // Prepare data for submission
    const scoreData = {
      game_type: 'memoryCards',
      score: finalScoreValue
    };
    
    // Send score to server
    fetch('/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scoreData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showAlert('Skorunuz başarıyla kaydedildi!', 'success');
        saveScoreBtn.textContent = '✓ Kaydedildi';
        saveScoreBtn.classList.add('btn-success');
      } else {
        showAlert('Skor kaydedilemedi. Lütfen tekrar deneyin.', 'error');
        saveScoreBtn.disabled = false;
      }
    })
    .catch(error => {
      console.error('Error saving score:', error);
      showAlert('Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
      saveScoreBtn.disabled = false;
    });
  }
  
  /**
   * Utility function to shuffle an array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} - Shuffled array
   */
  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
  
  /**
   * Utility function to capitalize first letter of a string
   * @param {string} str - String to capitalize
   * @returns {string} - Capitalized string
   */
  function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  // Initialize the game
  init();
  
  // Oyun bu şekilde başlamazsa, direkt olarak gameIntro elementinin var olup olmadığını kontrol et
  window.addEventListener('load', function() {
    if (gameIntro) {
      gameIntro.style.display = 'block';
      if (gameBoard) gameBoard.style.display = 'none';
      if (gameResults) gameResults.style.display = 'none';
    } else {
      console.error("gameIntro elementi bulunamadı!");
    }
  });
});