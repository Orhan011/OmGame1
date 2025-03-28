/**
 * Örüntü Tanıma Oyunu - 2.0
 * Tamamen yenilenmiş modern, duyarlı (responsive) ve profesyonel sürüm
 * 
 * Özellikler:
 * - Farklı örüntü türleri
 * - Zorluk seviyeleri
 * - Başarımlar ve ödüller
 * - Gelişmiş oyun deneyimi
 * - Tüm cihazlara uyumlu tasarım
 * - Yeni animasyonlar ve efektler
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const startBtn = document.getElementById('start-game');
  const restartBtn = document.getElementById('restart-game');
  const scoreDisplay = document.getElementById('score');
  const timerDisplay = document.getElementById('timer');
  const levelDisplay = document.getElementById('level');
  const finalScoreDisplay = document.getElementById('final-score');
  const correctAnswersDisplay = document.getElementById('correct-answers');
  const wrongAnswersDisplay = document.getElementById('wrong-answers');
  const resultTitle = document.getElementById('result-title');
  const achievementSection = document.getElementById('achievement-section');
  const patternSequence = document.getElementById('pattern-sequence');
  const optionsGrid = document.getElementById('options-grid');
  const patternFeedback = document.getElementById('pattern-feedback');
  const patternWelcome = document.getElementById('pattern-welcome');
  const patternArea = document.getElementById('pattern-area');
  const patternOptions = document.getElementById('pattern-options');
  const gameOver = document.getElementById('game-over');
  
  // Mod ve zorluk seçimi için butonlar
  const modeButtons = document.querySelectorAll('.mode-btn');
  const levelButtons = document.querySelectorAll('.level-btn');
  
  // Ses efektleri
  const sounds = {
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    levelUp: new Audio('/static/sounds/level-up.mp3'),
    gameOver: new Audio('/static/sounds/game-over.mp3'),
    tick: new Audio('/static/sounds/tick.mp3'),
    achievement: new Audio('/static/sounds/achievement.mp3')
  };
  
  // Oyun değişkenleri
  let isGameActive = false;
  let score = 0;
  let level = 1;
  let timeRemaining = 120;
  let timerInterval;
  let currentPattern = [];
  let correctAnswer = null;
  let consecutiveCorrect = 0;
  let comboMultiplier = 1;
  let correctAnswersCount = 0;
  let wrongAnswersCount = 0;
  let patternLength = 4;
  
  // Oyun ayarları
  let currentDifficulty = 'easy';
  let currentMode = 'symbols';
  let difficultySettings = {
    easy: { baseTime: 120, patternBaseLength: 3, optionsCount: 4, scoreMultiplier: 1 },
    medium: { baseTime: 100, patternBaseLength: 4, optionsCount: 5, scoreMultiplier: 1.5 },
    hard: { baseTime: 80, patternBaseLength: 5, optionsCount: 6, scoreMultiplier: 2 }
  };
  
  // Örüntü türleri
  const patternTypes = {
    symbols: {
      name: 'Semboller',
      icon: 'shapes',
      values: ['▲', '■', '●', '◆', '★', '♦', '♥', '♠', '♣', '⬟', '◐', '◧']
    },
    numbers: {
      name: 'Sayılar',
      icon: 'sort-numeric-up',
      values: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
    },
    colors: {
      name: 'Renkler',
      icon: 'palette',
      values: ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'gray', 'teal']
    },
    mixed: {
      name: 'Karışık',
      icon: 'random',
      values: ['▲', '2', '●', '5', '★', '8', '♥', '0', '♣', '3', '◐', '6']
    }
  };
  
  // Başarımlar
  const ACHIEVEMENTS = {
    PATTERN_MASTER: {
      id: 'pattern-master',
      name: 'Örüntü Ustası',
      description: '10 ardışık doğru cevap verdiniz!',
      icon: 'trophy'
    },
    SPEED_DEMON: {
      id: 'speed-demon',
      name: 'Hız Ustası',
      description: 'Zorlu bir örüntüyü 3 saniyeden kısa sürede çözdünüz!',
      icon: 'bolt'
    },
    HIGH_SCORER: {
      id: 'high-scorer',
      name: 'Puan Kralı',
      description: '500+ puan topladınız!',
      icon: 'crown'
    },
    LEVEL_MASTER: {
      id: 'level-master',
      name: 'Seviye Ustası',
      description: 'Seviye 10\'a ulaştınız!',
      icon: 'medal'
    }
  };
  
  // Olay dinleyicileri
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', resetGame);
  
  // Mod seçimi
  modeButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (isGameActive) return; // Oyun aktifse mod değiştirmeyi engelle
      
      // Aktif sınıfını güncelle
      modeButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Seçilen modu güncelle
      currentMode = this.getAttribute('data-mode');
    });
  });
  
  // Zorluk seviyesi seçimi
  levelButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (isGameActive) return; // Oyun aktifse zorluk değiştirmeyi engelle
      
      // Aktif sınıfını güncelle
      levelButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Seçilen zorluğu güncelle
      currentDifficulty = this.getAttribute('data-level');
    });
  });
  
  /**
   * Oyunu başlatır
   */
  function startGame() {
    // Eğer oyun zaten aktifse, durdur
    if (isGameActive) {
      clearInterval(timerInterval);
      isGameActive = false;
      startBtn.innerHTML = '<i class="fas fa-play me-2"></i>Başlat';
      showFeedback('Oyun durduruldu', 'info');
      return;
    }
    
    // Oyun değişkenlerini sıfırla
    score = 0;
    level = 1;
    correctAnswersCount = 0;
    wrongAnswersCount = 0;
    consecutiveCorrect = 0;
    comboMultiplier = 1;
    
    // Süreyi ayarla
    timeRemaining = difficultySettings[currentDifficulty].baseTime;
    
    // UI'ı güncelle
    updateScoreDisplay();
    updateLevelDisplay();
    updateTimerDisplay();
    
    // Hoş geldiniz ekranını gizle, oyun alanını göster
    patternWelcome.classList.remove('active');
    patternArea.style.display = 'flex';
    gameOver.style.display = 'none';
    
    // Oyunu aktif et
    isGameActive = true;
    startBtn.innerHTML = '<i class="fas fa-pause me-2"></i>Durdur';
    
    // İlk örüntüyü oluştur
    generatePattern();
    
    // Zamanlayıcıyı başlat
    timerInterval = setInterval(updateTimer, 1000);
    
    // Yükleme animasyonu efekti
    startBtn.classList.add('loading');
    setTimeout(() => {
      startBtn.classList.remove('loading');
    }, 300);
    
    // Başlangıç mesajı
    showFeedback('Oyun başladı! İyi şanslar!', 'info');
  }
  
  /**
   * Zamanlayıcıyı günceller
   */
  function updateTimer() {
    // Zamanı azalt
    timeRemaining--;
    updateTimerDisplay();
    
    // Son 10 saniye için uyarı
    if (timeRemaining <= 10) {
      timerDisplay.classList.add('text-danger', 'pulse');
      
      // Tik sesi
      playSound('tick');
    }
    
    // Süre bitti mi kontrol et
    if (timeRemaining <= 0) {
      endGame(false);
    }
  }
  
  /**
   * Görüntüleme fonksiyonları
   */
  function updateScoreDisplay() {
    scoreDisplay.textContent = score;
  }
  
  function updateLevelDisplay() {
    levelDisplay.textContent = level;
  }
  
  function updateTimerDisplay() {
    timerDisplay.textContent = timeRemaining;
  }
  
  /**
   * Bir örüntü oluşturur
   */
  function generatePattern() {
    // Örüntü dizisini temizle
    patternSequence.innerHTML = '';
    currentPattern = [];
    
    // Örüntü uzunluğunu hesapla
    patternLength = difficultySettings[currentDifficulty].patternBaseLength + Math.floor(level / 3);
    if (patternLength > 8) patternLength = 8; // Maksimum 8 eleman
    
    // Mevcut moda göre değerleri al
    const patternValues = patternTypes[currentMode].values;
    
    // Zorluk ve seviyeye göre örüntü oluşturma stratejisini belirle
    const patternStrategy = determinePatternStrategy();
    
    // Seçilen stratejiye göre örüntü oluştur
    switch (patternStrategy) {
      case 'repetition':
        createRepetitionPattern(patternValues);
        break;
      case 'arithmetic':
        createArithmeticPattern(patternValues);
        break;
      case 'fibonacci':
        createFibonacciPattern(patternValues);
        break;
      case 'mirror':
        createMirrorPattern(patternValues);
        break;
      default:
        createRandomPattern(patternValues);
    }
    
    // Doğru cevabı belirle
    correctAnswer = determineNextInSequence(currentPattern, patternValues);
    
    // Örüntüyü görsel olarak göster
    displayPattern();
    
    // Seçenekleri göster
    createOptions(patternValues, correctAnswer);
  }
  
  /**
   * Örüntü stratejisini belirler
   */
  function determinePatternStrategy() {
    const strategies = ['repetition', 'arithmetic', 'random'];
    
    // Seviye ilerledikçe daha karmaşık stratejiler ekle
    if (level >= 3) {
      strategies.push('mirror');
    }
    
    if (level >= 5 && (currentMode === 'numbers' || currentMode === 'mixed')) {
      strategies.push('fibonacci');
    }
    
    // Zorluk arttıkça karmaşık stratejilerin ağırlığını artır
    let weights = {
      easy: { repetition: 0.4, arithmetic: 0.3, mirror: 0.2, fibonacci: 0.1, random: 0.2 },
      medium: { repetition: 0.3, arithmetic: 0.3, mirror: 0.2, fibonacci: 0.2, random: 0.2 },
      hard: { repetition: 0.2, arithmetic: 0.2, mirror: 0.3, fibonacci: 0.3, random: 0.2 }
    };
    
    // Ağırlıklı rastgele seçim yap
    const rand = Math.random();
    let cumulativeWeight = 0;
    
    for (const strategy of strategies) {
      cumulativeWeight += weights[currentDifficulty][strategy] || 0;
      if (rand <= cumulativeWeight) {
        return strategy;
      }
    }
    
    return 'random';
  }
  
  /**
   * Tekrarlayan örüntü oluşturur
   */
  function createRepetitionPattern(values) {
    // Tekrar sayısı (2-4 arası)
    const repeatCount = Math.min(Math.floor(patternLength / 2), 4);
    
    // Tekrarlanacak elemanları seç
    const patternBase = [];
    for (let i = 0; i < repeatCount; i++) {
      const randomIndex = Math.floor(Math.random() * values.length);
      patternBase.push(values[randomIndex]);
    }
    
    // Örüntüyü oluştur
    for (let i = 0; i < patternLength; i++) {
      currentPattern.push(patternBase[i % repeatCount]);
    }
  }
  
  /**
   * Aritmetik örüntü oluşturur (sayılar için)
   */
  function createArithmeticPattern(values) {
    if (currentMode === 'numbers') {
      // Başlangıç değeri ve artış miktarı
      const start = Math.floor(Math.random() * 5);
      const step = Math.floor(Math.random() * 3) + 1;
      const isDecreasing = Math.random() < 0.5;
      
      for (let i = 0; i < patternLength; i++) {
        const value = isDecreasing
          ? (start - i * step + 10) % 10  // Negatif olmasın diye
          : (start + i * step) % 10;      // 10'u geçmesin diye
        currentPattern.push(values[value]);
      }
    } else {
      // Renk/sembol sıralaması için
      const step = Math.floor(Math.random() * 3) + 1;
      const start = Math.floor(Math.random() * (values.length - patternLength * step));
      
      for (let i = 0; i < patternLength; i++) {
        const index = (start + i * step) % values.length;
        currentPattern.push(values[index]);
      }
    }
  }
  
  /**
   * Fibonacci benzeri örüntü oluşturur
   */
  function createFibonacciPattern(values) {
    // İlk iki değeri seç
    const a = Math.floor(Math.random() * values.length);
    const b = Math.floor(Math.random() * values.length);
    
    currentPattern.push(values[a]);
    currentPattern.push(values[b]);
    
    // Fibonacci kuralı: her eleman önceki iki elemanın toplamı
    for (let i = 2; i < patternLength; i++) {
      const nextIndex = (parseInt(currentPattern[i-2]) + parseInt(currentPattern[i-1])) % values.length;
      currentPattern.push(values[nextIndex]);
    }
  }
  
  /**
   * Aynalama örüntüsü oluşturur
   */
  function createMirrorPattern(values) {
    const halfLength = Math.ceil(patternLength / 2);
    
    // İlk yarıyı rastgele oluştur
    for (let i = 0; i < halfLength; i++) {
      const randomIndex = Math.floor(Math.random() * values.length);
      currentPattern.push(values[randomIndex]);
    }
    
    // İkinci yarı: ya aynısı ya tersi (seviyeye göre)
    const isReverse = level > 5 || Math.random() < 0.5;
    
    if (isReverse) {
      // Tersi
      for (let i = halfLength - 2; i >= 0; i--) {
        currentPattern.push(currentPattern[i]);
      }
    } else {
      // Aynısı
      for (let i = 0; i < halfLength - 1 && currentPattern.length < patternLength; i++) {
        currentPattern.push(currentPattern[i]);
      }
    }
  }
  
  /**
   * Tamamen rastgele örüntü oluşturur
   */
  function createRandomPattern(values) {
    for (let i = 0; i < patternLength; i++) {
      const randomIndex = Math.floor(Math.random() * values.length);
      currentPattern.push(values[randomIndex]);
    }
  }
  
  /**
   * Oluşturulan örüntüyü ekranda gösterir
   */
  function displayPattern() {
    patternSequence.innerHTML = '';
    
    // Her örüntü elemanı için bir kutu oluştur
    currentPattern.forEach((item, index) => {
      const patternItem = document.createElement('div');
      patternItem.className = 'pattern-item';
      
      // Renk modu için arka plan rengi ayarla
      if (currentMode === 'colors') {
        patternItem.style.backgroundColor = item;
      } else {
        patternItem.textContent = item;
      }
      
      // Animasyon için biraz gecikme
      setTimeout(() => {
        patternItem.classList.add('highlight');
        setTimeout(() => {
          patternItem.classList.remove('highlight');
        }, 300);
      }, index * 200);
      
      patternSequence.appendChild(patternItem);
    });
  }
  
  /**
   * Seçenekleri oluşturur
   */
  function createOptions(values, correctValue) {
    optionsGrid.innerHTML = '';
    patternOptions.style.display = 'flex';
    
    // Kaç seçenek olacağını belirle
    const optionsCount = difficultySettings[currentDifficulty].optionsCount;
    
    // Seçenekleri oluştur
    const options = [correctValue];
    
    // Diğer yanlış seçenekleri ekle
    while (options.length < optionsCount) {
      const randomValue = values[Math.floor(Math.random() * values.length)];
      if (!options.includes(randomValue)) {
        options.push(randomValue);
      }
    }
    
    // Seçenekleri karıştır
    shuffleArray(options);
    
    // Seçenekleri ekrana yerleştir
    options.forEach((option, index) => {
      const optionItem = document.createElement('div');
      optionItem.className = 'option-item';
      
      // Renk modu için arka plan rengi ayarla
      if (currentMode === 'colors') {
        optionItem.style.backgroundColor = option;
      } else {
        optionItem.textContent = option;
      }
      
      // Tıklama olayını ekle
      optionItem.addEventListener('click', () => selectOption(optionItem, option));
      
      // Animasyon için biraz gecikme ekle
      setTimeout(() => {
        optionItem.style.opacity = '1';
        optionItem.style.transform = 'translateY(0)';
      }, index * 50);
      
      optionsGrid.appendChild(optionItem);
    });
  }
  
  /**
   * Bir seçeneğin seçildiğinde çalışır
   */
  function selectOption(optionElement, selectedValue) {
    // Tüm seçenekleri devre dışı bırak
    const allOptions = document.querySelectorAll('.option-item');
    allOptions.forEach(option => {
      option.style.pointerEvents = 'none';
    });
    
    // Seçimi doğrula
    const isCorrect = selectedValue === correctAnswer;
    
    // Doğru/yanlış sınıflarını ekle
    if (isCorrect) {
      optionElement.classList.add('correct');
      correctAnswersCount++;
      consecutiveCorrect++;
      
      // Combo çarpanını güncelle
      if (consecutiveCorrect >= 3) {
        comboMultiplier = Math.min(comboMultiplier + 0.5, 3);
      }
      
      // Başarımları kontrol et
      if (consecutiveCorrect >= 10) {
        addAchievement(ACHIEVEMENTS.PATTERN_MASTER);
      }
      
      // Puanı hesapla ve ekle
      const basePoints = 10 * difficultySettings[currentDifficulty].scoreMultiplier;
      const levelBonus = level * 2;
      const timeBonus = timeRemaining < 5 ? 20 : 0; // Hızlı cevap bonusu
      const earnedPoints = Math.floor((basePoints + levelBonus) * comboMultiplier);
      
      // Puan ekle
      score += earnedPoints;
      updateScoreDisplay();
      
      // Ses efekti
      playSound('correct');
      
      // Geri bildirim göster
      if (comboMultiplier > 1) {
        showFeedback(`Doğru! +${earnedPoints} puan (${comboMultiplier.toFixed(1)}x combo)`, 'success');
      } else {
        showFeedback(`Doğru! +${earnedPoints} puan`, 'success');
      }
      
      // Hız başarımı için kontrol
      if (timeBonus > 0) {
        addAchievement(ACHIEVEMENTS.SPEED_DEMON);
      }
      
      // Yüksek skor başarımı
      if (score >= 500) {
        addAchievement(ACHIEVEMENTS.HIGH_SCORER);
      }
      
      // Seviye atladı mı kontrol et
      if (score >= level * 100) {
        levelUp();
      }
    } else {
      // Yanlış cevap
      optionElement.classList.add('wrong');
      wrongAnswersCount++;
      consecutiveCorrect = 0;
      comboMultiplier = 1;
      
      // Doğru cevabı göster
      allOptions.forEach(option => {
        if ((currentMode === 'colors' && option.style.backgroundColor === correctAnswer) ||
            (currentMode !== 'colors' && option.textContent === correctAnswer)) {
          option.classList.add('correct');
        }
      });
      
      // Ses efekti
      playSound('wrong');
      
      // Geri bildirim göster
      showFeedback(`Yanlış! Doğru cevap: ${currentMode === 'colors' ? correctAnswer.toUpperCase() : correctAnswer}`, 'error');
    }
    
    // Kısa gecikme sonra sonraki soruya geç
    setTimeout(() => {
      if (isGameActive) {
        generatePattern();
      }
    }, 1500);
  }
  
  /**
   * Seviye atlamayı yönetir
   */
  function levelUp() {
    level++;
    updateLevelDisplay();
    
    // Seviye başarımı
    if (level >= 10) {
      addAchievement(ACHIEVEMENTS.LEVEL_MASTER);
    }
    
    // Ekstra süre ekle (zorluk seviyesine göre)
    const timeBonus = Math.max(10 - Math.floor(level / 2), 3);
    timeRemaining += timeBonus;
    updateTimerDisplay();
    
    // Ses efekti
    playSound('levelUp');
    
    // Geri bildirim
    showFeedback(`Seviye ${level}'e yükseldiniz! +${timeBonus} saniye eklendi.`, 'info');
  }
  
  /**
   * Dizideki bir sonraki elemanı tahmin eder
   */
  function determineNextInSequence(pattern, values) {
    // Desen analizi yaparak bir sonraki elemanı tahmin et
    
    // Tekrarlanan desen kontrolü
    if (pattern.length >= 4) {
      for (let repeat = 2; repeat <= Math.floor(pattern.length / 2); repeat++) {
        let isRepeating = true;
        for (let i = 0; i < repeat; i++) {
          if (pattern[pattern.length - repeat - i] !== pattern[pattern.length - i - 1]) {
            isRepeating = false;
            break;
          }
        }
        if (isRepeating) {
          return pattern[pattern.length - repeat];
        }
      }
    }
    
    // Fibonacci tarzı desenler için
    if (currentMode === 'numbers' && pattern.length >= 3) {
      let isFibonacciLike = true;
      for (let i = 2; i < pattern.length; i++) {
        const a = parseInt(pattern[i-2]) || 0;
        const b = parseInt(pattern[i-1]) || 0;
        const c = parseInt(pattern[i]) || 0;
        
        if ((a + b) % 10 !== c) {
          isFibonacciLike = false;
          break;
        }
      }
      
      if (isFibonacciLike) {
        const a = parseInt(pattern[pattern.length - 2]) || 0;
        const b = parseInt(pattern[pattern.length - 1]) || 0;
        return ((a + b) % 10).toString();
      }
    }
    
    // Aritmetik desen kontrolü (sayılar için)
    if (currentMode === 'numbers' && pattern.length >= 3) {
      const diffs = [];
      let isArithmetic = true;
      
      for (let i = 1; i < pattern.length; i++) {
        const diff = (parseInt(pattern[i]) - parseInt(pattern[i-1]) + 10) % 10;
        diffs.push(diff);
      }
      
      for (let i = 1; i < diffs.length; i++) {
        if (diffs[i] !== diffs[0]) {
          isArithmetic = false;
          break;
        }
      }
      
      if (isArithmetic) {
        const nextVal = (parseInt(pattern[pattern.length - 1]) + diffs[0]) % 10;
        return nextVal.toString();
      }
    }
    
    // Aynalanmış desen kontrolü
    if (pattern.length >= 5) {
      const mid = Math.floor(pattern.length / 2);
      let isMirrored = true;
      
      for (let i = 0; i < mid; i++) {
        if (pattern[i] !== pattern[pattern.length - 1 - i]) {
          isMirrored = false;
          break;
        }
      }
      
      if (isMirrored) {
        return pattern[0]; // Deseni baştan başlat
      }
    }
    
    // Varsayılan: son elemanı tekrarla veya rastgele bir eleman seç
    if (Math.random() < 0.7) {
      return pattern[pattern.length - 1];
    } else {
      return values[Math.floor(Math.random() * values.length)];
    }
  }
  
  /**
   * Oyunu sonlandırır
   */
  function endGame(isCompleted = false) {
    // Zamanlayıcıyı durdur
    clearInterval(timerInterval);
    isGameActive = false;
    
    // Doğru son istatistikleri göster
    finalScoreDisplay.textContent = score;
    correctAnswersDisplay.textContent = correctAnswersCount;
    wrongAnswersDisplay.textContent = wrongAnswersCount;
    
    // Oyun sonu başlığını güncelle
    if (isCompleted) {
      resultTitle.textContent = "Tebrikler! Oyunu Tamamladınız!";
      playSound('levelUp');
    } else {
      resultTitle.textContent = "Süre Doldu! Oyun Bitti.";
      playSound('gameOver');
    }
    
    // Başlat düğmesini sıfırla
    startBtn.innerHTML = '<i class="fas fa-play me-2"></i>Başlat';
    
    // Oyun alanını gizle, sonuç ekranını göster
    patternArea.style.display = 'none';
    patternOptions.style.display = 'none';
    gameOver.style.display = 'flex';
    
    // Skoru kaydet
    saveScore();
  }
  
  /**
   * Oyunu sıfırlar
   */
  function resetGame() {
    // Tüm oyun alanlarını sıfırla
    score = 0;
    level = 1;
    timeRemaining = difficultySettings[currentDifficulty].baseTime;
    correctAnswersCount = 0;
    wrongAnswersCount = 0;
    consecutiveCorrect = 0;
    comboMultiplier = 1;
    
    // UI'ı güncelle
    updateScoreDisplay();
    updateLevelDisplay();
    updateTimerDisplay();
    
    // Zamanlayıcıyı temizle
    clearInterval(timerInterval);
    
    // Sınıfları sıfırla
    timerDisplay.classList.remove('text-danger', 'pulse');
    
    // Oyun alanlarını sıfırla
    gameOver.style.display = 'none';
    patternWelcome.classList.add('active');
    patternArea.style.display = 'none';
    patternOptions.style.display = 'none';
    
    // Başlangıç ekranını göster
    isGameActive = false;
    startBtn.innerHTML = '<i class="fas fa-play me-2"></i>Başlat';
    
    // Başarımları temizle
    achievementSection.innerHTML = '';
    
    // Geri bildirim 
    showFeedback('Oyun sıfırlandı. Başlamak için Başlat düğmesine tıklayın.', 'info');
  }
  
  /**
   * Skoru kaydeder
   */
  function saveScore() {
    // Yeterli puan varsa skoru kaydet
    if (score > 0) {
      // Global skoru kaydet
      window.saveScore('patternRecognition', score);
    }
  }
  
  /**
   * Başarım ekler
   */
  function addAchievement(achievement) {
    // Başarımın zaten gösterilip gösterilmediğini kontrol et
    if (achievementSection.querySelector(`[data-achievement="${achievement.id}"]`)) {
      return; // Zaten gösterilmiş
    }
    
    // Ses efekti
    playSound('achievement');
    
    // Oyun sırasında bildirim göster
    if (isGameActive) {
      const feedbackMsg = `<i class="fas fa-trophy text-warning"></i> ${achievement.name} başarımını kazandınız!`;
      showFeedback(feedbackMsg, 'success');
    }
    
    // Sonuç ekranına başarımı ekle
    const achievementItem = document.createElement('div');
    achievementItem.className = 'achievement-item';
    achievementItem.setAttribute('data-achievement', achievement.id);
    
    achievementItem.innerHTML = `
      <div class="achievement-icon">
        <i class="fas fa-${achievement.icon}"></i>
      </div>
      <div class="achievement-text">
        <div class="achievement-title">${achievement.name}</div>
        <div class="achievement-description">${achievement.description}</div>
      </div>
    `;
    
    achievementSection.appendChild(achievementItem);
  }
  
  /**
   * Geri bildirim mesajı gösterir
   */
  function showFeedback(message, type) {
    const feedbackMsg = document.createElement('div');
    feedbackMsg.className = `feedback-message ${type}`;
    feedbackMsg.innerHTML = message;
    
    // Önceki mesajları temizle
    patternFeedback.innerHTML = '';
    patternFeedback.appendChild(feedbackMsg);
    
    // Mesajı 3 saniye sonra kaldır
    setTimeout(() => {
      feedbackMsg.style.opacity = '0';
      setTimeout(() => {
        if (patternFeedback.contains(feedbackMsg)) {
          patternFeedback.removeChild(feedbackMsg);
        }
      }, 500);
    }, 3000);
  }
  
  /**
   * Ses efekti çalar
   */
  function playSound(soundName) {
    // Ses dosyası yoksa veya browser ses desteği yoksa hata vermeyi engelle
    if (!sounds[soundName]) {
      return;
    }
    
    try {
      sounds[soundName].currentTime = 0;
      sounds[soundName].play().catch(err => {
        // Sessizce devam et
      });
    } catch (err) {
      // Sessizce devam et
    }
  }
  
  /**
   * Yardımcı fonksiyonlar
   */
  function shuffleArray(array) {
    // Fisher-Yates shuffle algoritması
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
});