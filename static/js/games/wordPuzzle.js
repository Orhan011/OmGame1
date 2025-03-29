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
  const solvedRiddles = document.getElementById('solved-riddles');
  const feedbackContainer = document.getElementById('feedback-container');

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

  // Turkish riddles with answers
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
    }
  ];

  // Event Listeners
  startBtn.addEventListener('click', startGame);
  submitBtn.addEventListener('click', submitAnswer);
  passBtn.addEventListener('click', passRiddle);
  
  // Enter key to submit answer
  wordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      submitAnswer();
    }
  });

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

  /**
   * Oyunu başlatır
   */
  function startGame() {
    // Hide start screen, show game
    if (startScreen) startScreen.style.display = 'none';
    if (startBtn) startBtn.style.display = 'none';
    gameContainer.style.display = 'block';
    gameOverContainer.style.display = 'none';
    pauseOverlay.style.display = 'none';
    feedbackContainer.style.display = 'none';

    // Initialize game state
    score = 0;
    solvedWords = [];
    isGameActive = true;
    isPaused = false;
    gameStartTime = Date.now();
    soundEnabled = true;
    currentRiddleIndex = 0;
    longestSolvedWord = '';
    
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
    solvedRiddles.innerHTML = '<p class="text-secondary">Henüz bilmece çözülmedi.</p>';

    // Start the timer 
    startTimer(GAME_DURATION);

    // Setup input
    wordInput.value = '';
    wordInput.focus();

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
    attemptsLeft.textContent = remainingAttempts;
    
    // Clear feedback
    letterMatches.innerHTML = '';
    feedbackContainer.style.display = 'none';
    
    // Get current riddle
    currentRiddle = shuffledRiddles[currentRiddleIndex];
    
    // Update UI
    riddleNumber.textContent = currentRiddleIndex + 1;
    riddleText.textContent = currentRiddle.text;
    
    // Clear input
    wordInput.value = '';
    wordInput.focus();
    
    // Animate riddle card
    const riddleCard = document.querySelector('.riddle-card');
    riddleCard.classList.add('animate__animated', 'animate__fadeIn');
    setTimeout(() => {
      riddleCard.classList.remove('animate__animated', 'animate__fadeIn');
    }, 1000);
  }

  /**
   * Kullanıcının cevabını kontrol eder
   */
  function submitAnswer() {
    if (!isGameActive || !currentRiddle) return;
    
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
    attemptsLeft.textContent = remainingAttempts;
    
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
    wordInput.value = '';
    wordInput.focus();
  }

  /**
   * Verilen cevaptaki doğru harfleri gösterir
   */
  function showLetterMatches(userAnswer, correctAnswer) {
    // Geri bildirim panelini göster
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

    if (isPaused) {
      // Pause the game
      pauseOverlay.style.display = 'flex';
    } else {
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
    
    // Ses efektleri burada çalınabilir
    // Bu basit bir demo olduğu için şimdilik boş bırakıyoruz
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
    
    // İstatistikleri güncelle
    finalScoreDisplay.textContent = score;
    wordsFoundCount.textContent = wordsCount;
    longestWordDisplay.textContent = longestSolvedWord || '-';
    
    // Derecelendirmeyi güncelle
    updateRatingDisplay();
    
    // Oyun sonu ekranını göster
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'block';
    
    // Animasyon ekle
    gameOverContainer.classList.add('fade-in');
    
    // Skoru kaydet
    if (window.saveScore) {
      window.saveScore('wordPuzzle', score);
    }
    
    // Yeniden oynama düğmesine olay dinleyici ekle
    const playAgainBtn = document.getElementById('play-again');
    if (playAgainBtn) {
      // Önceki olay dinleyicileri temizle
      const newPlayAgainBtn = playAgainBtn.cloneNode(true);
      playAgainBtn.parentNode.replaceChild(newPlayAgainBtn, playAgainBtn);
      
      // Yeni olay dinleyici ekle
      newPlayAgainBtn.addEventListener('click', startGame);
    }
    
    // Paylaşım düğmelerine olay dinleyici ekle
    if (copyScoreBtn) {
      copyScoreBtn.addEventListener('click', copyScore);
    }
    
    if (shareScoreBtn) {
      shareScoreBtn.addEventListener('click', shareScore);
    }
  }

  /**
   * Derecelendirmeyi günceller
   */
  function updateRatingDisplay() {
    const stars = document.querySelectorAll('.rating-stars i');
    let rating = 0;
    
    // Skora göre derecelendirme
    if (score >= 800) rating = 5;
    else if (score >= 600) rating = 4;
    else if (score >= 400) rating = 3;
    else if (score >= 200) rating = 2;
    else rating = 1;
    
    // Yıldızları güncelle
    stars.forEach((star, index) => {
      if (index < rating) {
        star.className = 'fas fa-star';
      } else {
        star.className = 'far fa-star';
      }
    });
    
    // Derecelendirme metnini güncelle
    let ratingDescription = 'Başlangıç';
    if (rating === 5) ratingDescription = 'Efsanevi!';
    else if (rating === 4) ratingDescription = 'Çok İyi!';
    else if (rating === 3) ratingDescription = 'İyi!';
    else if (rating === 2) ratingDescription = 'İdare Eder';
    
    if (ratingText) {
      ratingText.textContent = ratingDescription;
    }
  }

  /**
   * Skoru panoya kopyalar
   */
  function copyScore() {
    const scoreText = `Kelime Bulmaca oyununda ${score} puan kazandım! ${solvedWords.length} bilmece çözdüm ve en uzun cevabım: ${longestSolvedWord || '-'}`;
    
    navigator.clipboard.writeText(scoreText)
      .then(() => {
        showMessage('Skor kopyalandı!', 'success');
      })
      .catch(err => {
        console.error('Kopyalama başarısız: ', err);
        showMessage('Kopyalama başarısız', 'danger');
      });
  }

  /**
   * Skoru paylaşır
   */
  function shareScore() {
    const scoreText = `Kelime Bulmaca oyununda ${score} puan kazandım! ${solvedWords.length} bilmece çözdüm ve en uzun cevabım: ${longestSolvedWord || '-'}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Beyin Egzersizi Oyun Skoru',
        text: scoreText,
      })
      .catch(error => console.log('Paylaşım başarısız:', error));
    } else {
      copyScore();
    }
  }

  /**
   * Mesaj gösterir
   */
  function showMessage(message, type) {
    const alertContainer = document.getElementById('alert-container');
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
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