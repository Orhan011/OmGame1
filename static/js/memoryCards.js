/**
 * Hafıza Kartları Oyunu - Memory Cards Game
 * 
 * Bu script, eşleşen kartları bulma oyununun temel mantığını içerir.
 * Oyun 3 farklı zorluk seviyesinde (kolay, orta, zor) oynanabilir ve
 * farklı temalar (hayvanlar, meyveler, emojiler, şekiller) sunar.
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM elementleri
  const memoryBoard = document.getElementById('memory-board');
  const timerElement = document.getElementById('timer');
  const movesElement = document.getElementById('moves');
  const scoreElement = document.getElementById('score');
  const easyModeBtn = document.getElementById('easy-mode');
  const mediumModeBtn = document.getElementById('medium-mode');
  const hardModeBtn = document.getElementById('hard-mode');
  const themeSelect = document.getElementById('theme-select');
  const restartBtn = document.getElementById('restart-game');
  const gameEndModal = document.getElementById('game-end-modal');
  const endTimerElement = document.getElementById('end-timer');
  const endMovesElement = document.getElementById('end-moves');
  const endScoreElement = document.getElementById('end-score');
  const playAgainBtn = document.getElementById('play-again');
  const saveScoreBtn = document.getElementById('save-score');

  // Oyun değişkenleri
  let cards = [];
  let hasFlippedCard = false;
  let lockBoard = false;
  let firstCard, secondCard;
  let moves = 0;
  let score = 0;
  let matches = 0;
  let totalPairs = 0;
  let timer;
  let seconds = 0;
  let gameMode = 'easy'; // varsayılan: kolay
  let gameTheme = 'animals'; // varsayılan: hayvanlar

  // Tema sembollerini tanımla
  const themeSymbols = {
    animals: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', 
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦒', 
      '🦓', '🦍', '🦘', '🦛', '🐘', '🦏', '🐪', '🐫',
      '🦒', '🦘', '🦔', '🦇', '🐤', '🦅'
    ],
    fruits: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓',
      '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑',
      '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅',
      '🥔', '🍠', '🫐', '🍏', '🍈', '🍆'
    ],
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
      '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
      '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
      '🤪', '🤨', '🧐', '🤓', '😎', '🤩'
    ],
    shapes: [
      '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪',
      '🟤', '🔺', '🔻', '💠', '🔸', '🔹', '🔶', '🔷',
      '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜',
      '🟫', '♠️', '♥️', '♦️', '♣️', '🔱'
    ]
  };

  // Seviyeye göre kart sayısını belirle
  const gameModes = {
    easy: { pairs: 6, layout: '3x4' },     // 12 kart, 6 çift
    medium: { pairs: 9, layout: '3x6' },   // 18 kart, 9 çift
    hard: { pairs: 15, layout: '3x10' }    // 30 kart, 15 çift
  };

  // Varsayılan oyun modunu ayarla
  initializeGame();

  /**
   * Oyunu başlat ve ayarla
   */
  function initializeGame() {
    resetGame();
    setupModeButtons();
    setupThemeSelector();
    setupRestartButton();
    setupModalButtons();
    createCards();
    startTimer();
  }

  /**
   * Seçilen tema ve zorluk seviyesine göre kartları oluştur
   */
  function createCards() {
    memoryBoard.innerHTML = '';
    memoryBoard.className = `memory-board ${gameMode}-mode`;
    
    // Zorluk seviyesine göre çift sayısını belirle
    const pairCount = gameModes[gameMode].pairs;
    totalPairs = pairCount;
    
    // Tema sembollerinden rastgele seç
    const selectedSymbols = [...themeSymbols[gameTheme]];
    const gameSymbols = selectedSymbols
      .sort(() => 0.5 - Math.random())
      .slice(0, pairCount);
    
    // Her sembolden 2 adet olmak üzere kart dizisini oluştur
    cards = [...gameSymbols, ...gameSymbols];
    
    // Kartları karıştır
    cards.sort(() => 0.5 - Math.random());
    
    // Kartları ekrana ekle
    cards.forEach((symbol, index) => {
      const card = createCardElement(symbol, index);
      memoryBoard.appendChild(card);
    });
  }

  /**
   * Tek bir kart elementini oluştur
   */
  function createCardElement(symbol, index) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.index = index;
    card.dataset.symbol = symbol;
    
    const cardFront = document.createElement('div');
    cardFront.classList.add('card-face', 'card-front');
    
    const cardBack = document.createElement('div');
    cardBack.classList.add('card-face', 'card-back');
    
    const cardContent = document.createElement('div');
    cardContent.classList.add('card-content');
    cardContent.innerHTML = symbol;
    cardBack.appendChild(cardContent);
    
    card.appendChild(cardFront);
    card.appendChild(cardBack);
    
    card.addEventListener('click', flipCard);
    return card;
  }

  /**
   * Kartı çevirme işlemi
   */
  function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;
    
    this.classList.add('flipped');
    
    if (!hasFlippedCard) {
      // İlk kart çevrildi
      hasFlippedCard = true;
      firstCard = this;
      return;
    }
    
    // İkinci kart çevrildi
    secondCard = this;
    checkForMatch();
    
    // Hamle sayısını artır
    updateMoves();
  }

  /**
   * Çevrilen iki kartın eşleşip eşleşmediğini kontrol et
   */
  function checkForMatch() {
    const isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;
    
    if (isMatch) {
      disableCards();
      updateScore(10); // Eşleşme durumunda puan ekle
      playMatchSound();
      matches++;
      
      // Tüm eşleşmeler bulundu mu kontrol et
      if (matches === totalPairs) {
        setTimeout(() => endGame(), 1000);
      }
    } else {
      unflipCards();
      updateScore(-2); // Eşleşmeme durumunda puan düşür (opsiyonel, 0 da olabilir)
      playErrorSound();
    }
  }

  /**
   * Eşleşen kartları devre dışı bırak
   */
  function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    
    // Eşleşen kartları işaretle
    setTimeout(() => {
      firstCard.classList.add('matched');
      secondCard.classList.add('matched');
      resetBoard();
    }, 600);
  }

  /**
   * Eşleşmeyen kartları geri çevir
   */
  function unflipCards() {
    lockBoard = true;
    
    setTimeout(() => {
      firstCard.classList.remove('flipped');
      secondCard.classList.remove('flipped');
      resetBoard();
    }, 1000);
  }

  /**
   * Oyun tahtasını bir sonraki hamle için hazırla
   */
  function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
  }

  /**
   * Oyunu tamamen sıfırla
   */
  function resetGame() {
    resetBoard();
    clearInterval(timer);
    seconds = 0;
    moves = 0;
    score = 0;
    matches = 0;
    
    updateTimer();
    updateMoves();
    updateScore(0);
    
    // Modal'ı kapat
    gameEndModal.style.display = 'none';
  }

  /**
   * Zamanlayıcıyı başlat
   */
  function startTimer() {
    clearInterval(timer);
    seconds = 0;
    updateTimer();
    
    timer = setInterval(() => {
      seconds++;
      updateTimer();
    }, 1000);
  }

  /**
   * Zaman bilgisini ekranda güncelle
   */
  function updateTimer() {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Hamle sayısını güncelle
   */
  function updateMoves() {
    moves++;
    movesElement.textContent = moves;
  }

  /**
   * Puanı güncelle
   */
  function updateScore(points) {
    score += points;
    // Puan negatif olmasın
    if (score < 0) score = 0;
    scoreElement.textContent = score;
  }

  /**
   * Oyun sonu işlemleri
   */
  function endGame() {
    clearInterval(timer);
    
    // Bonus puan: kalan süre ve az hamle sayısı
    const timeBonus = Math.max(0, 120 - seconds) * 2;
    const moveBonus = Math.max(0, 300 - moves * 5);
    const finalScore = score + timeBonus + moveBonus;
    
    // Modal bilgilerini güncelle
    endTimerElement.textContent = timerElement.textContent;
    endMovesElement.textContent = moves;
    endScoreElement.textContent = finalScore;
    
    // Skoru güncelle
    score = finalScore;
    scoreElement.textContent = score;
    
    // Modalı göster
    gameEndModal.style.display = 'flex';
  }

  /**
   * Zorluk seviyesi butonlarını ayarla
   */
  function setupModeButtons() {
    easyModeBtn.addEventListener('click', () => changeGameMode('easy'));
    mediumModeBtn.addEventListener('click', () => changeGameMode('medium'));
    hardModeBtn.addEventListener('click', () => changeGameMode('hard'));
  }

  /**
   * Oyun modunu değiştir
   */
  function changeGameMode(mode) {
    // Aktif butonu değiştir
    document.querySelector('.difficulty-btn.active').classList.remove('active');
    document.getElementById(`${mode}-mode`).classList.add('active');
    
    gameMode = mode;
    resetGame();
    createCards();
    startTimer();
  }

  /**
   * Tema seçiciyi ayarla
   */
  function setupThemeSelector() {
    themeSelect.addEventListener('change', () => {
      gameTheme = themeSelect.value;
      resetGame();
      createCards();
      startTimer();
    });
  }

  /**
   * Yeniden başlat butonunu ayarla
   */
  function setupRestartButton() {
    restartBtn.addEventListener('click', () => {
      resetGame();
      createCards();
      startTimer();
    });
  }

  /**
   * Modal butonlarını ayarla
   */
  function setupModalButtons() {
    playAgainBtn.addEventListener('click', () => {
      resetGame();
      createCards();
      startTimer();
    });
    
    saveScoreBtn.addEventListener('click', saveGameScore);
  }

  /**
   * Oyun skorunu kaydet
   */
  function saveGameScore() {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        game_type: 'memoryCards',
        score: score,
        difficulty: gameMode
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Başarılı bildirim göster
        const xpMessage = data.xp_gained ? `\nKazanılan XP: ${data.xp_gained}` : '';
        alert(`Skorunuz kaydedildi!${xpMessage}`);
        
        // Sayfayı yenile veya modalı kapat
        resetGame();
        createCards();
        startTimer();
      } else {
        if (data.message === 'Login required') {
          alert('Skor kaydetmek için giriş yapmalısınız!');
        } else {
          alert('Skor kaydedilemedi. Lütfen tekrar deneyin.');
        }
      }
    })
    .catch(error => {
      console.error('Skor kaydetme hatası:', error);
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    });
  }

  /**
   * Eşleşme sesi çal
   */
  function playMatchSound() {
    try {
      // Web Audio API kullanarak ses oluştur
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Ses ayarları
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
      
      // Ses başlangıç ve bitiş ayarları
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Sesi çal
      oscillator.start();
      
      // Ses süresini ayarla ve sonra durdur
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      setTimeout(() => {
        oscillator.stop();
      }, 500);
    } catch (error) {
      console.log('Sound playback error:', error);
    }
  }

  /**
   * Hata sesi çal
   */
  function playErrorSound() {
    try {
      // Web Audio API kullanarak ses oluştur
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Ses ayarları
      oscillator.type = 'sine';
      oscillator.frequency.value = 300;
      gainNode.gain.value = 0.1;
      
      // Ses başlangıç ve bitiş ayarları
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Sesi çal
      oscillator.start();
      
      // Ses süresini ayarla ve sonra durdur
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      setTimeout(() => {
        oscillator.stop();
      }, 300);
    } catch (error) {
      console.log('Sound playback error:', error);
    }
  }
});