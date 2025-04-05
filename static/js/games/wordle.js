document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const startScreen = document.getElementById('start-screen');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const startBtn = document.getElementById('start-game');
  const wordleGrid = document.getElementById('wordle-grid');
  const mobileInput = document.getElementById('mobile-input');
  const playAgainBtn = document.getElementById('play-again');
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

  // Ses efektleri - güvenli şekilde yükleme
  const sounds = {};
  
  try {
    sounds.keypress = new Audio('/static/sounds/click.mp3');
    sounds.correct = new Audio('/static/sounds/correct.mp3');
    sounds.wrong = new Audio('/static/sounds/wrong.mp3');
    sounds.hint = new Audio('/static/sounds/hint.mp3');
    sounds.gameWin = new Audio('/static/sounds/success.mp3');
    sounds.gameLose = new Audio('/static/sounds/game-over.mp3');
  } catch (e) {
    console.error("Ses dosyaları yüklenemedi:", e);
  }

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
    usedLetters: {
      correct: new Set(),
      present: new Set(),
      absent: new Set()
    }
  };

  // Kullanıcı klavye etkileşimi için değişken
  let isKeyboardOpen = false;

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

    // Grid oluştur ve mobil klavye yönetimini etkinleştir
    createWordleGrid();
    setupMobileInput();

    // Ses efektlerini sıfırla
    resetSounds();

    // Oyun başlangıç sesi çal
    playSound('keypress');
  }

  /**
   * Wordle ızgarasını oluşturur
   */
  // Mobil klavye yönetimi için değişken
  const inputField = document.createElement('input');
  inputField.type = 'text';
  inputField.className = 'wordle-input-field';
  inputField.maxLength = 1; // Tek harf için
  inputField.autocomplete = 'off';


  /**
   * Mobil klavye girişini ayarlar
   */
  function setupMobileInput() {
    if (mobileInput) {
      mobileInput.addEventListener('input', function(e) {
        const letter = e.target.value.toUpperCase();
        if (letter.match(/[A-ZĞÜŞİÖÇ]/i)) {
          handleLetterInput(letter);
        }
        e.target.value = ''; // İnput alanını temizle
      });
    
      // Silme ve Enter tuşları için klavye dinleyicisi ekleme
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace') {
          handleBackspace();
        } else if (e.key === 'Enter') {
          handleEnter();
        }
      });
    } else {
      console.error('Mobile input element not found');
    }
  }
  
  /**
   * Harf girişini işler
   */
  function handleLetterInput(letter) {
    const currentAttempt = gameState.attempts;
    if (currentAttempt >= 6) return; // Maksimum deneme sayısı
    
    const currentGuess = gameState.guesses[currentAttempt];
    if (currentGuess.length >= gameState.wordLength) return; // Kelime uzunluğu kadar harf
    
    gameState.guesses[currentAttempt] += letter;
    updateGridWithCurrentGuess();
    playSound('keypress');
  }
  
  /**
   * Backspace işlemini yönetir
   */
  function handleBackspace() {
    const currentAttempt = gameState.attempts;
    if (currentAttempt >= 6) return;
    
    const currentGuess = gameState.guesses[currentAttempt];
    if (currentGuess.length > 0) {
      gameState.guesses[currentAttempt] = currentGuess.slice(0, -1);
      updateGridWithCurrentGuess();
      playSound('backspace');
    }
  }
  
  /**
   * Enter tuşu işlemini yönetir
   */
  function handleEnter() {
    const currentAttempt = gameState.attempts;
    if (currentAttempt >= 6) return;
    
    const currentGuess = gameState.guesses[currentAttempt];
    
    if (currentGuess.length < gameState.wordLength) {
      showMessage('Yeterli harf girilmedi!');
      animateRowShake(currentAttempt);
      return;
    }
    
    submitGuess();
  }
  
  /**
   * Mevcut tahmini grid üzerinde günceller
   */
  function updateGridWithCurrentGuess() {
    const currentAttempt = gameState.attempts;
    const currentGuess = gameState.guesses[currentAttempt];
    
    const rowCells = document.querySelectorAll(`.wordle-row[data-row="${currentAttempt}"] .wordle-cell`);
    
    for (let i = 0; i < gameState.wordLength; i++) {
      if (i < currentGuess.length) {
        rowCells[i].textContent = currentGuess[i];
        rowCells[i].classList.add('filled');
      } else {
        rowCells[i].textContent = '';
        rowCells[i].classList.remove('filled');
      }
    }
  }
  inputField.autocapitalize = 'characters';
  
  /**
   * Mobil klavye girişini ayarlar
   */
  function setupMobileInput() {
    if (mobileInput) {
      mobileInput.addEventListener('input', function(e) {
        const letter = e.target.value.toUpperCase();
        if (letter.match(/[A-ZĞÜŞİÖÇ]/i)) {
          handleLetterInput(letter);
        }
        e.target.value = ''; // İnput alanını temizle
      });
    
      // Silme ve Enter tuşları için klavye dinleyicisi ekleme
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace') {
          handleBackspace();
        } else if (e.key === 'Enter') {
          handleEnter();
        }
      });
    } else {
      console.error('Mobile input element not found');
    }
  }
  
  /**
   * Harf girişini işler
   */
  function handleLetterInput(letter) {
    const currentAttempt = gameState.attempts;
    if (currentAttempt >= 6) return; // Maksimum deneme sayısı
    
    const currentGuess = gameState.guesses[currentAttempt];
    if (currentGuess.length >= gameState.wordLength) return; // Kelime uzunluğu kadar harf
    
    gameState.guesses[currentAttempt] += letter;
    updateGridWithCurrentGuess();
    playSound('keypress');
  }
  
  /**
   * Backspace işlemini yönetir
   */
  function handleBackspace() {
    const currentAttempt = gameState.attempts;
    if (currentAttempt >= 6) return;
    
    const currentGuess = gameState.guesses[currentAttempt];
    if (currentGuess.length > 0) {
      gameState.guesses[currentAttempt] = currentGuess.slice(0, -1);
      updateGridWithCurrentGuess();
      playSound('backspace');
    }
  }
  
  /**
   * Enter tuşu işlemini yönetir
   */
  function handleEnter() {
    const currentAttempt = gameState.attempts;
    if (currentAttempt >= 6) return;
    
    const currentGuess = gameState.guesses[currentAttempt];
    
    if (currentGuess.length < gameState.wordLength) {
      showMessage('Yeterli harf girilmedi!');
      animateRowShake(currentAttempt);
      return;
    }
    
    submitGuess();
  }
  
  /**
   * Mevcut tahmini grid üzerinde günceller
   */
  function updateGridWithCurrentGuess() {
    const currentAttempt = gameState.attempts;
    const currentGuess = gameState.guesses[currentAttempt];
    
    const rowCells = document.querySelectorAll(`.wordle-row[data-row="${currentAttempt}"] .wordle-cell`);
    
    for (let i = 0; i < gameState.wordLength; i++) {
      if (i < currentGuess.length) {
        rowCells[i].textContent = currentGuess[i];
        rowCells[i].classList.add('filled');
      } else {
        rowCells[i].textContent = '';
        rowCells[i].classList.remove('filled');
      }
    }
  }
  
  function createWordleGrid() {
    wordleGrid.innerHTML = '';
    document.body.appendChild(inputField);
    
    for (let row = 0; row < 6; row++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'wordle-row';
      rowDiv.dataset.row = row;
      
      for (let col = 0; col < 5; col++) {
        const cell = document.createElement('div');
        cell.className = 'wordle-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        // Hücreye tıklandığında klavyeyi açma
        cell.addEventListener('click', function() {
          if (gameState.isGameOver) return;
          if (parseInt(cell.dataset.row) === gameState.currentRow) {
            openMobileKeyboard();
          }
        });
        
        rowDiv.appendChild(cell);
      }
      
      wordleGrid.appendChild(rowDiv);
    }
    
    // Klavye yönetimini ayarla
    setupKeyboardInput();
  }
  
  /**
   * Mobil klavyeyi açar
   */
  function openMobileKeyboard() {
    inputField.value = '';
    inputField.focus();
    isKeyboardOpen = true;
    
    // Ekranın kaymaması için sayfayı düzenle
    setTimeout(() => {
      // Aktif satıra scroll yap
      const activeRow = document.querySelector(`.wordle-row[data-row="${gameState.currentRow}"]`);
      if (activeRow) {
        activeRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  }
  
  /**
   * Klavye giriş olaylarını ayarlar
   */
  function setupKeyboardInput() {
    inputField.addEventListener('input', function(e) {
      if (gameState.isGameOver) return;
      
      const input = e.target.value.toUpperCase();
      if (input && /^[A-ZĞÜŞİÖÇ]$/.test(input)) {
        addLetter(input);
        inputField.value = ''; // Değeri temizle
        playSound('keypress');
      }
    });
    
    inputField.addEventListener('keydown', function(e) {
      if (gameState.isGameOver) return;
      
      if (e.key === 'Enter') {
        submitGuess();
      } else if (e.key === 'Backspace') {
        deleteLetter();
        playSound('keypress');
      }
    });
    
    // Klavye kapandığında durumu güncelle
    inputField.addEventListener('blur', function() {
      setTimeout(() => {
        isKeyboardOpen = false;
      }, 100);
    });
  }

  /**
   * Klavyeyi oluşturur
   */
      
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
      
      // Harf ekledikten sonra tekrar klavyeye odaklan
      if (isKeyboardOpen) {
        setTimeout(() => {
          inputField.focus();
        }, 10);
      }
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
      
      // Silme işleminden sonra tekrar klavyeye odaklan
      if (isKeyboardOpen) {
        setTimeout(() => {
          inputField.focus();
        }, 10);
      }
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
    } else {
      // Sonraki satıra geçildiğinde ızgarayı güncelle ve otomatik klavye aç
      setTimeout(() => {
        updateGrid();
        
        // Mobil cihazda otomatik klavye açma
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          setTimeout(() => {
            openMobileKeyboard();
          }, 300);
        }
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
      
      // Harf durumunu güncelle
      if (status === 'correct') {
        gameState.letterStatus.correct.add(letter);
      } else if (status === 'present') {
        gameState.letterStatus.present.add(letter);
      } else if (status === 'absent') {
        gameState.letterStatus.absent.add(letter);
      }
    }
    
    // Mobil girişe odaklan
    if (mobileInput) {
      mobileInput.focus();
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
          
          // Hücre dolu mu kontrol et
          if (gameState.guesses[row][col]) {
            cell.classList.add('filled');
          } else {
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
    
    // Aktif satıra tıklayınca otomatik klavye aç
    if (gameState.currentRow < 6 && !gameState.isGameOver) {
      const currentRow = document.querySelector(`.wordle-row[data-row="${gameState.currentRow}"]`);
      if (currentRow) {
        currentRow.addEventListener('click', function() {
          openMobileKeyboard();
        });
      }
    }
  }

  /**
   * Satırı sallama animasyonu
   */
  function shakeRow(row) {
    const rowElement = document.querySelector(`.wordle-row[data-row="${row}"]`);
    if (!rowElement) return;
    
    rowElement.classList.add('shake');
    
    setTimeout(() => {
      rowElement.classList.remove('shake');
    }, 500);
  }

  /**
   * Mesaj göster
   */
  function showMessage(text, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.className = `game-message ${type}`;
    messageElement.textContent = text;
    
    // Varsa önceki mesajı kaldır
    messageContainer.innerHTML = '';
    messageContainer.appendChild(messageElement);
    
    // Mesajı belirli bir süre sonra kaldır
    setTimeout(() => {
      messageElement.remove();
    }, 3000);
  }

  /**
   * İpucu al
   */
  function getHint() {
    if (gameState.isGameOver || gameState.hintsLeft <= 0) return;
    
    // Sesli uyarı çal
    playSound('hint');
    
    // Mevcut satırda boş olmayan tüm hücreleri bul
    const currentRowCells = Array.from(document.querySelectorAll(`.wordle-cell[data-row="${gameState.currentRow}"]`));
    const emptyCells = currentRowCells.filter(cell => !cell.textContent);
    
    if (emptyCells.length === 0) {
      showMessage("Tüm harfler dolu! Tahmininizi gönderin veya harfleri silin.", 'warning');
      return;
    }
    
    // Rastgele bir boş hücre seç
    const randomEmptyCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const col = parseInt(randomEmptyCell.dataset.col);
    
    // Doğru harfi yerleştir
    const correctLetter = gameState.answer[col];
    gameState.guesses[gameState.currentRow][col] = correctLetter;
    
    // Izgarayı güncelle
    updateGrid();
    
    // İpucu sayısını azalt
    gameState.hintsLeft -= 1;
    hintCount.textContent = gameState.hintsLeft;
    
    // Animasyon ekle
    randomEmptyCell.classList.add('pop');
    setTimeout(() => {
      randomEmptyCell.classList.remove('pop');
    }, 500);
    
    // İpucu kullanıldı mesajı göster
    showMessage(`İpucu: "${correctLetter}" harfi doğru yere yerleştirildi`, 'info');
    
    // İpucu kalmadıysa butonu devre dışı bırak
    if (gameState.hintsLeft <= 0) {
      hintButton.classList.add('disabled');
    }
    
    // İpucu kullanıldıktan sonra bir sonraki sütuna geç
    if (gameState.currentCol <= col) {
      gameState.currentCol = col + 1;
    }
  }

  /**
   * Sesi aç/kapat
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
   * Ses çalma
   */
  function playSound(sound) {
    if (!gameState.soundEnabled) return;
    
    try {
      if (sounds[sound]) {
        sounds[sound].currentTime = 0;
        sounds[sound].play().catch(err => {
          console.log("Ses çalma hatası:", err);
        });
      }
    } catch (e) {
      console.log("Ses çalma hatası:", e);
    }
  }

  /**
   * Ses efektlerini sıfırla
   */
  function resetSounds() {
    for (const sound in sounds) {
      try {
        if (sounds[sound]) {
          sounds[sound].pause();
          sounds[sound].currentTime = 0;
        }
      } catch (e) {
        console.log("Ses sıfırlama hatası:", e);
      }
    }
  }

  /**
   * Skoru güncelle
   */
  function updateScore(result) {
    if (!result) return;
    
    // Doğru harfler için puan
    const correctCount = result.filter(r => r === 'correct').length;
    const presentCount = result.filter(r => r === 'present').length;
    
    // Puan hesapla
    let roundScore = (correctCount * 10) + (presentCount * 5);
    
    // Erken tahmin bonusu
    const attemptBonus = Math.max(0, 6 - gameState.currentRow) * 5;
    roundScore += attemptBonus;
    
    // Toplam skoru güncelle
    gameState.score += roundScore;
    
    // Skor ekranını güncelle
    scoreDisplay.textContent = gameState.score;
  }

  /**
   * Skoru göster
   */
  function updateScoreDisplay() {
    scoreDisplay.textContent = gameState.score;
    streakDisplay.textContent = gameState.streak;
    guessesDisplay.textContent = `0/6`;
  }

  /**
   * Oyunu sonlandır
   */
  function endGame(isWin) {
    gameState.isGameOver = true;
    
    // Skor hesapla
    const finalScore = gameState.score;
    
    // Seri hesapla
    if (isWin) {
      gameState.streak += 1;
      playSound('gameWin');
    } else {
      gameState.streak = 0;
      playSound('gameLose');
    }
    
    // Sonuç mesajı
    let resultMessage = isWin
      ? "Tebrikler! Kelimeyi buldunuz."
      : "Üzgünüm, doğru kelimeyi bulamadınız.";
    
    // Sonuç ekranını hazırla
    document.getElementById('game-result-message').textContent = resultMessage;
    document.getElementById('answer-reveal').textContent = gameState.answer;
    document.getElementById('final-score').textContent = finalScore;
    document.getElementById('final-streak').textContent = gameState.streak;
    document.getElementById('attempts-count').textContent = `${gameState.currentRow}/6`;
    
    // Yıldız derecelendirmesi
    updateStarRating(isWin, gameState.currentRow);
    
    // Oyun sonucunu API'ye gönder
    saveScore(finalScore);
    
    // Sonuç ekranını göster
    setTimeout(() => {
      gameContainer.style.display = 'none';
      gameOverContainer.style.display = 'block';
    }, 1000);
  }
  
  /**
   * Yıldız derecelendirmesini güncelle
   */
  function updateStarRating(isWin, attempts) {
    const ratingStars = document.querySelectorAll('.rating-stars i');
    const ratingText = document.getElementById('rating-text');
    
    // Tüm yıldızları sıfırla
    ratingStars.forEach(star => {
      star.className = 'far fa-star';
    });
    
    let stars = 0;
    let ratingMessage = '';
    
    if (!isWin) {
      stars = 1;
      ratingMessage = 'Üzgünüm!';
    } else {
      // Tahmin sayısına göre yıldız belirle
      switch (attempts) {
        case 1:
          stars = 5;
          ratingMessage = 'Muhteşem!';
          break;
        case 2:
          stars = 4;
          ratingMessage = 'Harika!';
          break;
        case 3:
          stars = 4;
          ratingMessage = 'Çok İyi!';
          break;
        case 4:
          stars = 3;
          ratingMessage = 'İyi!';
          break;
        case 5:
          stars = 2;
          ratingMessage = 'Fena Değil!';
          break;
        case 6:
          stars = 2;
          ratingMessage = 'Son Anda!';
          break;
      }
    }
    
    // Yıldızları ayarla
    for (let i = 0; i < stars; i++) {
      if (i < ratingStars.length) {
        ratingStars[i].className = 'fas fa-star';
      }
    }
    
    // Derecelendirme mesajını ayarla
    ratingText.textContent = ratingMessage;
  }
  
  /**
   * Skoru API'ye kaydet
   */
  function saveScore(score) {
    fetch('/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: 'wordle',
        score: score
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Skor kaydedilemedi');
      }
      return response.json();
    })
    .then(data => {
      console.log('Skor başarıyla kaydedildi:', data);
    })
    .catch(error => {
      console.error('Skor kaydedilirken hata oluştu:', error);
    });
  }
  
  /**
   * Skoru kopyala
   */
  function copyScore() {
    const resultText = generateResultText();
    
    navigator.clipboard.writeText(resultText)
      .then(() => {
        showMessage('Skor panoya kopyalandı!', 'success');
      })
      .catch(err => {
        console.error('Kopyalama başarısız:', err);
        showMessage('Kopyalama başarısız!', 'error');
      });
  }
  
  /**
   * Skoru paylaş
   */
  function shareScore() {
    const resultText = generateResultText();
    
    if (navigator.share) {
      navigator.share({
        title: 'ZekaPark Wordle Skorumu Gör!',
        text: resultText
      })
      .then(() => console.log('Başarıyla paylaşıldı!'))
      .catch(err => console.error('Paylaşırken hata:', err));
    } else {
      // Paylaşım API'si yoksa kopyalama işlevini çalıştır
      copyScore();
    }
  }
  
  /**
   * Sonuç metni oluştur
   */
  function generateResultText() {
    const isWin = gameState.answer && gameState.guesses.some(guess => guess.join('') === gameState.answer);
    
    let resultText = `ZekaPark Wordle - Skor: ${gameState.score} - ${isWin ? 'Kazandı' : 'Kaybetti'}\n\n`;
    
    // Tahmin edilen kelimeleri emoji olarak ekle
    for (let row = 0; row < gameState.currentRow; row++) {
      const guess = gameState.guesses[row].join('');
      const result = checkGuess(guess);
      
      let rowText = '';
      for (let i = 0; i < result.length; i++) {
        if (result[i] === 'correct') {
          rowText += '🟩';
        } else if (result[i] === 'present') {
          rowText += '🟨';
        } else {
          rowText += '⬛';
        }
      }
      
      resultText += rowText + '\n';
    }
    
    resultText += `\nZekaPark'ta oyna: ${window.location.origin}/games/wordle`;
    
    return resultText;
  }

  // Tema değiştiricisi için güvenlik kontrolü
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      document.body.classList.toggle('dark-mode');
    });
  }

  // Oyun sayfası yüklendiğinde başlangıç ekranını göster
  if (startScreen && gameContainer) {
    startScreen.style.display = 'block';
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'none';
  }
});

