/**
 * Sudoku Oyunu - 1.0
 * 
 * Mantıksal düşünme ve sayısal çözümleme becerilerinizi geliştiren klasik Sudoku deneyimi.
 * 
 * Özellikler:
 * - Farklı zorluk seviyelerinde üretilen bulmacalar
 * - İpucu sistemi ve hata kontrolü
 * - İlerleme takibi ve zamanlayıcı
 * - Responsive tasarım ve mobil uyumluluk
 */

document.addEventListener('DOMContentLoaded', function() {
  // Oyun değişkenleri
  let score = 0;
  let difficulty = 'EASY';
  let gameTimer;
  let secondsElapsed = 0;
  let mistakes = 0;
  let puzzleCompleted = false;
  let soundEnabled = true;
  let currentPuzzle = null;
  let selectedCell = null;
  let solvedCells = 0;
  let totalCellsToSolve = 0;
  let originalCells = []; // Başlangıçta dolu olan hücreler
  
  // DOM Elementleri
  const startButton = document.getElementById('start-game');
  const introSection = document.getElementById('intro-section');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const pauseOverlay = document.getElementById('pause-overlay');
  const sudokuBoard = document.getElementById('sudoku-board');
  const difficultyButtons = document.querySelectorAll('.level-btn');
  const scoreDisplay = document.getElementById('score-display');
  const timeDisplay = document.getElementById('time-display');
  const progressDisplay = document.getElementById('progress-display');
  const errorDisplay = document.getElementById('error-display');
  const difficultyDisplay = document.getElementById('difficulty-display');
  const numberButtons = document.querySelectorAll('.number-btn');
  const pauseButton = document.getElementById('pause-game');
  const resumeButton = document.getElementById('resume-game');
  const soundToggle = document.getElementById('sound-toggle');
  const playAgainButton = document.getElementById('play-again');
  const hintButton = document.getElementById('hint-btn');
  const checkButton = document.getElementById('check-btn');
  const clearButton = document.getElementById('clear-btn');
  const progressBar = document.getElementById('progress-bar');
  const alertContainer = document.getElementById('alert-container');
  
  // Oyunu başlat
  function startGame() {
    showMessage('Sudoku oyunu yükleniyor...', 'info');
    // İlk aşamada sadece arayüzü gösterelim, gerçek oyun daha sonra yapılacak
    introSection.style.display = 'none';
    gameContainer.style.display = 'block';
    
    difficultyDisplay.textContent = difficulty;
    
    // Basit bir demo arayüzü oluştur
    createEmptySudokuBoard();
    
    showMessage('Bu oyun şu anda yapım aşamasındadır. Yakında tamamlanacaktır!', 'warning');
    
    // Süre sayacını başlat
    startTimer();
  }
  
  // Boş bir Sudoku tahtası oluştur (demo için)
  function createEmptySudokuBoard() {
    sudokuBoard.innerHTML = '';
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        // 3x3 bloklar için kenarlık stilini ayarla
        if (row % 3 === 2 && row < 8) {
          cell.style.borderBottom = '2px solid var(--accent-color)';
        }
        if (col % 3 === 2 && col < 8) {
          cell.style.borderRight = '2px solid var(--accent-color)';
        }
        
        // Hücre tıklama olayını ekle
        cell.addEventListener('click', function() {
          // Tıklanan hücreyi seç
          if (selectedCell) {
            selectedCell.classList.remove('selected');
          }
          this.classList.add('selected');
          selectedCell = this;
        });
        
        sudokuBoard.appendChild(cell);
      }
    }
  }
  
  // Süre sayacını başlat
  function startTimer() {
    clearInterval(gameTimer);
    secondsElapsed = 0;
    gameTimer = setInterval(function() {
      secondsElapsed++;
      timeDisplay.textContent = formatTime(secondsElapsed);
    }, 1000);
  }
  
  // Süreyi formatla (mm:ss)
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    
    const audio = new Audio();
    switch (sound) {
      case 'click':
        audio.src = '/static/sounds/click.mp3';
        break;
      case 'correct':
        audio.src = '/static/sounds/correct.mp3';
        break;
      case 'wrong':
        audio.src = '/static/sounds/wrong.mp3';
        break;
      case 'complete':
        audio.src = '/static/sounds/success.mp3';
        break;
    }
    
    audio.play().catch(e => console.log('Ses çalma hatası:', e));
  }
  
  // Event Listeners
  startButton.addEventListener('click', function() {
    playSound('click');
    startGame();
  });
  
  difficultyButtons.forEach(button => {
    button.addEventListener('click', function() {
      difficultyButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      difficulty = this.dataset.level;
      playSound('click');
    });
  });
  
  numberButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (!selectedCell) return;
      
      const number = this.dataset.number;
      if (number === '0') {
        // Silme butonu
        selectedCell.textContent = '';
      } else {
        selectedCell.textContent = number;
      }
      
      playSound('click');
    });
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
  pauseButton.addEventListener('click', function() {
    pauseOverlay.style.display = 'flex';
    clearInterval(gameTimer);
    playSound('click');
  });
  
  resumeButton.addEventListener('click', function() {
    pauseOverlay.style.display = 'none';
    gameTimer = setInterval(function() {
      secondsElapsed++;
      timeDisplay.textContent = formatTime(secondsElapsed);
    }, 1000);
    playSound('click');
  });
  
  playAgainButton.addEventListener('click', function() {
    gameOverContainer.style.display = 'none';
    introSection.style.display = 'block';
    playSound('click');
  });
  
  // İpucu, kontrol ve temizleme butonları
  hintButton.addEventListener('click', function() {
    showMessage('İpucu özelliği yakında eklenecek!', 'info');
    playSound('click');
  });
  
  checkButton.addEventListener('click', function() {
    showMessage('Kontrol özelliği yakında eklenecek!', 'info');
    playSound('click');
  });
  
  clearButton.addEventListener('click', function() {
    if (selectedCell) {
      selectedCell.textContent = '';
    }
    playSound('click');
  });
  
  // Bu kısım daha sonra uygulanacak gerçek oyun fonksiyonlarını içerecek
});