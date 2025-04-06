document.addEventListener('DOMContentLoaded', () => {
  // Oyun paneli elementlerini seç
  const gameBoard = document.getElementById('game-board');
  const keyboard = document.getElementById('keyboard');
  const messageDisplay = document.getElementById('message');
  const timerDisplay = document.getElementById('timer');
  const scoreDisplay = document.getElementById('score');
  const hintButton = document.getElementById('hint-button');
  
  // Tuş takımı dizileri
  const keyboardLayout = [
    ['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
    ['ENTER', 'Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç', 'BACKSPACE']
  ];
  
  // Oyun durumu
  const gameState = {
    guessesRemaining: 6,
    currentGuess: [],
    answer: '',
    gameOver: false,
    score: 0,
    timer: 0,
    hintsUsed: 0,
    timerInterval: null,
    timeStarted: null,
    gameBoardRows: []
  };
  
  // Skor hesaplama fonksiyonu
  function calculateScore(timeSpent, hintsUsed, guessesRemaining) {
    // Baz puan: 1000
    let score = 1000;
    
    // Her kullanılan ipucu için 100 puan düş
    score -= hintsUsed * 100;
    
    // Her geçen dakika için 50 puan düş (max 500)
    const minutes = timeSpent / 60;
    score -= Math.min(500, Math.floor(minutes) * 50);
    
    // Kalan tahmin sayısına göre bonus ver (her kalan tahmin için 50 puan)
    score += guessesRemaining * 50;
    
    return Math.max(0, Math.floor(score));
  }
  
  // Timer'ı başlat
  function startTimer() {
    gameState.timeStarted = new Date();
    gameState.timerInterval = setInterval(() => {
      const now = new Date();
      const timeDiff = Math.floor((now - gameState.timeStarted) / 1000);
      gameState.timer = timeDiff;
      
      // Formatlanmış zaman (dk:sn)
      const minutes = Math.floor(timeDiff / 60);
      const seconds = timeDiff % 60;
      timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }
  
  // Timer'ı durdur
  function stopTimer() {
    clearInterval(gameState.timerInterval);
  }
  
  // Oyun tahtasını oluştur
  function createGameboard() {
    for (let i = 0; i < 6; i++) {
      const row = document.createElement('div');
      row.className = 'row';
      
      const rowCells = [];
      for (let j = 0; j < 5; j++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        row.appendChild(cell);
        rowCells.push(cell);
      }
      
      gameBoard.appendChild(row);
      gameState.gameBoardRows.push(rowCells);
    }
  }
  
  // Klavyeyi oluştur
  function createKeyboard() {
    keyboardLayout.forEach(row => {
      const keyboardRow = document.createElement('div');
      keyboardRow.className = 'keyboard-row';
      
      row.forEach(key => {
        const keyButton = document.createElement('button');
        keyButton.textContent = key;
        keyButton.className = 'keyboard-button';
        
        if (key === 'ENTER') {
          keyButton.id = 'enter-button';
        } else if (key === 'BACKSPACE') {
          keyButton.id = 'backspace-button';
          keyButton.innerHTML = '<i class="fas fa-backspace"></i>';
        }
        
        keyButton.addEventListener('click', () => handleKeyboardInput(key));
        keyboardRow.appendChild(keyButton);
      });
      
      keyboard.appendChild(keyboardRow);
    });
  }
  
  // Rastgele bir kelime seç - tüm kelimeler tam 5 harfli
  const wordList = [
    "kalem", "kitap", "araba", "çiçek", "deniz", "güneş", "balık", "bulut", "orman", "nehir", 
    "cadde", "sokak", "banka", "kapak", "vapur", "gözlü", "saray", "yazlı", "kilim", "lamba", 
    "dolap", "duvar", "bahçe", "havuz", "şehir", "meyve", "sebze", "ekmek", "tabak", "sıcak", 
    "soğuk", "büyük", "küçük", "uzman", "sabah", "öğlen", "akşam", "tahta", "salon", "sınıf", 
    "sayfa", "divan", "kanal", "fidan", "köşek", "canlı", "bilet", "firma", "daire", "fırın", 
    "bulaş", "badem", "kiraz", "elmas", "yakut", "safir", "damla", "atlas", "çelik", "bakır", 
    "demir", "tahıl", "kömür", "kemer", "başak", "kapan", "yemek", "kürek", "kazak", "marka"
  ];
  
  const randomIndex = Math.floor(Math.random() * wordList.length);
  gameState.answer = wordList[randomIndex].toUpperCase();
  console.log("Cevap: " + gameState.answer); // Geliştirme için, prodüksiyonda kaldırılmalı

  // Oyun durumunu sıfırla
  function resetGame() {
    gameState.guessesRemaining = 6;
    gameState.currentGuess = [];
    gameState.gameOver = false;
    gameState.score = 0;
    gameState.timer = 0;
    gameState.hintsUsed = 0;
    
    stopTimer();
    gameBoard.innerHTML = '';
    gameState.gameBoardRows = [];
    createGameboard();
    
    // Klavye tuşlarının stillerini sıfırla
    const keyButtons = document.querySelectorAll('.keyboard-button');
    keyButtons.forEach(button => {
      button.className = 'keyboard-button';
    });
    
    // Yeni kelime seç
    const randomIndex = Math.floor(Math.random() * wordList.length);
    gameState.answer = wordList[randomIndex].toUpperCase();
    console.log("Cevap: " + gameState.answer);
    
    // Mesajı temizle
    messageDisplay.textContent = '';
    messageDisplay.className = '';
    
    // Timer'ı başlat
    startTimer();
  }
  
  // Kelime tahmini fonksiyonu
  function submitGuess() {
    if (gameState.currentGuess.length !== 5) {
      showMessage('Tam 5 harfli bir kelime girin!', 'error');
      animateMessage();
      return;
    }
    
    const guess = gameState.currentGuess.join('');
    
    // Tahmini kontrol et ve hücreleri renklendirilerek görsel geri bildirim sağla
    const row = 6 - gameState.guessesRemaining;
    const rowCells = gameState.gameBoardRows[row];
    
    // Doğru harfleri işaretle
    let correctCount = 0;
    const answerLetterCount = {};
    
    // Cevap kelimesindeki her harfin sayısını say
    for (let i = 0; i < gameState.answer.length; i++) {
      const letter = gameState.answer[i];
      answerLetterCount[letter] = (answerLetterCount[letter] || 0) + 1;
    }
    
    // Önce tam eşleşmeleri işaretle
    for (let i = 0; i < 5; i++) {
      const letter = guess[i];
      
      if (letter === gameState.answer[i]) {
        rowCells[i].classList.add('correct');
        correctCount++;
        answerLetterCount[letter]--;
        
        // Klavye tuşunu yeşil yap
        const keyButton = document.querySelector(`.keyboard-button:not(#enter-button):not(#backspace-button)`);
        if (keyButton) {
          keyButton.className = 'keyboard-button correct';
        }
      }
    }
    
    // Sonra yanlış konumdaki harfleri işaretle
    for (let i = 0; i < 5; i++) {
      const letter = guess[i];
      
      if (letter === gameState.answer[i]) {
        // Zaten işaretlendi, atla
        continue;
      } else if (gameState.answer.includes(letter) && answerLetterCount[letter] > 0) {
        rowCells[i].classList.add('present');
        answerLetterCount[letter]--;
        
        // Klavye tuşunu sarı yap (eğer zaten yeşil değilse)
        const keyButton = document.querySelector(`.keyboard-button:not(.correct)`);
        if (keyButton) {
          keyButton.className = 'keyboard-button present';
        }
      } else {
        rowCells[i].classList.add('absent');
        
        // Klavye tuşunu gri yap (eğer zaten yeşil veya sarı değilse)
        const keyButton = document.querySelector(`.keyboard-button:not(.correct):not(.present)`);
        if (keyButton) {
          keyButton.className = 'keyboard-button absent';
        }
      }
    }
    
    // Oyun durumunu güncelle
    gameState.guessesRemaining--;
    
    try {
      playSound('static/sounds/click.mp3');
    } catch (err) {
      console.log("Ses çalma hatası:", err);
    }
    
    // Kazandı mı kontrol et
    if (correctCount === 5) {
      stopTimer();
      
      // Skoru hesapla
      gameState.score = calculateScore(
        gameState.timer, 
        gameState.hintsUsed, 
        gameState.guessesRemaining
      );
      
      showMessage(`Tebrikler! Kelimeyi buldunuz! Skorunuz: ${gameState.score}`, 'success');
      scoreDisplay.textContent = gameState.score;
      gameState.gameOver = true;
      
      // Skor kaydetme
      saveScore('wordle', gameState.score);
      
      try {
        playSound('static/sounds/success.mp3');
      } catch (err) {
        console.log("Ses çalma hatası:", err);
      }
      
      return;
    }
    
    // Oyun bitti mi kontrol et
    if (gameState.guessesRemaining === 0) {
      stopTimer();
      showMessage(`Oyun bitti! Doğru kelime: ${gameState.answer}`, 'error');
      gameState.gameOver = true;
      
      try {
        playSound('static/sounds/game-over.mp3');
      } catch (err) {
        console.log("Ses çalma hatası:", err);
      }
      
      return;
    }
    
    // Sonraki satıra geç
    gameState.currentGuess = [];
  }
  
  // İpucu verme fonksiyonu
  function giveHint() {
    if (gameState.gameOver) return;
    
    gameState.hintsUsed++;
    
    // Henüz açığa çıkmamış rastgele bir harf ver
    const currentRow = 6 - gameState.guessesRemaining;
    const remainingLetters = [];
    
    for (let i = 0; i < 5; i++) {
      const isRevealed = gameState.currentGuess[i] === gameState.answer[i];
      
      if (!isRevealed) {
        remainingLetters.push({
          index: i,
          letter: gameState.answer[i]
        });
      }
    }
    
    if (remainingLetters.length > 0) {
      const randomHint = remainingLetters[Math.floor(Math.random() * remainingLetters.length)];
      showMessage(`İpucu: ${randomHint.index + 1}. konumda "${randomHint.letter}" harfi var.`, 'info');
      
      try {
        playSound('static/sounds/hint.mp3');
      } catch (err) {
        console.log("Ses çalma hatası:", err);
      }
    } else {
      showMessage('Daha fazla ipucu veremiyorum!', 'info');
    }
  }
  
  // Harf ekle fonksiyonu
  function addLetter(letter) {
    if (gameState.gameOver) return;
    
    if (gameState.currentGuess.length < 5) {
      gameState.currentGuess.push(letter);
      
      // Tahtadaki geçerli hücreye harfi ekle
      const row = 6 - gameState.guessesRemaining;
      const col = gameState.currentGuess.length - 1;
      
      gameState.gameBoardRows[row][col].textContent = letter;
      gameState.gameBoardRows[row][col].classList.add('filled');
      
      try {
        playSound('static/sounds/click.mp3');
      } catch (err) {
        console.log("Ses çalma hatası:", {});
      }
    }
  }
  
  // Harf sil fonksiyonu
  function removeLetter() {
    if (gameState.gameOver) return;
    
    if (gameState.currentGuess.length > 0) {
      // Tahtadaki geçerli hücreden harfi kaldır
      const row = 6 - gameState.guessesRemaining;
      const col = gameState.currentGuess.length - 1;
      
      gameState.gameBoardRows[row][col].textContent = '';
      gameState.gameBoardRows[row][col].classList.remove('filled');
      
      gameState.currentGuess.pop();
    }
  }
  
  // Klavye girişini işle
  function handleKeyboardInput(key) {
    if (gameState.gameOver) return;
    
    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      removeLetter();
    } else {
      addLetter(key);
    }
  }
  
  // Fiziksel klavye girişini işle
  function handleKeydown(event) {
    if (gameState.gameOver) return;
    
    const key = event.key.toUpperCase();
    
    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE' || key === 'DELETE') {
      removeLetter();
    } else if (/^[A-ZÇĞİÖŞÜ]$/.test(key)) {
      addLetter(key);
    }
  }
  
  // Mesaj göster
  function showMessage(text, type) {
    messageDisplay.textContent = text;
    messageDisplay.className = `message ${type}`;
  }
  
  // Mesajı animasyonlu göster
  function animateMessage() {
    messageDisplay.classList.add('animate');
    setTimeout(() => {
      messageDisplay.classList.remove('animate');
    }, 500);
  }
  
  // Skor kaydetme
  function saveScore(gameType, score) {
    fetch('/api/save_score', {
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
        console.log('Skor kaydedildi');
      } else {
        console.error('Skor kaydedilemedi');
      }
    })
    .catch(error => {
      console.error('Skor kaydetme hatası:', error);
    });
  }
  
  // Sesi çal
  function playSound(src) {
    const sound = new Audio(src);
    sound.play();
  }
  
  // Yeni oyun butonunu ayarla
  document.getElementById('new-game-button').addEventListener('click', resetGame);
  
  // İpucu butonunu ayarla
  hintButton.addEventListener('click', giveHint);
  
  // Klavye dinleyicisini ayarla
  document.addEventListener('keydown', handleKeydown);
  
  // Oyunu başlat
  createGameboard();
  createKeyboard();
  startTimer();
});
