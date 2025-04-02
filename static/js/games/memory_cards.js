/**
 * Hafıza Kartları Oyunu (Memory Cards)
 * 
 * Modern, etkileşimli ve görsel olarak çekici bir hafıza kartları oyunu.
 * Farklı zorluk seviyeleri, temalar ve oyun modları sunar.
 * Tam olarak duyarlı tasarım ve animasyonlu efektlerle güçlendirilmiştir.
 */

// Oyun konfigürasyonu
const gameConfig = {
  difficulty: 'easy', // 'easy', 'medium', 'hard'
  theme: 'emoji',     // 'emoji', 'animals', 'icons'
  mode: 'standard',   // 'standard', 'time', 'limited'
  timeLimit: 60,      // Saniye (zamanlı mod için)
  moveLimit: 25,      // Hamle limiti (sınırlı mod için)
  cardCount: 16,      // Toplam kart sayısı (zorluk seviyesine göre değişir)
  gridColumns: 4,     // Grid sütun sayısı
  matchReward: 10,    // Eşleşme başına puan
  mismatchPenalty: 1, // Hatalı eşleştirme cezası
  timeBonus: 0.5,     // Kalan her saniye için bonus puan (zamanlı mod için)
};

// Oyun durumu
const gameState = {
  cards: [],
  flippedCards: [],
  matchedPairs: 0,
  totalPairs: 0,
  moves: 0,
  score: 0,
  timer: null,
  timerValue: 0,
  gameActive: false,
  lockBoard: false,
};

// Tema içerikleri
const themeContent = {
  emoji: [
    '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', 
    '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '🙂', '🤗',
    '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥',
    '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜', 
  ],
  animals: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
    '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦄',
    '🦉', '🦇', '🐺', '🐗', '🐴', '🦓', '🦒', '🦌', '🦘', '🦥',
    '🐙', '🦑', '🦞', '🦀', '🐚', '🦈', '🐬', '🐋', '🐊', '🦖',
  ],
  icons: [
    'fas fa-heart', 'fas fa-star', 'fas fa-smile', 'fas fa-bolt', 'fas fa-bell',
    'fas fa-moon', 'fas fa-sun', 'fas fa-home', 'fas fa-key', 'fas fa-trophy',
    'fas fa-flag', 'fas fa-leaf', 'fas fa-apple-alt', 'fas fa-lemon', 'fas fa-car',
    'fas fa-plane', 'fas fa-ship', 'fas fa-train', 'fas fa-bicycle', 'fas fa-motorcycle',
    'fas fa-football-ball', 'fas fa-basketball-ball', 'fas fa-baseball-ball', 'fas fa-volleyball-ball', 'fas fa-table-tennis',
    'fas fa-cloud', 'fas fa-snowflake', 'fas fa-fire', 'fas fa-meteor', 'fas fa-rainbow',
    'fas fa-fish', 'fas fa-cat', 'fas fa-dog', 'fas fa-horse', 'fas fa-hippo',
    'fas fa-dragon', 'fas fa-spider', 'fas fa-bug', 'fas fa-dove', 'fas fa-crow'
  ]
};

