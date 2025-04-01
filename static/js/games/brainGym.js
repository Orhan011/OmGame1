/**
 * Beyin Jimnastiği Oyunu - 1.0
 * 
 * Yapay zeka eğitiminden ilham alınarak geliştirilmiş, beyin jimnastiği sağlayacak nöral ağ temelli çok fonksiyonlu
 * ve profesyonel tasarımlı zeka oyunu.
 * 
 * Bu oyun çalışan bellek (working memory), mantıksal düşünme, örüntü tanıma ve karar verme becerilerini geliştirmek için 
 * tasarlanmıştır ve bilişsel adaptasyon ile dinamik zorluk ayarı sunar.
 * 
 * Özellikler:
 * - Çoklu bilişsel görevler
 * - Adaptif zorluk seviyeleri
 * - Görsel ve işitsel geribildirim
 * - İlerleme analizi ve yetenek gelişimi takibi
 * - Bilimsel temelli yaklaşım
 * - Görsel olarak profesyonel ve dinamik tasarım
 */

// Oyun başlatıldığında çalıştırılacak
document.addEventListener('DOMContentLoaded', function() {
  // Ana değişkenler
  let gameActive = false;
  let currentTask = null;
  let currentLevel = 1;
  let totalScore = 0;
  let streak = 0;
  let gameTime = 60; // Varsayılan oyun süresi (saniye)
  let timer = null;
  let timeLeft = gameTime;
  let soundEnabled = true;
  let adaptiveDifficulty = true;
  let currentDifficulty = 1; // 1-10 arası
  
  // Oyun görevleri - Farklı bilişsel becerileri çalıştıran görevler
  const taskTypes = {
    PATTERN_MATCHING: 'patternMatching',
    WORKING_MEMORY: 'workingMemory',
    LOGICAL_REASONING: 'logicalReasoning',
    MENTAL_CALCULATION: 'mentalCalculation',
    SPATIAL_RECOGNITION: 'spatialRecognition'
  };
  
  // DOM Öğeleri
  const startButton = document.getElementById('brainGymStartButton');
  const gameBoard = document.getElementById('brainGymBoard');
  const taskDisplay = document.getElementById('brainGymTaskDisplay');
  const scoreDisplay = document.getElementById('brainGymScore');
  const timerDisplay = document.getElementById('brainGymTimer');
  const levelDisplay = document.getElementById('brainGymLevel');
  const streakDisplay = document.getElementById('brainGymStreak');
  const difficultyIndicator = document.getElementById('brainGymDifficulty');
  const optionsContainer = document.getElementById('brainGymOptions');
  const modalGameOver = document.getElementById('brainGymGameOver');
  const finalScoreDisplay = document.getElementById('brainGymFinalScore');
  const difficultyButtons = document.querySelectorAll('.difficulty-option');
  const soundButton = document.getElementById('brainGymSoundToggle');
  const timeButtons = document.querySelectorAll('.time-option');
  
  // Oyun ayarları
  function initGame() {
    // Butonları etkinleştir
    difficultyButtons.forEach(button => {
      button.addEventListener('click', function() {
        difficultyButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentDifficulty = parseInt(this.dataset.difficulty);
        adaptiveDifficulty = currentDifficulty === 0;
        updateDifficultyDisplay();
      });
    });
    
    timeButtons.forEach(button => {
      button.addEventListener('click', function() {
        timeButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        gameTime = parseInt(this.dataset.time);
        timeLeft = gameTime;
        updateTimerDisplay();
      });
    });
    
    soundButton.addEventListener('click', toggleSound);
    startButton.addEventListener('click', startGame);
    
    // Başlangıç ayarları
    document.querySelector('.difficulty-option[data-difficulty="1"]').classList.add('active');
    document.querySelector('.time-option[data-time="60"]').classList.add('active');
    updateDifficultyDisplay();
    updateScoreDisplay();
    updateTimerDisplay();
    updateLevelDisplay();
  }
  
  // Oyunu başlat
  function startGame() {
    gameActive = true;
    totalScore = 0;
    streak = 0;
    currentLevel = 1;
    timeLeft = gameTime;
    
    if (adaptiveDifficulty) {
      currentDifficulty = 1;
    }
    
    // Arayüzü güncelle
    document.getElementById('brainGymSettings').classList.add('d-none');
    document.getElementById('brainGymGameplay').classList.remove('d-none');
    
    updateScoreDisplay();
    updateTimerDisplay();
    updateLevelDisplay();
    updateStreakDisplay();
    
    // Zamanlayıcıyı başlat
    startTimer();
    
    // İlk görevi başlat
    generateNewTask();
  }
  
  // Zamanlayıcı
  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      
      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }
  
  // Oyun sonu
  function endGame() {
    gameActive = false;
    clearInterval(timer);
    
    // Sonuç ekranını göster
    modalGameOver.classList.remove('d-none');
    finalScoreDisplay.textContent = totalScore;
    
    // API'ye sonucu kaydet
    saveScore();
  }
  
  // Yeni görev oluştur
  function generateNewTask() {
    // Rastgele bir görev türü seç
    const taskTypes = Object.values(taskTypes);
    const randomTask = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    
    currentTask = randomTask;
    
    // Şu an için basit bir pattern matching görevi oluşturalım
    createPatternMatchingTask();
  }
  
  // Örüntü eşleştirme görevi
  function createPatternMatchingTask() {
    // Görev zorluk seviyesini ayarla
    const itemCount = 3 + Math.floor(currentDifficulty / 2);
    const patternLength = Math.min(7, 3 + Math.floor(currentDifficulty / 3));
    
    // Farklı sembol setleri
    const symbolSets = [
      ['★', '♦', '■', '●', '▲', '◆', '○', '□', '△', '♥'],
      ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚪', '⚫', '🟤', '🟦'],
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
    ];
    
    // Rastgele bir sembol seti seç
    const symbols = symbolSets[Math.floor(Math.random() * symbolSets.length)];
    
    // Rastgele desen oluştur
    const pattern = [];
    for (let i = 0; i < patternLength; i++) {
      pattern.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }
    
    // Doğru cevabı belirle (rastgele paterndeki bir sonraki sembol)
    let correctAnswer = symbols[Math.floor(Math.random() * symbols.length)];
    
    // Sorunun tipini belirle (rastgele)
    const questionType = Math.floor(Math.random() * 3);
    let questionText = '';
    
    if (questionType === 0) {
      // Desende en çok tekrar eden sembolü bul
      const frequencyMap = {};
      let maxFreq = 0;
      let mostFrequentSymbol = pattern[0];
      
      for (const symbol of pattern) {
        frequencyMap[symbol] = (frequencyMap[symbol] || 0) + 1;
        if (frequencyMap[symbol] > maxFreq) {
          maxFreq = frequencyMap[symbol];
          mostFrequentSymbol = symbol;
        }
      }
      
      correctAnswer = mostFrequentSymbol;
      questionText = 'Desende en çok tekrar eden sembolü seçin:';
    } 
    else if (questionType === 1) {
      // Desendeki son sembolden sonraki mantıklı sembolü bul
      // Basit bir dizi için sıradaki elemanı seçeriz
      if (pattern.length > 1 && Math.random() > 0.5) {
        // Deseni aritmetik dizi olarak düşünelim (A, B, C, ... şeklinde)
        const lastSymbolIndex = symbols.indexOf(pattern[pattern.length - 1]);
        const secondLastSymbolIndex = symbols.indexOf(pattern[pattern.length - 2]);
        
        // Dizi artış miktarını bul
        const diff = (lastSymbolIndex - secondLastSymbolIndex + symbols.length) % symbols.length;
        
        // Bir sonraki elemanı hesapla
        const nextIndex = (lastSymbolIndex + diff) % symbols.length;
        correctAnswer = symbols[nextIndex];
      } else {
        // Rastgele bir sonraki eleman
        const lastSymbolIndex = symbols.indexOf(pattern[pattern.length - 1]);
        const nextIndex = (lastSymbolIndex + 1) % symbols.length;
        correctAnswer = symbols[nextIndex];
      }
      
      questionText = 'Bu desenden sonra gelmesi muhtemel sembolü seçin:';
    }
    else {
      // Desende olmayan bir sembolü bul
      const uniqueSymbols = [...new Set(pattern)];
      const unusedSymbols = symbols.filter(s => !uniqueSymbols.includes(s));
      
      if (unusedSymbols.length > 0) {
        correctAnswer = unusedSymbols[Math.floor(Math.random() * unusedSymbols.length)];
        questionText = 'Desende hiç kullanılmayan bir sembolü seçin:';
      } else {
        // Eğer tüm semboller kullanıldıysa, en az kullanılanı seç
        const frequencyMap = {};
        for (const symbol of pattern) {
          frequencyMap[symbol] = (frequencyMap[symbol] || 0) + 1;
        }
        
        let minFreq = pattern.length;
        let leastFrequentSymbols = [];
        
        for (const symbol of uniqueSymbols) {
          if (frequencyMap[symbol] < minFreq) {
            minFreq = frequencyMap[symbol];
            leastFrequentSymbols = [symbol];
          } else if (frequencyMap[symbol] === minFreq) {
            leastFrequentSymbols.push(symbol);
          }
        }
        
        correctAnswer = leastFrequentSymbols[Math.floor(Math.random() * leastFrequentSymbols.length)];
        questionText = 'Desende en az bulunan sembolü seçin:';
      }
    }
    
    // Olası cevapları oluştur (doğru cevap dahil)
    const options = [correctAnswer];
    while (options.length < itemCount) {
      const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      if (!options.includes(randomSymbol)) {
        options.push(randomSymbol);
      }
    }
    
    // Seçenekleri karıştır
    shuffleArray(options);
    
    // Görev arayüzünü oluştur
    renderPatternTask(pattern, options, questionText, correctAnswer);
  }

  // Görev arayüzünü oluştur
  function renderPatternTask(pattern, options, questionText, correctAnswer) {
    taskDisplay.innerHTML = '';
    optionsContainer.innerHTML = '';
    
    // Görev tipini göster
    const taskTitle = document.createElement('h3');
    taskTitle.className = 'task-title';
    taskTitle.innerHTML = '<i class="fas fa-brain"></i> Örüntü Analizi';
    taskDisplay.appendChild(taskTitle);
    
    // Soru metnini ekle
    const question = document.createElement('p');
    question.className = 'task-question';
    question.textContent = questionText;
    taskDisplay.appendChild(question);
    
    // Deseni göster
    const patternContainer = document.createElement('div');
    patternContainer.className = 'pattern-container';
    
    pattern.forEach(symbol => {
      const symbolEl = document.createElement('div');
      symbolEl.className = 'pattern-symbol';
      symbolEl.textContent = symbol;
      patternContainer.appendChild(symbolEl);
    });
    
    taskDisplay.appendChild(patternContainer);
    
    // Seçenekleri göster
    options.forEach(option => {
      const optionEl = document.createElement('button');
      optionEl.className = 'option-button';
      optionEl.textContent = option;
      
      optionEl.addEventListener('click', () => {
        checkAnswer(option, correctAnswer);
      });
      
      optionsContainer.appendChild(optionEl);
    });
    
    // Animasyonlar
    animateTaskElements();
  }
  
  // Cevabı kontrol et
  function checkAnswer(selectedAnswer, correctAnswer) {
    const isCorrect = selectedAnswer === correctAnswer;
    
    // Doğru/yanlış efektini göster
    showAnswerFeedback(isCorrect);
    
    if (isCorrect) {
      // Puanı artır
      streak++;
      const difficultyMultiplier = currentDifficulty;
      const streakBonus = Math.min(streak, 5); // Maksimum 5x çarpan
      const points = 10 * difficultyMultiplier * streakBonus;
      
      totalScore += points;
      
      // Seviye kontrolü
      if (totalScore >= currentLevel * 100) {
        currentLevel++;
        updateLevelDisplay();
        showLevelUpMessage();
      }
      
      // Adaptif zorluk ayarlaması
      if (adaptiveDifficulty && streak % 3 === 0 && currentDifficulty < 10) {
        currentDifficulty++;
        updateDifficultyDisplay();
      }
    } else {
      // Hata durumunda
      streak = 0;
      
      // Adaptif zorluk ayarlaması
      if (adaptiveDifficulty && currentDifficulty > 1) {
        currentDifficulty--;
        updateDifficultyDisplay();
      }
    }
    
    // Arayüzü güncelle
    updateScoreDisplay();
    updateStreakDisplay();
    
    // Gecikme ile yeni soru
    setTimeout(() => {
      generateNewTask();
    }, 1000);
  }
  
  // Doğru/yanlış efektlerini göster
  function showAnswerFeedback(isCorrect) {
    // Tüm seçenek butonlarını devre dışı bırak
    const optionButtons = document.querySelectorAll('.option-button');
    optionButtons.forEach(button => {
      button.disabled = true;
      
      if (button.textContent === correctAnswer) {
        button.classList.add('correct');
      } else if (button.textContent === selectedAnswer && !isCorrect) {
        button.classList.add('incorrect');
      }
    });
    
    // Ses çal
    if (soundEnabled) {
      const sound = isCorrect ? 'correct' : 'incorrect';
      playSound(sound);
    }
    
    // Ekranda feedback göster
    const feedback = document.createElement('div');
    feedback.className = `answer-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedback.innerHTML = isCorrect ? 
      '<i class="fas fa-check-circle"></i> Doğru!' : 
      '<i class="fas fa-times-circle"></i> Yanlış!';
    
    document.getElementById('brainGymFeedback').innerHTML = '';
    document.getElementById('brainGymFeedback').appendChild(feedback);
    
    // Animasyon
    setTimeout(() => {
      feedback.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      feedback.classList.remove('show');
    }, 900);
  }
  
  // Seviye atlama mesajını göster
  function showLevelUpMessage() {
    const levelUpMessage = document.createElement('div');
    levelUpMessage.className = 'level-up-message';
    levelUpMessage.innerHTML = `
      <i class="fas fa-arrow-circle-up"></i>
      <span>Seviye ${currentLevel}</span>
    `;
    
    document.getElementById('brainGymLevelUp').innerHTML = '';
    document.getElementById('brainGymLevelUp').appendChild(levelUpMessage);
    
    setTimeout(() => {
      levelUpMessage.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      levelUpMessage.classList.remove('show');
    }, 2000);
    
    // Seviye atlama sesi
    if (soundEnabled) {
      playSound('levelUp');
    }
  }
  
  // Görev öğelerini canlandır
  function animateTaskElements() {
    // Pattern sembolleri animasyonu
    const symbols = document.querySelectorAll('.pattern-symbol');
    symbols.forEach((symbol, index) => {
      symbol.style.animationDelay = `${index * 100}ms`;
      symbol.classList.add('animate-in');
    });
    
    // Seçenek butonları animasyonu
    const options = document.querySelectorAll('.option-button');
    options.forEach((option, index) => {
      option.style.animationDelay = `${(symbols.length * 100) + (index * 100)}ms`;
      option.classList.add('animate-in');
    });
  }
  
  // Görselleri yükle
  function preloadImages() {
    const imagePaths = [
      '/static/images/brain-bg.jpg',
      '/static/images/brain-pattern.svg'
    ];
    
    imagePaths.forEach(path => {
      const img = new Image();
      img.src = path;
    });
  }
  
  // Sesleri yükle ve çal
  function playSound(soundName) {
    if (!soundEnabled) return;
    
    const sounds = {
      correct: '/static/sounds/correct.mp3',
      incorrect: '/static/sounds/incorrect.mp3',
      levelUp: '/static/sounds/level-up.mp3',
      gameOver: '/static/sounds/game-over.mp3'
    };
    
    const sound = new Audio(sounds[soundName]);
    sound.volume = 0.5;
    sound.play().catch(e => console.log('Ses yüklenirken hata oluştu:', e));
  }
  
  // Ses ayarını değiştir
  function toggleSound() {
    soundEnabled = !soundEnabled;
    soundButton.classList.toggle('active', soundEnabled);
    soundButton.innerHTML = soundEnabled ? 
      '<i class="fas fa-volume-up"></i>' : 
      '<i class="fas fa-volume-mute"></i>';
  }
  
  // Skoru API'ye kaydet
  function saveScore() {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameType: 'brainGym',
        score: totalScore
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
  
  // Arayüz güncellemeleri
  function updateScoreDisplay() {
    scoreDisplay.textContent = totalScore;
  }
  
  function updateTimerDisplay() {
    timerDisplay.textContent = timeLeft;
    
    // Son 10 saniye için kırmızı renk
    if (timeLeft <= 10) {
      timerDisplay.classList.add('warning');
    } else {
      timerDisplay.classList.remove('warning');
    }
  }
  
  function updateLevelDisplay() {
    levelDisplay.textContent = currentLevel;
  }
  
  function updateStreakDisplay() {
    streakDisplay.textContent = streak;
    
    // Streak efekti
    streakDisplay.classList.remove('streak-1', 'streak-2', 'streak-3', 'streak-4', 'streak-5');
    if (streak > 0) {
      streakDisplay.classList.add(`streak-${Math.min(streak, 5)}`);
    }
  }
  
  function updateDifficultyDisplay() {
    if (adaptiveDifficulty) {
      difficultyIndicator.innerHTML = `<i class="fas fa-brain"></i> Adaptif`;
      difficultyIndicator.classList.add('adaptive');
    } else {
      difficultyIndicator.innerHTML = `<i class="fas fa-signal"></i> Seviye ${currentDifficulty}`;
      difficultyIndicator.classList.remove('adaptive');
    }
  }
  
  // Yardımcı fonksiyonlar
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  // Yeniden başlat butonu
  document.getElementById('brainGymRestartButton').addEventListener('click', function() {
    modalGameOver.classList.add('d-none');
    document.getElementById('brainGymSettings').classList.remove('d-none');
    document.getElementById('brainGymGameplay').classList.add('d-none');
  });
  
  // Oyunu başlat
  initGame();
  preloadImages();
});
// Beyin Jimnastiği (Brain Gym) Oyunu
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elemanları
  const startButtons = document.querySelectorAll('.difficulty-option');
  const timeButtons = document.querySelectorAll('.time-option');
  const brainGymSettings = document.getElementById('brainGymSettings');
  const brainGymGameplay = document.getElementById('brainGymGameplay');
  const brainGymScore = document.getElementById('brainGymScore');
  const brainGymLevel = document.getElementById('brainGymLevel');
  const brainGymCombo = document.getElementById('brainGymCombo');
  const brainGymTimer = document.getElementById('brainGymTimer');
  const taskTitle = document.getElementById('taskTitle');
  const taskDescription = document.getElementById('taskDescription');
  const taskContent = document.getElementById('taskContent');
  const answerOptions = document.getElementById('answerOptions');
  const nextTaskBtn = document.getElementById('nextTaskBtn');
  const restartGameBtn = document.getElementById('restartGameBtn');
  const resultScreen = document.getElementById('resultScreen');
  const finalScore = document.getElementById('finalScore');
  const finalLevel = document.getElementById('finalLevel');
  const finalCombo = document.getElementById('finalCombo');
  
  // Ses efektleri
  const sounds = {
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    click: new Audio('/static/sounds/click.mp3'),
    success: new Audio('/static/sounds/success.mp3'),
    gameOver: new Audio('/static/sounds/game-over.mp3'),
    levelUp: new Audio('/static/sounds/level-up.mp3')
  };

  // Ses oynatma fonksiyonu
  function playSound(sound) {
    try {
      sounds[sound].currentTime = 0;
      sounds[sound].play().catch(err => console.log("Sound play error:", err));
    } catch (error) {
      console.log("Sound play error:", error);
    }
  }
  
  // Oyun durumu
  let gameState = {
    isPlaying: false,
    difficulty: 1, // 1: Kolay, 3: Orta, 5: Zor, 0: Adaptif
    score: 0,
    level: 1,
    combo: 0,
    maxCombo: 0,
    timeRemaining: 180, // 3 dakika
    currentTask: null,
    answerSubmitted: false,
    adaptiveDifficulty: 1,
    correctAnswers: 0,
    wrongAnswers: 0
  };
  
  // Zorluk ayarları
  startButtons.forEach(button => {
    button.addEventListener('click', function() {
      playSound('click');
      startButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      const difficulty = parseInt(this.getAttribute('data-difficulty'));
      gameState.difficulty = difficulty;
    });
  });
  
  // Süre ayarları
  timeButtons.forEach(button => {
    button.addEventListener('click', function() {
      playSound('click');
      timeButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      const time = parseInt(this.getAttribute('data-time'));
      gameState.timeRemaining = time;
    });
  });
  
  // Başlat butonları
  const startGameBtn = document.getElementById('startBrainGym');
  startGameBtn.addEventListener('click', function() {
    playSound('click');
    startGame();
  });
  
  // Sonraki görev butonu
  nextTaskBtn.addEventListener('click', function() {
    if (gameState.isPlaying && gameState.answerSubmitted) {
      playSound('click');
      generateNewTask();
    }
  });
  
  // Yeniden başlat butonu
  restartGameBtn.addEventListener('click', function() {
    playSound('click');
    resultScreen.style.display = 'none';
    startGame();
  });
  
  // Oyunu başlat
  function startGame() {
    gameState.isPlaying = true;
    gameState.score = 0;
    gameState.level = 1;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.correctAnswers = 0;
    gameState.wrongAnswers = 0;
    gameState.adaptiveDifficulty = gameState.difficulty === 0 ? 1 : gameState.difficulty;
    
    // Ekranı güncelle
    brainGymScore.textContent = '0';
    brainGymLevel.textContent = '1';
    brainGymCombo.textContent = '0';
    
    // Oyun alanını göster
    brainGymSettings.classList.add('d-none');
    brainGymGameplay.classList.remove('d-none');
    resultScreen.style.display = 'none';
    
    // Zamanlayıcıyı başlat
    startTimer();
    
    // İlk görevi oluştur
    generateNewTask();
  }
  
  // Zamanlayıcıyı başlat
  function startTimer() {
    const timer = setInterval(() => {
      if (!gameState.isPlaying) {
        clearInterval(timer);
        return;
      }
      
      gameState.timeRemaining--;
      brainGymTimer.textContent = formatTime(gameState.timeRemaining);
      
      if (gameState.timeRemaining <= 0) {
        clearInterval(timer);
        endGame();
      }
    }, 1000);
  }
  
  // Zamanı formatla (mm:ss)
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Yeni görev oluştur
  function generateNewTask() {
    // Bir önceki görevi temizle
    taskContent.innerHTML = '';
    answerOptions.innerHTML = '';
    
    // Adaptif zorluk seviyesini güncelle
    if (gameState.difficulty === 0) {
      updateAdaptiveDifficulty();
    }
    
    // Görev oluştur
    const taskTypes = ['patternRecognition', 'workingMemory', 'logicalReasoning', 'mentalCalculation', 'spatialPerception'];
    const randomIndex = Math.floor(Math.random() * taskTypes.length);
    const taskType = taskTypes[randomIndex];
    
    gameState.answerSubmitted = false;
    
    switch (taskType) {
      case 'patternRecognition':
        createPatternRecognitionTask();
        break;
      case 'workingMemory':
        createWorkingMemoryTask();
        break;
      case 'logicalReasoning':
        createLogicalReasoningTask();
        break;
      case 'mentalCalculation':
        createMentalCalculationTask();
        break;
      case 'spatialPerception':
        createSpatialPerceptionTask();
        break;
    }
  }
  
  // Adaptif zorluk seviyesini güncelle
  function updateAdaptiveDifficulty() {
    const totalAnswers = gameState.correctAnswers + gameState.wrongAnswers;
    
    if (totalAnswers >= 5) {
      const successRate = gameState.correctAnswers / totalAnswers;
      
      if (successRate > 0.8 && gameState.adaptiveDifficulty < 5) {
        // Başarı oranı yüksekse zorluğu artır
        gameState.adaptiveDifficulty += 1;
        showTaskMessage('Zorluk seviyesi arttı!', 'success');
      } else if (successRate < 0.4 && gameState.adaptiveDifficulty > 1) {
        // Başarı oranı düşükse zorluğu azalt
        gameState.adaptiveDifficulty -= 1;
        showTaskMessage('Zorluk seviyesi azaldı', 'info');
      }
      
      // Sayaçları sıfırla
      gameState.correctAnswers = 0;
      gameState.wrongAnswers = 0;
    }
  }
  
  // Örüntü Tanıma Görevi
  function createPatternRecognitionTask() {
    taskTitle.textContent = 'Örüntü Tanıma';
    
    const difficulty = gameState.difficulty === 0 ? gameState.adaptiveDifficulty : gameState.difficulty;
    
    // Zorluk seviyesine göre dizi uzunluğu
    const sequenceLength = 4 + Math.floor(difficulty * 1.5);
    
    // Farklı örüntü türleri
    const patternTypes = [
      // Aritmetik dizi (örn: 2, 4, 6, 8, ...)
      () => {
        const start = Math.floor(Math.random() * 5) + 1;
        const difference = Math.floor(Math.random() * 3) + 1;
        const sequence = Array(sequenceLength).fill(0).map((_, i) => start + i * difference);
        const nextNumber = start + sequenceLength * difference;
        return { sequence, answer: nextNumber };
      },
      // Geometrik dizi (örn: 2, 4, 8, 16, ...)
      () => {
        const start = Math.floor(Math.random() * (3)) + 1;
        const ratio = Math.floor(Math.random() * 2) + 2;
        const sequence = Array(sequenceLength).fill(0).map((_, i) => start * Math.pow(ratio, i));
        const nextNumber = start * Math.pow(ratio, sequenceLength);
        return { sequence, answer: nextNumber };
      },
      // Fibonacci benzeri (örn: 1, 1, 2, 3, 5, ...)
      () => {
        const sequence = [1, 1];
        for (let i = 2; i < sequenceLength; i++) {
          sequence.push(sequence[i-1] + sequence[i-2]);
        }
        const nextNumber = sequence[sequenceLength-1] + sequence[sequenceLength-2];
        return { sequence, answer: nextNumber };
      },
      // Alternatif artış (örn: 3, 5, 8, 12, 17, ...)
      () => {
        const start = Math.floor(Math.random() * 5) + 1;
        let increment = 1;
        const sequence = [start];
        for (let i = 1; i < sequenceLength; i++) {
          increment += 1;
          sequence.push(sequence[i-1] + increment);
        }
        const nextNumber = sequence[sequenceLength-1] + (increment + 1);
        return { sequence, answer: nextNumber };
      }
    ];
    
    // Zorluk seviyesine göre pattern seç
    const patternIndex = Math.min(Math.floor(difficulty / 2), patternTypes.length - 1);
    const { sequence, answer } = patternTypes[patternIndex]();
    
    // Görevi açıkla
    taskDescription.textContent = 'Bu sayı dizisindeki örüntüyü bulun ve bir sonraki sayıyı seçin:';
    
    // Diziyi ekrana ekle
    const sequenceContainer = document.createElement('div');
    sequenceContainer.className = 'sequence-container';
    
    sequence.forEach(number => {
      const numberBox = document.createElement('div');
      numberBox.className = 'number-box';
      numberBox.textContent = number;
      sequenceContainer.appendChild(numberBox);
    });
    
    const questionMark = document.createElement('div');
    questionMark.className = 'number-box question-mark';
    questionMark.textContent = '?';
    sequenceContainer.appendChild(questionMark);
    
    taskContent.appendChild(sequenceContainer);
    
    // Yanıt seçeneklerini oluştur
    const options = [answer];
    
    // Yanlış cevaplar ekle
    while (options.length < 4) {
      // Doğru cevaba yakın rasgele yanıt oluştur
      const randomFactor = Math.random() * 0.5 + 0.75; // 0.75 - 1.25 arası rasgele çarpan
      let wrongAnswer = Math.round(answer * randomFactor);
      
      // Eğer aynı değer eklenecekse farklı bir değer kullan
      if (wrongAnswer === answer || options.includes(wrongAnswer)) {
        wrongAnswer = Math.round(answer * (Math.random() * 0.5 + 1.25)); // 1.25 - 1.75 arası
      }
      
      // Bu da aynıysa doğrudan ekle veya çıkar
      if (wrongAnswer === answer || options.includes(wrongAnswer)) {
        wrongAnswer = answer + Math.floor(Math.random() * 10) + 3;
      }
      
      options.push(wrongAnswer);
    }
    
    // Seçenekleri karıştır
    shuffleArray(options);
    
    // Seçenekleri ekle
    options.forEach(option => {
      const optionButton = document.createElement('button');
      optionButton.className = 'answer-option';
      optionButton.textContent = option;
      
      optionButton.addEventListener('click', function() {
        if (gameState.answerSubmitted) return;
        
        gameState.answerSubmitted = true;
        const isCorrect = option === answer;
        
        handleAnswer(isCorrect, this);
      });
      
      answerOptions.appendChild(optionButton);
    });
    
    gameState.currentTask = { type: 'patternRecognition', answer };
  }
  
  // Çalışan Bellek Görevi
  function createWorkingMemoryTask() {
    taskTitle.textContent = 'Çalışan Bellek';
    
    const difficulty = gameState.difficulty === 0 ? gameState.adaptiveDifficulty : gameState.difficulty;
    
    // Zorluk seviyesine göre görev türü ve uzunluk
    const memoryLength = 4 + difficulty;
    
    // Bellek görevi türleri
    const memoryTaskTypes = [
      // Sayı Dizisi
      () => {
        const digits = Array(memoryLength).fill(0).map(() => Math.floor(Math.random() * 10));
        
        taskDescription.textContent = 'Bu sayı dizisini hafızanıza alın ve 3 saniye sonra geri hatırlayın:';
        
        const digitContainer = document.createElement('div');
        digitContainer.className = 'digit-container';
        
        digits.forEach(digit => {
          const digitBox = document.createElement('div');
          digitBox.className = 'digit-box';
          digitBox.textContent = digit;
          digitContainer.appendChild(digitBox);
        });
        
        taskContent.appendChild(digitContainer);
        
        // 3 saniye sonra sayıları gizle ve giriş alanını göster
        setTimeout(() => {
          digitContainer.innerHTML = '';
          for (let i = 0; i < memoryLength; i++) {
            const inputBox = document.createElement('input');
            inputBox.type = 'number';
            inputBox.className = 'digit-input';
            inputBox.min = 0;
            inputBox.max = 9;
            inputBox.maxLength = 1;
            digitContainer.appendChild(inputBox);
          }
          
          const submitButton = document.createElement('button');
          submitButton.textContent = 'Kontrol Et';
          submitButton.className = 'btn btn-primary submit-memory';
          submitButton.addEventListener('click', function() {
            if (gameState.answerSubmitted) return;
            
            const inputs = document.querySelectorAll('.digit-input');
            let isCorrect = true;
            
            inputs.forEach((input, index) => {
              const userDigit = parseInt(input.value);
              
              if (isNaN(userDigit) || userDigit !== digits[index]) {
                isCorrect = false;
              }
            });
            
            gameState.answerSubmitted = true;
            handleAnswer(isCorrect, submitButton);
            
            // Doğru sayıları göster
            inputs.forEach((input, index) => {
              input.disabled = true;
              
              const userDigit = parseInt(input.value);
              if (isNaN(userDigit) || userDigit !== digits[index]) {
                input.classList.add('wrong-digit');
                input.value = digits[index];
              } else {
                input.classList.add('correct-digit');
              }
            });
          });
          
          taskContent.appendChild(submitButton);
        }, 3000);
        
        return digits.join('');
      },
      
      // Kelime Belleği
      () => {
        const words = [
          'elma', 'kitap', 'araba', 'masa', 'kalem', 'pencere', 'telefon',
          'bilgisayar', 'deniz', 'güneş', 'yıldız', 'çiçek', 'ağaç', 'kuş',
          'kedi', 'köpek', 'su', 'ateş', 'taş', 'toprak', 'hava', 'para',
          'saat', 'kapı', 'anahtar', 'ev', 'okul', 'şehir', 'ülke', 'nehir'
        ];
        
        // Zorluk seviyesine göre kelime sayısı
        const wordCount = 3 + Math.floor(difficulty / 2);
        const selectedWords = [];
        
        while (selectedWords.length < wordCount) {
          const randomIndex = Math.floor(Math.random() * words.length);
          const word = words[randomIndex];
          
          if (!selectedWords.includes(word)) {
            selectedWords.push(word);
          }
        }
        
        taskDescription.textContent = 'Bu kelimeleri hafızanıza alın ve 4 saniye sonra hatırlayın:';
        
        const wordContainer = document.createElement('div');
        wordContainer.className = 'word-memory-container';
        
        selectedWords.forEach(word => {
          const wordBox = document.createElement('div');
          wordBox.className = 'word-box';
          wordBox.textContent = word;
          wordContainer.appendChild(wordBox);
        });
        
        taskContent.appendChild(wordContainer);
        
        // 4 saniye sonra kelimeleri gizle ve seçenekleri göster
        setTimeout(() => {
          wordContainer.style.display = 'none';
          taskDescription.textContent = 'Hangi kelimeler gösterilmişti? Doğru olanları seçin:';
          
          // Gösterilen kelimelere yanlış kelimeler ekle
          const allOptions = [...selectedWords];
          
          while (allOptions.length < wordCount * 2) {
            const randomIndex = Math.floor(Math.random() * words.length);
            const word = words[randomIndex];
            
            if (!allOptions.includes(word)) {
              allOptions.push(word);
            }
          }
          
          // Seçenekleri karıştır
          shuffleArray(allOptions);
          
          const optionsContainer = document.createElement('div');
          optionsContainer.className = 'word-options-container';
          
          allOptions.forEach(word => {
            const wordOption = document.createElement('div');
            wordOption.className = 'word-option';
            wordOption.textContent = word;
            wordOption.dataset.selected = 'false';
            
            wordOption.addEventListener('click', function() {
              if (gameState.answerSubmitted) return;
              
              const isSelected = this.dataset.selected === 'true';
              this.dataset.selected = isSelected ? 'false' : 'true';
              
              if (isSelected) {
                this.classList.remove('selected');
              } else {
                this.classList.add('selected');
              }
            });
            
            optionsContainer.appendChild(wordOption);
          });
          
          taskContent.appendChild(optionsContainer);
          
          const submitButton = document.createElement('button');
          submitButton.textContent = 'Kontrol Et';
          submitButton.className = 'btn btn-primary submit-memory';
          submitButton.addEventListener('click', function() {
            if (gameState.answerSubmitted) return;
            
            const selectedOptions = document.querySelectorAll('.word-option[data-selected="true"]');
            let correctCount = 0;
            let wrongCount = 0;
            
            selectedOptions.forEach(option => {
              if (selectedWords.includes(option.textContent)) {
                correctCount++;
                option.classList.add('correct-word');
              } else {
                wrongCount++;
                option.classList.add('wrong-word');
              }
            });
            
            // Seçilmemiş doğru kelimeleri işaretle
            document.querySelectorAll('.word-option').forEach(option => {
              if (option.dataset.selected === 'false' && selectedWords.includes(option.textContent)) {
                option.classList.add('missed-word');
              }
              
              option.style.pointerEvents = 'none';
            });
            
            const isCorrect = correctCount === selectedWords.length && wrongCount === 0;
            
            gameState.answerSubmitted = true;
            handleAnswer(isCorrect, submitButton);
          });
          
          taskContent.appendChild(submitButton);
        }, 4000);
        
        return selectedWords.join(',');
      }
    ];
    
    // Zorluk seviyesine göre görev seç
    const taskIndex = Math.min(Math.floor(Math.random() * memoryTaskTypes.length), memoryTaskTypes.length - 1);
    const answer = memoryTaskTypes[taskIndex]();
    
    gameState.currentTask = { type: 'workingMemory', answer };
  }
  
  // Mantık Yürütme Görevi
  function createLogicalReasoningTask() {
    taskTitle.textContent = 'Mantık Yürütme';
    
    const difficulty = gameState.difficulty === 0 ? gameState.adaptiveDifficulty : gameState.difficulty;
    
    // Mantık soruları ve cevapları
    const logicalTasks = [
      {
        question: "A her zaman B'den önce gelir. C her zaman D'den sonra gelir. E her zaman C'den önce gelir. Hangisi kesinlikle doğrudur?",
        options: [
          "A, E'den önce gelir",
          "B, D'den sonra gelir",
          "D, E'den önce gelir",
          "E, D'den önce gelemez"
        ],
        answer: 3,
        level: 1
      },
      {
        question: "Bir sayı dizisinde her sayı kendinden önceki iki sayının toplamıdır. Dizi 2, 3 ile başlarsa, 7. sayı nedir?",
        options: ["21", "34", "55", "89"],
        answer: 0,
        level: 2
      },
      {
        question: "Beş arkadaş yan yana oturuyor. Ali, Veli'nin solundadır. Ayşe, Can'ın sağındadır. Can, Deniz'in solundadır. Deniz en sağdadır. Soldan sağa doğru sıralama nasıldır?",
        options: [
          "Ali, Veli, Ayşe, Can, Deniz", 
          "Veli, Ali, Can, Ayşe, Deniz", 
          "Ali, Veli, Can, Ayşe, Deniz", 
          "Veli, Ali, Ayşe, Can, Deniz"
        ],
        answer: 1,
        level: 3
      },
      {
        question: "A, B'den daha yaşlıdır. C, D'den daha gençtir. E, A'dan daha yaşlıdır. D, B'den daha gençtir. Yaşça en büyükten en küçüğe doğru sıralama nedir?",
        options: [
          "E, A, B, C, D",
          "E, A, B, D, C",
          "E, A, C, B, D",
          "A, E, B, C, D"
        ],
        answer: 1,
        level: 4
      },
      {
        question: "Bir manav, elmalarını 3'erli gruplandırdığında 2 elma, 4'erli gruplandırdığında 1 elma, 5'erli gruplandırdığında 3 elma artıyor. Bu manav en az kaç elmaya sahiptir?",
        options: ["38", "58", "68", "78"],
        answer: 0,
        level: 5
      }
    ];
    
    // Zorluk seviyesine uygun soruları filtrele
    const suitableTasks = logicalTasks.filter(task => task.level <= difficulty);
    const selectedTask = suitableTasks[Math.floor(Math.random() * suitableTasks.length)];
    
    // Görevi göster
    taskDescription.textContent = selectedTask.question;
    
    // Seçenekleri ekle
    selectedTask.options.forEach((option, index) => {
      const optionButton = document.createElement('button');
      optionButton.className = 'answer-option';
      optionButton.textContent = option;
      
      optionButton.addEventListener('click', function() {
        if (gameState.answerSubmitted) return;
        
        gameState.answerSubmitted = true;
        const isCorrect = index === selectedTask.answer;
        
        handleAnswer(isCorrect, this);
      });
      
      answerOptions.appendChild(optionButton);
    });
    
    gameState.currentTask = { type: 'logicalReasoning', answer: selectedTask.options[selectedTask.answer] };
  }
  
  // Zihinsel Hesaplama Görevi
  function createMentalCalculationTask() {
    taskTitle.textContent = 'Zihinsel Hesaplama';
    
    const difficulty = gameState.difficulty === 0 ? gameState.adaptiveDifficulty : gameState.difficulty;
    
    // Zorluk seviyesine göre işlem sayısı ve karmaşıklık
    const operationCount = 1 + Math.floor(difficulty / 2);
    const maxNumber = 10 * Math.pow(2, difficulty - 1);
    
    // İşlem seçenekleri
    const operations = ['+', '-', '×', '÷'];
    const usedOperations = [];
    
    // İlk sayıyı oluştur
    let result = Math.floor(Math.random() * maxNumber / 2) + 1;
    let expression = result.toString();
    
    // İşlemleri oluştur
    for (let i = 0; i < operationCount; i++) {
      // Rastgele işlem seç (bölmeyi zorlaştır)
      let operationIndex;
      if (difficulty < 3) {
        operationIndex = Math.floor(Math.random() * 2); // Sadece toplama ve çıkarma
      } else {
        operationIndex = Math.floor(Math.random() * operations.length);
      }
      
      const operation = operations[operationIndex];
      usedOperations.push(operation);
      
      // Sayıyı oluştur
      let number;
      
      switch (operation) {
        case '+':
          number = Math.floor(Math.random() * maxNumber / 2) + 1;
          result += number;
          break;
        case '-':
          number = Math.floor(Math.random() * result) + 1;
          result -= number;
          break;
        case '×':
          number = Math.floor(Math.random() * 9) + 2;
          result *= number;
          break;
        case '÷':
          // Tam bölünebilecek sayı bul
          const divisors = [];
          for (let j = 2; j <= result; j++) {
            if (result % j === 0) {
              divisors.push(j);
            }
          }
          
          if (divisors.length > 0) {
            number = divisors[Math.floor(Math.random() * divisors.length)];
            result /= number;
          } else {
            // Tam bölünme yoksa toplama işlemi kullan
            number = Math.floor(Math.random() * maxNumber / 2) + 1;
            result += number;
            usedOperations[usedOperations.length - 1] = '+';
          }
          break;
      }
      
      // İfadeyi güncelle
      expression += ` ${usedOperations[i]} ${number}`;
    }
    
    // Görevi göster
    taskDescription.textContent = 'Bu işlemin sonucu nedir?';
    
    const expressionElement = document.createElement('div');
    expressionElement.className = 'math-expression';
    expressionElement.textContent = expression + ' = ?';
    taskContent.appendChild(expressionElement);
    
    // Yanıt seçeneklerini oluştur
    const options = [result];
    
    // Yanlış cevaplar ekle
    while (options.length < 4) {
      // Doğru cevaba yakın rasgele yanıt oluştur
      const offset = Math.floor(Math.random() * (result / 2)) + 1;
      const isAddition = Math.random() > 0.5;
      
      const wrongAnswer = isAddition ? result + offset : Math.max(1, result - offset);
      
      if (!options.includes(wrongAnswer)) {
        options.push(wrongAnswer);
      }
    }
    
    // Seçenekleri karıştır
    shuffleArray(options);
    
    // Seçenekleri ekle
    options.forEach(option => {
      const optionButton = document.createElement('button');
      optionButton.className = 'answer-option';
      optionButton.textContent = option;
      
      optionButton.addEventListener('click', function() {
        if (gameState.answerSubmitted) return;
        
        gameState.answerSubmitted = true;
        const isCorrect = option === result;
        
        handleAnswer(isCorrect, this);
      });
      
      answerOptions.appendChild(optionButton);
    });
    
    gameState.currentTask = { type: 'mentalCalculation', answer: result };
  }
  
  // Uzamsal Algı Görevi
  function createSpatialPerceptionTask() {
    taskTitle.textContent = 'Uzamsal Algı';
    
    const difficulty = gameState.difficulty === 0 ? gameState.adaptiveDifficulty : gameState.difficulty;
    
    // Uzamsal görev türleri
    const spatialTaskTypes = [
      // Şekil Döndürme
      () => {
        taskDescription.textContent = 'Soldaki şeklin döndürülmüş hali hangisidir?';
        
        // Basit geometrik şekiller
        const shapes = [
          '<polygon points="10,10 40,10 40,40 10,40" style="fill:#6a5ae0" />',
          '<polygon points="10,10 40,10 25,40" style="fill:#6a5ae0" />',
          '<circle cx="25" cy="25" r="20" style="fill:#6a5ae0" />',
          '<polygon points="25,5 45,25 25,45 5,25" style="fill:#6a5ae0" />',
          '<polygon points="5,5 45,5 45,45 5,45 25,25" style="fill:#6a5ae0" />'
        ];
        
        // Zorluğa göre şekiller ekle
        const mainShape = shapes[Math.floor(Math.random() * shapes.length)];
        
        // Şekle ek detaylar ekle (zorluğa göre)
        let enhancedShape = `<svg width="50" height="50" viewBox="0 0 50 50">
          ${mainShape}`;
        
        for (let i = 0; i < difficulty; i++) {
          const x = Math.floor(Math.random() * 30) + 10;
          const y = Math.floor(Math.random() * 30) + 10;
          const size = Math.floor(Math.random() * 5) + 3;
          
          enhancedShape += `<circle cx="${x}" cy="${y}" r="${size}" style="fill:#ffffff" />`;
        }
        
        enhancedShape += `</svg>`;
        
        // Ana şekli göster
        const shapeContainer = document.createElement('div');
        shapeContainer.className = 'spatial-task-container';
        
        const sourceShape = document.createElement('div');
        sourceShape.className = 'source-shape';
        sourceShape.innerHTML = enhancedShape;
        
        shapeContainer.appendChild(sourceShape);
        taskContent.appendChild(shapeContainer);
        
        // Farklı rotasyonlarda seçenekler oluştur
        const rotations = [90, 180, 270];
        const correctRotation = rotations[Math.floor(Math.random() * rotations.length)];
        
        const options = [correctRotation];
        while (options.length < 4) {
          const randomRotation = Math.floor(Math.random() * 360);
          if (!options.includes(randomRotation)) {
            options.push(randomRotation);
          }
        }
        
        shuffleArray(options);
        
        // Seçenekleri göster
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'shape-options-container';
        
        options.forEach(rotation => {
          const optionWrapper = document.createElement('div');
          optionWrapper.className = 'shape-option-wrapper';
          
          const optionShape = document.createElement('div');
          optionShape.className = 'shape-option';
          optionShape.innerHTML = enhancedShape;
          optionShape.style.transform = `rotate(${rotation}deg)`;
          
          optionShape.addEventListener('click', function() {
            if (gameState.answerSubmitted) return;
            
            gameState.answerSubmitted = true;
            const isCorrect = rotation === correctRotation;
            
            handleAnswer(isCorrect, optionWrapper);
          });
          
          optionWrapper.appendChild(optionShape);
          optionsContainer.appendChild(optionWrapper);
        });
        
        shapeContainer.appendChild(optionsContainer);
        
        return correctRotation;
      },
      
      // Ayna Görüntüsü Bulma
      () => {
        taskDescription.textContent = 'Hangisi soldaki şeklin ayna görüntüsü DEĞİLDİR?';
        
        // Zorluk seviyesine göre şekil karmaşıklığı
        const complexity = Math.min(difficulty + 1, 5);
        
        // SVG şekli oluştur
        let svgContent = '';
        const svgSize = 50;
        
        // Karmaşıklığa göre rastgele şekiller ekle
        for (let i = 0; i < complexity; i++) {
          const x1 = Math.floor(Math.random() * (svgSize - 10)) + 5;
          const y1 = Math.floor(Math.random() * (svgSize - 10)) + 5;
          const x2 = Math.floor(Math.random() * (svgSize - 10)) + 5;
          const y2 = Math.floor(Math.random() * (svgSize - 10)) + 5;
          
          svgContent += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6a5ae0" stroke-width="2" />`;
          
          // Ekstra şekiller
          if (Math.random() > 0.5) {
            const cx = Math.floor(Math.random() * (svgSize - 10)) + 5;
            const cy = Math.floor(Math.random() * (svgSize - 10)) + 5;
            const r = Math.floor(Math.random() * 4) + 2;
            
            svgContent += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#6a5ae0" />`;
          }
        }
        
        const originalSvg = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">
          ${svgContent}
        </svg>`;
        
        // Ayna görüntüsü
        const mirrorSvg = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">
          <g transform="scale(-1, 1) translate(-${svgSize}, 0)">
            ${svgContent}
          </g>
        </svg>`;
        
        // Yanlış ayna görüntüleri (döndürülmüş versiyonlar)
        const rotatedSvgs = [90, 180, 270].map(angle => {
          return `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">
            <g transform="rotate(${angle}, ${svgSize/2}, ${svgSize/2})">
              ${svgContent}
            </g>
          </svg>`;
        });
        
        // Ana şekli göster
        const shapeContainer = document.createElement('div');
        shapeContainer.className = 'spatial-task-container';
        
        const sourceShape = document.createElement('div');
        sourceShape.className = 'source-shape';
        sourceShape.innerHTML = originalSvg;
        
        shapeContainer.appendChild(sourceShape);
        taskContent.appendChild(shapeContainer);
        
        // Seçenekleri göster (3 ayna, 1 ayna olmayan)
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'shape-options-container';
        
        // Doğru cevap (ayna olmayan) indeksini seçme
        const correctIndex = Math.floor(Math.random() * 4);
        let options = [];
        
        for (let i = 0; i < 4; i++) {
          const optionWrapper = document.createElement('div');
          optionWrapper.className = 'shape-option-wrapper';
          
          const optionShape = document.createElement('div');
          optionShape.className = 'shape-option';
          
          if (i === correctIndex) {
            // Ayna olmayan (rastgele döndürülmüş versiyonlardan biri)
            const randomRotatedIndex = Math.floor(Math.random() * rotatedSvgs.length);
            optionShape.innerHTML = rotatedSvgs[randomRotatedIndex];
            options.push('rotated');
          } else {
            // Ayna görüntüsü
            optionShape.innerHTML = mirrorSvg;
            options.push('mirror');
          }
          
          optionWrapper.appendChild(optionShape);
          
          optionWrapper.addEventListener('click', function() {
            if (gameState.answerSubmitted) return;
            
            gameState.answerSubmitted = true;
            const isCorrect = i === correctIndex;
            
            handleAnswer(isCorrect, optionWrapper);
          });
          
          optionsContainer.appendChild(optionWrapper);
        }
        
        shapeContainer.appendChild(optionsContainer);
        
        return correctIndex;
      }
    ];
    
    // Zorluk seviyesine göre görev türü
    const taskType = Math.floor(Math.random() * spatialTaskTypes.length);
    const answer = spatialTaskTypes[taskType]();
    
    gameState.currentTask = { type: 'spatialPerception', answer };
  }
  
  // Cevabı işle
  function handleAnswer(isCorrect, buttonElement) {
    // Görsel geri bildirim
    const allButtons = document.querySelectorAll('.answer-option, .shape-option-wrapper, .word-option');
    allButtons.forEach(button => {
      button.style.pointerEvents = 'none';
    });
    
    if (buttonElement) {
      if (isCorrect) {
        buttonElement.classList.add('correct-answer');
      } else {
        buttonElement.classList.add('wrong-answer');
        
        // Doğru cevabı gösterme (mümkünse)
        if (gameState.currentTask.type === 'patternRecognition' || 
            gameState.currentTask.type === 'mentalCalculation' ||
            gameState.currentTask.type === 'logicalReasoning') {
          
          const correctOption = Array.from(allButtons).find(
            button => button.textContent == gameState.currentTask.answer
          );
          
          if (correctOption) {
            correctOption.classList.add('correct-answer');
          }
        }
      }
    }
    
    // Ses efekti
    playSound(isCorrect ? 'correct' : 'wrong');
    
    // Puan ve combo hesapla
    if (isCorrect) {
      // Zorluk seviyesi puanı
      const difficultyValue = gameState.difficulty === 0 ? 
        gameState.adaptiveDifficulty : gameState.difficulty;
      
      // Puan hesapla: temel puan + zorluk bonusu + combo bonusu
      const baseScore = 10;
      const difficultyBonus = difficultyValue * 5;
      const comboBonus = gameState.combo * 2;
      
      const pointsGained = baseScore + difficultyBonus + comboBonus;
      
      gameState.score += pointsGained;
      gameState.combo += 1;
      gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
      
      // Adaptif zorluk için doğru cevapları sayma
      if (gameState.difficulty === 0) {
        gameState.correctAnswers++;
      }
      
      // Belirli combo sayısına ulaşıldığında seviye artışı
      if (gameState.combo === 3) {
        gameState.level += 1;
        gameState.timeRemaining += 15; // Bonus süre
        playSound('levelUp');
        showTaskMessage('Seviye Atladınız! +15 saniye', 'level-up');
      }
      
      showTaskMessage(`+${pointsGained} puan kazandınız!`, 'success');
    } else {
      gameState.combo = 0;
      
      // Adaptif zorluk için yanlış cevapları sayma
      if (gameState.difficulty === 0) {
        gameState.wrongAnswers++;
      }
      
      showTaskMessage('Yanlış cevap!', 'error');
    }
    
    // Ekranı güncelle
    brainGymScore.textContent = gameState.score;
    brainGymLevel.textContent = gameState.level;
    brainGymCombo.textContent = gameState.combo;
    
    // Sonraki görev butonunu etkinleştir
    nextTaskBtn.classList.add('pulse-animation');
  }
  
  // Görev mesajı göster
  function showTaskMessage(message, type) {
    const messageElement = document.createElement('div');
    messageElement.className = `task-message ${type}`;
    messageElement.textContent = message;
    
    const messageContainer = document.getElementById('taskMessages');
    messageContainer.appendChild(messageElement);
    
    // Mesajı 3 saniye sonra kaldır
    setTimeout(() => {
      messageElement.classList.add('fade-out');
      setTimeout(() => {
        messageContainer.removeChild(messageElement);
      }, 500);
    }, 3000);
  }
  
  // Oyunu bitir
  function endGame() {
    playSound('gameOver');
    gameState.isPlaying = false;
    
    // Sonuç ekranını hazırla
    finalScore.textContent = gameState.score;
    finalLevel.textContent = gameState.level;
    finalCombo.textContent = gameState.maxCombo;
    
    // Ekranı göster
    brainGymGameplay.classList.add('d-none');
    resultScreen.style.display = 'block';
    
    // Skoru kaydet
    saveScore();
  }
  
  // Skoru sunucuya gönder
  function saveScore() {
    fetch('/save_score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: 'brainGym',
        score: gameState.score
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
  
  // Yardımcı fonksiyonlar
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
});
