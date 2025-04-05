
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
    },
    mobileKeyboardActive: false
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

    // Grid ve klavyeyi oluştur
    createWordleGrid();
    createKeyboard();

    // Ses efektlerini sıfırla
    resetSounds();

    // Oyun başlangıç sesi çal
    playSound('keypress');
  }

  /**
   * Wordle ızgarasını oluşturur
   */
  // Mobil klavye yönetimi için geliştirilmiş değişkenler
  const inputField = document.createElement('input');
  inputField.type = 'text';
  inputField.className = 'wordle-input-field';
  inputField.maxLength = 1; // Tek harf için
  inputField.autocomplete = 'off';
  inputField.autocapitalize = 'characters';
  inputField.inputMode = 'text'; // Mobil klavyeyi daha iyi destekler
  inputField.autocorrect = 'off';
  inputField.spellcheck = false;
  
  function createWordleGrid() {
    wordleGrid.innerHTML = '';
    document.body.appendChild(inputField);
    
    // Açıklama metni ekle
    const instructionText = document.createElement('div');
    instructionText.className = 'wordle-instruction';
    instructionText.textContent = 'Satıra tıklayarak klavyeyi açabilirsiniz';
    wordleGrid.parentNode.insertBefore(instructionText, wordleGrid);
    
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
      
      // Satırın tamamı tıklanabilir olsun
      rowDiv.addEventListener('click', function() {
        if (gameState.isGameOver) return;
        if (parseInt(rowDiv.dataset.row) === gameState.currentRow) {
          openMobileKeyboard();
        }
      });
      
      wordleGrid.appendChild(rowDiv);
    }
    
    // Klavye yönetimini ayarla
    setupKeyboardInput();
    
    // İlk satırı vurgula
    highlightActiveRow();
  }
  
  /**
   * Mobil klavyeyi açar
   */
  function openMobileKeyboard() {
    // Önce input değerini temizle
    inputField.value = '';
    
    // Sayfa konumunu hatırla ve klavye odaklandıktan sonra geri al
    const scrollPos = window.scrollY;
    
    // Klavyeyi odakla
    inputField.focus();
    gameState.mobileKeyboardActive = true;
    
    // Sayfanın otomatik kaydırmasını önlemek için konum düzeltmesi
    setTimeout(() => {
      window.scrollTo(0, scrollPos);
      
      // İnput alanının görünür olmasını engelle
      inputField.style.position = 'fixed';
      inputField.style.top = '50%';
      inputField.style.opacity = '0';
    }, 50);
    
    // Mobil klavye açıldığında UI'ı düzenle
    document.body.classList.add('keyboard-visible');
    
    // Aktif satırı vurgula
    highlightActiveRow();
  }
  
  /**
   * Klavye giriş olaylarını ayarlar
   */
  function setupKeyboardInput() {
    // Input değişikliklerini engellemek için flag kullan
    let isProcessing = false;
    
    // Input alanı için event listener kullan
    inputField.addEventListener('beforeinput', function(e) {
      // İşleme yapılıyorsa yeni girişleri engelle
      if (isProcessing || gameState.isGameOver) {
        e.preventDefault();
        return false;
      }
    });
    
    // Kompozisyon olaylarını izle (IME giriş sistemi için)
    inputField.addEventListener('compositionstart', function() {
      isProcessing = true;
    });
    
    inputField.addEventListener('compositionend', function() {
      isProcessing = false;
      // Kompozisyon bittiğinde değeri temizle
      inputField.value = '';
    });
    
    // Harf girişi için input eventini kullan
    inputField.addEventListener('input', function(e) {
      if (isProcessing || gameState.isGameOver) return;
      
      // İşlem yapılıyor olarak işaretle
      isProcessing = true;
      
      const input = e.target.value.trim().toUpperCase();
      
      if (input && /^[A-ZĞÜŞİÖÇ]$/.test(input)) {
        addLetter(input);
        playSound('keypress');
      }
      
      // Input alanını temizle
      setTimeout(() => {
        inputField.value = '';
        isProcessing = false;
      }, 50);
    });
    
    // Silme ve enter tuşları için keydown kullan
    inputField.addEventListener('keydown', function(e) {
      if (gameState.isGameOver) return;
      
      if (e.key === 'Enter') {
        e.preventDefault();
        submitGuess();
      } else if (e.key === 'Backspace') {
        // Silme işlemini sadece input boşsa yap (çift silmeyi önler)
        if (inputField.value === '') {
          e.preventDefault();
          deleteLetter();
          playSound('keypress');
        }
      }
    });
    
    // Klavye kapandığında durumu güncelle
    inputField.addEventListener('blur', function() {
      setTimeout(() => {
        gameState.mobileKeyboardActive = false;
        document.body.classList.remove('keyboard-visible');
        isProcessing = false;
      }, 100);
    });
    
    // Sayfa yüklendiğinde dokunma olayını dinle
    document.addEventListener('touchstart', function() {
      if (!gameState.isGameOver && !gameState.mobileKeyboardActive) {
        setTimeout(() => {
          openMobileKeyboard();
        }, 300);
      }
    }, {once: true});
  }

  /**
   * Klavyeyi oluşturur (Artık sadece mobil klavye için input alanı)
   */
  function createKeyboard() {
    // Klavye container'ını gizle
    const keyboardContainer = document.getElementById('keyboard');
    keyboardContainer.style.display = 'none';
    
    // Giriş alanını odakla
    setTimeout(() => {
      openMobileKeyboard();
    }, 300);
  }
  
  /**
   * Aktif satırı vurgula ve mobil klavyeyi açar
   */
  function highlightActiveRow() {
    // Tüm satırların vurgusunu kaldır
    const allCells = document.querySelectorAll('.wordle-cell');
    allCells.forEach(cell => {
      cell.classList.remove('current-row');
    });
    
    // Sadece aktif satırı vurgula
    const activeCells = document.querySelectorAll(`.wordle-cell[data-row="${gameState.currentRow}"]`);
    activeCells.forEach(cell => {
      cell.classList.add('current-row');
    });
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
      
      // Otomatik gönderme (5 harf tamamlandığında)
      if (gameState.currentCol === 5) {
        // Tam dolduğunda otomatik submit ekleyebilirsiniz (isteğe bağlı)
        // setTimeout(() => submitGuess(), 500);
      }
      
      // Harf ekledikten sonra tekrar klavyeye odaklan
      if (gameState.mobileKeyboardActive) {
        setTimeout(() => {
          inputField.focus();
          inputField.value = '';
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
      if (gameState.mobileKeyboardActive) {
        setTimeout(() => {
          inputField.focus();
          inputField.value = '';
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
        
        // Her zaman otomatik klavye açma
        setTimeout(() => {
          openMobileKeyboard();
        }, 300);
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
        cell.textContent = gameState.guesses[row][col];
        
        // Hücre dolu mu kontrol et
        if (gameState.guesses[row][col]) {
          cell.classList.add('filled');
        } else {
          cell.classList.remove('filled');
        }
      }
    }
    
    // Aktif satırı vurgula
    highlightActiveRow();
    
    // Mobil klavye odaklanmasını yeniden sağla
    if (gameState.currentRow < 6 && !gameState.isGameOver) {
      setTimeout(() => {
        if (!gameState.mobileKeyboardActive) {
          openMobileKeyboard();
        }
      }, 300);
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
   * Derecelendirmeyi günceller
   */
  function updateRating(isWin) {
    const ratingStars = document.querySelectorAll('.rating-stars i');
    const ratingText = document.getElementById('rating-text');
    
    let rating = 0;
    
    if (isWin) {
      // Erken tahmin için daha yüksek derecelendirme
      if (gameState.currentRow <= 2) rating = 5;
      else if (gameState.currentRow === 3) rating = 4;
      else if (gameState.currentRow === 4) rating = 3;
      else rating = 2;
    } else {
      rating = 1;
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
    if (rating === 5) ratingText.textContent = 'Mükemmel!';
    else if (rating === 4) ratingText.textContent = 'Çok İyi!';
    else if (rating === 3) ratingText.textContent = 'İyi';
    else if (rating === 2) ratingText.textContent = 'İdare Eder';
    else ratingText.textContent = 'Daha İyisini Yapabilirsin';
  }

  /**
   * Ses ayarını açar/kapatır
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
   * Belirtilen ses efektini çalar
   */
  function playSound(sound) {
    if (!gameState.soundEnabled) return;
    
    try {
      sounds[sound].currentTime = 0;
      sounds[sound].play().catch(err => console.log("Ses çalma hatası:", err));
    } catch (error) {
      console.log("Ses çalma hatası:", error);
    }
  }

  /**
   * Ses efektlerini sıfırlar
   */
  function resetSounds() {
    Object.values(sounds).forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
  }

  /**
   * Mesaj gösterir
   */
  function showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `game-message ${type}`;
    message.textContent = text;
    
    messageContainer.innerHTML = '';
    messageContainer.appendChild(message);
    
    setTimeout(() => {
      message.style.opacity = '0';
      setTimeout(() => {
        if (messageContainer.contains(message)) {
          messageContainer.removeChild(message);
        }
      }, 500);
    }, 2000);
  }

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
    fetch('/save_score', {
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
      console.error('Skor kaydedilirken hata oluştu:', error);
    });
  }
});