// DOM elemanlarına referanslar
const DOM = {
  memoryGame: document.getElementById('memory-game'),
  scoreDisplay: document.getElementById('score'),
  movesOrTimeDisplay: document.getElementById('moves-or-time'),
  movesOrTimeLabel: document.getElementById('moves-or-time-label'),
  startGameBtn: document.getElementById('start-game'),
  restartGameBtn: document.getElementById('restart-game'),
  difficultyBtns: {
    easy: document.getElementById('difficulty-easy'),
    medium: document.getElementById('difficulty-medium'),
    hard: document.getElementById('difficulty-hard')
  },
  themeBtns: {
    emoji: document.getElementById('theme-emoji'),
    animals: document.getElementById('theme-animals'),
    icons: document.getElementById('theme-icons')
  },
  modeBtns: {
    standard: document.getElementById('mode-standard'),
    time: document.getElementById('mode-time'),
    limited: document.getElementById('mode-limited')
  },
  gameStatusOverlay: document.getElementById('game-status-overlay'),
  statusMessage: document.getElementById('status-message'),
  statusDescription: document.getElementById('status-description'),
  overlayButton: document.getElementById('overlay-button'),
  successModal: document.getElementById('successModal'),
  finalScore: document.getElementById('final-score'),
  finalMoves: document.getElementById('final-moves'),
  finalTime: document.getElementById('final-time'),
  timeUpModal: document.getElementById('timeUpModal'),
  timeoutScore: document.getElementById('timeout-score'),
  matchedPairs: document.getElementById('matched-pairs'),
  playAgainBtn: document.getElementById('play-again'),
  timeUpPlayAgainBtn: document.getElementById('time-up-play-again')
};

// Ses efektleri için AudioContext ve gain node
let audioContext;
let gainNode;
let loadSounds = false;

// Ses efektlerini yükleme ve çalma
const soundEffects = {
  flip: {
    play() {
      if (!audioContext) return;
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(360, audioContext.currentTime + 0.15);

      oscillator.connect(gainNode);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15);
    }
  },
  match: {
    play() {
      if (!audioContext) return;
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();

      oscillator1.type = 'sine';
      oscillator2.type = 'sine';

      oscillator1.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator1.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.1);

      oscillator2.frequency.setValueAtTime(440 * 1.25, audioContext.currentTime + 0.1);
      oscillator2.frequency.exponentialRampToValueAtTime(660 * 1.25, audioContext.currentTime + 0.2);

      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

      oscillator1.start();
      oscillator1.stop(audioContext.currentTime + 0.1);

      oscillator2.start(audioContext.currentTime + 0.1);
      oscillator2.stop(audioContext.currentTime + 0.2);
    }
  },
  wrong: {
    play() {
      if (!audioContext) return;
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  },
  success: {
    play() {
      if (!audioContext) return;

      const playNote = (freq, time, duration, gain) => {
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + time);

        const noteGain = audioContext.createGain();
        noteGain.gain.setValueAtTime(0, audioContext.currentTime + time);
        noteGain.gain.linearRampToValueAtTime(gain, audioContext.currentTime + time + 0.05);
        noteGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + time + duration);

        oscillator.connect(noteGain);
        noteGain.connect(gainNode);

        oscillator.start(audioContext.currentTime + time);
        oscillator.stop(audioContext.currentTime + time + duration);
      };

      // C chord
      playNote(523.25, 0, 0.2, 0.3);  // C
      playNote(659.25, 0, 0.2, 0.3);  // E
      playNote(783.99, 0, 0.2, 0.3);  // G

      // G chord
      playNote(392.00, 0.2, 0.2, 0.3); // G
      playNote(493.88, 0.2, 0.2, 0.3); // B
      playNote(587.33, 0.2, 0.2, 0.3); // D

      // Final C chord
      playNote(523.25, 0.4, 0.4, 0.3); // C
      playNote(659.25, 0.4, 0.4, 0.3); // E
      playNote(783.99, 0.4, 0.4, 0.3); // G
      playNote(1046.50, 0.4, 0.4, 0.2); // High C
    }
  },
  timeUp: {
    play() {
      if (!audioContext) return;

      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sawtooth';

      const gainNode2 = audioContext.createGain();
      gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime);

      oscillator.connect(gainNode2);
      gainNode2.connect(gainNode);

      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(110, audioContext.currentTime + 1);
      gainNode2.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 1);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 1);
    }
  }
};

