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
    }
  };

  // Mobil klavye girişi için gizli input oluştur
  let mobileInput = null;
  
  function createMobileInput() {
    if (!mobileInput) {
      mobileInput = document.createElement('input');
      mobileInput.type = 'text';
      mobileInput.inputMode = 'text';
      mobileInput.autocomplete = 'off';
      mobileInput.autocorrect = 'off';
      mobileInput.autocapitalize = 'off';
      mobileInput.spellcheck = false;
      mobileInput.style.position = 'absolute';
      mobileInput.style.opacity = '0';
      mobileInput.style.pointerEvents = 'none';
      mobileInput.style.height = '1px';
      mobileInput.style.width = '1px';
      mobileInput.style.left = '-1000px';
      mobileInput.maxLength = 1;
      gameContainer.appendChild(mobileInput);
      
      // Mobil input olayları
      mobileInput.addEventListener('input', (e) => {
        const char = e.target.value.toUpperCase();
        if (/^[A-ZĞÜŞİÖÇ]$/.test(char)) {
          addLetter(char);
          playSound('keypress');
        }
        // Her girişten sonra input'u temizle
        e.target.value = '';
      });
      
      // Mobil input silme işlemi için özel olay
      mobileInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
          e.preventDefault(); // Varsayılan davranışı engelle
          deleteLetter();
          playSound('keypress');
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

  // Klavye tuşu basımı
  document.addEventListener('keydown', handleKeyPress);
  
  // Ekrana tıklama olayı - mobil input için
  wordleGrid.addEventListener('click', focusMobileInput);
  keyboard.addEventListener('click', focusMobileInput);

  /**
   * Oyunu başlatır
   */
  function startGame() {
    // Arayüzü sıfırla
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    gameOverContainer.style.display = 'none';

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

    // Skorları güncelle
    updateScoreDisplay();

    // İpucu sayacını güncelle
    hintCount.textContent = gameState.hintsLeft;

    // Grid ve klavyeyi oluştur
    createWordleGrid();
    createKeyboard();
    
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
   * Klavyeyi oluşturur
   */
  function createKeyboard() {
    if (keyboardRow1) keyboardRow1.innerHTML = '';
    if (keyboardRow2) keyboardRow2.innerHTML = '';
    if (keyboardRow3) keyboardRow3.innerHTML = '';
    
    // Klavye düzenini oluştur
    turkishKeyboard.forEach((row, rowIndex) => {
      const rowContainer = document.getElementById(`keyboard-row-${rowIndex + 1}`);
      if (!rowContainer) return;
      
      row.forEach(key => {
        const keyButton = document.createElement('button');
        keyButton.className = 'keyboard-key';
        keyButton.textContent = key;
        
        if (key === 'SİL' || key === 'ENTER') {
          keyButton.classList.add('wide');
        }
        
        keyButton.addEventListener('click', () => {
          handleKeyboardClick(key);
        });
        
        rowContainer.appendChild(keyButton);
      });
    });
  }

  /**
   * Klavye tıklaması işleme
   */
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
    
    // Mobil cihazlarda sanal klavyeyi göster
    focusMobileInput();
  }

  /**
   * Klavye tuşu basımını işleme
   */
  function handleKeyPress(e) {
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
    
    // Klavyeyi güncelle
    updateKeyboard(result);
    
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
   * Klavyeyi günceller
   */
  function updateKeyboard(result) {
    const guess = gameState.guesses[gameState.currentRow];
    
    for (let i = 0; i < 5; i++) {
      const letter = guess[i];
      const status = result[i];
      
      // Klavye tuşlarını bul
      const keyButtons = document.querySelectorAll('.keyboard-key');
      
      keyButtons.forEach(button => {
        if (button.textContent === letter) {
          // Eğer tuş zaten doğru olarak işaretlenmişse, o durumu koru
          if (button.classList.contains('correct')) {
            return;
          }
          
          // Eğer tuş zaten var ama yanlış yerde olarak işaretlenmişse ve şu an doğru değilse, o durumu koru
          if (button.classList.contains('present') && status !== 'correct') {
            return;
          }
          
          // Tüm sınıfları temizle ve yeni durumu ekle
          button.classList.remove('correct', 'present', 'absent');
          button.classList.add(status);
        }
      });
    }
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
    if (hintCount) hintCount.textContent = gameState.hintsLeft;
    
    // Rastgele bir konumda henüz doğru tahmin edilmemiş bir harf ver
    const currentGuess = gameState.guesses[gameState.currentRow];
    const correctPositions = [];
    
    // Mevcut satırdaki doğru harfleri bul
    for (let i = 0; i < 5; i++) {
      const cells = document.querySelectorAll(`.wordle-cell[data-col="${i}"]`);
      let isCorrect = false;
      
      cells.forEach(cell => {
        if (cell.classList.contains('correct')) {
          isCorrect = true;
        }
      });
      
      if (!isCorrect) {
        correctPositions.push(i);
      }
    }
    
    // Henüz doğru tahmin edilmemiş pozisyonlardan birini seç
    if (correctPositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * correctPositions.length);
      const hintPosition = correctPositions[randomIndex];
      const hintLetter = gameState.answer[hintPosition];
      
      showMessage(`İpucu: ${hintPosition + 1}. harf "${hintLetter}"`, 'info');
      playSound('hint');
    } else {
      showMessage('Tüm harfler zaten doğru tahmin edilmiş!', 'info');
      // İpucu hakkını geri ver
      gameState.hintsLeft++;
      if (hintCount) hintCount.textContent = gameState.hintsLeft;
    }
  }

  /**
   * Oyunu bitirir
   */
  function endGame(isWin) {
    gameState.isGameOver = true;
    
    if (isWin) {
      gameState.streak++;
      if (resultMessage) resultMessage.textContent = 'Tebrikler! Kelimeyi buldunuz.';
      playSound('gameWin');
    } else {
      gameState.streak = 0;
      if (resultMessage) resultMessage.textContent = 'Üzgünüm, kelimeyi bulamadınız.';
      playSound('gameLose');
    }
    
    // Doğru cevabı göster
    if (answerReveal) answerReveal.textContent = gameState.answer;
    
    // Son skorları güncelle
    if (finalScore) finalScore.textContent = gameState.score;
    if (attemptsCount) attemptsCount.textContent = `${gameState.currentRow}/6`;
    if (finalStreak) finalStreak.textContent = gameState.streak;
    
    // Derecelendirmeyi güncelle
    updateRating(isWin);
    
    // Oyun sonu ekranını göster
    setTimeout(() => {
      if (gameContainer) gameContainer.style.display = 'none';
      if (gameOverContainer) gameOverContainer.style.display = 'block';
    }, 1000);
    
    // Skoru kaydet
    saveScore();
  }

  /**
   * Derecelendirmeyi günceller
   */
  function updateRating(isWin) {
    const ratingStars = document.querySelectorAll('.rating-stars i');
    const ratingText = document.getElementById('rating-text');
    
    let stars = 0;
    let ratingMessage = '';
    
    if (isWin) {
      // Kaç denemede kazandığına göre yıldız sayısını belirle
      if (gameState.currentRow <= 2) { // 1-2 denemede
        stars = 5;
        ratingMessage = 'Muhteşem!';
      } else if (gameState.currentRow <= 3) { // 3 denemede
        stars = 4;
        ratingMessage = 'Çok iyi!';
      } else if (gameState.currentRow <= 4) { // 4 denemede
        stars = 3;
        ratingMessage = 'İyi!';
      } else { // 5-6 denemede
        stars = 2;
        ratingMessage = 'Fena değil!';
      }
    } else {
      // Kaybettiyse 1 yıldız
      stars = 1;
      ratingMessage = 'Bir dahaki sefere!';
    }
    
    // Yıldızları güncelle
    if (ratingStars && ratingStars.length) {
      for (let i = 0; i < ratingStars.length; i++) {
        if (i < stars) {
          ratingStars[i].className = 'fas fa-star';
        } else {
          ratingStars[i].className = 'far fa-star';
        }
      }
    }
    
    // Derecelendirme metnini güncelle
    if (ratingText) ratingText.textContent = ratingMessage;
  }

  /**
   * Mesaj gösterme
   */
  function showMessage(message, type) {
    if (!messageContainer) return;
    
    // Önceki mesajları temizle
    messageContainer.innerHTML = '';
    
    // Yeni mesaj oluştur
    const messageElement = document.createElement('div');
    messageElement.className = `game-message ${type}`;
    messageElement.textContent = message;
    
    // Mesajı ekle
    messageContainer.appendChild(messageElement);
    
    // Süre sonunda mesajı kaldır
    setTimeout(() => {
      if (messageContainer.contains(messageElement)) {
        messageContainer.removeChild(messageElement);
      }
    }, 3000);
  }

  /**
   * Ses çalma
   */
  function playSound(soundName) {
    if (!gameState.soundEnabled) return;
    
    try {
      sounds[soundName].currentTime = 0;
      sounds[soundName].play();
    } catch (error) {
      console.error("Ses çalma hatası:", error);
    }
  }

  /**
   * Ses açıp/kapatma
   */
  function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    
    // Buton stilini güncelle
    if (soundToggle) {
      if (gameState.soundEnabled) {
        soundToggle.classList.add('active');
        soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
      } else {
        soundToggle.classList.remove('active');
        soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
      }
    }
  }

  /**
   * Sesleri sıfırlama
   */
  function resetSounds() {
    for (const sound in sounds) {
      sounds[sound].pause();
      sounds[sound].currentTime = 0;
    }
  }

  /**
   * Skoru kopyalama
   */
  function copyScore() {
    const scoreText = `Wordle Skorumu Gör:\nSkor: ${gameState.score}\nTahmin: ${gameState.currentRow}/6\nSeri: ${gameState.streak}\n`;
    
    navigator.clipboard.writeText(scoreText)
      .then(() => {
        showMessage('Skor kopyalandı!', 'success');
      })
      .catch(() => {
        showMessage('Kopyalama başarısız!', 'error');
      });
  }

  /**
   * Skoru paylaşma
   */
  function shareScore() {
    const shareData = {
      title: 'Wordle Skorumu Gör',
      text: `Bugünkü Wordle skorumu görmek ister misin?\nSkor: ${gameState.score}\nTahmin: ${gameState.currentRow}/6\nSeri: ${gameState.streak}`
    };
    
    if (navigator.share) {
      navigator.share(shareData)
        .then(() => {
          showMessage('Paylaşım başarılı!', 'success');
        })
        .catch(() => {
          showMessage('Paylaşım başarısız!', 'error');
          copyScore(); // Alternatif olarak kopyala
        });
    } else {
      showMessage('Paylaşım desteklenmiyor!', 'warning');
      copyScore(); // Alternatif olarak kopyala
    }
  }

  /**
   * Skoru kaydetme
   */
  function saveScore() {
    // Sadece kullanıcı giriş yapmışsa skoru kaydet
    if (typeof saveGameScore === 'function') {
      saveGameScore('wordle', gameState.score);
    }
  }
});
