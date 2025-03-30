/**
 * Sayı Dizisi Oyunu - 2.0
 * 
 * Matematiksel akıl yürütme ve örüntü tanıma becerilerini geliştiren profesyonel oyun.
 * 
 * Özellikler:
 * - Gelişmiş kullanıcı arayüzü ve etkileşim
 * - Çeşitli zorluk seviyelerinde matematiksel örüntüler
 * - Gerçek zamanlı puanlama ve seviye sistemi
 * - İpucu mekanizması
 * - Sesli geri bildirimler ve animasyonlar
 * - Mobil cihazlarla uyumlu responsive tasarım
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const gameIntro = document.getElementById('game-intro');
  const gameArea = document.getElementById('game-area');
  const resultScreen = document.getElementById('result-screen');
  const startGameButton = document.getElementById('start-game');
  const backToMenuButton = document.getElementById('back-to-menu');
  const restartGameButton = document.getElementById('restart-game');
  const hintButton = document.getElementById('hint-button');
  const soundToggleButton = document.getElementById('sound-toggle');
  const playAgainButton = document.getElementById('play-again');
  const mainMenuButton = document.getElementById('main-menu');
  const difficultyOptions = document.querySelectorAll('.difficulty-option');
  
  // Oyun Göstergeleri
  const levelDisplay = document.getElementById('level-display');
  const scoreDisplay = document.getElementById('score-display');
  const timeDisplay = document.getElementById('time-display');
  const levelInfo = document.getElementById('level-info');
  const sequenceDisplay = document.getElementById('sequence-display');
  const answerOptions = document.getElementById('answer-options');
  const hintContent = document.getElementById('hint-content');
  const timerBar = document.getElementById('timer-bar');
  
  // Sonuç Ekranı Elementleri
  const resultTitle = document.getElementById('result-title');
  const resultMessage = document.getElementById('result-message');
  const finalScoreDisplay = document.getElementById('final-score');
  const correctAnswersDisplay = document.getElementById('correct-answers');
  const maxLevelDisplay = document.getElementById('max-level');
  
  // Oyun Durumu
  const gameState = {
    isPlaying: false,
    isPaused: false,
    soundEnabled: true,
    difficulty: 'medium',
    level: 1,
    score: 0,
    correctAnswers: 0,
    hintsUsed: 0,
    timeLeft: 30,
    maxTime: 30,
    timer: null,
    sequence: [],
    questionIndex: null,
    correctAnswer: null,
    answerOptions: [],
    timerBarAnimation: null
  };
  
  // Ses Efektleri
  const sounds = {
    correct: new Audio(),
    incorrect: new Audio(),
    hint: new Audio(),
    levelUp: new Audio(),
    gameOver: new Audio(),
    click: new Audio(),
    countdown: new Audio()
  };
  
  // Ses dosyalarını yükle
  function initSounds() {
    sounds.correct.src = 'data:audio/mp3;base64,SUQzAwAAAAAAD1RJVDIAAAAGAAAASFNETkcAVElUMgAAAAYAAABIU0ROR//uQwAAS01qyFUZYAIpgBgCkDmA2+LAABj/AAA8/0/5G0JHREVHCAAAAAAAAAAAAAAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwBLkAAAAAAAAAABRAJAXDQQABcAAADmA2+LAJzf//////////////////uQwAAS2GbVb1mFkCUmAGALIOYDbosAEMo/AABx/FP4haCiIiIiIiIiIiIiIiIiIiIiIiIiERERERERI1NCVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVNNNNNNNTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
    sounds.incorrect.src = 'data:audio/mp3;base64,SUQzAwAAAAAAD1RJVDIAAAAGAAAASFNETkcAVElUMgAAAAYAAABIU0ROR//uQwAAS3GbVf1nDkCUmAGAKwOYDbosAEM488AHH8U/iFoKIiIiIiIiIiIiIiIiIiIiIiIiIREREREREjU0JVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU000001MTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==';
    sounds.hint.src = 'data:audio/mp3;base64,SUQzAwAAAAAAD1RJVDIAAAAGAAAASFNETkcAVElUMgAAAAYAAABIU0ROR//uQwAAS39Crh9jTkAhigAAAABQ7YtgAB//gAA//0/7HoZER0RIIAAAAAAAAAAAAABAAAAAAABBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVNNTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
    sounds.levelUp.src = 'data:audio/mp3;base64,SUQzAwAAAAAAD1RJVDIAAAAGAAAASFNETkcAVElUMgAAAAYAAABIU0ROR//uQwAAS2cDUN2NQQAhigHAAwOYDbosAAD/4AAP/9P+x6GTJJJJIgAAAAAAAABAAAAAAAAAAAVUAAAAAAAAAAAAAAAACQQCAUSV//////////////////////////8jUxBTUzMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
    sounds.gameOver.src = 'data:audio/mp3;base64,SUQzAwAAAAAAD1RJVDIAAAAGAAAASFNETkcAVElUMgAAAAYAAABIU0ROR//uQwAAS26Sx/9hTkAhigGAAwOYDbosAAD/4AAP/9P+x6GUJJJ0AAAAAAAAAAAgAAAAAAAAQAAAAAAAAAABVVVVVVVVVVUlIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIlNNTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
    sounds.click.src = 'data:audio/mp3;base64,SUQzAwAAAAAAD1RJVDIAAAAGAAAASFNETkcAVElUMgAAAAYAAABIU0ROR//uQwAAS01qyFkZYAIpgBgCkDmA2+LAABj/AAA8/0/5G0JHREVHCAAAAAAAAAAAAAAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwBLkAAAAAAAAAABRAJAXDQQABcAAADmA2+LAJzf//////////////////uQwEAAAABAAABAAAAAAAAAABAAAAAAAQICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA=';
    sounds.countdown.src = 'data:audio/mp3;base64,SUQzAwAAAAAAD1RJVDIAAAAGAAAASFNETkcAVElUMgAAAAYAAABIU0ROR//uQwAASzZm5/1kyAB0AAiAOwOYDbosIAKP4AAn/9P+B1ARIiIEAAAAAAAAAAAAQAAAAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVNNTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==';
  }

  // Zorluk Seviyelerine Göre Örüntüler
  const difficultySettings = {
    easy: {
      patterns: [
        { type: 'addition', desc: 'Her sayıya sabit bir değer ekle', min: 1, max: 5 },
        { type: 'subtraction', desc: 'Her sayıdan sabit bir değer çıkar', min: 1, max: 5 },
        { type: 'alternate_add_sub', desc: 'Dönüşümlü olarak ekle ve çıkar', min: 1, max: 3 },
      ],
      sequenceLength: 5,
      options: 4,
      timePerLevel: 25
    },
    medium: {
      patterns: [
        { type: 'addition', desc: 'Her sayıya sabit bir değer ekle', min: 3, max: 10 },
        { type: 'subtraction', desc: 'Her sayıdan sabit bir değer çıkar', min: 3, max: 10 },
        { type: 'multiplication', desc: 'Her sayıyı sabit bir değerle çarp', min: 2, max: 3 },
        { type: 'division', desc: 'Her sayıyı sabit bir değere böl', min: 2, max: 3 },
        { type: 'square', desc: 'Sayıların karesi', min: 0, max: 0 },
        { type: 'increasing_addition', desc: 'Artan toplama değeri', min: 1, max: 3 },
      ],
      sequenceLength: 6,
      options: 5,
      timePerLevel: 30
    },
    hard: {
      patterns: [
        { type: 'multiplication', desc: 'Her sayıyı sabit bir değerle çarp', min: 2, max: 5 },
        { type: 'division', desc: 'Her sayıyı sabit bir değere böl', min: 2, max: 4 },
        { type: 'square', desc: 'Sayıların karesi', min: 0, max: 0 },
        { type: 'cube', desc: 'Sayıların küpü', min: 0, max: 0 },
        { type: 'increasing_addition', desc: 'Artan toplama değeri', min: 2, max: 5 },
        { type: 'fibonacci', desc: 'Fibonacci benzeri dizi (son iki sayı toplamı)', min: 0, max: 0 },
        { type: 'alternating_operations', desc: 'Dönüşümlü işlemler (çarpma ve toplama)', min: 2, max: 4 },
      ],
      sequenceLength: 7,
      options: 6,
      timePerLevel: 40
    }
  };

  // Zorluk seviyesini ayarla
  difficultyOptions.forEach(option => {
    option.addEventListener('click', function() {
      const selectedDifficulty = this.dataset.difficulty;
      gameState.difficulty = selectedDifficulty;
      
      // Aktif sınıfını diğer butonlardan kaldır
      difficultyOptions.forEach(btn => btn.classList.remove('active'));
      
      // Seçilen butona aktif sınıfını ekle
      this.classList.add('active');
      
      // Ses efekti
      playSound('click');
    });
  });

  // Oyunu başlat
  startGameButton.addEventListener('click', function() {
    gameIntro.style.display = 'none';
    gameArea.style.display = 'block';
    
    // Oyunu başlat
    startGame();
    
    // Ses efekti
    playSound('click');
  });

  // Ana menüye dön
  backToMenuButton.addEventListener('click', function() {
    stopGame();
    gameArea.style.display = 'none';
    gameIntro.style.display = 'block';
    
    // Ses efekti
    playSound('click');
  });

  // Oyunu yeniden başlat
  restartGameButton.addEventListener('click', function() {
    stopGame();
    startGame();
    
    // Ses efekti
    playSound('click');
  });

  // İpucu göster
  hintButton.addEventListener('click', function() {
    showHint();
    
    // Ses efekti
    playSound('hint');
  });

  // Sesi aç/kapat
  soundToggleButton.addEventListener('click', function() {
    toggleSound();
  });

  // Tekrar oyna
  playAgainButton.addEventListener('click', function() {
    resultScreen.style.display = 'none';
    startGame();
    
    // Ses efekti
    playSound('click');
  });

  // Ana menüye dön
  mainMenuButton.addEventListener('click', function() {
    resultScreen.style.display = 'none';
    gameArea.style.display = 'none';
    gameIntro.style.display = 'block';
    
    // Ses efekti
    playSound('click');
  });

  // Oyunu başlat
  function startGame() {
    // Oyun durumunu sıfırla
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.level = 1;
    gameState.score = 0;
    gameState.correctAnswers = 0;
    gameState.hintsUsed = 0;
    
    // Ekranı güncelle
    updateGameUI();
    
    // İlk seviyeyi oluştur
    generateLevel();
    
    // Sayıları göster
    renderSequence();
    
    // Zamanı başlat
    startTimer();
  }

  // Oyunu durdur
  function stopGame() {
    gameState.isPlaying = false;
    clearInterval(gameState.timer);
    
    if (gameState.timerBarAnimation) {
      cancelAnimationFrame(gameState.timerBarAnimation);
      gameState.timerBarAnimation = null;
    }
  }

  // Seviye oluştur
  function generateLevel() {
    const settings = difficultySettings[gameState.difficulty];
    
    // Rastgele bir örüntü seç
    const patternIndex = Math.floor(Math.random() * settings.patterns.length);
    const pattern = settings.patterns[patternIndex];
    
    // Dizi için başlangıç değeri seç
    let start;
    if (gameState.difficulty === 'easy') {
      start = getRandomInt(1, 10);
    } else if (gameState.difficulty === 'medium') {
      start = getRandomInt(2, 15);
    } else {
      start = getRandomInt(2, 20);
    }
    
    // Örüntü parametrelerini seç
    let param;
    if (pattern.min === pattern.max) {
      param = pattern.min;
    } else {
      param = getRandomInt(pattern.min, pattern.max);
    }
    
    // Diziyi oluştur
    const sequence = [];
    let currentValue = start;
    
    for (let i = 0; i < settings.sequenceLength; i++) {
      sequence.push(currentValue);
      
      // Sonraki sayıyı hesapla
      switch (pattern.type) {
        case 'addition':
          currentValue += param;
          break;
        case 'subtraction':
          currentValue -= param;
          break;
        case 'multiplication':
          currentValue *= param;
          break;
        case 'division':
          currentValue /= param;
          break;
        case 'square':
          currentValue = Math.pow(i + 2, 2);
          break;
        case 'cube':
          currentValue = Math.pow(i + 2, 3);
          break;
        case 'increasing_addition':
          currentValue += (i + 1) * param;
          break;
        case 'fibonacci':
          if (i === 0) {
            currentValue = 1;
          } else if (i === 1) {
            currentValue = 1;
          } else {
            currentValue = sequence[i - 1] + sequence[i - 2];
          }
          break;
        case 'alternate_add_sub':
          if (i % 2 === 0) {
            currentValue += param;
          } else {
            currentValue -= param;
          }
          break;
        case 'alternating_operations':
          if (i % 2 === 0) {
            currentValue = currentValue * param;
          } else {
            currentValue = currentValue + param;
          }
          break;
      }
    }
    
    // Rastgele bir sayıyı gizle
    const questionIndex = Math.floor(Math.random() * settings.sequenceLength);
    const correctAnswer = sequence[questionIndex];
    sequence[questionIndex] = '?';
    
    // Oyun durumunu güncelle
    gameState.sequence = sequence;
    gameState.questionIndex = questionIndex;
    gameState.correctAnswer = correctAnswer;
    gameState.pattern = pattern;
    
    // Cevap seçeneklerini oluştur
    generateAnswerOptions(correctAnswer, settings.options);
    
    // Seviye bilgisini güncelle
    levelInfo.textContent = `Seviye ${gameState.level}: Eksik sayıyı bulun`;
    
    // Süreyi ayarla
    gameState.timeLeft = settings.timePerLevel + (gameState.level - 1) * 3;
    gameState.maxTime = gameState.timeLeft;
    
    // İpucu içeriğini gizle
    hintContent.style.display = 'none';
  }

  // Sayı dizisini ekrana render et
  function renderSequence() {
    sequenceDisplay.innerHTML = '';
    
    gameState.sequence.forEach((number, index) => {
      const numberElement = document.createElement('div');
      numberElement.className = number === '?' ? 'sequence-number question-mark' : 'sequence-number';
      numberElement.textContent = number;
      sequenceDisplay.appendChild(numberElement);
    });
  }

  // Cevap seçeneklerini oluştur
  function generateAnswerOptions(correctAnswer, numOptions) {
    // Doğru cevap dahil farklı seçenekler oluştur
    let options = [correctAnswer];
    
    // Geçerli seçenekler için boundary değerleri
    const min = Math.max(1, correctAnswer - 20);
    const max = correctAnswer + 20;
    
    // Diğer seçenekleri ekle
    while (options.length < numOptions) {
      let option;
      if (correctAnswer < 10) {
        option = getRandomInt(1, 20);
      } else if (correctAnswer < 50) {
        option = getRandomInt(correctAnswer - 15, correctAnswer + 15);
      } else {
        option = getRandomInt(correctAnswer - 30, correctAnswer + 30);
      }
      
      // Tekrar etmiyorsa ekle
      if (!options.includes(option) && option >= min && option <= max) {
        options.push(option);
      }
    }
    
    // Seçenekleri karıştır
    options = shuffleArray(options);
    
    // Oyun durumunu güncelle
    gameState.answerOptions = options;
    
    // Seçenekleri ekrana render et
    renderAnswerOptions(options);
  }

  // Cevap seçeneklerini ekrana render et
  function renderAnswerOptions(options) {
    answerOptions.innerHTML = '';
    
    options.forEach(option => {
      const optionElement = document.createElement('div');
      optionElement.className = 'answer-option';
      optionElement.textContent = option;
      
      // Tıklandığında cevabı kontrol et
      optionElement.addEventListener('click', function() {
        checkAnswer(option);
      });
      
      answerOptions.appendChild(optionElement);
    });
  }

  // Cevabı kontrol et
  function checkAnswer(selectedAnswer) {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    const isCorrect = selectedAnswer === gameState.correctAnswer;
    
    // Cevabı görsel olarak işaretle
    markAnswer(selectedAnswer, isCorrect);
    
    if (isCorrect) {
      // Sesi çal
      playSound('correct');
      
      // Doğru sayısını artır
      gameState.correctAnswers++;
      
      // Puanı hesapla ve ekle
      const timeBonus = Math.floor((gameState.timeLeft / gameState.maxTime) * 50);
      const levelBonus = gameState.level * 10;
      const basePoints = 50;
      const hintPenalty = gameState.hintsUsed * 10;
      
      const pointsGained = basePoints + timeBonus + levelBonus - hintPenalty;
      gameState.score += pointsGained;
      
      // 1 saniye bekle ve sonraki seviyeye geç
      setTimeout(() => {
        nextLevel();
      }, 1000);
    } else {
      // Sesi çal
      playSound('incorrect');
      
      // Oyunu bitir
      setTimeout(() => {
        endGame();
      }, 1000);
    }
  }

  // Seçeneği doğru/yanlış olarak işaretle
  function markAnswer(selectedAnswer, isCorrect) {
    // Tüm seçenekleri bul
    const optionElements = document.querySelectorAll('.answer-option');
    
    optionElements.forEach(element => {
      if (parseInt(element.textContent) === selectedAnswer) {
        // Seçilen cevabı işaretle
        element.classList.add(isCorrect ? 'correct' : 'incorrect');
      }
      
      // Seçenekleri devre dışı bırak
      element.style.pointerEvents = 'none';
    });
    
    // Doğru cevabı göster (eğer yanlış cevap verildiyse)
    if (!isCorrect) {
      optionElements.forEach(element => {
        if (parseInt(element.textContent) === gameState.correctAnswer) {
          setTimeout(() => {
            element.classList.add('correct');
          }, 500);
        }
      });
    }
  }

  // İpucu göster
  function showHint() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    // İpucu metnini oluştur
    let hintText = '';
    const pattern = gameState.pattern;
    
    switch (pattern.type) {
      case 'addition':
        hintText = `İpucu: Her sayıya ${pattern.min} eklenmiş.`;
        break;
      case 'subtraction':
        hintText = `İpucu: Her sayıdan ${pattern.min} çıkarılmış.`;
        break;
      case 'multiplication':
        hintText = `İpucu: Her sayı ${pattern.min} ile çarpılmış.`;
        break;
      case 'division':
        hintText = `İpucu: Her sayı ${pattern.min}'e bölünmüş.`;
        break;
      case 'square':
        hintText = `İpucu: Bu dizi, sayıların kareleri.`;
        break;
      case 'cube':
        hintText = `İpucu: Bu dizi, sayıların küpleri.`;
        break;
      case 'increasing_addition':
        hintText = `İpucu: Her adımda, artan bir değer ekleniyor.`;
        break;
      case 'fibonacci':
        hintText = `İpucu: Her sayı, önceki iki sayının toplamı.`;
        break;
      case 'alternate_add_sub':
        hintText = `İpucu: Dönüşümlü olarak ekleme ve çıkarma işlemi uygulanmış.`;
        break;
      case 'alternating_operations':
        hintText = `İpucu: Dönüşümlü olarak çarpma ve toplama işlemi yapılmış.`;
        break;
    }
    
    // İpucu içeriğini güncelle ve göster
    hintContent.textContent = hintText;
    hintContent.style.display = 'block';
    
    // İpucu kullanımını kaydet
    gameState.hintsUsed++;
  }

  // Zamanı başlat
  function startTimer() {
    // Mevcut zamanlayıcıyı temizle
    clearInterval(gameState.timer);
    
    // Timer değerini görüntüle
    updateTimeDisplay();
    
    // Zamanlayıcıyı başlat
    gameState.timer = setInterval(() => {
      gameState.timeLeft--;
      updateTimeDisplay();
      
      // 5 saniyeden az kaldıysa geri sayım sesi
      if (gameState.timeLeft <= 5 && gameState.timeLeft > 0) {
        playSound('countdown');
      }
      
      // Süre bittiyse oyunu bitir
      if (gameState.timeLeft <= 0) {
        clearInterval(gameState.timer);
        endGame();
      }
    }, 1000);
    
    // İlerleme çubuğunu animasyonla hareket ettir
    animateTimerBar();
  }

  // İlerleme çubuğu animasyonu
  function animateTimerBar() {
    if (gameState.timerBarAnimation) {
      cancelAnimationFrame(gameState.timerBarAnimation);
    }
    
    const duration = gameState.timeLeft * 1000; // milliseconds
    const startTime = performance.now();
    
    function updateTimerBar(currentTime) {
      if (!gameState.isPlaying) return;
      
      const elapsedTime = currentTime - startTime;
      const progress = Math.max(0, 1 - (elapsedTime / duration));
      
      timerBar.style.transform = `scaleX(${progress})`;
      
      if (progress > 0 && gameState.isPlaying && !gameState.isPaused) {
        gameState.timerBarAnimation = requestAnimationFrame(updateTimerBar);
      }
    }
    
    gameState.timerBarAnimation = requestAnimationFrame(updateTimerBar);
  }

  // Bir sonraki seviyeye geç
  function nextLevel() {
    // Seviyeyi artır
    gameState.level++;
    
    // Seviye görünümünü güncelle
    levelDisplay.textContent = gameState.level;
    
    // Seviye sesi çal
    playSound('levelUp');
    
    // İpucu kullanımını sıfırla
    gameState.hintsUsed = 0;
    
    // Yeni seviye oluştur
    generateLevel();
    
    // Sayıları göster
    renderSequence();
    
    // Zamanı başlat
    startTimer();
    
    // UI güncelle
    updateGameUI();
  }

  // Oyunu bitir
  function endGame() {
    // Oyunu durdur
    stopGame();
    
    // Sesi çal
    playSound('gameOver');
    
    // Sonuç ekranını hazırla
    const finalScore = gameState.score;
    const correctAnswers = gameState.correctAnswers;
    const maxLevel = gameState.level;
    
    // Skor bilgilerini görüntüle
    finalScoreDisplay.textContent = finalScore;
    correctAnswersDisplay.textContent = correctAnswers;
    maxLevelDisplay.textContent = maxLevel;
    
    // Sonuç başlık ve mesajını ayarla
    if (finalScore > 500) {
      resultTitle.textContent = 'Harika!';
      resultMessage.textContent = 'Matematiksel dehanızla etkileyici bir performans sergiliyorsunuz!';
    } else if (finalScore > 200) {
      resultTitle.textContent = 'Tebrikler!';
      resultMessage.textContent = 'Örüntüleri tanımada gerçekten iyisiniz.';
    } else {
      resultTitle.textContent = 'İyi Çalışma!';
      resultMessage.textContent = 'Bir sonraki denemede daha iyi olacaksınız.';
    }
    
    // Sonuç ekranını göster
    resultScreen.style.display = 'flex';
    
    // Skoru sunucuya kaydet
    saveScore(finalScore);
  }

  // Oyun arayüzünü güncelle
  function updateGameUI() {
    levelDisplay.textContent = gameState.level;
    scoreDisplay.textContent = gameState.score;
    updateTimeDisplay();
  }

  // Zaman göstergesini güncelle
  function updateTimeDisplay() {
    timeDisplay.textContent = gameState.timeLeft;
  }

  // Skoru sunucuya kaydet
  function saveScore(score) {
    // Oyun türünü belirle
    const gameType = 'numberSequence';
    
    // Skoru sunucuya gönder
    fetch('/api/save-score', {
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

  // Sesi aç/kapat
  function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    
    // Ses ikonunu güncelle
    if (gameState.soundEnabled) {
      soundToggleButton.innerHTML = '<i class="fas fa-volume-up"></i>';
    } else {
      soundToggleButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
  }

  // Ses çal
  function playSound(soundName) {
    if (!gameState.soundEnabled) return;
    
    // Sesi baştan başlat ve çal
    if (sounds[soundName]) {
      sounds[soundName].currentTime = 0;
      sounds[soundName].play().catch(e => console.log('Sound play error:', e));
    }
  }

  // Yardımcı Fonksiyonlar
  
  // Min ve max arasında rastgele tamsayı
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Diziyi karıştır
  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // Başlangıç işlemleri
  initSounds();
});