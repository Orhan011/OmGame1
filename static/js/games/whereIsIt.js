
document.addEventListener('DOMContentLoaded', function() {
  // DOM öğeleri
  const startScreen = document.getElementById('start-screen');
  const gameContainer = document.getElementById('game-container');
  const gameOverScreen = document.getElementById('game-over-screen');
  const startButton = document.getElementById('start-button');
  const pauseGameButton = document.getElementById('pause-game');
  const soundToggleButton = document.getElementById('sound-toggle');
  const mapContainer = document.getElementById('map-container');
  const characterImage = document.getElementById('character-image');
  const characterName = document.getElementById('character-name');
  const timerDisplay = document.getElementById('timer-display');
  const scoreDisplay = document.getElementById('score-display');
  const roundDisplay = document.getElementById('round-display');
  const resultScoreDisplay = document.getElementById('result-score');
  const progressBar = document.getElementById('progress-bar');
  const hintButton = document.getElementById('hint-button');
  const hintDisplay = document.getElementById('hint-display');
  const playAgainButton = document.getElementById('play-again');
  const restartButton = document.getElementById('restart-button');
  
  // Ses efektleri
  const sounds = {
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    click: new Audio('/static/sounds/click.mp3'),
    gameOver: new Audio('/static/sounds/game-over.mp3'),
    hint: new Audio('/static/sounds/hint.mp3')
  };
  
  // Oyun durumu
  const gameState = {
    score: 0,
    round: 0,
    maxRounds: 10,
    timer: 20,
    timerInterval: null,
    gameActive: false,
    gamePaused: false,
    soundEnabled: true,
    hintCount: 3,
    hintUsed: false,
    correctRegion: null,
    characters: [
      { name: "Ankara", image: "/static/images/whereIsIt/ankara.png" },
      { name: "İstanbul", image: "/static/images/whereIsIt/istanbul.png" },
      { name: "İzmir", image: "/static/images/whereIsIt/izmir.png" },
      { name: "Antalya", image: "/static/images/whereIsIt/antalya.png" },
      { name: "Bursa", image: "/static/images/whereIsIt/bursa.png" },
      { name: "Adana", image: "/static/images/whereIsIt/adana.png" },
      { name: "Konya", image: "/static/images/whereIsIt/konya.png" },
      { name: "Trabzon", image: "/static/images/whereIsIt/trabzon.png" },
      { name: "Erzurum", image: "/static/images/whereIsIt/erzurum.png" },
      { name: "Gaziantep", image: "/static/images/whereIsIt/gaziantep.png" },
      { name: "Mersin", image: "/static/images/whereIsIt/mersin.png" },
      { name: "Samsun", image: "/static/images/whereIsIt/samsun.png" },
      { name: "Diyarbakır", image: "/static/images/whereIsIt/diyarbakir.png" },
      { name: "Eskişehir", image: "/static/images/whereIsIt/eskisehir.png" },
      { name: "Şanlıurfa", image: "/static/images/whereIsIt/urfa.png" }
    ],
    regionNames: {
      "ankara-region": "Ankara",
      "istanbul-region": "İstanbul",
      "izmir-region": "İzmir",
      "antalya-region": "Antalya",
      "bursa-region": "Bursa",
      "adana-region": "Adana",
      "konya-region": "Konya",
      "trabzon-region": "Trabzon",
      "erzurum-region": "Erzurum",
      "gaziantep-region": "Gaziantep",
      "mersin-region": "Mersin",
      "samsun-region": "Samsun",
      "diyarbakir-region": "Diyarbakır",
      "eskisehir-region": "Eskişehir",
      "urfa-region": "Şanlıurfa"
    }
  };
  
  // Olay dinleyicileri
  if (startButton) {
    startButton.addEventListener('click', startGame);
  }
  
  if (pauseGameButton) {
    pauseGameButton.addEventListener('click', togglePause);
  }
  
  if (soundToggleButton) {
    soundToggleButton.addEventListener('click', toggleSound);
  }
  
  if (hintButton) {
    hintButton.addEventListener('click', useHint);
  }
  
  if (playAgainButton) {
    playAgainButton.addEventListener('click', resetGame);
  }
  
  if (restartButton) {
    restartButton.addEventListener('click', resetGame);
  }
  
  // Türkiye haritasını yükle
  if (mapContainer) {
    fetch('/static/images/whereIsIt/turkey_map.svg')
      .then(response => response.text())
      .then(svgData => {
        mapContainer.innerHTML = svgData;
        
        // SVG haritasındaki tüm bölgelere tıklama işlevi ekle
        const regions = mapContainer.querySelectorAll('path');
        regions.forEach(region => {
          if (region.id) {
            region.addEventListener('click', () => handleRegionClick(region.id));
          }
        });
      })
      .catch(error => console.error('Harita yüklenirken hata:', error));
  }
  
  // Ses çalma fonksiyonu
  function playSound(soundName) {
    try {
      if (gameState.soundEnabled && sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(error => {
          console.log("Sound play error:", error);
        });
      }
    } catch (e) {
      console.log("Sound play error:", e);
    }
  }
  
  // Ses açma/kapama
  function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    soundToggleButton.innerHTML = gameState.soundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
    soundToggleButton.classList.toggle('active', gameState.soundEnabled);
    playSound('click');
  }
  
  // Oyunu duraklatma/devam ettirme
  function togglePause() {
    gameState.gamePaused = !gameState.gamePaused;
    
    pauseGameButton.innerHTML = gameState.gamePaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    pauseGameButton.setAttribute('title', gameState.gamePaused ? 'Oyuna Devam Et' : 'Oyunu Duraklat');
    
    if (gameState.gamePaused) {
      clearInterval(gameState.timerInterval);
      showMessage('Oyun Duraklatıldı', 'info');
    } else {
      startTimer();
      hideMessage();
    }
    
    playSound('click');
  }
  
  // Oyunu başlat
  function startGame() {
    if (startScreen) {
      startScreen.style.display = 'none';
    }
    if (gameContainer) {
      gameContainer.style.display = 'block';
    }
    
    resetGame();
    startNewRound();
    playSound('click');
  }
  
  // Yeni tur başlat
  function startNewRound() {
    gameState.round++;
    gameState.timer = 20;
    gameState.hintUsed = false;
    
    if (roundDisplay) {
      roundDisplay.textContent = `${gameState.round}/${gameState.maxRounds}`;
    }
    
    // Karakter ve doğru bölge seçimi
    const characterIndex = Math.floor(Math.random() * gameState.characters.length);
    const character = gameState.characters[characterIndex];
    
    if (characterName) {
      characterName.textContent = character.name;
    }
    
    if (characterImage && character.image) {
      characterImage.src = character.image;
      characterImage.alt = character.name;
    }
    
    // Doğru bölgeyi belirle
    for (const [regionId, regionName] of Object.entries(gameState.regionNames)) {
      if (regionName === character.name) {
        gameState.correctRegion = regionId;
        break;
      }
    }
    
    // Bölge renklerini sıfırla
    resetRegionColors();
    
    // İpucu sayacını güncelle
    if (hintButton) {
      hintButton.textContent = `İpucu (${gameState.hintCount})`;
    }
    
    if (hintDisplay) {
      hintDisplay.textContent = '';
    }
    
    // Timer'ı başlat
    startTimer();
    
    gameState.gameActive = true;
  }
  
  // Zamanlayıcıyı başlat
  function startTimer() {
    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
    }
    
    updateTimer();
    
    gameState.timerInterval = setInterval(() => {
      if (gameState.gamePaused) return;
      
      gameState.timer--;
      updateTimer();
      
      if (gameState.timer <= 0) {
        clearInterval(gameState.timerInterval);
        handleTimeout();
      }
    }, 1000);
  }
  
  // Zamanlayıcıyı güncelle
  function updateTimer() {
    if (timerDisplay) {
      timerDisplay.textContent = gameState.timer;
    }
    
    if (progressBar) {
      const percentage = (gameState.timer / 20) * 100;
      progressBar.style.width = `${percentage}%`;
      
      // Timer rengini güncelle
      if (percentage > 60) {
        progressBar.className = 'progress-bar bg-success';
      } else if (percentage > 30) {
        progressBar.className = 'progress-bar bg-warning';
      } else {
        progressBar.className = 'progress-bar bg-danger';
      }
    }
  }
  
  // Süre dolduğunda
  function handleTimeout() {
    gameState.gameActive = false;
    
    // Doğru bölgeyi göster
    highlightRegion(gameState.correctRegion, '#4CAF50');
    
    showMessage('Süre doldu! Doğru cevap yeşil renkte gösterildi.', 'error');
    playSound('wrong');
    
    setTimeout(() => {
      if (gameState.round < gameState.maxRounds) {
        startNewRound();
      } else {
        endGame();
      }
    }, 2000);
  }
  
  // Bölge tıklama işleyicisi
  function handleRegionClick(regionId) {
    if (!gameState.gameActive || gameState.gamePaused) return;
    
    gameState.gameActive = false;
    clearInterval(gameState.timerInterval);
    
    const isCorrect = (regionId === gameState.correctRegion);
    let pointsEarned = 0;
    
    // Doğru cevap animasyonu ve puanlama
    if (isCorrect) {
      // Doğru bölgeyi yeşil yap
      highlightRegion(regionId, '#4CAF50');

      // Puanlama: Kalan süre + temel puan (ipucu kullanılmadıysa bonus)
      pointsEarned = (gameState.timer * 5) + 100;
      if (!gameState.hintUsed) pointsEarned += 50;

      gameState.score += pointsEarned;
      if (scoreDisplay) {
        scoreDisplay.textContent = gameState.score;
      }

      // Ses efekti
      playSound('correct');

      // Doğru cevap mesajı
      showMessage(`Doğru! +${pointsEarned} puan kazandınız.`, 'success');
    } else {
      // Yanlış bölgeyi kırmızı, doğru bölgeyi yeşil yap
      highlightRegion(regionId, '#FF5252');
      highlightRegion(gameState.correctRegion, '#4CAF50');

      // Ses efekti
      playSound('wrong');

      // Yanlış cevap mesajı
      showMessage('Yanlış cevap! Doğru cevap yeşil renkte gösterildi.', 'error');
      
      // 1 saniye sonra yanlış bölgenin kırmızı rengini temizle
      setTimeout(() => {
        const region = document.getElementById(regionId);
        if (region) {
          region.style.fill = '';
          region.style.fillOpacity = '';
        }
      }, 1000);
    }

    // Sonraki tura geç veya oyunu bitir
    setTimeout(() => {
      if (gameState.round < gameState.maxRounds) {
        startNewRound();
      } else {
        endGame();
      }
    }, 2000);
  }

  // Bölgeyi vurgula
  function highlightRegion(regionId, color) {
    const region = document.getElementById(regionId);
    if (region) {
      region.style.fill = color;
      region.style.fillOpacity = '0.9';

      // Vurgulama animasyonu
      const pulseEffect = document.createElement('div');
      pulseEffect.className = 'pulse-effect';
      mapContainer.appendChild(pulseEffect);
      
      const regionRect = region.getBoundingClientRect();
      const containerRect = mapContainer.getBoundingClientRect();
      
      pulseEffect.style.left = `${regionRect.left - containerRect.left + regionRect.width/2}px`;
      pulseEffect.style.top = `${regionRect.top - containerRect.top + regionRect.height/2}px`;
      
      setTimeout(() => {
        pulseEffect.remove();
      }, 1000);
    }
  }
  
  // Bölge renklerini sıfırla
  function resetRegionColors() {
    const regions = mapContainer.querySelectorAll('path');
    regions.forEach(region => {
      region.style.fill = '';
      region.style.fillOpacity = '';
    });
  }
  
  // İpucu kullan
  function useHint() {
    if (gameState.hintCount <= 0 || gameState.hintUsed || !gameState.gameActive || gameState.gamePaused) return;
    
    gameState.hintCount--;
    gameState.hintUsed = true;
    
    if (hintButton) {
      hintButton.textContent = `İpucu (${gameState.hintCount})`;
    }
    
    // Doğru bölgenin yakınında bir ipucu göster
    const correctRegion = document.getElementById(gameState.correctRegion);
    if (correctRegion) {
      const regionName = gameState.regionNames[gameState.correctRegion];
      const hintText = getRandomHint(regionName);
      
      if (hintDisplay) {
        hintDisplay.textContent = hintText;
        hintDisplay.classList.add('hint-active');
        
        setTimeout(() => {
          hintDisplay.classList.remove('hint-active');
        }, 5000);
      }
    }
    
    playSound('hint');
  }
  
  // Rastgele ipucu metni oluştur
  function getRandomHint(cityName) {
    const hints = [
      `${cityName} şehrini düşün... Bu bölgenin özelliklerini hatırla.`,
      `${cityName} Türkiye'nin hangi bölgesinde?`,
      `${cityName} ile hangi büyük şehirler komşu?`,
      `${cityName} hangi denize yakındır?`,
      `${cityName} şehri Türkiye'nin neresinde bulunur?`
    ];
    
    return hints[Math.floor(Math.random() * hints.length)];
  }
  
  // Mesaj göster
  function showMessage(text, type) {
    const messageElement = document.createElement('div');
    messageElement.className = `game-message message-${type}`;
    messageElement.textContent = text;
    messageElement.id = 'game-message';
    
    // Eğer zaten bir mesaj varsa onu kaldır
    const existingMessage = document.getElementById('game-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    gameContainer.appendChild(messageElement);
    
    // Mesajı animasyonla göster
    setTimeout(() => {
      messageElement.classList.add('show');
    }, 10);
  }
  
  // Mesajı gizle
  function hideMessage() {
    const messageElement = document.getElementById('game-message');
    if (messageElement) {
      messageElement.classList.remove('show');
      setTimeout(() => {
        messageElement.remove();
      }, 300);
    }
  }
  
  // Oyunu bitir
  function endGame() {
    clearInterval(gameState.timerInterval);
    gameState.gameActive = false;
    
    if (gameContainer) {
      gameContainer.style.display = 'none';
    }
    
    if (gameOverScreen) {
      gameOverScreen.style.display = 'block';
    }
    
    if (resultScoreDisplay) {
      resultScoreDisplay.textContent = gameState.score;
    }
    
    playSound('gameOver');
    
    // Skoru kaydet
    saveScore(gameState.score);
  }
  
  // Oyunu sıfırla
  function resetGame() {
    clearInterval(gameState.timerInterval);
    
    gameState.score = 0;
    gameState.round = 0;
    gameState.timer = 20;
    gameState.hintCount = 3;
    
    if (scoreDisplay) {
      scoreDisplay.textContent = '0';
    }
    
    if (gameOverScreen) {
      gameOverScreen.style.display = 'none';
    }
    
    if (gameContainer) {
      gameContainer.style.display = 'block';
    }
    
    resetRegionColors();
    startNewRound();
  }
  
  // Skoru kaydet
  function saveScore(score) {
    fetch('/save_score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        score: score,
        game_type: 'whereIsIt'
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Skor kaydedildi:', data);
    })
    .catch(error => {
      console.error('Skor kaydedilirken hata:', error);
    });
  }
});