// Sayfa yüklendiğinde çalışacak ana fonksiyon
document.addEventListener('DOMContentLoaded', function() {
  // Buton işlevselliği
  const startGameBtn = document.getElementById('start-game');
  if (startGameBtn) {
    startGameBtn.addEventListener('click', () => {
      startGame();
      startGameBtn.style.display = 'none';
    });
  }

  // Oyun durumu
  let gameState = {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    totalPairs: 0,
    moves: 0,
    score: 0,
    timer: null,
    timerValue: 0,
    gameActive: false,
    lockBoard: false,
  };

  // Tüm eventListener'ları ayarla
  setupEventListeners();

  // AudioContext'i hazırla
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5;
    gainNode.connect(audioContext.destination);
    loadSounds = true;
  } catch (e) {
    console.error("Ses yüklenirken hata oluştu:", e);
    loadSounds = false;
  }

  // Başlangıç durumunu ayarla
  resetGame();

  // Overlay'i göster
  updateOverlayStatus('Hafıza Kartları', 'Kartları eşleştirerek belleğini güçlendir!', 'Başla');
});

// Event Listener'ları ayarlama
function setupEventListeners() {
  // Zorluk butonları
  DOM.difficultyBtns.easy.addEventListener('click', () => selectDifficulty('easy'));
  DOM.difficultyBtns.medium.addEventListener('click', () => selectDifficulty('medium'));
  DOM.difficultyBtns.hard.addEventListener('click', () => selectDifficulty('hard'));

  // Tema butonları
  DOM.themeBtns.emoji.addEventListener('click', () => selectTheme('emoji'));
  DOM.themeBtns.animals.addEventListener('click', () => selectTheme('animals'));
  DOM.themeBtns.icons.addEventListener('click', () => selectTheme('icons'));

  // Oyun modu butonları
  DOM.modeBtns.standard.addEventListener('click', () => selectMode('standard'));
  DOM.modeBtns.time.addEventListener('click', () => selectMode('time'));
  DOM.modeBtns.limited.addEventListener('click', () => selectMode('limited'));

  // Oyun başlatma ve yeniden başlatma
  DOM.startGameBtn.addEventListener('click', startGame);
  DOM.restartGameBtn.addEventListener('click', restartGame);
  DOM.overlayButton.addEventListener('click', startGame);
  DOM.playAgainBtn.addEventListener('click', function() {
    $(DOM.successModal).modal('hide');
    restartGame();
  });
  DOM.timeUpPlayAgainBtn.addEventListener('click', function() {
    $(DOM.timeUpModal).modal('hide');
    restartGame();
  });
}

// Zorluk seviyesi seçimi
function selectDifficulty(difficulty) {
  // Aktif sınıfını temizle
  clearActiveClass(DOM.difficultyBtns);

  // Seçilen zorluk seviyesini aktifleştir
  DOM.difficultyBtns[difficulty].classList.add('active');

  // Konfigürasyonu güncelle
  gameConfig.difficulty = difficulty;

  // Kart sayısı ve grid sütunlarını ayarla
  switch (difficulty) {
    case 'easy':
      gameConfig.cardCount = 16;
      gameConfig.gridColumns = 4;
      break;
    case 'medium':
      gameConfig.cardCount = 36;
      gameConfig.gridColumns = 6;
      break;
    case 'hard':
      gameConfig.cardCount = 64;
      gameConfig.gridColumns = 8;
      break;
  }
}

// Tema seçimi
function selectTheme(theme) {
  // Aktif sınıfını temizle
  clearActiveClass(DOM.themeBtns);

  // Seçilen temayı aktifleştir
  DOM.themeBtns[theme].classList.add('active');

  // Konfigürasyonu güncelle
  gameConfig.theme = theme;
}

// Oyun modu seçimi
function selectMode(mode) {
  // Aktif sınıfını temizle
  clearActiveClass(DOM.modeBtns);

  // Seçilen modu aktifleştir
  DOM.modeBtns[mode].classList.add('active');

  // Konfigürasyonu güncelle
  gameConfig.mode = mode;

  // Mod etiketini güncelle
  updateModeLabel(mode);
}

