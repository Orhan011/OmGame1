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
  
  // Audio effects - inicializasyonu daha güvenli hale getirmek için boş objeler oluşturalım
  const sounds = {};
  
  /**
   * Initialize game sounds with placeholder paths, files will be created later
   */
  function initSounds() {
    // Ses dosyaları - statik url'ler ile mutlak yollar kullanarak
    const soundFiles = {
      flip: '/static/sounds/click.mp3', // Direkt olarak mevcut olan dosyayı kullanalım
      match: '/static/sounds/correct.mp3',
      noMatch: '/static/sounds/wrong.mp3',
      gameComplete: '/static/sounds/success.mp3',
      hint: '/static/sounds/click.mp3'
    };
    
    // Her bir ses dosyasını yükleme ve hata kontrolü
    Object.keys(soundFiles).forEach(soundName => {
      try {
        // Güvenli bir şekilde ses nesnesi oluşturalım
        sounds[soundName] = new Audio(soundFiles[soundName]);
        
        // Ses yüklenemezse
        sounds[soundName].onerror = function() {
          console.log(`${soundName} ses dosyası yüklenemedi`);
          // Basitleştirilmiş boş ses dosyası
          this.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        };
        
        // Ses seviyesini ayarla
        sounds[soundName].volume = 0.5;
      } catch (e) {
        console.log('Ses oluşturma hatası:', e);
        // Hata durumunda dummy (sahte) ses nesnesi oluşturalım
        sounds[soundName] = { 
          play: function() { 
            console.log(`${soundName} ses çalma simule ediliyor`);
            return Promise.resolve(); 
          },
          currentTime: 0,
          volume: 0.5
        };
      }
    });
    
    // Ses yükleme durumunu kontrol et
    console.log('Ses dosyaları yüklendi');
  }
  
  /**
   * Play a sound effect if sound is enabled
   * @param {string} soundName - The name of the sound to play
   */
  function playSound(soundName) {
    try {
      // Ses açık mı ve ses nesnesi mevcut mu kontrolü
      if (!soundEnabled) return;
      if (!sounds[soundName]) {
        console.log(`${soundName} ses dosyası bulunamadı`);
        return;
      }
      
      // Ses nesnesinin çalınabilirlik kontrolü
      if (typeof sounds[soundName].play === 'function') {
        // Ses dosyasını başa sar
        if (sounds[soundName].currentTime) {
          sounds[soundName].currentTime = 0;
        }
        
        // Asenkron ses çalma ve hata yönetimi
        const playPromise = sounds[soundName].play();
        
        // Play işlemi başarısız olursa sessizce devam et
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            console.log(`${soundName} çalma başarısız, devam ediliyor`);
          });
        }
      }
    } catch (e) {
      // Hata durumunda oyunu etkilememesi için sessizce devam et
      console.log('Ses çalma işlemi başarısız, oyuna devam ediliyor');
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
    // Start game button with ripple effect
    startGameBtn.addEventListener('click', function(e) {
      // Add ripple effect to button click
      const ripple = document.createElement('span');
      ripple.classList.add('ripple-effect');
      
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      this.appendChild(ripple);
      
      // Remove ripple after animation completes
      setTimeout(() => ripple.remove(), 600);
      
      // Start the game
      startGame();
    });
    
    // Level selection with transition animation
    levelButtons.forEach(button => {
      button.addEventListener('click', () => {
        levelButtons.forEach(btn => {
          btn.classList.remove('active');
          btn.style.transform = 'scale(1)';
        });
        
        button.classList.add('active');
        button.style.transform = 'scale(1.05)';
        setTimeout(() => button.style.transform = 'scale(1)', 300);
        
        currentLevel = button.dataset.level;
        rows = levelConfig[currentLevel].rows;
        cols = levelConfig[currentLevel].cols;
      });
    });
    
    // Theme selection with highlight effect
    themeButtons.forEach(button => {
      button.addEventListener('click', () => {
        themeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Add pulse animation to selected theme
        button.classList.add('theme-pulse');
        setTimeout(() => button.classList.remove('theme-pulse'), 700);
        
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
    console.log('Oyun başlatılıyor...');
    
    try {
      // Arayüz elemanlarını kontrol edelim
      if (!gameIntro || !gameBoard || !memoryGrid) {
        console.error('Game elements missing, checking and recovering...');
        
        // Eksik elementleri tekrar seçelim
        gameIntro = document.getElementById('gameIntro') || gameIntro;
        gameBoard = document.getElementById('gameBoard') || gameBoard;
        gameResults = document.getElementById('gameResults') || gameResults;
        memoryGrid = document.getElementById('memoryGrid') || memoryGrid;
      }
      
      // Gerekli DOM elementleri varmı kontrol edelim
      if (!memoryGrid) {
        throw new Error('Memory grid element not found!');
      }
      
      // Hide intro, show game board
      if (gameIntro) gameIntro.style.display = 'none';
      if (gameResults) gameResults.style.display = 'none';
      if (gameBoard) gameBoard.style.display = 'block';
      
      // Reset game state
      resetGameState();
      
      // Generate cards
      generateCards();
      
      console.log('Kartlar oluşturuldu, timer başlatılıyor...');
      
      // Start timer
      startTimer();
      
      // Update theme display
      if (currentThemeDisplay) {
        currentThemeDisplay.textContent = capitalizeFirstLetter(currentTheme);
      }
      
      // Show game board with animation
      if (gameBoard) {
        gameBoard.classList.add('animate__animated', 'animate__fadeIn');
        setTimeout(() => {
          if (gameBoard) {
            gameBoard.classList.remove('animate__animated', 'animate__fadeIn');
          }
        }, 1000);
      }
      
      console.log('Oyun başarıyla başlatıldı!');
    } catch (e) {
      console.error('Oyun başlatma hatası:', e);
      alert('Oyun başlatılırken bir hata oluştu. Lütfen sayfayı yenileyin.');
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
    
    // Create visual particle effect for matched cards
    createMatchParticles(firstCard);
    createMatchParticles(secondCard);
    
    // Play match sound
    playSound('match');
    
    // Calculate points with enhanced bonus system
    const basePoints = 10;
    const timeBonus = Math.max(0, levelConfig[currentLevel].timeBonus - timer);
    const streak = getMatchStreak(); // Arka arkaya eşleşme yaparsa bonus verilebilir
    const streakMultiplier = streak > 1 ? (streak * 0.5) : 1;
    const pointsEarned = Math.round((basePoints + Math.floor(timeBonus / 10)) * streakMultiplier);
    
    // Update score
    score += pointsEarned;
    
    // Show success message with streak info if applicable
    if (streak > 1) {
      showAlert(`+${pointsEarned} Puan! 🔥 ${streak}x Kombo!`, 'success');
    } else {
      showAlert(`+${pointsEarned} Puan! 🎉`, 'success');
    }
    
    // Increase matched pairs
    matchedPairs++;
    
    // Update progress with animated effect
    updateProgress(true);
    
    // Reset flipped cards
    flippedCards = [];
    
    // Check if game is complete
    if (matchedPairs === totalPairs) {
      setTimeout(endGame, 1200);
    }
    
    // Remove animation class after animation completes
    setTimeout(() => {
      firstCard.classList.remove('match-animation');
      secondCard.classList.remove('match-animation');
    }, 800);
  }
  
  /**
   * Create particle effect for matched cards
   * @param {HTMLElement} card - Card element
   */
  function createMatchParticles(card) {
    // Get card position
    const rect = card.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;
    
    // Create particle container if it doesn't exist
    let particleContainer = document.getElementById('particleContainer');
    if (!particleContainer) {
      particleContainer = document.createElement('div');
      particleContainer.id = 'particleContainer';
      particleContainer.style.position = 'fixed';
      particleContainer.style.top = '0';
      particleContainer.style.left = '0';
      particleContainer.style.width = '100%';
      particleContainer.style.height = '100%';
      particleContainer.style.pointerEvents = 'none';
      particleContainer.style.zIndex = '9999';
      document.body.appendChild(particleContainer);
    }
    
    // Create particles
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'match-particle';
      particle.style.position = 'absolute';
      particle.style.width = '8px';
      particle.style.height = '8px';
      particle.style.borderRadius = '50%';
      particle.style.backgroundColor = 'rgba(16, 185, 129, 0.8)';
      particle.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.5)';
      particle.style.top = `${cardCenterY}px`;
      particle.style.left = `${cardCenterX}px`;
      
      // Random speed and direction
      const angle = (Math.random() * Math.PI * 2);
      const speed = 2 + Math.random() * 4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      // Add to container
      particleContainer.appendChild(particle);
      
      // Animate
      let posX = cardCenterX;
      let posY = cardCenterY;
      let opacity = 1;
      let scale = 1;
      
      const animate = () => {
        if (opacity <= 0) {
          particle.remove();
          return;
        }
        
        posX += vx;
        posY += vy;
        opacity -= 0.02;
        scale += 0.02;
        
        particle.style.left = `${posX}px`;
        particle.style.top = `${posY}px`;
        particle.style.opacity = opacity;
        particle.style.transform = `scale(${scale})`;
        
        requestAnimationFrame(animate);
      };
      
      requestAnimationFrame(animate);
    }
  }
  
  /**
   * Get current match streak
   * @returns {number} - Current streak count
   */
  function getMatchStreak() {
    // This is a placeholder - you could implement actual streak tracking here
    // For example, you could keep a lastMatchTime and compare with current time
    // Or maintain a streak counter that resets on mismatches
    return Math.floor(Math.random() * 3) + 1; // Random streak for demonstration
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
   * Update the progress bar with animation
   * @param {boolean} animated - Whether to animate the progress update
   */
  function updateProgress(animated = false) {
    const progress = (matchedPairs / totalPairs) * 100;
    
    if (animated) {
      // Animate the progress bar with a smooth transition
      progressBar.style.transition = 'width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)';
      
      // Create a pulse effect
      progressBar.classList.add('progress-pulse');
      setTimeout(() => {
        progressBar.classList.remove('progress-pulse');
      }, 700);
      
      // Add percentage counter animation
      let currentPercent = parseInt(progressPercent.textContent) || 0;
      const targetPercent = Math.round(progress);
      const duration = 700; // ms
      const stepTime = 20; // ms
      const steps = duration / stepTime;
      const increment = (targetPercent - currentPercent) / steps;
      
      let step = 0;
      const updateCounter = () => {
        step++;
        currentPercent += increment;
        if (step >= steps) {
          currentPercent = targetPercent;
        }
        progressPercent.textContent = `${Math.round(currentPercent)}%`;
        
        if (step < steps) {
          requestAnimationFrame(updateCounter);
        }
      };
      
      requestAnimationFrame(updateCounter);
    }
    
    // Update the progress bar width
    progressBar.style.width = `${progress}%`;
    
    // If not animated, just update the text directly
    if (!animated) {
      progressPercent.textContent = `${Math.round(progress)}%`;
    }
    
    // Add milestone celebration for progress
    if (Math.round(progress) === 50 && matchedPairs > 1) {
      showAlert('Yarısını tamamladınız! Devam edin! 🚀', 'info');
    } else if (Math.round(progress) === 75 && matchedPairs > 1) {
      showAlert('Son düzlüğe girdiniz! 🏁', 'info');
    }
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
    // No timer display to update - function kept for structure
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    // timerDisplay reference removed since we don't display it anymore
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
    
    // Show celebration message
    showAlert('Tebrikler! Oyunu tamamladınız! 🎉', 'success');
    
    // Calculate final score with bonus factors
    const timeBonus = Math.max(0, 1000 - timer);
    const perfectMoves = totalPairs * 2;
    const movePenalty = Math.max(0, moves - perfectMoves);
    
    // Create difficulty bonus
    const difficultyMultiplier = currentLevel === 'easy' ? 1 : 
                               currentLevel === 'medium' ? 1.5 : 2;
    
    // Calculate final score with all factors
    const finalScoreValue = Math.round((score + Math.floor(timeBonus / 10) - movePenalty) * difficultyMultiplier);
    
    // Get game stats
    const totalTime = timer;
    
    // Zorluk seviyesini belirle
    let difficulty = currentLevel; // 'easy', 'medium', veya 'hard'
    
    // Oyun istatistiklerini topla
    const gameStats = {
      duration_seconds: totalTime,
      move_count: moves,
      hint_count: initialHints - hintsLeft,
      pairs_count: totalPairs,
      theme: currentTheme
    };
    
    // API'ye skoru kaydet (sonuç ekranı göstermeden)
    saveScoreToAPI('memoryCards', finalScoreValue, totalTime, difficulty, gameStats);
    
    // Kısa bir süre sonra ana sayfaya yönlendir
    setTimeout(() => {
      window.location.href = "/all_games";
    }, 1500);
  }
  
  /**
   * Skoru API'ye kaydeder ve sonuç ekranı göstermez
   */
  function saveScoreToAPI(gameType, score, time, difficulty, gameStats) {
    // API'ye post isteği gönder
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: gameType,
        score: score,
        difficulty: difficulty,
        playtime: time,
        game_stats: gameStats
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Skor kaydedildi:', data);
    })
    .catch(error => {
      console.error('Skor kaydedilirken hata oluştu:', error);
    });
  }
  
  /**
   * Animate numerical value from start to end
   * @param {HTMLElement} element - Element to update
   * @param {number} start - Starting value
   * @param {number} end - Ending value
   * @param {number} duration - Animation duration in ms
   */
  function animateResultValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / 30; // 30 steps
    const stepTime = Math.abs(Math.floor(duration / 30));
    
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if (increment > 0 && current >= end || increment < 0 && current <= end) {
        clearInterval(timer);
        element.textContent = end;
      } else {
        element.textContent = Math.round(current);
      }
    }, stepTime);
  }
  
  /**
   * Create confetti effect for game completion
   */
  function createConfetti() {
    // Create confetti container
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    confettiContainer.style.position = 'fixed';
    confettiContainer.style.top = '0';
    confettiContainer.style.left = '0';
    confettiContainer.style.width = '100%';
    confettiContainer.style.height = '100%';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.zIndex = '9998';
    document.body.appendChild(confettiContainer);
    
    // Create confetti pieces
    const colors = [
      'rgba(99, 102, 241, 0.9)',  // Primary
      'rgba(139, 92, 246, 0.9)',  // Tertiary
      'rgba(16, 185, 129, 0.9)',  // Success
      'rgba(245, 158, 11, 0.9)',  // Warning
      'rgba(255, 255, 255, 0.9)'  // White
    ];
    
    const confettiCount = 100;
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Randomize confetti properties
      const size = Math.random() * 10 + 5;
      const isRect = Math.random() > 0.5;
      
      confetti.style.position = 'absolute';
      confetti.style.width = `${size}px`;
      confetti.style.height = isRect ? `${size * 0.4}px` : `${size}px`;
      confetti.style.backgroundColor = color;
      confetti.style.borderRadius = isRect ? '0px' : '50%';
      confetti.style.top = '-50px';
      confetti.style.left = `${Math.random() * 100}%`;
      
      // Add to container
      confettiContainer.appendChild(confetti);
      
      // Animation variables
      const speed = 3 + Math.random() * 5;
      const rotation = Math.random() * 360;
      const rotationSpeed = (Math.random() - 0.5) * 10;
      const horizontalSwing = 50 + Math.random() * 100;
      const delay = Math.random() * 2; // seconds
      
      // Apply animation
      confetti.style.animation = `confetti-fall ${speed}s linear ${delay}s forwards`;
      
      // Custom animation
      let verticalPosition = -50;
      let horizontalPosition = parseFloat(confetti.style.left);
      let currentRotation = rotation;
      let opacity = 1;
      
      const animateConfetti = () => {
        verticalPosition += speed / 2;
        const progress = verticalPosition / window.innerHeight;
        
        // Horizontal swing using sine wave
        const swingOffset = Math.sin(progress * Math.PI * 2) * horizontalSwing / 5;
        horizontalPosition = parseFloat(confetti.style.left) + swingOffset;
        
        // Update rotation
        currentRotation += rotationSpeed;
        
        // Update opacity for fade out at end
        if (progress > 0.7) {
          opacity = 1 - ((progress - 0.7) / 0.3);
        }
        
        // Apply styles
        confetti.style.transform = `translateY(${verticalPosition}px) translateX(${swingOffset}px) rotate(${currentRotation}deg)`;
        confetti.style.opacity = opacity;
        
        // Continue animation until offscreen or faded out
        if (verticalPosition < window.innerHeight + 100 && opacity > 0) {
          requestAnimationFrame(animateConfetti);
        } else {
          confetti.remove();
          
          // Remove container if all confetti are gone
          if (confettiContainer.children.length === 0) {
            confettiContainer.remove();
          }
        }
      };
      
      // Start after delay
      setTimeout(() => {
        requestAnimationFrame(animateConfetti);
      }, delay * 1000);
    }
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
    
    // Reset displays - only progress bar since stats display is removed
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
    const totalTime = timer; // Oyun süresi
    const totalMoves = moves; // Toplam hamle sayısı
    
    // Zorluk seviyesini belirle
    let difficulty = 'medium';
    if (currentDifficulty === 'easy') {
      difficulty = 'easy';
    } else if (currentDifficulty === 'hard') {
      difficulty = 'hard';
    } else if (currentDifficulty === 'expert') {
      difficulty = 'expert';
    }
    
    // Oyun istatistiklerini topla
    const gameStats = {
      duration_seconds: totalTime,
      move_count: totalMoves,
      hint_count: initialHints - hintsLeft,
      pairs_count: totalPairs,
      theme: currentTheme
    };
    
    // Yeni skor gösterimi için container oluştur
    if (!document.getElementById('game-score-container')) {
      const scoreContainer = document.createElement('div');
      scoreContainer.id = 'game-score-container';
      scoreContainer.innerHTML = `
        <div class="loading-score">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Yükleniyor...</span>
          </div>
          <p>Skorunuz hesaplanıyor...</p>
        </div>
      `;
      
      // Yerleştirme - mevcut sonuç istatistiklerinden sonra ekle
      const resultsStats = document.querySelector('.results-stats');
      if (resultsStats) {
        resultsStats.style.display = 'none'; // Eski istatistikleri gizle
        resultsStats.parentNode.insertBefore(scoreContainer, resultsStats.nextSibling);
      }
    }
    
    // Callback fonksiyonu - skor HTML'ini gösterir
    const updateScoreDisplay = function(scoreHtml, data) {
      const scoreContainer = document.getElementById('game-score-container');
      if (scoreContainer) {
        scoreContainer.innerHTML = scoreHtml;
      }
      
      if (data && data.success) {
        showAlert('Skorunuz başarıyla kaydedildi!', 'success');
        saveScoreBtn.textContent = '✓ Kaydedildi';
        saveScoreBtn.classList.add('btn-success');
      } else if (data && data.login_required) {
        // Giriş yapmamış kullanıcılar için giriş yapma butonu göster
        showAlert('Skorunuzu kaydetmek için giriş yapmalısınız.', 'warning');
        saveScoreBtn.textContent = '🔑 Giriş Yap';
        saveScoreBtn.classList.remove('btn-primary');
        saveScoreBtn.classList.add('btn-warning');
        saveScoreBtn.disabled = false;
        
        // Butonu giriş sayfasına yönlendirme işlevine güncelleyin
        saveScoreBtn.removeEventListener('click', saveScore);
        saveScoreBtn.addEventListener('click', function() {
          window.location.href = '/login?redirect=memory_cards';
        });
      } else {
        showAlert('Skor kaydedilemedi. Lütfen tekrar deneyin.', 'error');
        saveScoreBtn.disabled = false;
      }
    };
    
    // Puan sistemi kaldırıldı
    console.log('Puan sistemi kaldırıldı - skorlar kaydedilmiyor');
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
});