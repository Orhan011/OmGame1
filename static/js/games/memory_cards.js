/**
 * Hafıza Kartları Oyunu - v2.0
 * 
 * Görsel hafıza ve eşleştirme yeteneklerini geliştiren interaktif oyun.
 * Kullanıcılar, çift sayıda kartı çevirerek eşleşenleri bulmaya çalışır.
 */

document.addEventListener('DOMContentLoaded', function() {
  // HTML Elementleri
  const introSection = document.getElementById('intro-section');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const startGameBtn = document.getElementById('start-game');
  const playAgainBtn = document.getElementById('play-again');
  const pauseGameBtn = document.getElementById('pause-game');
  const resumeGameBtn = document.getElementById('resume-game');
  const restartGameBtn = document.getElementById('restart-game');
  const soundToggleBtn = document.getElementById('sound-toggle');
  const pauseOverlay = document.getElementById('pause-overlay');
  const grid = document.getElementById('memory-cards-grid');
  const difficultyButtons = document.querySelectorAll('.level-btn');
  const themeButtons = document.querySelectorAll('.theme-btn');
  const alertContainer = document.getElementById('alert-container');

  // Skor ve İstatistik Göstergeleri
  const scoreDisplay = document.getElementById('score-display');
  const timerDisplay = document.getElementById('timer-display');
  const movesDisplay = document.getElementById('moves-display');
  const streakDisplay = document.getElementById('streak-display');
  const currentLevelDisplay = document.getElementById('current-level');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');
  
  // Sonuç Göstergeleri
  const finalScore = document.getElementById('final-score');
  const finalMoves = document.getElementById('final-moves');
  const finalTime = document.getElementById('final-time');
  const ratingStars = document.getElementById('rating-stars');
  const ratingText = document.getElementById('rating-text');
  const gameAchievement = document.getElementById('game-achievement');
  const achievementName = document.getElementById('achievement-name');
  const gameResultTitle = document.getElementById('game-result-title');
  
  // Paylaşım Düğmeleri
  const copyScoreBtn = document.getElementById('copy-score');
  const shareScoreBtn = document.getElementById('share-score');
  
  // Oyun Durumu
  let gameActive = false;      // Oyun aktif durumda mı?
  let gamePaused = false;      // Oyun duraklatıldı mı?
  let soundEnabled = true;     // Ses açık mı?
  let difficulty = 'EASY';     // Zorluk seviyesi
  let themeIndex = 0;          // Tema indeksi
  let currentLevel = 1;        // Geçerli seviye
  let score = 0;               // Toplam puan
  let moves = 0;               // Hamle sayısı
  let streak = 0;              // Seri doğru eşleştirme sayısı
  let bestStreak = 0;          // En iyi seri
  let timer = 0;               // Süre (saniye)
  let timerInterval = null;    // Süre sayacı
  let cards = [];              // Kart nesneleri
  let flippedCards = [];       // Çevrilmiş kart referansları
  let matchedPairs = 0;        // Eşleştirilmiş çift sayısı
  let totalPairs = 0;          // Toplam çift sayısı
  
  // Zorluk Ayarları
  const DIFFICULTIES = {
    EASY: {
      gridSize: { rows: 4, cols: 4 },
      totalPairs: 8,
      timeLimit: 120,
      maxLevel: 3
    },
    MEDIUM: {
      gridSize: { rows: 4, cols: 5 },
      totalPairs: 10,
      timeLimit: 180,
      maxLevel: 4
    },
    HARD: {
      gridSize: { rows: 5, cols: 6 },
      totalPairs: 15,
      timeLimit: 240,
      maxLevel: 5
    }
  };
  
  // Oyun Temaları - Her temada farklı sembol setleri
  const THEMES = [
    // Emoji Teması
    ['😀', '😍', '🥳', '🤔', '😎', '🤩', '😴', '🙄', '🥶', '🥴', '🤯', '😱', '🤑', '🤠', '👻', '👽', '🤖', '👺', '🎃', '💩'],
    // İkon Teması
    ['♠', '♣', '♥', '♦', '★', '☂', '♫', '♪', '☀', '☁', '☾', '✿', '✈', '❤', '☎', '⌚', '⚓', '⚔', '⚽', '⛄'],
    // Hayvan Teması
    ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦉', '🦆', '🐝']
  ];
  
  // Olay Dinleyicileri
  function initEventListeners() {
    // Oyun başlatma
    startGameBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', resetGame);
    
    // Duraklatma kontrolleri
    pauseGameBtn.addEventListener('click', togglePause);
    resumeGameBtn.addEventListener('click', togglePause);
    restartGameBtn.addEventListener('click', restartGame);
    
    // Ses kontrolü
    soundToggleBtn.addEventListener('click', toggleSound);
    
    // Paylaşım butonları
    copyScoreBtn.addEventListener('click', copyScore);
    shareScoreBtn.addEventListener('click', shareScore);
    
    // Zorluk seçimi
    difficultyButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Aktif zorluk düğmesini güncelle
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Zorluğu ayarla
        difficulty = this.dataset.level;
      });
    });
    
    // Tema seçimi
    themeButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Aktif tema düğmesini güncelle
        themeButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Temayı ayarla
        themeIndex = parseInt(this.dataset.theme);
      });
    });
    
    // Pencere boyutu değiştiğinde kart boyutlarını ayarla
    window.addEventListener('resize', function() {
      if (gameActive) {
        adjustCardSize();
      }
    });
  }
  
  // Oyunu başlat
  function startGame() {
    // Oyun durumunu sıfırla
    gameActive = true;
    flippedCards = [];
    matchedPairs = 0;
    currentLevel = 1;
    score = 0;
    moves = 0;
    streak = 0;
    bestStreak = 0;
    timer = 0;
    
    // UI güncelle
    hideIntro();
    showGameContainer();
    updateUI();
    
    // İlk seviyeyi başlat
    startLevel();
    
    // Hata ayıklama için konsola bilgi
    console.log(`Oyun başlatıldı. Zorluk: ${difficulty}, Tema: ${themeIndex}`);
  }
  
  // Seviyeyi başlat
  function startLevel() {
    // Önceki zamanlayıcıyı temizle
    clearInterval(timerInterval);
    
    // Kart durumlarını sıfırla
    flippedCards = [];
    matchedPairs = 0;
    
    // UI güncelleme
    currentLevelDisplay.textContent = currentLevel;
    updateProgressBar();
    
    // Seviye parametrelerini al
    const params = DIFFICULTIES[difficulty];
    totalPairs = params.totalPairs;
    
    // Kartları oluştur
    createCards();
    
    // Kart boyutlarını ayarla
    adjustCardSize();
    
    // Zamanlayıcıyı sıfırla ve başlat
    timer = 0;
    updateTimerDisplay();
    startTimer();
    
    // Başlangıç mesajı göster
    showAlert(`Seviye ${currentLevel} Başladı!`, 'info');
  }
  
  // Kartları oluştur
  function createCards() {
    // Kart grid'ini temizle
    cards = [];
    grid.innerHTML = '';
    
    // Zorluk ayarlarını al
    const params = DIFFICULTIES[difficulty];
    const { rows, cols } = params.gridSize;
    
    // Grid boyutunu ayarla
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    
    // Kart sayısı
    const totalCards = rows * cols;
    
    // Çift sayıda kart olduğundan emin ol
    const cardCount = totalCards - (totalCards % 2);
    
    // Çift sayısı (her iki kart bir çift)
    const pairCount = cardCount / 2;
    
    // Seçilen temadan sembolleri al
    const symbols = THEMES[themeIndex];
    
    // Kart sembolleri dizisini oluştur (her sembolden 2 adet)
    const cardSymbols = [];
    for (let i = 0; i < pairCount; i++) {
      const symbol = symbols[i % symbols.length];
      cardSymbols.push(symbol, symbol);
    }
    
    // Sembolleri karıştır
    const shuffledSymbols = shuffleArray(cardSymbols);
    
    // Kartları oluştur ve kart alanına ekle
    for (let i = 0; i < cardCount; i++) {
      // Kart elemanını oluştur
      const card = document.createElement('div');
      card.className = 'memory-card';
      card.dataset.index = i;
      
      // Kart iç yapısı
      const cardInner = document.createElement('div');
      cardInner.className = 'card-inner';
      
      // Kart ön yüzü
      const cardFront = document.createElement('div');
      cardFront.className = 'card-front';
      
      // Kart arka yüzü
      const cardBack = document.createElement('div');
      cardBack.className = 'card-back';
      cardBack.innerHTML = `<span>${shuffledSymbols[i]}</span>`;
      
      // Elemanları birleştir
      cardInner.appendChild(cardFront);
      cardInner.appendChild(cardBack);
      card.appendChild(cardInner);
      
      // Kart tıklama olayı
      card.addEventListener('click', function() {
        flipCard(this);
      });
      
      // Kart alanına ekle
      grid.appendChild(card);
      
      // Kart verisini sakla
      cards.push({
        element: card,
        symbol: shuffledSymbols[i],
        isFlipped: false,
        isMatched: false
      });
    }
  }
  
  // Kart çevir
  function flipCard(cardElement) {
    // Oyun aktif değilse veya duraklatılmışsa çıkış yap
    if (!gameActive || gamePaused) return;
    
    // Kart indeksini al
    const index = parseInt(cardElement.dataset.index);
    const card = cards[index];
    
    // Zaten çevrilmiş veya eşleşmiş kartları kontrol et
    if (card.isFlipped || card.isMatched || flippedCards.length >= 2) return;
    
    // Kartı çevir
    card.isFlipped = true;
    cardElement.classList.add('flipped');
    flippedCards.push(card);
    
    // Kart çevirme sesi çal
    playSound('flip');
    
    // İki kart çevrildiyse kontrol et
    if (flippedCards.length === 2) {
      // Hamle sayısını artır
      moves++;
      updateMovesDisplay();
      
      // Kısa bir gecikme ile eşleşme kontrolü yap
      setTimeout(checkForMatch, 600);
    }
  }
  
  // Eşleşme kontrolü
  function checkForMatch() {
    // İki çevrilmiş kartı al
    const [card1, card2] = flippedCards;
    
    // Semboller eşleşiyor mu?
    if (card1.symbol === card2.symbol) {
      // Eşleşme Başarılı
      card1.isMatched = true;
      card2.isMatched = true;
      
      // Görsel geri bildirim için class ekle
      card1.element.classList.add('matched');
      card2.element.classList.add('matched');
      
      // Eşleşme sesi çal
      playSound('match');
      
      // Puan hesaplama
      streak++;
      if (streak > bestStreak) {
        bestStreak = streak;
      }
      
      // Temel puan ve bonuslar
      const basePoints = 50;
      const streakBonus = streak > 1 ? streak * 10 : 0;
      const timeBonus = Math.max(0, 100 - timer) * 0.2;
      const pointsEarned = Math.round(basePoints + streakBonus + timeBonus);
      
      // Puanları ekle
      score += pointsEarned;
      matchedPairs++;
      
      // Puan animasyonu ve UI güncelleme
      showPointsAnimation(card1.element, pointsEarned);
      updateScoreDisplay();
      updateStreakDisplay();
      
      // Tüm eşleşmeler tamamlandı mı?
      if (matchedPairs === totalPairs) {
        // Seviyeyi tamamla
        setTimeout(() => {
          completeLevel();
        }, 1000);
      }
    } else {
      // Eşleşme Başarısız
      card1.isFlipped = false;
      card2.isFlipped = false;
      
      // Görsel geri bildirim olarak kartları geri çevir
      card1.element.classList.remove('flipped');
      card2.element.classList.remove('flipped');
      
      // Seriyi sıfırla
      streak = 0;
      
      // Hata sesi çal
      playSound('wrong');
      
      // UI güncelle
      updateStreakDisplay();
    }
    
    // Çevrilmiş kartları temizle
    flippedCards = [];
  }
  
  // Puan animasyonu göster
  function showPointsAnimation(cardElement, points) {
    // Animasyon elementi oluştur
    const pointsElement = document.createElement('div');
    pointsElement.className = 'points-animation';
    pointsElement.textContent = `+${points}`;
    
    // Pozisyon hesaplama
    const rect = cardElement.getBoundingClientRect();
    const containerRect = grid.getBoundingClientRect();
    
    // Pozisyonu ayarla (kart üzerinde)
    pointsElement.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
    pointsElement.style.top = `${rect.top - containerRect.top + rect.height / 2}px`;
    
    // Animasyon elementini ekle
    grid.appendChild(pointsElement);
    
    // Animasyon tamamlandığında elementi kaldır
    setTimeout(() => {
      pointsElement.remove();
    }, 1000);
  }
  
  // Seviyeyi tamamla
  function completeLevel() {
    // Zamanlayıcıyı durdur
    clearInterval(timerInterval);
    
    // Bonus puanları hesapla
    const levelBonus = currentLevel * 100;
    const streakBonus = bestStreak * 20;
    const movesBonus = Math.max(0, 500 - (moves * 10));
    const timeBonus = Math.max(0, 300 - (timer * 2));
    
    // Toplam bonusu ekle
    const totalBonus = levelBonus + streakBonus + movesBonus + timeBonus;
    score += totalBonus;
    
    // Seviyeyi artır
    currentLevel++;
    
    // Bonus mesajı göster
    showAlert(`Seviye Tamamlandı! Bonus: +${totalBonus} Puan!`, 'success');
    updateScoreDisplay();
    
    // Seviye atlama sesi çal
    playSound('levelUp');
    
    // Maksimum seviyeye ulaşıldı mı?
    if (currentLevel > DIFFICULTIES[difficulty].maxLevel) {
      // Oyunu bitir (Tüm seviyeler tamamlandı)
      setTimeout(() => {
        endGame(true);
      }, 1500);
    } else {
      // Sonraki seviyeye geç
      setTimeout(() => {
        startLevel();
      }, 1500);
    }
  }
  
  // Kart boyutlarını ayarla
  function adjustCardSize() {
    // Oyun aktif değilse çıkış yap
    if (!gameActive) return;
    
    // Oyun parametrelerini al
    const params = DIFFICULTIES[difficulty];
    const { rows, cols } = params.gridSize;
    
    // Kart boyutlarını hesapla
    const containerWidth = grid.parentElement.offsetWidth;
    const containerHeight = Math.min(window.innerHeight * 0.6, 500);
    
    // Boşluk hesaba katılarak kart boyutlarını ayarla
    const gapSize = 12; // CSS'deki grid-gap değeri
    const cardWidth = Math.floor((containerWidth - (gapSize * (cols - 1))) / cols);
    const cardHeight = Math.floor((containerHeight - (gapSize * (rows - 1))) / rows);
    
    // Kare kart için daha küçük olanı seç
    const size = Math.min(cardWidth, cardHeight);
    
    // Grid içindeki tüm kartlara stili uygula
    grid.style.width = `${cols * size + (cols - 1) * gapSize}px`;
    grid.style.height = `${rows * size + (rows - 1) * gapSize}px`;
  }
  
  // Zamanlayıcı başlat
  function startTimer() {
    // Önceki zamanlayıcıyı temizle
    clearInterval(timerInterval);
    
    // Yeni zamanlayıcı başlat
    timerInterval = setInterval(function() {
      // Süreyi artır
      timer++;
      
      // Süre göstergesini güncelle
      updateTimerDisplay();
      
      // Süre limiti kontrolü
      const timeLimit = DIFFICULTIES[difficulty].timeLimit;
      if (timer >= timeLimit) {
        // Süre doldu, oyunu bitir
        clearInterval(timerInterval);
        endGame(false);
      }
    }, 1000);
  }
  
  // Oyunu bitir
  function endGame(completed = false) {
    // Oyunu durdur
    gameActive = false;
    clearInterval(timerInterval);
    
    // Sonuç ekranını hazırla
    prepareResultScreen(completed);
    
    // UI güncelleme
    hideGameContainer();
    showGameOverScreen();
    
    // Sonuç sesi çal
    playSound('win');
    
    // Skoru kaydet
    saveScore();
  }
  
  // Sonuç ekranını hazırla
  function prepareResultScreen(completed) {
    // Sonuç verilerini göster
    finalScore.textContent = score;
    finalMoves.textContent = moves;
    finalTime.textContent = formatTime(timer);
    
    // Sonuç başlığını ayarla
    if (completed) {
      gameResultTitle.textContent = 'Tebrikler! Tüm Seviyeleri Tamamladınız!';
    } else {
      gameResultTitle.textContent = 'Oyun Tamamlandı!';
    }
    
    // Performans puanı hesapla
    const timeScore = Math.max(0, 1 - (timer / (DIFFICULTIES[difficulty].timeLimit)));
    const movesScore = Math.max(0, 1 - (moves / (totalPairs * 3)));
    const streakScore = bestStreak / totalPairs;
    
    const performanceScore = (timeScore * 0.3) + (movesScore * 0.4) + (streakScore * 0.3);
    
    // Yıldız derecesini belirle
    let stars = 0;
    if (performanceScore >= 0.9) stars = 5;
    else if (performanceScore >= 0.75) stars = 4;
    else if (performanceScore >= 0.6) stars = 3;
    else if (performanceScore >= 0.4) stars = 2;
    else stars = 1;
    
    // Yıldızları göster
    updateRatingStarsDisplay(stars);
    
    // Performans değerlendirme metni
    const ratingTexts = ['Geliştirebilirsin', 'İyi', 'Harika', 'Mükemmel', 'Olağanüstü!'];
    ratingText.textContent = ratingTexts[Math.min(stars - 1, 4)];
    
    // Başarımları kontrol et
    checkAchievements();
  }
  
  // Başarımları kontrol et
  function checkAchievements() {
    let achievement = null;
    
    // Başarım kuralları
    if (score >= 5000) {
      achievement = {
        name: 'Hafıza Devi',
        description: '5000 puan sınırını aştın!'
      };
    } else if (bestStreak >= 5) {
      achievement = {
        name: 'Akıcı Hafıza',
        description: '5 kartı art arda eşleştirdin!'
      };
    } else if (currentLevel >= 5) {
      achievement = {
        name: 'Seviye Ustası',
        description: '5. seviyeye ulaştın!'
      };
    }
    
    // Başarım kazanıldıysa göster
    if (achievement) {
      showAchievement(achievement);
    } else {
      gameAchievement.style.display = 'none';
    }
  }
  
  // Başarımı göster
  function showAchievement(achievement) {
    achievementName.textContent = achievement.name;
    gameAchievement.style.display = 'flex';
  }
  
  // Yıldız derecelendirmesini güncelle
  function updateRatingStarsDisplay(starsCount) {
    const stars = ratingStars.querySelectorAll('i');
    
    for (let i = 0; i < stars.length; i++) {
      if (i < starsCount) {
        stars[i].className = 'fas fa-star';
      } else {
        stars[i].className = 'far fa-star';
      }
    }
  }
  
  // Skoru kaydet
  function saveScore() {
    // Skor 0'dan büyükse kaydet
    if (score <= 0) return;
    
    // Oyun türü
    const gameType = 'memoryCards';
    
    // Skoru backend'e gönder
    console.log("Skor gönderiliyor:", score);
    
    fetch('/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: gameType,
        score: score
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Skor başarıyla kaydedildi:', data);
    })
    .catch(error => {
      console.error('Skor kaydetme hatası:', error);
    });
  }
  
  // Skoru kopyala
  function copyScore() {
    const scoreText = `Hafıza Kartları oyununda ${score} puan kazandım!`;
    
    navigator.clipboard.writeText(scoreText)
      .then(() => {
        showAlert('Skor panoya kopyalandı!', 'success');
      })
      .catch(() => {
        showAlert('Skoru kopyalarken bir hata oluştu.', 'error');
      });
  }
  
  // Skoru paylaş
  function shareScore() {
    const scoreText = `Hafıza Kartları oyununda ${score} puan kazandım!`;
    
    // Web Share API desteğini kontrol et
    if (navigator.share) {
      navigator.share({
        title: 'Hafıza Kartları Oyunu Skorumu Paylaş',
        text: scoreText,
        url: window.location.href
      })
      .then(() => {
        showAlert('Skor başarıyla paylaşıldı!', 'success');
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          showAlert('Paylaşım sırasında bir hata oluştu.', 'error');
        }
      });
    } else {
      // Web Share API desteklenmiyorsa kopyala
      copyScore();
    }
  }
  
  // Oyunu sıfırla
  function resetGame() {
    // Oyun ekranını gizle
    hideGameOverScreen();
    
    // Tekrar başlat
    startGame();
  }
  
  // Oyunu yeniden başlat
  function restartGame() {
    // Duraklatma menüsünü kapat
    pauseOverlay.style.display = 'none';
    gamePaused = false;
    
    // Oyunu sıfırla
    resetGame();
  }
  
  // Oyunu duraklat/devam ettir
  function togglePause() {
    if (!gameActive) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
      // Süre sayacını durdur
      clearInterval(timerInterval);
      
      // Duraklama menüsünü göster
      pauseOverlay.style.display = 'flex';
    } else {
      // Duraklama menüsünü gizle
      pauseOverlay.style.display = 'none';
      
      // Süre sayacını tekrar başlat
      startTimer();
    }
  }
  
  // Sesi aç/kapat
  function toggleSound() {
    soundEnabled = !soundEnabled;
    
    // Buton görünümünü güncelle
    if (soundEnabled) {
      soundToggleBtn.classList.add('active');
      soundToggleBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    } else {
      soundToggleBtn.classList.remove('active');
      soundToggleBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
  }
  
  // Ses çal
  function playSound(soundName) {
    // Ses kapalıysa çıkış
    if (!soundEnabled) return;
    
    try {
      // Web Audio API desteğini kontrol et
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Ses parametrelerini ayarla
      switch(soundName) {
        case 'flip':
          oscillator.type = 'sine';
          oscillator.frequency.value = 600;
          gainNode.gain.value = 0.1;
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.1);
          break;
          
        case 'match':
          oscillator.type = 'sine';
          oscillator.frequency.value = 800;
          gainNode.gain.value = 0.2;
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
          
        case 'wrong':
          oscillator.type = 'sine';
          oscillator.frequency.value = 300;
          gainNode.gain.value = 0.2;
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
          
        case 'win':
          playSuccessSound(audioContext);
          break;
          
        case 'levelUp':
          playLevelUpSound(audioContext);
          break;
      }
    } catch (error) {
      // Ses hatası sessizce geç
      console.log("Ses çalma hatası:", error.message);
    }
  }
  
  // Başarı sesi çal
  function playSuccessSound(audioContext) {
    const frequencies = [500, 700, 900];
    const duration = 0.15;
    
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0.2;
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.start();
        osc.stop(audioContext.currentTime + duration);
      }, index * (duration * 1000));
    });
  }
  
  // Seviye atlama sesi çal
  function playLevelUpSound(audioContext) {
    const frequencies = [400, 600, 800];
    const duration = 0.15;
    
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0.2;
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.start();
        osc.stop(audioContext.currentTime + duration);
      }, index * (duration * 1000));
    });
  }
  
  // Uyarı mesajı göster
  function showAlert(message, type = 'info') {
    // Mevcut uyarıyı temizle
    alertContainer.innerHTML = '';
    
    // Yeni uyarı elementi oluştur
    const alertElement = document.createElement('div');
    alertElement.className = `alert-message ${type}`;
    alertElement.textContent = message;
    alertContainer.appendChild(alertElement);
    
    // Uyarıyı görünür yap
    setTimeout(() => {
      alertElement.classList.add('show');
    }, 10);
    
    // Uyarıyı belli bir süre sonra kaldır
    setTimeout(() => {
      alertElement.classList.remove('show');
      setTimeout(() => {
        alertElement.remove();
      }, 300);
    }, 3000);
  }
  
  // İlerleme çubuğunu güncelle
  function updateProgressBar() {
    if (!gameActive) return;
    
    // Maksimum seviyeyi al
    const maxLevel = DIFFICULTIES[difficulty].maxLevel;
    
    // İlerleme yüzdesini hesapla
    const progress = ((currentLevel - 1) / maxLevel) * 100;
    
    // İlerleme çubuğunu güncelle
    progressBar.style.width = `${progress}%`;
    progressPercent.textContent = `${Math.round(progress)}%`;
  }
  
  // UI göstergelerini güncelle
  function updateUI() {
    updateScoreDisplay();
    updateMovesDisplay();
    updateTimerDisplay();
    updateStreakDisplay();
  }
  
  // Süre göstergesini güncelle
  function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timer);
  }
  
  // Hamle göstergesini güncelle
  function updateMovesDisplay() {
    movesDisplay.textContent = moves;
  }
  
  // Seri göstergesini güncelle
  function updateStreakDisplay() {
    streakDisplay.textContent = streak;
  }
  
  // Skor göstergesini güncelle
  function updateScoreDisplay() {
    scoreDisplay.textContent = score;
  }
  
  // Zamanı formatla
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  
  // UI yardımcı fonksiyonları
  function hideIntro() {
    introSection.style.display = 'none';
  }
  
  function showGameContainer() {
    gameContainer.style.display = 'block';
  }
  
  function hideGameContainer() {
    gameContainer.style.display = 'none';
  }
  
  function showGameOverScreen() {
    gameOverContainer.style.display = 'block';
  }
  
  function hideGameOverScreen() {
    gameOverContainer.style.display = 'none';
  }
  
  // Diziyi karıştır
  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
  
  // Başlangıç işlemleri
  function initialize() {
    // Olay dinleyicilerini ekle
    initEventListeners();
  }
  
  // Oyunu başlat
  initialize();
});