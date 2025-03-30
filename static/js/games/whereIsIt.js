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
  const sounds = {
    click: new Audio('/static/sounds/click.mp3'),
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    gameover: new Audio('/static/sounds/gameover.mp3'),
    levelup: new Audio('/static/sounds/levelup.mp3')
  };

  let soundsLoaded = false;
  let soundEnabled = true;

  // Ses çalma fonksiyonu
  function playSound(sound) {
    if (soundEnabled && sounds[sound]) {
      try {
        sounds[sound].currentTime = 0;
        sounds[sound].play();
      } catch (e) {
        console.log("Sound play error:", e);
      }
    }
  }

  // Oyun durumu
  const gameState = {
    round: 0,
    maxRounds: 10,
    score: 0,
    timer: 20,
    interval: null,
    isAnswerPhase: false,
    correctRegion: null,
    characters: [
      { name: 'İstanbul', regionId: 'istanbul', image: '/static/images/characters/istanbul.jpg' },
      { name: 'Ankara', regionId: 'ankara', image: '/static/images/characters/ankara.jpg' },
      { name: 'İzmir', regionId: 'izmir', image: '/static/images/characters/izmir.jpg' },
      { name: 'Bursa', regionId: 'bursa', image: '/static/images/characters/bursa.jpg' },
      { name: 'Antalya', regionId: 'antalya', image: '/static/images/characters/antalya.jpg' },
      { name: 'Konya', regionId: 'konya', image: '/static/images/characters/konya.jpg' },
      { name: 'Gaziantep', regionId: 'gaziantep', image: '/static/images/characters/gaziantep.jpg' },
      { name: 'Adana', regionId: 'adana', image: '/static/images/characters/adana.jpg' },
      { name: 'Samsun', regionId: 'samsun', image: '/static/images/characters/samsun.jpg' }
    ]
  };

  // SVG haritasını yükle
  function loadMap() {
    fetch('/static/images/turkey-map.svg')
      .then(response => response.text())
      .then(svgContent => {
        mapContainer.innerHTML = svgContent;

        // Bölgelere tıklama olayları ekle
        const regions = mapContainer.querySelectorAll('path');
        regions.forEach(region => {
          region.addEventListener('click', handleRegionClick);
        });
      })
      .catch(error => {
        console.error('Harita yüklenirken hata oluştu:', error);
        mapContainer.innerHTML = '<div class="error-message">Harita yüklenemedi. Lütfen sayfayı yenileyin.</div>';
      });
  }

  // Bölgeye tıklama işleyicisi
  function handleRegionClick(event) {
    if (!gameState.isAnswerPhase) return;

    const regionId = event.target.id;
    const isCorrect = regionId === gameState.correctRegion;

    // Tıklanan bölgeyi vurgula
    event.target.classList.add(isCorrect ? 'correct' : 'wrong');

    // Doğru veya yanlış cevap işlemleri
    if (isCorrect) {
      playSound('correct');
      // Puan hesapla (kalan süre bonus puan sağlar)
      const timeBonus = Math.floor(gameState.timer * 5);
      const roundScore = 100 + timeBonus;
      gameState.score += roundScore;

      if (scoreDisplay) {
        scoreDisplay.textContent = gameState.score;
      }

      // Sonuç mesajını göster
      showResult(true, roundScore);
    } else {
      playSound('wrong');
      // Yanlış bölge seçildi
      showResult(false, 0);
    }

    // Cevap fazını kapat ve sayacı durdur
    gameState.isAnswerPhase = false;
    clearInterval(gameState.interval);
  }

  // Sonuç mesajını göster
  function showResult(isCorrect, points) {
    if (resultPopup && resultMessage) {
      resultPopup.style.display = 'flex';

      if (isCorrect) {
        resultMessage.textContent = 'Doğru! ' + points + ' puan kazandınız.';
        resultMessage.className = 'result-message correct';
      } else {
        resultMessage.textContent = 'Yanlış! Doğru cevap: ' + getCurrentCharacterName();
        resultMessage.className = 'result-message wrong';
      }

      if (resultScore) {
        resultScore.textContent = 'Toplam Puan: ' + gameState.score;
      }

      // Sonraki tur butonu veya oyun sonu butonu göster
      if (gameState.round < gameState.maxRounds) {
        if (nextRoundBtn) {
          nextRoundBtn.style.display = 'block';
          gameOverBtn.style.display = 'none';
        }
      } else {
        if (gameOverBtn) {
          nextRoundBtn.style.display = 'none';
          gameOverBtn.style.display = 'block';
        }

        playSound('gameover');
        saveScore();
      }
    }
  }

  // Geçerli karakterin adını al
  function getCurrentCharacterName() {
    const characterIndex = gameState.round - 1;
    if (characterIndex >= 0 && characterIndex < gameState.characters.length) {
      return gameState.characters[characterIndex].name;
    }
    return '';
  }

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

    // İlerleme çubuğunu güncelle
    if (progressBar) {
      const progress = (gameState.round / gameState.maxRounds) * 100;
      progressBar.style.width = progress + '%';
    }

    // Karakteri seç
    const characterIndex = gameState.round - 1;
    if (characterIndex < gameState.characters.length) {
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

      gameState.interval = setInterval(updateTimer, 1000);

      // Tüm bölgeleri sıfırla
      resetRegions();
    }
  }

  // Bölgeleri sıfırla
  function resetRegions() {
    const regions = mapContainer.querySelectorAll('path');
    regions.forEach(region => {
      region.classList.remove('correct', 'wrong');
    });
  }

  // Zamanlayıcıyı güncelle
  function updateTimer() {
    gameState.timer--;

    if (timerDisplay) {
      timerDisplay.textContent = gameState.timer;
    }

    if (gameState.timer <= 0) {
      clearInterval(gameState.interval);
      gameState.isAnswerPhase = false;
      playSound('wrong');
      showResult(false, 0);
    }
  }

  // Skoru kaydet
  function saveScore() {
    if (gameState.score > 0) {
      fetch('/api/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game_type: 'whereIsIt',
          score: gameState.score
        }),
      })
      .then(response => response.json())
      .then(data => {
        console.log('Skor kaydedildi:', data);

        // XP kazanımını göster
        if (data.xp_gained) {
          const xpNotification = document.createElement('div');
          xpNotification.className = 'xp-notification';
          xpNotification.innerHTML = `+${data.xp_gained} XP`;
          document.body.appendChild(xpNotification);

          setTimeout(() => {
            xpNotification.classList.add('show');
          }, 100);

          setTimeout(() => {
            xpNotification.classList.remove('show');
            setTimeout(() => {
              document.body.removeChild(xpNotification);
            }, 500);
          }, 3000);
        }
      })
      .catch(error => {
        console.error('Skor kaydedilirken hata oluştu:', error);
      });
    }
  }

  // Sonraki tura geç
  if (nextRoundBtn) {
    nextRoundBtn.addEventListener('click', function() {
      if (resultPopup) resultPopup.style.display = 'none';
      playSound('click');
      startNewRound();
    });
  }

  // Oyunu bitir
  if (gameOverBtn) {
    gameOverBtn.addEventListener('click', function() {
      if (resultPopup) resultPopup.style.display = 'none';
      playSound('click');
      // Ana menüye dön
      window.location.href = '/';
    });
  }

  // Geri butonu
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      playSound('click');
      // Ana menüye dön
      window.location.href = '/';
    });
  }

  // Ses ayarları
  const soundToggle = document.getElementById('sound-toggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', function() {
      soundEnabled = !soundEnabled;
      this.classList.toggle('muted', !soundEnabled);

      // Ses durumunu göster
      const soundStatus = document.createElement('div');
      soundStatus.className = 'sound-status';
      soundStatus.textContent = soundEnabled ? 'Ses Açık' : 'Ses Kapalı';
      document.body.appendChild(soundStatus);

      setTimeout(() => {
        soundStatus.classList.add('show');
      }, 100);

      setTimeout(() => {
        soundStatus.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(soundStatus);
        }, 500);
      }, 2000);
    });
  }

  // Pencere yeniden boyutlandırıldığında uyarlama
  window.addEventListener('resize', function() {
    // Harita boyutunu ayarla
    if (mapContainer) {
      const svgElement = mapContainer.querySelector('svg');
      if (svgElement) {
        const containerWidth = mapContainer.clientWidth;
        const containerHeight = mapContainer.clientHeight;

        svgElement.setAttribute('width', '100%');
        svgElement.setAttribute('height', '100%');
        svgElement.setAttribute('viewBox', '0 0 1200 800');
        svgElement.style.maxHeight = containerHeight + 'px';
      }
    }
  });
});