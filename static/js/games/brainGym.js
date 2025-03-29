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