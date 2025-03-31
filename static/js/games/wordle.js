/**
 * Wordle Oyunu
 * 5 harfli kelimeyi 6 denemede tahmin etmeye çalışın
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const guessGrid = document.getElementById('guess-grid');
  const keyboard = document.getElementById('keyboard');
  const messageDisplay = document.getElementById('message-display');
  const newGameBtn = document.getElementById('new-game-btn');
  const newGameModalBtn = document.getElementById('new-game-modal-btn');
  const gameEndModal = new bootstrap.Modal(document.getElementById('game-end-modal'));
  const gameEndMessage = document.getElementById('game-end-message');
  
  // Oyun Değişkenleri
  const WORD_LENGTH = 5;
  const FLIP_ANIMATION_DURATION = 500;
  const DANCE_ANIMATION_DURATION = 500;
  
  let targetWord = '';
  let guessedWords = [];
  let currentGuess = [];
  let isGuessing = true;
  let currentRow = 0;
  let animationRunning = false;
  
  // İstatistikler
  let gameStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0
  };
  
  // İstatistik elementleri
  const gamesPlayedEl = document.getElementById('games-played');
  const gamesWonEl = document.getElementById('games-won');
  const winPercentageEl = document.getElementById('win-percentage');
  const currentStreakEl = document.getElementById('current-streak');
  
  // Oyunu başlat
  initializeGame();
  
  /**
   * Oyunu başlatan fonksiyon
   */
  function initializeGame() {
    // Yerel depolamadan istatistikleri yükle
    loadStats();
    
    // Tahta oluştur
    createGameBoard();
    
    // Rastgele kelime seç
    targetWord = getRandomWordleWord().toUpperCase();
    console.log("Hedef kelime:", targetWord); // Geliştirme için, sonra kaldırılabilir
    
    // Klavye dinleyicileri ekle
    setupKeyboardListeners();
    
    // Yeni oyun butonları dinleyicileri
    setupButtonListeners();
    
    // Oyun durumunu sıfırla
    resetGameState();
  }
  
  /**
   * Oyun istatistiklerini yerel depolamadan yükler
   */
  function loadStats() {
    const storedStats = localStorage.getItem('wordleStats');
    if (storedStats) {
      gameStats = JSON.parse(storedStats);
    }
    
    updateStatsDisplay();
  }
  
  /**
   * Oyun istatistiklerini yerel depolamaya kaydeder
   */
  function saveStats() {
    localStorage.setItem('wordleStats', JSON.stringify(gameStats));
    updateStatsDisplay();
  }
  
  /**
   * İstatistik görüntüsünü günceller
   */
  function updateStatsDisplay() {
    gamesPlayedEl.textContent = gameStats.gamesPlayed;
    gamesWonEl.textContent = gameStats.gamesWon;
    
    const winPercentage = gameStats.gamesPlayed > 0 
      ? Math.round((gameStats.gamesWon / gameStats.gamesPlayed) * 100) 
      : 0;
    
    winPercentageEl.textContent = `${winPercentage}%`;
    currentStreakEl.textContent = gameStats.currentStreak;
  }
  
  /**
   * Oyun tahtasını oluşturur
   */
  function createGameBoard() {
    guessGrid.innerHTML = '';
    
    for (let i = 0; i < 6; i++) {
      const row = document.createElement('div');
      row.classList.add('row');
      
      for (let j = 0; j < WORD_LENGTH; j++) {
        const box = document.createElement('div');
        box.classList.add('letter-box');
        box.classList.add('empty');
        box.dataset.row = i;
        box.dataset.col = j;
        
        row.appendChild(box);
      }
      
      guessGrid.appendChild(row);
    }
  }
  
  /**
   * Klavye olaylarını ekler
   */
  function setupKeyboardListeners() {
    // Fiziksel klavye dinleyicisi
    document.addEventListener('keydown', handleKeyPress);
    
    // Sanal klavye dinleyicisi
    keyboard.addEventListener('click', (event) => {
      const target = event.target;
      if (target.tagName === 'BUTTON' && target.hasAttribute('data-key')) {
        const key = target.getAttribute('data-key');
        handleKeyInput(key);
      }
    });
  }
  
  /**
   * Buton dinleyicilerini ayarlar
   */
  function setupButtonListeners() {
    newGameBtn.addEventListener('click', startNewGame);
    newGameModalBtn.addEventListener('click', () => {
      gameEndModal.hide();
      startNewGame();
    });
  }
  
  /**
   * Klavye girişlerini işler
   */
  function handleKeyPress(event) {
    if (!isGuessing || animationRunning) return;
    
    const key = event.key;
    
    if (key === 'Enter') {
      submitGuess();
    } else if (key === 'Backspace') {
      deleteLetter();
    } else if (/^[a-zA-ZğüşıöçĞÜŞİÖÇ]$/.test(key)) {
      // Türkçe harfleri de kabul eder
      addLetter(key.toUpperCase());
    }
  }
  
  /**
   * Klavye giriş işlemleri
   */
  function handleKeyInput(key) {
    if (!isGuessing || animationRunning) return;
    
    if (key === 'Enter') {
      submitGuess();
    } else if (key === 'Backspace') {
      deleteLetter();
    } else {
      addLetter(key.toUpperCase());
    }
  }
  
  /**
   * Harf ekler
   */
  function addLetter(letter) {
    if (currentGuess.length < WORD_LENGTH) {
      currentGuess.push(letter);
      
      // Harf kutusunu güncelle
      const box = getLetterBox(currentRow, currentGuess.length - 1);
      box.textContent = letter;
      box.classList.remove('empty');
      box.classList.add('filled');
      
      playPopAnimation(box);
    }
  }
  
  /**
   * Son harfi siler
   */
  function deleteLetter() {
    if (currentGuess.length > 0) {
      currentGuess.pop();
      
      // Harf kutusunu güncelle
      const box = getLetterBox(currentRow, currentGuess.length);
      box.textContent = '';
      box.classList.remove('filled');
      box.classList.add('empty');
    }
  }
  
  /**
   * Tahmin girişini gönderir
   */
  function submitGuess() {
    if (currentGuess.length !== WORD_LENGTH) {
      showMessage('5 harfli bir kelime girin!', 'error');
      shakeRow(currentRow);
      return;
    }
    
    const guessWord = currentGuess.join('');
    
    // Geçerli kelime kontrolü
    if (!isValidWordleWord(guessWord.toLowerCase())) {
      showMessage('Geçerli bir kelime değil!', 'error');
      shakeRow(currentRow);
      return;
    }
    
    // Tahmini kaydet
    guessedWords.push(guessWord);
    
    // Harfleri kontrol et ve animasyonu göster
    animationRunning = true;
    checkGuess(guessWord);
    
    // Animasyon sona erdikten sonra
    setTimeout(() => {
      // Kazanma kontrolü
      if (guessWord === targetWord) {
        setTimeout(() => {
          isGuessing = false;
          danceRow(currentRow);
          
          setTimeout(() => {
            gameStats.gamesPlayed++;
            gameStats.gamesWon++;
            gameStats.currentStreak++;
            saveStats();
            
            gameEndMessage.innerHTML = `
              <div class="alert alert-success">
                <h4 class="alert-heading">Tebrikler!</h4>
                <p>Doğru kelimeyi buldunuz: <strong>${targetWord}</strong></p>
                <p>Tahmin sayınız: ${currentRow + 1}/6</p>
              </div>
            `;
            gameEndModal.show();
          }, DANCE_ANIMATION_DURATION);
        }, 250);
      } 
      // Son satıra geldiyse ve bulamadıysa
      else if (currentRow === 5) {
        gameStats.gamesPlayed++;
        gameStats.currentStreak = 0;
        saveStats();
        
        gameEndMessage.innerHTML = `
          <div class="alert alert-warning">
            <h4 class="alert-heading">Oyun Bitti</h4>
            <p>Doğru kelime: <strong>${targetWord}</strong> idi</p>
            <p>Tekrar deneyin!</p>
          </div>
        `;
        isGuessing = false;
        gameEndModal.show();
      } 
      // Oyun devam ediyor
      else {
        currentRow++;
        currentGuess = [];
        animationRunning = false;
      }
    }, WORD_LENGTH * FLIP_ANIMATION_DURATION + 100);
  }
  
  /**
   * Tahmini hedef kelimeyle karşılaştırır
   */
  function checkGuess(guess) {
    let letterStates = Array(WORD_LENGTH).fill('absent');
    const targetLetterCounts = {};
    
    // Hedef kelimedeki harf sayılarını hesapla
    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = targetWord[i];
      targetLetterCounts[letter] = (targetLetterCounts[letter] || 0) + 1;
    }
    
    // Önce doğru konumdaki harfleri işaretle
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guess[i] === targetWord[i]) {
        letterStates[i] = 'correct';
        targetLetterCounts[guess[i]]--;
      }
    }
    
    // Sonra yanlış konumdaki harfleri işaretle
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (letterStates[i] !== 'correct') {
        if (targetLetterCounts[guess[i]] && targetLetterCounts[guess[i]] > 0) {
          letterStates[i] = 'present';
          targetLetterCounts[guess[i]]--;
        }
      }
    }
    
    // Harflerin durumlarını animasyonla göster
    for (let i = 0; i < WORD_LENGTH; i++) {
      setTimeout(() => {
        revealTile(currentRow, i, letterStates[i]);
        
        // Klavye durumunu da güncelle
        updateKeyboardState(guess[i], letterStates[i]);
        
        // Son harf ise animasyon durumunu güncelle
        if (i === WORD_LENGTH - 1) {
          setTimeout(() => {
            animationRunning = false;
          }, FLIP_ANIMATION_DURATION);
        }
      }, i * FLIP_ANIMATION_DURATION);
    }
  }
  
  /**
   * Harf kutusunu çevirir ve durumunu gösterir
   */
  function revealTile(row, col, state) {
    const box = getLetterBox(row, col);
    
    box.classList.add('flip');
    
    setTimeout(() => {
      box.classList.remove('filled');
      box.classList.add(state);
      
      setTimeout(() => {
        box.classList.remove('flip');
      }, FLIP_ANIMATION_DURATION / 2);
    }, FLIP_ANIMATION_DURATION / 2);
  }
  
  /**
   * Klavye tuşlarının durumunu güncelle
   */
  function updateKeyboardState(letter, state) {
    const key = keyboard.querySelector(`[data-key="${letter.toLowerCase()}"]`);
    if (!key) return;
    
    // Mevcut durumu daha iyi bir durumla güncelle
    if (key.classList.contains('correct')) {
      return; // Zaten doğru
    } else if (key.classList.contains('present') && state !== 'correct') {
      return; // Present daha iyi
    }
    
    // Eski sınıfları kaldır
    key.classList.remove('correct', 'present', 'absent');
    
    // Yeni durumu ekle
    key.classList.add(state);
  }
  
  /**
   * Belirli satırı sallama animasyonu
   */
  function shakeRow(row) {
    const boxes = Array.from(guessGrid.children[row].children);
    
    boxes.forEach(box => {
      box.classList.add('shake');
      setTimeout(() => {
        box.classList.remove('shake');
      }, 500);
    });
  }
  
  /**
   * Belirli satırı dans ettirme animasyonu
   */
  function danceRow(row) {
    const boxes = Array.from(guessGrid.children[row].children);
    
    boxes.forEach((box, index) => {
      setTimeout(() => {
        box.classList.add('dance');
        setTimeout(() => {
          box.classList.remove('dance');
        }, DANCE_ANIMATION_DURATION);
      }, index * 100);
    });
  }
  
  /**
   * Pop animasyonu
   */
  function playPopAnimation(element) {
    element.classList.add('pop');
    setTimeout(() => {
      element.classList.remove('pop');
    }, 100);
  }
  
  /**
   * Belirli satır ve sütundaki kutuyu döndürür
   */
  function getLetterBox(row, col) {
    return guessGrid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  }
  
  /**
   * Mesaj gösterir
   */
  function showMessage(text, type = 'info') {
    messageDisplay.textContent = text;
    messageDisplay.className = 'message-display show';
    messageDisplay.classList.add(type);
    
    setTimeout(() => {
      messageDisplay.classList.remove('show');
    }, 2000);
  }
  
  /**
   * Yeni oyun başlatır
   */
  function startNewGame() {
    // Yeni kelime seç
    targetWord = getRandomWordleWord().toUpperCase();
    console.log("Yeni hedef kelime:", targetWord); // Geliştirme için, sonra kaldırılabilir
    
    // Oyun durumunu sıfırla
    resetGameState();
    
    // Tahtayı temizle
    const letterBoxes = guessGrid.querySelectorAll('.letter-box');
    letterBoxes.forEach(box => {
      box.textContent = '';
      box.className = 'letter-box empty';
    });
    
    // Klavyeyi sıfırla
    const keys = keyboard.querySelectorAll('.key');
    keys.forEach(key => {
      key.classList.remove('correct', 'present', 'absent');
    });
  }
  
  /**
   * Oyun durumunu sıfırlar
   */
  function resetGameState() {
    guessedWords = [];
    currentGuess = [];
    isGuessing = true;
    currentRow = 0;
    animationRunning = false;
  }
});

/**
 * Puanı sunucuya kaydeder
 */
function saveWordleScore(score) {
  fetch('/api/save_score', {
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
    console.log('Skor başarıyla kaydedildi:', data);
  })
  .catch(error => {
    console.error('Skor kaydedilirken hata oluştu:', error);
  });
}