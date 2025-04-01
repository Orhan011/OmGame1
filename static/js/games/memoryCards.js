/**
 * Hafıza Kartları Oyunu
 * =====================
 * Modern, responsive ve interaktif bir hafıza oyunu.
 * Kartları eşleştirerek görsel hafızanızı test edin ve geliştirin.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Oyun durumu
  const state = {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    totalPairs: 0,
    moves: 0,
    score: 0,
    gameActive: false,
    timerInterval: null,
    startTime: 0,
    elapsedTime: 0,
    difficulty: 'easy' // easy, medium, hard
  };

  // DOM elementleri
  const elements = {
    cardsContainer: document.getElementById('cards-container'),
    movesCount: document.getElementById('moves-count'),
    timeElement: document.getElementById('time'),
    scoreElement: document.getElementById('score'),
    resultMoves: document.getElementById('result-moves'),
    resultTime: document.getElementById('result-time'),
    resultScore: document.getElementById('result-score'),
    gameComplete: document.getElementById('game-complete'),
    restartBtn: document.getElementById('restart-btn'),
    playAgainBtn: document.getElementById('play-again-btn'),
    easyBtn: document.getElementById('easy-btn'),
    mediumBtn: document.getElementById('medium-btn'),
    hardBtn: document.getElementById('hard-btn')
  };

  // Kartlarda kullanılacak ikonlar (Font Awesome ikonları)
  const iconsList = [
    'fa-heart', 'fa-star', 'fa-smile', 'fa-sun', 'fa-moon',
    'fa-tree', 'fa-bell', 'fa-fire', 'fa-snowflake', 'fa-bolt',
    'fa-cloud', 'fa-leaf', 'fa-apple-whole', 'fa-car', 'fa-house',
    'fa-cat', 'fa-dog', 'fa-fish', 'fa-lemon', 'fa-plane',
    'fa-rocket', 'fa-guitar', 'fa-music', 'fa-gift', 'fa-crown',
    'fa-bug', 'fa-mug-hot', 'fa-camera', 'fa-pizza-slice', 'fa-bicycle'
  ];

  // Zorluk seviyesine göre kart sayısı
  const difficultySettings = {
    easy: { pairs: 8, columns: 'easy' },        // 16 kart (4x4)
    medium: { pairs: 12, columns: 'medium' },   // 24 kart (6x4 veya 5x5)
    hard: { pairs: 18, columns: 'hard' }        // 36 kart (6x6)
  };

  // Oyunu başlat
  function initGame() {
    // Zorluk seviyesi
    updateDifficulty(state.difficulty);
    
    // Event listener'ları ekle
    setupEventListeners();
    
    // Oyunu başlat
    startNewGame();
  }

  // Event listener'ları ekle
  function setupEventListeners() {
    elements.restartBtn.addEventListener('click', startNewGame);
    elements.playAgainBtn.addEventListener('click', startNewGame);
    
    // Zorluk seviyeleri
    elements.easyBtn.addEventListener('click', () => updateDifficulty('easy'));
    elements.mediumBtn.addEventListener('click', () => updateDifficulty('medium'));
    elements.hardBtn.addEventListener('click', () => updateDifficulty('hard'));
  }

  // Yeni oyun başlat
  function startNewGame() {
    // Oyun durumunu sıfırla
    resetGameState();
    
    // Kartları oluştur ve yerleştir
    createCards();
    
    // Overlay'i gizle
    elements.gameComplete.classList.add('hidden');
    
    // Zamanlayıcıyı başlat
    startTimer();
    
    // Oyunu aktif et
    state.gameActive = true;
  }

  // Oyun durumunu sıfırla
  function resetGameState() {
    state.cards = [];
    state.flippedCards = [];
    state.matchedPairs = 0;
    state.moves = 0;
    state.score = 0;
    state.elapsedTime = 0;
    
    // Zamanlayıcıyı durdur
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
    
    // UI'ı güncelle
    elements.movesCount.textContent = '0';
    elements.timeElement.textContent = '00:00';
    elements.scoreElement.textContent = '0';
    
    // Kart konteynırını temizle
    elements.cardsContainer.innerHTML = '';
  }

  // Kartları oluştur
  function createCards() {
    const { pairs } = difficultySettings[state.difficulty];
    state.totalPairs = pairs;
    
    // Zorluk seviyesine göre kolon sınıfını belirle
    elements.cardsContainer.className = `cards-container ${difficultySettings[state.difficulty].columns}`;
    
    // Rastgele ikonlar seç
    const selectedIcons = iconsList.sort(() => Math.random() - 0.5).slice(0, pairs);
    
    // İkon çiftlerini oluştur
    const cardPairs = [...selectedIcons, ...selectedIcons];
    
    // Kartları karıştır
    const shuffledCards = cardPairs.sort(() => Math.random() - 0.5);
    
    // Kartları oluştur ve DOM'a ekle
    shuffledCards.forEach((icon, index) => {
      const card = createCardElement(icon, index);
      elements.cardsContainer.appendChild(card);
      
      // Kart durumunu kaydet
      state.cards.push({
        index,
        icon,
        element: card,
        matched: false,
        flipped: false
      });
    });
  }

  // Kart elementi oluştur
  function createCardElement(icon, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;
    
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-front"></div>
        <div class="card-face card-back">
          <i class="fas ${icon} card-icon"></i>
        </div>
      </div>
    `;
    
    // Kart tıklama olayı
    card.addEventListener('click', () => handleCardClick(index));
    
    return card;
  }

  // Kart tıklama olayını işle
  function handleCardClick(index) {
    const card = state.cards[index];
    
    // Oyun aktif değilse, kart zaten çevrilmişse veya eşleştirilmişse veya hâlihazırda 2 kart çevrilmişse tıklamayı işleme
    if (!state.gameActive || card.flipped || card.matched || state.flippedCards.length >= 2) {
      return;
    }
    
    // Kartı çevir
    flipCard(card, true);
    
    // Çevrilen kartları takip et
    state.flippedCards.push(card);
    
    // Eğer 2 kart çevrildiyse eşleşmeyi kontrol et
    if (state.flippedCards.length === 2) {
      // Hamle sayısını artır
      updateMoves(state.moves + 1);
      
      // Eşleşme kontrolü
      checkForMatch();
    }
  }

  // Kart çevirme
  function flipCard(card, flipped) {
    card.flipped = flipped;
    
    if (flipped) {
      card.element.classList.add('flipped');
    } else {
      card.element.classList.remove('flipped');
    }
  }

  // Eşleşme kontrolü
  function checkForMatch() {
    const [firstCard, secondCard] = state.flippedCards;
    
    if (firstCard.icon === secondCard.icon) {
      // Eşleşme bulundu
      handleMatch(firstCard, secondCard);
    } else {
      // Eşleşme bulunamadı
      handleMismatch(firstCard, secondCard);
    }
  }

  // Eşleşme durumunu işle
  function handleMatch(firstCard, secondCard) {
    // Kartları eşleşti olarak işaretle
    firstCard.matched = true;
    secondCard.matched = true;
    
    // Eşleşen kartları görsel olarak işaretle
    firstCard.element.classList.add('matched');
    secondCard.element.classList.add('matched');
    
    // Eşleşmiş çiftleri artır
    state.matchedPairs++;
    
    // Puan hesapla ve güncelle
    const matchPoints = calculateMatchPoints();
    updateScore(state.score + matchPoints);
    
    // Eşleşme animasyonu
    firstCard.element.classList.add('match-animation');
    secondCard.element.classList.add('match-animation');
    
    // Animasyonu belirli bir süre sonra kaldır
    setTimeout(() => {
      firstCard.element.classList.remove('match-animation');
      secondCard.element.classList.remove('match-animation');
      
      // Çevrilen kartları temizle
      state.flippedCards = [];
      
      // Eğer tüm çiftler eşleştiyse oyunu bitir
      if (state.matchedPairs === state.totalPairs) {
        setTimeout(() => endGame(), 500);
      }
    }, 500);
  }

  // Eşleşmeme durumunu işle
  function handleMismatch(firstCard, secondCard) {
    // Kartlara sarsılma animasyonu ekle
    firstCard.element.classList.add('shake');
    secondCard.element.classList.add('shake');
    
    // Belirli bir süre sonra kartları geri çevir
    setTimeout(() => {
      // Kartları çevir
      flipCard(firstCard, false);
      flipCard(secondCard, false);
      
      // Sarsılma animasyonunu kaldır
      firstCard.element.classList.remove('shake');
      secondCard.element.classList.remove('shake');
      
      // Çevrilen kartları temizle
      state.flippedCards = [];
    }, 800);
  }

  // Eşleşme puanı hesapla
  function calculateMatchPoints() {
    // Temel puan
    let points = 100;
    
    // Zorluk seviyesi bonusu
    const difficultyBonus = {
      easy: 1,
      medium: 1.5,
      hard: 2
    };
    
    // Hamle cezası: daha az hamle daha çok puan
    // 100 * zorluk bonusu - (hamle sayısı / çift sayısı) * 10
    const movePenalty = Math.min(80, (state.moves / state.totalPairs) * 10);
    
    // Zaman cezası: daha hızlı eşleşme daha çok puan
    // Saniye başına 1 puan ceza (maksimum 50 puan)
    const secondsElapsed = state.elapsedTime / 1000;
    const timePenalty = Math.min(50, secondsElapsed / (state.totalPairs * 0.5));
    
    // Son puan hesabı
    return Math.round((points - movePenalty - timePenalty) * difficultyBonus[state.difficulty]);
  }

  // Hamleleri güncelle
  function updateMoves(moves) {
    state.moves = moves;
    elements.movesCount.textContent = moves;
  }

  // Puanı güncelle
  function updateScore(score) {
    state.score = score;
    elements.scoreElement.textContent = score;
  }

  // Zamanlayıcıyı başlat
  function startTimer() {
    state.startTime = Date.now() - state.elapsedTime;
    state.timerInterval = setInterval(updateTimer, 1000);
  }

  // Zamanlayıcıyı güncelle
  function updateTimer() {
    state.elapsedTime = Date.now() - state.startTime;
    elements.timeElement.textContent = formatTime(state.elapsedTime);
  }

  // Zamanı biçimlendir (ms -> mm:ss)
  function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Oyunu bitir
  function endGame() {
    // Zamanlayıcıyı durdur
    clearInterval(state.timerInterval);
    
    // Son puanı hesapla
    const timeBonus = Math.max(0, 1000 - Math.floor(state.elapsedTime / 1000) * 10);
    const moveBonus = Math.max(0, state.totalPairs * 100 - state.moves * 10);
    const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 }[state.difficulty];
    
    const finalScore = state.score + Math.round((timeBonus + moveBonus) * difficultyMultiplier);
    updateScore(finalScore);
    
    // Sonuç ekranını güncelle
    elements.resultMoves.textContent = state.moves;
    elements.resultTime.textContent = formatTime(state.elapsedTime);
    elements.resultScore.textContent = finalScore;
    
    // Sonuç ekranını göster
    elements.gameComplete.classList.remove('hidden');
    
    // Skoru API'ye gönder
    saveScore(finalScore);
  }

  // Skoru kaydet
  function saveScore(score) {
    // API'ye skoru gönder
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        game_type: 'memoryCards',
        score: score
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

  // Zorluk seviyesini güncelle
  function updateDifficulty(difficulty) {
    state.difficulty = difficulty;
    
    // Aktif düğmeyi güncelle
    [elements.easyBtn, elements.mediumBtn, elements.hardBtn].forEach(btn => {
      btn.classList.remove('active');
    });
    
    switch (difficulty) {
      case 'easy':
        elements.easyBtn.classList.add('active');
        break;
      case 'medium':
        elements.mediumBtn.classList.add('active');
        break;
      case 'hard':
        elements.hardBtn.classList.add('active');
        break;
    }
    
    // Aktif oyun varsa yeniden başlat
    if (state.gameActive) {
      startNewGame();
    }
  }

  // Oyunu başlat
  initGame();
});