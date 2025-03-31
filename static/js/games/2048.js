/**
 * 2048 Oyunu - 1.0
 * 
 * Stratejik düşünme ve sayısal ilişkilendirme becerilerinizi geliştiren 2048 bulmaca oyunu.
 * 
 * Özellikler:
 * - Klasik 2048 oynanışı
 * - Kaydırma hareketleriyle oynanabilme
 * - Puan ve en yüksek kare takibi
 * - Responsive tasarım ve mobil uyumluluk
 */

document.addEventListener('DOMContentLoaded', function() {
  // Oyun değişkenleri
  let score = 0;
  let bestScore = 0;
  let maxTile = 2;
  let moves = 0;
  let gameMode = 'REGULAR';
  let gameTimer;
  let secondsElapsed = 0;
  let timeLimit = 120; // Zamanlı mod için saniye cinsinden süre (2 dakika)
  let gameOver = false;
  let soundEnabled = true;
  let grid = [];
  let canMove = true;
  let previousGrid = [];
  
  // DOM Elementleri
  const startButton = document.getElementById('start-game');
  const introSection = document.getElementById('intro-section');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const pauseOverlay = document.getElementById('pause-overlay');
  const grid2048 = document.getElementById('grid-2048');
  const modeButtons = document.querySelectorAll('.level-btn');
  const scoreDisplay = document.getElementById('score-display');
  const bestScoreDisplay = document.getElementById('best-score-display');
  const maxTileDisplay = document.getElementById('max-tile-display');
  const movesDisplay = document.getElementById('moves-display');
  const modeDisplay = document.getElementById('mode-display');
  const timeDisplay = document.getElementById('time-display');
  const undoMoveButton = document.getElementById('undo-move');
  const newGameButton = document.getElementById('new-game');
  const pauseButton = document.getElementById('pause-game');
  const resumeButton = document.getElementById('resume-game');
  const soundToggle = document.getElementById('sound-toggle');
  const playAgainButton = document.getElementById('play-again');
  const alertContainer = document.getElementById('alert-container');
  
  // Oyunu başlat
  function startGame() {
    showMessage('2048 oyunu yükleniyor...', 'info');
    // İlk aşamada sadece arayüzü gösterelim, gerçek oyun daha sonra yapılacak
    introSection.style.display = 'none';
    gameContainer.style.display = 'block';
    
    modeDisplay.textContent = gameMode;
    
    if (gameMode === 'TIME') {
      timeDisplay.style.display = 'inline-block';
      timeDisplay.textContent = formatTime(timeLimit);
    } else {
      timeDisplay.style.display = 'none';
    }
    
    // Basit bir demo arayüzü oluştur
    createEmptyGrid();
    
    showMessage('Bu oyun şu anda yapım aşamasındadır. Yakında tamamlanacaktır!', 'warning');
    
    // Süre sayacını başlat
    startTimer();
  }
  
  // Boş bir 2048 oyun alanı oluştur (demo için)
  function createEmptyGrid() {
    grid2048.innerHTML = '';
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        grid2048.appendChild(cell);
      }
    }
    
    // Demo için birkaç hücreye değer ekle
    const cells = grid2048.querySelectorAll('.grid-cell');
    cells[0].textContent = '2';
    cells[0].classList.add('tile-2');
    cells[5].textContent = '2';
    cells[5].classList.add('tile-2');
    cells[10].textContent = '4';
    cells[10].classList.add('tile-4');
  }
  
  // Süre sayacını başlat
  function startTimer() {
    clearInterval(gameTimer);
    
    if (gameMode === 'TIME') {
      secondsElapsed = timeLimit;
      gameTimer = setInterval(function() {
        secondsElapsed--;
        timeDisplay.textContent = formatTime(secondsElapsed);
        
        if (secondsElapsed <= 0) {
          clearInterval(gameTimer);
          endGame('Süre doldu!');
        }
      }, 1000);
    } else {
      secondsElapsed = 0;
      gameTimer = setInterval(function() {
        secondsElapsed++;
      }, 1000);
    }
  }
  
  // Süreyi formatla (mm:ss)
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Oyunu sonlandır
  function endGame(reason) {
    clearInterval(gameTimer);
    gameOver = true;
    
    // Oyun sonu istatistiklerini göster
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-max-tile').textContent = maxTile;
    document.getElementById('final-moves').textContent = moves;
    
    // Skor tablosuna kaydet (simülasyon)
    saveScore();
    
    gameOverContainer.style.display = 'block';
    playSound('complete');
  }
  
  // Skor kaydet (simülasyon)
  function saveScore() {
    console.log('Skor kaydedildi:', {
      game_type: '2048',
      score: score,
      max_tile: maxTile,
      moves: moves,
      time: secondsElapsed,
      mode: gameMode
    });
  }
  
  // Mesaj göster
  function showMessage(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);
    
    // 5 saniye sonra mesajı kaldır
    setTimeout(() => {
      alert.style.opacity = '0';
      setTimeout(() => {
        alertContainer.innerHTML = '';
      }, 500);
    }, 5000);
  }
  
  // Ses çal
  function playSound(sound) {
    if (!soundEnabled) return;
    
    try {
      const audio = new Audio();
      switch (sound) {
        case 'click':
          audio.src = '/static/sounds/click.mp3';
          break;
        case 'merge':
          audio.src = '/static/sounds/correct.mp3';
          break;
        case 'move':
          audio.src = '/static/sounds/number.mp3';
          break;
        case 'complete':
          audio.src = '/static/sounds/level-up.mp3';
          break;
      }
      
      // Ses çalma işlemini promise yapısına çevir
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.log('Ses çalma hatası:', e);
        });
      }
    } catch (error) {
      console.log('Ses çalma hatası:', error);
    }
  }
  
  // Event Listeners
  startButton.addEventListener('click', function() {
    playSound('click');
    startGame();
  });
  
  modeButtons.forEach(button => {
    button.addEventListener('click', function() {
      modeButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      gameMode = this.dataset.mode;
      playSound('click');
    });
  });
  
  // Klavye kontrolleri
  document.addEventListener('keydown', function(e) {
    if (gameOver || !canMove) return;
    
    switch (e.key) {
      case 'ArrowUp':
        // Yukarı hareket
        playSound('move');
        break;
      case 'ArrowDown':
        // Aşağı hareket
        playSound('move');
        break;
      case 'ArrowLeft':
        // Sola hareket
        playSound('move');
        break;
      case 'ArrowRight':
        // Sağa hareket
        playSound('move');
        break;
    }
  });
  
  // Hamleyi geri al
  undoMoveButton.addEventListener('click', function() {
    showMessage('Geri alma özelliği yakında eklenecek!', 'info');
    playSound('click');
  });
  
  // Yeni oyun
  newGameButton.addEventListener('click', function() {
    showMessage('Yeni oyun başlatılıyor...', 'info');
    // Yeni oyunu başlat
    playSound('click');
  });
  
  // Sesi aç/kapat
  soundToggle.addEventListener('click', function() {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      this.innerHTML = '<i class="fas fa-volume-up"></i>';
      this.classList.add('active');
    } else {
      this.innerHTML = '<i class="fas fa-volume-mute"></i>';
      this.classList.remove('active');
    }
    playSound('click');
  });
  
  // Diğer butonlar için olay dinleyicileri
  if (pauseButton) {
    pauseButton.addEventListener('click', function() {
      pauseOverlay.style.display = 'flex';
      clearInterval(gameTimer);
      playSound('click');
    });
  }
  
  if (resumeButton) {
    resumeButton.addEventListener('click', function() {
      pauseOverlay.style.display = 'none';
      if (gameMode === 'TIME') {
        gameTimer = setInterval(function() {
          secondsElapsed--;
          timeDisplay.textContent = formatTime(secondsElapsed);
          
          if (secondsElapsed <= 0) {
            clearInterval(gameTimer);
            endGame('Süre doldu!');
          }
        }, 1000);
      } else {
        gameTimer = setInterval(function() {
          secondsElapsed++;
        }, 1000);
      }
      playSound('click');
    });
  }
  
  playAgainButton.addEventListener('click', function() {
    gameOverContainer.style.display = 'none';
    introSection.style.display = 'block';
    playSound('click');
  });
  
  // Bu kısım daha sonra uygulanacak gerçek oyun fonksiyonlarını içerecek
});