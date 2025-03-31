// Ses Hafıza Oyunu - Ana JavaScript Dosyası
document.addEventListener('DOMContentLoaded', function() {
  // Audio context initialization
  let audioContext;
  let synth;

  // Oyun değişkenleri
  let currentLevel = 1;
  let sequence = [];
  let playerSequence = [];
  let isPlayingSequence = false;
  let isListening = false;
  let score = 0;
  let correctAnswers = 0;
  let totalAnswers = 0;
  let gameActive = false;

  // UI elementleri
  const introSection = document.getElementById('audio-memory-intro');
  const gameContainer = document.getElementById('audio-memory-game');
  const gameOverContainer = document.getElementById('game-over-screen');
  const startButton = document.getElementById('start-button');
  const playSequenceButton = document.getElementById('play-sequence');
  const audioPads = document.querySelectorAll('.audio-pad');
  const sequenceStatus = document.getElementById('sequence-status');
  const scoreDisplay = document.getElementById('score-value');
  const correctDisplay = document.getElementById('correct-value');
  const levelDisplay = document.getElementById('level-value');
  const finalScoreDisplay = document.getElementById('final-score');
  const restartButton = document.getElementById('restart-button');
  const nextLevelButton = document.getElementById('next-level');

  // Ses notaları
  const notes = ['C4', 'E4', 'G4', 'B4', 'D5', 'F5'];

  // Renk-not eşleşmesi
  const padColors = ['#2196F3', '#4CAF50', '#F44336', '#FF9800', '#9C27B0', '#FFEB3B'];

  // Ses durum bilgisi
  let audioReady = false;

  // Oyunu başlat
  function initializeGame() {
    // Tone.js'i başlat
    if (!audioReady) {
      initAudio();
    }

    hideIntro();
    showGameContainer();
    hideGameOverScreen();

    // Oyun değişkenlerini sıfırla
    currentLevel = 1;
    score = 0;
    correctAnswers = 0;
    totalAnswers = 0;

    // UI güncelle
    updateUI();

    // İlk seviyeyi başlat
    startLevel();
  }

  // Audio'yu başlat
  function initAudio() {
    try {
      // Tone.js ile synth oluştur
      synth = new Tone.Synth({
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0.005,
          decay: 0.1,
          sustain: 0.3,
          release: 0.5
        }
      }).toDestination();

      audioReady = true;
      console.log("Audio is ready");
    } catch (error) {
      console.error("Error initializing audio:", error);
      alert("Ses sistemi başlatılamadı. Lütfen tarayıcınızın güncel olduğundan emin olun.");
    }
  }

  // Seviyeyi başlat
  function startLevel() {
    // Seviyeye göre dizi uzunluğunu belirle
    const sequenceLength = currentLevel + 2;

    // Yeni dizi oluştur
    generateSequence(sequenceLength);

    // Hazır olun mesajı
    sequenceStatus.innerHTML = `<div class="countdown-display">Hazırlanın...</div>`;

    // 2 saniye sonra diziyi oynat
    setTimeout(() => {
      playSequence();
    }, 1500);
  }

  // Rastgele dizi oluştur
  function generateSequence(length) {
    sequence = [];
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * notes.length);
      sequence.push(randomIndex);
    }
  }

  // Diziyi oynat
  function playSequence() {
    isPlayingSequence = true;
    isListening = false;

    sequenceStatus.innerHTML = `<div>Sırayı dinleyin...</div>`;

    // Tuşları devre dışı bırak
    disablePads();

    // Tüm pad'leri döngü ile çal
    let i = 0;
    const interval = setInterval(() => {
      if (i < sequence.length) {
        playPad(sequence[i]);
        highlightPad(sequence[i]);

        // Bir sonraki nota
        i++;
      } else {
        // Dizi tamamlandığında
        clearInterval(interval);

        setTimeout(() => {
          sequenceStatus.innerHTML = `<div class="recall-message">Şimdi sırayı tekrarlayın!</div>`;
          isPlayingSequence = false;
          isListening = true;
          playerSequence = [];

          // Tuşları etkinleştir
          enablePads();
        }, 500);
      }
    }, 1000); // Her 1 saniyede bir nota
  }

  // Pad'i çal
  function playPad(index) {
    if (!audioReady) {
      initAudio();
    }

    try {
      // Tone.js ile notu çal
      synth.triggerAttackRelease(notes[index], "8n");
    } catch (error) {
      console.error("Error playing note:", error);
    }
  }

  // Pad'i vurgula
  function highlightPad(index) {
    const pad = audioPads[index];
    pad.classList.add('active');

    // Vurgulama efektini kaldır
    setTimeout(() => {
      pad.classList.remove('active');
    }, 500);
  }

  // Oyuncu girişini kontrol et
  function checkPlayerInput(index) {
    if (!isListening || isPlayingSequence) return;

    playPad(index);
    highlightPad(index);

    playerSequence.push(index);

    // Oyuncunun son girişini kontrol et
    const currentIndex = playerSequence.length - 1;

    if (playerSequence[currentIndex] !== sequence[currentIndex]) {
      // Yanlış giriş - oyun bitti
      handleWrongInput();
      return;
    }

    // Tam dizi tamamlandı mı kontrol et
    if (playerSequence.length === sequence.length) {
      // Doğru dizi
      handleCorrectSequence();
    }
  }

  // Doğru dizi giriş durumu
  function handleCorrectSequence() {
    isListening = false;

    // Skoru güncelle
    correctAnswers++;
    totalAnswers++;
    score += currentLevel * 100;

    updateUI();

    sequenceStatus.innerHTML = `<div class="success-message">Harika! Doğru sıra!</div>`;

    // Sonraki seviyeye 2 saniye sonra geç
    setTimeout(() => {
      if (currentLevel < 10) {
        currentLevel++;
        startLevel();
      } else {
        // Oyunu tamamladı
        handleGameComplete();
      }
    }, 2000);
  }

  // Yanlış giriş durumu
  function handleWrongInput() {
    isListening = false;

    totalAnswers++;
    updateUI();

    sequenceStatus.innerHTML = `<div class="error-message">Yanlış! Oyun bitti.</div>`;

    // Doğru diziyi göster
    setTimeout(() => {
      endGame();
    }, 1500);
  }

  // Oyunu tamamlama durumu
  function handleGameComplete() {
    sequenceStatus.innerHTML = `<div class="success-message">Tebrikler! Tüm seviyeleri tamamladınız!</div>`;

    // Bonus puan
    score += 1000;
    updateUI();

    setTimeout(() => {
      endGame(true);
    }, 2000);
  }

  // Oyunu bitir
  function endGame(completed = false) {
    gameActive = false;

    // Final skoru göster
    finalScoreDisplay.textContent = score;

    // UI güncelle
    hideGameContainer();
    showGameOverScreen();

    // Skoru sunucuya gönder
    saveScore();
  }

  // Skoru kaydet
  function saveScore() {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        score: score,
        game_type: 'audioMemory'
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Score saved:', data);
    })
    .catch(error => {
      console.error('Error saving score:', error);
    });
  }

  // Pad etkinleştir
  function enablePads() {
    audioPads.forEach(pad => {
      pad.classList.remove('disabled');
      pad.disabled = false;
    });
  }

  // Pad devre dışı bırak
  function disablePads() {
    audioPads.forEach(pad => {
      pad.classList.add('disabled');
      pad.disabled = true;
    });
  }

  // Skor gösterimini güncelle
  function updateScoreDisplay() {
    if (scoreDisplay) {
      scoreDisplay.textContent = score;
    }
  }

  // Doğru sayısını güncelle
  function updateCorrectDisplay() {
    if (correctDisplay) {
      const percentage = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
      correctDisplay.textContent = `${correctAnswers}/${totalAnswers} (${percentage}%)`;
    }
  }

  // Tüm UI güncelle
  function updateUI() {
    updateScoreDisplay();
    updateCorrectDisplay();
    if (levelDisplay) {
      levelDisplay.textContent = currentLevel;
    }
  }

  // UI yardımcı fonksiyonlar
  function hideIntro() {
    if (introSection) {
      introSection.style.display = 'none';
    }
  }

  function showGameContainer() {
    if (gameContainer) {
      gameContainer.style.display = 'block';
    }
  }

  function hideGameContainer() {
    if (gameContainer) {
      gameContainer.style.display = 'none';
    }
  }

  function showGameOverScreen() {
    if (gameOverContainer) {
      gameOverContainer.style.display = 'block';
    }
  }

  function hideGameOverScreen() {
    if (gameOverContainer) {
      gameOverContainer.style.display = 'none';
    }
  }

  // Event Listeners
  if (startButton) {
    startButton.addEventListener('click', initializeGame);
  }

  if (playSequenceButton) {
    playSequenceButton.addEventListener('click', () => {
      if (!isPlayingSequence && !isListening) {
        playSequence();
      }
    });
  }

  audioPads.forEach((pad, index) => {
    pad.addEventListener('click', () => {
      checkPlayerInput(index);
    });
  });

  // Yeniden başlat butonu
  if (restartButton) {
    restartButton.addEventListener('click', initializeGame);
  }

  // Sonraki seviye butonu
  if (nextLevelButton) {
    nextLevelButton.addEventListener('click', () => {
      hideGameOverScreen();
      showGameContainer();
      currentLevel++;
      startLevel();
    });
  }

  // Başlangıç durumu
  disablePads();
});