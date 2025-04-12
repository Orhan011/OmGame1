document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const startScreen = document.getElementById('start-screen');
  const wordInput = document.getElementById('word-input');
  const submitBtn = document.getElementById('submit-word');
  const passBtn = document.getElementById('pass-button');
  const timerDisplay = document.getElementById('timer-display');
  const scoreDisplay = document.getElementById('score-display');
  const wordCounter = document.getElementById('words-counter');
  const startBtn = document.getElementById('start-game');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const finalScoreDisplay = document.getElementById('final-score');
  const wordsFoundCount = document.getElementById('words-found-count');
  const longestWordDisplay = document.getElementById('longest-word');
  const pauseBtn = document.getElementById('pause-game');
  const resumeBtn = document.getElementById('resume-game');
  const pauseOverlay = document.getElementById('pause-overlay');
  const soundToggle = document.getElementById('sound-toggle');
  const ratingText = document.getElementById('rating-text');
  const copyScoreBtn = document.getElementById('copy-score');
  const shareScoreBtn = document.getElementById('share-score');
  const riddleText = document.getElementById('riddle-text');
  const riddleNumber = document.getElementById('riddle-number');
  const attemptsLeft = document.getElementById('attempts-left');
  const riddleHints = document.getElementById('riddle-hints');
  const letterMatches = document.getElementById('letter-matches');
  const solvedRiddles = document.getElementById('solved-words-list');
  const feedbackContainer = document.getElementById('feedback-container');
  const alertContainer = document.getElementById('alert-container');

  // Game State
  let score = 0;
  let solvedWords = [];
  let timer;
  let timerInterval;
  let remainingTime = 0;
  let isGameActive = false;
  let isPaused = false;
  let gameStartTime;
  let soundEnabled = true;
  let currentRiddle = null;
  let currentRiddleIndex = 0;
  let remainingAttempts = 3;
  let longestSolvedWord = '';
  let shuffledRiddles = [];

  // Constants 
  const GAME_DURATION = 300; // 5 minutes
  const MAX_ATTEMPTS_PER_RIDDLE = 3;
  const RIDDLE_POINTS = 100; // Base points per riddle
  const ATTEMPT_BONUS = 50; // Bonus points per unused attempt

  // Turkish riddles with answers - genişletilmiş bilmece listesi
  const riddles = [
    {
      text: "Bilmece: Başı tarak, ortası direk, sonu iplik.",
      answer: "mısır"
    },
    {
      text: "Bilmece: Bir ufacık mil taşı, içi dolu baş taşı.",
      answer: "nar"
    },
    {
      text: "Bilmece: Karşıdan baktım hiç yok, yanına vardım pek çok.",
      answer: "karınca"
    },
    {
      text: "Bilmece: Altı kazan üstü kürek.",
      answer: "kaplumbağa"
    },
    {
      text: "Bilmece: Mavi atlas, iğne batmaz, makas kesmez, terzi dikmez.",
      answer: "gökyüzü"
    },
    {
      text: "Bilmece: Annesi çok nazik, babası çok kibar, yüzü beyaz, kalbi sarı.",
      answer: "yumurta"
    },
    {
      text: "Bilmece: Uzun uzun uzanır, sabah olur kısalır.",
      answer: "gölge"
    },
    {
      text: "Bilmece: Dağdan gelir taştan gelir, gözü kanlı kardeş gelir.",
      answer: "sel"
    },
    {
      text: "Bilmece: Gözleri var görmez, kulakları var duymaz.",
      answer: "bebek"
    },
    {
      text: "Bilmece: Dışı var, içi yok, tekmeyi yer, suçu yok.",
      answer: "top"
    },
    {
      text: "Bilmece: Her sabah elden ele gezer, akşam olunca eve girer.",
      answer: "gazete"
    },
    {
      text: "Bilmece: Alçacık dallı, yemesi ballı.",
      answer: "çilek"
    },
    {
      text: "Bilmece: Bir küçücük kutucuk, içi dolu incicik.",
      answer: "ağız"
    },
    {
      text: "Bilmece: Benim bir oğlum var, kat kat gömlekli.",
      answer: "soğan"
    },
    {
      text: "Bilmece: Dal üstünde kilitli sandık.",
      answer: "ceviz"
    }
  ];

  // Event Listeners
  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', submitAnswer);
  }

  if (passBtn) {
    passBtn.addEventListener('click', passRiddle);
  }

  // İpucu butonu için olay dinleyicisi ekle
  const hintButton = document.getElementById('hint-button');
  if (hintButton) {
    hintButton.addEventListener('click', showHint);
  }

  // Enter key to submit answer
  if (wordInput) {
    wordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        submitAnswer();
      }
    });
  }

  // Pause/Resume functionality
  if (pauseBtn) {
    pauseBtn.addEventListener('click', togglePause);
  }

  if (resumeBtn) {
    resumeBtn.addEventListener('click', togglePause);
  }

  // Sound toggle
  if (soundToggle) {
    soundToggle.addEventListener('click', toggleSound);
  }

  // Word counter initialization
  if (wordCounter) {
    wordCounter.textContent = '0';
  }

  // Add pulse animation to start button for visual appeal
  if (startBtn && startBtn.classList.contains('pulse-animation')) {
    startBtn.addEventListener('animationend', () => {
      startBtn.classList.remove('pulse-animation');
      setTimeout(() => {
        startBtn.classList.add('pulse-animation');
      }, 1000);
    });
  }

  // İpucu sayısı
  let hintCount = 3;
  // İpucu gösteriliyor mu?
  let isHintShowing = false;

  /**
   * İpucu gösterir - cevabın bir harfini rastgele gösterir
   */
  function showHint() {
    if (!isGameActive || !currentRiddle || isHintShowing) return;

    // İpucu kalmadı mı kontrol et
    if (hintCount <= 0) {
      showMessage('İpucu hakkınız kalmadı!', 'warning');
      return;
    }

    // İpucu sayısını azalt
    hintCount--;

    // İpucu sayısını gösteren butonu güncelle
    const hintButton = document.getElementById('hint-button');
    if (hintButton) {
      hintButton.textContent = `İpucu (${hintCount})`;
    }

    // Cevabın rastgele bir harfini seç
    const answer = currentRiddle.answer;
    const randomIndex = Math.floor(Math.random() * answer.length);
    const hintLetter = answer[randomIndex];

    // İpucu mesajını göster
    const hintDisplay = document.getElementById('hint-display');
    if (hintDisplay) {
      hintDisplay.innerHTML = `İpucu: Cevabın ${randomIndex + 1}. harfi "<span class="hint-letter">${hintLetter}</span>"`;
      hintDisplay.style.display = 'block';

      // İpucu gösteriliyor durumunu işaretle
      isHintShowing = true;

      // 5 saniye sonra ipucunu gizle
      setTimeout(() => {
        hintDisplay.style.display = 'none';
        isHintShowing = false;
      }, 5000);
    }

    // İpucu kullanıldı mesajı göster
    showMessage(`İpucu gösterildi! ${hintCount} ipucu hakkınız kaldı.`, 'info');

    // İpucu ses efekti
    playSound('hint');
  }

  /**
   * Oyunu başlatır
   */
  function startGame() {
    // Hide start screen, show game
    if (startScreen) startScreen.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'block';
    if (gameOverContainer) gameOverContainer.style.display = 'none';
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    if (feedbackContainer) feedbackContainer.style.display = 'none';

    // Initialize game state
    score = 0;
    solvedWords = [];
    isGameActive = true;
    isPaused = false;
    gameStartTime = Date.now();
    soundEnabled = true;
    currentRiddleIndex = 0;
    longestSolvedWord = '';

    // İpucu sayısını sıfırla
    hintCount = 3;
    isHintShowing = false;

    // İpucu butonunu güncelle
    const hintButton = document.getElementById('hint-button');
    if (hintButton) {
      hintButton.textContent = `İpucu (${hintCount})`;
    }

    // İpucu göstergesini temizle
    const hintDisplay = document.getElementById('hint-display');
    if (hintDisplay) {
      hintDisplay.style.display = 'none';
    }

    // Bilmeceleri karıştır
    shuffledRiddles = shuffleArray([...riddles]);

    // Reset UI elements
    if (soundToggle) {
      soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
      soundToggle.classList.add('active');
    }

    if (wordCounter) {
      wordCounter.textContent = '0';
    }

    // Update displays
    updateScoreDisplay();
    if (solvedRiddles) {
      solvedRiddles.innerHTML = '<p class="text-secondary">Henüz bilmece çözülmedi.</p>';
    }

    // Start the timer 
    startTimer(GAME_DURATION);

    // Setup input
    if (wordInput) {
      wordInput.value = '';
      wordInput.focus();
    }

    // Show first riddle
    showNextRiddle();
  }

  /**
   * Yeni bir bilmece gösterir
   */
  function showNextRiddle() {
    if (currentRiddleIndex >= shuffledRiddles.length) {
      endGame(true);
      return;
    }

    // Reset attempts
    remainingAttempts = MAX_ATTEMPTS_PER_RIDDLE;
    if (attemptsLeft) {
      attemptsLeft.textContent = remainingAttempts;
    }

    // Clear feedback
    if (letterMatches) {
      letterMatches.innerHTML = '';
    }

    if (feedbackContainer) {
      feedbackContainer.style.display = 'none';
    }

    // Get current riddle
    currentRiddle = shuffledRiddles[currentRiddleIndex];

    // Update UI
    if (riddleNumber) {
      riddleNumber.textContent = currentRiddleIndex + 1;
    }

    if (riddleText) {
      riddleText.textContent = currentRiddle.text;
    }

    // Clear input
    if (wordInput) {
      wordInput.value = '';
      wordInput.focus();
    }

    // Animate riddle card
    const riddleCard = document.querySelector('.riddle-card');
    if (riddleCard) {
      riddleCard.classList.add('animate__animated', 'animate__fadeIn');
      setTimeout(() => {
        riddleCard.classList.remove('animate__animated', 'animate__fadeIn');
      }, 1000);
    }
  }

  /**
   * Kullanıcının cevabını kontrol eder
   */
  function submitAnswer() {
    if (!isGameActive || !currentRiddle || !wordInput) return;

    const answer = wordInput.value.trim().toLowerCase();

    if (answer.length === 0) {
      showMessage('Lütfen bir cevap girin', 'warning');
      return;
    }

    // Doğru cevap verildi mi?
    if (answer === currentRiddle.answer) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer(answer);
    }
  }

  /**
   * Doğru cevap verildiğinde çağrılır
   */
  function handleCorrectAnswer() {
    // Puan hesapla (kalan deneme hakkına göre bonus)
    const attemptBonus = remainingAttempts * ATTEMPT_BONUS;
    const totalPoints = RIDDLE_POINTS + attemptBonus;

    // Puanı ve çözülen kelime sayısını güncelle
    score += totalPoints;
    solvedWords.push(currentRiddle.answer);

    // En uzun kelimeyi takip et
    if (currentRiddle.answer.length > (longestSolvedWord?.length || 0)) {
      longestSolvedWord = currentRiddle.answer;
    }

    // Ekranı güncelle
    updateScoreDisplay();
    updateSolvedRiddlesDisplay();

    // Animasyon ve geri bildirim
    showMessage(`Doğru Cevap! +${totalPoints} puan kazandınız (${attemptBonus} bonus)`, 'success');
    playSound('correct');

    // Bir sonraki bilmeceye geç
    currentRiddleIndex++;
    setTimeout(showNextRiddle, 1500);
  }

  /**
   * Yanlış cevap verildiğinde çağrılır
   */
  function handleWrongAnswer(answer) {
    // Kalan deneme hakkını azalt
    remainingAttempts--;
    if (attemptsLeft) {
      attemptsLeft.textContent = remainingAttempts;
    }

    // Hak biterse bir sonraki bilmeceye geç
    if (remainingAttempts <= 0) {
      showMessage(`Üzgünüm, doğru cevap: "${currentRiddle.answer}" idi.`, 'danger');
      playSound('fail');

      // Bir sonraki bilmeceye geç
      currentRiddleIndex++;
      setTimeout(showNextRiddle, 2000);
      return;
    }

    // Cevaptaki doğru harfleri göster
    showLetterMatches(answer, currentRiddle.answer);

    // Geri bildirim göster
    showMessage(`Yanlış cevap. ${remainingAttempts} hakkınız kaldı.`, 'warning');
    playSound('wrong');

    // Input'u temizle
    if (wordInput) {
      wordInput.value = '';
      wordInput.focus();
    }
  }

  /**
   * Verilen cevaptaki doğru harfleri gösterir
   */
  function showLetterMatches(userAnswer, correctAnswer) {
    // Geri bildirim panelini göster
    if (!feedbackContainer || !letterMatches) return;

    feedbackContainer.style.display = 'block';
    letterMatches.innerHTML = '';

    // Kullanıcının cevabındaki harfleri kontrol et
    const userLetters = userAnswer.split('');
    const correctLetters = correctAnswer.split('');

    // Her bir harf için eşleşme kontrolü
    userLetters.forEach(letter => {
      const letterElement = document.createElement('div');
      letterElement.textContent = letter;
      letterElement.className = 'letter-match';

      if (correctLetters.includes(letter)) {
        letterElement.classList.add('correct');
      } else {
        letterElement.classList.add('wrong');
      }

      letterMatches.appendChild(letterElement);
    });
  }

  /**
   * Bilmeceyi pas geçer
   */
  function passRiddle() {
    if (!isGameActive || !currentRiddle) return;

    showMessage(`Pas geçildi. Doğru cevap: "${currentRiddle.answer}" idi.`, 'info');
    playSound('pass');

    // Bir sonraki bilmeceye geç
    currentRiddleIndex++;
    setTimeout(showNextRiddle, 1500);
  }

  /**
   * Çözülen bilmeceleri ekranda gösterir
   */
  function updateSolvedRiddlesDisplay() {
    if (!solvedRiddles) return;

    if (solvedWords.length === 0) {
      solvedRiddles.innerHTML = '<p class="text-secondary">Henüz bilmece çözülmedi.</p>';
      return;
    }

    // Çözülen bilmeceleri göster
    solvedRiddles.innerHTML = '';

    solvedWords.forEach(word => {
      const wordElement = document.createElement('span');
      wordElement.className = 'word-tag';
      wordElement.textContent = word;
      solvedRiddles.appendChild(wordElement);
    });

    // Çözülen bilmece sayısını güncelle
    if (wordCounter) {
      wordCounter.textContent = solvedWords.length;
    }
  }

  /**
   * Puanı ekranda günceller
   */
  function updateScoreDisplay() {
    if (!scoreDisplay) return;

    // Animate score change
    if (scoreDisplay.textContent !== score.toString()) {
      scoreDisplay.classList.add('score-updated');
      setTimeout(() => {
        scoreDisplay.classList.remove('score-updated');
      }, 500);
    }

    scoreDisplay.textContent = score;
  }

  /**
   * Zamanlayıcıyı başlatır
   */
  function startTimer(seconds) {
    remainingTime = seconds;

    // Zamanlayıcıyı göster
    updateTimerDisplay();

    // Önceki zamanlayıcıyı temizle
    if (timerInterval) clearInterval(timerInterval);

    // Yeni zamanlayıcıyı başlat
    timerInterval = setInterval(() => {
      if (isPaused) return;

      remainingTime--;
      updateTimerDisplay();

      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        endGame(false);
      }
    }, 1000);
  }

  /**
   * Zamanlayıcıyı ekranda günceller
   */
  function updateTimerDisplay() {
    if (!timerDisplay) return;

    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    // Son 10 saniyede kırmızı yap
    if (remainingTime <= 10) {
      timerDisplay.classList.add('text-danger');
    } else {
      timerDisplay.classList.remove('text-danger');
    }
  }

  /**
   * Oyunu duraklatır veya devam ettirir
   */
  function togglePause() {
    if (!isGameActive) return;

    isPaused = !isPaused;

    if (isPaused && pauseOverlay) {
      // Pause the game
      pauseOverlay.style.display = 'flex';
    } else if (pauseOverlay) {
      // Resume the game
      pauseOverlay.style.display = 'none';
    }
  }

  /**
   * Ses ayarını açar veya kapatır
   */
  function toggleSound() {
    soundEnabled = !soundEnabled;

    if (soundToggle) {
      if (soundEnabled) {
        soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
        soundToggle.classList.add('active');
      } else {
        soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
        soundToggle.classList.remove('active');
      }
    }
  }

  /**
   * Sesi çalar
   */
  function playSound(soundType) {
    if (!soundEnabled) return;

    // Ses efektleri için basit kontroller
    try {
      const sound = new Audio(`/static/sounds/${soundType}.mp3`);
      sound.play().catch(err => console.log("Ses çalma hatası:", err));
    } catch (error) {
      console.log("Ses çalma hatası:", error);
    }
  }

  /**
   * Oyunu bitirir
   */
  function endGame(completed = false) {
    isGameActive = false;

    // Zamanlayıcıyı durdur
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    // İstatistikleri hesapla
    const gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
    const wordsCount = solvedWords.length;

    // Skoru arka planda kaydet
    saveScoreToServer(completed, gameTime, wordsCount);

    // Oyunu sıfırla ve ana menüye dön
    resetGame();
  }

  // Skoru API'ye gönder (puan gösterim ekranı olmadan)
  function saveScoreToServer(completed, gameTime, wordsCount) {
    // Skoru kaydetmeden sadece ana sayfaya yönlendir
    setTimeout(() => {
      window.location.href = '/all_games';
    }, 500);
  }

  // Oyunu sıfırla
  function resetGame() {
    // Oyun sonu ekranını gizle, ana ekranı göster
    if (gameContainer) gameContainer.style.display = 'none';
    if (gameOverContainer) gameOverContainer.style.display = 'none';
    if (startScreen) startScreen.style.display = 'block';
  }

  // Yeniden oynama düğmesine olay dinleyici ekle
  const playAgainBtn = document.getElementById('play-again');
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', startGame);
  }

  // Mesaj gösterir
  function showMessage(message, type) {
    if (!alertContainer) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    alertContainer.appendChild(alert);

    // 5 saniye sonra otomatik kapat
    setTimeout(() => {
      if (alert.parentNode === alertContainer) {
        alert.classList.remove('show');
        setTimeout(() => {
          if (alert.parentNode === alertContainer) {
            alertContainer.removeChild(alert);
          }
        }, 300);
      }
    }, 5000);
  }

  /**
   * Diziyi karıştırır
   */
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
});