// Ekran yüksekliği değişkenini ayarla (klavyeyle ilgili ekran kayma sorununu gidermek için)
function setVhVariable() {
  // İlk olarak, görünüm yüksekliğini hesapla
  let vh = window.innerHeight * 0.01;
  // Ardından, root değişkenlerinde --vh değişkenini ayarla
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Sayfa yüklendiğinde ve yeniden boyutlandırıldığında bu değeri güncelle
window.addEventListener('load', setVhVariable);
window.addEventListener('resize', setVhVariable);
window.addEventListener('orientationchange', setVhVariable);

/**
 * Tema değiştirme 
 */
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  
  // İkon değiştir
  const themeIcon = document.querySelector('#theme-toggle i');
  if (themeIcon) {
    if (document.body.classList.contains('dark-mode')) {
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
    } else {
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
    }
  }
  
  // Tercihi localStorage'a kaydet
  const isDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('wordle-dark-mode', isDarkMode);
}

// Tema değiştirici butonu
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', function() {
    toggleTheme();
  });
  
  // Sayfa yüklendiğinde kaydedilmiş temayı kontrol et
  document.addEventListener('DOMContentLoaded', function() {
    const isDarkMode = localStorage.getItem('wordle-dark-mode') === 'true';
    if (isDarkMode) {
      toggleTheme();
    }
  });
}