// Mod etiketini güncelleme
function updateModeLabel(mode) {
  if (mode === 'time') {
    DOM.movesOrTimeLabel.textContent = 'Süre';
  } else {
    DOM.movesOrTimeLabel.textContent = 'Hamle';
  }
}

// Aktif sınıfını temizleme
function clearActiveClass(btnGroup) {
  Object.values(btnGroup).forEach(btn => {
    btn.classList.remove('active');
  });
}

// Oyunu başlatma
function startGame() {
  // Ses desteğini kontrol et ve başlat
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }

  // Overlay'i gizle
  DOM.gameStatusOverlay.style.display = 'none';

  // Oyun durumunu sıfırla
  resetGame();

  // Butonları güncelle
  DOM.startGameBtn.style.display = 'none';
  DOM.restartGameBtn.style.display = 'block';

  // Kartları oluştur
  createCards();

  // Oyunu aktifleştir
  gameState.gameActive = true;

  // Mod özelliklerine göre başlat
  if (gameConfig.mode === 'time') {
    startTimer();
  }
}

// Oyunu yeniden başlatma
function restartGame() {
  // Ses desteğini kontrol et ve başlat
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }

  // Overlay'i gizle
  DOM.gameStatusOverlay.style.display = 'none';

  // Oyun durumunu sıfırla
  resetGame();

  // Butonları güncelle
  DOM.startGameBtn.style.display = 'none';
  DOM.restartGameBtn.style.display = 'block';

  // Kartları oluştur
  createCards();

  // Oyunu aktifleştir
  gameState.gameActive = true;

  // Mod özelliklerine göre başlat
  if (gameConfig.mode === 'time') {
    startTimer();
  }
}

// Kartları oluşturma
function createCards() {
  // Oyun alanını temizle
  DOM.memoryGame.innerHTML = '';

  // Grid sütunlarını ayarla
  DOM.memoryGame.className = 'memory-game';
  if (gameConfig.difficulty === 'medium') {
    DOM.memoryGame.classList.add('medium');
  } else if (gameConfig.difficulty === 'hard') {
    DOM.memoryGame.classList.add('hard');
  }

  // Çift semboller için kart sayısının yarısı kadar sembol seç
  const totalPairs = gameConfig.cardCount / 2;
  gameState.totalPairs = totalPairs;
  const availableSymbols = themeContent[gameConfig.theme].slice(0, totalPairs);

  // Her sembolden 2 tane olacak şekilde kartları oluştur
  let cardSet = [];
  availableSymbols.forEach(symbol => {
    // İki kart oluştur
    for (let i = 0; i < 2; i++) {
      cardSet.push({
        id: symbol + i,
        symbol: symbol,
        matched: false
      });
    }
  });

  // Kartları karıştır
  cardSet = shuffleArray(cardSet);
  gameState.cards = cardSet;

  // Kartları DOM'a ekle
  cardSet.forEach((card, index) => {
    const cardElement = document.createElement('div');
    cardElement.className = 'memory-card';
    cardElement.dataset.id = card.id;

    // Kart ön yüzü
    const cardFront = document.createElement('div');
    cardFront.className = 'card-front';

    // Kart arka yüzü
    const cardBack = document.createElement('div');
    cardBack.className = 'card-back';
    cardBack.innerHTML = '<i class="fas fa-brain"></i>';

    // İçerik konteyneri
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';

    // Temaya göre içerik ekle
    if (gameConfig.theme === 'icons') {
      cardContent.innerHTML = `<i class="${card.symbol} card-icon"></i>`;
    } else {
      cardContent.textContent = card.symbol;
    }

    // Ön yüze içeriği ekle
    cardFront.appendChild(cardContent);

    // Kartı oluştur
    cardElement.appendChild(cardFront);
    cardElement.appendChild(cardBack);

    // Kart tıklama olayı
    cardElement.addEventListener('click', () => flipCard(cardElement, index));

    // Oyun alanına ekle
    DOM.memoryGame.appendChild(cardElement);
  });
}

