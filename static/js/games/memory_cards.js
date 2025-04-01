/**
 * Modern Hafıza Kartları Oyunu
 * Gelişmiş bir hafıza kartları eşleştirme oyunu
 * Yazar: Replit Team
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elementleri
  const gameBoard = document.getElementById('game-board');
  const difficultySelect = document.getElementById('difficulty');
  const themeSelect = document.getElementById('card-theme');
  const newGameBtn = document.getElementById('new-game-btn');
  const hintBtn = document.getElementById('hint-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const muteBtn = document.getElementById('mute-btn');
  const gameMessage = document.getElementById('game-message');
  const messageTitle = document.getElementById('message-title');
  const messageText = document.getElementById('message-text');
  const messageStats = document.getElementById('message-stats');
  const closeMessageBtn = document.getElementById('close-message-btn');
  const playAgainBtn = document.getElementById('play-again-btn');
  const levelDisplay = document.getElementById('level');
  const timerDisplay = document.getElementById('timer');
  const scoreDisplay = document.getElementById('score');
  const movesDisplay = document.getElementById('moves');
  const hintsLeftDisplay = document.getElementById('hints-left');
  const finalTimeDisplay = document.getElementById('final-time');
  const finalScoreDisplay = document.getElementById('final-score');
  const finalMovesDisplay = document.getElementById('final-moves');

  // Oyun Durumu
  let gameState = {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    totalPairs: 0,
    moves: 0,
    score: 0,
    level: 1,
    hintsLeft: 3,
    gameStarted: false,
    gamePaused: false,
    muted: false,
    timer: 0,
    timerInterval: null,
    difficulty: 'medium',
    theme: 'animals',
    boardSize: { rows: 6, cols: 6 }
  };

  // Tema İkonları - Her kategorideki ikonlar
  const themeIcons = {
    symbols: ['&#9824;', '&#9827;', '&#9829;', '&#9830;', '&#8634;', '&#8635;', '&#8630;', '&#8631;', 
              '&#8678;', '&#8679;', '&#8680;', '&#8681;', '&#8682;', '&#8683;', '&#9650;', '&#9660;', 
              '&#9665;', '&#9671;', '&#9675;', '&#9678;', '&#9679;', '&#9711;', '&#9733;', '&#9734;', 
              '&#9742;', '&#9743;', '&#9762;', '&#9763;', '&#9774;', '&#9775;', '&#9784;', '&#9785;'],
    animals: ['&#128000;', '&#128004;', '&#128005;', '&#128006;', '&#128007;', '&#128008;', '&#128009;', '&#128010;', 
              '&#128011;', '&#128012;', '&#128013;', '&#128014;', '&#128015;', '&#128016;', '&#128017;', '&#128018;', 
              '&#128019;', '&#128020;', '&#128021;', '&#128022;', '&#128023;', '&#128024;', '&#128025;', '&#128026;', 
              '&#128027;', '&#128028;', '&#128029;', '&#128030;', '&#128031;', '&#128032;', '&#128033;', '&#128034;'],
    food: ['&#127813;', '&#127814;', '&#127815;', '&#127816;', '&#127817;', '&#127818;', '&#127819;', '&#127820;', 
           '&#127821;', '&#127822;', '&#127823;', '&#127824;', '&#127825;', '&#127826;', '&#127827;', '&#127828;', 
           '&#127829;', '&#127830;', '&#127831;', '&#127832;', '&#127833;', '&#127834;', '&#127835;', '&#127836;', 
           '&#127837;', '&#127838;', '&#127839;', '&#127840;', '&#127841;', '&#127842;', '&#127843;', '&#127844;'],
    nature: ['&#127793;', '&#127794;', '&#127795;', '&#127796;', '&#127797;', '&#127798;', '&#127799;', '&#127800;', 
             '&#127801;', '&#127802;', '&#127803;', '&#127804;', '&#127805;', '&#127806;', '&#127807;', '&#127808;', 
             '&#127809;', '&#127810;', '&#127811;', '&#127812;', '&#9728;', '&#9729;', '&#9730;', '&#9731;', 
             '&#9732;', '&#9748;', '&#9788;', '&#9889;', '&#9924;', '&#9925;', '&#9928;', '&#127752;'],
    tech: ['&#128187;', '&#128189;', '&#128190;', '&#128241;', '&#128242;', '&#128243;', '&#128246;', '&#128247;', 
           '&#128249;', '&#128250;', '&#128251;', '&#128252;', '&#128253;', '&#128254;', '&#128255;', '&#128256;', 
           '&#128257;', '&#128258;', '&#128259;', '&#128260;', '&#128261;', '&#128262;', '&#128263;', '&#128264;', 
           '&#128265;', '&#128266;', '&#128267;', '&#128268;', '&#128269;', '&#128270;', '&#128271;', '&#128272;']
  };

  // Ses Efektleri
  const audioFiles = {
    flip: new Audio('/static/sounds/flip.mp3'),
    match: new Audio('/static/sounds/match.mp3'),
    mismatch: new Audio('/static/sounds/mismatch.mp3'),
    win: new Audio('/static/sounds/win.mp3'),
    hint: new Audio('/static/sounds/hint.mp3'),
    click: new Audio('/static/sounds/click.mp3'),
  };

  // Ses çalma fonksiyonu
  function playSound(sound) {
    if (!gameState.muted && audioFiles[sound]) {
      audioFiles[sound].currentTime = 0;
      audioFiles[sound].play().catch(error => {
        console.log('Ses çalma hatası: ', error);
      });
    }
  }

  // Kart boyutlarını ayarla
  function updateBoardSize() {
    switch (gameState.difficulty) {
      case 'easy':
        gameState.boardSize = { rows: 4, cols: 4 };
        gameBoard.className = 'memory-board easy-board';
        break;
      case 'medium':
        gameState.boardSize = { rows: 6, cols: 6 };
        gameBoard.className = 'memory-board medium-board';
        break;
      case 'hard':
      case 'expert':
        gameState.boardSize = { rows: 8, cols: 8 };
        gameBoard.className = 'memory-board hard-board';
        if (gameState.difficulty === 'expert') {
          gameBoard.className = 'memory-board expert-board';
        }
        break;
    }
  }

  // Kartların oluşturulması
  function createCards() {
    gameBoard.innerHTML = '';
    gameState.cards = [];
    gameState.flippedCards = [];
    gameState.matchedPairs = 0;

    const totalCards = gameState.boardSize.rows * gameState.boardSize.cols;
    gameState.totalPairs = totalCards / 2;

    // Mevcut temadan yeterli sayıda ikon seç
    const selectedIcons = [...themeIcons[gameState.theme]];
    shuffle(selectedIcons);
    const pairIcons = selectedIcons.slice(0, gameState.totalPairs);

    // Her ikon için çift oluştur
    const cardPairs = [...pairIcons, ...pairIcons];
    shuffle(cardPairs);

    // Tüm kartları oluştur
    for (let i = 0; i < totalCards; i++) {
      const card = document.createElement('div');
      card.className = 'memory-card';
      card.dataset.cardIndex = i;
      
      const cardBack = document.createElement('div');
      cardBack.className = 'card-face card-back';
      
      const cardFront = document.createElement('div');
      cardFront.className = 'card-face card-front';
      cardFront.innerHTML = cardPairs[i];
      
      card.appendChild(cardBack);
      card.appendChild(cardFront);
      
      card.addEventListener('click', () => flipCard(card, i));
      
      gameBoard.appendChild(card);
      gameState.cards.push({
        element: card,
        value: cardPairs[i],
        flipped: false,
        matched: false
      });
    }
  }

  // Kart çevirme fonksiyonu
  function flipCard(card, index) {
    // Eğer kart zaten eşleşmiş veya zaten iki kart çevrilmiş ise işlem yapma
    if (gameState.flippedCards.length >= 2 || 
        gameState.cards[index].flipped || 
        gameState.cards[index].matched ||
        !gameState.gameStarted ||
        gameState.gamePaused) {
      return;
    }

    // İlk hamleyi yaptığında zamanlayıcıyı başlat
    if (!gameState.timerInterval && gameState.gameStarted) {
      startTimer();
      hintBtn.disabled = false;
      pauseBtn.disabled = false;
    }

    // Kartı çevir
    gameState.cards[index].flipped = true;
    card.classList.add('flipped');
    gameState.flippedCards.push({ index, value: gameState.cards[index].value });
    playSound('flip');

    // İki kart çevrildiyse kontrol et
    if (gameState.flippedCards.length === 2) {
      gameState.moves++;
      movesDisplay.textContent = `Hamle: ${gameState.moves}`;
      
      const [firstCard, secondCard] = gameState.flippedCards;
      
      // Kartlar eşleşti mi?
      if (firstCard.value === secondCard.value) {
        // Eşleşme durumu
        setTimeout(() => {
          matchCards(firstCard.index, secondCard.index);
        }, 500);
      } else {
        // Eşleşmeme durumu
        setTimeout(() => {
          unmatchCards(firstCard.index, secondCard.index);
        }, 1000);
      }
    }
  }

  // Kartları eşleştir
  function matchCards(firstIndex, secondIndex) {
    playSound('match');
    
    gameState.cards[firstIndex].matched = true;
    gameState.cards[secondIndex].matched = true;
    
    // Eşleşen kartları görsel olarak işaretleme
    gameState.cards[firstIndex].element.classList.add('matched');
    gameState.cards[secondIndex].element.classList.add('matched');
    
    // Bonus puanı hesapla
    const timeBonus = Math.max(0, 30 - Math.floor(gameState.timer / 5)); // Daha hızlı eşleştirme = daha çok bonus
    const difficultyMultiplier = getDifficultyMultiplier();
    const matchScore = 100 + timeBonus * difficultyMultiplier;
    
    // Skoru güncelle
    gameState.score += matchScore;
    scoreDisplay.textContent = `Skor: ${gameState.score}`;
    
    // Eşleşen çift sayısını artır
    gameState.matchedPairs++;
    
    // Tüm eşleşmeler bulundu mu kontrol et
    if (gameState.matchedPairs === gameState.totalPairs) {
      setTimeout(() => {
        endGame(true);
      }, 500);
    }
    
    // Flipped kartları temizle
    gameState.flippedCards = [];
  }

  // Eşleşmeyen kartları geri çevir
  function unmatchCards(firstIndex, secondIndex) {
    playSound('mismatch');
    
    // Kartları görsel olarak işaretle
    gameState.cards[firstIndex].element.classList.add('mismatch');
    gameState.cards[secondIndex].element.classList.add('mismatch');
    
    // Kısa bir gecikmeden sonra normal hale getir
    setTimeout(() => {
      gameState.cards[firstIndex].element.classList.remove('mismatch', 'flipped');
      gameState.cards[secondIndex].element.classList.remove('mismatch', 'flipped');
      gameState.cards[firstIndex].flipped = false;
      gameState.cards[secondIndex].flipped = false;
      gameState.flippedCards = [];
    }, 500);
  }

  // Zamanlayıcıyı başlat
  function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
      if (!gameState.gamePaused) {
        gameState.timer++;
        updateTimerDisplay();
        
        // Uzman modunda zamana bağlı zorluk
        if (gameState.difficulty === 'expert') {
          const timeLimit = 180; // 3 dakika
          if (gameState.timer >= timeLimit) {
            endGame(false); // Zaman dolduğunda oyunu bitir
          }
        }
      }
    }, 1000);
  }

  // Zamanlayıcı ekranını güncelle
  function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timer / 60);
    const seconds = gameState.timer % 60;
    timerDisplay.textContent = `Süre: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  // Zorluk çarpanını hesapla
  function getDifficultyMultiplier() {
    switch (gameState.difficulty) {
      case 'easy': return 1;
      case 'medium': return 1.5;
      case 'hard': return 2;
      case 'expert': return 3;
      default: return 1;
    }
  }

  // Oyunu başlat
  function startGame() {
    // Önce oyun durumunu sıfırla
    gameState.cards = [];
    gameState.flippedCards = [];
    gameState.matchedPairs = 0;
    gameState.moves = 0;
    gameState.score = 0;
    gameState.timer = 0;
    gameState.hintsLeft = 3;
    gameState.gameStarted = true;
    gameState.gamePaused = false;
    
    // Zorluk seviyesini güncelle
    gameState.difficulty = difficultySelect.value;
    gameState.theme = themeSelect.value;
    
    // Board boyutunu güncelle
    updateBoardSize();
    
    // Kartları oluştur
    createCards();
    
    // Ekranı güncelle
    levelDisplay.textContent = `Seviye: ${gameState.level}`;
    timerDisplay.textContent = `Süre: 0:00`;
    scoreDisplay.textContent = `Skor: 0`;
    movesDisplay.textContent = `Hamle: 0`;
    hintsLeftDisplay.textContent = `(${gameState.hintsLeft})`;
    
    // Butonları aktif/pasif yap
    newGameBtn.disabled = false;
    hintBtn.disabled = false;
    pauseBtn.disabled = false;
    
    // Mesajı kapat
    hideMessage();
    
    // Ses çal
    playSound('click');
    
    // Zamanlayıcıyı başlat
    updateTimerDisplay();
    
    // Kurulum tamamlandı, oyun aktif
    console.log("Oyun başlatıldı: ", gameState.difficulty, gameState.theme);
  }

  // Oyunu sonlandır
  function endGame(isWin) {
    clearInterval(gameState.timerInterval);
    gameState.gameStarted = false;
    
    if (isWin) {
      playSound('win');
      
      // Süre bonusu
      const timeBonus = calculateTimeBonus();
      
      // Hamle verimliliği bonusu
      const moveEfficiencyBonus = calculateMoveEfficiencyBonus();
      
      // Toplam skoru güncelle
      const totalBonus = timeBonus + moveEfficiencyBonus;
      gameState.score += totalBonus;
      
      // Skor ekranını güncelle
      scoreDisplay.textContent = `Skor: ${gameState.score}`;
      
      // Seviyeyi artır (bir sonraki oyun için)
      gameState.level++;
      
      // Mesajı göster
      showGameCompleteMessage(timeBonus, moveEfficiencyBonus);
      
      // Skorları kaydet (API varsa)
      saveScore();
    } else {
      // Oyun kaybedildiğinde
      showGameOverMessage();
    }
  }

  // Zaman bonusu hesapla
  function calculateTimeBonus() {
    // Zorluk seviyesine göre zaman bonusu hesapla
    const idealTime = getIdealTime();
    if (gameState.timer <= idealTime) {
      return Math.floor((idealTime - gameState.timer) * 10 * getDifficultyMultiplier());
    }
    return 0;
  }

  // İdeal süreyi zorluk seviyesine göre hesapla
  function getIdealTime() {
    switch (gameState.difficulty) {
      case 'easy': return 60; // 1 dakika
      case 'medium': return 120; // 2 dakika
      case 'hard': return 180; // 3 dakika
      case 'expert': return 120; // 2 dakika (daha zor ama daha hızlı olmalı)
      default: return 120;
    }
  }

  // Hamle verimliliği bonusu hesapla
  function calculateMoveEfficiencyBonus() {
    const minMoves = gameState.totalPairs * 2; // Teorik minimum hamle sayısı
    const maxMoves = gameState.totalPairs * 4; // Makul maksimum hamle sayısı
    
    if (gameState.moves <= minMoves) {
      // Mümkün olan en iyi hamle sayısı - maksimum bonus
      return 1000 * getDifficultyMultiplier();
    } else if (gameState.moves < maxMoves) {
      // Verimlilik azaldıkça azalan bonus
      const ratio = 1 - ((gameState.moves - minMoves) / (maxMoves - minMoves));
      return Math.floor(1000 * ratio * getDifficultyMultiplier());
    }
    return 0;
  }

  // Skoru kaydet (API varsa)
  function saveScore() {
    // Skorları kaydetmek için API çağrısı
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        game_type: 'memory_cards',
        score: gameState.score,
        metadata: {
          level: gameState.level - 1,
          difficulty: gameState.difficulty,
          time: gameState.timer,
          moves: gameState.moves
        }
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

  // İpucu göster
  function showHint() {
    if (gameState.hintsLeft <= 0 || 
        !gameState.gameStarted || 
        gameState.gamePaused ||
        gameState.flippedCards.length >= 2) {
      return;
    }
    
    playSound('hint');
    
    // İpucu sayısını azalt
    gameState.hintsLeft--;
    hintsLeftDisplay.textContent = `(${gameState.hintsLeft})`;
    if (gameState.hintsLeft <= 0) {
      hintBtn.disabled = true;
    }
    
    // Henüz eşleşmemiş kartlardan rastgele bir çift seç
    const unmatchedIndices = gameState.cards
      .map((card, index) => (!card.matched ? index : -1))
      .filter(index => index !== -1);
    
    if (unmatchedIndices.length <= 0) return;
    
    // Rastgele bir değer seç
    const randomIndex = Math.floor(Math.random() * unmatchedIndices.length);
    const targetIndex = unmatchedIndices[randomIndex];
    const targetValue = gameState.cards[targetIndex].value;
    
    // Bu değere sahip tüm kartları bul
    const matchingIndices = gameState.cards
      .map((card, index) => (card.value === targetValue ? index : -1))
      .filter(index => index !== -1);
    
    // Bu kartları kısa süreliğine göster
    matchingIndices.forEach(index => {
      const card = gameState.cards[index].element;
      card.classList.add('flipped');
      
      setTimeout(() => {
        if (!gameState.cards[index].matched) {
          card.classList.remove('flipped');
        }
      }, 1000);
    });
  }

  // Oyunu duraklat/devam ettir
  function togglePause() {
    if (!gameState.gameStarted) return;
    
    gameState.gamePaused = !gameState.gamePaused;
    
    if (gameState.gamePaused) {
      pauseBtn.innerHTML = '<i class="fas fa-play"></i> Devam Et';
      gameBoard.classList.add('paused');
      showMessage('Oyun Duraklatıldı', 'Devam etmek için "Devam Et" butonuna tıklayın.', false);
    } else {
      pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Duraklat';
      gameBoard.classList.remove('paused');
      hideMessage();
    }
    
    playSound('click');
  }

  // Sesi kapat/aç
  function toggleMute() {
    gameState.muted = !gameState.muted;
    
    if (gameState.muted) {
      muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i> Ses Kapalı';
    } else {
      muteBtn.innerHTML = '<i class="fas fa-volume-up"></i> Ses';
      playSound('click');
    }
  }

  // Mesaj göster
  function showMessage(title, text, showStats = false) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    
    if (showStats) {
      messageStats.classList.remove('hidden');
      finalTimeDisplay.textContent = `Süre: ${formatTime(gameState.timer)}`;
      finalScoreDisplay.textContent = `Skor: ${gameState.score} puan`;
      finalMovesDisplay.textContent = `Hamle: ${gameState.moves}`;
      playAgainBtn.classList.remove('hidden');
    } else {
      messageStats.classList.add('hidden');
      playAgainBtn.classList.add('hidden');
    }
    
    gameMessage.classList.remove('hidden');
  }

  // Oyun tamamlandı mesajını göster
  function showGameCompleteMessage(timeBonus, moveBonus) {
    const difficultyName = getDifficultyName();
    let message = `Tebrikler! ${difficultyName} seviyesini tamamladınız.`;
    
    if (timeBonus > 0 || moveBonus > 0) {
      message += '\n\nBonus Puanlar:';
      if (timeBonus > 0) message += `\nHızlı Tamamlama: +${timeBonus} puan`;
      if (moveBonus > 0) message += `\nVerimli Hamleler: +${moveBonus} puan`;
    }
    
    showMessage('Seviye Tamamlandı!', message, true);
  }

  // Oyun kaybedildi mesajını göster
  function showGameOverMessage() {
    showMessage('Zaman Doldu!', 'Maalesef oyunu zamanında tamamlayamadınız. Tekrar denemek ister misiniz?', true);
  }

  // Mesajı gizle
  function hideMessage() {
    gameMessage.classList.add('hidden');
  }

  // Süreyi formatlı hale getir
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Zorluk seviyesi adını döndür
  function getDifficultyName() {
    switch (gameState.difficulty) {
      case 'easy': return 'Kolay';
      case 'medium': return 'Orta';
      case 'hard': return 'Zor';
      case 'expert': return 'Uzman';
      default: return 'Bilinmeyen';
    }
  }

  // Diziyi karıştır (Fisher-Yates Shuffle)
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Event Listeners
  newGameBtn.addEventListener('click', startGame);
  hintBtn.addEventListener('click', showHint);
  pauseBtn.addEventListener('click', togglePause);
  muteBtn.addEventListener('click', toggleMute);
  closeMessageBtn.addEventListener('click', hideMessage);
  playAgainBtn.addEventListener('click', startGame);
  
  difficultySelect.addEventListener('change', () => {
    if (!gameState.gameStarted) {
      gameState.difficulty = difficultySelect.value;
      updateBoardSize();
    }
  });
  
  themeSelect.addEventListener('change', () => {
    if (!gameState.gameStarted) {
      gameState.theme = themeSelect.value;
    }
  });

  // Başlangıç mesajını göster
  showMessage('Modern Hafıza Kartları', 'Hafızanızı test etmeye hazır mısınız? Başlamak için "Yeni Oyun" butonuna tıklayın.', false);
});