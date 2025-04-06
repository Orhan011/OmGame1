document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const startScreen = document.getElementById('start-screen');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const startBtn = document.getElementById('start-game');
  const playAgainBtn = document.getElementById('play-again');
  const wordleGrid = document.getElementById('wordle-grid');
  const keyboard = document.getElementById('keyboard');
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
    // İşlem kilidi
    isProcessing: false
  };
  
  // Event kontrolü - olay yönetimi
  let eventController = {
    // Zamanla kilitleyen ve açan fonksiyon
    throttle: function(callback, delay) {
      return function() {
        if (gameState.isProcessing) return; // İşlem devam ediyorsa dön
        
        gameState.isProcessing = true;
        callback.apply(this, arguments);
        
        setTimeout(() => {
          gameState.isProcessing = false;
        }, delay);
      };
    }
  };

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

  // Minimum hız kısıtlaması
  const MIN_EVENT_INTERVAL = 100; // ms

  // Eventlerin son çalışma zamanını takip etmek için
  let lastEventTimes = {
    keydown: 0,
    keypress: 0,
    input: 0
  };

  // Zaman tabanlı event koruma
  function shouldHandleEvent(eventType) {
    const now = Date.now();
    const lastTime = lastEventTimes[eventType] || 0;
    
    if (now - lastTime < MIN_EVENT_INTERVAL) {
      return false;
    }
    
    lastEventTimes[eventType] = now;
    return true;
  }

  // Oyun başlatma butonu
  startBtn.addEventListener('click', eventController.throttle(startGame, 500));

  // Yeniden oyna butonu
  playAgainBtn.addEventListener('click', eventController.throttle(startGame, 500));

  // İpucu butonu
  hintButton.addEventListener('click', eventController.throttle(getHint, 500));

  // Ses butonu
  soundToggle.addEventListener('click', eventController.throttle(toggleSound, 300));

  // Skoru paylaş/kopyala butonları
  copyScoreBtn.addEventListener('click', eventController.throttle(copyScore, 300));
  shareScoreBtn.addEventListener('click', eventController.throttle(shareScore, 300));

  // Klavye olaylarını kontrol et
  document.addEventListener('keydown', function(e) {
    if (!shouldHandleEvent('keydown')) return;
    
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
  });
  
  // Ekrana tıklama olayı
  wordleGrid.addEventListener('click', function() {
    if (!shouldHandleEvent('input')) return;
    createVirtualKeyboard();
  });

  /**
   * Sanal klavye oluştur
   */
  function createVirtualKeyboard() {
    // Eğer oyun bitmişse işlem yapma
    if (gameState.isGameOver) return;
    
    // Eğer zaten sanal klavye açıksa tekrar oluşturma
    if (document.getElementById('virtual-keyboard')) return;
    
    // Sanal klavye oluştur
    const keyboardDiv = document.createElement('div');
    keyboardDiv.id = 'virtual-keyboard';
    keyboardDiv.style.position = 'fixed';
    keyboardDiv.style.top = '50%';
    keyboardDiv.style.left = '50%';
    keyboardDiv.style.transform = 'translate(-50%, -50%)';
    keyboardDiv.style.background = 'rgba(40, 40, 60, 0.95)';
    keyboardDiv.style.padding = '15px';
    keyboardDiv.style.borderRadius = '10px';
    keyboardDiv.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';
    keyboardDiv.style.zIndex = '1000';
    keyboardDiv.style.display = 'flex';
    keyboardDiv.style.flexDirection = 'column';
    keyboardDiv.style.gap = '8px';
    keyboardDiv.style.width = '90%';
    keyboardDiv.style.maxWidth = '500px';
    
    // Türkçe klavye düzeni
    const turkishKeyboard = [
      ["E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
      ["Z", "C", "V", "B", "N", "M", "Ö", "Ç"]
    ];
    
    // Klavye satırlarını oluştur
    turkishKeyboard.forEach(row => {
      const rowDiv = document.createElement('div');
      rowDiv.style.display = 'flex';
      rowDiv.style.justifyContent = 'center';
      rowDiv.style.gap = '5px';
      
      row.forEach(key => {
        const keyButton = document.createElement('button');
        keyButton.textContent = key;
        keyButton.style.padding = '12px';
        keyButton.style.minWidth = '30px';
        keyButton.style.background = 'rgba(60, 60, 80, 0.8)';
        keyButton.style.color = 'white';
        keyButton.style.border = 'none';
        keyButton.style.borderRadius = '5px';
        keyButton.style.fontWeight = 'bold';
        keyButton.style.cursor = 'pointer';
        
        // Tuşa tıklama olayı
        keyButton.addEventListener('click', eventController.throttle(function() {
          addLetter(key);
          playSound('keypress');
        }, MIN_EVENT_INTERVAL));
        
        rowDiv.appendChild(keyButton);
      });
      
      keyboardDiv.appendChild(rowDiv);
    });
    
    // Kontrol tuşlarını içeren son satır
    const controlRow = document.createElement('div');
    controlRow.style.display = 'flex';
    controlRow.style.justifyContent = 'center';
    controlRow.style.gap = '5px';
    controlRow.style.marginTop = '5px';
    
    // Backspace tuşu
    const backspaceBtn = document.createElement('button');
    backspaceBtn.innerHTML = '<i class="fas fa-backspace"></i> SİL';
    backspaceBtn.style.padding = '12px';
    backspaceBtn.style.background = 'rgba(80, 40, 40, 0.8)';
    backspaceBtn.style.color = 'white';
    backspaceBtn.style.border = 'none';
    backspaceBtn.style.borderRadius = '5px';
    backspaceBtn.style.fontWeight = 'bold';
    backspaceBtn.style.cursor = 'pointer';
    backspaceBtn.style.flex = '1';
    
    backspaceBtn.addEventListener('click', eventController.throttle(function() {
      deleteLetter();
      playSound('keypress');
    }, MIN_EVENT_INTERVAL));
    
    // Enter tuşu
    const enterBtn = document.createElement('button');
    enterBtn.innerHTML = '<i class="fas fa-level-down-alt fa-rotate-90"></i> ENTER';
    enterBtn.style.padding = '12px';
    enterBtn.style.background = 'rgba(40, 80, 40, 0.8)';
    enterBtn.style.color = 'white';
    enterBtn.style.border = 'none';
    enterBtn.style.borderRadius = '5px';
    enterBtn.style.fontWeight = 'bold';
    enterBtn.style.cursor = 'pointer';
    enterBtn.style.flex = '1';
    
    enterBtn.addEventListener('click', eventController.throttle(function() {
      submitGuess();
    }, MIN_EVENT_INTERVAL));
    
    // Kapat tuşu
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.style.padding = '12px 15px';
    closeBtn.style.background = 'rgba(60, 60, 60, 0.8)';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '5px';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.cursor = 'pointer';
    
    closeBtn.addEventListener('click', function() {
      document.body.removeChild(keyboardDiv);
    });
    
    controlRow.appendChild(backspaceBtn);
    controlRow.appendChild(enterBtn);
    controlRow.appendChild(closeBtn);
    
    keyboardDiv.appendChild(controlRow);
    
    // Sanal klavyeyi sayfaya ekle
    document.body.appendChild(keyboardDiv);
  }

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
    gameState.isProcessing = false;
    
    // Event zamanlarını sıfırla
    lastEventTimes = {
      keydown: 0,
      keypress: 0,
      input: 0
    };

    // Skorları güncelle
    updateScoreDisplay();

    // İpucu sayacını güncelle
    hintCount.textContent = gameState.hintsLeft;

    // Izgarayı oluştur
    createWordleGrid();

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
   * Harf ekleme
   */
  function addLetter(letter) {
    if (gameState.isGameOver) return;
    
    if (gameState.currentCol < 5) {
      gameState.guesses[gameState.currentRow][gameState.currentCol] = letter;
      updateGrid();
      gameState.currentCol++;
    }
  }

  /**
   * Harf silme
   */
  function deleteLetter() {
    if (gameState.isGameOver) return;
    
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
    if (gameState.isGameOver) return;
    
    if (gameState.currentCol < 5) {
      showMessage('Yetersiz harf! 5 harfli bir kelime girin.', 'warning');
      shakeRow(gameState.currentRow);
      return;
    }
    
    const guess = gameState.guesses[gameState.currentRow].join('');
    
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
    
    // Sanal klavye varsa kapat
    const virtualKeyboard = document.getElementById('virtual-keyboard');
    if (virtualKeyboard) {
      document.body.removeChild(virtualKeyboard);
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
  
  // Oyunu başlat
  startGame();
});
