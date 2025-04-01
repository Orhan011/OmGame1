/**
 * Hafıza Kartları Oyunu - v2.0
 * Modern ve interaktif kart eşleştirme oyunu
 * 
 * Özellikler:
 * - Çoklu oyun modu (Zamanlı, Hamle Sınırlı, Sınırsız)
 * - Farklı zorluk seviyeleri (Kolay, Orta, Zor)
 * - Tematik kart tasarımları
 * - Animasyonlar ve ses efektleri
 * - Skor sistemi ve yıldız derecelendirmesi
 * - Tam responsive tasarım
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elemanları
  const gamePanel = document.querySelector('.game-panel');
  const gameArea = document.getElementById('game-area');
  const memoryBoard = document.getElementById('memory-board');
  const gameOverScreen = document.getElementById('game-over-screen');
  const pauseOverlay = document.getElementById('pause-overlay');
  
  // Butonlar
  const startGameBtn = document.getElementById('start-game');
  const pauseBtn = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const restartBtn = document.getElementById('restart-btn');
  const soundBtn = document.getElementById('sound-btn');
  const exitBtn = document.getElementById('exit-btn');
  const playAgainBtn = document.getElementById('play-again-btn');
  
  // Seçim Butonları
  const modeBtns = document.querySelectorAll('.mode-btn');
  const levelBtns = document.querySelectorAll('.level-btn');
  const themeBtns = document.querySelectorAll('.theme-btn');
  
  // Bilgi Göstergeleri
  const scoreDisplay = document.getElementById('score-display');
  const timeDisplay = document.getElementById('time-display');
  const movesDisplay = document.getElementById('moves-display');
  const progressIndicator = document.getElementById('progress-indicator');
  const statusText = document.getElementById('status-text');
  
  // Sonuç Göstergeleri
  const resultIcon = document.getElementById('result-icon');
  const resultTitle = document.getElementById('result-title');
  const finalScore = document.getElementById('final-score');
  const finalTime = document.getElementById('final-time');
  const finalMoves = document.getElementById('final-moves');
  const starRating = document.querySelector('.star-rating');
  const resultMessage = document.querySelector('.result-message');
  
  // Oyun Durumu
  let gameActive = false;
  let gamePaused = false;
  let gameMode = 'timed';
  let difficulty = 'easy';
  let theme = 'animals';
  let soundEnabled = true;
  
  // Oyun Verileri
  let cards = [];
  let flippedCards = [];
  let matchedPairs = 0;
  let totalPairs = 0;
  let moves = 0;
  let score = 0;
  let currentStreak = 0;
  let timer = 0;
  let timerInterval = null;
  
  // Oyun Ayarları
  const GAME_SETTINGS = {
    timed: {
      easy: { timeLimit: 60, rows: 4, cols: 4 },
      medium: { timeLimit: 120, rows: 5, cols: 6 },
      hard: { timeLimit: 180, rows: 6, cols: 7 }
    },
    moves: {
      easy: { moveLimit: 24, rows: 4, cols: 4 },
      medium: { moveLimit: 45, rows: 5, cols: 6 },
      hard: { moveLimit: 70, rows: 6, cols: 7 }
    },
    unlimited: {
      easy: { rows: 4, cols: 4 },
      medium: { rows: 5, cols: 6 },
      hard: { rows: 6, cols: 7 }
    }
  };
  
  // Temalar
  const THEMES = {
    animals: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', 
      '🐯', '🦒', '🦓', '🦔', '🐘', '🦛', '🦏', '🐪', '🐫', '🦙', 
      '🦘', '🦥', '🦦', '🦨', '🦡', '🐿️', '🦔', '🐇', '🐀', '🐁'
    ],
    emoji: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️', 
      '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', 
      '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓'
    ],
    sports: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', 
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', 
      '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷'
    ]
  };
  
  // Ses Efektleri
  const SOUNDS = {
    flip: "card-flip.mp3",
    match: "correct.mp3",
    wrong: "wrong.mp3",
    gameOver: "game-over.mp3",
    win: "success.mp3",
    click: "click.mp3"
  };
  
  // Event Listenerları Başlat
  function initializeEventListeners() {
    // Ana Butonlar
    startGameBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    resumeBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', restartGame);
    soundBtn.addEventListener('click', toggleSound);
    exitBtn.addEventListener('click', exitGame);
    playAgainBtn.addEventListener('click', playAgain);
    
    // Oyun Modu Butonları
    modeBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        modeBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        gameMode = this.dataset.mode;
        playSound('click');
      });
    });
    
    // Zorluk Seviyesi Butonları
    levelBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        levelBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        difficulty = this.dataset.level;
        playSound('click');
      });
    });
    
    // Tema Butonları
    themeBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        themeBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        theme = this.dataset.theme;
        playSound('click');
      });
    });
    
    // Pencere Yeniden Boyutlandırma
    window.addEventListener('resize', adjustCardSize);
  }
  
  // Oyunu Başlat
  function startGame() {
    console.log("Oyun başlatıldı: ", difficulty, theme);
    
    // Oyun durumunu resetle
    resetGameState();
    
    // UI'ı güncelle
    gamePanel.style.display = 'none';
    gameArea.style.display = 'flex';
    
    // Tema sınıfını ayarla
    memoryBoard.className = 'memory-board theme-' + theme;
    
    // Kartları oluştur
    createCards();
    
    // Kart boyutlarını ayarla
    adjustCardSize();
    
    // Zamanlayıcıyı başlat
    startTimer();
    
    // Oyun başladı
    gameActive = true;
    
    // Başlangıç sesi çal
    playSound('click');
  }
  
  // Kartları Oluştur
  function createCards() {
    // Mevcut kartları temizle
    memoryBoard.innerHTML = '';
    cards = [];
    flippedCards = [];
    
    // Ayarları al
    const settings = GAME_SETTINGS[gameMode][difficulty];
    const { rows, cols } = settings;
    
    // Grid yapısını ayarla
    memoryBoard.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    memoryBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    // Kart çiftlerinin sayısını hesapla
    const pairCount = Math.floor((rows * cols) / 2);
    totalPairs = pairCount;
    
    // Seçilen temadan sembolleri al
    const symbols = THEMES[theme];
    
    // Kartlar için semboller oluştur (her sembolden 2 adet)
    let cardSymbols = [];
    for (let i = 0; i < pairCount; i++) {
      const symbol = symbols[i % symbols.length];
      cardSymbols.push(symbol, symbol);
    }
    
    // Sembolleri karıştır
    cardSymbols = shuffleArray(cardSymbols);
    
    // Kartları oluştur ve yerleştir
    for (let i = 0; i < cardSymbols.length; i++) {
      const card = createCardElement(i, cardSymbols[i]);
      memoryBoard.appendChild(card);
      
      // Kart verisini sakla
      cards.push({
        index: i,
        symbol: cardSymbols[i],
        element: card,
        isFlipped: false,
        isMatched: false
      });
    }
  }
  
  // Kart Elemanı Oluştur
  function createCardElement(index, symbol) {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.dataset.index = index;
    
    const cardFront = document.createElement('div');
    cardFront.className = 'card-front';
    
    const cardBack = document.createElement('div');
    cardBack.className = 'card-back';
    cardBack.innerHTML = symbol;
    
    card.appendChild(cardFront);
    card.appendChild(cardBack);
    
    // Tıklama olayı ekle
    card.addEventListener('click', () => handleCardClick(index));
    
    return card;
  }
  
  // Karta Tıklama İşleyicisi
  function handleCardClick(index) {
    // Oyun aktif değilse, duraklatılmışsa veya zaten çevrilmiş kartsa işlem yapma
    if (!gameActive || gamePaused) return;
    
    const card = cards[index];
    
    // Kart zaten eşleştirilmiş veya çevrilmişse veya 2 kart zaten çevrilmişse işlem yapma
    if (card.isMatched || card.isFlipped || flippedCards.length >= 2) return;
    
    // Kartı çevir
    flipCard(card);
    
    // Çevrilen kartları kontrol et
    if (flippedCards.length === 2) {
      moves++;
      updateMovesDisplay();
      checkForMatch();
    }
  }
  
  // Kartı Çevir
  function flipCard(card) {
    card.isFlipped = true;
    card.element.classList.add('flipped');
    flippedCards.push(card);
    
    // Kart çevirme sesi çal
    playSound('flip');
  }
  
  // Eşleşme Kontrolü
  function checkForMatch() {
    const [card1, card2] = flippedCards;
    
    // Zamanlama ile kontrol et (animasyon süresi için)
    setTimeout(() => {
      if (card1.symbol === card2.symbol) {
        // Eşleşme Var
        handleMatch(card1, card2);
      } else {
        // Eşleşme Yok
        handleMismatch(card1, card2);
      }
      
      // Çevrilen kartları sıfırla
      flippedCards = [];
      
      // Oyun durumunu kontrol et
      checkGameStatus();
    }, 800);
  }
  
  // Eşleşme Olduğunda
  function handleMatch(card1, card2) {
    // Kartları eşleşmiş işaretle
    card1.isMatched = true;
    card2.isMatched = true;
    
    // UI güncelle
    card1.element.classList.add('matched');
    card2.element.classList.add('matched');
    
    // Eşleşme sesi çal
    playSound('match');
    
    // Eşleşme sayısını artır
    matchedPairs++;
    
    // Seriyi artır ve puan hesapla
    currentStreak++;
    
    // Puan hesapla (temel puan + seri bonusu + zamana göre bonus)
    const basePoints = 50;
    const streakBonus = currentStreak * 10;
    let timeBonus = 0;
    
    if (gameMode === 'timed') {
      const timeLimit = GAME_SETTINGS.timed[difficulty].timeLimit;
      timeBonus = Math.max(0, Math.floor((timeLimit - timer) * 0.2));
    }
    
    const totalPoints = basePoints + streakBonus + timeBonus;
    score += totalPoints;
    
    // Puan animasyonu göster
    showPointsAnimation(card1.element, totalPoints);
    
    // Skorları güncelle
    updateScoreDisplay();
    
    // İlerleme çubuğunu güncelle
    updateProgress();
  }
  
  // Eşleşme Olmadığında
  function handleMismatch(card1, card2) {
    // Kartları salla
    card1.element.classList.add('shake');
    card2.element.classList.add('shake');
    
    // Seriyi sıfırla
    currentStreak = 0;
    
    // Hata sesi çal
    playSound('wrong');
    
    // Belirli bir süre sonra kartları geri çevir
    setTimeout(() => {
      card1.isFlipped = false;
      card2.isFlipped = false;
      card1.element.classList.remove('flipped', 'shake');
      card2.element.classList.remove('flipped', 'shake');
    }, 500);
  }
  
  // Puan Animasyonu Göster
  function showPointsAnimation(element, points) {
    const pointsEl = document.createElement('div');
    pointsEl.className = 'points-animation';
    pointsEl.textContent = `+${points}`;
    
    // Pozisyon ayarla (kart üzerinde)
    const rect = element.getBoundingClientRect();
    const boardRect = memoryBoard.getBoundingClientRect();
    
    pointsEl.style.left = `${rect.left - boardRect.left + rect.width / 2}px`;
    pointsEl.style.top = `${rect.top - boardRect.top + rect.height / 2}px`;
    
    memoryBoard.appendChild(pointsEl);
    
    // Animasyon bitince elementi kaldır
    setTimeout(() => {
      pointsEl.remove();
    }, 1000);
  }
  
  // Kart Boyutlarını Ayarla
  function adjustCardSize() {
    if (!gameActive) return;
    
    // Ayarları al
    const settings = GAME_SETTINGS[gameMode][difficulty];
    const { rows, cols } = settings;
    
    // Kart boyutlarını hesapla ve uygula
    const cardElements = document.querySelectorAll('.memory-card');
    
    if (cardElements.length === 0) return;
    
    const aspectRatio = cols / rows;
    const boardWidth = memoryBoard.clientWidth;
    const boardHeight = memoryBoard.clientHeight;
    
    let cardWidth, cardHeight;
    
    if (boardWidth / boardHeight > aspectRatio) {
      // Yükseklik sınırlayıcı ise
      cardHeight = (boardHeight / rows) * 0.9;
      cardWidth = cardHeight;
    } else {
      // Genişlik sınırlayıcı ise
      cardWidth = (boardWidth / cols) * 0.9;
      cardHeight = cardWidth;
    }
    
    // Minimum boyut sınırı
    const minSize = 50;
    cardWidth = Math.max(cardWidth, minSize);
    cardHeight = Math.max(cardHeight, minSize);
    
    cardElements.forEach(card => {
      card.style.width = `${cardWidth}px`;
      card.style.height = `${cardHeight}px`;
    });
  }
  
  // Zamanlayıcıyı Başlat
  function startTimer() {
    timer = 0;
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
      timer++;
      updateTimeDisplay();
      
      // Zamanlı modda süre kontrolü
      if (gameMode === 'timed') {
        const timeLimit = GAME_SETTINGS.timed[difficulty].timeLimit;
        
        // Zaman sınırına yaklaşıldığında uyarı
        if (timeLimit - timer <= 10 && (timeLimit - timer) % 2 === 0) {
          timeDisplay.style.color = 'red';
          setTimeout(() => { timeDisplay.style.color = ''; }, 500);
        }
        
        // Zaman dolduğunda
        if (timer >= timeLimit) {
          endGame(false);
        }
      }
      
      // Hamle sınırlı modda hamle kontrolü
      if (gameMode === 'moves') {
        const moveLimit = GAME_SETTINGS.moves[difficulty].moveLimit;
        
        if (moves >= moveLimit && flippedCards.length === 0) {
          endGame(matchedPairs === totalPairs);
        }
      }
    }, 1000);
  }
  
  // Oyun Durumunu Kontrol Et
  function checkGameStatus() {
    // Tüm kartlar eşleştirildi mi?
    if (matchedPairs === totalPairs) {
      // Kısa bir gecikme ile bitiş
      setTimeout(() => {
        endGame(true);
      }, 500);
    }
    
    // Hamle sınırlı modda hamle kontrolü
    if (gameMode === 'moves') {
      const moveLimit = GAME_SETTINGS.moves[difficulty].moveLimit;
      updateProgress((moves / moveLimit) * 100);
      
      // Son hamleyi göster
      const remainingMoves = moveLimit - moves;
      statusText.textContent = `Kalan Hamle: ${remainingMoves}`;
      
      if (remainingMoves <= 5) {
        statusText.style.color = 'red';
      } else {
        statusText.style.color = '';
      }
    }
  }
  
  // Oyunu Bitir
  function endGame(isWinner) {
    // Zamanlayıcıyı durdur
    clearInterval(timerInterval);
    
    // Oyun durumunu güncelle
    gameActive = false;
    
    // Sonuç ekranını hazırla
    prepareResultScreen(isWinner);
    
    // Sonuç ekranını göster
    gameOverScreen.classList.add('active');
    
    // Sonuç sesi çal
    if (isWinner) {
      playSound('win');
    } else {
      playSound('gameOver');
    }
    
    // Skoru kaydet
    saveScore();
  }
  
  // Sonuç Ekranını Hazırla
  function prepareResultScreen(isWinner) {
    // Sonuç başlığı ve ikonu
    if (isWinner) {
      resultTitle.textContent = 'Tebrikler!';
      resultIcon.className = 'fas fa-medal';
      resultIcon.style.color = '#FFAB00';
    } else {
      resultTitle.textContent = 'Oyun Bitti!';
      resultIcon.className = 'fas fa-hourglass-end';
      resultIcon.style.color = '#ff5252';
    }
    
    // Sonuç istatistikleri
    finalScore.textContent = score;
    finalTime.textContent = formatTime(timer);
    finalMoves.textContent = moves;
    
    // Yıldız derecelendirmesi
    updateStarRating(calculateRating());
    
    // Sonuç mesajı
    updateResultMessage(isWinner);
  }
  
  // Yıldız Derecelendirmesini Hesapla
  function calculateRating() {
    let rating = 0;
    
    // Zorluk seviyesine göre baz puanlar
    const baseScores = { 'easy': 300, 'medium': 600, 'hard': 1000 };
    const baseScore = baseScores[difficulty];
    
    // Oyun tipine göre hedef değerler
    let timeRatio = 1;
    let moveRatio = 1;
    
    if (gameMode === 'timed') {
      const timeLimit = GAME_SETTINGS.timed[difficulty].timeLimit;
      timeRatio = Math.min(1, (timeLimit - timer) / timeLimit);
    }
    
    if (gameMode === 'moves' || gameMode === 'unlimited') {
      // Optimal hamle sayısı: toplam çift sayısı * 2.5
      const optimalMoves = totalPairs * 2.5;
      moveRatio = Math.min(1, optimalMoves / Math.max(1, moves));
    }
    
    // Tüm faktörleri hesaba kat
    const overallRatio = (score / baseScore) * 0.4 + timeRatio * 0.3 + moveRatio * 0.3;
    
    // 5 üzerinden derecelendirme hesapla
    if (overallRatio >= 0.9) rating = 5;
    else if (overallRatio >= 0.75) rating = 4;
    else if (overallRatio >= 0.6) rating = 3;
    else if (overallRatio >= 0.4) rating = 2;
    else rating = 1;
    
    return rating;
  }
  
  // Yıldız Derecelendirmesini Güncelle
  function updateStarRating(rating) {
    const stars = starRating.querySelectorAll('i');
    
    for (let i = 0; i < stars.length; i++) {
      if (i < rating) {
        stars[i].className = 'fas fa-star';
      } else {
        stars[i].className = 'far fa-star';
      }
    }
  }
  
  // Sonuç Mesajını Güncelle
  function updateResultMessage(isWinner) {
    const rating = calculateRating();
    
    if (isWinner) {
      if (rating >= 4) {
        resultMessage.textContent = 'Mükemmel oyun! Hafıza gücün gerçekten etkileyici!';
      } else if (rating >= 3) {
        resultMessage.textContent = 'Harika! Kartları eşleştirmede çok başarılısın.';
      } else {
        resultMessage.textContent = 'Tebrikler! Hafızanı geliştirmeye devam et.';
      }
    } else {
      if (gameMode === 'timed') {
        resultMessage.textContent = 'Süre doldu! Bir dahaki sefere daha hızlı ol.';
      } else if (gameMode === 'moves') {
        resultMessage.textContent = 'Hamle hakkın bitti. Stratejini geliştirmeye çalış!';
      } else {
        resultMessage.textContent = 'Oyun bitti. Yeniden denemek için tekrar oyna.';
      }
    }
  }
  
  // Oyunu Yeniden Başlat
  function restartGame() {
    resetGameState();
    startGame();
  }
  
  // Tekrar Oyna
  function playAgain() {
    gameOverScreen.classList.remove('active');
    gamePanel.style.display = 'flex';
    gameArea.style.display = 'none';
  }
  
  // Duraklatmayı Aç/Kapat
  function togglePause() {
    if (!gameActive) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
      clearInterval(timerInterval);
      pauseOverlay.classList.add('active');
    } else {
      startTimer();
      pauseOverlay.classList.remove('active');
    }
    
    playSound('click');
  }
  
  // Oyundan Çık
  function exitGame() {
    pauseOverlay.classList.remove('active');
    gamePanel.style.display = 'flex';
    gameArea.style.display = 'none';
    resetGameState();
    
    playSound('click');
  }
  
  // Sesi Aç/Kapat
  function toggleSound() {
    soundEnabled = !soundEnabled;
    soundBtn.classList.toggle('active');
    
    if (soundEnabled) {
      soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      playSound('click');
    } else {
      soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
  }
  
  // Ses Çal
  function playSound(soundName) {
    if (!soundEnabled) return;
    
    try {
      // Ses dosyasının yolu
      const soundPath = `/static/sounds/${SOUNDS[soundName]}`;
      
      // Yeni ses nesnesi oluştur
      const audio = new Audio(soundPath);
      audio.volume = 0.5;
      
      // Sesi çal
      audio.play().catch(err => {
        console.log('Ses çalma hatası:', err);
      });
    } catch (error) {
      console.error('Ses çalma hatası:', error);
    }
  }
  
  // Skor Kaydet
  function saveScore() {
    // Tamamlanmamış oyunları kaydetme
    if (matchedPairs < totalPairs / 2) return;
    
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: 'memory_match',
        score: score
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Skor kaydedildi:', data);
    })
    .catch(error => {
      console.error('Skor kaydetme hatası:', error);
    });
  }
  
  // Oyun Durumunu Sıfırla
  function resetGameState() {
    gameActive = false;
    gamePaused = false;
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    score = 0;
    timer = 0;
    currentStreak = 0;
    
    clearInterval(timerInterval);
    
    updateScoreDisplay();
    updateMovesDisplay();
    updateTimeDisplay();
    updateProgress(0);
    
    statusText.textContent = 'Hazır';
    statusText.style.color = '';
  }
  
  // İlerlemeyi Güncelle
  function updateProgress(percent = null) {
    if (percent !== null) {
      progressIndicator.style.width = `${Math.min(100, percent)}%`;
      return;
    }
    
    // İlerlemeyi hesapla
    const progress = (matchedPairs / totalPairs) * 100;
    progressIndicator.style.width = `${progress}%`;
    
    // Zamanlı modda süreyi de göster
    if (gameMode === 'timed') {
      const timeLimit = GAME_SETTINGS.timed[difficulty].timeLimit;
      const timeLeft = timeLimit - timer;
      statusText.textContent = `Kalan süre: ${formatTime(timeLeft)}`;
    } else if (gameMode === 'unlimited') {
      statusText.textContent = `İlerleme: %${Math.round(progress)}`;
    }
  }
  
  // Skoru Güncelle
  function updateScoreDisplay() {
    scoreDisplay.textContent = score;
  }
  
  // Hamle Sayısını Güncelle
  function updateMovesDisplay() {
    movesDisplay.textContent = moves;
  }
  
  // Zamanı Güncelle
  function updateTimeDisplay() {
    timeDisplay.textContent = formatTime(timer);
  }
  
  // Zamanı Formatla
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Array Karıştırma
  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
  
  // Event Listenerleri ile başlat
  initializeEventListeners();
});