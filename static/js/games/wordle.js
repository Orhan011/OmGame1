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
  
  // Klavye Modu Değiştirme Butonu
  let keyboardModeToggle;

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
    keyboardMode: 'custom', // 'custom' veya 'native'
    usedLetters: {
      correct: new Set(),
      present: new Set(),
      absent: new Set()
    },
    lastInputTime: 0,
    debounceTime: 300 // ms
  };

  // Kendi oluşturduğumuz tuş takımı için değişkenler
  let customKeyboard = null;
  let customKeyboardVisible = false;
  let lastTouch = 0;
  const minTouchInterval = 300; // ms
  
  // Mobil klavye girişi için input
  let mobileInput = null;
  
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
    ["Z", "C", "V", "B", "N", "M", "Ö", "Ç"]
  ];

  // Debounce fonksiyonu
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
  
  // Mobil input oluştur (native klavye için)
  function createMobileInput() {
    if (!mobileInput) {
      mobileInput = document.createElement('input');
      mobileInput.type = 'text';
      mobileInput.inputMode = 'text';
      mobileInput.autocomplete = 'off';
      mobileInput.autocorrect = 'off';
      mobileInput.autocapitalize = 'off';
      mobileInput.spellcheck = false;
      mobileInput.maxLength = 1;
      
      // Görünmez input
      mobileInput.style.opacity = '0';
      mobileInput.style.position = 'fixed';
      mobileInput.style.left = '-9999px';
      mobileInput.style.height = '1px';
      mobileInput.id = 'mobile-input';
      
      document.body.appendChild(mobileInput);
      
      // Harf giriş işlemi
      mobileInput.addEventListener('input', function(e) {
        const char = e.target.value.toUpperCase();
        
        if (/^[A-ZĞÜŞİÖÇ]$/.test(char)) {
          addLetter(char);
          playSound('keypress');
        }
        
        // Inputu temizle
        setTimeout(() => {
          mobileInput.value = '';
        }, 50);
      });
      
      // Silme ve Enter işlemleri
      mobileInput.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace') {
          e.preventDefault();
          deleteLetter();
          playSound('keypress');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          submitGuess();
        }
      });
    }
  }
  
  // Klavye modu değiştirme butonu oluştur
  function createKeyboardToggle() {
    if (!keyboardModeToggle) {
      keyboardModeToggle = document.createElement('button');
      keyboardModeToggle.id = 'keyboard-toggle';
      keyboardModeToggle.className = 'keyboard-toggle-btn';
      keyboardModeToggle.innerHTML = '<i class="fas fa-keyboard"></i>';
      keyboardModeToggle.title = gameState.keyboardMode === 'custom' ? 
                               'Mobil klavyeye geç' : 'Özel klavyeye geç';
      
      keyboardModeToggle.style.position = 'fixed';
      keyboardModeToggle.style.top = '20px';
      keyboardModeToggle.style.right = '20px';
      keyboardModeToggle.style.zIndex = '1001';
      keyboardModeToggle.style.padding = '8px 12px';
      keyboardModeToggle.style.backgroundColor = 'rgba(40, 40, 70, 0.8)';
      keyboardModeToggle.style.color = 'white';
      keyboardModeToggle.style.border = 'none';
      keyboardModeToggle.style.borderRadius = '50%';
      keyboardModeToggle.style.width = '40px';
      keyboardModeToggle.style.height = '40px';
      keyboardModeToggle.style.display = 'flex';
      keyboardModeToggle.style.alignItems = 'center';
      keyboardModeToggle.style.justifyContent = 'center';
      keyboardModeToggle.style.cursor = 'pointer';
      keyboardModeToggle.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      
      keyboardModeToggle.addEventListener('click', function() {
        toggleKeyboardMode();
      });
      
      document.body.appendChild(keyboardModeToggle);
    }
  }
  
  // Klavye modunu değiştir
  function toggleKeyboardMode() {
    if (gameState.keyboardMode === 'custom') {
      gameState.keyboardMode = 'native';
      hideCustomKeyboard();
      keyboardModeToggle.title = 'Özel klavyeye geç';
      keyboardModeToggle.innerHTML = '<i class="fas fa-th-large"></i>';
      createMobileInput();
      focusMobileInput(); // Otomatik olarak mobil klavyeyi aç
      showMessage('Mobil klavye moduna geçildi', 'info');
    } else {
      gameState.keyboardMode = 'custom';
      if (mobileInput) mobileInput.blur();
      showCustomKeyboard();
      keyboardModeToggle.title = 'Mobil klavyeye geç';
      keyboardModeToggle.innerHTML = '<i class="fas fa-keyboard"></i>';
      showMessage('Özel klavye moduna geçildi', 'info');
    }
  }

  // Özel klavye oluştur
  function createCustomKeyboard() {
    if (customKeyboard) return;
    
    // Kök element oluştur
    customKeyboard = document.createElement('div');
    customKeyboard.className = 'custom-keyboard';
    customKeyboard.style.position = 'fixed';
    customKeyboard.style.bottom = '0';
    customKeyboard.style.left = '0';
    customKeyboard.style.right = '0';
    customKeyboard.style.backgroundColor = 'rgba(40, 40, 60, 0.95)';
    customKeyboard.style.padding = '5px';
    customKeyboard.style.display = 'none';
    customKeyboard.style.zIndex = '1000';
    customKeyboard.style.boxShadow = '0 -2px 10px rgba(0, 0, 0, 0.5)';
    
    // Klavye satırlarını oluştur
    turkishKeyboard.forEach((row, rowIndex) => {
      const keyboardRow = document.createElement('div');
      keyboardRow.style.display = 'flex';
      keyboardRow.style.justifyContent = 'center';
      keyboardRow.style.margin = '2px 0';
      
      row.forEach(key => {
        const keyButton = document.createElement('button');
        keyButton.className = 'custom-key';
        keyButton.textContent = key;
        keyButton.style.flex = '1';
        keyButton.style.margin = '3px';
        keyButton.style.padding = '12px 5px';
        keyButton.style.backgroundColor = 'rgba(60, 60, 80, 0.9)';
        keyButton.style.color = 'white';
        keyButton.style.border = 'none';
        keyButton.style.borderRadius = '4px';
        keyButton.style.fontWeight = 'bold';
        keyButton.style.minWidth = '30px';
        keyButton.style.cursor = 'pointer';
        
        keyButton.addEventListener('click', function(e) {
          e.preventDefault();
          const now = Date.now();
          if (now - lastTouch < minTouchInterval) return;
          lastTouch = now;
          
          addLetter(key);
          playSound('keypress');
        });
        
        keyboardRow.appendChild(keyButton);
      });
      
      customKeyboard.appendChild(keyboardRow);
    });
    
    // Özel tuşlar ekle (alt satır)
    const specialRow = document.createElement('div');
    specialRow.style.display = 'flex';
    specialRow.style.justifyContent = 'center';
    specialRow.style.margin = '2px 0';
    
    // Silme tuşu
    const deleteKey = document.createElement('button');
    deleteKey.className = 'custom-key special-key';
    deleteKey.innerHTML = '<i class="fas fa-backspace"></i>';
    deleteKey.style.flex = '1.5';
    deleteKey.style.margin = '3px';
    deleteKey.style.padding = '12px 5px';
    deleteKey.style.backgroundColor = 'rgba(80, 60, 60, 0.9)';
    deleteKey.style.color = 'white';
    deleteKey.style.border = 'none';
    deleteKey.style.borderRadius = '4px';
    deleteKey.style.fontWeight = 'bold';
    deleteKey.style.cursor = 'pointer';
    
    deleteKey.addEventListener('click', function(e) {
      e.preventDefault();
      const now = Date.now();
      if (now - lastTouch < minTouchInterval) return;
      lastTouch = now;
      
      deleteLetter();
      playSound('keypress');
    });
    
    // Enter tuşu
    const enterKey = document.createElement('button');
    enterKey.className = 'custom-key special-key';
    enterKey.textContent = 'ENTER';
    enterKey.style.flex = '1.5';
    enterKey.style.margin = '3px';
    enterKey.style.padding = '12px 5px';
    enterKey.style.backgroundColor = 'rgba(60, 80, 60, 0.9)';
    enterKey.style.color = 'white';
    enterKey.style.border = 'none';
    enterKey.style.borderRadius = '4px';
    enterKey.style.fontWeight = 'bold';
    enterKey.style.cursor = 'pointer';
    
    enterKey.addEventListener('click', function(e) {
      e.preventDefault();
      const now = Date.now();
      if (now - lastTouch < minTouchInterval) return;
      lastTouch = now;
      
      submitGuess();
    });
    
    specialRow.appendChild(deleteKey);
    specialRow.appendChild(enterKey);
    customKeyboard.appendChild(specialRow);
    
    // Klavyeyi belgeye ekle
    document.body.appendChild(customKeyboard);
    
    // Klavyeyi göster/gizle için stil ekle
    const style = document.createElement('style');
    style.textContent = `
      body.keyboard-open {
        padding-bottom: 220px;
      }
      
      .custom-keyboard {
        transition: transform 0.3s;
        transform: translateY(0);
      }
      
      .custom-keyboard.hidden {
        transform: translateY(100%);
      }
      
      @media (max-width: 768px) {
        .custom-key {
          font-size: 14px;
          padding: 10px 3px !important;
        }
      }
      
      /* Kareleri tıklanabilir yap */
      .wordle-cell {
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Özel klavyeyi göster
  function showCustomKeyboard() {
    if (!customKeyboard) createCustomKeyboard();
    customKeyboard.style.display = 'block';
    document.body.classList.add('keyboard-open');
    customKeyboardVisible = true;
  }
  
  // Özel klavyeyi gizle
  function hideCustomKeyboard() {
    if (customKeyboard) {
      customKeyboard.style.display = 'none';
      document.body.classList.remove('keyboard-open');
      customKeyboardVisible = false;
    }
  }
  
  // Mobil klavyeyi odakla
  function focusMobileInput() {
    if (mobileInput && gameState.keyboardMode === 'native' && !gameState.isGameOver) {
      setTimeout(() => {
        mobileInput.focus({preventScroll: true});
      }, 50);
    }
  }

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

  // Klavye tuşu basımı (fiziksel klavye ile)
  document.addEventListener('keydown', function(e) {
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
  });
  
  // Wordle kareleri tıklandığında klavye göster
  function handleCellClick() {
    if (!gameState.isGameOver) {
      if (gameState.keyboardMode === 'custom') {
        showCustomKeyboard();
      } else {
        focusMobileInput();
      }
    }
  }
  
  // Ekrana tıklama olayı - grid tıklandığında klavyeyi göster
  wordleGrid.addEventListener('click', handleCellClick);
  
  // Sayfa tıklama olayı - grid dışına tıklandığında özel klavyeyi gizle
  document.addEventListener('click', function(e) {
    if (customKeyboardVisible && !wordleGrid.contains(e.target) && 
        !customKeyboard.contains(e.target) && !hintButton.contains(e.target) &&
        !e.target.closest('.keyboard-toggle-btn')) {
      hideCustomKeyboard();
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
    
    // Ekrandaki orjinal klavyeyi gizle
    if (keyboard) {
      keyboard.style.display = 'none';
    }

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
    gameState.lastInputTime = 0;

    // Skorları güncelle
    updateScoreDisplay();

    // İpucu sayacını güncelle
    hintCount.textContent = gameState.hintsLeft;

    // Grid oluştur
    createWordleGrid();
    
    // Klavye bileşenlerini oluştur
    createCustomKeyboard();
    createMobileInput();
    createKeyboardToggle();
    
    // Klavye moduna göre UI düzenle
    if (gameState.keyboardMode === 'custom') {
      showCustomKeyboard();
    } else {
      focusMobileInput();
    }
    
    // Ses efektlerini sıfırla
    resetSounds();

    // Oyun başlangıç sesi çal
    playSound('keypress');
    
    // Sayfa aşağı kaydıysa grid'i görünür yap
    setTimeout(() => {
      wordleGrid.scrollIntoView({behavior: 'smooth', block: 'center'});
    }, 300);
    
    // Özel klavye tuşlarını güncelle (renkler)
    updateCustomKeyboard();
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
        // Her hücreye tıklama olayı ekle
        cell.addEventListener('click', handleCellClick);
        rowDiv.appendChild(cell);
      }
      
      wordleGrid.appendChild(rowDiv);
    }
  }

  /**
   * Özel klavye tuşlarını günceller (renkler)
   */
  function updateCustomKeyboard() {
    if (!customKeyboard) return;
    
    // Tüm tuşları normal duruma getir
    const allKeys = customKeyboard.querySelectorAll('.custom-key:not(.special-key)');
    allKeys.forEach(key => {
      key.style.backgroundColor = 'rgba(60, 60, 80, 0.9)';
      key.style.color = 'white';
    });
    
    // Doğru harflerin tuşlarını yeşile boyayalım
    gameState.usedLetters.correct.forEach(letter => {
      const key = findKeyElement(letter);
      if (key) {
        key.style.backgroundColor = 'rgba(46, 204, 113, 0.7)';
        key.style.borderColor = 'rgba(46, 204, 113, 0.9)';
      }
    });
    
    // Doğru harf ama yanlış yerde olanları sarıya boyayalım
    gameState.usedLetters.present.forEach(letter => {
      // Eğer harf doğru bir yerde kullanılmışsa, yeşil kalmalı
      if (gameState.usedLetters.correct.has(letter)) return;
      
      const key = findKeyElement(letter);
      if (key) {
        key.style.backgroundColor = 'rgba(241, 196, 15, 0.7)';
        key.style.borderColor = 'rgba(241, 196, 15, 0.9)';
      }
    });
    
    // Kullanılmayan harfleri gri yap
    gameState.usedLetters.absent.forEach(letter => {
      // Eğer harf doğru veya yakın bir yerde kullanılmışsa, rengi değişmesin
      if (gameState.usedLetters.correct.has(letter) || gameState.usedLetters.present.has(letter)) return;
      
      const key = findKeyElement(letter);
      if (key) {
        key.style.backgroundColor = 'rgba(30, 30, 40, 0.9)';
        key.style.color = 'rgba(255, 255, 255, 0.5)';
      }
    });
  }
  
  /**
   * Özel klavyede harf tuşunu bulur
   */
  function findKeyElement(letter) {
    if (!customKeyboard) return null;
    const keys = customKeyboard.querySelectorAll('.custom-key:not(.special-key)');
    return Array.from(keys).find(key => key.textContent === letter);
  }

  /**
   * Harf ekleme - çift işlemi önleme kontrolü
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
    }
  }

  /**
   * Harf silme - çift işlemi önleme kontrolü
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
    
    // Tahmin sonuçlarını kontrol et
    const result = checkGuess(guess);
    
    // Sonuçları görsel olarak göster
    animateResults(result);
    
    // Klavyeyi güncelle
    updateCustomKeyboard();
    
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
    
    // Tahmin sonrası klavyeyi yeniden aç (mobil klavye için)
    if (gameState.keyboardMode === 'native' && !gameState.isGameOver) {
      setTimeout(() => {
        focusMobileInput();
      }, 1600); // Animasyonlardan sonra
    }
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
        if (cell) {
          cell.textContent = gameState.guesses[row][col];
          
          if (gameState.guesses[row][col]) {
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
    if (scoreDisplay) scoreDisplay.textContent = gameState.score;
    if (streakDisplay) streakDisplay.textContent = gameState.streak;
    if (guessesDisplay) guessesDisplay.textContent = `${gameState.currentRow}/6`;
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
    }
    
    // İpucu sesini çal
    playSound('hint');
    
    // Kullanıcıya bilgi mesajı göster
    showMessage('İpucu verildi!', 'info');
  }

  /**
   * Oyunu sonlandırır
   */
  function endGame(isWin) {
    gameState.isGameOver = true;
    
    // Klavyeleri gizle
    if (gameState.keyboardMode === 'custom') {
      hideCustomKeyboard();
    } else if (mobileInput) {
      mobileInput.blur();
    }
    
    // Klavye geçiş butonunu gizle
    if (keyboardModeToggle) {
      keyboardModeToggle.style.display = 'none';
    }
    
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
    }
    
    // Sonuç ekranını hazırla
    finalScore.textContent = gameState.score;
    attemptsCount.textContent = `${gameState.currentRow}/6`;
    finalStreak.textContent = gameState.streak;
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
   * Skoru kaydeder
   */
  function saveScore() {
    // Kullanıcı oturumu açıksa skoru kaydet
    if (window.saveGameScore) {
      window.saveGameScore('wordle', gameState.score);
    } else {
      // Lokalde kaydetme
      const savedScores = JSON.parse(localStorage.getItem('wordleScores') || '[]');
      savedScores.push({
        score: gameState.score,
        date: new Date().toISOString()
      });
      localStorage.setItem('wordleScores', JSON.stringify(savedScores));
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
  
  // CSS stil ekle - sayfada kayma sorununu düzeltmek için
  const style = document.createElement('style');
  style.textContent = `
    .game-container {
      margin-bottom: 60px;
    }
    
    .keyboard-toggle-btn {
      transition: all 0.3s;
    }
    
    .keyboard-toggle-btn:hover {
      transform: scale(1.1);
      background-color: rgba(70, 70, 100, 0.9) !important;
    }
    
    @media (max-width: 768px) {
      body {
        padding-bottom: 0;
        position: relative;
        min-height: 100vh;
      }
      
      body.keyboard-open {
        padding-bottom: 220px;
        min-height: calc(100vh - 220px);
      }
      
      .game-stats-container {
        position: sticky;
        top: 0;
        background-color: var(--bg-color);
        z-index: 2;
        padding: 10px 0;
      }
      
      .wordle-grid {
        margin-top: 20px;
        margin-bottom: 70px;
      }
      
      /* Wordle hücreleri için stil düzenlemesi */
      .wordle-cell {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        cursor: pointer !important;
        transition: transform 0.1s;
      }
      
      .wordle-cell:active {
        transform: scale(0.95);
      }
    }
  `;
  document.head.appendChild(style);
  
  // Sayfa yüklendiğinde oyunu başlat
  startGame();
  
  // Sayfa başlangıçta aktif klavye moduna göre mobil klavye veya özel klavye göster
  if (gameState.keyboardMode === 'native') {
    // Mobil klavye modunda ise bir miktar gecikme ile mobil klavyeyi aç
    setTimeout(() => {
      focusMobileInput();
    }, 1000);
  }
});
