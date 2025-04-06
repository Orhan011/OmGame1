
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
  const mobileInput = document.getElementById('mobile-input');

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

  // Mobil input için focus olayı
  mobileInput.addEventListener('input', function(e) {
    if (e.target.value) {
      addLetter(e.target.value.toUpperCase());
      e.target.value = ''; // Her harf girildiğinde inputu temizle
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
    gameState.usedLetters = {
      correct: new Set(),
      present: new Set(),
      absent: new Set()
    };

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
        
        // Hücreye tıklandığında mobil klavyeyi açma
        cell.addEventListener('click', function() {
          if (!gameState.isGameOver && row === gameState.currentRow) {
            mobileInput.focus();
          }
        });
        
        rowDiv.appendChild(cell);
      }
      
      wordleGrid.appendChild(rowDiv);
    }
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
        cell.textContent = gameState.guesses[row][col];
        
        if (gameState.guesses[row][col]) {
          cell.classList.add('filled');
        } else {
          cell.classList.remove('filled');
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
    scoreDisplay.textContent = gameState.score;
    streakDisplay.textContent = gameState.streak;
    guessesDisplay.textContent = `${gameState.currentRow}/6`;
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
      hintCount.textContent = gameState.hintsLeft;
    }
  }

  /**
   * Oyunu bitirir
   */
  function endGame(isWin) {
    gameState.isGameOver = true;
    
    if (isWin) {
      gameState.streak++;
      resultMessage.textContent = 'Tebrikler! Kelimeyi buldunuz.';
      playSound('gameWin');
    } else {
      gameState.streak = 0;
      resultMessage.textContent = 'Üzgünüm, kelimeyi bulamadınız.';
      playSound('gameLose');
    }
    
    // Doğru cevabı göster
    answerReveal.textContent = gameState.answer;
    
    // Son skorları güncelle
    finalScore.textContent = gameState.score;
    attemptsCount.textContent = `${gameState.currentRow}/6`;
    finalStreak.textContent = gameState.streak;
    
    // Derecelendirmeyi güncelle
    updateRating(isWin);
    
    // Oyun sonu ekranını göster
    setTimeout(() => {
      gameContainer.style.display = 'none';
      gameOverContainer.style.display = 'block';
    }, 1000);
    
    // Skoru kaydet
    saveScore();
  }

  /**
   * Ses çalma
   */
  function playSound(sound, volume = 0.5) {
    if (!gameState.soundEnabled) return;
    
    if (sounds[sound]) {
      sounds[sound].currentTime = 0;
      sounds[sound].volume = volume;
      sounds[sound].play().catch(e => console.log('Ses çalma hatası:', e));
    }
  }

  /**
   * Ses açma/kapama
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
   * Ses efektlerini sıfırla
   */
  function resetSounds() {
    for (let sound in sounds) {
      sounds[sound].pause();
      sounds[sound].currentTime = 0;
    }
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
    
    setTimeout(() => {
      messageElement.style.opacity = '0';
      setTimeout(() => {
        if (messageContainer.contains(messageElement)) {
          messageContainer.removeChild(messageElement);
        }
      }, 500);
    }, 2000);
  }

  /**
   * Derecelendirmeyi günceller
   */
  function updateRating(isWin) {
    const ratingStars = document.querySelectorAll('.rating-stars i');
    const ratingText = document.getElementById('rating-text');
    
    // Varsayılan tüm yıldızları boşalt
    ratingStars.forEach(star => {
      star.className = 'far fa-star';
    });
    
    let rating = 0;
    let ratingMessage = '';
    
    if (isWin) {
      // Kazanma durumunda, kaç denemede kazandığına göre yıldız ver
      if (gameState.currentRow === 1) { // Birinci denemede
        rating = 5;
        ratingMessage = 'Olağanüstü!';
      } else if (gameState.currentRow === 2) {
        rating = 4;
        ratingMessage = 'Harika!';
      } else if (gameState.currentRow === 3) {
        rating = 3;
        ratingMessage = 'Çok İyi!';
      } else if (gameState.currentRow <= 5) {
        rating = 2;
        ratingMessage = 'İyi!';
      } else {
        rating = 1;
        ratingMessage = 'Tebrikler!';
      }
    } else {
      // Kaybetme durumunda, kaç doğru harf tahmin edildiğine göre yıldız ver
      const correctLetters = new Set(gameState.usedLetters.correct);
      
      if (correctLetters.size >= 4) {
        rating = 2;
        ratingMessage = 'Neredeyse!';
      } else if (correctLetters.size >= 2) {
        rating = 1;
        ratingMessage = 'İyi deneme!';
      } else {
        rating = 0;
        ratingMessage = 'Bir dahaki sefere!';
      }
    }
    
    // Yıldızları güncelle
    for (let i = 0; i < rating; i++) {
      ratingStars[i].className = 'fas fa-star';
    }
    
    // Metni güncelle
    ratingText.textContent = ratingMessage;
  }

  /**
   * Skoru kopyalar
   */
  function copyScore() {
    const gameResult = gameState.currentRow <= 6 && 
                       gameState.guesses[gameState.currentRow - 1].join('') === gameState.answer 
                       ? 'kazandı' : 'kaybetti';
    
    const scoreText = `ZekaPark Wordle: ${gameResult} ${gameState.currentRow}/6 - Skor: ${gameState.score}`;
    
    navigator.clipboard.writeText(scoreText).then(() => {
      showMessage('Skor kopyalandı!', 'success');
    }).catch(() => {
      showMessage('Kopyalama başarısız oldu', 'error');
    });
  }

  /**
   * Skoru paylaşır
   */
  function shareScore() {
    if (navigator.share) {
      const gameResult = gameState.currentRow <= 6 && 
                         gameState.guesses[gameState.currentRow - 1].join('') === gameState.answer 
                         ? 'kazandım' : 'kaybettim';
      
      const shareData = {
        title: 'ZekaPark Wordle Skorumum',
        text: `ZekaPark Wordle'da ${gameResult}! ${gameState.currentRow}/6 - Skor: ${gameState.score}`
      };
      
      navigator.share(shareData)
        .then(() => showMessage('Başarıyla paylaşıldı!', 'success'))
        .catch(() => showMessage('Paylaşım başarısız oldu', 'error'));
    } else {
      copyScore();
      showMessage('Paylaşım özelliği desteklenmiyor, skor kopyalandı', 'info');
    }
  }

  /**
   * Skoru kaydeder
   */
  function saveScore() {
    // Sadece oyun bittiğinde skor kaydet
    if (!gameState.isGameOver) return;
    
    // AJAX isteği ile sunucuya skoru gönder
    fetch('/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: 'wordle',
        score: gameState.score
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Skor kaydedilemedi');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        console.log('Skor başarıyla kaydedildi');
      }
    })
    .catch(error => {
      console.error('Skor kaydetme hatası:', error);
    });
  }
});
