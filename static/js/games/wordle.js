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
  const submitGuessBtn = document.getElementById('submit-guess');
  const deleteLetterBtn = document.getElementById('delete-letter');

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

  // Aktif hücre referansı
  let activeCell = null;
  let cellInputs = [];

  // Oyun başlat butonu
  startBtn.addEventListener('click', startGame);

  // Yeniden oyna butonu
  playAgainBtn.addEventListener('click', startGame);

  // İpucu butonu
  hintButton.addEventListener('click', getHint);

  // Ses butonu
  soundToggle.addEventListener('click', toggleSound);

  // Tahmin ve silme butonları
  submitGuessBtn.addEventListener('click', submitGuess);
  deleteLetterBtn.addEventListener('click', deleteLetter);

  // Skoru paylaş/kopyala butonları
  copyScoreBtn.addEventListener('click', copyScore);
  shareScoreBtn.addEventListener('click', shareScore);
  
  // Tuş basımı dinle
  document.addEventListener('keydown', function(e) {
    if (gameState.isGameOver || gameContainer.style.display === 'none') return;
    
    if (e.key === 'Enter') {
      submitGuess();
    } else if (e.key === 'Backspace') {
      deleteLetter();
      playSound('keypress');
    } else if (/^[a-zA-ZğüşıöçĞÜŞİÖÇ]$/.test(e.key)) {
      addLetter(e.key.toUpperCase());
      playSound('keypress');
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
    const wordList = [
      "kalem", "kitap", "araba", "çiçek", "deniz", "güneş", "balık", "bulut", "orman", "nehir", 
      "cadde", "sokak", "banka", "kapak", "vapur", "gözlü", "saray", "yazlı", "kilim",
      "lamba", "dolap", "duvar", "bahçe", "havuz", "şehir", "meyve", "sebze", "ekmek", "tabak",
      "sıcak", "soğuk", "büyük", "küçük", "uzman", "sabah", "öğlen", "akşam", "tahta", "salon",
      "sınıf", "sayfa", "kitap", "divan", "kanal", "fidan", "döşek", "canlı", "bilet", "firma",
      "daire", "fırın", "telaş", "badem", "kiraz", "elmas", "yakut", "fidan", "dolap", "safir",
      "damla", "emoji", "huzur", "jeton", "atlas", "çelik", "bakır", "demir", "tahıl", "kömür"
    ];
    
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
    
    // İlk hücreyi aktif et
    setActiveCell(0, 0);

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
    cellInputs = [];
    
    for (let row = 0; row < 6; row++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'wordle-row';
      rowDiv.dataset.row = row;
      
      for (let col = 0; col < 5; col++) {
        const cell = document.createElement('div');
        cell.className = 'wordle-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        // Her hücre için bir input oluştur
        const input = document.createElement('input');
        input.maxLength = 1;
        input.autocomplete = 'off';
        input.autocorrect = 'off';
        input.autocapitalize = 'characters';
        input.spellcheck = false;
        input.dataset.row = row;
        input.dataset.col = col;
        
        // Input dinleyicileri
        input.addEventListener('input', function(e) {
          const char = e.target.value.toUpperCase();
          if (/^[A-ZĞÜŞİÖÇ]$/.test(char)) {
            addLetter(char);
            
            // Bir sonraki input'a odaklan (varsa)
            if (gameState.currentCol < 5) {
              const nextRow = gameState.currentRow;
              const nextCol = gameState.currentCol;
              setActiveCell(nextRow, nextCol);
            }
          } else {
            e.target.value = '';
          }
        });
        
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Backspace') {
            if (e.target.value === '') {
              // Boşsa bir önceki hücreye git
              if (gameState.currentCol > 0) {
                deleteLetter();
                const prevRow = gameState.currentRow;
                const prevCol = gameState.currentCol;
                setActiveCell(prevRow, prevCol);
              }
            } else {
              // Dolu ise bu hücreyi temizle
              e.target.value = '';
              deleteLetter();
            }
          } else if (e.key === 'ArrowLeft') {
            if (gameState.currentCol > 0) {
              const prevCol = gameState.currentCol - 1;
              setActiveCell(gameState.currentRow, prevCol);
            }
          } else if (e.key === 'ArrowRight') {
            if (gameState.currentCol < 4) {
              const nextCol = gameState.currentCol + 1;
              setActiveCell(gameState.currentRow, nextCol);
            }
          } else if (e.key === 'Enter') {
            submitGuess();
          }
        });
        
        input.addEventListener('focus', function() {
          const row = parseInt(this.dataset.row);
          const col = parseInt(this.dataset.col);
          
          // Sadece aktif satırdaki inputlara izin ver
          if (row === gameState.currentRow) {
            setActiveCell(row, col);
          }
        });
        
        cell.appendChild(input);
        rowDiv.appendChild(cell);
        
        // Input referanslarını sakla
        if (!cellInputs[row]) cellInputs[row] = [];
        cellInputs[row][col] = input;
      }
      
      wordleGrid.appendChild(rowDiv);
    }
  }

  /**
   * Aktif hücreyi ayarlar
   */
  function setActiveCell(row, col) {
    // Önceki aktif hücreyi temizle
    if (activeCell) {
      activeCell.parentElement.classList.remove('current');
    }
    
    // Yeni aktif hücreyi ayarla
    const selectedCell = cellInputs[row][col];
    if (selectedCell) {
      activeCell = selectedCell;
      selectedCell.parentElement.classList.add('current');
      
      // Input'a odaklan
      setTimeout(() => {
        selectedCell.focus();
      }, 0);
      
      // Oyun durumunu güncelle
      gameState.currentRow = row;
      gameState.currentCol = col;
    }
  }

  /**
   * Harf ekleme
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
      
      // Aktif hücreyi güncelle
      if (gameState.currentCol < 5) {
        setActiveCell(gameState.currentRow, gameState.currentCol);
      }
    }
  }

  /**
   * Harf silme
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
      
      // Aktif hücreyi güncelle
      setActiveCell(gameState.currentRow, gameState.currentCol);
    }
  }

  /**
   * Tahmini gönderme
   */
  function submitGuess() {
    if (gameState.isGameOver) return;
    
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
    
    // Satırı tamamlanmış olarak işaretle
    const row = document.querySelector(`.wordle-row[data-row="${gameState.currentRow}"]`);
    if (row) {
      row.classList.add('played');
      
      // Bu satırdaki inputları devre dışı bırak
      const inputs = row.querySelectorAll('input');
      inputs.forEach(input => {
        input.disabled = true;
      });
    }
    
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
    } else {
      // Bir sonraki satırı aktif et
      setTimeout(() => {
        setActiveCell(gameState.currentRow, 0);
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
        const value = gameState.guesses[row][col];
        
        // Input değerini güncelle
        if (cellInputs[row] && cellInputs[row][col]) {
          cellInputs[row][col].value = value;
        }
        
        // Hücre durumunu güncelle
        const cell = document.querySelector(`.wordle-cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          if (value) {
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
      if (gameState.currentCol < 5) {
        setActiveCell(gameState.currentRow, gameState.currentCol);
      }
    }
    
    // İpucu sesini çal
    playSound('hint');
    
    // Kullanıcıya bilgi mesajı göster
    showMessage('İpucu verildi!', 'info');
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
   * Puan göstergesini günceller - artık puan gösterimi yapılmıyor
   */
  function updateScoreDisplay() {
    // Puan gösterimi kapatıldı
    if (guessesDisplay) guessesDisplay.textContent = `${gameState.currentRow}/6`;
  }

  /**
   * Oyunu sonlandırır
   */
  function endGame(isWin) {
    gameState.isGameOver = true;
    
    // Tüm inputları devre dışı bırak
    cellInputs.forEach(row => {
      row.forEach(input => {
        input.disabled = true;
      });
    });
    
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
    // Skoru veritabanına kaydet (kaybedince)
    saveScoreWithDetails(gameState.score);
    }
    
    // Skoru veritabanına kaydet (kazanınca)
    saveScoreWithDetails(gameState.score);
    
    // Sonuç ekranını hazırla (puanlar gizlendi)
    if (finalScore) finalScore.style.display = 'none';
    attemptsCount.textContent = `${gameState.currentRow}/6`;
    if (finalStreak) finalStreak.style.display = 'none';
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
   * Skoru kaydeder - bu fonksiyon saveScoreWithDetails(score) çağrısı ile değiştirildi
   * Geriye dönük uyumluluk için burada bırakıldı
   */
  function saveScore() {
    // Skoru kaydetmek için yeni fonksiyonu çağır
    try {
      // Eğer hiç parametre verilmezse, gameState'den skoru al
      if (arguments.length === 0) {
        saveScoreWithDetails(gameState.score);
      } 
      // Eğer parametre verilirse (örn. endGame içinden), o skoru kullan
      else {
        saveScoreWithDetails(arguments[0]);
      }
    } catch (e) {
      console.error("Skor kaydetme hatası:", e);
      // Hata durumunda basit kaydetme yöntemiyle dene
      fetch('/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: 'wordle',
          score: gameState.score
        })
      }).catch(err => console.error("Yedek skor kaydı hatası:", err));
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
});

  /**
   * Skoru veritabanına kaydeder ve skor gösterimini günceller
   */
  function saveScoreWithDetails(score) {
    // Oyun istatistiklerini topla
    const gameStartTime = new Date(localStorage.getItem('wordleGameStartTime') || Date.now());
    const playtime = Math.floor((new Date() - gameStartTime) / 1000) || 180;
    
    // Zorluk seviyesini belirle
    let difficulty = 'easy';
    if (gameState.currentRow <= 2) {
      difficulty = 'hard';
    } else if (gameState.currentRow <= 4) {
      difficulty = 'medium';
    }
    
    // Oyun istatistiklerini topla
    const gameStats = {
      duration_seconds: playtime,
      move_count: gameState.currentRow,
      hint_count: 3 - gameState.hintsLeft,
      guesses: gameState.currentRow,
      word_length: 5,
      success: gameState.answer === gameState.guesses[gameState.currentRow-1]?.join('')
    };
    
    // Yeni skor gösterimi için callback fonksiyonu - artık puan gösterimi yapılmıyor
    const updateScoreDisplay = function(scoreHtml, data) {
      const scoreContainer = document.getElementById('game-score-container');
      if (scoreContainer) {
        scoreContainer.innerHTML = ''; // Skor gösterimi kapatıldı
      }
    };
    
    // Ortak skoru kaydetme ve gösterme fonksiyonunu kullan
    saveScoreAndDisplay('wordle', score, playtime, difficulty, gameStats, updateScoreDisplay);
  }
