/**
 * Wordle Premium Sürüm
 * Profesyonel ve modern kullanıcı deneyimi ile 5 harfli kelimeyi 6 denemede tahmin edin
 * Versiyon: 2.0
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
  
  // İstatistikler
  let gameStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
    lastPlayed: null,
    lastCompleted: null
  };
  
  // Oyunu başlat
  initializeGame();
  
  /**
   * Oyunu başlatan fonksiyon
   */
  function initializeGame() {
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
  }
  
  /**
   * Yerel depolamadan verileri yükler
   */
  function loadGameData() {
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
    }
    updateStatsDisplay();
    
    // Tema ayarı
    const storedTheme = localStorage.getItem('wordleTheme');
    if (storedTheme) {
      isDarkTheme = storedTheme === 'dark';
    }
    
    // Zorluk seviyesi
    const storedDifficulty = localStorage.getItem('wordleDifficulty');
    if (storedDifficulty) {
      isHardMode = storedDifficulty === 'hard';
    }
    
    // Zorluk ve tema seçimlerini radio buttons'da güncelle
    document.querySelector(`input[name="difficulty"][value="${isHardMode ? 'hard' : 'normal'}"]`).checked = true;
    document.querySelector(`input[name="theme"][value="${isDarkTheme ? 'dark' : 'light'}"]`).checked = true;
  }
  
  /**
   * Tema ayarını uygular
   */
  function applyTheme() {
    if (isDarkTheme) {
      document.documentElement.style.setProperty('--wordle-background', 'var(--wordle-background)');
      document.documentElement.style.setProperty('--wordle-surface', 'var(--wordle-surface)');
      document.documentElement.style.setProperty('--wordle-border', 'var(--wordle-border)');
      document.documentElement.style.setProperty('--wordle-text-primary', 'var(--wordle-text-primary)');
      document.documentElement.style.setProperty('--wordle-text-secondary', 'var(--wordle-text-secondary)');
      document.documentElement.style.setProperty('--wordle-key', 'var(--wordle-key)');
      document.documentElement.style.setProperty('--wordle-key-text', 'var(--wordle-key-text)');
    } else {
      document.documentElement.style.setProperty('--wordle-background', 'var(--wordle-light-background)');
      document.documentElement.style.setProperty('--wordle-surface', 'var(--wordle-light-surface)');
      document.documentElement.style.setProperty('--wordle-border', 'var(--wordle-light-border)');
      document.documentElement.style.setProperty('--wordle-text-primary', 'var(--wordle-light-text-primary)');
      document.documentElement.style.setProperty('--wordle-text-secondary', 'var(--wordle-light-text-secondary)');
      document.documentElement.style.setProperty('--wordle-key', 'var(--wordle-light-key)');
      document.documentElement.style.setProperty('--wordle-key-text', 'var(--wordle-light-key-text)');
    }
  }
  
  /**
   * Oyun istatistiklerini günceller ve yerel depolamaya kaydeder
   */
  function saveStats() {
    gameStats.lastPlayed = new Date().toISOString();
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
    if (maxStreakEl) maxStreakEl.textContent = gameStats.maxStreak;
    
    // Tahmin dağılımını güncelle
    updateGuessDistribution();
  }
  
  /**
   * Tahmin dağılımı grafik görüntüsünü günceller
   */
  function updateGuessDistribution() {
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
  }
  
  /**
   * Hedef kelimeyi seçer
   * Günde bir kez oynama özelliği için günlük kelime kontrolü yapabilir
   */
  function selectTargetWord() {
    targetWord = getRandomWordleWord().toUpperCase();
    console.log("Hedef kelime:", targetWord); // Geliştirme için, sonra kaldırılabilir
  }
  
  /**
   * Günlük kelime özelliği için zaman kontrolü
   */
  function checkDailyWordStatus() {
    const now = new Date();
    const lastPlayed = gameStats.lastPlayed ? new Date(gameStats.lastPlayed) : null;
    
    // Test için iptal edildi, gerçek uygulamada aktifleştirilebilir
    // Aynı gün içinde tekrar oynanabilirlik kontrolü
    /*
    if (lastPlayed && isSameDay(now, lastPlayed)) {
      // Aynı gün içinde oyun tamamlanmışsa
      if (gameStats.lastCompleted && isSameDay(now, new Date(gameStats.lastCompleted))) {
        showMessage('Bugünün kelimesini zaten buldunuz!', 'info');
        const remainingTime = getTimeUntilTomorrow();
        startCountdown(remainingTime);
      }
    }
    */
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
    const interval = setInterval(() => {
      const hours = Math.floor(duration / (1000 * 60 * 60));
      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((duration % (1000 * 60)) / 1000);
      
      nextGameTimer.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      duration -= 1000;
      if (duration < 0) {
        clearInterval(interval);
        location.reload(); // Yeni gün için sayfayı yenile
      }
    }, 1000);
  }
  
  /**
   * Tüm olay dinleyicilerini ekler
   */
  function setupEventListeners() {
    // Klavye dinleyicileri
    setupKeyboardListeners();
    
    // Butonlar
    newGameBtn.addEventListener('click', startNewGame);
    newGameModalBtn.addEventListener('click', () => {
      hideModal(gameEndModal);
      startNewGame();
    });
    
    // Modal butonları
    helpBtn.addEventListener('click', () => showModal(helpModal));
    statsBtn.addEventListener('click', () => showModal(statsModal));
    settingsBtn.addEventListener('click', () => showModal(settingsModal));
    
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
    modalOverlay.addEventListener('click', () => {
      document.querySelectorAll('.wordle-modal.active').forEach(modal => {
        hideModal(modal);
      });
    });
    
    // Paylaş butonları
    shareBtn.addEventListener('click', shareResult);
    shareResultBtn.addEventListener('click', shareResult);
  }
  
  /**
   * Klavye olaylarını ekler
   */
  function setupKeyboardListeners() {
    // Fiziksel klavye dinleyicisi
    document.addEventListener('keydown', handleKeyPress);
    
    // Sanal klavye dinleyicisi
    keyboard.addEventListener('click', (event) => {
      const target = event.target.closest('.key');
      if (target && target.hasAttribute('data-key')) {
        const key = target.getAttribute('data-key');
        handleKeyInput(key);
      }
    });
  }
  
  /**
   * Klavye girişlerini işler
   */
  function handleKeyPress(event) {
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
   * Oyun tahtasını oluşturur
   */
  function createGameBoard() {
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
    
    // Zor modda önceki ipuçlarına göre zorunlu harfleri kontrol et
    if (isHardMode && currentRow > 0) {
      const missingRequiredLetters = checkRequiredLetters(guessWord);
      if (missingRequiredLetters.length > 0) {
        showMessage(`Harf(ler)i kullanmalısınız: ${missingRequiredLetters.join(", ")}`, 'warning');
        shakeRow(currentRow);
        return;
      }
    }
    
    // Tahmini kaydet
    guessedWords.push(guessWord);
    
    // Harfleri kontrol et ve animasyonu göster
    animationRunning = true;
    const result = checkGuess(guessWord);
    
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
  }
  
  /**
   * Zor mod için gerekli harfleri kontrol eder
   */
  function checkRequiredLetters(guessWord) {
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
  }
  
  /**
   * Zor mod için gerekli harfleri günceller
   */
  function updateRequiredLetters(result) {
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
  }
  
  /**
   * Kazanma durumunu işler
   */
  function handleWin() {
    setTimeout(() => {
      isGuessing = false;
      danceRow(currentRow);
      
      shareResultBtn.disabled = false;
      
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
        
        // Skor sunucuya gönder
        saveWordleScore(calculateScore());
        
        // Oyun sonu modalını göster
        showGameEndModal(true);
      }, DANCE_ANIMATION_DURATION);
    }, 250);
  }
  
  /**
   * Kaybetme durumunu işler
   */
  function handleLoss() {
    gameStats.gamesPlayed++;
    gameStats.currentStreak = 0;
    saveStats();
    
    isGuessing = false;
    showGameEndModal(false);
  }
  
  /**
   * Sonucu paylaşır
   */
  function shareResult() {
    // Sonuç metni oluştur
    const resultText = createShareText();
    
    // Panoya kopyala
    navigator.clipboard.writeText(resultText)
      .then(() => {
        showMessage('Sonuç panoya kopyalandı!', 'success');
      })
      .catch(err => {
        console.error('Kopyalama hatası:', err);
        showMessage('Kopyalama işlemi başarısız', 'error');
      });
  }
  
  /**
   * Paylaşım metni oluşturur
   */
  function createShareText() {
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
  }
  
  /**
   * Oyun sonu modalını gösterir
   */
  function showGameEndModal(isWin) {
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
  }
  
  /**
   * Sonuç grid'ini oluşturur
   */
  function createResultGrid() {
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
  }
  
  /**
   * Puanı hesaplar
   */
  function calculateScore() {
    // Tahmin sayısına göre puan
    const baseScore = 600 - (currentRow * 100); // 1. tahminde 500, 6. tahminde 0
    
    // Zorluk seviyesi bonusu
    const difficultyMultiplier = isHardMode ? 1.5 : 1;
    
    return Math.round(baseScore * difficultyMultiplier);
  }
  
  /**
   * Tahmini hedef kelimeyle karşılaştırır ve animasyonları gösterir
   */
  function checkGuess(guess) {
    const result = checkGuessNoAnimation(guess);
    
    // Harflerin durumlarını animasyonla göster
    for (let i = 0; i < WORD_LENGTH; i++) {
      setTimeout(() => {
        revealTile(currentRow, i, result[i]);
        
        // Klavye durumunu da güncelle
        updateKeyboardState(guess[i], result[i]);
        
        // Son harf ise animasyon durumunu güncelle
        if (i === WORD_LENGTH - 1) {
          setTimeout(() => {
            animationRunning = false;
          }, FLIP_ANIMATION_DURATION);
        }
      }, i * FLIP_ANIMATION_DURATION);
    }
    
    return result;
  }
  
  /**
   * Tahmini hedef kelimeyle karşılaştırır (animasyonsuz)
   */
  function checkGuessNoAnimation(guess) {
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
   * Belirli satır ve sütundaki kutuyu döndürür
   */
  function getLetterBox(row, col) {
    return guessGrid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
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
    }, 150);
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
   * Modal gösterme
   */
  function showModal(modal) {
    // Diğer tüm açık modalları kapat
    document.querySelectorAll('.wordle-modal.active').forEach(m => {
      if (m !== modal) {
        m.classList.remove('active');
      }
    });
    
    modal.classList.add('active');
    modalOverlay.classList.add('active');
  }
  
  /**
   * Modal gizleme
   */
  function hideModal(modal) {
    modal.classList.remove('active');
    
    // Başka açık modal yoksa overlay'ı kapat
    if (!document.querySelector('.wordle-modal.active')) {
      modalOverlay.classList.remove('active');
    }
  }
  
  /**
   * Yeni oyun başlatır
   */
  function startNewGame() {
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
    shareResultBtn.disabled = true;
    
    showMessage('Yeni oyun başladı!', 'success');
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