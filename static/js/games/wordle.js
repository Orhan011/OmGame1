
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const startScreen = document.getElementById('start-screen');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const startBtn = document.getElementById('start-game');
  const pauseBtn = document.getElementById('pause-game');
  const resumeBtn = document.getElementById('resume-game');
  const pauseOverlay = document.getElementById('pause-overlay');
  const soundToggle = document.getElementById('sound-toggle');
  const wordleGrid = document.getElementById('wordle-grid');
  const keyboard = document.getElementById('keyboard');
  const enterKey = document.getElementById('enter-key');
  const backspaceKey = document.getElementById('backspace-key');
  const finalScore = document.getElementById('final-score');
  const finalTries = document.getElementById('final-tries');
  const correctWord = document.getElementById('correct-word');
  const playAgainBtn = document.getElementById('play-again');
  const copyScoreBtn = document.getElementById('copy-score');
  const shareScoreBtn = document.getElementById('share-score');
  const scoreDisplay = document.getElementById('score-display');
  const triesDisplay = document.getElementById('tries-display');
  const gamesDisplay = document.getElementById('games-display');
  const hintButton = document.getElementById('hint-button');
  const hintCount = document.getElementById('hint-count');
  const alertContainer = document.getElementById('alert-container');
  const ratingStars = document.querySelectorAll('.rating-stars i');
  const ratingText = document.getElementById('rating-text');

  // Oyun Durumu
  let gameState = {
    currentWord: '',
    tries: 0,
    currentRow: 0,
    currentTile: 0,
    isGameOver: false,
    isPaused: false,
    soundEnabled: true,
    score: 0,
    gamesPlayed: 0,
    hintsRemaining: 1,
    gameWon: false
  };

  // Ses Efektleri
  const sounds = {
    tile: new Audio('/static/sounds/click.mp3'),
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    flip: new Audio('/static/sounds/card-flip.mp3'),
    win: new Audio('/static/sounds/success.mp3'),
    lose: new Audio('/static/sounds/game-over.mp3'),
    hint: new Audio('/static/sounds/hint.mp3')
  };

  // Event Listeners
  startBtn.addEventListener('click', startGame);
  keyboard.addEventListener('click', handleKeyboardClick);
  document.addEventListener('keydown', handleKeyDown);
  pauseBtn.addEventListener('click', togglePause);
  resumeBtn.addEventListener('click', togglePause);
  soundToggle.addEventListener('click', toggleSound);
  playAgainBtn.addEventListener('click', startGame);
  copyScoreBtn.addEventListener('click', copyScore);
  shareScoreBtn.addEventListener('click', shareScore);
  hintButton.addEventListener('click', showHint);

  // Kelime seçme fonksiyonu - wordleWords.js dosyasından kelime listesini kullanır
  function selectRandomWord() {
    // 5 harfli Türkçe kelimeler listesinden rastgele seçim yapılır
    // wordleWords değişkeni wordleWords.js dosyasında tanımlanmıştır
    if (typeof turkishWords !== 'undefined' && turkishWords.length > 0) {
      return turkishWords[Math.floor(Math.random() * turkishWords.length)].toLowerCase();
    }
    // Eğer liste bulunamazsa varsayılan bazı kelimeler kullan
    const defaultWords = ['kalem', 'kitap', 'gazoz', 'horoz', 'bilge', 'hamur', 'kanat', 'konak', 'merak', 'roman', 'zemin'];
    return defaultWords[Math.floor(Math.random() * defaultWords.length)];
  }

  // Grid oluşturma fonksiyonu
  function createGrid() {
    wordleGrid.innerHTML = '';
    // 6 satır oluştur
    for (let i = 0; i < 6; i++) {
      const row = document.createElement('div');
      row.classList.add('wordle-row');
      row.setAttribute('data-row', i);
      
      // Her satırda 5 hücre oluştur
      for (let j = 0; j < 5; j++) {
        const tile = document.createElement('div');
        tile.classList.add('wordle-tile');
        tile.setAttribute('data-row', i);
        tile.setAttribute('data-col', j);
        row.appendChild(tile);
      }
      
      wordleGrid.appendChild(row);
    }
  }

  // Klavye tuşlarını sıfırlama
  function resetKeyboard() {
    const keys = document.querySelectorAll('.keyboard-key');
    keys.forEach(key => {
      key.classList.remove('correct', 'present', 'absent');
    });
  }

  // Oyunu başlat
  function startGame() {
    // Oyun durumunu sıfırla
    gameState = {
      currentWord: selectRandomWord(),
      tries: 0,
      currentRow: 0,
      currentTile: 0,
      isGameOver: false,
      isPaused: false,
      soundEnabled: gameState.soundEnabled,
      score: gameState.score,
      gamesPlayed: gameState.gamesPlayed + 1,
      hintsRemaining: 1,
      gameWon: false
    };
    
    console.log("Seçilen kelime:", gameState.currentWord); // Hata ayıklama için
    
    // Grid'i oluştur
    createGrid();
    
    // Klavyeyi sıfırla
    resetKeyboard();
    
    // Görünümü ayarla
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    gameOverContainer.style.display = 'none';
    pauseOverlay.style.display = 'none';
    
    // İpucu butonunu güncelle
    hintCount.textContent = `(${gameState.hintsRemaining})`;
    
    // İstatistikleri güncelle
    triesDisplay.textContent = `${gameState.tries}/6`;
    gamesDisplay.textContent = gameState.gamesPlayed;
    scoreDisplay.textContent = gameState.score;
  }

  // Klavye tıklaması yönetimi
  function handleKeyboardClick(e) {
    if (gameState.isGameOver || gameState.isPaused) return;
    
    const target = e.target;
    if (!target.classList.contains('keyboard-key')) return;
    
    const key = target.getAttribute('data-key');
    handleKey(key);
  }

  // Klavye tuşu yönetimi
  function handleKeyDown(e) {
    if (gameState.isGameOver || gameState.isPaused) return;
    if (gameContainer.style.display === 'none') return;
    
    const key = e.key;
    handleKey(key);
  }

  // Tuş işleme fonksiyonu
  function handleKey(key) {
    // Türkçe harfler ve kontrol tuşları
    const turkishLetters = 'abcçdefgğhıijklmnoöprsştuüvyz';
    
    if (key === 'Enter') {
      submitGuess();
    } else if (key === 'Backspace') {
      deleteLetter();
    } else if (turkishLetters.includes(key.toLowerCase())) {
      addLetter(key.toLowerCase());
    }
  }

  // Harf ekleme
  function addLetter(letter) {
    if (gameState.currentTile < 5) {
      const tile = document.querySelector(`.wordle-tile[data-row="${gameState.currentRow}"][data-col="${gameState.currentTile}"]`);
      
      tile.textContent = letter;
      tile.classList.add('filled', 'pop');
      
      // Pop animasyonu tamamlandığında sınıfı kaldır
      setTimeout(() => {
        tile.classList.remove('pop');
      }, 100);
      
      if (gameState.soundEnabled) {
        sounds.tile.currentTime = 0;
        sounds.tile.play().catch(e => console.log("Ses çalma hatası:", e));
      }
      
      gameState.currentTile++;
    }
  }

  // Harf silme
  function deleteLetter() {
    if (gameState.currentTile > 0) {
      gameState.currentTile--;
      
      const tile = document.querySelector(`.wordle-tile[data-row="${gameState.currentRow}"][data-col="${gameState.currentTile}"]`);
      
      tile.textContent = '';
      tile.classList.remove('filled');
      
      if (gameState.soundEnabled) {
        sounds.tile.currentTime = 0;
        sounds.tile.play().catch(e => console.log("Ses çalma hatası:", e));
      }
    }
  }

  // Tahmini gönderme
  function submitGuess() {
    if (gameState.currentTile !== 5) {
      // 5 harflik bir kelime tamamlanmadı
      showMessage("Lütfen 5 harfli bir kelime girin", "warning");
      shakeRow();
      return;
    }
    
    // Girilen kelimeyi al
    let guess = '';
    for (let i = 0; i < 5; i++) {
      const tile = document.querySelector(`.wordle-tile[data-row="${gameState.currentRow}"][data-col="${i}"]`);
      guess += tile.textContent;
    }
    
    // Kelime kontrolü (gerçek uygulamada kelime listesinden kontrol edilebilir)
    if (!isValidWord(guess)) {
      showMessage("Geçersiz kelime", "warning");
      shakeRow();
      return;
    }
    
    // Tahmini değerlendir
    evaluateGuess(guess);
    
    // Deneme sayısını artır
    gameState.tries++;
    triesDisplay.textContent = `${gameState.tries}/6`;
    
    // Oyun durumunu kontrol et
    if (guess === gameState.currentWord) {
      // Kazandı
      handleWin();
    } else if (gameState.tries >= 6) {
      // Kaybetti
      handleLoss();
    } else {
      // Bir sonraki satıra geç
      gameState.currentRow++;
      gameState.currentTile = 0;
    }
  }

  // Kelime kontrolü - basit doğrulama
  function isValidWord(word) {
    // 5 harfli olup olmadığını kontrol et
    if (word.length !== 5) return false;
    
    // Gerçek bir uygulama için kelime listesi kontrolü yapılabilir
    // Bu örnekte basit bir doğrulama yapıyoruz
    return true;
  }

  // Satırı salla (yanlış girişlerde)
  function shakeRow() {
    const row = document.querySelector(`.wordle-row[data-row="${gameState.currentRow}"]`);
    const tiles = row.querySelectorAll('.wordle-tile');
    
    tiles.forEach(tile => {
      tile.classList.add('shake');
    });
    
    if (gameState.soundEnabled) {
      sounds.wrong.currentTime = 0;
      sounds.wrong.play().catch(e => console.log("Ses çalma hatası:", e));
    }
    
    setTimeout(() => {
      tiles.forEach(tile => {
        tile.classList.remove('shake');
      });
    }, 500);
  }

  // Tahmini değerlendir
  function evaluateGuess(guess) {
    const result = checkGuess(guess, gameState.currentWord);
    animateTiles(result);
    updateKeyboard(guess, result);
  }

  // Tahmin sonucunu kontrol et
  function checkGuess(guess, answer) {
    // Her harf için durumu belirle: correct, present, absent
    const result = Array(5).fill('absent');
    const answerChars = answer.split('');
    
    // Önce doğru konumdakileri işaretle
    for (let i = 0; i < 5; i++) {
      if (guess[i] === answer[i]) {
        result[i] = 'correct';
        answerChars[i] = null; // İşaretlenen harfi kaldır
      }
    }
    
    // Sonra doğru harf yanlış konum olanları işaretle
    for (let i = 0; i < 5; i++) {
      if (result[i] === 'absent') {
        const charIndex = answerChars.indexOf(guess[i]);
        if (charIndex !== -1) {
          result[i] = 'present';
          answerChars[charIndex] = null; // İşaretlenen harfi kaldır
        }
      }
    }
    
    return result;
  }

  // Hücreleri animasyonlu göster
  function animateTiles(result) {
    for (let i = 0; i < 5; i++) {
      const tile = document.querySelector(`.wordle-tile[data-row="${gameState.currentRow}"][data-col="${i}"]`);
      
      // Animasyon için gecikme
      setTimeout(() => {
        // Flip animasyonu
        tile.classList.add('flip');
        
        if (gameState.soundEnabled) {
          sounds.flip.currentTime = 0;
          sounds.flip.play().catch(e => console.log("Ses çalma hatası:", e));
        }
        
        // Animasyon ortasında (90 derecede) rengi değiştir
        setTimeout(() => {
          tile.classList.add(result[i]);
        }, 250);
        
        // Animasyon bitiminde flip sınıfını kaldır
        setTimeout(() => {
          tile.classList.remove('flip');
        }, 500);
      }, i * 200); // Her hücre için gecikme
    }
  }

  // Klavyeyi güncelle
  function updateKeyboard(guess, result) {
    for (let i = 0; i < 5; i++) {
      const letter = guess[i];
      const status = result[i];
      const key = document.querySelector(`.keyboard-key[data-key="${letter}"]`);
      
      if (key) {
        // Tuşun mevcut durumunu koru veya yükselt
        if (status === 'correct') {
          key.classList.remove('present', 'absent');
          key.classList.add('correct');
        } else if (status === 'present' && !key.classList.contains('correct')) {
          key.classList.remove('absent');
          key.classList.add('present');
        } else if (status === 'absent' && !key.classList.contains('correct') && !key.classList.contains('present')) {
          key.classList.add('absent');
        }
      }
    }
  }

  // Oyunu kazanma durumu
  function handleWin() {
    gameState.isGameOver = true;
    gameState.gameWon = true;
    
    // Skoru hesapla (kalan hak sayısına göre bonus)
    const baseScore = 100; // Temel puan
    const triesBonus = (6 - gameState.tries) * 20; // Kalan deneme başına 20 puan
    const totalScore = baseScore + triesBonus;
    
    gameState.score += totalScore;
    
    if (gameState.soundEnabled) {
      sounds.win.play().catch(e => console.log("Ses çalma hatası:", e));
    }
    
    // Biraz bekle ve sonuç ekranını göster
    setTimeout(showGameOver, 1500);
    
    // Skoru kaydet
    if (window.saveScore) {
      window.saveScore('wordle', gameState.score);
    }
  }

  // Oyunu kaybetme durumu
  function handleLoss() {
    gameState.isGameOver = true;
    gameState.gameWon = false;
    
    if (gameState.soundEnabled) {
      sounds.lose.play().catch(e => console.log("Ses çalma hatası:", e));
    }
    
    // Biraz bekle ve sonuç ekranını göster
    setTimeout(showGameOver, 1500);
  }

  // Oyun sonu ekranını göster
  function showGameOver() {
    // İstatistikleri güncelle
    finalScore.textContent = gameState.score;
    finalTries.textContent = `${gameState.tries}/6`;
    correctWord.textContent = gameState.currentWord.toUpperCase();
    
    // Yıldız derecelendirmesini güncelle
    updateStarRating();
    
    // Oyun ekranını gizle, sonuç ekranını göster
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'block';
    
    // Skor göstergelerini güncelle
    scoreDisplay.textContent = gameState.score;
  }

  // Yıldız derecelendirmesini güncelleme
  function updateStarRating() {
    let rating = 0;
    
    if (gameState.gameWon) {
      // Deneme sayısına göre yıldız
      if (gameState.tries <= 2) rating = 5;
      else if (gameState.tries === 3) rating = 4;
      else if (gameState.tries === 4) rating = 3;
      else if (gameState.tries === 5) rating = 2;
      else rating = 1;
    } else {
      rating = 1; // Kaybedince 1 yıldız
    }
    
    // Yıldızları güncelle
    ratingStars.forEach((star, index) => {
      if (index < rating) {
        star.className = 'fas fa-star';
      } else {
        star.className = 'far fa-star';
      }
    });
    
    // Derecelendirme metnini güncelle
    let ratingTexts = ["Zayıf", "İdare Eder", "İyi!", "Çok İyi!", "Mükemmel!"];
    ratingText.textContent = ratingTexts[rating - 1];
  }

  // Oyunu duraklat/devam ettir
  function togglePause() {
    if (gameState.isGameOver) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
      pauseOverlay.style.display = 'flex';
    } else {
      pauseOverlay.style.display = 'none';
    }
  }

  // Sesi aç/kapat
  function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    
    if (gameState.soundEnabled) {
      soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
      soundToggle.classList.add('active');
    } else {
      soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
      soundToggle.classList.remove('active');
    }
  }

  // İpucu göster
  function showHint() {
    if (gameState.hintsRemaining <= 0) {
      showMessage("İpucu hakkınız kalmadı", "warning");
      return;
    }
    
    // Rastgele bir konumu bul
    let availablePositions = [];
    for (let i = 0; i < 5; i++) {
      const tile = document.querySelector(`.wordle-tile[data-row="${gameState.currentRow}"][data-col="${i}"]`);
      if (!tile.textContent) {
        availablePositions.push(i);
      }
    }
    
    // Boş hücre yoksa dolulara ekle
    if (availablePositions.length === 0) {
      for (let i = 0; i < 5; i++) {
        availablePositions.push(i);
      }
    }
    
    // Rastgele bir konum seç
    const hintPosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];
    
    // İpucu harfini göster
    const hintLetter = gameState.currentWord[hintPosition];
    const tile = document.querySelector(`.wordle-tile[data-row="${gameState.currentRow}"][data-col="${hintPosition}"]`);
    
    tile.textContent = hintLetter;
    tile.classList.add('filled', 'correct');
    
    // İpucu kullanıldı
    gameState.hintsRemaining--;
    hintCount.textContent = `(${gameState.hintsRemaining})`;
    
    // Hücre indeksini güncelle
    if (gameState.currentTile <= hintPosition) {
      gameState.currentTile = hintPosition + 1;
    }
    
    // İpucu sesi çal
    if (gameState.soundEnabled) {
      sounds.hint.play().catch(e => console.log("Ses çalma hatası:", e));
    }
    
    showMessage("İpucu gösterildi!", "info");
  }

  // Mesaj göster
  function showMessage(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // 3 saniye sonra otomatik kaldır
    setTimeout(() => {
      alert.classList.remove('show');
      setTimeout(() => {
        if (alert.parentNode === alertContainer) {
          alertContainer.removeChild(alert);
        }
      }, 300);
    }, 3000);
  }

  // Skoru kopyala
  function copyScore() {
    let scoreText;
    
    if (gameState.gameWon) {
      scoreText = `Wordle oyununda ${gameState.currentWord.toUpperCase()} kelimesini ${gameState.tries}/6 denemede buldum ve ${gameState.score} puan kazandım!`;
    } else {
      scoreText = `Wordle oyununda ${gameState.currentWord.toUpperCase()} kelimesini bulamadım. Skorumuz: ${gameState.score}`;
    }
    
    navigator.clipboard.writeText(scoreText)
      .then(() => {
        showMessage('Skor kopyalandı!', 'success');
      })
      .catch(err => {
        console.error('Kopyalama başarısız: ', err);
        showMessage('Kopyalama başarısız', 'danger');
      });
  }

  // Skoru paylaş
  function shareScore() {
    let scoreText;
    
    if (gameState.gameWon) {
      scoreText = `Wordle oyununda ${gameState.currentWord.toUpperCase()} kelimesini ${gameState.tries}/6 denemede buldum ve ${gameState.score} puan kazandım!`;
    } else {
      scoreText = `Wordle oyununda ${gameState.currentWord.toUpperCase()} kelimesini bulamadım. Skorumuz: ${gameState.score}`;
    }
    
    if (navigator.share) {
      navigator.share({
        title: 'Wordle Skorum',
        text: scoreText,
      })
      .catch(error => console.log('Paylaşım başarısız:', error));
    } else {
      copyScore();
    }
  }
});
