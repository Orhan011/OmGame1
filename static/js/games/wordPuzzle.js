
/**
 * Kelime Bulmaca Oyunu
 * DOM elemanlarını güvenli bir şekilde yükleyen ve kontrol eden geliştirilmiş sürüm
 */
document.addEventListener('DOMContentLoaded', function() {
  // DOM Element Güvenli Erişim Yardımcısı
  function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Kelime Bulmaca: '${id}' ID'li element bulunamadı.`);
      return null;
    }
    return element;
  }

  // DOM Elementlerini Güvenli Şekilde Al
  const introSection = getElement('intro-section');
  const gameSection = getElement('game-section');
  const wordsList = getElement('words-list');
  const timerDisplay = getElement('timer');
  const scoreDisplay = getElement('score');
  const startButton = getElement('start-game');
  const restartButton = getElement('restart-game');
  
  // Oyunu başlatmak için gereken minimum elementleri kontrol et
  if (!introSection || !gameSection) {
    console.warn('Kelime Bulmaca: Temel oyun elementleri eksik. Oyun başlatılamadı.');
    return; // Oyunu başlatma
  }

  // Event Listener'ları sadece elementler varsa ekle
  if (startButton) {
    startButton.addEventListener('click', startGame);
  }
  
  if (restartButton) {
    restartButton.addEventListener('click', restartGame);
  }

  // Oyun Değişkenleri
  let timer;
  let timeLeft = 60;
  let score = 0;
  let gameActive = false;
  let foundWords = [];
  let allWords = [
    'ELMA', 'ARMUT', 'KİRAZ', 'ÇİLEK', 'PORTAKAL',
    'KARPUZ', 'ÜZÜM', 'MUZ', 'KAVUN', 'ŞEFTALİ',
    'VİŞNE', 'AYVA', 'İNCİR', 'HURMA', 'NAR',
    'MANDALİNA', 'LİMON', 'BÖĞÜRTLEN', 'AHUDUDU', 'DÖVME'
  ];
  
  // Oyunu Başlat
  function startGame() {
    if (gameActive) return;
    gameActive = true;
    score = 0;
    timeLeft = 60;
    foundWords = [];
    
    // Skorları güncelle
    if (scoreDisplay) scoreDisplay.textContent = score;
    
    // Kelime listesini temizle ve yeniden oluştur
    if (wordsList) {
      wordsList.innerHTML = '';
      generateWordsList();
    }
    
    // Zamanlayıcıyı başlat
    if (timerDisplay) {
      timerDisplay.textContent = timeLeft;
      timer = setInterval(updateTimer, 1000);
    }
    
    // Bölümleri göster/gizle
    if (introSection) introSection.style.display = 'none';
    if (gameSection) gameSection.style.display = 'block';
  }
  
  // Zamanlayıcıyı Güncelle
  function updateTimer() {
    if (!gameActive) return;
    
    timeLeft--;
    if (timerDisplay) timerDisplay.textContent = timeLeft;
    
    if (timeLeft <= 0) {
      endGame();
    }
  }
  
  // Oyunu Bitir
  function endGame() {
    gameActive = false;
    clearInterval(timer);
    
    // Skorları kaydet
    if (window.saveScore && typeof window.saveScore === 'function') {
      window.saveScore('wordPuzzle', score);
    }
    
    // Sonuç ekranını göster
    alert(`Oyun bitti! Skorunuz: ${score}`);
    
    // Bölümleri göster/gizle
    if (introSection) introSection.style.display = 'block';
    if (gameSection) gameSection.style.display = 'none';
  }
  
  // Kelime Listesini Oluştur
  function generateWordsList() {
    if (!wordsList) return;
    
    // Oyun için rasgele 10 kelime seç
    const gameWords = [...allWords].sort(() => 0.5 - Math.random()).slice(0, 10);
    
    gameWords.forEach(word => {
      const wordElement = document.createElement('div');
      wordElement.classList.add('word-item');
      wordElement.textContent = word;
      wordElement.addEventListener('click', () => checkWord(word, wordElement));
      wordsList.appendChild(wordElement);
    });
  }
  
  // Kelimeyi Kontrol Et
  function checkWord(word, element) {
    if (!gameActive || foundWords.includes(word)) return;
    
    foundWords.push(word);
    element.classList.add('found');
    score += 10;
    
    if (scoreDisplay) scoreDisplay.textContent = score;
    
    // Tüm kelimeler bulundu mu kontrol et
    if (foundWords.length === 10) {
      endGame();
    }
  }
  
  // Oyunu Yeniden Başlat
  function restartGame() {
    if (gameActive) {
      clearInterval(timer);
    }
    startGame();
  }
});

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
    },
    {
      text: "Bilmece: Akşam baktım çok idi, sabah baktım yok idi.",
      answer: "yıldız"
    },
    {
      text: "Bilmece: Sarı sarkar, bal damlar.",
      answer: "limon"
    },
    {
      text: "Bilmece: On iki dal üzerinde otuz yaprak, her yaprağın bir yüzü ak bir yüzü kara.",
      answer: "yıl"
    },
    {
      text: "Bilmece: Açıkken doyar, kapalıyken acıkır.",
      answer: "buzdolabı"
    },
    {
      text: "Bilmece: Her rengi vardır, gözle görülmez.",
      answer: "rüzgar"
    },
    {
      text: "Bilmece: Benim bir oğlum var, hem evde büyür, hem dışarıda.",
      answer: "buz"
    },
    {
      text: "Bilmece: Dağ değildir, taş değildir, başa konur, baş değildir.",
      answer: "şapka"
    },
    {
      text: "Bilmece: Ben giderim o gider, arkamda tin tin eder.",
      answer: "gölge"
    },
    {
      text: "Bilmece: Yol üzerinde kırmızı minare.",
      answer: "biber"
    },
    {
      text: "Bilmece: Ağaç üstünde kilitli sandık.",
      answer: "ceviz"
    },
    {
      text: "Bilmece: Ufacık mermer taşı, içinde beyler aşı.",
      answer: "fındık"
    },
    {
      text: "Bilmece: Kanadı var kuş değil, boynuzu var koç değil.",
      answer: "kelebek"
    },
    {
      text: "Bilmece: Dokunsan ağlar, baksan güler.",
      answer: "gitar"
    },
    {
      text: "Bilmece: Yürür gider iz bırakmaz, karnı yarık kan damlamaz.",
      answer: "gemi"
    },
    {
      text: "Bilmece: Sırtında taşır evini, gezmesi sanki övünü.",
      answer: "kaplumbağa"
    }
  ];

  // Event Listeners
  startBtn.addEventListener('click', startGame);
  submitBtn.addEventListener('click', submitAnswer);
  passBtn.addEventListener('click', passRiddle);
  
  // İpucu butonu için olay dinleyicisi ekle
  const hintButton = document.getElementById('hint-button');
  if (hintButton) {
    hintButton.addEventListener('click', showHint);
  }
  
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
// Kelime Bulmaca Oyunu
document.addEventListener('DOMContentLoaded', function() {
  const startButton = document.getElementById('start-game');
  const startScreen = document.getElementById('start-screen');
  const gameContainer = document.getElementById('game-container');
  const timerDisplay = document.getElementById('timer-display');
  const scoreDisplay = document.getElementById('score-display');
  const wordsCounter = document.getElementById('words-counter');
  const letterContainer = document.getElementById('letter-grid');
  const inputField = document.getElementById('word-input');
  const submitBtn = document.getElementById('submit-word');
  const wordsList = document.getElementById('found-words-list');
  const resultScreen = document.getElementById('result-screen');
  const finalScore = document.getElementById('final-score');
  const foundWordsCount = document.getElementById('found-words-count');
  const restartButton = document.getElementById('restart-game');
  const wordInput = document.getElementById('word-input');
  const wordSuggestions = document.getElementById('word-suggestions');
  
  // Ses efektleri
  const sounds = {
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    click: new Audio('/static/sounds/click.mp3'),
    success: new Audio('/static/sounds/success.mp3'),
    gameOver: new Audio('/static/sounds/game-over.mp3')
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
  
  // Türkçe kelime veri tabanı (örnek)
  const turkishWords = [
    "araba", "kalem", "kitap", "masa", "kapı", "pencere", "deniz", "güneş",
    "orman", "dağ", "nehir", "göl", "kedi", "köpek", "kuş", "ağaç", "çiçek",
    "yol", "su", "hava", "ateş", "toprak", "yemek", "ekmek", "peynir", "süt",
    "çay", "kahve", "sabah", "öğle", "akşam", "gece", "yıldız", "ay", "meyve",
    "sebze", "elma", "armut", "portakal", "limon", "kiraz", "üzüm", "karpuz",
    "okul", "öğretmen", "öğrenci", "sınıf", "ders", "sınav", "kalem", "defter",
    "silgi", "tahta", "renk", "mavi", "kırmızı", "yeşil", "sarı", "siyah", "beyaz",
    "gri", "mor", "pembe", "turuncu", "kahverengi", "aile", "anne", "baba", "kardeş",
    "abla", "ağabey", "dede", "nine", "amca", "dayı", "teyze", "hala", "sevgi", "mutluluk",
    "hüzün", "korku", "endişe", "merak", "heyecan", "zaman", "saat", "dakika", "saniye",
    "gün", "hafta", "ay", "yıl", "mevsim", "ilkbahar", "yaz", "sonbahar", "kış", "hava",
    "yağmur", "kar", "dolu", "sis", "bulut", "rüzgar", "fırtına", "gökkuşağı", "şimşek",
    "gök gürültüsü", "yıldırım", "güneş", "ay", "gezegen", "yıldız", "evren", "dünya"
  ];
  
  // Oyun durumu
  let gameState = {
    letters: [],
    timer: 90,
    score: 0,
    foundWords: [],
    isPlaying: false,
    letterCount: 9
  };
  
  // Türkçe karakter seti (sesli ve sessiz harfler)
  const vowels = ['A', 'E', 'I', 'İ', 'O', 'Ö', 'U', 'Ü'];
  const consonants = ['B', 'C', 'Ç', 'D', 'F', 'G', 'Ğ', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'Ş', 'T', 'V', 'Y', 'Z'];
  
  // Oyunu başlat
  startButton.addEventListener('click', function() {
    playSound('click');
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    startGame();
  });
  
  // Kelime gönder butonu
  submitBtn.addEventListener('click', function() {
    checkWord();
  });
  
  // Enter tuşuyla kelime gönderme
  inputField.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      checkWord();
    }
  });
  
  // Oyunu yeniden başlat
  restartButton.addEventListener('click', function() {
    playSound('click');
    resultScreen.style.display = 'none';
    startGame();
  });
  
  // Harf tıklama
  function setupLetterClicks() {
    const letterButtons = document.querySelectorAll('.letter-btn');
    letterButtons.forEach(button => {
      button.addEventListener('click', function() {
        const letter = this.textContent;
        inputField.value += letter;
        playSound('click');
        updateWordSuggestions();
      });
    });
  }
  
  // Kelime önerilerini güncelle
  function updateWordSuggestions() {
    const currentInput = wordInput.value.toLowerCase();
    
    if (currentInput.length < 2) {
      wordSuggestions.innerHTML = '';
      return;
    }
    
    // Mevcut harflerle oluşturulabilecek tüm olası kelimeler
    const availableLetters = gameState.letters.map(letter => letter.toLowerCase());
    const possibleWords = turkishWords.filter(word => {
      // Girilen önek ile başlayan kelimeleri kontrol et
      if (!word.startsWith(currentInput)) return false;
      
      // Kelimenin harflerinin mevcut harflerle oluşturulabilir olduğunu kontrol et
      const letters = [...availableLetters]; // Mevcut harflerin bir kopyası
      for (const char of word) {
        const index = letters.indexOf(char);
        if (index === -1) return false;
        letters.splice(index, 1);
      }
      
      return true;
    });
    
    // En fazla 5 öneri göster
    const suggestions = possibleWords.slice(0, 5);
    
    wordSuggestions.innerHTML = '';
    suggestions.forEach(word => {
      if (!gameState.foundWords.includes(word)) {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'word-suggestion';
        suggestionElement.textContent = word;
        suggestionElement.addEventListener('click', () => {
          wordInput.value = word;
          checkWord();
        });
        wordSuggestions.appendChild(suggestionElement);
      }
    });
  }
  
  // Kelime ekle ve temizle
  wordInput.addEventListener('input', updateWordSuggestions);
  
  // Harf oluştur
  function generateLetters() {
    // En az 3 sesli harf ve 6 sessiz harf olacak şekilde ayarla
    let newLetters = [];
    
    // 3 sesli harf ekle
    for (let i = 0; i < 3; i++) {
      const randomVowel = vowels[Math.floor(Math.random() * vowels.length)];
      newLetters.push(randomVowel);
    }
    
    // 6 sessiz harf ekle
    for (let i = 0; i < 6; i++) {
      const randomConsonant = consonants[Math.floor(Math.random() * consonants.length)];
      newLetters.push(randomConsonant);
    }
    
    // Karıştır
    for (let i = newLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newLetters[i], newLetters[j]] = [newLetters[j], newLetters[i]];
    }
    
    return newLetters;
  }
  
  // Harfleri ekrana yerleştir
  function renderLetters() {
    letterContainer.innerHTML = '';
    
    gameState.letters.forEach(letter => {
      const letterBtn = document.createElement('button');
      letterBtn.className = 'letter-btn';
      letterBtn.textContent = letter;
      letterContainer.appendChild(letterBtn);
    });
    
    setupLetterClicks();
  }
  
  // Zamanlayıcı başlat
  function startTimer() {
    const timer = setInterval(() => {
      if (!gameState.isPlaying) {
        clearInterval(timer);
        return;
      }
      
      gameState.timer--;
      timerDisplay.textContent = formatTime(gameState.timer);
      
      if (gameState.timer <= 0) {
        clearInterval(timer);
        endGame();
      }
    }, 1000);
  }
  
  // Zamanı formatla (1:30 gibi)
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Kelimeyi kontrol et
  function checkWord() {
    const word = inputField.value.trim().toLowerCase();
    
    if (word.length < 3) {
      showMessage('En az 3 harfli kelime girin', 'warning');
      return;
    }
    
    if (gameState.foundWords.includes(word)) {
      showMessage('Bu kelimeyi zaten buldunuz', 'warning');
      inputField.value = '';
      return;
    }
    
    // Kelime gerçekten var mı kontrol et
    if (!turkishWords.includes(word)) {
      playSound('wrong');
      showMessage('Geçerli bir kelime değil', 'error');
      inputField.value = '';
      return;
    }
    
    // Harflerin uygunluğunu kontrol et
    const availableLetters = [...gameState.letters.map(l => l.toLowerCase())];
    const isValidWord = [...word].every(char => {
      const index = availableLetters.indexOf(char);
      if (index !== -1) {
        availableLetters.splice(index, 1);
        return true;
      }
      return false;
    });
    
    if (!isValidWord) {
      playSound('wrong');
      showMessage('Bu kelime verilen harflerle oluşturulamaz', 'error');
      inputField.value = '';
      return;
    }
    
    // Kelimeyi ekle ve puanı güncelle
    playSound('correct');
    gameState.foundWords.push(word);
    
    // Puanlama (kelime uzunluğuna göre)
    const wordScore = calculateWordScore(word);
    gameState.score += wordScore;
    
    // Ekranı güncelle
    scoreDisplay.textContent = gameState.score;
    wordsCounter.textContent = gameState.foundWords.length;
    
    // Kelimeyi listeye ekle
    addWordToList(word, wordScore);
    
    // Giriş alanını temizle
    inputField.value = '';
    wordSuggestions.innerHTML = '';
    
    showMessage(`"${word}" kelimesi bulundu: +${wordScore} puan`, 'success');
  }
  
  // Kelime puanını hesapla
  function calculateWordScore(word) {
    // Temel puan: kelime uzunluğunun karesi
    let score = Math.pow(word.length, 2);
    
    // Bonus: Ç, Ğ, İ, Ö, Ş, Ü gibi özel Türkçe harfler için +2 puan
    const specialChars = ['ç', 'ğ', 'ı', 'i̇', 'ö', 'ş', 'ü'];
    for (const char of word) {
      if (specialChars.includes(char)) {
        score += 2;
      }
    }
    
    return score;
  }
  
  // Bulunan kelimeyi listeye ekle
  function addWordToList(word, score) {
    const wordItem = document.createElement('div');
    wordItem.className = 'found-word-item';
    
    const wordText = document.createElement('span');
    wordText.className = 'word-text';
    wordText.textContent = word;
    
    const wordScore = document.createElement('span');
    wordScore.className = 'word-score';
    wordScore.textContent = `+${score}`;
    
    wordItem.appendChild(wordText);
    wordItem.appendChild(wordScore);
    
    wordsList.appendChild(wordItem);
    
    // Kaydırma çubuğunu en alta getir
    wordsList.scrollTop = wordsList.scrollHeight;
  }
  
  // Mesaj göster
  function showMessage(text, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.textContent = text;
    
    messageContainer.appendChild(message);
    
    // 3 saniye sonra kaybolsun
    setTimeout(() => {
      message.classList.add('fade-out');
      setTimeout(() => {
        messageContainer.removeChild(message);
      }, 500);
    }, 3000);
  }
  
  // Oyunu başlat
  function startGame() {
    // Oyun durumunu sıfırla
    gameState.letters = generateLetters();
    gameState.timer = 90;
    gameState.score = 0;
    gameState.foundWords = [];
    gameState.isPlaying = true;
    
    // Ekranı güncelle
    timerDisplay.textContent = formatTime(gameState.timer);
    scoreDisplay.textContent = '0';
    wordsCounter.textContent = '0';
    wordsList.innerHTML = '';
    gameContainer.style.display = 'block';
    resultScreen.style.display = 'none';
    
    // Harfleri yerleştir
    renderLetters();
    
    // Zamanlayıcıyı başlat
    startTimer();
    
    // Input alanını temizle ve odaklan
    inputField.value = '';
    inputField.focus();
  }
  
  // Oyunu bitir
  function endGame() {
    playSound('gameOver');
    gameState.isPlaying = false;
    
    // Sonuç ekranını hazırla
    finalScore.textContent = gameState.score;
    foundWordsCount.textContent = gameState.foundWords.length;
    
    // Sonuç ekranını göster
    gameContainer.style.display = 'none';
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
        game_type: 'wordPuzzle',
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
});
