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
    debounceTime: 200, // ms
    keyboardVisible: false
  };

  // Ekrana özel klavye oluşturma
  function createCustomKeyboard() {
    // Ekrandaki standart klavyeyi gizle
    if (keyboard) {
      keyboard.style.display = 'none';
    }
    
    // Özel klavyemizi oluştur
    const customKeyboard = document.createElement('div');
    customKeyboard.id = 'custom-keyboard';
    customKeyboard.className = 'custom-keyboard';
    customKeyboard.style.display = 'flex';
    customKeyboard.style.flexDirection = 'column';
    customKeyboard.style.gap = '8px';
    customKeyboard.style.maxWidth = '500px';
    customKeyboard.style.margin = '0 auto 20px';
    customKeyboard.style.padding = '10px';
    customKeyboard.style.backgroundColor = 'rgba(30, 30, 50, 0.9)';
    customKeyboard.style.borderRadius = '10px';
    customKeyboard.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
    
    // Klavye düzeni
    const keyboardLayout = [
      ["E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
      ["SİL", "Z", "C", "V", "B", "N", "M", "Ö", "Ç", "ENTER"]
    ];
    
    // Klavye satırlarını oluştur
    keyboardLayout.forEach((row, rowIndex) => {
      const keyboardRow = document.createElement('div');
      keyboardRow.className = 'custom-keyboard-row';
      keyboardRow.style.display = 'flex';
      keyboardRow.style.justifyContent = 'center';
      keyboardRow.style.gap = '4px';
      
      row.forEach(key => {
        const keyButton = document.createElement('button');
        keyButton.className = 'custom-keyboard-key';
        keyButton.textContent = key;
        keyButton.style.padding = '12px 8px';
        keyButton.style.minWidth = '30px';
        keyButton.style.backgroundColor = 'rgba(60, 60, 80, 0.8)';
        keyButton.style.color = 'white';
        keyButton.style.border = 'none';
        keyButton.style.borderRadius = '5px';
        keyButton.style.fontWeight = 'bold';
        keyButton.style.cursor = 'pointer';
        keyButton.style.flex = '1';
        
        if (key === 'SİL' || key === 'ENTER') {
          keyButton.style.flex = '1.5';
          keyButton.style.fontSize = '0.9rem';
        }
        
        keyButton.addEventListener('click', () => {
          handleKeyboardClick(key);
        });
        
        keyboardRow.appendChild(keyButton);
      });
      
      customKeyboard.appendChild(keyboardRow);
    });
    
    // Ekle
    gameContainer.appendChild(customKeyboard);
    return customKeyboard;
  }
  
  // Klavye tıklaması işleme
  function handleKeyboardClick(key) {
    if (gameState.isGameOver) return;
    
    playSound('keypress');
    
    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'SİL') {
      deleteLetter();
    } else {
      addLetter(key);
    }
  }

  // Olay dinleyicileri
  startBtn.addEventListener('click', startGame);
  playAgainBtn.addEventListener('click', startGame);
  hintButton.addEventListener('click', getHint);
  soundToggle.addEventListener('click', toggleSound);
  copyScoreBtn.addEventListener('click', copyScore);
  shareScoreBtn.addEventListener('click', shareScore);

  // Debounce fonksiyonu
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
  
  // Ekrana tıklama olayı
  wordleGrid.addEventListener('click', function() {
    // Bu fonksiyon artık boş, klavye yönetimini ekranda tuşlarla yapıyoruz
  });

  /**
   * Oyunu başlatır
   */
  function startGame() {
    // Arayüzü sıfırla
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    gameOverContainer.style.display = 'none';
    
    // Özel klavyeyi oluştur
    createCustomKeyboard();

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

    // Grid oluştur
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
    
    // Klavye tuşlarını güncelle
    updateKeyboardKeys(result, guess);
  }

  /**
   * Klavye tuşlarını günceller
   */
  function updateKeyboardKeys(result, guess) {
    const customKeyboard = document.getElementById('custom-keyboard');
    if (!customKeyboard) return;
    
    const keys = customKeyboard.querySelectorAll('.custom-keyboard-key');
    const guessLetters = guess.split('');
    
    for (let i = 0; i < 5; i++) {
      const letter = guessLetters[i];
      const status = result[i];
      
      keys.forEach(key => {
        if (key.textContent === letter) {
          // Önceki durumlarını kontrol et
          if (key.classList.contains('correct')) {
            return; // Zaten doğru işaretlenmişse değiştirme
          }
          
          if (key.classList.contains('present') && status !== 'correct') {
            return; // Doğru harf yanlış yerde işaretlenmişse ve şimdi doğru değilse, değiştirme
          }
          
          // Sınıfları temizle
          key.classList.remove('correct', 'present', 'absent');
          
          // Duruma göre stil ekle
          key.classList.add(status);
          
          // Duruma göre renk değiştir
          if (status === 'correct') {
            key.style.backgroundColor = 'rgba(46, 204, 113, 0.7)';
          } else if (status === 'present') {
            key.style.backgroundColor = 'rgba(241, 196, 15, 0.7)';
          } else if (status === 'absent') {
            key.style.backgroundColor = 'rgba(30, 30, 40, 0.9)';
            key.style.color = 'rgba(255, 255, 255, 0.5)';
          }
        }
      });
    }
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

  // CSS ekleme - klavye ve fixed pozisyon düzeltmesi
  function addCustomCSS() {
    const customStyle = document.createElement('style');
    customStyle.textContent = `
      /* Wordle özel stil düzeltmeleri */
      .wordle-grid {
        margin-bottom: 10px !important;
      }
      
      .custom-keyboard {
        position: relative;
        z-index: 10;
      }
      
      /* Mobil düzeltmeler */
      @media (max-width: 576px) {
        .custom-keyboard-key {
          padding: 10px 5px !important;
          font-size: 0.85rem !important;
        }
      }
      
      /* IPad düzeltmeler */
      @media (min-width: 768px) {
        .wordle-grid {
          margin-bottom: 20px !important;
        }
      }
      
      /* Animasyon düzeltmeleri */
      .flip {
        backface-visibility: hidden;
        transform-style: preserve-3d;
      }
    `;
    document.head.appendChild(customStyle);
  }
  
  // Özel CSS'i ekle
  addCustomCSS();

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
});

// Touch input desteği ekleyen yardımcı fonksiyon
document.addEventListener('DOMContentLoaded', function() {
  // Detect touch device
  function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  }
  
  // If touch device, add scrolling fix
  if (isTouchDevice()) {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0";
    } else {
      const newViewport = document.createElement('meta');
      newViewport.name = 'viewport';
      newViewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0";
      document.head.appendChild(newViewport);
    }
    
    // Prevent scrolling when touching game elements
    document.body.addEventListener('touchmove', function(e) {
      if (e.target.closest('.wordle-cell') || e.target.closest('.custom-keyboard-key')) {
        e.preventDefault();
      }
    }, { passive: false });
  }
});
