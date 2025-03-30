/**
 * Beyin Ritmi Oyunu - 1.0
 * 
 * Ritim ve bellek becerilerini geliştiren interaktif bir oyun.
 * 
 * Özellikler:
 * - Artan zorluk seviyelerinde ritim dizileri
 * - Görsel ve işitsel geribildirim
 * - Reaksiyon süresi ölçümü
 * - Puan ve başarı sistemi
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM elementleri
  const gameContainer = document.getElementById('brainRhythmGame');
  const startBtn = document.getElementById('brainRhythmStartBtn');
  const gameMenu = document.getElementById('brainRhythmMenu');
  const gameplayArea = document.getElementById('brainRhythmGameplay');
  const difficultyBtns = document.querySelectorAll('.difficulty-option');
  const scoreDisplay = document.getElementById('brainRhythmScore');
  const levelDisplay = document.getElementById('brainRhythmLevel');
  const timerDisplay = document.getElementById('brainRhythmTimer');
  const sequenceDisplay = document.getElementById('sequenceDisplay');
  const drumBtns = document.querySelectorAll('.drum-btn');
  const messageDisplay = document.getElementById('brainRhythmMessage');
  const soundToggle = document.getElementById('brainRhythmSoundToggle');
  
  // Oyun durumu
  let gameState = {
    sequence: [],
    playerSequence: [],
    level: 1,
    score: 0,
    difficulty: 2, // Default: Normal
    isPlaying: false,
    playbackInProgress: false,
    maxLevel: 10,
    soundEnabled: true,
    timerId: null,
    timeLeft: 0,
    baseTime: 30, // seconds
    drumColors: ['red', 'blue', 'green', 'yellow'],
    combo: 0
  };
  
  // Ses efektleri
  const sounds = {
    red: new Audio('/static/sounds/drum1.mp3'),
    blue: new Audio('/static/sounds/drum2.mp3'),
    green: new Audio('/static/sounds/drum3.mp3'),
    yellow: new Audio('/static/sounds/drum4.mp3'),
    success: new Audio('/static/sounds/success.mp3'),
    fail: new Audio('/static/sounds/fail.mp3'),
    levelUp: new Audio('/static/sounds/level-up.mp3')
  };
  
  // Event listeners
  startBtn.addEventListener('click', startGame);
  
  difficultyBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      difficultyBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      gameState.difficulty = parseInt(this.dataset.difficulty, 10);
    });
  });
  
  drumBtns.forEach((btn, index) => {
    const color = gameState.drumColors[index];
    btn.style.backgroundColor = color;
    
    btn.addEventListener('click', function() {
      if (gameState.isPlaying && !gameState.playbackInProgress) {
        playerSelectDrum(color);
      }
    });
  });
  
  soundToggle.addEventListener('click', toggleSound);
  
  // Oyunu başlat
  function startGame() {
    resetGameState();
    gameMenu.classList.add('d-none');
    gameplayArea.classList.remove('d-none');
    
    gameState.isPlaying = true;
    updateScoreDisplay();
    updateLevelDisplay();
    
    // Zorluk seviyesine göre başlangıç süresi
    gameState.timeLeft = gameState.baseTime - (gameState.difficulty - 1) * 5;
    startTimer();
    
    generateSequence();
  }
  
  // Oyun durumunu sıfırla
  function resetGameState() {
    gameState.sequence = [];
    gameState.playerSequence = [];
    gameState.level = 1;
    gameState.score = 0;
    gameState.combo = 0;
    gameState.isPlaying = false;
    gameState.playbackInProgress = false;
    
    if (gameState.timerId) {
      clearInterval(gameState.timerId);
      gameState.timerId = null;
    }
  }
  
  // Yeni bir ritim dizisi oluştur
  function generateSequence() {
    gameState.sequence = [];
    gameState.playerSequence = [];
    
    // Zorluk seviyesi ve oyun seviyesine göre dizi uzunluğu
    const sequenceLength = gameState.level + Math.floor(gameState.difficulty / 2);
    
    for (let i = 0; i < sequenceLength; i++) {
      const randomDrum = gameState.drumColors[Math.floor(Math.random() * gameState.drumColors.length)];
      gameState.sequence.push(randomDrum);
    }
    
    showMessage("Ritmi izleyin!", "info");
    setTimeout(() => {
      playSequence();
    }, 1000);
  }
  
  // Ritim dizisini çal
  function playSequence() {
    gameState.playbackInProgress = true;
    sequenceDisplay.innerHTML = '';
    
    let i = 0;
    const intervalId = setInterval(() => {
      if (i >= gameState.sequence.length) {
        clearInterval(intervalId);
        gameState.playbackInProgress = false;
        showMessage("Şimdi sıra sizde!", "info");
        return;
      }
      
      const color = gameState.sequence[i];
      playDrum(color);
      i++;
    }, 600);
  }
  
  // Ritim tuşu çal
  function playDrum(color) {
    const drumBtn = Array.from(drumBtns).find(btn => btn.style.backgroundColor === color);
    
    // Görsel efekt
    drumBtn.classList.add('active');
    setTimeout(() => {
      drumBtn.classList.remove('active');
    }, 300);
    
    // Ses efekti
    if (gameState.soundEnabled) {
      sounds[color].currentTime = 0;
      sounds[color].play();
    }
    
    // Dizi göstergesine ekle
    const dot = document.createElement('div');
    dot.className = 'sequence-dot';
    dot.style.backgroundColor = color;
    sequenceDisplay.appendChild(dot);
  }
  
  // Oyuncu ritim seçimi
  function playerSelectDrum(color) {
    gameState.playerSequence.push(color);
    playDrum(color);
    
    // Doğruluğunu kontrol et
    const currentIndex = gameState.playerSequence.length - 1;
    
    if (gameState.playerSequence[currentIndex] !== gameState.sequence[currentIndex]) {
      handleWrongSequence();
      return;
    }
    
    // Tüm dizi tamamlandı mı kontrol et
    if (gameState.playerSequence.length === gameState.sequence.length) {
      handleCorrectSequence();
    }
  }
  
  // Yanlış ritim dizisi
  function handleWrongSequence() {
    if (gameState.soundEnabled) {
      sounds.fail.play();
    }
    
    showMessage("Hatalı ritim! Tekrar deneyin.", "error");
    gameState.combo = 0;
    
    setTimeout(() => {
      gameState.playerSequence = [];
      sequenceDisplay.innerHTML = '';
      playSequence();
    }, 1500);
  }
  
  // Doğru ritim dizisi
  function handleCorrectSequence() {
    if (gameState.soundEnabled) {
      sounds.success.play();
    }
    
    gameState.combo++;
    // Combo bonusu ile puan hesaplama
    const basePoints = gameState.level * 10 * gameState.difficulty;
    const comboMultiplier = 1 + (gameState.combo * 0.1);
    const points = Math.floor(basePoints * comboMultiplier);
    
    gameState.score += points;
    updateScoreDisplay();
    
    showMessage(`Harika! +${points} puan kazandınız`, "success");
    
    // Bir sonraki seviyeye geç
    if (gameState.level < gameState.maxLevel) {
      gameState.level++;
      updateLevelDisplay();
      
      if (gameState.soundEnabled) {
        sounds.levelUp.play();
      }
      
      // Ekstra süre ekle
      gameState.timeLeft += 5 + gameState.difficulty;
      if (gameState.timeLeft > 60) gameState.timeLeft = 60;
      
      setTimeout(() => {
        generateSequence();
      }, 1500);
    } else {
      // Oyunu başarıyla tamamla
      endGame(true);
    }
  }
  
  // Zamanlayıcıyı başlat
  function startTimer() {
    updateTimerDisplay();
    
    gameState.timerId = setInterval(() => {
      gameState.timeLeft--;
      updateTimerDisplay();
      
      if (gameState.timeLeft <= 0) {
        endGame(false);
      }
    }, 1000);
  }
  
  // Oyunu sonlandır
  function endGame(completed) {
    clearInterval(gameState.timerId);
    gameState.isPlaying = false;
    
    if (completed) {
      showMessage(`Tebrikler! Tüm seviyeleri tamamladınız! Toplam puan: ${gameState.score}`, "success");
    } else {
      showMessage(`Süre doldu! Son puan: ${gameState.score}`, "info");
    }
    
    // Puanı kaydet
    saveScore();
    
    // Oyun menüsüne dön
    setTimeout(() => {
      gameplayArea.classList.add('d-none');
      gameMenu.classList.remove('d-none');
    }, 3000);
  }
  
  // Puanı kaydet
  function saveScore() {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: 'brainRhythm',
        score: gameState.score
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
  
  // Mesaj göster
  function showMessage(message, type) {
    messageDisplay.textContent = message;
    messageDisplay.className = `message ${type}`;
    messageDisplay.style.display = 'block';
    
    setTimeout(() => {
      messageDisplay.style.display = 'none';
    }, 3000);
  }
  
  // Ses durumunu değiştir
  function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    soundToggle.innerHTML = gameState.soundEnabled ? 
      '<i class="fas fa-volume-up"></i>' : 
      '<i class="fas fa-volume-mute"></i>';
  }
  
  // UI güncellemeleri
  function updateScoreDisplay() {
    scoreDisplay.textContent = gameState.score;
  }
  
  function updateLevelDisplay() {
    levelDisplay.textContent = gameState.level;
  }
  
  function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(gameState.timeLeft);
    
    // Zamanlayıcı renklendirme
    if (gameState.timeLeft <= 10) {
      timerDisplay.classList.add('text-danger');
    } else {
      timerDisplay.classList.remove('text-danger');
    }
  }
  
  // Zamanı formatla
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  }
  
  // İlk görünümü ayarla
  gameplayArea.classList.add('d-none');
  // Normal zorluk seviyesini varsayılan olarak seç
  difficultyBtns[2].classList.add('active');
});