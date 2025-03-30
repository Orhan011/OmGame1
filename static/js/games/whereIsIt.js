// Kim Nerede (Where Is It) Oyunu
document.addEventListener('DOMContentLoaded', function() {
  const gameContainer = document.getElementById('game-container');
  const startScreen = document.getElementById('start-screen');
  const startButton = document.getElementById('start-game');
  const timerDisplay = document.getElementById('timer-display');
  const scoreDisplay = document.getElementById('score-display');
  const roundDisplay = document.getElementById('round-display');
  const characterImage = document.getElementById('character-image');
  const mapContainer = document.getElementById('map-container');
  const resultPopup = document.getElementById('result-popup');
  const resultMessage = document.getElementById('result-message');
  const resultScore = document.getElementById('result-score');
  const nextRoundBtn = document.getElementById('next-round-btn');
  const gameOverBtn = document.getElementById('game-over-btn');
  const progressBar = document.getElementById('progress-bar');
  const backBtn = document.querySelector('.standard-back-btn');

  // Ses efektleri için yapı
  const sounds = {};
  let soundsLoaded = false;
  let soundEnabled = true;e;

  // Sesleri pre-load etme
  function loadSounds() {
    try {
      sounds.correct = new Audio('/static/sounds/correct.mp3');
      sounds.wrong = new Audio('/static/sounds/wrong.mp3');
      sounds.click = new Audio('/static/sounds/click.mp3');
      sounds.success = new Audio('/static/sounds/success.mp3');
      sounds.gameOver = new Audio('/static/sounds/game-over.mp3');
      
      soundsLoaded = true;
      return true;
    } catch (error) {
      console.log("Ses yüklenirken hata oluştu:", error);
      soundsLoaded = false;
      return false;
    }
  }
  
  // SVG harita yükle
  function loadMap() {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;
    
    fetch('/static/images/turkey-map.svg')
      .then(response => response.text())
      .then(svgContent => {
        mapContainer.innerHTML = svgContent;
        
        // Bölgelere tıklama olayı ekle
        setTimeout(() => {
          const regions = mapContainer.querySelectorAll('.region');
          regions.forEach(region => {
            region.addEventListener('click', function(e) {
              if (gameState.isAnswerPhase) {
                const regionId = this.id;
                checkAnswer(regionId);
              }
            });
          });
        }, 100);
      })
      .catch(error => {
        console.error('Harita yüklenirken hata oluştu:', error);
        mapContainer.innerHTML = '<div class="alert alert-danger">Harita yüklenemedi</div>';
      });
  }
  
  // Sesler en başta yüklensin
  loadSounds();

  // Ses açma/kapama butonu ekle
  const gameHeader = document.createElement('div');
  gameHeader.className = 'game-header';
  gameHeader.innerHTML = `
    <div class="game-controls-top">
      <button id="sound-toggle" class="game-control-btn active" title="Sesi Aç/Kapat">
        <i class="fas fa-volume-up"></i>
      </button>
    </div>
  `;
  gameContainer.insertBefore(gameHeader, gameContainer.firstChild);

  // Ses açma/kapama olayı
  const soundToggleBtn = document.getElementById('sound-toggle');
  soundToggleBtn.addEventListener('click', function() {
    soundEnabled = !soundEnabled;
    
    if (soundEnabled) {
      soundToggleBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      soundToggleBtn.classList.add('active');
    } else {
      soundToggleBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
      soundToggleBtn.classList.remove('active');
    }
  });
  
  // Oyun durumu
  const gameState = {
    round: 0,
    maxRounds: 10,
    score: 0,
    timer: 20,
    interval: null,
    isAnswerPhase: false,
    correctRegion: '',
    characters: [
      { name: 'İstanbul', regionId: 'istanbul', image: '/static/images/characters/istanbul.jpg' },
      { name: 'Ankara', regionId: 'ankara', image: '/static/images/characters/ankara.jpg' },
      { name: 'İzmir', regionId: 'izmir', image: '/static/images/characters/izmir.jpg' },
      { name: 'Antalya', regionId: 'antalya', image: '/static/images/characters/antalya.jpg' },
      { name: 'Trabzon', regionId: 'trabzon', image: '/static/images/characters/trabzon.jpg' },
      { name: 'Diyarbakır', regionId: 'diyarbakir', image: '/static/images/characters/diyarbakir.jpg' },
      { name: 'Bursa', regionId: 'bursa', image: '/static/images/characters/bursa.jpg' },
      { name: 'Konya', regionId: 'konya', image: '/static/images/characters/konya.jpg' },
      { name: 'Adana', regionId: 'adana', image: '/static/images/characters/adana.jpg' },
      { name: 'Samsun', regionId: 'samsun', image: '/static/images/characters/samsun.jpg' }
    ]
  };
  
  // Oyunu başlat butonu
  if (startButton) {
    startButton.addEventListener('click', function() {
      if (startScreen) startScreen.style.display = 'none';
      if (gameContainer) gameContainer.style.display = 'block';
      
      // SVG haritasını yükle
      loadMap();
      
      // İlk turu başlat
      startNewRound();
      
      // Ses çal
      playSound('click');
    });
  }
  
  // Yeni tur başlat
  function startNewRound() {
    gameState.round++;
    gameState.isAnswerPhase = true;
    
    // Tur göstergesini güncelle
    if (roundDisplay) {
      roundDisplay.textContent = gameState.round + '/' + gameState.maxRounds;
    }
    
    // Karakteri seç
    const characterIndex = gameState.round - 1;
    const currentCharacter = gameState.characters[characterIndex];
    gameState.correctRegion = currentCharacter.regionId;
    
    // Karakter görselini göster
    if (characterImage) {
      characterImage.innerHTML = `
        <img src="${currentCharacter.image}" alt="${currentCharacter.name}" onerror="this.src='/static/images/placeholder.jpg'">
        <div class="character-name">${currentCharacter.name}</div>
      `;
    }
    
    // Süreyi başlat
    gameState.timer = 20;
    if (timerDisplay) timerDisplay.textContent = gameState.timer;
    
    if (gameState.interval) {
      clearInterval(gameState.interval);
    }
    
    gameState.interval = setInterval(function() {
      gameState.timer--;
      if (timerDisplay) timerDisplay.textContent = gameState.timer;
      
      // İlerleme çubuğunu güncelle
      const progress = (gameState.timer / 20) * 100;
      if (progressBar) progressBar.style.width = progress + '%';
      
      if (gameState.timer <= 0) {
        clearInterval(gameState.interval);
        checkAnswer('');  // Zaman dolduğunda otomatik "yanlış" cevap
      }
    }, 1000);
  }
  
  // Cevabı kontrol et
  function checkAnswer(regionId) {
    if (!gameState.isAnswerPhase) return;
    gameState.isAnswerPhase = false;
    
    clearInterval(gameState.interval);
    
    const mapContainer = document.getElementById('map-container');
    const regions = mapContainer.querySelectorAll('.region');
    
    // Doğru bölge vurgulanır
    const correctRegion = document.getElementById(gameState.correctRegion);
    
    if (regionId === gameState.correctRegion) {
      // Doğru cevap
      playSound('correct');
      
      // Kalan zamana göre puan hesapla (en fazla 100)
      const timeBonus = gameState.timer * 5;
      const roundScore = Math.min(100, 50 + timeBonus);
      gameState.score += roundScore;
      
      if (correctRegion) correctRegion.classList.add('correct-region');
      if (resultMessage) resultMessage.textContent = 'Doğru!';
      if (resultScore) resultScore.textContent = '+' + roundScore;
      if (scoreDisplay) scoreDisplay.textContent = gameState.score;
    } else {
      // Yanlış cevap
      playSound('wrong');
      
      // Seçilen bölgeyi işaretle (eğer seçildiyse)
      if (regionId) {
        const selectedRegion = document.getElementById(regionId);
        if (selectedRegion) selectedRegion.classList.add('incorrect-region');
      }
      
      // Doğru bölgeyi işaretle
      if (correctRegion) correctRegion.classList.add('correct-region');
      
      if (resultMessage) resultMessage.textContent = 'Yanlış!';
      if (resultScore) resultScore.textContent = '+0';
    }
    
    // Sonuç popup'ını göster
    if (resultPopup) resultPopup.style.display = 'flex';
    
    // Son tur ise "Bitir" butonunu göster
    if (gameState.round >= gameState.maxRounds) {
      if (nextRoundBtn) nextRoundBtn.style.display = 'none';
      if (gameOverBtn) gameOverBtn.style.display = 'block';
    } else {
      if (nextRoundBtn) nextRoundBtn.style.display = 'block';
      if (gameOverBtn) gameOverBtn.style.display = 'none';
    }
  }
  
  // Sonraki tur butonu
  if (nextRoundBtn) {
    nextRoundBtn.addEventListener('click', function() {
      if (resultPopup) resultPopup.style.display = 'none';
      
      // Haritayı temizle
      const mapContainer = document.getElementById('map-container');
      const regions = mapContainer.querySelectorAll('.region');
      regions.forEach(region => {
        region.classList.remove('correct-region', 'incorrect-region', 'highlighted-region');
      });
      
      // Sonraki turu başlat
      startNewRound();
      
      // Ses çal
      playSound('click');
    });
  }
  
  // Oyunu bitir butonu
  if (gameOverBtn) {
    gameOverBtn.addEventListener('click', function() {
      // Skor kaydetme işlemleri buraya eklenebilir
      
      // Ana sayfaya dön
      window.location.href = '/';
      
      // Ses çal
      playSound('success');
    });
  }
  
  // Ses çalma fonksiyonu
  function playSound(soundName) {
    try {
      if (soundEnabled && soundsLoaded && sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play();
      }
    } catch (error) {
      console.log("Sound play error:", error);
    }
  }
    }
  });

  // Ses oynatma fonksiyonu (güvenli)
  function playSound(sound) {
    if (!soundEnabled || !soundsLoaded) return;
    
    try {
      // Ses arayüz tarafından başlatılmış olmalı
      if (sounds[sound].paused) {
        sounds[sound].currentTime = 0;
        const playPromise = sounds[sound].play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Ses çalma hatası (normal):", error);
          });
        }
      } else {
        // Zaten çalıyorsa, yeni bir ses örneği oluştur
        const tempSound = new Audio(sounds[sound].src);
        tempSound.volume = 0.5;
        tempSound.play().catch(err => {
          console.log("Geçici ses çalma hatası (normal):", err);
        });
      }
    } catch (error) {
      console.log("Genel ses hatası:", error);
    }
  }

  // Oyun durumu
  let gameState = {
    isPlaying: false,
    currentRound: 0,
    score: 0,
    timer: 0,
    maxTime: 20,
    characters: [
      { id: 'char1', name: 'Mehmet', image: '/static/images/whereIsIt/char1.png', x: 25, y: 35 },
      { id: 'char2', name: 'Ayşe', image: '/static/images/whereIsIt/char2.png', x: 75, y: 15 },
      { id: 'char3', name: 'Ali', image: '/static/images/whereIsIt/char3.png', x: 60, y: 70 },
      { id: 'char4', name: 'Zeynep', image: '/static/images/whereIsIt/char4.png', x: 10, y: 85 },
      { id: 'char5', name: 'Ahmet', image: '/static/images/whereIsIt/char5.png', x: 90, y: 45 },
      { id: 'char6', name: 'Fatma', image: '/static/images/whereIsIt/char6.png', x: 40, y: 20 },
      { id: 'char7', name: 'Mustafa', image: '/static/images/whereIsIt/char7.png', x: 30, y: 60 },
      { id: 'char8', name: 'Emine', image: '/static/images/whereIsIt/char8.png', x: 80, y: 80 }
    ],
    currentCharacter: null,
    maxRounds: 10,
    difficulty: 'MEDIUM',
    roundResults: [] // Her turun sonuçlarını takip etmek için
  };

  // Zorluk ayarları
  const difficultySettings = {
    EASY: { maxTime: 30, targetRadius: 15, scoreMultiplier: 1 },
    MEDIUM: { maxTime: 20, targetRadius: 10, scoreMultiplier: 1.5 },
    HARD: { maxTime: 15, targetRadius: 7, scoreMultiplier: 2 }
  };

  // Zorluk seviyesi butonları
  const difficultyButtons = document.querySelectorAll('.level-btn');
  difficultyButtons.forEach(button => {
    button.addEventListener('click', function() {
      difficultyButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      gameState.difficulty = this.getAttribute('data-level');

      // Zorluk ayarlarını uygula
      gameState.maxTime = difficultySettings[gameState.difficulty].maxTime;
      playSound('click');
    });
  });

  // Oyunu başlat
  startButton.addEventListener('click', function() {
    playSound('click');
    startGame();
  });

  // Sonraki tura geç butonu
  nextRoundBtn.addEventListener('click', function() {
    playSound('click');
    startNextRound();
  });

  // Oyun sonu butonu
  gameOverBtn.addEventListener('click', function() {
    playSound('click');
    finishGame();
  });

  // Harita tıklama olayı
  mapContainer.addEventListener('click', function(event) {
    if (!gameState.isPlaying) return;

    const rect = mapContainer.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    checkClick(x, y);
  });

  // Oyunu başlat
  function startGame() {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';

    // Oyun durumunu sıfırla
    gameState.currentRound = 0;
    gameState.score = 0;
    gameState.roundResults = []; // Tur sonuçlarını sıfırla
    scoreDisplay.textContent = '0';
    roundDisplay.textContent = '1/' + gameState.maxRounds;

    startNextRound();
  }

  // Sonraki turu başlat
  function startNextRound() {
    if (gameState.currentRound >= gameState.maxRounds) {
      finishGame();
      return;
    }

    gameState.currentRound++;
    roundDisplay.textContent = gameState.currentRound + '/' + gameState.maxRounds;
    resultPopup.style.display = 'none';

    // Karakteri rastgele seç
    const randomIndex = Math.floor(Math.random() * gameState.characters.length);
    gameState.currentCharacter = gameState.characters[randomIndex];

    // Karakteri göster
    characterImage.src = gameState.currentCharacter.image;
    document.getElementById('character-name').textContent = gameState.currentCharacter.name;

    // Zamanlayıcıyı başlat
    gameState.timer = gameState.maxTime;
    timerDisplay.textContent = gameState.timer;
    updateProgressBar();

    gameState.isPlaying = true;
    startTimer();
  }

  // Zamanlayıcıyı başlat
  function startTimer() {
    const timerInterval = setInterval(function() {
      if (!gameState.isPlaying) {
        clearInterval(timerInterval);
        return;
      }

      gameState.timer--;
      timerDisplay.textContent = gameState.timer;
      updateProgressBar();

      if (gameState.timer <= 0) {
        clearInterval(timerInterval);
        handleTimeout();
      }
    }, 1000);
  }

  // İlerleme çubuğunu güncelle
  function updateProgressBar() {
    const percentage = (gameState.timer / gameState.maxTime) * 100;
    progressBar.style.width = percentage + '%';

    // Renk değişimi
    if (percentage > 60) {
      progressBar.className = 'progress-bar bg-success';
    } else if (percentage > 30) {
      progressBar.className = 'progress-bar bg-warning';
    } else {
      progressBar.className = 'progress-bar bg-danger';
    }
  }

  // Tıklama kontrolü
  function checkClick(x, y) {
    const targetX = gameState.currentCharacter.x;
    const targetY = gameState.currentCharacter.y;

    // Uzaklık hesapla (Öklid mesafesi)
    const distance = Math.sqrt(Math.pow(x - targetX, 2) + Math.pow(y - targetY, 2));
    const targetRadius = difficultySettings[gameState.difficulty].targetRadius;

    if (distance <= targetRadius) {
      handleCorrectClick();
    } else {
      handleWrongClick(x, y);
    }
  }

  // Doğru tıklama
  function handleCorrectClick() {
    playSound('correct');
    gameState.isPlaying = false;

    // Puanı hesapla (kalan zamana göre)
    const timeBonus = Math.floor(gameState.timer * 5);
    const difficultyBonus = difficultySettings[gameState.difficulty].scoreMultiplier;
    const roundScore = Math.floor((100 + timeBonus) * difficultyBonus);

    gameState.score += roundScore;
    scoreDisplay.textContent = gameState.score;

    // Doğru yeri göster
    showTargetMarker(gameState.currentCharacter.x, gameState.currentCharacter.y, true);
    
    // Sonucu kaydet
    gameState.roundResults.push({
      round: gameState.currentRound,
      correct: true,
      score: roundScore
    });

    // Sonuç mesajını göster
    resultMessage.textContent = 'Harika! Doğru yeri buldunuz.';
    resultMessage.className = 'text-success';
    resultScore.textContent = '+' + roundScore + ' puan kazandınız!';

    if (gameState.currentRound >= gameState.maxRounds) {
      nextRoundBtn.style.display = 'none';
      gameOverBtn.style.display = 'block';
    } else {
      nextRoundBtn.style.display = 'block';
      gameOverBtn.style.display = 'none';
    }

    setTimeout(() => {
      resultPopup.style.display = 'flex';
    }, 1000);
  }

  // Yanlış tıklama
  function handleWrongClick(x, y) {
    playSound('wrong');

    // Tıklanan yeri göster
    showTargetMarker(x, y, false);

    // Puan cezası
    const penalty = Math.floor(10 * difficultySettings[gameState.difficulty].scoreMultiplier);
    if (gameState.score >= penalty) {
      gameState.score -= penalty;
      scoreDisplay.textContent = gameState.score;
    }
  }

  // Süre dolunca
  function handleTimeout() {
    playSound('gameOver');
    gameState.isPlaying = false;

    // Doğru yeri göster
    showTargetMarker(gameState.currentCharacter.x, gameState.currentCharacter.y, true);
    
    // Sonucu kaydet
    gameState.roundResults.push({
      round: gameState.currentRound,
      correct: false,
      score: 0
    });

    // Sonuç mesajını göster
    resultMessage.textContent = 'Süre Doldu!';
    resultMessage.className = 'text-danger';
    resultScore.textContent = gameState.currentCharacter.name + ' burada olmalıydı.';

    if (gameState.currentRound >= gameState.maxRounds) {
      nextRoundBtn.style.display = 'none';
      gameOverBtn.style.display = 'block';
    } else {
      nextRoundBtn.style.display = 'block';
      gameOverBtn.style.display = 'none';
    }

    setTimeout(() => {
      resultPopup.style.display = 'flex';
    }, 1000);
  }

  // Hedef işaretçiyi göster
  function showTargetMarker(x, y, isCorrect) {
    // Önceki işaretçileri temizle
    const oldMarkers = document.querySelectorAll('.target-marker');
    oldMarkers.forEach(marker => marker.remove());

    // Yeni işaretçi oluştur
    const marker = document.createElement('div');
    marker.className = 'target-marker ' + (isCorrect ? 'correct' : 'wrong');
    marker.style.left = x + '%';
    marker.style.top = y + '%';

    // Animasyon ekle
    marker.innerHTML = '<div class="marker-pulse"></div>';

    mapContainer.appendChild(marker);
  }

  // Oyunu bitir ve puanı gönder
  function finishGame() {
    playSound('success');
    
    // Doğru yüzdesini hesapla
    let correctAnswers = 0;
    for (let i = 0; i < gameState.currentRound; i++) {
      if (i < gameState.roundResults.length && gameState.roundResults[i].correct) {
        correctAnswers++;
      }
    }
    
    // Sonuç ekranını güncelle
    const gameResults = document.getElementById('game-results');
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('correct-answers').textContent = correctAnswers;
    document.getElementById('completed-rounds').textContent = gameState.currentRound;
    
    // Yıldız derecesi hesapla
    const maxStars = 5;
    let starsCount = 0;
    
    if (gameState.difficulty === 'EASY') {
      starsCount = Math.ceil((gameState.score / 1000) * maxStars);
    } else if (gameState.difficulty === 'MEDIUM') {
      starsCount = Math.ceil((gameState.score / 1500) * maxStars);
    } else { // HARD
      starsCount = Math.ceil((gameState.score / 2000) * maxStars);
    }
    
    starsCount = Math.min(starsCount, maxStars);
    
    // Yıldızları güncelle
    const ratingStarsElement = document.getElementById('rating-stars');
    ratingStarsElement.innerHTML = '';
    
    for (let i = 0; i < maxStars; i++) {
      const starIcon = document.createElement('i');
      starIcon.className = i < starsCount ? 'fas fa-star' : 'far fa-star';
      ratingStarsElement.appendChild(starIcon);
    }
    
    // Derecelendirme metnini güncelle
    const ratingText = document.getElementById('rating-text');
    if (starsCount <= 1) {
      ratingText.textContent = 'Başlangıç';
    } else if (starsCount === 2) {
      ratingText.textContent = 'İyi';
    } else if (starsCount === 3) {
      ratingText.textContent = 'Harika';
    } else if (starsCount === 4) {
      ratingText.textContent = 'Mükemmel';
    } else {
      ratingText.textContent = 'Efsanevi!';
    }
    
    // Tekrar oyna butonu olayı
    document.getElementById('play-again').addEventListener('click', function() {
      gameResults.style.display = 'none';
      gameContainer.style.display = 'block';
      startGame();
    });
    
    // Oyun sonuç ekranını göster
    gameContainer.style.display = 'none';
    gameResults.style.display = 'block';
    
    // Skoru sunucuya gönder
    fetch('/save_score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: 'whereIsIt',
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