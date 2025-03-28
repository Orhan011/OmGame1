/**
 * Hafıza Kartları Oyunu - 2.0
 * Tamamen yenilenmiş modern, duyarlı (responsive) ve profesyonel sürüm
 * 
 * Özellikler:
 * - Sınırlı ipucu kullanımı
 * - Tema göstergesi
 * - Zorluk seviyeleri
 * - Başarımlar ve ödüller
 * - Gelişmiş oyun deneyimi
 * - Tüm cihazlara uyumlu tasarım
 * - Yeni animasyonlar ve efektler
 */
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements - Ana arayüz
  const gameBoard = document.getElementById('memory-grid');
  const scoreDisplay = document.getElementById('score-display');
  const timerDisplay = document.getElementById('timer-display');
  const movesDisplay = document.getElementById('moves-display');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');
  const startBtn = document.getElementById('start-game');
  const pauseBtn = document.getElementById('pause-game');
  const resumeBtn = document.getElementById('resume-game');
  const restartBtn = document.getElementById('restart-game');
  const hintBtn = document.getElementById('hint-button');
  const hintCounter = document.getElementById('hint-counter');
  const soundToggle = document.getElementById('sound-toggle');
  const themeIndicator = document.getElementById('theme-indicator');
  
  // DOM Elements - Ekranlar 
  const gameContainer = document.getElementById('game-container');
  const introSection = document.getElementById('intro-section');
  const gameOverContainer = document.getElementById('game-over-container');
  const pauseOverlay = document.getElementById('pause-overlay');
  
  // DOM Elements - Sonuç ekranı
  const gameResultTitle = document.getElementById('game-result-title');
  const finalScoreDisplay = document.getElementById('final-score');
  const finalTimeDisplay = document.getElementById('final-time');
  const finalMovesDisplay = document.getElementById('final-moves');
  const ratingStars = document.getElementById('rating-stars');
  const ratingText = document.getElementById('rating-text');
  const alertContainer = document.getElementById('alert-container');
  const copyScoreBtn = document.getElementById('copy-score');
  const shareScoreBtn = document.getElementById('share-score');
  const memoryAchievement = document.getElementById('memory-achievement');
  const achievementName = document.getElementById('achievement-name');
  
  // DOM Elements - Zorluk seviyeleri
  const levelButtons = document.querySelectorAll('.level-btn');
  
  // Oyun Konfigürasyonu - Zorluk seviyeleri
  const LEVELS = {
    EASY: { 
      rows: 3, 
      cols: 4, 
      pairs: 6, 
      timeLimit: 90, 
      baseScore: 100,
      hints: 3,
      cardSize: 'large'
    },
    MEDIUM: { 
      rows: 4, 
      cols: 5, 
      pairs: 10, 
      timeLimit: 180, 
      baseScore: 150,
      hints: 3,
      cardSize: 'medium'
    },
    HARD: { 
      rows: 5, 
      cols: 6, 
      pairs: 15, 
      timeLimit: 300, 
      baseScore: 200,
      hints: 2,
      cardSize: 'small'
    }
  };
  
  // Kart temaları (emojiler kategoriye göre gruplandırılmış)
  const THEMES = {
    ANIMALS: {
      name: 'Hayvanlar', 
      icon: '🦊', 
      symbols: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄', '🐙', '🦋', '🦆']
    },
    FOODS: {
      name: 'Yiyecekler', 
      icon: '🍕', 
      symbols: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🥝', '🍍', '🥥', '🥑', '🌮', '🍕', '🍦', '🍪', '🥞']
    },
    SPACE: {
      name: 'Uzay', 
      icon: '🚀', 
      symbols: ['🌞', '🌝', '🌛', '🌜', '☀️', '🌙', '⭐', '🌟', '💫', '✨', '☄️', '🌍', '🪐', '🌌', '🌠', '🚀', '👨‍🚀', '🛸']
    },
    SPORTS: {
      name: 'Sporlar', 
      icon: '⚽', 
      symbols: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '⛳', '🏊', '🏄', '🧗', '🚴', '⛷️', '🏋️']
    },
    TECH: {
      name: 'Teknoloji', 
      icon: '💻', 
      symbols: ['📱', '💻', '⌨️', '🖥️', '💾', '💿', '📷', '🔋', '🔌', '📡', '📺', '📟', '⏰', '🔍', '📱', '🎮', '🎧', '📸']
    },
    FACES: {
      name: 'Yüzler', 
      icon: '😎', 
      symbols: ['😀', '😎', '🤔', '😍', '🥳', '😮', '🙄', '😴', '🥺', '🤯', '🧐', '🤪', '😇', '🤓', '😏', '🤩', '🤗', '😉']
    }
  };
  
  // Başarımlar
  const ACHIEVEMENTS = {
    SPEED_DEMON: {
      name: 'Hız Canavarı',
      icon: '⚡',
      description: 'Oyunu rekor sürede tamamladınız!'
    },
    PERFECT_MEMORY: {
      name: 'Kusursuz Hafıza',
      icon: '🧠',
      description: 'Hiç hata yapmadan tamamladınız!'
    },
    HINT_MASTER: {
      name: 'İpucu Ustası',
      icon: '💡',
      description: 'Hiç ipucu kullanmadan bitirdiniz!'
    },
    HIGH_SCORER: {
      name: 'Puan Kralı',
      icon: '👑',
      description: 'Çok yüksek puan topladınız!'
    }
  };
  
  // Mevcut oyun seviyesi ve teması
  let currentLevel = LEVELS.MEDIUM;
  let selectedTheme = null;
  let themeSymbols = [];
  
  // Sesler
  const sounds = {
    flip: new Audio(),
    match: new Audio(),
    nomatch: new Audio(),
    win: new Audio(),
    lose: new Audio(),
    hint: new Audio(),
    click: new Audio(),
    fanfare: new Audio(),
    achievement: new Audio()
  };
  
  // Ses ayarları
  let soundEnabled = true;
  for (const key in sounds) {
    sounds[key].volume = 0.5;
  }
  
  // Oyun durum değişkenleri
  let cards = [];
  let score = 0;
  let flippedCards = [];
  let matchedPairs = 0;
  let timer;
  let timerInterval;
  let timeStarted = 0;
  let timeElapsed = 0;
  let isPaused = false;
  let isGameActive = false;
  let movesCount = 0;
  let hintsRemaining = 3;
  let lastHintTime = 0;
  let showingHint = false;
  let hintTimeout;
  let achievements = [];
  
  // Olay dinleyicileri
  startBtn.addEventListener('click', startGame);
  pauseBtn.addEventListener('click', togglePause);
  resumeBtn.addEventListener('click', togglePause);
  restartBtn.addEventListener('click', restartGame);
  hintBtn.addEventListener('click', showHint);
  soundToggle.addEventListener('click', toggleSound);
  document.getElementById('play-again').addEventListener('click', startGame);
  copyScoreBtn.addEventListener('click', copyScore);
  shareScoreBtn.addEventListener('click', shareScore);
  
  // Zorluk seviyesi butonları için olay dinleyicileri
  levelButtons.forEach(button => {
    button.addEventListener('click', function() {
      levelButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      currentLevel = LEVELS[this.dataset.level];
    });
  });
  
  // Duyarlı boyutlandırma - pencere boyutu değiştiğinde kart boyutlarını yeniden hesapla
  window.addEventListener('resize', adjustCardSize);
  
  /**
   * Oyunu başlatır
   */
  function startGame() {
    playSound('click');
    
    // Ekranları ayarla - Giriş ve oyun sonu gizle, oyun ekranını göster
    introSection.style.display = 'none';
    gameContainer.style.display = 'block';
    gameOverContainer.style.display = 'none';
    pauseOverlay.style.display = 'none';
    
    // Oyun durumunu sıfırla
    resetGameState();
    
    // Kart destesini oluştur ve temayı seç
    selectRandomTheme();
    createCardDeck();
    
    // Kart boyutlarını ayarla ve kartları oluştur
    renderCards();
    adjustCardSize();
    
    // Tema göstergesini güncelle
    updateThemeIndicator();
    
    // İpucu sayısını güncelle
    hintsRemaining = currentLevel.hints;
    updateHintCounter();
    
    // Ekranları güncelle
    updateScoreDisplay();
    updateMovesDisplay();
    updateProgressDisplay();
    
    // Zamanlayıcıyı başlat
    timeStarted = Date.now();
    timeElapsed = 0;
    
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(updateTimer, 1000);
    updateTimerDisplay(currentLevel.timeLimit);
  }
  
  /**
   * Oyun durumunu sıfırlar
   */
  function resetGameState() {
    cards = [];
    score = currentLevel.baseScore;
    flippedCards = [];
    matchedPairs = 0;
    movesCount = 0;
    hintsRemaining = currentLevel.hints;
    timeElapsed = 0;
    lastHintTime = 0;
    isGameActive = true;
    isPaused = false;
    showingHint = false;
    achievements = [];
    
    if (hintTimeout) {
      clearTimeout(hintTimeout);
    }
  }
  
  /**
   * Oyunu yeniden başlatır
   */
  function restartGame() {
    if (isPaused) {
      togglePause(); // Duraklatmayı kapat
    }
    startGame(); // Yeni oyun başlat
  }
  
  /**
   * Rastgele bir tema seçer
   */
  function selectRandomTheme() {
    const themeKeys = Object.keys(THEMES);
    const randomThemeKey = themeKeys[Math.floor(Math.random() * themeKeys.length)];
    selectedTheme = THEMES[randomThemeKey];
    themeSymbols = shuffleArray([...selectedTheme.symbols]);
  }
  
  /**
   * Tema göstergesini günceller
   */
  function updateThemeIndicator() {
    const themeIcon = selectedTheme.icon;
    const themeName = selectedTheme.name;
    
    themeIndicator.innerHTML = `
      <span class="theme-icon">${themeIcon}</span>
      <span class="theme-name">${themeName}</span>
    `;
  }
  
  /**
   * Kart destesini oluşturur
   */
  function createCardDeck() {
    cards = [];
    
    // Gerekli sembol sayısını al
    const neededSymbols = themeSymbols.slice(0, currentLevel.pairs);
    
    // Her sembol için iki kart oluştur
    neededSymbols.forEach(symbol => {
      cards.push(createCard(symbol));
      cards.push(createCard(symbol));
    });
    
    // Kartları karıştır
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
   * İpucu sayısını günceller
   */
  function updateHintCounter() {
    hintCounter.textContent = hintsRemaining;
    
    // Görsel olarak ipucu düğmesini devre dışı bırak eğer kalan ipucu yoksa
    if (hintsRemaining <= 0) {
      hintBtn.classList.add('disabled');
    } else {
      hintBtn.classList.remove('disabled');
    }
  }
  
  /**
   * Oyuncuya kısa bir süreliğine çift eşleşen iki kart gösterir (ipucu)
   */
  function showHint() {
    // İpucu kullanım koşulları
    if (!isGameActive || isPaused || showingHint) return;
    
    // İpucu sayısını kontrol et
    if (hintsRemaining <= 0) {
      showAlert('İpucu hakkınız kalmadı!', 'warning');
      return;
    }
    
    // Yeterli süre geçti mi kontrol et
    const now = Date.now();
    if (now - lastHintTime < 8000) { // 8 saniye bekleme süresi
      const remainingSecs = Math.ceil((8000 - (now - lastHintTime)) / 1000);
      showAlert(`İpucu için ${remainingSecs} saniye bekleyin`, 'warning');
      return;
    }
    
    // İpucu kullanımını işle
    hintsRemaining--;
    updateHintCounter();
    
    // Puan düşür
    const hintCost = 10;
    score = Math.max(0, score - hintCost);
    lastHintTime = now;
    showingHint = true;
    
    // İpucu sesi çal
    playSound('hint');
    
    // Açılmamış ve eşleşmemiş kartları bul
    const unmatchedCards = [];
    
    // Açılmamış tüm kartları diziye ekle
    cards.forEach((card, index) => {
      if (!card.isMatched && !card.isFlipped) {
        unmatchedCards.push(index);
      }
    });
    
    // Eşleşen çiftleri bul
    const pairs = findMatchingPairs(unmatchedCards);
    
    // Eğer eşleşen bir çift varsa, o çifti göster
    if (pairs.length > 0) {
      // Rastgele bir çift seç
      const randomPairIndex = Math.floor(Math.random() * pairs.length);
      const hintIndices = pairs[randomPairIndex];
      
      // Kartları göster
      hintIndices.forEach(index => {
        cards[index].isRevealed = true;
      });
      
      // Kartları tekrar oluştur
      renderCards();
      
      // Mesaj göster
      showAlert(`İpucu gösteriliyor... -${hintCost} puan`, 'info');
      
      // Belirli bir süre sonra ipucunu gizle
      hintTimeout = setTimeout(() => {
        hintIndices.forEach(index => {
          cards[index].isRevealed = false;
        });
        renderCards();
        showingHint = false;
      }, 1500);
    } else {
      // Eşleşen çift yoksa, rastgele 2 açılmamış kart göster
      if (unmatchedCards.length >= 2) {
        const shuffledCards = shuffleArray([...unmatchedCards]);
        const hintIndices = shuffledCards.slice(0, 2);
        
        // Kartları göster
        hintIndices.forEach(index => {
          cards[index].isRevealed = true;
        });
        
        // Kartları tekrar oluştur
        renderCards();
        
        // Mesaj göster
        showAlert(`İpucu gösteriliyor... -${hintCost} puan`, 'info');
        
        // Belirli bir süre sonra ipucunu gizle
        hintTimeout = setTimeout(() => {
          hintIndices.forEach(index => {
            cards[index].isRevealed = false;
          });
          renderCards();
          showingHint = false;
        }, 1500);
      } else {
        // Yeterli kart yoksa, ipucunu geri ver
        hintsRemaining++;
        updateHintCounter();
        showAlert('Gösterilecek yeterli kart kalmadı!', 'info');
      }
    }
    
    // Skoru güncelle
    updateScoreDisplay();
  }
  
  /**
   * Açılmamış kartlar arasında eşleşen çiftleri bulur
   */
  function findMatchingPairs(unmatchedCardIndices) {
    const pairs = [];
    const symbolMap = new Map();
    
    // Kartları sembollere göre grupla
    unmatchedCardIndices.forEach(index => {
      const symbol = cards[index].symbol;
      if (symbolMap.has(symbol)) {
        symbolMap.get(symbol).push(index);
      } else {
        symbolMap.set(symbol, [index]);
      }
    });
    
    // Eşleşen çiftleri bul
    symbolMap.forEach((indices, symbol) => {
      if (indices.length >= 2) {
        pairs.push(indices.slice(0, 2));
      }
    });
    
    return pairs;
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
   * Oyunu sonlandırır ve skoru hesaplar
   */
  function endGame(completed = false) {
    isGameActive = false;
    
    // Eğer zamanlayıcı aktifse durdur
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // Başlık ve başarım bölümünü ayarla
    if (completed) {
      gameResultTitle.textContent = "Tebrikler! Oyunu Tamamladınız!";
      
      // Bonus puanları hesapla
      const timeRemaining = currentLevel.timeLimit - timeElapsed;
      const timeBonus = timeRemaining * 2;
      
      // Verimlilik bonusu (daha az hamle için)
      const optimalMoves = currentLevel.pairs * 2;
      const moveRatio = optimalMoves / movesCount;
      const efficiencyBonus = Math.round(moveRatio * 50);
      
      // Zorluk seviyesi bonusu
      let difficultyBonus = 0;
      if (currentLevel === LEVELS.HARD) {
        difficultyBonus = 100;
      } else if (currentLevel === LEVELS.MEDIUM) {
        difficultyBonus = 50;
      }
      
      // Bonusları skora ekle
      score += timeBonus + efficiencyBonus + difficultyBonus;
      
      // Kazanma sesini çal
      playSound('win');
      
      // Başarımları kontrol et ve ekle
      checkAchievements();
    } else {
      gameResultTitle.textContent = "Süre Bitti! Oyun Tamamlanamadı.";
      playSound('lose');
    }
    
    // Ekranları güncelle
    finalScoreDisplay.textContent = score;
    finalTimeDisplay.textContent = formatTime(timeElapsed);
    finalMovesDisplay.textContent = movesCount;
    
    // Derecelendirmeyi hesapla ve göster
    const stars = calculateRating();
    updateRatingStarsDisplay(stars);
    
    // Oyun sonu ekranını göster
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'block';
    
    // Skoru kaydet
    if (completed) {
      window.saveScore('memoryMatch', score);
    }
  }
  
  /**
   * Başarımları kontrol eder ve kazanılan başarımları ekler
   */
  function checkAchievements() {
    // Başarımlar listesini temizle
    achievements = [];
    
    // Zorluk seviyesine göre ideal süre ve hamle sayısını belirle
    const idealTime = currentLevel.timeLimit * 0.4; // ideal süre toplam sürenin %40'ı
    const optimalMoves = currentLevel.pairs * 2;    // ideal hamle kartların 2 katı
    
    // Hız başarımı - Zamanın %40'ından daha hızlı tamamlama
    if (timeElapsed <= idealTime) {
      achievements.push(ACHIEVEMENTS.SPEED_DEMON);
    }
    
    // Kusursuz hafıza başarımı - Hiç yanlış hamle yapmadan tamamlama
    if (movesCount <= optimalMoves) {
      achievements.push(ACHIEVEMENTS.PERFECT_MEMORY);
    }
    
    // İpucu ustası başarımı - Hiç ipucu kullanmadan tamamlama
    if (hintsRemaining === currentLevel.hints) {
      achievements.push(ACHIEVEMENTS.HINT_MASTER);
    }
    
    // Puan kralı başarımı - Yüksek puan toplama
    const highScoreThreshold = currentLevel.baseScore * 3;
    if (score >= highScoreThreshold) {
      achievements.push(ACHIEVEMENTS.HIGH_SCORER);
    }
    
    // Eğer başarım kazanıldıysa, rastgele bir başarımı göster
    if (achievements.length > 0) {
      const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)];
      showAchievement(randomAchievement);
      
      // Eğer ses efektleri açıksa, başarım sesini çal
      playSound('achievement');
    }
  }
  
  /**
   * Başarımı gösterir
   */
  function showAchievement(achievement) {
    if (!achievement) return;
    
    // Başarım adını ve ikonu ayarla
    achievementName.textContent = `${achievement.name} - ${achievement.description}`;
    
    // Başarım göstergesini görünür yap
    memoryAchievement.style.display = 'flex';
    
    // Animasyon için önce gizli sınıfı ekle
    memoryAchievement.classList.add('achievement-reveal');
    
    // 1 saniye sonra animasyon sınıfını kaldır
    setTimeout(() => {
      memoryAchievement.classList.remove('achievement-reveal');
    }, 1000);
  }
  
  /**
   * Yıldız derecelendirmesi göstergesini günceller
   */
  function updateRatingStarsDisplay(starsCount) {
    // Tüm yıldızları boş yap
    const starElements = ratingStars.querySelectorAll('i');
    starElements.forEach(star => {
      star.className = 'far fa-star';
    });
    
    // İlgili sayıda yıldızı dolu yap
    for (let i = 0; i < starsCount; i++) {
      if (i < starElements.length) {
        starElements[i].className = 'fas fa-star';
      }
    }
    
    // Derecelendirme metnini güncelle
    const ratingTexts = {
      1: 'Acemi',
      2: 'Ortalama',
      3: 'İyi',
      4: 'Çok İyi',
      5: 'Mükemmel!'
    };
    
    ratingText.textContent = ratingTexts[starsCount] || 'İyi';
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