// Kart çevirme
function flipCard(card, index) {
  // Oyun aktif değilse veya board kilitliyse veya kart zaten eşleşmişse
  if (!gameState.gameActive || gameState.lockBoard || gameState.cards[index].matched) return;

  // Aynı kartı tekrar çevirmeye çalışıyorsa
  if (gameState.flippedCards.length === 1 && gameState.flippedCards[0].index === index) return;

  // Kartı çevir
  card.classList.add('flip');

  // Ses efekti
  soundEffects.flip.play();

  // Çevrilen kart bilgisini kaydet
  gameState.flippedCards.push({ card, index });

  // İki kart çevrildiyse kontrol et
  if (gameState.flippedCards.length === 2) {
    // Hamle sayısını artır
    gameState.moves++;
    updateMovesDisplay();

    // Boardu kilitle
    gameState.lockBoard = true;

    // Zamanlayıcıyı başlat ve eşleşme kontrolü yap
    setTimeout(() => checkMatch(), 500);

    // Sınırlı modda hamle limitini kontrol et
    if (gameConfig.mode === 'limited' && gameState.moves >= gameConfig.moveLimit) {
      setTimeout(() => endGame('limit'), 1000);
    }
  }
}

// Eşleşme kontrolü
function checkMatch() {
  const [firstCard, secondCard] = gameState.flippedCards;
  const isMatch = gameState.cards[firstCard.index].symbol === gameState.cards[secondCard.index].symbol;

  if (isMatch) {
    // Eşleşme durumunda
    handleMatch(firstCard, secondCard);
  } else {
    // Eşleşme yoksa
    handleMismatch(firstCard, secondCard);
  }

  // Tahtayı resetle
  resetBoard();
}

// Eşleşme durumunda yapılacaklar
function handleMatch(firstCard, secondCard) {
  // Kartları eşleşti olarak işaretle
  gameState.cards[firstCard.index].matched = true;
  gameState.cards[secondCard.index].matched = true;

  // Eşleşme sayısını artır
  gameState.matchedPairs++;

  // Ses efekti
  soundEffects.match.play();

  // Puanı artır
  gameState.score += gameConfig.matchReward;
  updateScoreDisplay();

  // Eşleşme animasyonu
  firstCard.card.classList.add('matched');
  secondCard.card.classList.add('matched');
  firstCard.card.classList.add('success-animation');
  secondCard.card.classList.add('success-animation');

  // Tüm kartlar eşleştiyse oyunu bitir
  if (gameState.matchedPairs === gameState.totalPairs) {
    setTimeout(() => {
      endGame('success');
    }, 1000);
  }
}

// Eşleşmeme durumunda yapılacaklar
function handleMismatch(firstCard, secondCard) {
  // Ses efekti
  soundEffects.wrong.play();

  // Puanı azalt (eğer pozitifse)
  if (gameState.score > 0) {
    gameState.score = Math.max(0, gameState.score - gameConfig.mismatchPenalty);
    updateScoreDisplay();
  }

  // Kartları geri çevir
  setTimeout(() => {
    firstCard.card.classList.remove('flip');
    secondCard.card.classList.remove('flip');
  }, 500);
}

// Tahtayı resetleme
function resetBoard() {
  // Çevrilen kartları temizle
  gameState.flippedCards = [];

  // Tahtayı serbest bırak
  gameState.lockBoard = false;
}

// Oyun durumunu sıfırlama
function resetGame() {
  // Oyun değişkenlerini sıfırla
  gameState.cards = [];
  gameState.flippedCards = [];
  gameState.matchedPairs = 0;
  gameState.totalPairs = 0;
  gameState.moves = 0;
  gameState.score = 0;
  gameState.gameActive = false;
  gameState.lockBoard = false;

  // Zamanlayıcıyı durdur
  if (gameState.timer) {
    clearInterval(gameState.timer);
    gameState.timer = null;
  }

  // Zamanlı mod için zamanı resetle
  if (gameConfig.mode === 'time') {
    gameState.timerValue = gameConfig.timeLimit;
  } else {
    gameState.timerValue = 0;
  }

  // Ekranı güncelle
  updateScoreDisplay();
  updateMovesDisplay();
}

