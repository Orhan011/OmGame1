document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const startScreen = document.getElementById('start-screen');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const startBtn = document.getElementById('start-game');
  const playAgainBtn = document.getElementById('play-again');
  const wordleGrid = document.getElementById('wordle-grid');
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
  const submitGuessBtn = document.getElementById('submit-guess-btn');
  const deleteLetterBtn = document.getElementById('delete-letter-btn');
  const hiddenInput = document.getElementById('hidden-input');

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
    guesses: [],
    isGameOver: false,
    score: 0,
    streak: 0,
    hintsLeft: 3,
    soundEnabled: true,
    activeCellIndex: 0,  // Aktif hücre indeksi
    isProcessingKey: false, // Tuş işleme durumu
    lastKeyTime: 0 // Son tuş basma zamanı
  };

  // Türkçe kelime listesi - 5 harfli kelimeler
  const wordList = [
    "kalem", "kitap", "araba", "ağaç", "çiçek", "deniz", "güneş", "kuşlar",
    "bulut", "yağmur", "orman", "dağlar", "nehir", "cadde", "sokak", "kapı", 
    "bina", "tablo", "masa", "koltuk", "yatak", "yastık", "halı", "perde", 
    "lamba", "dolap", "musluk", "duvar", "bahçe", "çatı", "ateş", "toprak", 
    "hava", "meyve", "sebze", "ekmek", "yemek", "uyku", "uzak", "yakın", 
    "büyük", "küçük", "kısa", "uzun", "kalın", "ince", "sıcak", "soğuk",
    "yaşlı", "genç", "mutlu", "üzgün", "gece", "sabah", "öğlen", "akşam", 
    "bugün", "yarın", "hafta", "saat", "hayat", "ölüm", "sağlık"
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

  // Tahmin gönder butonu
  submitGuessBtn.addEventListener('click', function(e) {
    e.preventDefault(); // Sayfa kaydırmasını engelle
    submitGuess();
  });

  // Harf sil butonu
  deleteLetterBtn.addEventListener('click', function(e) {
    e.preventDefault(); // Sayfa kaydırmasını engelle
    deleteLetter();
  });

  // Kaydırma olayını engelle
  submitGuessBtn.addEventListener('touchstart', function(e) {
    e.preventDefault();
  });
  
  deleteLetterBtn.addEventListener('touchstart', function(e) {
    e.preventDefault();
  });

  // Karelere tıklama olayını engelle
  wordleGrid.addEventListener('touchstart', function(e) {
    e.preventDefault();
  });

  // Mobil kareye tıklandığında ve klavye açıldığında gizli inputu hazırla
  hiddenInput.addEventListener('focus', function() {
    // Input değerini temizle
    hiddenInput.value = '';
  });
  
  // Tuş basma olayını doğrudan dinle
  hiddenInput.addEventListener('input', function(e) {
    if (gameState.isGameOver) return;
    
    // Tuş basma olayını ele al
    const now = Date.now();
    
    // Çok hızlı ardışık tuşlamaları engellemek için
    if (now - gameState.lastKeyTime < 100) {
      e.preventDefault();
      hiddenInput.value = '';
      return;
    }
    
    // Tuş girişini işle
    if (e.target.value) {
      const letter = e.target.value.toUpperCase();
      
      // Sadece harfler
      if (/^[A-ZĞÜŞİÖÇ]$/i.test(letter)) {
        addLetter(letter);
        playSound('keypress');
        
        // Zaman bilgisini güncelle
        gameState.lastKeyTime = now;
      }
      
      // Input alanını temizle
      e.target.value = '';
    }
  });

  // Klavye tuşu basımı (doküman genelinde)
  document.addEventListener('keydown', function(e) {
    if (gameState.isGameOver || gameContainer.style.display === 'none') return;
    
    const key = e.key.toUpperCase();
    
    if (key === 'ENTER') {
      e.preventDefault();
      submitGuess();
    } else if (key === 'BACKSPACE') {
      e.preventDefault();
      deleteLetter();
      playSound('keypress');
    } else if (/^[A-ZĞÜŞİÖÇ]$/.test(key)) {
      e.preventDefault();
      
      // Çok hızlı ardışık tuşlamaları engellemek için
      const now = Date.now();
      if (now - gameState.lastKeyTime < 100) {
        return;
      }
      
      addLetter(key);
      playSound('keypress');
      
      // Zaman bilgisini güncelle
      gameState.lastKeyTime = now;
    }
  });

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
    gameState.activeCellIndex = 0;
    gameState.isProcessingKey = false;
    gameState.lastKeyTime = 0;

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
    
    // Input alanını temizle
    hiddenInput.value = '';
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
        
        // Hücreye tıklama olayı
        cell.addEventListener('click', function(e) {
          e.preventDefault(); // Sayfa kaydırmasını engelle
          
          if (gameState.isGameOver) return;
          
          const clickedRow = parseInt(cell.dataset.row);
          const clickedCol = parseInt(cell.dataset.col);
          
          // Sadece aktif satırdaki hücrelerin tıklanabilir olmasını sağla
          if (clickedRow === gameState.currentRow) {
            // Tıklanan hücreyi aktif olarak işaretle
            gameState.activeCellIndex = clickedCol;
            highlightActiveCell();
            
            // Mobil klavyeyi aktifleştir
            hiddenInput.value = '';
            hiddenInput.focus();
            
            playSound('keypress');
          }
        });
        
        rowDiv.appendChild(cell);
      }
      
      wordleGrid.appendChild(rowDiv);
    }
    
    // İlk satırı ve hücreyi aktif olarak işaretle
    updateGrid();
    highlightActiveCell();
  }

  /**
   * Aktif hücreyi vurgular
   */
  function highlightActiveCell() {
    // Önce tüm hücrelerden 'active' sınıfını kaldır
    document.querySelectorAll('.wordle-cell').forEach(cell => {
      cell.classList.remove('active');
    });
    
    // Sadece mevcut satırdaki aktif hücreyi vurgula
    if (gameState.currentRow < 6) {
      const activeCell = document.querySelector(`.wordle-cell[data-row="${gameState.currentRow}"][data-col="${gameState.activeCellIndex}"]`);
      if (activeCell) {
        activeCell.classList.add('active');
      }
    }
  }

  /**
   * Harf ekleme
   */
  function addLetter(letter) {
    if (gameState.isGameOver) return;
    
    // Aktif hücre boşsa harfi ekle
    if (gameState.guesses[gameState.currentRow][gameState.activeCellIndex] === '') {
      // Aktif hücreye harfi yerleştir
      gameState.guesses[gameState.currentRow][gameState.activeCellIndex] = letter;
      
      // Dolu hücre sayısını güncelle
      gameState.currentCol = countFilledCells();
      
      // Bir sonraki boş hücreye geç
      if (gameState.currentCol < 5) {
        // 5'den küçükse aktif hücreyi ilerlet
        gameState.activeCellIndex = (gameState.activeCellIndex + 1) % 5;
      }
      
      // Izgarayı güncelle
      updateGrid();
      highlightActiveCell();
    }
  }

  /**
   * Dolu hücre sayısını hesaplar
   */
  function countFilledCells() {
    let count = 0;
    for (let i = 0; i < 5; i++) {
      if (gameState.guesses[gameState.currentRow] && gameState.guesses[gameState.currentRow][i]) {
        count++;
      }
    }
    return count;
  }

  /**
   * Harf silme
   */
  function deleteLetter() {
    if (gameState.isGameOver) return;
    
    // Mevcut hücre boş ise ve en solda değilse, sola geç
    if (gameState.guesses[gameState.currentRow][gameState.activeCellIndex] === '' && gameState.activeCellIndex > 0) {
      gameState.activeCellIndex--;
    }
    
    // Aktif hücredeki harfi sil
    if (gameState.guesses[gameState.currentRow][gameState.activeCellIndex] !== '') {
      // Sadece bir harf sil
      gameState.guesses[gameState.currentRow][gameState.activeCellIndex] = '';
      
      // Dolu hücre sayısını güncelle
      gameState.currentCol = countFilledCells();
      
      // Izgarayı güncelle
      updateGrid();
      highlightActiveCell();
    }
  }

  /**
   * Tahmini gönderme
   */
  function submitGuess() {
    if (gameState.isGameOver) return;
    
    // Tüm satırın dolu olduğunu kontrol et
    const filledCount = countFilledCells();
    if (filledCount < 5) {
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
    gameState.activeCellIndex = 0;
    
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
    } else {
      // Sonraki satıra geçildiğinde ızgarayı güncelle
      setTimeout(() => {
        updateGrid();
        highlightActiveCell();
      }, 1600); // Animasyondan sonra
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
      }
    }
    
    // Sonra doğru harf yanlış yerde olanları kontrol et
    for (let i = 0; i < 5; i++) {
      if (result[i] === 'absent') {
        const index = answerLetters.indexOf(guessLetters[i]);
        if (index !== -1) {
          result[i] = 'present';
          answerLetters[index] = null; // Tekrar kontrol edilmemesi için harfi işaretle
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
        
        // Hücre değerini güncelle (hata kontrolü ile)
        if (gameState.guesses[row] && gameState.guesses[row][col] !== undefined) {
          cell.textContent = gameState.guesses[row][col];
          
          // Hücre dolu mu kontrol et
          if (gameState.guesses[row][col]) {
            cell.classList.add('filled');
          } else {
            cell.classList.remove('filled');
          }
        } else {
          cell.textContent = '';
          cell.classList.remove('filled');
        }
        
        // Aktif satır vurgusu
        if (row === gameState.currentRow) {
          cell.classList.add('current-row');
        } else {
          cell.classList.remove('current-row');
        }
      }
    }
  }

  /**
   * Satırı sallama animasyonu
   */
  function shakeRow(row) {
    const rowElement = document.querySelector(`.wordle-row[data-row="${row}"]`);
    rowElement.classList.add('shake');
    
    setTimeout(() => {
      rowElement.classList.remove('shake');
    }, 500);
    
    // Hata sesi çal
    playSound('wrong');
  }

  /**
   * Mesaj gösterme
   */
  function showMessage(text, type = 'info') {
    messageContainer.innerHTML = '';
    const messageElement = document.createElement('div');
    messageElement.className = `game-message ${type}`;
    messageElement.textContent = text;
    messageContainer.appendChild(messageElement);
    
    // Mesajı otomatik olarak temizle
    setTimeout(() => {
      if (messageContainer.contains(messageElement)) {
        messageContainer.removeChild(messageElement);
      }
    }, 3000);
  }

  /**
   * Skoru güncelleme
   */
  function updateScore(result) {
    // Doğru harfler için puan ekle
    let roundScore = 0;
    result.forEach(r => {
      if (r === 'correct') roundScore += 10;
      else if (r === 'present') roundScore += 3;
    });
    
    // Erken tahmin bonusu - daha az denemede bulursan daha çok puan
    const attemptMultiplier = Math.max(1, 1.5 - (gameState.currentRow * 0.1));
    roundScore = Math.round(roundScore * attemptMultiplier);
    
    gameState.score += roundScore;
    scoreDisplay.textContent = gameState.score;
  }

  /**
   * Skor/göstergeleri güncelle
   */
  function updateScoreDisplay() {
    scoreDisplay.textContent = gameState.score;
    guessesDisplay.textContent = `${gameState.currentRow}/6`;
    streakDisplay.textContent = gameState.streak;
  }

  /**
   * İpucu alma
   */
  function getHint() {
    if (gameState.hintsLeft <= 0) {
      showMessage('İpucu hakkınız kalmadı!', 'warning');
      return;
    }
    
    if (gameState.isGameOver) return;
    
    // Doğru harf sayısını kontrol et
    let filledCount = 0;
    let emptyIndices = [];
    
    // Mevcut satırdaki dolu ve boş hücreleri bul
    for (let i = 0; i < 5; i++) {
      if (gameState.guesses[gameState.currentRow] && gameState.guesses[gameState.currentRow][i]) {
        filledCount++;
      } else {
        emptyIndices.push(i);
      }
    }
    
    // Tüm satır doldurulmuşsa ipucu verme
    if (filledCount === 5) {
      showMessage('Bu satır zaten dolu!', 'warning');
      return;
    }
    
    // Rastgele boş bir hücre için doğru harfi göster
    const randomEmptyIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    gameState.guesses[gameState.currentRow][randomEmptyIndex] = gameState.answer[randomEmptyIndex];
    
    // İpucu sayısını azalt
    gameState.hintsLeft--;
    hintCount.textContent = gameState.hintsLeft;
    
    // Izgarayı güncelle
    updateGrid();
    
    // Dolu hücre sayısını güncelle
    gameState.currentCol = countFilledCells();
    
    // Sonraki boş hücreye geç
    if (gameState.currentCol < 5) {
      for (let i = 0; i < 5; i++) {
        if (!gameState.guesses[gameState.currentRow][i]) {
          gameState.activeCellIndex = i;
          break;
        }
      }
    }
    
    // Aktif hücreyi vurgula
    highlightActiveCell();
    
    // İpucu sesi çal
    playSound('hint');
    
    // Başarı mesajı göster
    showMessage('İpucu eklendi!', 'success');
  }

  /**
   * Ses açıp kapatma
   */
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

  /**
   * Sesleri çalma
   */
  function playSound(soundName) {
    try {
      if (gameState.soundEnabled && sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play();
      }
    } catch (error) {
      console.log("Ses çalma hatası:", error);
    }
  }

  /**
   * Oyun sonu
   */
  function endGame(isWin) {
    gameState.isGameOver = true;
    
    // Sonuç mesajı
    if (isWin) {
      resultMessage.textContent = `Tebrikler! ${gameState.currentRow} denemede buldunuz.`;
      gameState.streak++;
      playSound('gameWin');
      
      // Skoru kaydet
      saveScore('wordle', gameState.score);
    } else {
      resultMessage.textContent = 'Üzgünüm, kelimeyi bulamadınız.';
      gameState.streak = 0;
      playSound('gameLose');
    }
    
    // Cevabı göster
    answerReveal.textContent = gameState.answer;
    
    // İstatistikleri güncelle
    finalScore.textContent = gameState.score;
    attemptsCount.textContent = `${gameState.currentRow}/6`;
    finalStreak.textContent = gameState.streak;
    
    // Sonuç panelini göster
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'block';
    
    // Yıldız derecelendirmesini ayarla
    updateStarRating();
  }

  /**
   * Yıldız derecelendirmesini günceller
   */
  function updateStarRating() {
    const ratingStars = document.querySelector('.rating-stars');
    const ratingText = document.getElementById('rating-text');
    
    // Skor ve deneme sayısına göre yıldız sayısını belirle
    let stars = 0;
    
    if (gameState.isGameOver) {
      if (gameState.currentRow <= 2) {
        stars = 5; // Mükemmel - 1-2 denemede
      } else if (gameState.currentRow <= 3) {
        stars = 4; // Çok İyi - 3 denemede
      } else if (gameState.currentRow <= 4) {
        stars = 3; // İyi - 4 denemede
      } else if (gameState.currentRow <= 5) {
        stars = 2; // Orta - 5 denemede
      } else if (gameState.currentRow <= 6) {
        stars = 1; // Zayıf - 6 denemede (son deneme)
      }
    }
    
    // Yıldızları güncelle
    ratingStars.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const star = document.createElement('i');
      star.className = i < stars ? 'fas fa-star' : 'far fa-star';
      ratingStars.appendChild(star);
    }
    
    // Derecelendirme metnini ayarla
    const ratingTexts = ['Zayıf', 'Orta', 'İyi', 'Çok İyi', 'Mükemmel!'];
    ratingText.textContent = stars > 0 ? ratingTexts[stars - 1] : 'Üzgünüm!';
  }

  /**
   * Skoru kaydet
   */
  function saveScore(gameType, score) {
    fetch('/save-score', {
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
      if (data.success) {
        console.log('Skor başarıyla kaydedildi!');
      } else {
        console.error('Skor kaydedilirken hata oluştu:', data.error);
      }
    })
    .catch(error => {
      console.error('Skor kaydedilirken hata oluştu:', error);
    });
  }

  /**
   * Skoru paylaşma panolarına kopyalama
   */
  function copyScore() {
    const shareText = `🎮 Wordle Oyunu: ${gameState.score} puan kazandım! ${gameState.currentRow}/6 denemede "${gameState.answer}" kelimesini buldum. #ZekaPark #Wordle`;
    
    navigator.clipboard.writeText(shareText)
      .then(() => {
        showMessage('Skor panoya kopyalandı!', 'success');
      })
      .catch(err => {
        showMessage('Kopyalama başarısız: ' + err, 'error');
      });
  }

  /**
   * Sosyal medyada paylaşma
   */
  function shareScore() {
    const shareText = encodeURIComponent(`🎮 Wordle Oyunu: ${gameState.score} puan kazandım! ${gameState.currentRow}/6 denemede "${gameState.answer}" kelimesini buldum. #ZekaPark #Wordle`);
    
    // Web Share API varsa kullan
    if (navigator.share) {
      navigator.share({
        title: 'Wordle Skorum',
        text: decodeURIComponent(shareText)
      })
      .catch(error => console.log('Paylaşma hatası:', error));
    } else {
      // Twitter paylaşımı
      window.open(`https://twitter.com/intent/tweet?text=${shareText}`, '_blank');
    }
  }

  /**
   * Sesleri yeniden başlat
   */
  function resetSounds() {
    for (const sound in sounds) {
      if (sounds.hasOwnProperty(sound)) {
        sounds[sound].pause();
        sounds[sound].currentTime = 0;
      }
    }
  }
});
