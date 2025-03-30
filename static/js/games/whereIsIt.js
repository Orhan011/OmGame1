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

  // Oyun ses efektleri
  const sounds = {
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    click: new Audio('/static/sounds/click.mp3'),
    success: new Audio('/static/sounds/success.mp3'),
    gameOver: new Audio('/static/sounds/game-over.mp3')
  };

  // Ses oynatma fonksiyonu
  function playSound(sound) {
    try {
      sounds[sound].currentTime = 0;
      sounds[sound].play().catch(err => console.log("Sound play error:", err));
    } catch (error) {
      console.log("Sound play error:", error);
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
    difficulty: 'MEDIUM'
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

    // Ana sayfaya dön
    setTimeout(function() {
      window.location.href = '/leaderboard?game=whereIsIt';
    }, 1500);
  }
});