// Zamanlayıcıyı başlatma
function startTimer() {
  // Zamanı resetle
  gameState.timerValue = gameConfig.timeLimit;
  updateMovesDisplay();

  // Zamanlayıcıyı oluştur
  gameState.timer = setInterval(() => {
    gameState.timerValue--;
    updateMovesDisplay();

    // Zaman bittiyse oyunu sonlandır
    if (gameState.timerValue <= 0) {
      clearInterval(gameState.timer);
      endGame('timeout');
    }
  }, 1000);
}

// Oyunu sonlandırma
function endGame(reason) {
  // Oyunu pasif hale getir
  gameState.gameActive = false;

  // Zamanlayıcıyı durdur
  if (gameState.timer) {
    clearInterval(gameState.timer);
    gameState.timer = null;
  }

  // Sonuç modalını göster
  if (reason === 'success') {
    // Başarı ses efekti
    soundEffects.success.play();

    // Başarı modalı için verileri ayarla
    DOM.finalScore.textContent = gameState.score;
    DOM.finalMoves.textContent = gameState.moves;
    DOM.finalTime.textContent = formatTime(gameConfig.mode === 'time' ? 
      gameConfig.timeLimit - gameState.timerValue : gameState.timerValue);

    // Zamanlı modda kalan süre bonusu
    if (gameConfig.mode === 'time' && gameState.timerValue > 0) {
      const timeBonus = Math.round(gameState.timerValue * gameConfig.timeBonus);
      gameState.score += timeBonus;
      updateScoreDisplay();

      // Bonus bilgisi
      DOM.finalScore.textContent = gameState.score;
      DOM.finalTime.textContent = `${formatTime(gameConfig.timeLimit - gameState.timerValue)} (Bonus: +${timeBonus} puan)`;
    }

    // Başarı modalını göster
    $(DOM.successModal).modal('show');

    // Skoru kaydet
    saveScore();
  } else if (reason === 'timeout' || reason === 'limit') {
    // Zaman dolduğunda
    soundEffects.timeUp.play();

    // Zaman bitti modalı için verileri ayarla
    DOM.timeoutScore.textContent = gameState.score;
    DOM.matchedPairs.textContent = `${gameState.matchedPairs} / ${gameState.totalPairs}`;

    // Zaman bitti modalını göster
    $(DOM.timeUpModal).modal('show');

    // Skoru kaydet
    saveScore();
  }
}

// Overlay durumunu güncelleme
function updateOverlayStatus(message, description, buttonText) {
  DOM.statusMessage.textContent = message;
  DOM.statusDescription.textContent = description;
  DOM.overlayButton.textContent = buttonText;
  DOM.gameStatusOverlay.style.display = 'flex';
}

// Skor ekranını güncelleme
function updateScoreDisplay() {
  DOM.scoreDisplay.textContent = gameState.score;
}

// Hamle/Zaman ekranını güncelleme
function updateMovesDisplay() {
  if (gameConfig.mode === 'time') {
    DOM.movesOrTimeDisplay.textContent = formatTime(gameState.timerValue);
  } else {
    DOM.movesOrTimeDisplay.textContent = gameState.moves;
  }
}

// Zamanı formatlama
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// Array'i karıştırma (Fisher-Yates)
function shuffleArray(array) {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Skoru kaydetme
function saveScore() {
  // API'ye skor gönder
  fetch('/save-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      gameType: 'memoryCards',
      score: gameState.score
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
    console.error('Skor kayıt hatası:', error);
  });
}