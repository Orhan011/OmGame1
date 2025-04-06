// Wordle.js
// Wordle kelime tahmin oyunu

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
      "kalem", "kitap", "araba", "çiçek", "deniz", "güneş", "perde", "bulut", "orman", "nehir", 
      "cadde", "sokak", "banka", "kapak", "kalıp", "gözlü", "saray", "çınar", "sehpa", "kilim",
      "lamba", "dolap", "duvar", "bahçe", "havuz", "şehir", "meyve", "aydın", "ekmek", "tabak",
      "sıcak", "soğuk", "büyük", "küçük", "uzman", "sabah", "öğlen", "akşam", "tahta", "salon",
      "sınıf", "sayfa", "kalın", "divan", "kanal", "fidan", "köşek", "canlı", "bilet", "firma",
      "daire", "fırın", "çamaş", "badem", "kiraz", "elmas", "yakut", "zümrüt", "kablo", "safir",
      "damla", "keman", "turşu", "toplu", "atlas", "çelik", "bakır", "demir", "tahıl", "kömür"
    ];
    
    // Sadece 5 harfli kelimelerden oluşan filtrelenmiş liste
    const filteredList = wordList.filter(word => word.length === 5);
    
    const randomIndex = Math.floor(Math.random() * filteredList.length);
    gameState.answer = filteredList[randomIndex].toUpperCase();
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
    
    // Doğru harfi yerleştir
    gameState.guesses[gameState.currentRow][randomPosition] = gameState.answer[randomPosition];
    
    // Gridin güncel halini göster
    updateGrid();
    
    // Aktif hücreyi güncelle
    if (gameState.currentCol < 5) {
      setActiveCell(gameState.currentRow, gameState.currentCol);
    }
    
    // İpucu sesi çal
    playSound('hint');
    
    // Başarılı ipucu mesajı göster
    showMessage('İpucu kullanıldı!', 'info');
  }

  /**
   * Ses açık/kapalı
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
   * Ses efekti çalma
   */
  function playSound(soundName) {
    try {
      if (gameState.soundEnabled && sounds[soundName]) {
        const sound = sounds[soundName];
        sound.currentTime = 0;
        sound.play();
      }
    } catch (error) {
      console.log("Ses çalma hatası:", error);
    }
  }

  /**
   * Ses efektlerini sıfırla
   */
  function resetSounds() {
    Object.values(sounds).forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
  }

  /**
   * Mesaj gösterme
   */
  function showMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.className = `game-message ${type}`;
    messageElement.textContent = message;
    
    messageContainer.innerHTML = '';
    messageContainer.appendChild(messageElement);
    
    // Mesajı otomatik temizle
    setTimeout(() => {
      if (messageContainer.contains(messageElement)) {
        messageElement.remove();
      }
    }, 3000);
  }

  /**
   * Skor ekranını güncelleme
   */
  function updateScoreDisplay() {
    scoreDisplay.textContent = gameState.score;
    guessesDisplay.textContent = `${gameState.currentRow}/6`;
    streakDisplay.textContent = gameState.streak;
  }

  /**
   * Skoru güncelleme
   */
  function updateScore(result) {
    // Doğru harfler için puan ekle
    let roundScore = 0;
    
    result.forEach(r => {
      if (r === 'correct') roundScore += 10;
      else if (r === 'present') roundScore += 2;
    });
    
    // Satır bazlı bonus (erken bulma bonusu)
    const rowMultiplier = [3, 2.5, 2, 1.5, 1.2, 1];
    roundScore = Math.floor(roundScore * rowMultiplier[gameState.currentRow]);
    
    // Toplam skora ekle
    gameState.score += roundScore;
    
    // Skoru göster
    scoreDisplay.textContent = gameState.score;
  }

  /**
   * Oyunu sonlandır
   */
  function endGame(isWin) {
    gameState.isGameOver = true;
    answerReveal.textContent = gameState.answer;
    
    // Sonuçları güncelle
    finalScore.textContent = gameState.score;
    attemptsCount.textContent = `${gameState.currentRow}/6`;
    
    if (isWin) {
      // Seri sayısını artır
      gameState.streak++;
      
      // Kazanma sonucu
      resultMessage.textContent = `Tebrikler! Kelimeyi ${gameState.currentRow} tahminde buldunuz.`;
      resultMessage.className = 'text-center mb-3 text-success';
      playSound('gameWin');
      
      // Kazanma puan bonusu
      const winBonus = Math.floor(100 * (6 - gameState.currentRow + 1) / 6);
      gameState.score += winBonus;
      
      // Ödül derecesini ayarla
      let stars = 0;
      if (gameState.currentRow <= 2) stars = 5;
      else if (gameState.currentRow <= 3) stars = 4;
      else if (gameState.currentRow <= 4) stars = 3;
      else if (gameState.currentRow <= 5) stars = 2;
      else stars = 1;
      
      updateStarsDisplay(stars);
    } else {
      // Seriyi sıfırla
      gameState.streak = 0;
      
      // Kaybetme sonucu
      resultMessage.textContent = `Maalesef doğru kelimeyi bulamadınız.`;
      resultMessage.className = 'text-center mb-3 text-danger';
      playSound('gameLose');
      
      // Kaybetme derecesi
      updateStarsDisplay(1);
    }
    
    // Skoru kaydet (API)
    saveScore(gameState.score);
    
    // Seri sayısını güncelle
    finalStreak.textContent = gameState.streak;
    streakDisplay.textContent = gameState.streak;
    
    // Sonuç ekranını göster
    setTimeout(() => {
      gameContainer.style.display = 'none';
      gameOverContainer.style.display = 'block';
    }, 1000);
  }

  /**
   * Yıldız derecelendirmesini günceller
   */
  function updateStarsDisplay(count) {
    const ratingStars = document.querySelector('.rating-stars');
    const ratingText = document.getElementById('rating-text');
    
    if (ratingStars) {
      ratingStars.innerHTML = '';
      
      for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.className = i <= count ? 'fas fa-star' : 'far fa-star';
        ratingStars.appendChild(star);
      }
    }
    
    if (ratingText) {
      let ratingDescription = '';
      
      switch (count) {
        case 5: ratingDescription = 'Mükemmel!'; break;
        case 4: ratingDescription = 'Çok İyi!'; break;
        case 3: ratingDescription = 'İyi!'; break;
        case 2: ratingDescription = 'Orta!'; break;
        default: ratingDescription = 'Daha İyisini Yapabilirsin!';
      }
      
      ratingText.textContent = ratingDescription;
    }
  }

  /**
   * Skoru kaydet
   */
  function saveScore(score) {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: 'wordle',
        score: score
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

  /**
   * Skoru kopyala
   */
  function copyScore() {
    const scoreText = `Wordle: ${gameState.score} puan (${gameState.currentRow}/6 tahmin)`;
    
    navigator.clipboard.writeText(scoreText).then(() => {
      showMessage('Skor kopyalandı!', 'success');
    }).catch(err => {
      showMessage('Skor kopyalanamadı!', 'error');
    });
  }

  /**
   * Skoru paylaş
   */
  function shareScore() {
    const scoreText = `Wordle: ${gameState.score} puan (${gameState.currentRow}/6 tahmin)`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Wordle Skorumu Paylaş',
        text: scoreText,
        url: window.location.href
      }).then(() => {
        console.log('Skor paylaşıldı!');
      }).catch(error => {
        console.log('Paylaşma hatası:', error);
      });
    } else {
      // Web Share API desteklenmiyor, kopyalama ile devam et
      copyScore();
    }
  }
});
