$(document).ready(function() {
  // DOM elementleri
  const gameContainer = $('.wordle-container');
  const keyboard = $('.wordle-keyboard');
  const scoreDisplay = $('#score-value');
  const streakDisplay = $('#streak-value');
  const guessesDisplay = $('#guesses-value');
  const hintCount = $('#hint-count');
  const messageEl = $('.wordle-messages');
  const newGameBtn = $('#new-game-btn');
  const hintBtn = $('#hint-btn');
  const copyBtn = $('#copy-score-btn');
  const shareBtn = $('#share-score-btn');
  
  // Oyun değişkenleri
  let gameState = {
    answer: '',
    guesses: Array(6).fill(''),
    currentRow: 0,
    isGameOver: false,
    isWinState: false,
    score: 0,
    streak: 0,
    hintsLeft: 3
  };
  
  // Oyunu başlat
  initGame();
  
  /**
   * Oyunu başlatır veya yeniden başlatır
   */
  function initGame() {
    // Rastgele bir kelime seç
    const wordIndex = Math.floor(Math.random() * WORDLE_WORDS.length);
    gameState.answer = WORDLE_WORDS[wordIndex].toUpperCase();
    
    // Oyun alanını temizle
    gameContainer.empty();
    
    // Oyun değişkenlerini sıfırla
    gameState.guesses = Array(6).fill('');
    gameState.currentRow = 0;
    gameState.isGameOver = false;
    gameState.isWinState = false;
    
    // İpucu sayısını yenile
    gameState.hintsLeft = 3;
    hintCount.text(gameState.hintsLeft);
    
    // Harf tahtasını oluştur
    createGameBoard();
    
    // Klavyeyi sıfırla
    resetKeyboard();
    
    // Skoru göster
    updateScoreDisplay();
    
    // Debug için cevabı konsola yazdır (geliştirme aşamasında)
    console.log("Cevap: " + gameState.answer);
  }
  
  /**
   * Oyun tahtasını oluşturur
   */
  function createGameBoard() {
    for (let row = 0; row < 6; row++) {
      const rowEl = $('<div>').addClass('wordle-row');
      
      for (let col = 0; col < 5; col++) {
        const cell = $('<div>')
          .addClass('wordle-cell')
          .attr('data-row', row)
          .attr('data-col', col);
        rowEl.append(cell);
      }
      
      gameContainer.append(rowEl);
    }
  }
  
  /**
   * Klavyeyi sıfırlar
   */
  function resetKeyboard() {
    // Tüm tuşları normal duruma getir
    $('.wordle-key').removeClass('key-correct key-present key-absent').addClass('key-normal');
  }
  
  /**
   * Kelimeyi tahmin eder
   */
  function submitGuess() {
    const currentGuess = gameState.guesses[gameState.currentRow];
    
    // 5 harften az ise eksik mesajı göster
    if (currentGuess.length < 5) {
      showMessage('Yetersiz harf!', 'error');
      shakeRow(gameState.currentRow);
      return;
    }
    
    // Tahmin edilen kelimenin geçerli olup olmadığını kontrol et
    if (!isValidWord(currentGuess)) {
      showMessage('Geçersiz kelime!', 'error');
      shakeRow(gameState.currentRow);
      return;
    }
    
    // Renklendirmeyi uygula ve doğruluğu kontrol et
    const result = checkGuess(currentGuess);
    colorCells(result);
    updateKeyboard(result, currentGuess);
    
    // Oyunun sonucunu kontrol et
    if (currentGuess === gameState.answer) {
      // Oyunu kazandı
      gameWon();
    } else if (gameState.currentRow === 5) {
      // Son tahmin hakkını da kullandı ve bilmedi
      gameLost();
    } else {
      // Sonraki satıra geç
      gameState.currentRow++;
    }
  }
  
  /**
   * Tahminin doğruluğunu kontrol eder ve her harf için sonuç döndürür
   */
  function checkGuess(guess) {
    const result = Array(5).fill('absent');
    const answerChars = gameState.answer.split('');
    
    // Önce tam eşleşmeleri işaretle
    for (let i = 0; i < 5; i++) {
      if (guess[i] === gameState.answer[i]) {
        result[i] = 'correct';
        answerChars[i] = null; // Bu harfi tekrar eşleştirmemek için null'a çevir
      }
    }
    
    // Şimdi farklı konumdaki eşleşmeleri kontrol et
    for (let i = 0; i < 5; i++) {
      if (result[i] === 'absent') {
        const charIndex = answerChars.indexOf(guess[i]);
        if (charIndex !== -1) {
          result[i] = 'present';
          answerChars[charIndex] = null; // Bu harfi tekrar eşleştirmemek için null'a çevir
        }
      }
    }
    
    return result;
  }
  
  /**
   * Hücreleri sonuca göre renklendirir
   */
  function colorCells(result) {
    const row = gameState.currentRow;
    
    for (let col = 0; col < 5; col++) {
      const cell = $(`.wordle-cell[data-row="${row}"][data-col="${col}"]`);
      const letter = gameState.guesses[row][col];
      
      // Önce tüm animasyonları kaldır
      cell.removeClass('cell-flip');
      
      // Hücreyi flip et ve renkleri uygula
      setTimeout(() => {
        cell.addClass('cell-flip');
        
        // Flip animasyonu ortasında rengi değiştir
        setTimeout(() => {
          cell.removeClass('cell-filled')
            .addClass(`cell-${result[col]}`);
        }, 150);
      }, col * 100); // Her hücre için artan gecikme
    }
  }
  
  /**
   * Klavyeyi sonuçlara göre günceller
   */
  function updateKeyboard(result, guess) {
    for (let i = 0; i < 5; i++) {
      const letter = guess[i];
      const keyEl = $(`.wordle-key[data-key="${letter}"]`);
      
      // Önceki durumu koruyarak daha iyi bir durum varsa güncelle
      if (result[i] === 'correct') {
        keyEl.removeClass('key-normal key-present key-absent').addClass('key-correct');
      } else if (result[i] === 'present' && !keyEl.hasClass('key-correct')) {
        keyEl.removeClass('key-normal key-absent').addClass('key-present');
      } else if (result[i] === 'absent' && !keyEl.hasClass('key-correct') && !keyEl.hasClass('key-present')) {
        keyEl.removeClass('key-normal').addClass('key-absent');
      }
    }
  }
  
  /**
   * Kazanma durumunda çağrılır
   */
  function gameWon() {
    gameState.isGameOver = true;
    gameState.isWinState = true;
    
    // Oyun skoru hesapla
    const baseScore = 100; // Temel puan
    const rowBonus = (6 - gameState.currentRow) * 50; // Daha az denemede bilme bonusu
    const hintPenalty = (3 - gameState.hintsLeft) * 20; // İpucu kullanma cezası
    
    // Skoru güncelle
    gameState.score += baseScore + rowBonus - hintPenalty;
    gameState.streak += 1;
    
    updateScoreDisplay();
    
    // Zafer animasyonu
    bounceRow(gameState.currentRow);
    
    // Tebrik mesajı
    setTimeout(() => {
      const messages = [
        'Harika!',
        'Muhteşem!',
        'Mükemmel!',
        'Bravo!',
        'Tebrikler!'
      ];
      const message = messages[Math.floor(Math.random() * messages.length)];
      showMessage(`${message} ${gameState.currentRow + 1}/6`, 'success');
    }, 1500);

    // Skoru sunucuya kaydet
    saveScore();
  }
  
  /**
   * Kaybetme durumunda çağrılır
   */
  function gameLost() {
    gameState.isGameOver = true;
    gameState.isWinState = false;
    gameState.streak = 0;
    
    updateScoreDisplay();
    
    // Üzgün mesajı
    setTimeout(() => {
      showMessage(`Üzgünüm! Doğru cevap: ${gameState.answer}`, 'error');
    }, 1500);
  }
  
  /**
   * Geçerli bir kelime olup olmadığını kontrol eder
   */
  function isValidWord(word) {
    return WORDLE_WORDS.includes(word.toLowerCase()) || VALID_GUESSES.includes(word.toLowerCase());
  }
  
  /**
   * Satırı sarsma animasyonu uygular
   */
  function shakeRow(row) {
    const rowEl = $(`.wordle-row:eq(${row})`);
    rowEl.addClass('row-shake');
    setTimeout(() => rowEl.removeClass('row-shake'), 500);
  }
  
  /**
   * Satırı zıplatma animasyonu uygular
   */
  function bounceRow(row) {
    const cells = $(`.wordle-cell[data-row="${row}"]`);
    
    cells.each(function(index) {
      const cell = $(this);
      setTimeout(() => {
        cell.addClass('cell-bounce');
        setTimeout(() => cell.removeClass('cell-bounce'), 500);
      }, index * 100);
    });
  }
  
  /**
   * Mesaj gösterir
   */
  function showMessage(message, type = 'info') {
    messageEl.text(message)
      .removeClass('message-error message-success message-info')
      .addClass(`message-${type}`)
      .css('opacity', 1);
    
    // Mesajı bir süre sonra kaldır
    clearTimeout(messageEl.data('timeout'));
    const timeout = setTimeout(() => {
      messageEl.css('opacity', 0);
    }, 2000);
    messageEl.data('timeout', timeout);
  }
  
  /**
   * Skor göstergesini günceller
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
      const cells = document.querySelectorAll(`.wordle-cell[data-row="${i}"]`);
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
      
      // İpucu harfini mevcut satıra yerleştir
      if (gameState.currentRow < 6) {
        const currentRowCells = document.querySelectorAll(`.wordle-cell[data-row="${gameState.currentRow}"]`);
        const cell = currentRowCells[hintPosition];
        
        // Yazıyı güncelle
        cell.textContent = hintLetter;
        cell.classList.add('cell-filled');
        
        // State'i güncelle
        const updatedGuess = gameState.guesses[gameState.currentRow].split('');
        if (updatedGuess.length < hintPosition + 1) {
          while (updatedGuess.length < hintPosition) {
            updatedGuess.push('');
          }
          updatedGuess.push(hintLetter);
        } else {
          updatedGuess[hintPosition] = hintLetter;
        }
        gameState.guesses[gameState.currentRow] = updatedGuess.join('');
      }
    } else {
      showMessage('Tüm harfler doğru tahmin edilmiş!', 'info');
      gameState.hintsLeft++; // İpucu kullanılmadı, geri ver
      hintCount.textContent = gameState.hintsLeft;
    }
    
    // İpucu animasyonu
    const hintSound = new Audio('/static/sounds/hint.mp3');
    hintSound.play();
  }

  /**
   * Harfi ekler veya kaldırır
   */
  function handleKeyInput(key) {
    if (gameState.isGameOver) {
      return;
    }
    
    const currentRow = gameState.currentRow;
    
    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      // Son harfi sil
      if (gameState.guesses[currentRow].length > 0) {
        const newGuess = gameState.guesses[currentRow].slice(0, -1);
        gameState.guesses[currentRow] = newGuess;
        
        // Son hücreyi güncelle
        const lastFilledCol = newGuess.length;
        const cell = $(`.wordle-cell[data-row="${currentRow}"][data-col="${lastFilledCol}"]`);
        cell.text('').removeClass('cell-filled');
      }
    } else if (/^[A-Z]$/.test(key) && gameState.guesses[currentRow].length < 5) {
      // Harf ekle
      const newGuess = gameState.guesses[currentRow] + key;
      gameState.guesses[currentRow] = newGuess;
      
      // Hücreyi güncelle
      const col = newGuess.length - 1;
      const cell = $(`.wordle-cell[data-row="${currentRow}"][data-col="${col}"]`);
      cell.text(key).addClass('cell-filled');
      
      // Harf animasyonu
      cell.removeClass('cell-pop');
      setTimeout(() => cell.addClass('cell-pop'), 10);
    }
  }

  /**
   * Klavye tuşlarına basıldığında
   */
  $(document).on('keydown', function(e) {
    const key = e.key.toUpperCase();
    
    if (key === 'ENTER' || key === 'BACKSPACE' || /^[A-Z]$/.test(key)) {
      handleKeyInput(key);
      e.preventDefault();
    }
  });
  
  /**
   * Ekran klavyesi tuşlarına tıklandığında
   */
  $(document).on('click', '.wordle-key', function() {
    const key = $(this).data('key');
    handleKeyInput(key);
  });
  
  /**
   * Yeni oyun başlatma
   */
  newGameBtn.on('click', function() {
    initGame();
  });
  
  /**
   * İpucu alma
   */
  hintBtn.on('click', function() {
    getHint();
  });
  
  /**
   * Skoru kopyalar
   */
  function copyScore() {
    const scoreText = `Wordle oyununda ${gameState.score} puan kazandım! ${gameState.currentRow}/6 tahminde kelimeyi buldum!`;
    
    navigator.clipboard.writeText(scoreText)
      .then(() => {
        showMessage('Skor kopyalandı!', 'success');
      })
      .catch(err => {
        console.error('Kopyalama başarısız: ', err);
        showMessage('Kopyalama başarısız', 'error');
      });
  }

  /**
   * Skoru paylaşır
   */
  function shareScore() {
    const scoreText = `Wordle oyununda ${gameState.score} puan kazandım! ${gameState.currentRow}/6 tahminde kelimeyi buldum!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Beyin Egzersizi - Wordle Skorumu',
        text: scoreText,
      })
      .catch(error => console.log('Paylaşım başarısız:', error));
    } else {
      copyScore();
    }
  }

  /**
   * Skoru sunucuya gönderir
   */
  function saveScore() {
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
    .then(response => response.json())
    .then(data => {
      console.log('Skor kaydedildi:', data);
    })
    .catch(error => {
      console.error('Skor kaydetme hatası:', error);
    });
  }
  
  /**
   * Skoru kopyalama butonu
   */
  copyBtn.on('click', function() {
    copyScore();
  });
  
  /**
   * Skoru paylaşma butonu
   */
  shareBtn.on('click', function() {
    shareScore();
  });
  
  // Klavyeyi oluştur
  createKeyboard();
  
  /**
   * Ekran klavyesini oluşturur
   */
  function createKeyboard() {
    const keyboardLayout = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç', 'BACKSPACE']
    ];
    
    keyboardLayout.forEach(row => {
      const rowEl = $('<div>').addClass('keyboard-row');
      
      row.forEach(key => {
        let keyClass = 'wordle-key key-normal';
        
        if (key === 'ENTER') {
          keyClass += ' key-wide';
        } else if (key === 'BACKSPACE') {
          keyClass += ' key-wide';
          key = '⌫';
        }
        
        const keyEl = $('<button>')
          .addClass(keyClass)
          .text(key)
          .attr('data-key', key);
        
        rowEl.append(keyEl);
      });
      
      keyboard.append(rowEl);
    });
  }
});
