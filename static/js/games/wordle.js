document.addEventListener('DOMContentLoaded', () => {
  // Sabitleri tanımla
  const WORD_LENGTH = 5;
  const MAX_ATTEMPTS = 6;

  // DOM elementlerini seç
  const gameBoard = document.getElementById('game-board');
  const submitButton = document.getElementById('submit-button');
  const messageElement = document.getElementById('message');
  const messageContainer = document.getElementById('message-container');
  const helpButton = document.getElementById('help-button');
  const helpModal = document.getElementById('help-modal');
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.style.display = 'block';
  const gameOverModal = document.getElementById('game-over-modal');
  const gameOverTitle = document.getElementById('game-over-title');
  const gameOverMessage = document.getElementById('game-over-message');
  const playAgainButton = document.getElementById('play-again-button');
  const trButton = document.getElementById('tr-button');
  const enButton = document.getElementById('en-button');
  // stats modal artık kullanılmadığı için kaldırıldı
  
  // Oyun ayarları objesi
  const gameState = {
    soundEnabled: true, // Ses açık varsayılan
    keyboardOpen: false // Klavye kapalı varsayılan
  };

  // Modaller için kapatma düğmelerini seç
  const closeButtons = document.querySelectorAll('.close-button');

  // Oyun durumu
  let currentAttempt = 0;
  let currentTile = 0;
  let targetWord = '';
  let gameActive = true;
  let language = 'tr'; // Varsayılan dil Türkçe
  let selectedTile = null;

  // Türkçe ve İngilizce kelimeler (gerçek bir uygulamada daha kapsamlı bir kelime listesi kullanılır)
  const trWords = ['araba', 'kalem', 'kitap', 'meyve', 'deniz', 'güneş', 'çiçek', 'müzik', 'çocuk', 'sevgi',
                   'yaşam', 'mutlu', 'doğum', 'şeker', 'balık', 'köpek', 'kedi', 'kuş', 'masa', 'sandalye',
                   'kapı', 'pencere', 'bahçe', 'sanat', 'spor', 'okul', 'sınav', 'defter', 'kalem', 'bilgi',
                   'demir', 'insan', 'hayat', 'ölüm', 'dünya', 'ayna', 'evren', 'yıldız', 'gökyüzü', 'dağ'];

  const enWords = ['apple', 'beach', 'chair', 'dance', 'eagle', 'flame', 'ghost', 'horse', 'image', 'juice',
                   'knife', 'lemon', 'mouse', 'night', 'ocean', 'piano', 'queen', 'river', 'sugar', 'tiger',
                   'umbra', 'voice', 'water', 'xylyl', 'yacht', 'zebra', 'bloom', 'cloud', 'dream', 'earth',
                   'frost', 'grape', 'house', 'ivory', 'jewel', 'kiosk', 'light', 'music', 'north', 'onion'];

  // İstatistikler
  let stats = loadStats();

  // Sayfa yüklendiğinde oyun tahtasını oluştur
  createGameBoard();

  // Yeni oyunu başlat
  startNewGame();

  // Event listener: Klavye tuşu algılama
  document.addEventListener('keydown', handleKeyPress);

  // Tahmin butonuna tıklama
  submitButton.addEventListener('click', handleSubmit);

  helpButton.addEventListener('click', () => {
    helpModal.classList.remove('hidden');
  });

  // İstatistik butonu kaldırıldı

  themeToggle.addEventListener('click', toggleTheme);

  playAgainButton.addEventListener('click', () => {
    gameOverModal.classList.add('hidden');
    startNewGame();
  });

  // Dil düğmeleri
  trButton.addEventListener('click', () => {
    if (language !== 'tr') {
      language = 'tr';
      trButton.classList.add('active');
      enButton.classList.remove('active');
      startNewGame();
    }
  });

  enButton.addEventListener('click', () => {
    if (language !== 'en') {
      language = 'en';
      enButton.classList.add('active');
      trButton.classList.remove('active');
      startNewGame();
    }
  });

  // Modal kapatma düğmeleri
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      helpModal.classList.add('hidden');
      gameOverModal.classList.add('hidden');
    });
  });

  // Click dışında modal kapatma
  window.addEventListener('click', (e) => {
    if (e.target === helpModal) {
      helpModal.classList.add('hidden');
    }
    if (e.target === gameOverModal) {
      gameOverModal.classList.add('hidden');
    }
  });

  // Klavye tuşu algılama
  function handleKeyPress(e) {
    if (!gameActive) return;

    if (selectedTile) {
      if (e.key === 'Backspace') {
        deleteLetter();
      } else if (e.key === 'Enter') {
        handleSubmit();
      } else if (isValidLetter(e.key)) {
        addLetter(e.key.toUpperCase());
      }
    }
  }

  // Harf ekleme
  function addLetter(letter) {
    if (!selectedTile || !gameActive) return;

    const row = parseInt(selectedTile.dataset.row);
    const col = parseInt(selectedTile.dataset.col);

    // Türkçe karakterlerin doğru şekilde işlenmesini sağla
    letter = letter.toUpperCase();

    // Seçilen kareye harfi yerleştir
    selectedTile.textContent = letter;
    selectedTile.classList.add('filled');

    // Manuel olarak sonraki kareye geçmeyi geciktir (otomatik klonlamayı önler)
    setTimeout(() => {
      // Sonraki kareye geç (varsa)
      if (col < WORD_LENGTH - 1) {
        selectTile(row, col + 1);
      }
    }, 50);
  }

  // Harf silme
  function deleteLetter() {
    if (!selectedTile || !gameActive) return;

    const row = parseInt(selectedTile.dataset.row);
    const col = parseInt(selectedTile.dataset.col);

    // Eğer seçili karede içerik varsa, onu sil
    if (selectedTile.textContent) {
      selectedTile.textContent = '';
      selectedTile.classList.remove('filled');
      return;
    }

    // Seçili kare boşsa ve ilk kare değilse, bir önceki kareye git ve onu seç
    if (!selectedTile.textContent && col > 0) {
      selectTile(row, col - 1);
      // Önceki kareyi seçtikten sonra, direkt olarak silme yapma
      // Sadece seçme işlemi yap, bir sonraki silme tuşu ile silinecek
    }
  }

  // Karakter geçerliliği kontrolü
  function isValidLetter(key) {
    if (language === 'tr') {
      // Tüm Türkçe karakterleri kabul et
      return /^[a-zA-ZçÇğĞıİöÖşŞüÜ]$/.test(key);
    } else {
      return /^[a-zA-Z]$/.test(key);
    }
  }

  // Kare seçme fonksiyonu
  function selectTile(row, col) {
    // Önceki seçili kareyi temizle
    if (selectedTile) {
      selectedTile.classList.remove('selected');
    }

    // Yeni kareyi seç
    selectedTile = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
    if (selectedTile) {
      selectedTile.classList.add('selected');

      // Mobil klavye için input alanına odaklan
      focusMobileInput();
    }
  }

  // Mobil klavyeyi göstermek için gizli input oluşturma ve odaklama
  function focusMobileInput() {
    try {
      // Mevcut input varsa bul, yoksa oluştur
      let mobileInput = document.getElementById('mobile-keyboard-input');
      if (!mobileInput) {
        // Gizli input oluştur
        mobileInput = document.createElement('input');
        mobileInput.id = 'mobile-keyboard-input';
        mobileInput.type = 'text';
        mobileInput.maxLength = 1; // Tek bir harf için
        mobileInput.autocomplete = 'off';
        mobileInput.autocapitalize = 'none'; // Otomatik büyük harf kullanımını kapat
        mobileInput.spellcheck = false;
        mobileInput.style.position = 'fixed';
        mobileInput.style.opacity = '0';
        mobileInput.style.height = '0';
        mobileInput.style.width = '0';
        mobileInput.style.pointerEvents = 'none';
        mobileInput.style.touchAction = 'none';
        mobileInput.style.zIndex = '-1';

        // Yeni, daha sağlam mobil girdi sistemi
        let lastKey = '';
        let lastInputTime = 0;
        let inputProcessing = false;
        let inputDebounceTimer = null;

        mobileInput.addEventListener('input', (e) => {
          // Debounce ile çift girişleri önle
          clearTimeout(inputDebounceTimer);
          
          // Eğer işlem devam ediyorsa çık
          if (inputProcessing) {
            e.target.value = '';
            return;
          }

          // İşlem başladı
          inputProcessing = true;

          // İki girdi arasında daha uzun bir zaman aralığı uygula
          const now = Date.now();
          if (now - lastInputTime < 100) {
            // Aynı tuşa hızlı basılırsa engelle
            e.target.value = '';
            inputProcessing = false;
            return;
          }

          // Girdiyi al
          const inputValue = e.target.value;

          // Girdiyi hemen temizle
          e.target.value = '';

          // Sadece tek bir geçerli karakter işle
          if (inputValue && inputValue.length > 0) {
            const char = inputValue.charAt(0);

            // Karakter geçerliyse ekle
            if (isValidLetter(char)) {
              addLetter(char.toUpperCase());
            }
          }

          // Son işlem zamanını güncelle
          lastInputTime = now;

          // İşlem tamamlandı (gecikmeli)
          inputDebounceTimer = setTimeout(() => {
            inputProcessing = false;
          }, 150);
        });

        // Silme ve enter tuşları için güvenli kontrol
        let lastKeyTime = 0;
        let keyProcessing = false;

        mobileInput.addEventListener('keydown', (e) => {
          const now = Date.now();
          
          // Hızlı tuş basımlarını engelle
          if (now - lastKeyTime < 200 || keyProcessing) {
            e.preventDefault();
            return;
          }
          
          keyProcessing = true;
          lastKeyTime = now;
          
          if (e.key === 'Backspace') {
            e.preventDefault();
            deleteLetter();
          } else if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
          
          // Kısa bir gecikme ile işlem kilidini kaldır
          setTimeout(() => {
            keyProcessing = false;
          }, 100);
        });

        document.body.appendChild(mobileInput);
      }

      // Input'a odaklan ve sayfa kaydırmayı engelle
      const scrollPosition = window.scrollY;
      setTimeout(() => {
        mobileInput.focus();
        window.scrollTo(0, scrollPosition);
      }, 50);
      
    } catch (error) {
      console.error("Mobil klavye aktivasyonu hatası:", error);
    }
  }

  // Tema geçişi için fonksiyon
  function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('dark-theme')) {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
    } else {
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
    }
  }

  // Kullanıcı arabirimini güncellemek için fonksiyon
  function updateUI() {
    // İstatistikleri göster
    const guessesDisplay = document.getElementById('guesses-display');
    if (guessesDisplay) {
      guessesDisplay.textContent = `${currentAttempt}/${MAX_ATTEMPTS}`;
    }
  }

  // Oyun tahtasını oluşturma fonksiyonu
  function createGameBoard() {
    gameBoard.innerHTML = '';

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const row = document.createElement('div');
      row.classList.add('row');

      for (let j = 0; j < WORD_LENGTH; j++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.dataset.row = i;
        tile.dataset.col = j;

        // Kareye tıklandığında kare seçme işlemi
        tile.addEventListener('click', () => {
          if (i === currentAttempt && gameActive) {
            selectTile(i, j);
          }
        });

        row.appendChild(tile);
      }

      gameBoard.appendChild(row);
    }

    // İlk kareyi seç
    selectTile(0, 0);
  }

  // Yeni oyun başlatma fonksiyonu
  function startNewGame() {
    // Oyun tahtasını sıfırla
    const allTiles = document.querySelectorAll('.tile');
    allTiles.forEach(tile => {
      tile.textContent = '';
      tile.className = 'tile';
    });

    // Oyun durumunu sıfırla
    currentAttempt = 0;
    currentTile = 0;
    gameActive = true;

    // Hedef kelimeyi seç
    const wordList = language === 'tr' ? trWords : enWords;
    targetWord = wordList[Math.floor(Math.random() * wordList.length)].toUpperCase();

    // Debug için konsola yazma (gerçek uygulamada kaldırılabilir)
    console.log('Hedef kelime:', targetWord);

    // İlk kareyi seç
    selectTile(0, 0);
  }

  // Tahmin işleme fonksiyonu
  function handleSubmit() {
    if (!gameActive) return;

    // Mevcut satırdaki tüm kareleri al
    const tiles = document.querySelectorAll(`.tile[data-row="${currentAttempt}"]`);
    let guess = '';

    // Harf sayısını kontrol et
    let allFilled = true;
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (!tiles[i].textContent) {
        allFilled = false;
        break;
      }
      guess += tiles[i].textContent;
    }

    if (!allFilled) {
      showMessage(`Lütfen ${WORD_LENGTH} harfli kelimeyi tamamlayın`);
      return;
    }

    // Kelimeyi değerlendir ve renkleri ayarla
    evaluateGuess(guess);

    // Kazanma kontrolü
    if (guess === targetWord) {
      gameActive = false;
      showMessage('Tebrikler! Doğru tahmin ettiniz!', 3000);

      setTimeout(() => {
        // İstatistikleri güncelle
        updateStatsForWin();
        updateStatsDisplay(); 

        // Oyun sonu modalını göster
        gameOverTitle.textContent = 'Kazandınız!';
        gameOverMessage.textContent = `Hedef kelime ${targetWord} idi. ${currentAttempt + 1} denemede buldunuz!`;
        gameOverModal.classList.remove('hidden');
      }, 1500);

      return;
    }

    // Deneme sayısını artır
    currentAttempt++;

    // Kaybetme kontrolü
    if (currentAttempt >= MAX_ATTEMPTS) {
      gameActive = false;
      showMessage(`Üzgünüm! Doğru kelime: ${targetWord}`, 3000);

      setTimeout(() => {
        // İstatistikleri güncelle
        updateStatsForLoss();
        updateStatsDisplay(); 

        // Oyun sonu modalını göster
        gameOverTitle.textContent = 'Kaybettiniz!';
        gameOverMessage.textContent = `Hedef kelime ${targetWord} idi. Tekrar deneyin!`;
        gameOverModal.classList.remove('hidden');
      }, 1500);
    } else {
      // Yeni satırın ilk karesini seç
      selectTile(currentAttempt, 0);
    }
  }

  // Tahmini değerlendirme
  function evaluateGuess(guess) {
    const tiles = document.querySelectorAll(`.tile[data-row="${currentAttempt}"]`);

    // Her harfi değerlendir ve animasyon ekle
    for (let i = 0; i < WORD_LENGTH; i++) {
      const tile = tiles[i];
      const letter = guess[i];

      // Animasyon için popla (kısa bir zaman farkı ile)
      setTimeout(() => {
        tile.classList.add('pop');
      }, i * 50);

      // Pop animasyonunu kaldır
      setTimeout(() => {
        tile.classList.remove('pop');
        // Flip animasyonu ile renklendirme
        setTimeout(() => {
          tile.classList.add('flip');

          // Renklendirme mantığı
          if (letter === targetWord[i]) {
            tile.classList.add('correct');
          } else if (targetWord.includes(letter)) {
            tile.classList.add('present');
          } else {
            tile.classList.add('absent');
          }

          // Son kare değerlendirildikten sonra arayüzü güncelle
          if (i === WORD_LENGTH - 1) {
            setTimeout(() => {
              // Kullanıcı arayüzünü güncelle
              updateUI();
            }, 100);
          }
        }, 250);
      }, 250 + i * 50);
    }
  }

  // Ses çalma fonksiyonu
  function playSound(soundName) {
    // Eğer ses devre dışı bırakıldıysa çalmayı atla
    if (!gameState.soundEnabled) {
      return;
    }
    
    try {
      // Ses çalma başarısız olursa sessizce devam et
      const sound = new Audio(`/static/sounds/${soundName}.mp3`);
      sound.volume = 0.5;
      
      // Ses dosyası önce yüklesin
      sound.addEventListener('canplaythrough', () => {
        try {
          const playPromise = sound.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              // Kullanıcı etkileşimi olmadan ses çalınamıyor olabilir, hatayı sessizce geç
              console.log("Ses çalma hatası:", error);
            });
          }
        } catch (e) {
          console.log("Ses çalma hatası:", e);
        }
      });
      
      // Ses dosyası yüklenemezse
      sound.addEventListener('error', () => {
        console.log(`${soundName} ses dosyası yüklenemedi`);
      });
      
    } catch (error) {
      // Ses çalma hatası sessizce işlenir
      console.log("Ses çalma hatası:", error);
    }
  }

  // Mesaj gösterme fonksiyonu
  function showMessage(text, duration = 2000) {
    if (!messageElement) return;
    
    messageElement.textContent = text;
    messageElement.classList.remove('hidden');

    if (messageElement.timeoutId) {
      clearTimeout(messageElement.timeoutId);
    }
    
    messageElement.timeoutId = setTimeout(() => {
      messageElement.classList.add('hidden');
    }, duration);
  }

  // Tema değiştirme fonksiyonu
  function toggleTheme() {
    if (document.body.classList.contains('dark-theme')) {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
      themeToggle.textContent = '🌙';
    } else {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
      themeToggle.textContent = '☀️';
    }
  }

  // İstatistikleri yükleme
  function loadStats() {
    const savedStats = localStorage.getItem('wordleStats');
    if (savedStats) {
      return JSON.parse(savedStats);
    }
    // Varsayılan istatistikler
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: Array(MAX_ATTEMPTS).fill(0)
    };
  }

  // İstatistikleri kaydetme
  function saveStats() {
    localStorage.setItem('wordleStats', JSON.stringify(stats));
  }

  // Kazanma durumunda istatistikleri güncelleme
  function updateStatsForWin() {
    stats.gamesPlayed++;
    stats.gamesWon++;
    stats.currentStreak++;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.guessDistribution[currentAttempt]++;
    saveStats();
  }

  // Kaybetme durumunda istatistikleri güncelleme
  function updateStatsForLoss() {
    stats.gamesPlayed++;
    stats.currentStreak = 0;
    saveStats();
  }

  // İstatistik görüntüleme güncellemesi
  function updateStatsDisplay() {
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    document.getElementById('win-percentage').textContent = stats.gamesPlayed > 0 
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
      : 0;
    document.getElementById('current-streak').textContent = stats.currentStreak;
    document.getElementById('max-streak').textContent = stats.maxStreak;

    // Tahmin dağılımını göster
    const guessDistribution = document.getElementById('guess-distribution');
    guessDistribution.innerHTML = '';

    // En yüksek tahmin sayısını bul
    const maxGuesses = Math.max(...stats.guessDistribution);

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const guessCount = stats.guessDistribution[i];
      const percentage = maxGuesses > 0 ? Math.round((guessCount / maxGuesses) * 100) : 0;

      const guessBar = document.createElement('div');
      guessBar.classList.add('guess-bar');

      const guessLabel = document.createElement('div');
      guessLabel.classList.add('guess-label');
      guessLabel.textContent = i + 1;

      const guessCountElement = document.createElement('div');
      guessCountElement.classList.add('guess-count');
      guessCountElement.style.width = `${Math.max(percentage, 5)}%`;
      guessCountElement.textContent = guessCount;

      // Eğer bu günün tahmini ise vurgula
      if (gameActive === false && currentAttempt === i) {
        let currentGuess = '';
        const tiles = document.querySelectorAll(`.tile[data-row="${i}"]`);
        for (let j = 0; j < WORD_LENGTH; j++) {
          currentGuess += tiles[j].textContent;
        }

        if (currentGuess === targetWord) {
          guessCountElement.classList.add('current');
        }
      }

      guessBar.appendChild(guessLabel);
      guessBar.appendChild(guessCountElement);
      guessDistribution.appendChild(guessBar);
    }
  }
});