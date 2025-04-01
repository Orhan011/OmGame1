/**
 * Kart Eşleme Oyunu - 1.0
 * 
 * Hafıza gücünü ve görsel tanıma yeteneğini geliştiren kart eşleştirme oyunu.
 * 
 * Özellikler:
 * - Renk ve sembol temalarıyla çeşitli kartlar
 * - Artan zorluk seviyeleri
 * - Seri puan bonusları
 * - Süre takibi ve bonus puanlar
 * - Responsive tasarım
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const introSection = document.getElementById('intro-section');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const startGameBtn = document.getElementById('start-game');
  const playAgainBtn = document.getElementById('play-again');
  const pauseGameBtn = document.getElementById('pause-game');
  const resumeGameBtn = document.getElementById('resume-game');
  const restartGameBtn = document.getElementById('restart-game');
  const soundToggleBtn = document.getElementById('sound-toggle');
  const pauseOverlay = document.getElementById('pause-overlay');
  const grid = document.getElementById('memory-cards-grid');
  const difficultyButtons = document.querySelectorAll('.level-btn');
  
  // Skor göstergeleri
  const scoreDisplay = document.getElementById('score-display');
  const timerDisplay = document.getElementById('timer-display');
  const movesDisplay = document.getElementById('moves-display');
  const streakDisplay = document.getElementById('streak-display');
  const currentLevelDisplay = document.getElementById('current-level');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');
  
  // Sonuç göstergeleri
  const finalScore = document.getElementById('final-score');
  const finalMoves = document.getElementById('final-moves');
  const finalTime = document.getElementById('final-time');
  const ratingStars = document.getElementById('rating-stars');
  const ratingText = document.getElementById('rating-text');
  const gameAchievement = document.getElementById('game-achievement');
  const achievementName = document.getElementById('achievement-name');
  const gameResultTitle = document.getElementById('game-result-title');
  
  // Paylaşım düğmeleri
  const copyScoreBtn = document.getElementById('copy-score');
  const shareScoreBtn = document.getElementById('share-score');
  
  // Oyun durumu
  let gameActive = false;
  let gamePaused = false;
  let soundEnabled = true;
  let difficulty = 'EASY';
  let currentLevel = 1;
  let score = 0;
  let moves = 0;
  let streak = 0;
  let bestStreak = 0;
  let timer = 0;
  let timerInterval = null;
  let cards = [];
  let flippedCards = [];
  let matchedPairs = 0;
  let totalPairs = 0;
  
  // Oyun parametreleri
  const DIFFICULTIES = {
    EASY: {
      gridSize: { rows: 3, cols: 4 },
      totalPairs: 6,
      timeLimit: 120, // saniye
      maxLevel: 5
    },
    MEDIUM: {
      gridSize: { rows: 4, cols: 5 },
      totalPairs: 10,
      timeLimit: 180,
      maxLevel: 10
    },
    HARD: {
      gridSize: { rows: 5, cols: 6 },
      totalPairs: 15,
      timeLimit: 240,
      maxLevel: 15
    }
  };
  
  // Kart içeriği için sembol temalar
  const THEMES = [
    // Emoji teması
    [
      '🍎', '🍌', '🍇', '🍉', '🍒', '🍓', '🍑', '🍐', '🍋', '🍍',
      '🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯'
    ],
    // İkon teması
    [
      '♠️', '♥️', '♦️', '♣️', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐',
      '🎯', '🎲', '🎮', '🎸', '🎺', '🎨', '📷', '🔍', '🔑', '⏰'
    ],
    // Hayvan teması
    [
      '🐵', '🐘', '🦒', '🦓', '🦍', '🐪', '🦢', '🐢', '🐙', '🦋',
      '🦜', '🐬', '🦑', '🦞', '🐡', '🦚', '🦩', '🦔', '🐿️', '🦡'
    ]
  ];
  
  // Event Listeners
  function initEventListeners() {
    startGameBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', resetGame);
    pauseGameBtn.addEventListener('click', togglePause);
    resumeGameBtn.addEventListener('click', togglePause);
    restartGameBtn.addEventListener('click', restartGame);
    soundToggleBtn.addEventListener('click', toggleSound);
    copyScoreBtn.addEventListener('click', copyScore);
    shareScoreBtn.addEventListener('click', shareScore);
    
    // Zorluk seviyesi butonları
    difficultyButtons.forEach(button => {
      button.addEventListener('click', function() {
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        difficulty = this.dataset.level;
      });
    });
    
    // Duyarlı tasarım için pencere yeniden boyutlandırma olayı
    window.addEventListener('resize', adjustCardSize);
  }
  
  // Oyunu başlat
  function startGame() {
    gameActive = true;
    flippedCards = [];
    matchedPairs = 0;
    currentLevel = 1;
    score = 0;
    moves = 0;
    streak = 0;
    bestStreak = 0;
    
    hideIntro();
    showGameContainer();
    updateUI();
    startLevel();
  }
  
  // Seviyeyi başlat
  function startLevel() {
    clearInterval(timerInterval);
    flippedCards = [];
    matchedPairs = 0;
    
    // UI güncelleme
    currentLevelDisplay.textContent = currentLevel;
    updateProgressBar();
    
    // Yeni bir tema seç
    const themeIndex = (currentLevel - 1) % THEMES.length;
    const selectedTheme = THEMES[themeIndex];
    
    // Seviye parametrelerini al
    const params = DIFFICULTIES[difficulty];
    totalPairs = params.totalPairs;
    
    // Kartları oluştur
    createCards(selectedTheme);
    
    // Kart boyutlarını ayarla
    adjustCardSize();
    
    // Süreyi başlat
    timer = 0;
    startTimer();
  }
  
  // Kartları oluştur
  function createCards(symbols) {
    cards = [];
    grid.innerHTML = '';
    
    const params = DIFFICULTIES[difficulty];
    const { rows, cols } = params.gridSize;
    
    // CSS grid özelliklerini ayarla
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    
    // Kart sayısı
    const totalCards = rows * cols;
    // Çift sayı olmalı
    const cardCount = totalCards - (totalCards % 2);
    // Çift sayısı
    const pairCount = cardCount / 2;
    
    // Kart sembollerini hazırla
    const cardSymbols = [];
    for (let i = 0; i < pairCount; i++) {
      const symbol = symbols[i % symbols.length];
      cardSymbols.push(symbol, symbol); // Her sembolden iki adet ekle
    }
    
    // Sembolleri karıştır
    const shuffledSymbols = shuffleArray(cardSymbols);
    
    // Kartları oluştur
    for (let i = 0; i < cardCount; i++) {
      const card = document.createElement('div');
      card.className = 'memory-card';
      card.dataset.index = i;
      
      const cardInner = document.createElement('div');
      cardInner.className = 'card-inner';
      
      const cardFront = document.createElement('div');
      cardFront.className = 'card-front';
      
      const cardBack = document.createElement('div');
      cardBack.className = 'card-back';
      cardBack.innerHTML = `<span>${shuffledSymbols[i]}</span>`;
      
      cardInner.appendChild(cardFront);
      cardInner.appendChild(cardBack);
      card.appendChild(cardInner);
      
      // Tıklama olayı ekle
      card.addEventListener('click', function() {
        flipCard(this);
      });
      
      grid.appendChild(card);
      cards.push({
        element: card,
        symbol: shuffledSymbols[i],
        isFlipped: false,
        isMatched: false
      });
    }
  }
  
  // Kart çevirme
  function flipCard(cardElement) {
    if (!gameActive || gamePaused) return;
    
    const index = parseInt(cardElement.dataset.index);
    const card = cards[index];
    
    // Zaten çevrilmiş veya eşleşmiş kartları kontrol et
    if (card.isFlipped || card.isMatched || flippedCards.length >= 2) return;
    
    // Kartı çevir
    card.isFlipped = true;
    cardElement.classList.add('flipped');
    flippedCards.push(card);
    
    // Ses çal
    playSound('flip');
    
    // İki kart çevrildiyse kontrol et
    if (flippedCards.length === 2) {
      moves++;
      updateMovesDisplay();
      
      // Eşleşme kontrolü
      setTimeout(checkForMatch, 600);
    }
  }
  
  // Eşleşme kontrolü
  function checkForMatch() {
    const [card1, card2] = flippedCards;
    
    if (card1.symbol === card2.symbol) {
      // Eşleşme başarılı
      card1.isMatched = true;
      card2.isMatched = true;
      
      card1.element.classList.add('matched');
      card2.element.classList.add('matched');
      
      // Ses çal
      playSound('match');
      
      // Puanları hesapla
      streak++;
      if (streak > bestStreak) {
        bestStreak = streak;
      }
      
      const basePoints = 50;
      const streakBonus = streak > 1 ? streak * 10 : 0;
      const timeBonus = Math.max(0, 100 - timer) * 0.2;
      const pointsEarned = Math.round(basePoints + streakBonus + timeBonus);
      
      score += pointsEarned;
      matchedPairs++;
      
      // Animasyon ve UI güncelleme
      showPointsAnimation(card1.element, pointsEarned);
      updateScoreDisplay();
      updateStreakDisplay();
      
      // Tüm eşleşmeler tamamlandı mı kontrol et
      if (matchedPairs === totalPairs) {
        setTimeout(() => {
          completeLevel();
        }, 1000);
      }
    } else {
      // Eşleşme başarısız
      card1.isFlipped = false;
      card2.isFlipped = false;
      
      card1.element.classList.remove('flipped');
      card2.element.classList.remove('flipped');
      
      // Seriyi sıfırla
      streak = 0;
      
      // Ses çal
      playSound('wrong');
      
      // UI güncelle
      updateStreakDisplay();
    }
    
    // Çevrilmiş kartları temizle
    flippedCards = [];
  }
  
  // Puan animasyonu göster
  function showPointsAnimation(cardElement, points) {
    const pointsElement = document.createElement('div');
    pointsElement.className = 'points-animation';
    pointsElement.textContent = `+${points}`;
    
    const rect = cardElement.getBoundingClientRect();
    const containerRect = grid.getBoundingClientRect();
    
    // Pozisyonu ayarla
    pointsElement.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
    pointsElement.style.top = `${rect.top - containerRect.top + rect.height / 2}px`;
    
    grid.appendChild(pointsElement);
    
    // Animasyon tamamlandığında elementi kaldır
    setTimeout(() => {
      pointsElement.remove();
    }, 1000);
  }
  
  // Seviyeyi tamamla
  function completeLevel() {
    clearInterval(timerInterval);
    
    // Seri puanları ve bonus puanları hesapla
    const levelBonus = currentLevel * 100;
    const streakBonus = bestStreak * 20;
    const movesBonus = Math.max(0, 500 - (moves * 10));
    const timeBonus = Math.max(0, 300 - (timer * 2));
    
    const totalBonus = levelBonus + streakBonus + movesBonus + timeBonus;
    score += totalBonus;
    
    // Seviyeyi artır
    currentLevel++;
    
    // Bonus mesajı göster
    showAlert(`Bonus: +${totalBonus} Puan!`, 'success');
    updateScoreDisplay();
    
    // Maksimum seviyeye ulaşıldı mı kontrol et
    if (currentLevel > DIFFICULTIES[difficulty].maxLevel) {
      setTimeout(() => {
        endGame(true);
      }, 1500);
    } else {
      // Sonraki seviyeye geç
      setTimeout(() => {
        showAlert(`${currentLevel}. Seviye Başlıyor!`, 'info');
        startLevel();
      }, 1500);
    }
  }
  
  // Kart boyutunu ayarla
  function adjustCardSize() {
    if (!gameActive) return;
    
    const params = DIFFICULTIES[difficulty];
    const { rows, cols } = params.gridSize;
    
    // Kart boyutunu hesapla
    const containerWidth = grid.parentElement.offsetWidth - 30;
    const containerHeight = Math.min(window.innerHeight * 0.6, 500);
    
    const cardWidth = Math.floor(containerWidth / cols) - 10;
    const cardHeight = Math.floor(containerHeight / rows) - 10;
    
    // Kare kart için daha küçük olanı seç
    const size = Math.min(cardWidth, cardHeight);
    
    // Tüm kartlara boyut uygula
    const allCards = document.querySelectorAll('.memory-card');
    allCards.forEach(card => {
      card.style.width = `${size}px`;
      card.style.height = `${size}px`;
    });
  }
  
  // Süre işleyici
  function startTimer() {
    timer = 0;
    clearInterval(timerInterval);
    
    timerInterval = setInterval(function() {
      timer++;
      updateTimerDisplay();
      
      // Süre limiti kontrolü
      const timeLimit = DIFFICULTIES[difficulty].timeLimit;
      if (timer >= timeLimit) {
        clearInterval(timerInterval);
        endGame(false);
      }
    }, 1000);
  }
  
  // Oyunu bitir
  function endGame(completed = false) {
    gameActive = false;
    clearInterval(timerInterval);
    
    // Sonuç ekranını hazırla
    prepareResultScreen(completed);
    
    // UI güncelle
    hideGameContainer();
    showGameOverScreen();
    
    // Sonucu kaydet
    saveScore();
  }
  
  // Sonuç ekranını hazırla
  function prepareResultScreen(completed) {
    // Sonuç verilerini ata
    finalScore.textContent = score;
    finalMoves.textContent = moves;
    finalTime.textContent = formatTime(timer);
    
    // Başlığı ayarla
    if (completed) {
      gameResultTitle.textContent = 'Tebrikler! Tüm Seviyeleri Tamamladınız!';
    } else {
      gameResultTitle.textContent = 'Oyun Tamamlandı!';
    }
    
    // Yıldız derecesini hesapla
    const timeScore = Math.max(0, 1 - (timer / (DIFFICULTIES[difficulty].timeLimit)));
    const movesScore = Math.max(0, 1 - (moves / (totalPairs * 3)));
    const streakScore = bestStreak / totalPairs;
    
    const performanceScore = (timeScore * 0.3) + (movesScore * 0.4) + (streakScore * 0.3);
    
    let stars = 0;
    if (performanceScore >= 0.9) stars = 5;
    else if (performanceScore >= 0.75) stars = 4;
    else if (performanceScore >= 0.6) stars = 3;
    else if (performanceScore >= 0.4) stars = 2;
    else stars = 1;
    
    // Yıldızları göster
    updateRatingStarsDisplay(stars);
    
    // Puan değerlendirme metni
    const ratingTexts = ['Geliştirebilirsin', 'İyi', 'Harika', 'Mükemmel', 'Olağanüstü!'];
    ratingText.textContent = ratingTexts[Math.min(stars - 1, 4)];
    
    // Başarım kontrolü
    checkAchievements();
  }
  
  // Başarımları kontrol et
  function checkAchievements() {
    let achievement = null;
    
    if (score >= 5000) {
      achievement = {
        name: 'Hafıza Devi',
        description: '5000 puan sınırını aştın!'
      };
    } else if (bestStreak >= 5) {
      achievement = {
        name: 'Akıcı Hafıza',
        description: '5 kartı art arda eşleştirdin!'
      };
    } else if (currentLevel >= 5) {
      achievement = {
        name: 'Seviye Ustası',
        description: '5. seviyeye ulaştın!'
      };
    }
    
    if (achievement) {
      showAchievement(achievement);
    } else {
      gameAchievement.style.display = 'none';
    }
  }
  
  // Başarımı göster
  function showAchievement(achievement) {
    achievementName.textContent = achievement.name;
    gameAchievement.style.display = 'flex';
  }
  
  // Yıldız derecelendirmesini güncelle
  function updateRatingStarsDisplay(starsCount) {
    const stars = ratingStars.querySelectorAll('i');
    
    for (let i = 0; i < stars.length; i++) {
      if (i < starsCount) {
        stars[i].className = 'fas fa-star';
      } else {
        stars[i].className = 'far fa-star';
      }
    }
  }
  
  // Skoru kaydet
  function saveScore() {
    if (score <= 0) return;
    
    // Oyun türü için backend'de tanımlı ID
    const gameType = 'memoryCards';
    
    fetch('/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: gameType,
        score: score
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Score saved:', data);
    })
    .catch(error => {
      console.error('Error saving score:', error);
    });
  }
  
  // Skoru kopyala
  function copyScore() {
    const scoreText = `Kart Eşleme oyununda ${score} puan kazandım! Seviye: ${currentLevel - 1}, Hamle: ${moves}, Süre: ${formatTime(timer)}`;
    
    navigator.clipboard.writeText(scoreText)
      .then(() => {
        showAlert('Skor kopyalandı!', 'success');
      })
      .catch(() => {
        showAlert('Kopyalama başarısız oldu', 'error');
      });
  }
  
  // Skoru paylaş
  function shareScore() {
    const scoreText = `Kart Eşleme oyununda ${score} puan kazandım! Seviye: ${currentLevel - 1}, Hamle: ${moves}, Süre: ${formatTime(timer)}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'OmGame Skorumu Paylaş',
        text: scoreText,
      })
      .catch((error) => console.log('Sharing failed', error));
    } else {
      copyScore();
    }
  }
  
  // Oyunu sıfırla
  function resetGame() {
    // Oyunu tekrar başlat
    hideGameOverScreen();
    startGame();
  }
  
  // Oyunu yeniden başlat
  function restartGame() {
    clearInterval(timerInterval);
    
    // Pause menüsünü kapat
    pauseOverlay.style.display = 'none';
    gamePaused = false;
    
    // Yeniden başlat
    startGame();
  }
  
  // Duraklatma durumunu değiştir
  function togglePause() {
    if (!gameActive) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
      clearInterval(timerInterval);
      pauseOverlay.style.display = 'flex';
    } else {
      pauseOverlay.style.display = 'none';
      startTimer();
    }
  }
  
  // Sesi açıp kapat
  function toggleSound() {
    soundEnabled = !soundEnabled;
    
    if (soundEnabled) {
      soundToggleBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      soundToggleBtn.classList.add('active');
    } else {
      soundToggleBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
      soundToggleBtn.classList.remove('active');
    }
  }
  
  // Ses çal
  function playSound(soundName) {
    if (!soundEnabled) return;
    
    const sounds = {
      flip: new Audio('/static/sounds/card-flip.mp3'),
      match: new Audio('/static/sounds/match.mp3'),
      wrong: new Audio('/static/sounds/wrong.mp3'),
      levelUp: new Audio('/static/sounds/level-up.mp3'),
      gameOver: new Audio('/static/sounds/game-over.mp3')
    };
    
    if (sounds[soundName]) {
      sounds[soundName].volume = 0.5;
      sounds[soundName].play().catch(e => console.log('Sound play error:', e));
    }
  }
  
  // Bildirim göster
  function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
      alert.style.opacity = '0';
      setTimeout(() => {
        alert.remove();
      }, 300);
    }, 2000);
  }
  
  // İlerleme çubuğunu güncelle
  function updateProgressBar() {
    const maxLevel = DIFFICULTIES[difficulty].maxLevel;
    const progress = ((currentLevel - 1) / maxLevel) * 100;
    
    progressBar.style.width = `${progress}%`;
    progressPercent.textContent = `${Math.round(progress)}%`;
  }
  
  // Zaman göstergesini güncelle
  function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timer);
  }
  
  // Hamle göstergesini güncelle
  function updateMovesDisplay() {
    movesDisplay.textContent = moves;
  }
  
  // Seri göstergesini güncelle
  function updateStreakDisplay() {
    streakDisplay.textContent = streak;
  }
  
  // Skor göstergesini güncelle
  function updateScoreDisplay() {
    scoreDisplay.textContent = score;
  }
  
  // UI güncelle
  function updateUI() {
    updateScoreDisplay();
    updateMovesDisplay();
    updateTimerDisplay();
    updateStreakDisplay();
  }
  
  // Zamanı formatlı göster
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  
  // UI yardımcı fonksiyonlar
  function hideIntro() {
    introSection.style.display = 'none';
  }
  
  function showGameContainer() {
    gameContainer.style.display = 'block';
  }
  
  function hideGameContainer() {
    gameContainer.style.display = 'none';
  }
  
  function showGameOverScreen() {
    gameOverContainer.style.display = 'block';
  }
  
  function hideGameOverScreen() {
    gameOverContainer.style.display = 'none';
  }
  
  // Array yardımcı fonksiyonları
  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
  
  // CSS Stilleri Ekle
  function addStyles() {
    if (!document.getElementById('memory-cards-styles')) {
      const styles = document.createElement('style');
      styles.id = 'memory-cards-styles';
      styles.textContent = `
        .memory-cards-grid {
          display: grid;
          grid-gap: 10px;
          margin: 0 auto;
          justify-content: center;
        }
        
        .memory-card {
          width: 80px;
          height: 80px;
          perspective: 1000px;
          cursor: pointer;
          margin: 5px;
        }
        
        .card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.6s;
          transform-style: preserve-3d;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          border-radius: 10px;
        }
        
        .memory-card.flipped .card-inner {
          transform: rotateY(180deg);
        }
        
        .memory-card.matched .card-inner {
          transform: rotateY(180deg);
          box-shadow: 0 0 10px rgba(92, 184, 92, 0.8);
        }
        
        .card-front, .card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .card-front {
          background: linear-gradient(135deg, rgba(33, 33, 61, 0.9), rgba(15, 15, 30, 0.9));
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 2rem;
        }
        
        .card-front::after {
          content: "?";
          font-family: "Poppins", sans-serif;
          font-size: 1.8rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.3);
        }
        
        .card-back {
          background: linear-gradient(135deg, rgba(106, 90, 224, 0.9), rgba(90, 103, 216, 0.9));
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          transform: rotateY(180deg);
        }
        
        .card-back span {
          font-size: 2rem;
        }
        
        @media (max-width: 576px) {
          .memory-card {
            width: 60px;
            height: 60px;
          }
          
          .card-front::after {
            font-size: 1.4rem;
          }
          
          .card-back span {
            font-size: 1.6rem;
          }
        }
      `;
      document.head.appendChild(styles);
    }
  }
  
  // Oyunu başlat
  initEventListeners();
  addStyles();
});