document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const startScreen = document.getElementById('start-screen');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const startBtn = document.getElementById('start-game');
  const playAgainBtn = document.getElementById('play-again');
  const wordleGrid = document.getElementById('wordle-grid');
  const keyboard = document.getElementById('keyboard');
  const keyboardRow1 = document.getElementById('keyboard-row-1');
  const keyboardRow2 = document.getElementById('keyboard-row-2');
  const keyboardRow3 = document.getElementById('keyboard-row-3');
  const messageContainer = document.getElementById('message-container');
  const scoreDisplay = document.getElementById('score-display');
  const guessesDisplay = document.getElementById('guesses-display');
  const streakDisplay = document.getElementById('streak-display');
  const finalScore = document.getElementById('final-score');
  const attemptsCount = document.getElementById('attempts-count');
  const finalStreak = document.getElementById('final-streak');
  const resultMessage = document.getElementById('game-result-message');
  const answerReveal = document.getElementById('answer-reveal');
  const hintButton = document.getElementById('hint-button');
  const hintCount = document.getElementById('hint-count');
  const soundToggle = document.getElementById('sound-toggle');
  const copyScoreBtn = document.getElementById('copy-score');
  const shareScoreBtn = document.getElementById('share-score');

  // Ses efektleri
  const sounds = {
    keypress: new Audio('/static/sounds/click.mp3'),
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    hint: new Audio('/static/sounds/hint.mp3'),
    gameWin: new Audio('/static/sounds/success.mp3'),
    gameLose: new Audio('/static/sounds/game-over.mp3')
  };

  // Oyun Durumu
  let gameState = {
    answer: '',
    currentRow: 0,
    currentCol: 0,
    guesses: Array(6).fill().map(() => Array(5).fill('')),
    isGameOver: false,
    score: 0,
    streak: 0,
    hintsLeft: 3,
    soundEnabled: true,
    usedLetters: {
      correct: new Set(),
      present: new Set(),
      absent: new Set()
    },
    // Çift işlemi önlemek için
    lastInputTime: 0,
    debounceTime: 200 // ms
  };

  // Mobil klavye girişi için gizli input oluştur
  let mobileInput = null;
  
  function createMobileInput() {
    if (!mobileInput) {
      // Ekranın aşağı kaymaması için önce bir container oluşturalım
      const inputContainer = document.createElement('div');
      inputContainer.style.position = 'fixed';
      inputContainer.style.bottom = '0';
      inputContainer.style.left = '0';
      inputContainer.style.width = '100%';
      inputContainer.style.height = '1px';
      inputContainer.style.opacity = '0';
      inputContainer.style.zIndex = '-1';
      
      // Input elementi oluştur
      mobileInput = document.createElement('input');
      mobileInput.type = 'text';
      mobileInput.inputMode = 'text';
      mobileInput.autocomplete = 'off';
      mobileInput.autocorrect = 'off';
      mobileInput.autocapitalize = 'none';
      mobileInput.spellcheck = false;
      
      // Input elementini görünmez yap
      mobileInput.style.position = 'absolute';
      mobileInput.style.opacity = '0';
      mobileInput.style.height = '1px';
      mobileInput.style.width = '1px';
      mobileInput.style.pointerEvents = 'none';
      mobileInput.style.left = '0';
      mobileInput.style.top = '0';
      mobileInput.maxLength = 1; // Sadece bir karakter girilebilir
      
      // Sayfanın kaymasını önlemek için
      mobileInput.style.zIndex = '-1';
      
      // Input elementini container'a ekle
      inputContainer.appendChild(mobileInput);
      
      // Container'ı sayfaya ekle
      document.body.appendChild(inputContainer);
      
      // Debounce (sıçrama engelleme) fonksiyonu tanımlanıyor
      const debounce = (callback, delay) => {
        let timerId;
        return function(...args) {
          clearTimeout(timerId);
          timerId = setTimeout(() => {
            callback.apply(this, args);
          }, delay);
        };
      };
      
      // Harf giriş işlemi için debounce uygulanan fonksiyon
      const handleInput = debounce((e) => {
        const char = e.target.value.toUpperCase();
        
        if (/^[A-ZĞÜŞİÖÇ]$/.test(char)) {
          addLetter(char);
          playSound('keypress');
        }
        
        // İnputu temizle - bir sonraki harf girişi için hazırla
        e.target.value = '';
      }, 100);
      
      // Mobil input olayları - tek harf girişi
      mobileInput.addEventListener('input', handleInput);
      
      // Silme ve Enter için debounce uygulanan fonksiyon
      const handleKeydown = debounce((e) => {
        if (e.key === 'Backspace') {
          e.preventDefault();
          deleteLetter();
          playSound('keypress');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          submitGuess();
        }
      }, 100);
      
      // Mobil input silme ve enter işlemleri
      mobileInput.addEventListener('keydown', handleKeydown);
      
      // Taşınmayı ve kaydırmayı önlemek için
      window.visualViewport.addEventListener('resize', () => {
        if (window.visualViewport.height < window.innerHeight) {
          // Klavye açıldı, gridimizin ortada kalmasını sağlayalım
          wordleGrid.style.marginTop = '10px';
          wordleGrid.style.marginBottom = '150px';
        } else {
          // Klavye kapandı, normal görünüme dönelim
          wordleGrid.style.marginTop = '';
          wordleGrid.style.marginBottom = '';
        }
      });
    }
  }
  
  function focusMobileInput() {
    if (mobileInput && !gameState.isGameOver) {
      setTimeout(() => {
        mobileInput.focus();
      }, 50);
    }
  }

  // Türkçe kelime listesi - 5 harfli kelimeler
  const wordList = [
    "kalem", "kitap", "araba", "ağaç", "çiçek", "deniz", "güneş", "gökyüzü", "balık", "kuşlar",
    "bulut", "yağmur", "orman", "dağlar", "nehir", "cadde", "sokak", "kapı", "bina", "tablo",
    "masa", "koltuk", "sandalye", "yatak", "yastık", "battaniye", "halı", "perde", "lamba", "dolap",
    "musluk", "duvar", "pencere", "bahçe", "çatı", "merdiven", "asansör", "havuz", "sahil", "kumsal",
    "tarla", "çiftlik", "kasaba", "şehir", "ülke", "dünya", "gezegen", "ateş", "toprak", "hava",
    "meyve", "sebze", "ekmek", "yemek", "içmek", "uyku", "koşmak", "yürüme", "konuşma", "dinle",
    "uzak", "yakın", "büyük", "küçük", "kısa", "uzun", "yüksek", "alçak", "kalın", "ince",
    "sıcak", "soğuk", "yaşlı", "genç", "mutlu", "üzgün", "korkak", "cesur", "akıllı", "deli",
    "gece", "gündüz", "sabah", "öğlen", "akşam", "bugün", "dün", "yarın", "hafta", "aylar",
    "yıllar", "saat", "dakika", "saniye", "zaman", "hayat", "ölüm", "sağlık", "hastalık", "iyilik"
  ];

  // Türkçe klavye düzeni
  const turkishKeyboard = [
    ["E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
    ["SİL", "Z", "C", "V", "B", "N", "M", "Ö", "Ç", "ENTER"]
  ];

  // Oyun başlat butonu
  startBtn.addEventListener('click', startGame);

  // Yeniden oyna butonu
  playAgainBtn.addEventListener('click', startGame);

  // İpucu butonu
  hintButton.addEventListener('click', getHint);

  // Ses butonu
  soundToggle.addEventListener('click', toggleSound);

  // Skoru paylaş/kopyala butonları
  copyScoreBtn.addEventListener('click', copyScore);
  shareScoreBtn.addEventListener('click', shareScore);

  // Klavye tuşu basımı için debounce fonksiyonu
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
  
  // Klavye tuşuna debounce uygula
  const debouncedKeypress = debounce(function(e) {
    if (gameState.isGameOver || gameContainer.style.display === 'none') return;
    
    const key = e.key.toUpperCase();
    
    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      deleteLetter();
      playSound('keypress');
    } else if (/^[A-ZĞÜŞİÖÇ]$/.test(key)) {
      addLetter(key);
      playSound('keypress');
    }
  }, 100);

  // Klavye tuşu basımı
  document.addEventListener('keydown', debouncedKeypress);
  
  // Ekrana tıklama olayı - mobil input için
  wordleGrid.addEventListener('click', focusMobileInput);

  /**
   * Oyunu başlatır
   */
  function startGame() {
    // Arayüzü sıfırla
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    gameOverContainer.style.display = 'none';
    
    // Ekrandaki klavyeyi gizle
    if (keyboard) {
      keyboard.style.display = 'none';
    }

    // Rastgele bir kelime seç
    const randomIndex = Math.floor(Math.random() * wordList.length);
    gameState.answer = wordList[randomIndex].toUpperCase();
    console.log("Cevap: " + gameState.answer); // Geliştirme için, prodüksiyonda kaldırılmalı

    // Oyun durumunu sıfırla
    gameState.currentRow = 0;
    gameState.currentCol = 0;
    gameState.guesses = Array(6).fill().map(() => Array(5).fill(''));
    gameState.isGameOver = false;
    gameState.hintsLeft = 3;
    gameState.usedLetters = {
      correct: new Set(),
      present: new Set(),
      absent: new Set()
    };
    gameState.lastInputTime = 0;

    // Skorları güncelle
    updateScoreDisplay();

    // İpucu sayacını güncelle
    hintCount.textContent = gameState.hintsLeft;

    // Grid ve klavyeyi oluştur
    createWordleGrid();
    
    // Grid'in ekranın alt tarafında olduğundan emin ol
    wordleGrid.style.marginTop = '0';
    
    // Mobil klavye desteği ekle
    createMobileInput();
    focusMobileInput();

    // Ses efektlerini sıfırla
    resetSounds();

    // Oyun başlangıç sesi çal
    playSound('keypress');
  }

  /**
   * Wordle ızgarasını oluşturur
   */
  function createWordleGrid() {
    wordleGrid.innerHTML = '';
    
    for (let row = 0; row < 6; row++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'wordle-row';
      rowDiv.dataset.row = row;
      
      for (let col = 0; col < 5; col++) {
        const cell = document.createElement('div');
        cell.className = 'wordle-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        rowDiv.appendChild(cell);
      }
      
      wordleGrid.appendChild(rowDiv);
    }
  }

  /**
   * Harf ekleme - çift işlemi önleme kontrolü eklendi
   */
  function addLetter(letter) {
    if (gameState.isGameOver) return;
    
    // Çift işlem kontrolü
    const now = Date.now();
    if (now - gameState.lastInputTime < gameState.debounceTime) {
      return;
    }
    gameState.lastInputTime = now;
    
    if (gameState.currentCol < 5) {
      gameState.guesses[gameState.currentRow][gameState.currentCol] = letter;
      updateGrid();
      gameState.currentCol++;
    }
  }

  /**
   * Harf silme - çift işlemi önleme kontrolü eklendi
   */
  function deleteLetter() {
    if (gameState.isGameOver) return;
    
    // Çift işlem kontrolü
    const now = Date.now();
    if (now - gameState.lastInputTime < gameState.debounceTime) {
      return;
    }
    gameState.lastInputTime = now;
    
    if (gameState.currentCol > 0) {
      gameState.currentCol--;
      gameState.guesses[gameState.currentRow][gameState.currentCol] = '';
      updateGrid();
    }
  }

  /**
   * Tahmini gönderme
   */
  function submitGuess() {
    // Çift işlem kontrolü
    const now = Date.now();
    if (now - gameState.lastInputTime < gameState.debounceTime) {
      return;
    }
    gameState.lastInputTime = now;
    
    if (gameState.currentCol < 5) {
      showMessage('Yetersiz harf! 5 harfli bir kelime girin.', 'warning');
      shakeRow(gameState.currentRow);
      return;
    }
    
    const guess = gameState.guesses[gameState.currentRow].join('');
    
    // Kelime kontrolü (gerçek uygulamada kelime listesinden kontrol edilir)
    // Basitlik için şimdilik atlıyoruz, istenirse eklenir
    
    // Tahmin sonuçlarını kontrol et
    const result = checkGuess(guess);
    
    // Sonuçları görsel olarak göster
    animateResults(result);
    
    // Skorları güncelle
    updateScore(result);
    
    // Bir sonraki satıra geç
    gameState.currentRow++;
    gameState.currentCol = 0;
    
    // Oyun durumunu kontrol et
    if (guess === gameState.answer) {
      // Kazandı
      setTimeout(() => {
        endGame(true);
      }, 1500);
    } else if (gameState.currentRow >= 6) {
      // Kaybetti
      setTimeout(() => {
        endGame(false);
      }, 1500);
    }
    
    // Tahmin sayısını güncelle
    guessesDisplay.textContent = `${gameState.currentRow}/6`;
  }

  /**
   * Tahmini kontrol eder ve sonuçları döndürür
   */
  function checkGuess(guess) {
    const result = Array(5).fill('absent');
    const answerLetters = gameState.answer.split('');
    const guessLetters = guess.split('');
    
    // İlk olarak doğru yerdeki harfleri kontrol et
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] === answerLetters[i]) {
        result[i] = 'correct';
        answerLetters[i] = null; // Tekrar kontrol edilmemesi için harfi işaretle
        gameState.usedLetters.correct.add(guessLetters[i]);
      }
    }
    
    // Sonra doğru harf yanlış yerde olanları kontrol et
    for (let i = 0; i < 5; i++) {
      if (result[i] === 'absent') {
        const index = answerLetters.indexOf(guessLetters[i]);
        if (index !== -1) {
          result[i] = 'present';
          answerLetters[index] = null; // Tekrar kontrol edilmemesi için harfi işaretle
          gameState.usedLetters.present.add(guessLetters[i]);
        } else {
          gameState.usedLetters.absent.add(guessLetters[i]);
        }
      }
    }
    
    return result;
  }

  /**
   * Sonuçları animasyonla gösterir
   */
  function animateResults(result) {
    const row = gameState.currentRow;
    const cells = document.querySelectorAll(`.wordle-cell[data-row="${row}"]`);
    
    cells.forEach((cell, index) => {
      setTimeout(() => {
        cell.classList.add('flip');
        
        setTimeout(() => {
          cell.classList.add(result[index]);
          
          // Tüm hücreler tamamlandıysa doğru/yanlış sesi çal
          if (index === 4) {
            if (result.every(r => r === 'correct')) {
              playSound('correct');
            } else {
              playSound('wrong');
            }
          }
        }, 250); // Flip animasyonunun ortasında sınıfı ekle
      }, index * 200); // Her hücre için gecikme
    });
  }

  /**
   * Izgarayı günceller
   */
  function updateGrid() {
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 5; col++) {
        const cell = document.querySelector(`.wordle-cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          cell.textContent = gameState.guesses[row][col];
          
          if (gameState.guesses[row][col]) {
            cell.classList.add('filled');
          } else {
            cell.classList.remove('filled');
          }
        }
      }
    }
  }

  /**
   * Satırı sallama animasyonu
   */
  function shakeRow(row) {
    const rowElement = document.querySelector(`.wordle-row[data-row="${row}"]`);
    if (rowElement) {
      rowElement.classList.add('shake');
      
      setTimeout(() => {
        rowElement.classList.remove('shake');
      }, 500);
    }
  }

  /**
   * Puanı günceller
   */
  function updateScore(result) {
    // Doğru ve var olan harf sayısını hesapla
    const correctCount = result.filter(r => r === 'correct').length;
    const presentCount = result.filter(r => r === 'present').length;
    
    // Tahminin başarı puanını hesapla
    const rowBonus = (6 - gameState.currentRow) * 10; // Erken tahmin için bonus
    const letterScore = (correctCount * 20) + (presentCount * 5);
    
    const guessScore = letterScore + rowBonus;
    gameState.score += guessScore;
    
    // Ekranı güncelle
    updateScoreDisplay();
  }

  /**
   * Puan göstergesini günceller
   */
  function updateScoreDisplay() {
    if (scoreDisplay) scoreDisplay.textContent = gameState.score;
    if (streakDisplay) streakDisplay.textContent = gameState.streak;
    if (guessesDisplay) guessesDisplay.textContent = `${gameState.currentRow}/6`;
  }

  /**
   * İpucu verir
   */
  function getHint() {
    if (gameState.hintsLeft <= 0) {
      showMessage('İpucu hakkınız kalmadı!', 'error');
      return;
    }
    
    if (gameState.isGameOver) {
      return;
    }
    
    // İpucu hakkını azalt
    gameState.hintsLeft--;
    hintCount.textContent = gameState.hintsLeft;
    
    // Henüz açılmamış bir harfi aç
    let emptyPositions = [];
    for (let i = 0; i < 5; i++) {
      const currentGuess = gameState.guesses[gameState.currentRow];
      // Eğer bu pozisyon boş veya henüz bir tahmin yapılmadıysa
      if (!currentGuess[i]) {
        emptyPositions.push(i);
      }
    }
    
    // Boş pozisyon yoksa (yani satır zaten doluysa), mesaj göster
    if (emptyPositions.length === 0) {
      showMessage('Bu satırda ipucu verecek boş harf yok!', 'warning');
      // İpucu hakkını geri ver
      gameState.hintsLeft++;
      hintCount.textContent = gameState.hintsLeft;
      return;
    }
    
    // Rastgele bir boş pozisyon seç
    const randomPosition = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    
    // Doğru harfi göster
    gameState.guesses[gameState.currentRow][randomPosition] = gameState.answer[randomPosition];
    
    // Izgarayı güncelle
    updateGrid();
    
    // Sütun indeksini güncelle
    if (gameState.currentCol <= randomPosition) {
      gameState.currentCol = randomPosition + 1;
    }
    
    // İpucu sesini çal
    playSound('hint');
    
    // Kullanıcıya bilgi mesajı göster
    showMessage('İpucu verildi!', 'info');
  }

  /**
   * Oyunu sonlandırır
   */
  function endGame(isWin) {
    gameState.isGameOver = true;
    
    // Mobil inputu gizle
    if (mobileInput) {
      mobileInput.style.display = 'none';
    }
    
    // Seri ve puan hesaplamaları
    if (isWin) {
      gameState.streak++;
      // Kalan tahmin hakkına göre bonus puan
      const remainingGuesses = 6 - gameState.currentRow;
      const bonusPoints = remainingGuesses * 50;
      gameState.score += bonusPoints;
      playSound('gameWin');
    } else {
      gameState.streak = 0;
      playSound('gameLose');
    }
    
    // Sonuç ekranını hazırla
    finalScore.textContent = gameState.score;
    attemptsCount.textContent = `${gameState.currentRow}/6`;
    finalStreak.textContent = gameState.streak;
    answerReveal.textContent = gameState.answer;
    
    if (isWin) {
      let performanceMessage = '';
      const attemptsUsed = gameState.currentRow;
      
      if (attemptsUsed === 1) {
        performanceMessage = 'İnanılmaz! İlk tahminde buldunuz!';
        updateRatingStars(5);
      } else if (attemptsUsed === 2) {
        performanceMessage = 'Muhteşem! Sadece 2 tahminde buldunuz!';
        updateRatingStars(5);
      } else if (attemptsUsed === 3) {
        performanceMessage = 'Harika! 3 tahminde buldunuz!';
        updateRatingStars(4);
      } else if (attemptsUsed === 4) {
        performanceMessage = 'Çok iyi! 4 tahminde buldunuz.';
        updateRatingStars(3);
      } else if (attemptsUsed === 5) {
        performanceMessage = 'İyi iş! 5 tahminde buldunuz.';
        updateRatingStars(2);
      } else {
        performanceMessage = 'Son şansınızda buldunuz!';
        updateRatingStars(1);
      }
      
      resultMessage.textContent = performanceMessage;
    } else {
      resultMessage.textContent = `Üzgünüm, kelimeyi bulamadınız.`;
      updateRatingStars(0);
    }
    
    // Skoru kaydet (localStorage veya backend'e gönderilebilir)
    saveScore();
    
    // Sonuç ekranını göster
    setTimeout(() => {
      gameContainer.style.display = 'none';
      gameOverContainer.style.display = 'block';
    }, 1000);
  }

  /**
   * Yıldız puanlamasını günceller
   */
  function updateRatingStars(rating) {
    const stars = document.querySelectorAll('.rating-stars i');
    const ratingText = document.getElementById('rating-text');
    
    stars.forEach((star, index) => {
      if (index < rating) {
        star.className = 'fas fa-star';
      } else {
        star.className = 'far fa-star';
      }
    });
    
    const ratingMessages = [
      'Daha iyisini yapabilirsin!',
      'Fena değil!',
      'İyi!',
      'Çok iyi!',
      'Mükemmel!',
      'İnanılmaz!'
    ];
    
    ratingText.textContent = ratingMessages[Math.min(rating, 5)];
  }

  /**
   * Skoru kaydeder
   */
  function saveScore() {
    // Kullanıcı oturumu açıksa skoru kaydet
    if (window.saveGameScore) {
      window.saveGameScore('wordle', gameState.score);
    } else {
      // Lokalde kaydetme
      const savedScores = JSON.parse(localStorage.getItem('wordleScores') || '[]');
      savedScores.push({
        score: gameState.score,
        date: new Date().toISOString()
      });
      localStorage.setItem('wordleScores', JSON.stringify(savedScores));
    }
  }

  /**
   * Mesaj gösterir
   */
  function showMessage(text, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.className = `game-message ${type}`;
    messageElement.textContent = text;
    
    messageContainer.innerHTML = '';
    messageContainer.appendChild(messageElement);
    
    setTimeout(() => {
      messageElement.remove();
    }, 3000);
  }

  /**
   * Sesleri açar/kapatır
   */
  function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    
    if (gameState.soundEnabled) {
      soundToggle.classList.add('active');
      soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
    } else {
      soundToggle.classList.remove('active');
      soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
  }

  /**
   * Ses çalar
   */
  function playSound(soundName) {
    if (!gameState.soundEnabled) return;
    
    const sound = sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(err => console.log('Ses çalma hatası:', err));
    }
  }

  /**
   * Ses efektlerini sıfırlar
   */
  function resetSounds() {
    for (const sound in sounds) {
      sounds[sound].pause();
      sounds[sound].currentTime = 0;
    }
  }

  /**
   * Skoru kopyalar
   */
  function copyScore() {
    const scoreText = `🎮 Wordle Puanım: ${gameState.score} 🎮\n`;
    const guessText = `Tahminler: ${gameState.currentRow}/6\n`;
    const streakText = `Seri: ${gameState.streak}`;
    
    const fullText = `${scoreText}${guessText}${streakText}\n\nZekaPark'ta sen de oyna: https://zekapark.app`;
    
    try {
      navigator.clipboard.writeText(fullText);
      showMessage('Skor panoya kopyalandı!', 'success');
    } catch (err) {
      console.error('Kopyalama hatası:', err);
      showMessage('Kopyalama başarısız oldu', 'error');
    }
  }

  /**
   * Skoru paylaşır
   */
  function shareScore() {
    const scoreText = `🎮 Wordle Puanım: ${gameState.score} 🎮\n`;
    const guessText = `Tahminler: ${gameState.currentRow}/6\n`;
    const streakText = `Seri: ${gameState.streak}`;
    
    const shareText = `${scoreText}${guessText}${streakText}\n\nZekaPark'ta sen de oyna: https://zekapark.app`;
    
    if (navigator.share) {
      navigator.share({
        title: 'ZekaPark Wordle Skorum',
        text: shareText
      })
      .then(() => showMessage('Paylaşım başarılı!', 'success'))
      .catch(err => {
        console.error('Paylaşım hatası:', err);
        showMessage('Paylaşım iptal edildi', 'info');
      });
    } else {
      // Web Share API desteklenmiyorsa, kopyalama işlemini yap
      copyScore();
    }
  }
  
  // Sayfa yüklendiğinde klavye için ana CSS stil ekleyelim
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .wordle-grid {
      margin-top: 20px;
      margin-bottom: 100px !important;  /* Mobil klavye için ek boşluk bırak */
    }
    
    /* Mobil için ek stil */
    @media (max-width: 767px) {
      .wordle-grid {
        margin-top: 10px;
        margin-bottom: 150px !important;  /* Mobil klavye için daha fazla boşluk */
      }
      
      .wordle-cell {
        font-size: 1.2rem !important;  /* Mobil için biraz daha küçük */
      }
    }
    
    /* Klavyenin sayfayı kaydırmaması için */
    body.keyboard-open .wordle-grid {
      transform: translateY(-80px);
      transition: transform 0.3s ease;
    }
  `;
  document.head.appendChild(styleElement);
});
