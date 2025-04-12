/**
 * Örüntü Tanıma Oyunu - 3.0
 * 
 * Tamamen sıfırdan tasarlanmış profesyonel, şık ve modern bir örüntü tanıma oyunu.
 * 
 * Özellikler:
 * - Gelişmiş görsel tasarım ve animasyonlar
 * - Çeşitli örüntü türleri ve zorluk seviyeleri
 * - Kombo sistemi ile puan çarpanları
 * - Başarımlar ve seviye sistemi
 * - Tüm cihazlara uyumlu tasarım
 * - Ses efektleri ve yüksek kaliteli kullanıcı deneyimi
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri - Ana Kontroller
  const startGameBtn = document.getElementById('start-game');
  const welcomeStartBtn = document.getElementById('welcome-start');
  const restartGameBtn = document.getElementById('restart-game');
  const toggleSoundBtn = document.getElementById('toggle-sound');
  const shareScoreBtn = document.getElementById('share-score');
  
  // DOM Elementleri - Oyun Alanları
  const welcomeScreen = document.getElementById('pattern-welcome');
  const gameBoard = document.getElementById('pattern-game-board');
  const gameOverScreen = document.getElementById('game-over');
  
  // DOM Elementleri - İstatistikler ve Göstergeler
  const scoreDisplay = document.getElementById('score');
  const timerDisplay = document.getElementById('timer');
  const levelDisplay = document.getElementById('level');
  const comboDisplay = document.getElementById('combo');
  const streakIndicator = document.getElementById('streak-indicator');
  const streakCount = streakIndicator.querySelector('.streak-count');
  
  // DOM Elementleri - Oyun Sonu Ekranı
  const resultTitle = document.getElementById('result-title');
  const finalScoreDisplay = document.getElementById('final-score');
  const correctAnswersDisplay = document.getElementById('correct-answers');
  const wrongAnswersDisplay = document.getElementById('wrong-answers');
  const maxLevelDisplay = document.getElementById('max-level');
  const achievementSection = document.getElementById('achievement-section');
  const ratingStars = document.getElementById('rating-stars');
  const ratingText = document.getElementById('rating-text');
  
  // DOM Elementleri - Örüntü ve Seçenekler
  const patternSequence = document.getElementById('pattern-sequence');
  const optionsGrid = document.getElementById('options-grid');
  const feedbackArea = document.getElementById('feedback-area');
  const currentPatternTypeDisplay = document.getElementById('current-pattern-type');
  const currentDifficultyDisplay = document.getElementById('current-difficulty');
  const notificationsContainer = document.getElementById('notifications-container');
  
  // Mod ve Zorluk Seçimi Butonları
  const patternTypeButtons = document.querySelectorAll('.pattern-type-btn');
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');
  
  // Ses Efektleri
  const sounds = {
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    levelUp: new Audio('/static/sounds/level-up.mp3'),
    click: new Audio('/static/sounds/click.mp3'),
    gameOver: new Audio('/static/sounds/game-over.mp3'),
    achievement: new Audio('/static/sounds/achievement.mp3'),
    combo: new Audio('/static/sounds/combo.mp3'),
    hint: new Audio('/static/sounds/hint.mp3'),
    tick: new Audio('/static/sounds/tick.mp3')
  };
  
  // Tüm ses efektlerini yükle
  for (const sound in sounds) {
    sounds[sound].load();
    sounds[sound].volume = 0.7;
  }
  
  // Oyun Durumu
  let gameState = {
    isActive: false,
    isPaused: false,
    isSoundEnabled: true,
    score: 0, // Puan gösterimi kaldırıldı
    level: 1,
    maxLevel: 1,
    timeRemaining: 120,
    timerInterval: null,
    currentPattern: [],
    selectedPatternType: 'symbols',
    selectedDifficulty: 'easy',
    correctAnswer: null,
    correctAnswers: 0,
    wrongAnswers: 0,
    streak: 0,
    maxStreak: 0,
    comboMultiplier: 1,
    responseTime: 0,
    startTime: 0,
    achievements: new Set(),
    patternLengthBase: 4
  };
  
  // Zorluk Seviyesi Ayarları
  const difficultySettings = {
    easy: { 
      baseTime: 120, 
      timePerLevel: 5,
      patternLength: 4, 
      optionsCount: 4, 
      scoreMultiplier: 1.0,
      name: 'Kolay'
    },
    medium: { 
      baseTime: 100, 
      timePerLevel: 4,
      patternLength: 5, 
      optionsCount: 5, 
      scoreMultiplier: 1.5,
      name: 'Orta'
    },
    hard: { 
      baseTime: 80, 
      timePerLevel: 3,
      patternLength: 6, 
      optionsCount: 6, 
      scoreMultiplier: 2.0,
      name: 'Zor'
    }
  };
  
  // Örüntü Türleri
  const patternTypes = {
    symbols: {
      name: 'Semboller',
      icon: 'shapes',
      values: ['▲', '■', '●', '◆', '★', '♦', '♥', '♠', '♣', '⬟', '◐', '◧'],
      colorClass: 'pattern-symbols'
    },
    numbers: {
      name: 'Sayılar',
      icon: 'sort-numeric-up',
      values: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      colorClass: 'pattern-numbers'
    },
    colors: {
      name: 'Renkler',
      icon: 'palette',
      values: ['#FF5252', '#FF7043', '#FFCA28', '#66BB6A', '#42A5F5', '#5C6BC0', '#AB47BC', '#8D6E63', '#78909C', '#26A69A'],
      displayNames: ['Kırmızı', 'Turuncu', 'Sarı', 'Yeşil', 'Mavi', 'Lacivert', 'Mor', 'Kahverengi', 'Gri', 'Turkuaz'],
      colorClass: 'pattern-colors'
    },
    mixed: {
      name: 'Karışık',
      icon: 'random',
      values: ['▲', '2', '●', '5', '★', '7', '♥', '0', '♣', '3', '◐', '8'],
      colorClass: 'pattern-mixed'
    }
  };
  
  // Örüntü Stratejileri
  const patternStrategies = {
    repetition: {
      name: 'Tekrarlı',
      generate: createRepetitionPattern,
      weight: { easy: 0.4, medium: 0.3, hard: 0.2 },
      minLevel: 1
    },
    arithmetic: {
      name: 'Aritmetik',
      generate: createArithmeticPattern,
      weight: { easy: 0.3, medium: 0.3, hard: 0.2 },
      minLevel: 1
    },
    mirror: {
      name: 'Aynalama',
      generate: createMirrorPattern,
      weight: { easy: 0.2, medium: 0.2, hard: 0.3 },
      minLevel: 2
    },
    fibonacci: {
      name: 'Fibonacci',
      generate: createFibonacciPattern,
      weight: { easy: 0.1, medium: 0.2, hard: 0.3 },
      minLevel: 3
    },
    random: {
      name: 'Rastgele',
      generate: createRandomPattern,
      weight: { easy: 0.1, medium: 0.1, hard: 0.1 },
      minLevel: 1
    }
  };
  
  // Başarımlar
  const ACHIEVEMENTS = {
    QUICK_THINKER: {
      id: 'quick-thinker',
      name: 'Hızlı Düşünür',
      description: 'Bir örüntüyü 2 saniyeden az sürede çözdünüz.',
      icon: 'bolt',
      condition: () => gameState.responseTime < 2000
    },
    PATTERN_MASTER: {
      id: 'pattern-master',
      name: 'Örüntü Ustası',
      description: '5 ardışık doğru cevap verdiniz.',
      icon: 'brain',
      condition: () => gameState.streak >= 5
    },
    COMBO_KING: {
      id: 'combo-king',
      name: 'Kombo Kralı',
      description: '3x kombo çarpanına ulaştınız.',
      icon: 'fire',
      condition: () => gameState.comboMultiplier >= 3
    },
    LEVEL_MASTER: {
      id: 'level-master',
      name: 'Seviye Ustası',
      description: 'Seviye 5\'e ulaştınız.',
      icon: 'trophy',
      condition: () => gameState.level >= 5
    },
    PERFECT_ROUND: {
      id: 'perfect-round',
      name: 'Mükemmel Tur',
      description: 'Zorlu bir seviyeyi hiç hata yapmadan tamamladınız.',
      icon: 'crown',
      condition: () => gameState.level >= 3 && gameState.wrongAnswers === 0 && gameState.correctAnswers >= 10
    },
    HIGH_SCORER: {
      id: 'high-scorer',
      name: 'Puan Rekortmeni',
      description: '500+ puan topladınız.',
      icon: 'medal',
      condition: () => gameState.score >= 500
    }
  };
  
  // Olay Dinleyicileri
  startGameBtn.addEventListener('click', toggleGame);
  welcomeStartBtn.addEventListener('click', startGame);
  restartGameBtn.addEventListener('click', restartGame);
  toggleSoundBtn.addEventListener('click', toggleSound);
  shareScoreBtn.addEventListener('click', shareScore);
  
  // Örüntü türü seçimi için olay dinleyicileri
  patternTypeButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (gameState.isActive) return; // Oyun sırasında değiştirmeyi engelle
      
      // UI güncelle
      patternTypeButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Seçilen örüntü türünü kaydet
      gameState.selectedPatternType = this.getAttribute('data-mode');
      
      // Ses çal
      playSound('click');
    });
  });
  
  // Zorluk seviyesi seçimi için olay dinleyicileri
  difficultyButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (gameState.isActive) return; // Oyun sırasında değiştirmeyi engelle
      
      // UI güncelle
      difficultyButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Seçilen zorluğu kaydet
      gameState.selectedDifficulty = this.getAttribute('data-level');
      
      // Ses çal
      playSound('click');
    });
  });
  
  // Oyunu başlat/durdur
  function toggleGame() {
    if (!gameState.isActive) {
      startGame();
    } else {
      pauseGame();
    }
  }
  
  // Oyunu başlat
  function startGame() {
    // Oyun durumunu sıfırla
    resetGameState();
    
    // UI güncelle
    updateUI();
    
    // Ekranları ayarla
    welcomeScreen.classList.remove('active');
    gameBoard.style.display = 'flex';
    gameOverScreen.style.display = 'none';
    
    // Başlat butonunu güncelle
    startGameBtn.innerHTML = `
      <span class="button-icon"><i class="fas fa-pause"></i></span>
      <span class="button-text">Duraklat</span>
    `;
    
    // Mevcut örüntü türü ve zorluk bilgilerini göster
    updateGameTypeDisplay();
    
    // İlk örüntüyü oluştur
    generatePattern();
    
    // Zamanlayıcıyı başlat
    gameState.timerInterval = setInterval(updateTimer, 1000);
    
    // Yükleme animasyonu
    startGameBtn.classList.add('loading');
    setTimeout(() => {
      startGameBtn.classList.remove('loading');
    }, 400);
    
    // Ses çal
    playSound('click');
    
    // Başlangıç bildirimi
    showNotification('Oyun başladı! Örüntüleri çözün.', 'info');
  }
  
  // Oyunu duraklat
  function pauseGame() {
    if (!gameState.isActive) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
      // Zamanlayıcıyı durdur
      clearInterval(gameState.timerInterval);
      
      // Buton metnini güncelle
      startGameBtn.innerHTML = `
        <span class="button-icon"><i class="fas fa-play"></i></span>
        <span class="button-text">Devam Et</span>
      `;
      
      // Oyun alanına duraklatma katmanı ekle
      const pauseOverlay = document.createElement('div');
      pauseOverlay.className = 'pause-overlay';
      pauseOverlay.innerHTML = `
        <div class="pause-content">
          <div class="pause-icon"><i class="fas fa-pause"></i></div>
          <h3>Oyun Duraklatıldı</h3>
          <p>Devam etmek için "Devam Et" düğmesine tıklayın</p>
        </div>
      `;
      gameBoard.appendChild(pauseOverlay);
      
      // Bildiri göster
      showNotification('Oyun duraklatıldı', 'info');
    } else {
      // Zamanlayıcıyı tekrar başlat
      gameState.timerInterval = setInterval(updateTimer, 1000);
      
      // Buton metnini güncelle
      startGameBtn.innerHTML = `
        <span class="button-icon"><i class="fas fa-pause"></i></span>
        <span class="button-text">Duraklat</span>
      `;
      
      // Duraklatma katmanını kaldır
      const pauseOverlay = document.querySelector('.pause-overlay');
      if (pauseOverlay) {
        gameBoard.removeChild(pauseOverlay);
      }
      
      // Bildiri göster
      showNotification('Oyun devam ediyor', 'info');
    }
    
    // Ses çal
    playSound('click');
  }
  
  // Oyunu yeniden başlat
  function restartGame() {
    // Oyun durumunu sıfırla
    resetGameState();
    
    // Ekranları ayarla
    gameOverScreen.style.display = 'none';
    welcomeScreen.classList.add('active');
    
    // Ses çal
    playSound('click');
  }
  
  // Ses açma/kapama
  function toggleSound() {
    gameState.isSoundEnabled = !gameState.isSoundEnabled;
    
    // Buton durumunu güncelle
    if (gameState.isSoundEnabled) {
      toggleSoundBtn.classList.add('active');
      toggleSoundBtn.innerHTML = '<span class="button-icon"><i class="fas fa-volume-up"></i></span>';
      showNotification('Ses açıldı', 'info');
    } else {
      toggleSoundBtn.classList.remove('active');
      toggleSoundBtn.innerHTML = '<span class="button-icon"><i class="fas fa-volume-mute"></i></span>';
      showNotification('Ses kapatıldı', 'info');
    }
    
    // İlk sese erişimi engelle, sadece durum bilgisini güncelle
    if (gameState.isActive) {
      playSound('click');
    }
  }
  
  // Skoru paylaş
  function shareScore() {
    const scoreText = `Örüntü Tanıma oyununda ${gameState.score} puan topladım! Seviye ${gameState.maxLevel}'e ulaştım. ${gameState.correctAnswers} doğru, ${gameState.wrongAnswers} yanlış cevap verdim.`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Örüntü Tanıma Oyunu Skorum',
        text: scoreText
      }).then(() => {
        showNotification('Skor başarıyla paylaşıldı!', 'success');
      }).catch(err => {
        copyToClipboard(scoreText);
      });
    } else {
      copyToClipboard(scoreText);
    }
    
    // Ses çal
    playSound('click');
  }
  
  // Panoya kopyalama yardımcı fonksiyonu
  function copyToClipboard(text) {
    try {
      navigator.clipboard.writeText(text).then(() => {
        showNotification('Skor panoya kopyalandı!', 'success');
      }).catch(() => {
        showNotification('Kopyalama işlemi başarısız oldu.', 'error');
      });
    } catch (err) {
      showNotification('Kopyalama işlemi başarısız oldu.', 'error');
    }
  }
  
  // Oyun durumunu sıfırlama
  function resetGameState() {
    // Oyun ayarlarını başlangıç değerlerine sıfırla
    gameState.isActive = true;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.level = 1;
    gameState.maxLevel = 1;
    gameState.correctAnswers = 0;
    gameState.wrongAnswers = 0;
    gameState.streak = 0;
    gameState.maxStreak = 0;
    gameState.comboMultiplier = 1;
    gameState.timeRemaining = difficultySettings[gameState.selectedDifficulty].baseTime;
    gameState.patternLengthBase = difficultySettings[gameState.selectedDifficulty].patternLength;
    
    // Zamanlayıcıyı temizle
    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
      gameState.timerInterval = null;
    }
    
    // Başarımları sıfırla
    gameState.achievements = new Set();
    
    // UI'yı güncelle
    updateUI();
  }
  
  // Zamanlayıcıyı güncelle
  function updateTimer() {
    if (gameState.isPaused) return;
    
    gameState.timeRemaining--;
    
    // Zamanı güncelle
    updateTimerDisplay();
    
    // Son 10 saniye için uyarı
    if (gameState.timeRemaining <= 10) {
      timerDisplay.classList.add('warning');
      
      // Tik sesi
      if (gameState.timeRemaining > 0) {
        playSound('tick');
      }
    }
    
    // Süre doldu mu kontrol et
    if (gameState.timeRemaining <= 0) {
      endGame(false);
    }
  }
  
  // Bir örüntü oluştur
  function generatePattern() {
    // Örüntü dizisini temizle
    patternSequence.innerHTML = '';
    gameState.currentPattern = [];
    
    // Mevcut örüntü türüne ait değerleri al
    const patternValues = patternTypes[gameState.selectedPatternType].values;
    
    // Zamanı kaydet (cevap verme süresini ölçmek için)
    gameState.startTime = Date.now();
    
    // Örüntü uzunluğunu hesapla (seviye arttıkça artar)
    const baseLength = gameState.patternLengthBase;
    const additionalLength = Math.min(Math.floor(gameState.level / 3), 3);
    const patternLength = baseLength + additionalLength;
    
    // Örüntü oluşturma stratejisini seç
    const strategy = selectPatternStrategy();
    
    // Seçilen stratejiye göre örüntü oluştur
    patternStrategies[strategy].generate(patternValues, patternLength);
    
    // Doğru cevabı belirle
    gameState.correctAnswer = calculateNextInSequence(patternValues);
    
    // Örüntüyü görsel olarak göster
    displayPattern();
    
    // Seçenekleri oluştur
    createOptions(patternValues);
  }
  
  // Seviye ve zorluğa göre strateji seçimi
  function selectPatternStrategy() {
    // Kullanılabilir stratejileri filtrele (seviyeye göre)
    const availableStrategies = Object.keys(patternStrategies).filter(
      strategy => gameState.level >= patternStrategies[strategy].minLevel
    );
    
    // Ağırlıklı seçim yap
    const totalWeight = availableStrategies.reduce((sum, strategy) => {
      return sum + (patternStrategies[strategy].weight[gameState.selectedDifficulty] || 0);
    }, 0);
    
    let random = Math.random() * totalWeight;
    let currentWeight = 0;
    
    for (const strategy of availableStrategies) {
      currentWeight += patternStrategies[strategy].weight[gameState.selectedDifficulty] || 0;
      if (random <= currentWeight) {
        return strategy;
      }
    }
    
    // Varsayılan olarak rastgele strateji döndür
    return 'random';
  }
  
  // Tekrarlayan örüntü oluştur
  function createRepetitionPattern(values, length) {
    // Tekrar uzunluğu (2-4 arası)
    const repeatSize = Math.min(Math.max(2, Math.floor(length / 2)), 4);
    
    // Tekrar edilecek temel örüntüyü oluştur
    const basePattern = [];
    for (let i = 0; i < repeatSize; i++) {
      const randomIndex = Math.floor(Math.random() * values.length);
      basePattern.push(values[randomIndex]);
    }
    
    // Örüntüyü tekrar ederek oluştur
    for (let i = 0; i < length; i++) {
      gameState.currentPattern.push(basePattern[i % repeatSize]);
    }
  }
  
  // Aritmetik örüntü oluştur
  function createArithmeticPattern(values, length) {
    if (gameState.selectedPatternType === 'numbers') {
      // Sayılar için artmalı/azalmalı sıra
      const start = Math.floor(Math.random() * 5);
      const step = Math.floor(Math.random() * 3) + 1;
      const isDecreasing = Math.random() < 0.5;
      
      for (let i = 0; i < length; i++) {
        const value = isDecreasing
          ? (start - i * step + 10) % 10  // Dairesel, negatif değer olmasın
          : (start + i * step) % 10;      // Dairesel, 10'u geçmesin
        gameState.currentPattern.push(values[value]);
      }
    } else {
      // Semboller/renkler için artmalı sıra
      const step = Math.floor(Math.random() * 2) + 1;
      const start = Math.floor(Math.random() * (values.length - length * step));
      
      for (let i = 0; i < length; i++) {
        const index = (start + i * step) % values.length;
        gameState.currentPattern.push(values[index]);
      }
    }
  }
  
  // Aynalama örüntüsü oluştur
  function createMirrorPattern(values, length) {
    const halfLength = Math.ceil(length / 2);
    
    // İlk yarıyı oluştur
    for (let i = 0; i < halfLength; i++) {
      const randomIndex = Math.floor(Math.random() * values.length);
      gameState.currentPattern.push(values[randomIndex]);
    }
    
    // Aynalama yöntemini belirle
    const isReversed = Math.random() < 0.5;
    
    if (isReversed) {
      // Tersten aynala
      for (let i = halfLength - 2; i >= 0 && gameState.currentPattern.length < length; i--) {
        gameState.currentPattern.push(gameState.currentPattern[i]);
      }
    } else {
      // Düz aynala
      for (let i = 0; i < halfLength && gameState.currentPattern.length < length; i++) {
        if (gameState.currentPattern.length < length) {
          gameState.currentPattern.push(gameState.currentPattern[i]);
        }
      }
    }
  }
  
  // Fibonacci benzeri örüntü oluştur
  function createFibonacciPattern(values, length) {
    if (gameState.selectedPatternType === 'numbers' || gameState.selectedPatternType === 'mixed') {
      // İlk iki değeri seç
      const a = Math.floor(Math.random() * Math.min(5, values.length));
      const b = Math.floor(Math.random() * Math.min(5, values.length));
      
      gameState.currentPattern.push(values[a]);
      if (length > 1) gameState.currentPattern.push(values[b]);
      
      // Fibonacci kuralını uygula
      for (let i = 2; i < length; i++) {
        try {
          const num1 = parseInt(gameState.currentPattern[i-2]) || 0;
          const num2 = parseInt(gameState.currentPattern[i-1]) || 0;
          const nextVal = (num1 + num2) % 10;
          gameState.currentPattern.push(values[nextVal % values.length]);
        } catch (e) {
          // Sayı çevirme hatası durumunda rastgele değer ekle
          const randomIndex = Math.floor(Math.random() * values.length);
          gameState.currentPattern.push(values[randomIndex]);
        }
      }
    } else {
      // Sayı olmayan değerler için indeks tabanlı fibonacci
      const a = Math.floor(Math.random() * values.length);
      const b = Math.floor(Math.random() * values.length);
      
      gameState.currentPattern.push(values[a]);
      if (length > 1) gameState.currentPattern.push(values[b]);
      
      for (let i = 2; i < length; i++) {
        const indexA = values.indexOf(gameState.currentPattern[i-2]);
        const indexB = values.indexOf(gameState.currentPattern[i-1]);
        const nextIndex = (indexA + indexB) % values.length;
        gameState.currentPattern.push(values[nextIndex]);
      }
    }
  }
  
  // Rastgele örüntü oluştur
  function createRandomPattern(values, length) {
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * values.length);
      gameState.currentPattern.push(values[randomIndex]);
    }
  }
  
  // Örüntüyü ekranda görüntüle
  function displayPattern() {
    patternSequence.innerHTML = '';
    patternSequence.className = `pattern-sequence ${patternTypes[gameState.selectedPatternType].colorClass}`;
    
    // Animasyon gecikmesi
    const animationDelay = 100;
    
    // Her örüntü elemanını göster
    gameState.currentPattern.forEach((item, index) => {
      const patternItem = document.createElement('div');
      patternItem.className = 'pattern-item';
      
      if (gameState.selectedPatternType === 'colors') {
        patternItem.style.backgroundColor = item;
        patternItem.setAttribute('data-color', patternTypes.colors.displayNames[patternTypes.colors.values.indexOf(item)] || '');
      } else {
        patternItem.textContent = item;
      }
      
      // Görünüm animasyonu
      setTimeout(() => {
        patternItem.classList.add('visible');
      }, index * animationDelay);
      
      // Vurgu animasyonu
      setTimeout(() => {
        patternItem.classList.add('highlight');
        setTimeout(() => {
          patternItem.classList.remove('highlight');
        }, 300);
      }, index * animationDelay + 200);
      
      patternSequence.appendChild(patternItem);
    });
  }
  
  // Seçenekleri oluştur
  function createOptions(values) {
    optionsGrid.innerHTML = '';
    
    // Zorluk seviyesine göre seçenek sayısını belirle
    const optionsCount = difficultySettings[gameState.selectedDifficulty].optionsCount;
    
    // Doğru cevabı içeren seçenekler listesi
    const options = [gameState.correctAnswer];
    
    // Diğer yanlış seçenekleri ekle
    while (options.length < optionsCount) {
      const randomValue = values[Math.floor(Math.random() * values.length)];
      if (!options.includes(randomValue)) {
        options.push(randomValue);
      }
    }
    
    // Seçenekleri karıştır
    shuffleArray(options);
    
    // Seçenek sayısına göre ızgara sütun sayısını ayarla
    optionsGrid.style.gridTemplateColumns = `repeat(${Math.min(4, optionsCount)}, 1fr)`;
    
    // Seçenekleri ekrana ekle
    options.forEach((option, index) => {
      const optionButton = document.createElement('button');
      optionButton.className = 'option-button';
      optionButton.classList.add(patternTypes[gameState.selectedPatternType].colorClass);
      
      if (gameState.selectedPatternType === 'colors') {
        optionButton.style.backgroundColor = option;
        optionButton.setAttribute('data-color', patternTypes.colors.displayNames[patternTypes.colors.values.indexOf(option)] || '');
      } else {
        optionButton.textContent = option;
      }
      
      // Tıklama olayı
      optionButton.addEventListener('click', () => {
        if (gameState.isPaused) return;
        checkAnswer(optionButton, option);
      });
      
      // Animasyonlu görünüm
      setTimeout(() => {
        optionButton.classList.add('visible');
      }, index * 50);
      
      optionsGrid.appendChild(optionButton);
    });
  }
  
  // Kullanıcının cevabını kontrol et
  function checkAnswer(optionButton, selectedAnswer) {
    // Tüm seçenekleri geçici olarak devre dışı bırak
    const allOptions = document.querySelectorAll('.option-button');
    allOptions.forEach(option => {
      option.disabled = true;
    });
    
    // Cevap süresini hesapla
    gameState.responseTime = Date.now() - gameState.startTime;
    
    // Cevabı kontrol et
    const isCorrect = selectedAnswer === gameState.correctAnswer;
    
    if (isCorrect) {
      // Doğru cevap
      optionButton.classList.add('correct');
      gameState.correctAnswers++;
      gameState.streak++;
      gameState.maxStreak = Math.max(gameState.maxStreak, gameState.streak);
      
      // Kombo çarpanını güncelle
      updateComboMultiplier();
      
      // Puan hesapla
      const basePoints = 10 * difficultySettings[gameState.selectedDifficulty].scoreMultiplier;
      const timeBonus = calculateTimeBonus();
      const comboBonus = calculateComboBonus(basePoints);
      const levelBonus = Math.max(1, gameState.level * 0.1);
      const totalPoints = Math.floor((basePoints + timeBonus + comboBonus) * levelBonus);
      
      // Puanı ekle
      gameState.score += totalPoints;
      
      // Ses çal
      if (gameState.comboMultiplier >= 2) {
        playSound('combo');
      } else {
        playSound('correct');
      }
      
      // Başarımları kontrol et
      checkAchievements();
      
      // Bildirimi göster
      showAnswerFeedback(true, totalPoints);
      
      // Seri göstergesini güncelle
      updateStreakIndicator();
      
      // Yeni seviye kontrolü
      checkLevelUp();
      
      // UI'yı güncelle
      updateUI();
      
      // Kısa bir süre bekle ve yeni örüntüye geç
      setTimeout(() => {
        if (gameState.isActive && !gameState.isPaused) {
          generatePattern();
        }
      }, 1200);
    } else {
      // Yanlış cevap
      optionButton.classList.add('wrong');
      gameState.wrongAnswers++;
      gameState.streak = 0;
      gameState.comboMultiplier = 1;
      
      // Doğru cevabı göster
      allOptions.forEach(option => {
        const optionValue = gameState.selectedPatternType === 'colors'
          ? option.style.backgroundColor
          : option.textContent;
          
        if (optionValue === gameState.correctAnswer) {
          option.classList.add('correct');
        }
      });
      
      // Ses çal
      playSound('wrong');
      
      // Bildirimi göster
      showAnswerFeedback(false);
      
      // Seri göstergesini güncelle
      updateStreakIndicator();
      
      // UI'yı güncelle
      updateUI();
      
      // Daha uzun bir süre bekle ve yeni örüntüye geç
      setTimeout(() => {
        if (gameState.isActive && !gameState.isPaused) {
          generatePattern();
        }
      }, 2000);
    }
  }
  
  // Bir sonraki elemanı hesapla (örüntü analizi)
  function calculateNextInSequence(values) {
    const pattern = gameState.currentPattern;
    const len = pattern.length;
    
    // 1. Tekrarlayan örüntüler
    for (let repeatLen = 1; repeatLen <= Math.floor(len / 2); repeatLen++) {
      let isRepeating = true;
      
      for (let i = 0; i < repeatLen && i + repeatLen < len; i++) {
        if (pattern[len - repeatLen + i] !== pattern[i]) {
          isRepeating = false;
          break;
        }
      }
      
      if (isRepeating) {
        return pattern[len % repeatLen];
      }
    }
    
    // 2. Aritmetik/artış-azalış örüntüleri (sayılar için)
    if (gameState.selectedPatternType === 'numbers' && len >= 2) {
      try {
        const lastNum = parseInt(pattern[len - 1]);
        const prevNum = parseInt(pattern[len - 2]);
        const diff = (lastNum - prevNum + 10) % 10; // Negatif olmasın diye
        const nextNum = (lastNum + diff) % 10;
        return values[nextNum];
      } catch (e) {
        // Çevirme hatası durumunda devam et
      }
    }
    
    // 3. Fibonacci benzeri örüntüler
    if ((gameState.selectedPatternType === 'numbers' || gameState.selectedPatternType === 'mixed') && len >= 2) {
      try {
        const a = parseInt(pattern[len - 2]) || 0;
        const b = parseInt(pattern[len - 1]) || 0;
        const next = (a + b) % 10;
        return values[next % values.length];
      } catch (e) {
        // Çevirme hatası durumunda devam et
      }
    }
    
    // 4. Aynalama örüntüleri
    const halfLen = Math.floor(len / 2);
    if (len >= 3) {
      // Aynalama kontrolü
      let isMirrored = true;
      for (let i = 0; i < halfLen; i++) {
        if (pattern[i] !== pattern[len - 1 - i]) {
          isMirrored = false;
          break;
        }
      }
      
      if (isMirrored) {
        return pattern[halfLen];
      }
    }
    
    // 5. İndeks tabanlı örüntüler (renkler/semboller için)
    if (len >= 3 && gameState.selectedPatternType !== 'numbers') {
      const indices = [];
      
      // İndeksleri hesapla
      for (let i = 0; i < len; i++) {
        indices.push(values.indexOf(pattern[i]));
      }
      
      // Aritmetik artış/azalış kontrolü
      let isArithmetic = true;
      const diff = (indices[1] - indices[0] + values.length) % values.length;
      
      for (let i = 2; i < indices.length; i++) {
        if ((indices[i] - indices[i-1] + values.length) % values.length !== diff) {
          isArithmetic = false;
          break;
        }
      }
      
      if (isArithmetic) {
        const nextIndex = (indices[len-1] + diff) % values.length;
        return values[nextIndex];
      }
    }
    
    // Son çare: Genel örüntü kuralı belirlenemediğinden, ilk elemanı döndür
    return pattern[0];
  }
  
  // Kombo çarpanını güncelle
  function updateComboMultiplier() {
    // Artan streak'e göre kombo çarpanını güncelle
    if (gameState.streak >= 10) {
      gameState.comboMultiplier = 3.0;
    } else if (gameState.streak >= 7) {
      gameState.comboMultiplier = 2.5;
    } else if (gameState.streak >= 5) {
      gameState.comboMultiplier = 2.0;
    } else if (gameState.streak >= 3) {
      gameState.comboMultiplier = 1.5;
    } else {
      gameState.comboMultiplier = 1.0;
    }
    
    // Kombo göstergesini güncelle
    comboDisplay.textContent = `x${gameState.comboMultiplier.toFixed(1)}`;
    
    // Kombo göstergesini vurgula
    if (gameState.comboMultiplier > 1) {
      comboDisplay.classList.add('highlight');
      setTimeout(() => {
        comboDisplay.classList.remove('highlight');
      }, 300);
    }
  }
  
  // Zaman bonusu hesapla (hızlı cevaplar için)
  function calculateTimeBonus() {
    // Maksimum cevap süresi (3 saniye)
    const maxResponseTime = 3000;
    const minBonus = 0;
    const maxBonus = 20;
    
    // Eğer yanıt süresi çok uzunsa bonus verme
    if (gameState.responseTime >= maxResponseTime) {
      return minBonus;
    }
    
    // Yanıt süresine göre doğrusal bir bonus hesapla
    const timeRatio = 1 - (gameState.responseTime / maxResponseTime);
    return Math.floor(minBonus + timeRatio * (maxBonus - minBonus));
  }
  
  // Kombo bonusu hesapla
  function calculateComboBonus(basePoints) {
    return Math.floor(basePoints * (gameState.comboMultiplier - 1));
  }
  
  // Seviye atlamalı mı kontrol et
  function checkLevelUp() {
    // Her 5 doğru cevapta seviye atla
    if (gameState.correctAnswers % 5 === 0 && gameState.correctAnswers > 0) {
      gameState.level++;
      gameState.maxLevel = Math.max(gameState.maxLevel, gameState.level);
      
      // Süre bonusu ekle
      const timeBonus = difficultySettings[gameState.selectedDifficulty].timePerLevel;
      gameState.timeRemaining += timeBonus;
      
      // Seviye atlama animasyonu
      levelDisplay.classList.add('level-up');
      setTimeout(() => {
        levelDisplay.classList.remove('level-up');
      }, 1000);
      
      // Seviye atlama sesi
      playSound('levelUp');
      
      // Seviye atlama bildirimi
      showNotification(`Seviye ${gameState.level}'e yükseldiniz! +${timeBonus} saniye bonus.`, 'level-up');
      
      // UI güncelle
      updateUI();
    }
  }
  
  // Başarımları kontrol et
  function checkAchievements() {
    // Tüm başarımları döngüyle kontrol et
    for (const achievementId in ACHIEVEMENTS) {
      const achievement = ACHIEVEMENTS[achievementId];
      
      // Eğer bu başarım henüz kazanılmadıysa ve koşulları sağlanıyorsa
      if (!gameState.achievements.has(achievementId) && achievement.condition()) {
        // Başarımı ekle
        gameState.achievements.add(achievementId);
        
        // Başarım animasyonunu göster
        showAchievement(achievement);
        
        // Başarım sesini çal
        playSound('achievement');
      }
    }
  }
  
  // Başarım bildirimi göster
  function showAchievement(achievement) {
    // Başarım bildirimi oluştur
    const achievementNotification = document.createElement('div');
    achievementNotification.className = 'achievement-notification';
    
    achievementNotification.innerHTML = `
      <div class="achievement-notification-content">
        <div class="achievement-icon">
          <i class="fas fa-${achievement.icon}"></i>
        </div>
        <div class="achievement-details">
          <div class="achievement-title">Başarım Kazanıldı!</div>
          <div class="achievement-name">${achievement.name}</div>
          <div class="achievement-description">${achievement.description}</div>
        </div>
      </div>
    `;
    
    // Bildirimi ekle ve animasyonu başlat
    notificationsContainer.appendChild(achievementNotification);
    
    // Görünüm animasyonu
    setTimeout(() => {
      achievementNotification.classList.add('show');
    }, 100);
    
    // Belirli bir süre sonra kaldır
    setTimeout(() => {
      achievementNotification.classList.remove('show');
      setTimeout(() => {
        notificationsContainer.removeChild(achievementNotification);
      }, 500);
    }, 5000);
    
    // Oyun sonu ekranı için başarımı ekle
    if (!document.querySelector(`.achievement-item[data-id="${achievement.id}"]`)) {
      const achievementElement = document.createElement('div');
      achievementElement.className = 'achievement-item';
      achievementElement.dataset.id = achievement.id;
      
      achievementElement.innerHTML = `
        <div class="achievement-icon">
          <i class="fas fa-${achievement.icon}"></i>
        </div>
        <div class="achievement-info">
          <div class="achievement-name">${achievement.name}</div>
          <div class="achievement-description">${achievement.description}</div>
        </div>
      `;
      
      achievementSection.appendChild(achievementElement);
    }
  }
  
  // Cevap geri bildirimi göster
  function showAnswerFeedback(isCorrect, points = 0) {
    const feedbackElement = document.createElement('div');
    feedbackElement.className = `answer-feedback ${isCorrect ? 'correct' : 'wrong'}`;
    
    if (isCorrect) {
      feedbackElement.innerHTML = `
        <div class="feedback-icon"><i class="fas fa-check-circle"></i></div>
        <div class="feedback-text">
          <div class="feedback-title">Doğru!</div>
          <div class="feedback-points">+${points} puan</div>
        </div>
      `;
      
      if (gameState.comboMultiplier > 1) {
        feedbackElement.innerHTML += `
          <div class="feedback-combo">
            <div class="combo-multiplier">x${gameState.comboMultiplier.toFixed(1)}</div>
            <div class="combo-text">Kombo!</div>
          </div>
        `;
      }
    } else {
      feedbackElement.innerHTML = `
        <div class="feedback-icon"><i class="fas fa-times-circle"></i></div>
        <div class="feedback-text">
          <div class="feedback-title">Yanlış!</div>
          <div class="feedback-points">Kombo sıfırlandı</div>
        </div>
      `;
    }
    
    feedbackArea.appendChild(feedbackElement);
    
    // Animasyon
    setTimeout(() => {
      feedbackElement.classList.add('show');
    }, 10);
    
    // Belirli bir süre sonra kaldır
    setTimeout(() => {
      feedbackElement.classList.remove('show');
      setTimeout(() => {
        feedbackArea.removeChild(feedbackElement);
      }, 300);
    }, isCorrect ? 1000 : 1800);
  }
  
  // Bildirimi göster
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = message;
    
    notificationsContainer.appendChild(notification);
    
    // Animasyon
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Belirli bir süre sonra kaldır
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notificationsContainer.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  // Seri göstergesini güncelle
  function updateStreakIndicator() {
    streakCount.textContent = gameState.streak;
    
    // Animasyon
    if (gameState.streak > 0) {
      streakIndicator.classList.add('pulse');
      setTimeout(() => {
        streakIndicator.classList.remove('pulse');
      }, 300);
    }
    
    // Renk değiştirme
    streakIndicator.className = 'streak-indicator';
    if (gameState.streak >= 10) {
      streakIndicator.classList.add('streak-max');
    } else if (gameState.streak >= 5) {
      streakIndicator.classList.add('streak-high');
    } else if (gameState.streak >= 3) {
      streakIndicator.classList.add('streak-medium');
    }
  }
  
  // Oyun türü ve zorluk bilgisini göster
  function updateGameTypeDisplay() {
    currentPatternTypeDisplay.textContent = patternTypes[gameState.selectedPatternType].name;
    currentDifficultyDisplay.textContent = difficultySettings[gameState.selectedDifficulty].name;
  }
  
  // Oyunu sonlandır
  function endGame(isCompleted = false) {
    // Oyun durumunu güncelle
    gameState.isActive = false;
    clearInterval(gameState.timerInterval);
    
    // Oyun sonu ekranını hazırla
    finalScoreDisplay.textContent = gameState.score;
    correctAnswersDisplay.textContent = gameState.correctAnswers;
    wrongAnswersDisplay.textContent = gameState.wrongAnswers;
    maxLevelDisplay.textContent = gameState.maxLevel;
    
    // Sonuç başlığını ayarla
    if (isCompleted) {
      resultTitle.textContent = 'Tebrikler!';
    } else {
      resultTitle.textContent = 'Süre Doldu!';
    }
    
    // Performans puanını hesapla ve göster
    const performance = calculatePerformance();
    updatePerformanceRating(performance);
    
    // Oyun bitti sesini çal
    playSound('gameOver');
    
    // Oyun alanını gizle, sonuç ekranını göster
    gameBoard.style.display = 'none';
    gameOverScreen.style.display = 'flex';
    
    // Başlat butonunu sıfırla
    startGameBtn.innerHTML = `
      <span class="button-icon"><i class="fas fa-play"></i></span>
      <span class="button-text">Oyunu Başlat</span>
    `;
    
    // Skoru kaydet
    saveScore();
  }
  
  // Performans puanı hesapla
  function calculatePerformance() {
    // Toplam puan
    let performanceScore = 0;
    
    // Doğru/yanlış cevap oranı (maks 35 puan)
    const totalAnswers = gameState.correctAnswers + gameState.wrongAnswers;
    if (totalAnswers > 0) {
      const correctRatio = gameState.correctAnswers / totalAnswers;
      performanceScore += correctRatio * 35;
    }
    
    // Seviye (maks 25 puan)
    performanceScore += Math.min(25, gameState.maxLevel * 5);
    
    // Maksimum seri (maks 20 puan)
    performanceScore += Math.min(20, gameState.maxStreak * 2);
    
    // Skor (maks 20 puan)
    performanceScore += Math.min(20, gameState.score / 50);
    
    // 5 yıldız üzerinden hesapla
    return Math.min(5, Math.max(1, Math.ceil(performanceScore / 20)));
  }
  
  // Performans puanını göster
  function updatePerformanceRating(stars) {
    // Yıldızları güncelle
    const starElements = ratingStars.querySelectorAll('i');
    starElements.forEach((star, index) => {
      if (index < stars) {
        star.className = 'fas fa-star';
      } else {
        star.className = 'far fa-star';
      }
    });
    
    // Derecelendirme metnini ayarla
    const ratingLabels = {
      1: 'Acemi',
      2: 'Ortalama',
      3: 'İyi',
      4: 'Çok İyi',
      5: 'Mükemmel!'
    };
    
    ratingText.textContent = ratingLabels[stars] || 'İyi';
  }
  
  // Skoru kaydet
  function saveScore() {
    if (gameState.score > 0) {
      window.saveScore('patternRecognition', gameState.score);
    }
  }
  
  // UI güncellemeleri
  function updateUI() {
    // İstatistikleri güncelle
    scoreDisplay.textContent = gameState.score;
    timerDisplay.textContent = gameState.timeRemaining;
    levelDisplay.textContent = gameState.level;
    comboDisplay.textContent = `x${gameState.comboMultiplier.toFixed(1)}`;
    streakCount.textContent = gameState.streak;
  }
  
  // Zamanlayıcı göstergesini güncelle
  function updateTimerDisplay() {
    timerDisplay.textContent = gameState.timeRemaining;
    
    // Son 10 saniyede renk değişimi
    if (gameState.timeRemaining <= 10) {
      timerDisplay.classList.add('warning');
    } else {
      timerDisplay.classList.remove('warning');
    }
  }
  
  // Ses çalma fonksiyonu
  function playSound(soundName) {
    if (!gameState.isSoundEnabled || !sounds[soundName]) return;
    
    try {
      sounds[soundName].currentTime = 0;
      sounds[soundName].play().catch(error => {
        // Ses çalma hatalarını yok say
      });
    } catch (error) {
      // Ses çalma hatalarını yok say
    }
  }
  
  // Yardımcı fonksiyonlar
  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
  
  // İlk başlangıç
  (function initialize() {
    // Tip animasyonu için aralıklı renk değişimi
    setInterval(() => {
      document.querySelector('.tip-card').classList.toggle('highlight');
    }, 5000);
    
    // Örüntü türü ve zorluk bilgilerini güncelle
    updateGameTypeDisplay();
    
    // Karşılama ekranı buton animasyonu
    setInterval(() => {
      welcomeStartBtn.classList.toggle('pulse');
    }, 1500);
  })();
});