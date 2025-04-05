/**
 * Wordle Premium Sürüm
 * Profesyonel ve modern kullanıcı deneyimi ile 5 harfli kelimeyi 6 denemede tahmin edin
 * Versiyon: 2.1
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const guessGrid = document.getElementById('guess-grid');
  const keyboard = document.getElementById('keyboard');
  const messageDisplay = document.getElementById('message-display');
  const newGameBtn = document.getElementById('new-game-btn');
  const shareResultBtn = document.getElementById('share-result-btn');
  const modalOverlay = document.querySelector('.wordle-modal-overlay');
  
  // Modal elementleri
  const helpBtn = document.getElementById('help-btn');
  const statsBtn = document.getElementById('stats-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const helpModal = document.getElementById('help-modal');
  const statsModal = document.getElementById('stats-modal');
  const settingsModal = document.getElementById('settings-modal');
  const gameEndModal = document.getElementById('game-end-modal');
  const newGameModalBtn = document.getElementById('new-game-modal-btn');
  const shareBtn = document.getElementById('share-btn');
  const gameEndMessage = document.getElementById('game-end-message');
  const endGameTitle = document.getElementById('end-game-title');
  const resultGrid = document.getElementById('result-grid');
  const nextGameTimer = document.getElementById('next-game-timer');
  const guessDistribution = document.getElementById('guess-distribution');
  const closeButtons = document.querySelectorAll('.wordle-modal-close');
  
  // İstatistik elementleri
  const gamesPlayedEl = document.getElementById('games-played');
  const gamesWonEl = document.getElementById('games-won');
  const winPercentageEl = document.getElementById('win-percentage');
  const currentStreakEl = document.getElementById('current-streak');
  const maxStreakEl = document.getElementById('max-streak');
  
  // Oyun Değişkenleri
  const WORD_LENGTH = 5;
  const MAX_GUESSES = 6;
  const FLIP_ANIMATION_DURATION = 650;
  const DANCE_ANIMATION_DURATION = 500;
  
  let targetWord = '';
  let guessedWords = [];
  let currentGuess = [];
  let isGuessing = true;
  let currentRow = 0;
  let animationRunning = false;
  let isHardMode = false;
  let isDarkTheme = true;
  let requiredLetters = {};
  let countdownInterval = null;
  
  // Ses efektleri
  const clickSound = new Audio('/static/sounds/click.mp3');
  const correctSound = new Audio('/static/sounds/correct.mp3');
  const wrongSound = new Audio('/static/sounds/wrong.mp3');
  const gameCompleteSound = new Audio('/static/sounds/game-complete.mp3');
  
  // İstatistikler
  let gameStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
    lastPlayed: null,
    lastCompleted: null,
    dailyWordDate: null,
    dailyWord: null
  };
  
  // Oyunu başlat
  initializeGame();
  
  /**
   * Oyunu başlatan fonksiyon
   */
  function initializeGame() {
    try {
      // Yerel depolamadan istatistikleri, ayarları ve oyun durumunu yükle
      loadGameData();
      
      // Tema ayarı
      applyTheme();
      
      // Tahta oluştur
      createGameBoard();
      
      // Rastgele kelime seç
      selectTargetWord();
      
      // Olay dinleyicilerini ekle
      setupEventListeners();
      
      // Geri süresi kontrolü (Günde bir kelime özelliği için)
      checkDailyWordStatus();
    } catch (error) {
      console.error("Oyun başlatılırken hata oluştu:", error);
      showMessage("Oyun yüklenirken bir hata oluştu, sayfayı yenileyin.", "error");
    }
  }
  
  /**
   * Yerel depolamadan verileri yükler
   */
  function loadGameData() {
    try {
      // İstatistikleri yükle
      const storedStats = localStorage.getItem('wordleStats');
      if (storedStats) {
        gameStats = JSON.parse(storedStats);
        // Eksik alanlar varsa varsayılan değerleri ekle
        if (!gameStats.guessDistribution) {
          gameStats.guessDistribution = [0, 0, 0, 0, 0, 0];
        }
        if (!gameStats.maxStreak) {
          gameStats.maxStreak = gameStats.currentStreak || 0;
        }
        if (!gameStats.dailyWordDate) {
          gameStats.dailyWordDate = null;
        }
        if (!gameStats.dailyWord) {
          gameStats.dailyWord = null;
        }
      }
      updateStatsDisplay();
      
      // Tema ayarı
      const storedTheme = localStorage.getItem('wordleTheme');
      if (storedTheme) {
        isDarkTheme = storedTheme === 'dark';
      } else {
        // Sistem ayarına göre tema belirleme
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        isDarkTheme = prefersDarkMode;
        localStorage.setItem('wordleTheme', isDarkTheme ? 'dark' : 'light');
      }
      
      // Zorluk seviyesi
      const storedDifficulty = localStorage.getItem('wordleDifficulty');
      if (storedDifficulty) {
        isHardMode = storedDifficulty === 'hard';
      }
      
      // Zorluk ve tema seçimlerini radio buttons'da güncelle
      const difficultyInput = document.querySelector(`input[name="difficulty"][value="${isHardMode ? 'hard' : 'normal'}"]`);
      if (difficultyInput) difficultyInput.checked = true;
      
      const themeInput = document.querySelector(`input[name="theme"][value="${isDarkTheme ? 'dark' : 'light'}"]`);
      if (themeInput) themeInput.checked = true;
      
    } catch (error) {
      console.error("Veri yüklenirken hata oluştu:", error);
      // Hata durumunda varsayılan değerleri kullan
      gameStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        guessDistribution: [0, 0, 0, 0, 0, 0],
        lastPlayed: null,
        lastCompleted: null,
        dailyWordDate: null,
        dailyWord: null
      };
    }
  }
  
  /**
   * Tema ayarını uygular
   */
  function applyTheme() {
    try {
      if (isDarkTheme) {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        document.documentElement.style.setProperty('--wordle-background', 'var(--wordle-background)');
        document.documentElement.style.setProperty('--wordle-surface', 'var(--wordle-surface)');
        document.documentElement.style.setProperty('--wordle-border', 'var(--wordle-border)');
        document.documentElement.style.setProperty('--wordle-text-primary', 'var(--wordle-text-primary)');
        document.documentElement.style.setProperty('--wordle-text-secondary', 'var(--wordle-text-secondary)');
        document.documentElement.style.setProperty('--wordle-key', 'var(--wordle-key)');
        document.documentElement.style.setProperty('--wordle-key-text', 'var(--wordle-key-text)');
      } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
        document.documentElement.style.setProperty('--wordle-background', 'var(--wordle-light-background)');
        document.documentElement.style.setProperty('--wordle-surface', 'var(--wordle-light-surface)');
        document.documentElement.style.setProperty('--wordle-border', 'var(--wordle-light-border)');
        document.documentElement.style.setProperty('--wordle-text-primary', 'var(--wordle-light-text-primary)');
        document.documentElement.style.setProperty('--wordle-text-secondary', 'var(--wordle-light-text-secondary)');
        document.documentElement.style.setProperty('--wordle-key', 'var(--wordle-light-key)');
        document.documentElement.style.setProperty('--wordle-key-text', 'var(--wordle-light-key-text)');
      }
    } catch (error) {
      console.error("Tema uygulanırken hata oluştu:", error);
    }
  }
  
  /**
   * Oyun istatistiklerini günceller ve yerel depolamaya kaydeder
   */
  function saveStats() {
    try {
      gameStats.lastPlayed = new Date().toISOString();
      localStorage.setItem('wordleStats', JSON.stringify(gameStats));
      updateStatsDisplay();
    } catch (error) {
      console.error("İstatistikler kaydedilirken hata oluştu:", error);
      showMessage("İstatistikler kaydedilemedi", "error");
    }
  }
  
  /**
   * İstatistik görüntüsünü günceller
   */
  function updateStatsDisplay() {
    try {
      if (!gamesPlayedEl || !gamesWonEl || !winPercentageEl || !currentStreakEl || !maxStreakEl) return;
      
      gamesPlayedEl.textContent = gameStats.gamesPlayed;
      gamesWonEl.textContent = gameStats.gamesWon;
      
      const winPercentage = gameStats.gamesPlayed > 0 
        ? Math.round((gameStats.gamesWon / gameStats.gamesPlayed) * 100) 
        : 0;
      
      winPercentageEl.textContent = `${winPercentage}%`;
      currentStreakEl.textContent = gameStats.currentStreak;
      maxStreakEl.textContent = gameStats.maxStreak;
      
      // Tahmin dağılımını güncelle
      updateGuessDistribution();
    } catch (error) {
      console.error("İstatistik görüntüsü güncellenirken hata oluştu:", error);
    }
  }
  
  /**
   * Tahmin dağılımı grafik görüntüsünü günceller
   */
  function updateGuessDistribution() {
    try {
      if (!guessDistribution) return;
      
      guessDistribution.innerHTML = '';
      
      // En yüksek değeri bul (yatay bar'ları ölçeklendirmek için)
      const maxValue = Math.max(...gameStats.guessDistribution, 1);
      
      // Her satır için bir bar oluştur
      for (let i = 0; i < MAX_GUESSES; i++) {
        const guessRow = document.createElement('div');
        guessRow.className = 'guess-row';
        
        const guessLabel = document.createElement('div');
        guessLabel.className = 'guess-label';
        guessLabel.textContent = i + 1;
        
        const barContainer = document.createElement('div');
        barContainer.className = 'guess-bar-container';
        
        const bar = document.createElement('div');
        bar.className = 'guess-bar';
        
        // Eğer bu tahminde kazanıldıysa özel sınıf ekle
        if (currentRow === i && isGuessing === false) {
          bar.classList.add('current');
        }
        
        // Bar genişliğini ayarla (maksimum %90)
        const percentage = (gameStats.guessDistribution[i] / maxValue) * 90;
        bar.style.width = `${percentage > 0 ? Math.max(percentage, 10) : 0}%`;
        
        // Bar'ın içine değeri göster
        bar.textContent = gameStats.guessDistribution[i];
        
        barContainer.appendChild(bar);
        guessRow.appendChild(guessLabel);
        guessRow.appendChild(barContainer);
        guessDistribution.appendChild(guessRow);
      }
    } catch (error) {
      console.error("Tahmin dağılımı güncellenirken hata oluştu:", error);
    }
  }
  
  /**
   * Hedef kelimeyi seçer
   * Günde bir kez oynama özelliği için günlük kelime kontrolü yapabilir
   */
  function selectTargetWord() {
    try {
      // Bugünün tarihi
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];
      
      // Önceden kaydedilmiş günlük kelime var mı ve bugünkü mü kontrol et
      if (gameStats.dailyWordDate === todayString && gameStats.dailyWord) {
        targetWord = gameStats.dailyWord.toUpperCase();
      } else {
        // Yeni günlük kelime seç
        targetWord = getRandomWordleWord().toUpperCase();
        
        // Günlük kelimeyi kaydet
        gameStats.dailyWordDate = todayString;
        gameStats.dailyWord = targetWord;
        saveStats();
      }
      
      console.log("Hedef kelime:", targetWord); // Geliştirme için, canlıda kaldırılmalı
    } catch (error) {
      console.error("Hedef kelime seçilirken hata oluştu:", error);
      // Herhangi bir hata durumunda yeni bir kelime seç
      targetWord = getRandomWordleWord().toUpperCase();
    }
  }
  
  /**
   * Günlük kelime özelliği için zaman kontrolü
   */
  function checkDailyWordStatus() {
    try {
      const now = new Date();
      const todayString = now.toISOString().split('T')[0];
      const lastCompleted = gameStats.lastCompleted ? new Date(gameStats.lastCompleted) : null;
      
      // Bugün için oyun tamamlanmış mı kontrol et
      if (lastCompleted) {
        const lastCompletedString = lastCompleted.toISOString().split('T')[0];
        
        // Bugün için oyun tamamlanmışsa
        if (lastCompletedString === todayString && gameStats.dailyWordDate === todayString) {
          isGuessing = false;
          showMessage('Bugünün kelimesini zaten buldunuz!', 'info', 3000);
          
          // Yarına kalan süreyi hesapla ve geri sayım başlat
          const remainingTime = getTimeUntilTomorrow();
          startCountdown(remainingTime);
          
          // Tamamlanan oyunu göster
          loadCompletedGame();
        }
      }
    } catch (error) {
      console.error("Günlük kelime durumu kontrol edilirken hata oluştu:", error);
    }
  }
  
  /**
   * Tamamlanan oyunu yükle ve göster
   */
  function loadCompletedGame() {
    try {
      if (!targetWord) return;
      
      // Önceki oynanmış oyunu yükle
      const lastGameState = localStorage.getItem('wordleLastGame');
      if (lastGameState) {
        const gameState = JSON.parse(lastGameState);
        
        // Oyun durumu değişkenlerini ayarla
        guessedWords = gameState.guessedWords || [];
        currentRow = guessedWords.length;
        isGuessing = false;
        
        // Tahmin edilen kelimeleri göster
        for (let i = 0; i < guessedWords.length; i++) {
          const guess = guessedWords[i];
          const result = checkGuessNoAnimation(guess);
          
          // Harfleri göster
          for (let j = 0; j < WORD_LENGTH; j++) {
            const box = getLetterBox(i, j);
            box.textContent = guess[j];
            box.classList.remove('empty');
            box.classList.add(result[j]);
            
            // Klavye durumunu güncelle
            updateKeyboardState(guess[j], result[j]);
          }
        }
        
        // Paylaş butonunu aktif et
        shareResultBtn.disabled = false;
      }
    } catch (error) {
      console.error("Tamamlanan oyun yüklenirken hata oluştu:", error);
    }
  }
  
  /**
   * Son oyun durumunu kaydeder
   */
  function saveLastGameState() {
    try {
      const gameState = {
        targetWord: targetWord,
        guessedWords: guessedWords,
        currentRow: currentRow,
        isGuessing: isGuessing
      };
      
      localStorage.setItem('wordleLastGame', JSON.stringify(gameState));
    } catch (error) {
      console.error("Oyun durumu kaydedilirken hata oluştu:", error);
    }
  }
  
  /**
   * İki tarih aynı günde mi kontrol eder
   */
  function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
  
  /**
   * Yarına kalan süreyi hesaplar
   */
  function getTimeUntilTomorrow() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow - now;
  }
  
  /**
   * Countdown sayacını başlatır
   */
  function startCountdown(duration) {
    try {
      // Önceki interval'ı temizle
      if (countdownInterval) clearInterval(countdownInterval);
      
      const updateTimer = () => {
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);
        
        if (nextGameTimer) {
          nextGameTimer.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        duration -= 1000;
        if (duration < 0) {
          clearInterval(countdownInterval);
          // Yeni gün için sayfayı yenile
          window.location.reload();
        }
      };
      
      // İlk güncellemeyi hemen yap
      updateTimer();
      
      // Intervali başlat
      countdownInterval = setInterval(updateTimer, 1000);
    } catch (error) {
      console.error("Geri sayım başlatılırken hata oluştu:", error);
    }
  }
  
  /**
   * Tüm olay dinleyicilerini ekler
   */
  function setupEventListeners() {
    try {
      // Klavye dinleyicileri
      setupKeyboardListeners();
      
      // Butonlar
      if (newGameBtn) {
        newGameBtn.addEventListener('click', startNewGame);
      }
      
      if (newGameModalBtn) {
        newGameModalBtn.addEventListener('click', () => {
          hideModal(gameEndModal);
          startNewGame();
        });
      }
      
      // Modal butonları
      if (helpBtn) {
        helpBtn.addEventListener('click', () => showModal(helpModal));
      }
      
      if (statsBtn) {
        statsBtn.addEventListener('click', () => showModal(statsModal));
      }
      
      if (settingsBtn) {
        settingsBtn.addEventListener('click', () => showModal(settingsModal));
      }
      
      // Modal kapat butonları
      closeButtons.forEach(button => {
        button.addEventListener('click', () => {
          const modalId = button.getAttribute('data-modal');
          hideModal(document.getElementById(modalId));
        });
      });
      
      // Tema ve zorluk seçeneği değişim dinleyicileri
      document.querySelectorAll('input[name="theme"]').forEach(input => {
        input.addEventListener('change', (e) => {
          isDarkTheme = e.target.value === 'dark';
          localStorage.setItem('wordleTheme', e.target.value);
          applyTheme();
        });
      });
      
      document.querySelectorAll('input[name="difficulty"]').forEach(input => {
        input.addEventListener('change', (e) => {
          isHardMode = e.target.value === 'hard';
          localStorage.setItem('wordleDifficulty', e.target.value);
        });
      });
      
      // Overlay'a tıklayınca modalları kapat
      if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
          document.querySelectorAll('.wordle-modal.active').forEach(modal => {
            hideModal(modal);
          });
        });
      }
      
      // Paylaş butonları
      if (shareBtn) {
        shareBtn.addEventListener('click', shareResult);
      }
      
      if (shareResultBtn) {
        shareResultBtn.addEventListener('click', shareResult);
      }
      
      // Mobil dokunmatik olayları
      document.addEventListener('touchstart', handleTouchStart);
      
      // ESC tuşuna basınca modalları kapatma
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const activeModal = document.querySelector('.wordle-modal.active');
          if (activeModal) {
            hideModal(activeModal);
          }
        }
      });
    } catch (error) {
      console.error("Olay dinleyicileri eklenirken hata oluştu:", error);
    }
  }
  
  /**
   * Klavye olaylarını ekler
   */
  function setupKeyboardListeners() {
    try {
      // Fiziksel klavye dinleyicisi
      document.addEventListener('keydown', handleKeyPress);
      
      // Sanal klavye dinleyicisi
      if (keyboard) {
        keyboard.addEventListener('click', (event) => {
          const target = event.target.closest('.key');
          if (target && target.hasAttribute('data-key')) {
            const key = target.getAttribute('data-key');
            handleKeyInput(key);
            
            // Tıklama efekti
            target.classList.add('key-pressed');
            setTimeout(() => {
              target.classList.remove('key-pressed');
            }, 100);
            
            // Tıklama sesi
            playSound(clickSound);
          }
        });
      }
    } catch (error) {
      console.error("Klavye dinleyicileri eklenirken hata oluştu:", error);
    }
  }
  
  /**
   * Mobil dokunmatik olayları
   */
  function handleTouchStart(event) {
    try {
      if (!isGuessing || animationRunning) return;
      
      // Modallar açıkken dokunma olaylarını engelle
      if (document.querySelector('.wordle-modal.active')) return;
      
      const touch = event.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      
      if (element) {
        const key = element.closest('.key');
        if (key && key.hasAttribute('data-key')) {
          const keyValue = key.getAttribute('data-key');
          handleKeyInput(keyValue);
          
          // Dokunma efekti
          key.classList.add('key-pressed');
          setTimeout(() => {
            key.classList.remove('key-pressed');
          }, 100);
          
          // Tıklama sesi
          playSound(clickSound);
        }
      }
    } catch (error) {
      console.error("Dokunmatik olay işlenirken hata oluştu:", error);
    }
  }
  
  /**
   * Klavye girişlerini işler
   */
  function handleKeyPress(event) {
    try {
      if (!isGuessing || animationRunning) return;
      
      // Modallar açıkken klavye olaylarını engelle
      if (document.querySelector('.wordle-modal.active')) return;
      
      const key = event.key;
      
      if (key === 'Enter') {
        submitGuess();
      } else if (key === 'Backspace') {
        deleteLetter();
      } else if (/^[a-zA-ZğüşıöçĞÜŞİÖÇ]$/.test(key)) {
        // Türkçe harfleri de kabul eder
        addLetter(key.toUpperCase());
        
        // Tuş basma sesi
        playSound(clickSound);
        
        // İlgili klavye tuşunda basma efekti göster
        const keyElement = keyboard.querySelector(`[data-key="${key.toLowerCase()}"]`);
        if (keyElement) {
          keyElement.classList.add('key-pressed');
          setTimeout(() => {
            keyElement.classList.remove('key-pressed');
          }, 100);
        }
      }
    } catch (error) {
      console.error("Klavye girişi işlenirken hata oluştu:", error);
    }
  }
  
  /**
   * Klavye giriş işlemleri
   */
  function handleKeyInput(key) {
    try {
      if (!isGuessing || animationRunning) return;
      
      if (key === 'Enter') {
        submitGuess();
      } else if (key === 'Backspace') {
        deleteLetter();
      } else {
        addLetter(key.toUpperCase());
      }
    } catch (error) {
      console.error("Klavye girişi işlenirken hata oluştu:", error);
    }
  }
  
  /**
   * Oyun tahtasını oluşturur
   */
  function createGameBoard() {
    try {
      if (!guessGrid) return;
      
      guessGrid.innerHTML = '';
      
      for (let i = 0; i < MAX_GUESSES; i++) {
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
    } catch (error) {
      console.error("Oyun tahtası oluşturulurken hata oluştu:", error);
    }
  }
  
  /**
   * Ses çalma işlemi
   */
  function playSound(sound) {
    try {
      // Ses açık mı kontrol et
      const soundEnabled = localStorage.getItem('wordleSoundEnabled') !== 'false';
      if (!soundEnabled) return;
      
      // Sesi baştan başlat ve çal
      sound.currentTime = 0;
      sound.play().catch(err => {
        console.log("Ses çalma hatası:", err);
      });
    } catch (error) {
      console.error("Ses çalınırken hata oluştu:", error);
    }
  }
  
  /**
   * Harf ekler
   */
  function addLetter(letter) {
    try {
      if (currentGuess.length < WORD_LENGTH) {
        currentGuess.push(letter);
        
        // Harf kutusunu güncelle
        const box = getLetterBox(currentRow, currentGuess.length - 1);
        if (box) {
          box.textContent = letter;
          box.classList.remove('empty');
          box.classList.add('filled');
          
          playPopAnimation(box);
        }
      }
    } catch (error) {
      console.error("Harf eklenirken hata oluştu:", error);
    }
  }
  
  /**
   * Son harfi siler
   */
  function deleteLetter() {
    try {
      if (currentGuess.length > 0) {
        currentGuess.pop();
        
        // Harf kutusunu güncelle
        const box = getLetterBox(currentRow, currentGuess.length);
        if (box) {
          box.textContent = '';
          box.classList.remove('filled');
          box.classList.add('empty');
        }
      }
    } catch (error) {
      console.error("Harf silinirken hata oluştu:", error);
    }
  }
  
  /**
   * Tahmin girişini gönderir
   */
  function submitGuess() {
    try {
      if (currentGuess.length !== WORD_LENGTH) {
        showMessage('5 harfli bir kelime girin!', 'error');
        shakeRow(currentRow);
        playSound(wrongSound);
        return;
      }
      
      const guessWord = currentGuess.join('');
      
      // Geçerli kelime kontrolü
      if (!isValidWordleWord(guessWord.toLowerCase())) {
        showMessage('Geçerli bir kelime değil!', 'error');
        shakeRow(currentRow);
        playSound(wrongSound);
        return;
      }
      
      // Zor modda önceki ipuçlarına göre zorunlu harfleri kontrol et
      if (isHardMode && currentRow > 0) {
        const missingRequiredLetters = checkRequiredLetters(guessWord);
        if (missingRequiredLetters.length > 0) {
          showMessage(`Harf(ler)i kullanmalısınız: ${missingRequiredLetters.join(", ")}`, 'warning');
          shakeRow(currentRow);
          playSound(wrongSound);
          return;
        }
      }
      
      // Tahmini kaydet
      guessedWords.push(guessWord);
      
      // Harfleri kontrol et ve animasyonu göster
      animationRunning = true;
      const result = checkGuess(guessWord);
      
      // Son oyun durumunu kaydet
      saveLastGameState();
      
      // Animasyon sona erdikten sonra
      setTimeout(() => {
        // Kazanma kontrolü
        if (guessWord === targetWord) {
          handleWin();
        } 
        // Son satıra geldiyse ve bulamadıysa
        else if (currentRow === MAX_GUESSES - 1) {
          handleLoss();
        } 
        // Oyun devam ediyor
        else {
          // Doğru ve mevcut harfleri gerekli harfler olarak kaydet (zor mod için)
          if (isHardMode) {
            updateRequiredLetters(result);
          }
          
          currentRow++;
          currentGuess = [];
          animationRunning = false;
        }
      }, WORD_LENGTH * FLIP_ANIMATION_DURATION + 100);
    } catch (error) {
      console.error("Tahmin gönderilirken hata oluştu:", error);
      animationRunning = false;
    }
  }
  
  /**
   * Zor mod için gerekli harfleri kontrol eder
   */
  function checkRequiredLetters(guessWord) {
    try {
      const missingLetters = [];
      
      for (const [letter, positions] of Object.entries(requiredLetters)) {
        // Doğru konumda olması gereken harfler
        const correctPositions = positions.filter(pos => pos.state === 'correct');
        for (const position of correctPositions) {
          if (guessWord[position.index] !== letter) {
            missingLetters.push(`${letter}(${position.index + 1}. konum)`);
          }
        }
        
        // Kelimede olması gereken harfler
        if (correctPositions.length === 0 && !guessWord.includes(letter)) {
          missingLetters.push(letter);
        }
      }
      
      return missingLetters;
    } catch (error) {
      console.error("Gerekli harfler kontrol edilirken hata oluştu:", error);
      return [];
    }
  }
  
  /**
   * Zor mod için gerekli harfleri günceller
   */
  function updateRequiredLetters(result) {
    try {
      for (let i = 0; i < WORD_LENGTH; i++) {
        const letter = currentGuess[i];
        const state = result[i];
        
        if (state === 'correct' || state === 'present') {
          if (!requiredLetters[letter]) {
            requiredLetters[letter] = [];
          }
          
          requiredLetters[letter].push({
            index: i,
            state: state
          });
        }
      }
    } catch (error) {
      console.error("Gerekli harfler güncellenirken hata oluştu:", error);
    }
  }
  
  /**
   * Kazanma durumunu işler
   */
  function handleWin() {
    try {
      setTimeout(() => {
        isGuessing = false;
        danceRow(currentRow);
        
        playSound(gameCompleteSound);
        
        if (shareResultBtn) {
          shareResultBtn.disabled = false;
        }
        
        setTimeout(() => {
          // İstatistikleri güncelle
          gameStats.gamesPlayed++;
          gameStats.gamesWon++;
          gameStats.currentStreak++;
          
          // Yeni dağılım için tahmini kaydet
          gameStats.guessDistribution[currentRow]++;
          
          // Maksimum seriyi güncelle
          if (gameStats.currentStreak > gameStats.maxStreak) {
            gameStats.maxStreak = gameStats.currentStreak;
          }
          
          // Tamamlama tarihini kaydet
          gameStats.lastCompleted = new Date().toISOString();
          
          // İstatistikleri kaydet
          saveStats();
          
          // Son oyun durumunu kaydet
          saveLastGameState();
          
          // Skor sunucuya gönder
          saveWordleScore(calculateScore());
          
          // Oyun sonu modalını göster
          showGameEndModal(true);
        }, DANCE_ANIMATION_DURATION);
      }, 250);
    } catch (error) {
      console.error("Kazanma durumu işlenirken hata oluştu:", error);
    }
  }
  
  /**
   * Kaybetme durumunu işler
   */
  function handleLoss() {
    try {
      gameStats.gamesPlayed++;
      gameStats.currentStreak = 0;
      saveStats();
      
      isGuessing = false;
      
      // Son oyun durumunu kaydet
      saveLastGameState();
      
      // Kaybettiğinde doğru cevabı göster
      shakeRow(currentRow);
      
      // Yanlış cevap sesi
      playSound(wrongSound);
      
      setTimeout(() => {
        showGameEndModal(false);
      }, 1000);
    } catch (error) {
      console.error("Kaybetme durumu işlenirken hata oluştu:", error);
    }
  }
  
  /**
   * Sonucu paylaşır
   */
  function shareResult() {
    try {
      // Sonuç metni oluştur
      const resultText = createShareText();
      
      if (navigator.share) {
        // Web Share API'si mevcut ise paylaşım menüsü göster
        navigator.share({
          title: 'Wordle Sonucum',
          text: resultText
        })
        .then(() => {
          console.log('Paylaşım başarılı');
        })
        .catch(err => {
          console.log('Paylaşım hatası:', err);
          copyToClipboard(resultText);
        });
      } else {
        // Web Share API yoksa panoya kopyala
        copyToClipboard(resultText);
      }
    } catch (error) {
      console.error("Sonuç paylaşılırken hata oluştu:", error);
      showMessage("Paylaşım yapılamadı", "error");
    }
  }
  
  /**
   * Metni panoya kopyalar
   */
  function copyToClipboard(text) {
    try {
      navigator.clipboard.writeText(text)
        .then(() => {
          showMessage('Sonuç panoya kopyalandı!', 'success');
        })
        .catch(err => {
          console.error('Kopyalama hatası:', err);
          showMessage('Kopyalama işlemi başarısız', 'error');
          
          // Alternatif yöntem
          fallbackCopyTextToClipboard(text);
        });
    } catch (error) {
      console.error("Panoya kopyalanırken hata oluştu:", error);
      fallbackCopyTextToClipboard(text);
    }
  }
  
  /**
   * Alternatif kopyalama yöntemi
   */
  function fallbackCopyTextToClipboard(text) {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Make the textarea out of viewport
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          showMessage('Sonuç panoya kopyalandı!', 'success');
        } else {
          showMessage('Kopyalama işlemi başarısız', 'error');
        }
      } catch (err) {
        console.error('Fallback: Kopyalama hatası', err);
        showMessage('Kopyalama işlemi başarısız', 'error');
      }
      
      document.body.removeChild(textArea);
    } catch (error) {
      console.error("Alternatif kopyalama yöntemi başarısız:", error);
    }
  }
  
  /**
   * Paylaşım metni oluşturur
   */
  function createShareText() {
    try {
      const emojiMap = {
        'correct': '🟩',
        'present': '🟨',
        'absent': '⬛'
      };
      
      let resultText = `Wordle ${gameStats.gamesPlayed} ${isGuessing ? 'X' : currentRow + 1}/6\n\n`;
      
      for (let i = 0; i < guessedWords.length; i++) {
        const guess = guessedWords[i];
        const result = checkGuessNoAnimation(guess);
        
        const rowEmojis = result.map(state => emojiMap[state]).join('');
        resultText += rowEmojis + '\n';
      }
      
      resultText += '\nzognioc.com/wordle';
      
      return resultText;
    } catch (error) {
      console.error("Paylaşım metni oluşturulurken hata oluştu:", error);
      return "Wordle sonucu oluşturulamadı";
    }
  }
  
  /**
   * Oyun sonu modalını gösterir
   */
  function showGameEndModal(isWin) {
    try {
      if (!endGameTitle || !gameEndMessage) return;
      
      endGameTitle.textContent = isWin ? 'Tebrikler!' : 'Oyun Bitti';
      
      const resultMessage = document.createElement('div');
      resultMessage.className = isWin ? 'success-message' : 'failure-message';
      
      if (isWin) {
        resultMessage.innerHTML = `
          <p>Doğru kelimeyi <strong>${currentRow + 1}</strong> denemede buldunuz!</p>
          <p>Hedef kelime: <strong>${targetWord}</strong></p>
        `;
      } else {
        resultMessage.innerHTML = `
          <p>Maalesef kelimeyi bulamadınız.</p>
          <p>Doğru kelime: <strong>${targetWord}</strong></p>
        `;
      }
      
      gameEndMessage.innerHTML = '';
      gameEndMessage.appendChild(resultMessage);
      
      // Sonuç grid'ini oluştur
      createResultGrid();
      
      // Sonraki kelime için geri sayımı göster
      const remainingTime = getTimeUntilTomorrow();
      startCountdown(remainingTime);
      
      // Modalı göster
      showModal(gameEndModal);
    } catch (error) {
      console.error("Oyun sonu modalı gösterilirken hata oluştu:", error);
    }
  }
  
  /**
   * Sonuç grid'ini oluşturur
   */
  function createResultGrid() {
    try {
      if (!resultGrid) return;
      
      resultGrid.innerHTML = '';
      
      for (let i = 0; i < guessedWords.length; i++) {
        const resultRow = document.createElement('div');
        resultRow.className = 'result-row';
        
        const guess = guessedWords[i];
        const result = checkGuessNoAnimation(guess);
        
        for (let j = 0; j < WORD_LENGTH; j++) {
          const resultCell = document.createElement('div');
          resultCell.className = `result-cell result-${result[j]}`;
          resultRow.appendChild(resultCell);
        }
        
        resultGrid.appendChild(resultRow);
      }
    } catch (error) {
      console.error("Sonuç grid'i oluşturulurken hata oluştu:", error);
    }
  }
  
  /**
   * Puanı hesaplar
   */
  function calculateScore() {
    try {
      // Tahmin sayısına göre puan
      const baseScore = 600 - (currentRow * 100); // 1. tahminde 500, 6. tahminde 0
      
      // Zorluk seviyesi bonusu
      const difficultyMultiplier = isHardMode ? 1.5 : 1;
      
      return Math.round(baseScore * difficultyMultiplier);
    } catch (error) {
      console.error("Puan hesaplanırken hata oluştu:", error);
      return 100; // Varsayılan puan
    }
  }
  
  /**
   * Tahmini hedef kelimeyle karşılaştırır ve animasyonları gösterir
   */
  function checkGuess(guess) {
    try {
      const result = checkGuessNoAnimation(guess);
      
      // Harflerin durumlarını animasyonla göster
      for (let i = 0; i < WORD_LENGTH; i++) {
        setTimeout(() => {
          revealTile(currentRow, i, result[i]);
          
          // Klavye durumunu da güncelle
          updateKeyboardState(guess[i], result[i]);
          
          // Ses efekti
          if (result[i] === 'correct') {
            playSound(correctSound);
          } else if (result[i] === 'present') {
            playSound(clickSound);
          }
          
          // Son harf ise animasyon durumunu güncelle
          if (i === WORD_LENGTH - 1) {
            setTimeout(() => {
              animationRunning = false;
            }, FLIP_ANIMATION_DURATION);
          }
        }, i * FLIP_ANIMATION_DURATION);
      }
      
      return result;
    } catch (error) {
      console.error("Tahmin kontrol edilirken hata oluştu:", error);
      animationRunning = false;
      return Array(WORD_LENGTH).fill('absent');
    }
  }
  
  /**
   * Tahmini hedef kelimeyle karşılaştırır (animasyonsuz)
   */
  function checkGuessNoAnimation(guess) {
    try {
      let result = Array(WORD_LENGTH).fill('absent');
      const targetLetterCounts = {};
      
      // Hedef kelimedeki harf sayılarını hesapla
      for (let i = 0; i < WORD_LENGTH; i++) {
        const letter = targetWord[i];
        targetLetterCounts[letter] = (targetLetterCounts[letter] || 0) + 1;
      }
      
      // Önce doğru konumdaki harfleri işaretle
      for (let i = 0; i < WORD_LENGTH; i++) {
        if (guess[i] === targetWord[i]) {
          result[i] = 'correct';
          targetLetterCounts[guess[i]]--;
        }
      }
      
      // Sonra yanlış konumdaki harfleri işaretle
      for (let i = 0; i < WORD_LENGTH; i++) {
        if (result[i] !== 'correct') {
          if (targetLetterCounts[guess[i]] && targetLetterCounts[guess[i]] > 0) {
            result[i] = 'present';
            targetLetterCounts[guess[i]]--;
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error("Tahmin kontrolü (animasyonsuz) yapılırken hata oluştu:", error);
      return Array(WORD_LENGTH).fill('absent');
    }
  }
  
  /**
   * Harf kutusunu çevirir ve durumunu gösterir
   */
  function revealTile(row, col, state) {
    try {
      const box = getLetterBox(row, col);
      if (!box) return;
      
      box.classList.add('flip');
      
      setTimeout(() => {
        box.classList.remove('filled');
        box.classList.add(state);
        
        setTimeout(() => {
          box.classList.remove('flip');
        }, FLIP_ANIMATION_DURATION / 2);
      }, FLIP_ANIMATION_DURATION / 2);
    } catch (error) {
      console.error("Harf kutusu açılırken hata oluştu:", error);
    }
  }
  
  /**
   * Klavye tuşlarının durumunu güncelle
   */
  function updateKeyboardState(letter, state) {
    try {
      if (!keyboard) return;
      
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
    } catch (error) {
      console.error("Klavye durumu güncellenirken hata oluştu:", error);
    }
  }
  
  /**
   * Belirli satır ve sütundaki kutuyu döndürür
   */
  function getLetterBox(row, col) {
    try {
      if (!guessGrid) return null;
      return guessGrid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    } catch (error) {
      console.error("Harf kutusu alınırken hata oluştu:", error);
      return null;
    }
  }
  
  /**
   * Belirli satırı sallama animasyonu
   */
  function shakeRow(row) {
    try {
      if (!guessGrid || !guessGrid.children[row]) return;
      
      const boxes = Array.from(guessGrid.children[row].children);
      
      boxes.forEach(box => {
        box.classList.add('shake');
        setTimeout(() => {
          box.classList.remove('shake');
        }, 500);
      });
    } catch (error) {
      console.error("Satır sallanırken hata oluştu:", error);
    }
  }
  
  /**
   * Belirli satırı dans ettirme animasyonu
   */
  function danceRow(row) {
    try {
      if (!guessGrid || !guessGrid.children[row]) return;
      
      const boxes = Array.from(guessGrid.children[row].children);
      
      boxes.forEach((box, index) => {
        setTimeout(() => {
          box.classList.add('dance');
          setTimeout(() => {
            box.classList.remove('dance');
          }, DANCE_ANIMATION_DURATION);
        }, index * 100);
      });
    } catch (error) {
      console.error("Dans animasyonu sırasında hata oluştu:", error);
    }
  }
  
  /**
   * Pop animasyonu
   */
  function playPopAnimation(element) {
    try {
      if (!element) return;
      
      element.classList.add('pop');
      setTimeout(() => {
        element.classList.remove('pop');
      }, 150);
    } catch (error) {
      console.error("Pop animasyonu sırasında hata oluştu:", error);
    }
  }
  
  /**
   * Mesaj gösterir
   */
  function showMessage(text, type = 'info', duration = 2000) {
    try {
      if (!messageDisplay) return;
      
      messageDisplay.textContent = text;
      messageDisplay.className = 'message-display show';
      messageDisplay.classList.add(type);
      
      setTimeout(() => {
        messageDisplay.classList.remove('show');
      }, duration);
    } catch (error) {
      console.error("Mesaj gösterilirken hata oluştu:", error);
    }
  }
  
  /**
   * Modal gösterme
   */
  function showModal(modal) {
    try {
      if (!modal || !modalOverlay) return;
      
      // Diğer tüm açık modalları kapat
      document.querySelectorAll('.wordle-modal.active').forEach(m => {
        if (m !== modal) {
          m.classList.remove('active');
        }
      });
      
      modal.classList.add('active');
      modalOverlay.classList.add('active');
      
      // Modalın içeriğine focus yap (erişilebilirlik için)
      const focusableElement = modal.querySelector('button, [tabindex="0"]');
      if (focusableElement) {
        focusableElement.focus();
      }
    } catch (error) {
      console.error("Modal gösterilirken hata oluştu:", error);
    }
  }
  
  /**
   * Modal gizleme
   */
  function hideModal(modal) {
    try {
      if (!modal || !modalOverlay) return;
      
      modal.classList.remove('active');
      
      // Başka açık modal yoksa overlay'ı kapat
      if (!document.querySelector('.wordle-modal.active')) {
        modalOverlay.classList.remove('active');
      }
    } catch (error) {
      console.error("Modal gizlenirken hata oluştu:", error);
    }
  }
  
  /**
   * Yeni oyun başlatır
   */
  function startNewGame() {
    try {
      // Yeni kelime seç
      selectTargetWord();
      
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
      
      // Paylaş butonunu devre dışı bırak
      if (shareResultBtn) {
        shareResultBtn.disabled = true;
      }
      
      // Son oyun durumunu kaydet
      saveLastGameState();
      
      showMessage('Yeni oyun başladı!', 'success');
    } catch (error) {
      console.error("Yeni oyun başlatılırken hata oluştu:", error);
    }
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
    requiredLetters = {};
  }

  // Uygulama kapanırken interval'ı temizle
  window.addEventListener('beforeunload', () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
  });
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
  .then(response => {
    if (!response.ok) {
      throw new Error('Sunucu hatası');
    }
    return response.json();
  })
  .then(data => {
    console.log('Score saved:', data);
  })
  .catch(error => {
    console.error('Error saving score:', error);
  });
}