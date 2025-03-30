/**
 * Kim Nerede? Oyunu - 1.0
 * 
 * Mekansal hafızayı güçlendiren, nesnelerin yerlerini hatırlama oyunu.
 * 
 * Özellikler:
 * - İki aşamalı oyun: Hafızaya alma ve hatırlama
 * - Artan zorluk seviyeleri
 * - Süre sınırlaması
 * - Görsel efektler ve animasyonlar
 * - Responsive tasarım ve mobil uyumlu kontroller
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
  const grid = document.getElementById('where-is-it-grid');
  const difficultyButtons = document.querySelectorAll('.level-btn');
  const memoryPhaseMessage = document.getElementById('memory-phase-message');
  const recallPhaseMessage = document.getElementById('recall-phase-message');
  const memorizeCountdown = document.getElementById('memorize-countdown');
  
  // Skor göstergeleri
  const scoreDisplay = document.getElementById('score-display');
  const timerDisplay = document.getElementById('timer-display');
  const levelDisplay = document.getElementById('level-display');
  const correctDisplay = document.getElementById('correct-display');
  const currentLevelDisplay = document.getElementById('current-level');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');
  
  // Sonuç göstergeleri
  const finalScore = document.getElementById('final-score');
  const finalCorrect = document.getElementById('final-correct');
  const finalLevel = document.getElementById('final-level');
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
  let correctCount = 0;
  let totalItemsCount = 0;
  let timer = 0;
  let timerInterval = null;
  let currentPhase = 'memory'; // 'memory' veya 'recall'
  let memoryTimeLeft = 0;
  let countdownInterval = null;
  
  // Oyun parametreleri
  const DIFFICULTIES = {
    EASY: {
      gridSize: { width: 3, height: 3 },
      memorizeTime: 5, // saniye
      itemCount: { initial: 3, increment: 1 },
      maxLevel: 10
    },
    MEDIUM: {
      gridSize: { width: 4, height: 4 },
      memorizeTime: 4,
      itemCount: { initial: 4, increment: 1 },
      maxLevel: 15
    },
    HARD: {
      gridSize: { width: 5, height: 5 },
      memorizeTime: 3,
      itemCount: { initial: 5, increment: 2 },
      maxLevel: 20
    }
  };
  
  // Oyun için kullanılacak nesneler (Emoji sembolleri)
  const ITEM_SYMBOLS = [
    '🍎', '🍌', '🍇', '🍉', '🍒', '🍓', '🍑', '🍐', '🍋', '🍍',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁',
    '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸',
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '✈️'
  ];
  
  let gameItems = [];
  let gridCells = [];
  let userSelections = [];
  
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
    window.addEventListener('resize', adjustGridSize);
  }
  
  // Oyunu başlat
  function startGame() {
    gameActive = true;
    currentLevel = 1;
    score = 0;
    correctCount = 0;
    totalItemsCount = 0;
    
    // Kullanıcı arayüzünü güncelle
    hideIntro();
    showGameContainer();
    updateUI();
    
    // İlk seviyeyi başlat
    startLevel();
  }
  
  // Seviyeyi başlat
  function startLevel() {
    currentPhase = 'memory';
    
    // UI güncelleme
    levelDisplay.textContent = currentLevel;
    currentLevelDisplay.textContent = currentLevel;
    updateProgressBar();
    
    // Gridin boyutunu ayarla
    adjustGridSize();
    
    // Grid oluştur
    createGrid();
    
    // Nesneleri yerleştir
    placeItems();
    
    // Hafızaya alma aşaması
    memoryPhaseMessage.style.display = 'flex';
    recallPhaseMessage.style.display = 'none';
    
    // Süreyi başlat
    startMemoryPhaseCountdown();
  }
  
  // Hafızaya alma aşaması geri sayımı
  function startMemoryPhaseCountdown() {
    const params = DIFFICULTIES[difficulty];
    memoryTimeLeft = params.memorizeTime;
    
    // Sayacı göster
    memorizeCountdown.textContent = memoryTimeLeft;
    
    countdownInterval = setInterval(function() {
      memoryTimeLeft -= 1;
      memorizeCountdown.textContent = memoryTimeLeft;
      
      if (memoryTimeLeft <= 0) {
        clearInterval(countdownInterval);
        startRecallPhase();
      }
    }, 1000);
  }
  
  // Hatırlama aşamasını başlat
  function startRecallPhase() {
    currentPhase = 'recall';
    
    // UI güncelleme
    memoryPhaseMessage.style.display = 'none';
    recallPhaseMessage.style.display = 'flex';
    
    // Görev nesnelerini gizle
    hideItems();
    
    // Süreyi başlat
    startTimer();
  }
  
  // Grid oluştur
  function createGrid() {
    grid.innerHTML = '';
    gridCells = [];
    
    const params = DIFFICULTIES[difficulty];
    const { width, height } = params.gridSize;
    
    // CSS grid özelliklerini ayarla
    grid.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${height}, 1fr)`;
    
    // Hücreleri oluştur
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.x = x;
        cell.dataset.y = y;
        
        // Tıklama fonksiyonu
        cell.addEventListener('click', function() {
          if (currentPhase === 'recall' && gameActive && !gamePaused) {
            handleCellClick(this, x, y);
          }
        });
        
        grid.appendChild(cell);
        gridCells.push(cell);
      }
    }
  }
  
  // Nesneleri yerleştir
  function placeItems() {
    const params = DIFFICULTIES[difficulty];
    const { width, height } = params.gridSize;
    const itemCount = params.itemCount.initial + (currentLevel - 1) * params.itemCount.increment;
    
    // Kullanılacak sembolleri karıştır
    const shuffledSymbols = shuffleArray(ITEM_SYMBOLS.slice(0));
    
    // Tüm olası hücre pozisyonlarını oluştur
    const allPositions = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        allPositions.push({ x, y });
      }
    }
    
    // Pozisyonları karıştır
    const shuffledPositions = shuffleArray(allPositions);
    
    // Nesneleri oluştur ve yerleştir
    gameItems = [];
    for (let i = 0; i < Math.min(itemCount, shuffledPositions.length); i++) {
      const { x, y } = shuffledPositions[i];
      const symbol = shuffledSymbols[i % shuffledSymbols.length];
      
      const item = {
        x,
        y,
        symbol
      };
      
      // Nesneyi grid'e ekle
      const cellIndex = y * width + x;
      if (cellIndex < gridCells.length) {
        const cell = gridCells[cellIndex];
        cell.innerHTML = `<div class="item">${symbol}</div>`;
        cell.classList.add('has-item');
      }
      
      gameItems.push(item);
    }
    
    totalItemsCount += gameItems.length;
  }
  
  // Nesneleri gizle
  function hideItems() {
    gridCells.forEach(cell => {
      if (cell.classList.contains('has-item')) {
        cell.querySelector('.item').style.opacity = '0';
      }
    });
  }
  
  // Hücre tıklama olayı
  function handleCellClick(cell, x, y) {
    // Zaten seçilmiş hücre ise işlem yapma
    if (cell.classList.contains('selected')) {
      return;
    }
    
    // Kullanıcı seçimini kaydet
    userSelections.push({ x, y });
    
    // Hücreyi işaretle
    cell.classList.add('selected');
    
    // Doğru seçimi kontrol et
    const isCorrect = gameItems.some(item => item.x === x && item.y === y);
    
    if (isCorrect) {
      // Doğru seçim
      playSound('correct');
      cell.classList.add('correct');
      
      // Nesneyi göster
      const item = gameItems.find(item => item.x === x && item.y === y);
      cell.innerHTML = `<div class="item">${item.symbol}</div>`;
      
      // Puanı artır
      const levelBonus = currentLevel * 10;
      const timeBonus = Math.max(0, 100 - timer) * 0.5;
      const pointsEarned = Math.round(50 + levelBonus + timeBonus);
      
      score += pointsEarned;
      correctCount++;
      
      // Animasyon göster
      showPointsAnimation(cell, pointsEarned);
      
      // Bütün nesneler bulundu mu kontrol et
      if (userSelections.filter(s => gameItems.some(item => item.x === s.x && item.y === s.y)).length === gameItems.length) {
        // Seviye tamamlandı
        clearInterval(timerInterval);
        setTimeout(() => {
          completeLevel();
        }, 1000);
      }
    } else {
      // Yanlış seçim
      playSound('wrong');
      cell.classList.add('wrong');
      
      // Oyun stratejisine göre ceza verilebilir
      // Burada sadece yanlış işaretliyoruz
    }
    
    // UI güncelle
    updateUI();
  }
  
  // Seviyeyi tamamladı
  function completeLevel() {
    currentLevel++;
    
    // Maksimum seviyeye ulaşılmış mı kontrolü
    if (currentLevel > DIFFICULTIES[difficulty].maxLevel) {
      endGame(true);
      return;
    }
    
    // Bir sonraki seviyeyi başlat
    startLevel();
  }
  
  // Puan animasyonu göster
  function showPointsAnimation(cell, points) {
    const pointsElement = document.createElement('div');
    pointsElement.className = 'points-animation';
    pointsElement.textContent = `+${points}`;
    
    cell.appendChild(pointsElement);
    
    // Animasyon tamamlandığında elementi kaldır
    setTimeout(() => {
      pointsElement.remove();
    }, 1000);
  }
  
  // Süre işleyici
  function startTimer() {
    timer = 0;
    clearInterval(timerInterval);
    
    timerInterval = setInterval(function() {
      timer++;
      updateTimerDisplay();
      
      // Süre limiti kontrolü - isteğe bağlı
      const timeLimit = 120; // 2 dakika
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
    clearInterval(countdownInterval);
    
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
    finalCorrect.textContent = correctCount;
    finalLevel.textContent = currentLevel - 1;
    
    // Başlığı ayarla
    if (completed) {
      gameResultTitle.textContent = 'Tebrikler! Tüm Seviyeleri Tamamladınız!';
    } else {
      gameResultTitle.textContent = 'Oyun Tamamlandı!';
    }
    
    // Yıldız derecesini hesapla
    const maxPossibleScore = totalItemsCount * 100;
    const scoreRatio = score / maxPossibleScore;
    
    let stars = 0;
    if (scoreRatio >= 0.9) stars = 5;
    else if (scoreRatio >= 0.75) stars = 4;
    else if (scoreRatio >= 0.6) stars = 3;
    else if (scoreRatio >= 0.4) stars = 2;
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
    
    if (correctCount >= 50) {
      achievement = {
        name: 'Hafıza Ustası',
        description: '50 nesneyi doğru hatırladın!'
      };
    } else if (score >= 5000) {
      achievement = {
        name: 'Puan Avcısı',
        description: '5000 puan barajını aştın!'
      };
    } else if (currentLevel >= 10) {
      achievement = {
        name: 'Seviye Atlayıcı',
        description: '10. seviyeye ulaştın!'
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
  
  // Grid boyutunu ayarla
  function adjustGridSize() {
    const params = DIFFICULTIES[difficulty];
    const { width, height } = params.gridSize;
    
    // Cihaz boyutuna göre dinamik boyutlama
    const maxCellSize = Math.min(
      (grid.parentElement.offsetWidth - 20) / width,
      (window.innerHeight * 0.5) / height
    );
    
    // Grid hücrelerinin boyutunu ayarla
    const cellSize = Math.min(maxCellSize, 100);
    
    grid.style.gridTemplateColumns = `repeat(${width}, ${cellSize}px)`;
    grid.style.gridTemplateRows = `repeat(${height}, ${cellSize}px)`;
  }
  
  // Skoru kaydet
  function saveScore() {
    if (score <= 0) return;
    
    // Oyun türü için backend'de tanımlı ID
    const gameType = 'whereIsIt';
    
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
    const scoreText = `Kim Nerede? oyununda ${score} puan kazandım! Seviye: ${currentLevel - 1}, Doğru Sayısı: ${correctCount}`;
    
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
    const scoreText = `Kim Nerede? oyununda ${score} puan kazandım! Seviye: ${currentLevel - 1}, Doğru Sayısı: ${correctCount}`;
    
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
    clearInterval(countdownInterval);
    
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
      clearInterval(countdownInterval);
      pauseOverlay.style.display = 'flex';
    } else {
      pauseOverlay.style.display = 'none';
      
      // Mevcut aşamaya göre zamanı devam ettir
      if (currentPhase === 'memory') {
        startMemoryPhaseCountdown();
      } else if (currentPhase === 'recall') {
        startTimer();
      }
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
      correct: new Audio('/static/sounds/correct.mp3'),
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
  
  // UI güncelle
  function updateUI() {
    scoreDisplay.textContent = score;
    levelDisplay.textContent = currentLevel;
    correctDisplay.textContent = correctCount;
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
  
  // Oyunu başlat
  initEventListeners();
});