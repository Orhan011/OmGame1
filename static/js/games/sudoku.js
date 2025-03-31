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
  let selectedCell = null;
  let solvedCells = 0;
  let totalCellsToSolve = 0;
  let originalCells = []; // Başlangıçta dolu olan hücreler
  
  // Sudoku veri yapıları
  let sudokuBoard = Array(9).fill().map(() => Array(9).fill(0)); // Güncel tahta durumu
  let sudokuSolution = Array(9).fill().map(() => Array(9).fill(0)); // Çözülmüş tahta
  
  // Kolay Sudoku - sabit bir örnek
  const easySudoku = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ];
  
  // Orta Sudoku - sabit bir örnek
  const mediumSudoku = [
    [0, 0, 0, 2, 6, 0, 7, 0, 1],
    [6, 8, 0, 0, 7, 0, 0, 9, 0],
    [1, 9, 0, 0, 0, 4, 5, 0, 0],
    [8, 2, 0, 1, 0, 0, 0, 4, 0],
    [0, 0, 4, 6, 0, 2, 9, 0, 0],
    [0, 5, 0, 0, 0, 3, 0, 2, 8],
    [0, 0, 9, 3, 0, 0, 0, 7, 4],
    [0, 4, 0, 0, 5, 0, 0, 3, 6],
    [7, 0, 3, 0, 1, 8, 0, 0, 0]
  ];
  
  // Zor Sudoku - sabit bir örnek
  const hardSudoku = [
    [0, 2, 0, 6, 0, 8, 0, 0, 0],
    [5, 8, 0, 0, 0, 9, 7, 0, 0],
    [0, 0, 0, 0, 4, 0, 0, 0, 0],
    [3, 7, 0, 0, 0, 0, 5, 0, 0],
    [6, 0, 0, 0, 0, 0, 0, 0, 4],
    [0, 0, 8, 0, 0, 0, 0, 1, 3],
    [0, 0, 0, 0, 2, 0, 0, 0, 0],
    [0, 0, 9, 8, 0, 0, 0, 3, 6],
    [0, 0, 0, 3, 0, 6, 0, 9, 0]
  ];
  
  // DOM Elementleri
  const startButton = document.getElementById('start-game');
  const introSection = document.getElementById('intro-section');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const pauseOverlay = document.getElementById('pause-overlay');
  const sudokuBoardElement = document.getElementById('sudoku-board');
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
  const finalScore = document.getElementById('final-score');
  const finalTime = document.getElementById('final-time');
  const finalDifficulty = document.getElementById('final-difficulty');
  const progressPercent = document.getElementById('progress-percent');
  
  // Hataları sayacımız
  const updateErrorsDisplay = () => {
    errorDisplay.textContent = mistakes;
  };
  
  // İlerlemeyi güncelle
  const updateProgressDisplay = () => {
    const progress = Math.floor((solvedCells / totalCellsToSolve) * 100) || 0;
    progressDisplay.textContent = `${progress}%`;
    if (progressPercent) {
      progressPercent.textContent = `${progress}%`;
    }
    progressBar.style.width = `${progress}%`;
    
    // Oyunu tamamladık mı kontrol et
    if (solvedCells === totalCellsToSolve && totalCellsToSolve > 0) {
      completeGame();
    }
  };
  
  // Oyunu başlat
  function startGame() {
    showMessage('Sudoku oyunu yükleniyor...', 'info');
    
    introSection.style.display = 'none';
    gameContainer.style.display = 'block';
    
    // Zorluk seviyesine göre metni güncelle
    let difficultyText = 'KOLAY';
    if(difficulty === 'MEDIUM') difficultyText = 'ORTA';
    if(difficulty === 'HARD') difficultyText = 'ZOR';
    difficultyDisplay.textContent = difficultyText;
    
    // Değişkenleri sıfırla
    score = 0;
    mistakes = 0;
    solvedCells = 0;
    puzzleCompleted = false;
    originalCells = [];
    
    // Tahta oluştur
    createSudokuBoard();
    
    // Skorları sıfırla ve göster
    scoreDisplay.textContent = '0';
    errorDisplay.textContent = '0';
    
    // Süre sayacını başlat
    startTimer();
    
    // İlerlemeyi sıfırla
    updateProgressDisplay();
    
    showMessage('Sudoku oyunu başladı! İyi eğlenceler.', 'success');
  }
  
  // Sudoku tablosunu oluştur ve ekrana çiz
  function createSudokuBoard() {
    // Boş tahta temizle
    sudokuBoardElement.innerHTML = '';
    
    // Zorluk seviyesine göre bulmaca seç
    let puzzle;
    switch(difficulty) {
      case 'MEDIUM':
        puzzle = mediumSudoku;
        break;
      case 'HARD':
        puzzle = hardSudoku;
        break;
      default:
        puzzle = easySudoku;
    }
    
    // Bulmacayı kopyala
    sudokuBoard = puzzle.map(row => [...row]);
    sudokuSolution = solveSudoku(puzzle);
    
    // Çözülmesi gereken hücre sayısını hesapla
    totalCellsToSolve = 0;
    for(let i = 0; i < 9; i++) {
      for(let j = 0; j < 9; j++) {
        if(puzzle[i][j] === 0) {
          totalCellsToSolve++;
        }
      }
    }
    
    // Tahtayı oluştur
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        // 3x3 bloklar için kenarlık ayarla
        if (row % 3 === 2 && row < 8) {
          cell.style.borderBottom = '2px solid var(--accent-color)';
        }
        if (col % 3 === 2 && col < 8) {
          cell.style.borderRight = '2px solid var(--accent-color)';
        }
        
        // Başlangıç değerlerini ekle
        if (puzzle[row][col] !== 0) {
          cell.textContent = puzzle[row][col];
          cell.classList.add('fixed');
          originalCells.push(`${row}-${col}`);
        } else {
          // Boş hücrelere tıklama olayı ekle
          cell.addEventListener('click', function() {
            selectCell(this);
          });
        }
        
        sudokuBoardElement.appendChild(cell);
      }
    }
  }
  
  // Seçili hücreyi değiştir
  function selectCell(cell) {
    // Sabit hücre ise seçme
    if (cell.classList.contains('fixed')) return;
    
    // Önceki seçimi kaldır
    if (selectedCell) {
      selectedCell.classList.remove('selected');
    }
    
    // Yeni hücreyi seç
    cell.classList.add('selected');
    selectedCell = cell;
    
    playSound('click');
  }
  
  // Hücreye sayı gir
  function enterNumber(number) {
    if (!selectedCell || selectedCell.classList.contains('fixed')) return;
    
    const row = parseInt(selectedCell.dataset.row);
    const col = parseInt(selectedCell.dataset.col);
    
    // Değeri güncelle
    if (number === 0) {
      // Silme işlemi
      selectedCell.textContent = '';
      selectedCell.classList.remove('error', 'valid');
      sudokuBoard[row][col] = 0;
    } else {
      // Sayı girme işlemi
      selectedCell.textContent = number;
      sudokuBoard[row][col] = number;
      
      // Sayının doğruluğunu kontrol et
      if (number === sudokuSolution[row][col]) {
        selectedCell.classList.add('valid');
        selectedCell.classList.remove('error');
        if (!selectedCell.classList.contains('correct')) {
          selectedCell.classList.add('correct');
          solvedCells++;
          score += 10; // Her doğru cevap için 10 puan
          scoreDisplay.textContent = score;
          updateProgressDisplay();
          playSound('correct');
        }
      } else {
        selectedCell.classList.add('error');
        selectedCell.classList.remove('valid', 'correct');
        mistakes++;
        updateErrorsDisplay();
        playSound('wrong');
      }
    }
  }
  
  // Tüm tahtanın doğruluğunu kontrol et
  function checkBoard() {
    let allCorrect = true;
    const cells = sudokuBoardElement.querySelectorAll('.sudoku-cell:not(.fixed)');
    
    cells.forEach(cell => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const value = parseInt(cell.textContent) || 0;
      
      if (value === 0) {
        allCorrect = false; // Boş hücre varsa tam doğru değil
      } else if (value !== sudokuSolution[row][col]) {
        // Yanlış değeri işaretle
        cell.classList.add('error');
        cell.classList.remove('valid', 'correct');
        allCorrect = false;
      } else {
        // Doğru değeri işaretle
        cell.classList.add('valid');
        cell.classList.remove('error');
        if (!cell.classList.contains('correct')) {
          cell.classList.add('correct');
          solvedCells++;
        }
      }
    });
    
    updateProgressDisplay();
    
    return allCorrect;
  }
  
  // İpucu ver
  function giveHint() {
    if (!selectedCell || selectedCell.classList.contains('fixed') || selectedCell.classList.contains('correct')) {
      showMessage('Lütfen ipucu almak için boş bir hücre seçin.', 'warning');
      return;
    }
    
    const row = parseInt(selectedCell.dataset.row);
    const col = parseInt(selectedCell.dataset.col);
    const correctValue = sudokuSolution[row][col];
    
    // İpucu olarak doğru değeri göster
    selectedCell.textContent = correctValue;
    selectedCell.classList.add('hint', 'valid', 'correct');
    selectedCell.classList.remove('error');
    
    // Puanı azalt, doğru çözülen hücre sayısını artır
    score = Math.max(0, score - 5); // Her ipucu için 5 puan kaybı
    scoreDisplay.textContent = score;
    solvedCells++;
    updateProgressDisplay();
    
    playSound('correct');
    showMessage('İpucu kullanıldı! Bu hücrenin doğru değeri gösterildi.', 'info');
  }
  
  // Tüm tahtayı temizle (sadece kullanıcının girebileceği hücreleri)
  function clearBoard() {
    const cells = sudokuBoardElement.querySelectorAll('.sudoku-cell:not(.fixed)');
    
    cells.forEach(cell => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      
      cell.textContent = '';
      cell.classList.remove('error', 'valid', 'correct', 'hint');
      sudokuBoard[row][col] = 0;
    });
    
    // Değişkenleri sıfırla
    solvedCells = 0;
    updateProgressDisplay();
    
    playSound('click');
    showMessage('Tahta temizlendi. Yeniden başlayabilirsiniz.', 'info');
  }
  
  // Oyunu tamamla
  function completeGame() {
    clearInterval(gameTimer);
    puzzleCompleted = true;
    
    // Final skorunu hesapla (doğruluk ve zamana göre)
    const timeBonus = Math.max(0, 1000 - secondsElapsed) / 10;
    const mistakePenalty = mistakes * 10;
    const finalScore = score + timeBonus - mistakePenalty;
    score = Math.max(0, Math.floor(finalScore));
    
    // Sonuç ekranını hazırla
    finalScore.textContent = score;
    finalTime.textContent = formatTime(secondsElapsed);
    
    let difficultyText = 'Kolay';
    if(difficulty === 'MEDIUM') difficultyText = 'Orta';
    if(difficulty === 'HARD') difficultyText = 'Zor';
    finalDifficulty.textContent = difficultyText;
    
    // Sonuç ekranını göster
    playSound('complete');
    setTimeout(() => {
      gameContainer.style.display = 'none';
      gameOverContainer.style.display = 'block';
      
      // Skoru API'ye gönder
      saveScore();
    }, 1000);
  }
  
  // Skoru API'ye gönder
  function saveScore() {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: 'sudoku',
        score: score,
        difficulty: difficulty
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Skor kaydedildi:', data);
    })
    .catch(error => {
      console.error('Skor kaydedilemedi:', error);
    });
  }
  
  // Süre sayacını başlat
  function startTimer() {
    clearInterval(gameTimer);
    secondsElapsed = 0;
    timeDisplay.textContent = formatTime(secondsElapsed);
    
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
    
    try {
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
  
  // Sudoku çözücü algoritması (backtracking)
  function solveSudoku(board) {
    const solution = board.map(row => [...row]);
    
    // Backtracking algoritması
    function solve() {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (solution[row][col] === 0) {
            for (let num = 1; num <= 9; num++) {
              if (isValid(solution, row, col, num)) {
                solution[row][col] = num;
                
                if (solve()) {
                  return true;
                }
                
                solution[row][col] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    }
    
    solve();
    return solution;
  }
  
  // Sudoku geçerlilik kontrolü
  function isValid(board, row, col, num) {
    // Satır kontrolü
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num) {
        return false;
      }
    }
    
    // Sütun kontrolü
    for (let x = 0; x < 9; x++) {
      if (board[x][col] === num) {
        return false;
      }
    }
    
    // 3x3 kutu kontrolü
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[boxRow + i][boxCol + j] === num) {
          return false;
        }
      }
    }
    
    return true;
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
      if (!selectedCell || puzzleCompleted) return;
      
      const number = parseInt(this.dataset.number);
      enterNumber(number);
    });
  });
  
  // Klavye olaylarını dinle
  document.addEventListener('keydown', function(e) {
    if (!selectedCell || puzzleCompleted) return;
    
    // Sayı tuşları (1-9)
    if (e.key >= '1' && e.key <= '9') {
      enterNumber(parseInt(e.key));
    }
    
    // Silme tuşları
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      enterNumber(0);
    }
    
    // Ok tuşları
    if (e.key.startsWith('Arrow')) {
      navigateWithArrowKeys(e.key);
    }
  });
  
  // Ok tuşlarıyla gezinme
  function navigateWithArrowKeys(key) {
    if (!selectedCell) return;
    
    const currentRow = parseInt(selectedCell.dataset.row);
    const currentCol = parseInt(selectedCell.dataset.col);
    let newRow = currentRow;
    let newCol = currentCol;
    
    switch(key) {
      case 'ArrowUp':
        newRow = Math.max(0, currentRow - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(8, currentRow + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, currentCol - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(8, currentCol + 1);
        break;
    }
    
    // Yeni hücreyi seç
    if (newRow !== currentRow || newCol !== currentCol) {
      const newCell = sudokuBoardElement.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
      if (newCell && !newCell.classList.contains('fixed')) {
        selectCell(newCell);
      }
    }
  }
  
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
      gameTimer = setInterval(function() {
        secondsElapsed++;
        timeDisplay.textContent = formatTime(secondsElapsed);
      }, 1000);
      playSound('click');
    });
  }
  
  playAgainButton.addEventListener('click', function() {
    gameOverContainer.style.display = 'none';
    introSection.style.display = 'block';
    playSound('click');
  });
  
  // İpucu, kontrol ve temizleme butonları
  hintButton.addEventListener('click', function() {
    if (puzzleCompleted) return;
    giveHint();
    playSound('click');
  });
  
  checkButton.addEventListener('click', function() {
    if (puzzleCompleted) return;
    const isCorrect = checkBoard();
    
    if (isCorrect && solvedCells === totalCellsToSolve) {
      completeGame();
      showMessage('Tebrikler! Sudoku bulmacasını başarıyla tamamladınız!', 'success');
    } else {
      showMessage('Kontrol tamamlandı. Doğru ve yanlış hücreler işaretlendi.', 'info');
    }
    
    playSound('click');
  });
  
  clearButton.addEventListener('click', function() {
    if (puzzleCompleted) return;
    clearBoard();
  });
  
  // Hemen başlangıçta bir mesaj göster
  showMessage('Hemen oynamaya başla! Sudoku bulmacasını çöz ve puanlarını topla.', 'info');
});
/**
 * Sudoku Oyunu
 * 
 * Bu dosya ZekaPark platformu için Sudoku oyununu içerir.
 * Oyun, mantık ve stratejiye dayalı klasik bir sayı bulmacasıdır.
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const introSection = document.getElementById('intro-section');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const pauseMenu = document.getElementById('pause-menu');
  
  const startGameBtn = document.getElementById('start-game');
  const pauseGameBtn = document.getElementById('pause-game');
  const resumeGameBtn = document.getElementById('resume-game-btn');
  const restartGameBtn = document.getElementById('restart-game-btn');
  const restartGameButton = document.getElementById('restart-game-button');
  const playAgainBtn = document.getElementById('play-again-btn');
  const soundToggleBtn = document.getElementById('sound-toggle');
  const checkSolutionBtn = document.getElementById('check-solution-btn');
  
  const difficultyBtns = document.querySelectorAll('.level-btn');
  const sudokuBoard = document.getElementById('sudoku-board');
  const numberSelectionPanel = document.getElementById('number-selection-panel');
  const numberBtns = document.querySelectorAll('.number-btn');
  const noteToggleBtn = document.getElementById('note-toggle');
  const eraserBtn = document.getElementById('eraser-btn');
  const hintBtn = document.getElementById('hint-btn');
  
  // Göstergeler ve İstatistikler
  const scoreDisplay = document.getElementById('score-display');
  const timeDisplay = document.getElementById('time-display');
  const progressDisplay = document.getElementById('progress-display');
  const errorDisplay = document.getElementById('error-display');
  const difficultyDisplay = document.getElementById('difficulty-display');
  
  const finalScore = document.getElementById('final-score');
  const finalTime = document.getElementById('final-time');
  const finalErrors = document.getElementById('final-errors');
  const ratingStars = document.getElementById('rating-stars');
  const ratingText = document.getElementById('rating-text');
  
  // Oyun Durumu
  const gameState = {
    difficulty: 'EASY', // EASY, MEDIUM, HARD
    board: [], // Sudoku tahtası (çözümü ile birlikte)
    visibleBoard: [], // Görünen tahta (boşluklar ile)
    selectedCell: null, // Seçili hücre
    noteMode: false, // Not alma modu
    isGameActive: false, // Oyun aktif mi?
    isPaused: false, // Oyun duraklatıldı mı?
    isSoundOn: true, // Ses açık mı?
    timer: 0, // Geçen süre (saniye)
    timerInterval: null, // Zaman sayacı
    score: 0, // Puan
    errors: 0, // Hata sayısı
    hintsUsed: 0, // Kullanılan ipucu sayısı
    filledCells: 0, // Doldurulmuş hücre sayısı
    totalCellsToFill: 0, // Doldurulması gereken toplam hücre sayısı
  };
  
  // Zorluk seviyelerine göre ayarlar
  const difficultySettings = {
    EASY: {
      cellsToRemove: 30, // 30 hücre silinecek (81-30=51 ipucu)
      baseScore: 1000,
      errorPenalty: 50,
      hintPenalty: 25,
      timeBonus: 5, // Her 1 dakika altında bonus puan
    },
    MEDIUM: {
      cellsToRemove: 45, // 45 hücre silinecek (81-45=36 ipucu)
      baseScore: 2000,
      errorPenalty: 100,
      hintPenalty: 50,
      timeBonus: 10,
    },
    HARD: {
      cellsToRemove: 55, // 55 hücre silinecek (81-55=26 ipucu)
      baseScore: 3000,
      errorPenalty: 150,
      hintPenalty: 75,
      timeBonus: 15,
    }
  };
  
  // Ses Efektleri
  const sounds = {
    place: new Audio('/static/sounds/place.mp3'),
    error: new Audio('/static/sounds/error.mp3'),
    complete: new Audio('/static/sounds/complete.mp3'),
    click: new Audio('/static/sounds/click.mp3'),
    hint: new Audio('/static/sounds/hint.mp3')
  };
  
  // İnitialize oyun elementleri
  function initGame() {
    // Event listeners
    startGameBtn.addEventListener('click', startGame);
    pauseGameBtn.addEventListener('click', togglePause);
    resumeGameBtn.addEventListener('click', togglePause);
    restartGameBtn.addEventListener('click', restartGame);
    restartGameButton.addEventListener('click', restartGame);
    playAgainBtn.addEventListener('click', resetGame);
    soundToggleBtn.addEventListener('click', toggleSound);
    checkSolutionBtn.addEventListener('click', checkSolution);
    
    // Zorluk seviyesi butonları
    difficultyBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        // Aktif sınıfı kaldır
        difficultyBtns.forEach(b => b.classList.remove('active'));
        // Tıklanan butona aktif sınıfı ekle
        this.classList.add('active');
        // Zorluk seviyesini güncelle
        gameState.difficulty = this.dataset.level;
      });
    });
    
    // Not modunu değiştir
    noteToggleBtn.addEventListener('click', function() {
      gameState.noteMode = !gameState.noteMode;
      this.classList.toggle('active', gameState.noteMode);
      playSound('click');
    });
    
    // Silgi butonu
    eraserBtn.addEventListener('click', function() {
      if (gameState.selectedCell) {
        const cell = document.querySelector(`.sudoku-cell[data-row="${gameState.selectedCell.row}"][data-col="${gameState.selectedCell.col}"]`);
        if (cell && !cell.classList.contains('given')) {
          cell.textContent = '';
          cell.classList.remove('filled', 'error');
          cell.classList.add('empty');
          // Hücreyi temizle
          gameState.visibleBoard[gameState.selectedCell.row][gameState.selectedCell.col] = 0;
          // Oyun ilerlemesini güncelle
          updateGameProgress();
          playSound('click');
        }
      }
    });
    
    // İpucu butonu
    hintBtn.addEventListener('click', giveHint);
    
    // Sayı butonları
    numberBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const number = parseInt(this.dataset.number);
        if (gameState.selectedCell && !isNaN(number)) {
          placeNumber(number);
        }
      });
    });
    
    // Klavye kontrolleri
    document.addEventListener('keydown', handleKeyDown);
  }
  
  // Oyunu başlat
  function startGame() {
    introSection.style.display = 'none';
    gameContainer.style.display = 'block';
    gameOverContainer.style.display = 'none';
    
    // Zorluk seviyesini göster
    difficultyDisplay.textContent = gameState.difficulty;
    
    // Yeni bir Sudoku tahtası oluştur
    generateSudoku();
    
    // Tahtayı görselleştir
    renderBoard();
    
    // Oyun durumunu aktif olarak ayarla
    gameState.isGameActive = true;
    gameState.isPaused = false;
    
    // Zamanlayıcıyı başlat
    startTimer();
    
    // İlk oyun ilerlemesini göster
    updateGameProgress();
  }
  
  // Zamanlayıcıyı başlat
  function startTimer() {
    gameState.timer = 0;
    updateTimerDisplay();
    
    gameState.timerInterval = setInterval(function() {
      if (!gameState.isPaused) {
        gameState.timer++;
        updateTimerDisplay();
      }
    }, 1000);
  }
  
  // Zamanlayıcıyı güncelle
  function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timer / 60);
    const seconds = gameState.timer % 60;
    const displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timeDisplay.textContent = displayTime;
  }
  
  // Oyunu duraklat/devam ettir
  function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
      pauseMenu.style.display = 'flex';
      gameContainer.classList.add('blurred');
    } else {
      pauseMenu.style.display = 'none';
      gameContainer.classList.remove('blurred');
    }
    
    playSound('click');
  }
  
  // Oyunu yeniden başlat
  function restartGame() {
    // Eski zamanlayıcıyı temizle
    clearInterval(gameState.timerInterval);
    
    // Aynı zorluk seviyesi ile oyunu başlat
    startGame();
    
    // Duraklatma menüsünü kapat
    pauseMenu.style.display = 'none';
    gameContainer.classList.remove('blurred');
    gameState.isPaused = false;
    
    playSound('click');
  }
  
  // Oyunu sıfırla
  function resetGame() {
    // Eski zamanlayıcıyı temizle
    clearInterval(gameState.timerInterval);
    
    // Oyun durumunu sıfırla
    gameState.isGameActive = false;
    gameState.board = [];
    gameState.visibleBoard = [];
    gameState.selectedCell = null;
    gameState.noteMode = false;
    gameState.timer = 0;
    gameState.score = 0;
    gameState.errors = 0;
    gameState.hintsUsed = 0;
    gameState.filledCells = 0;
    gameState.totalCellsToFill = 0;
    
    // Giriş ekranını göster
    introSection.style.display = 'block';
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'none';
    pauseMenu.style.display = 'none';
    gameContainer.classList.remove('blurred');
    
    playSound('click');
  }
  
  // Sudoku tahtası oluştur
  function generateSudoku() {
    // Boş bir 9x9 tahta oluştur
    gameState.board = Array(9).fill().map(() => Array(9).fill(0));
    
    // Tahtayı doldur (backtracking algoritması)
    fillBoard(gameState.board, 0, 0);
    
    // Çözümlü tahtanın kopyasını oluştur
    gameState.visibleBoard = gameState.board.map(row => [...row]);
    
    // Zorluk seviyesine göre hücreleri kaldır
    const cellsToRemove = difficultySettings[gameState.difficulty].cellsToRemove;
    removeCells(cellsToRemove);
    
    // Doldurulması gereken toplam hücreleri hesapla
    gameState.totalCellsToFill = cellsToRemove;
    gameState.filledCells = 0;
  }
  
  // Sudoku çözücü algoritması (backtracking)
  function fillBoard(board, row, col) {
    // Eğer son sütunu geçtiyse, bir sonraki satıra geç
    if (col >= 9) {
      col = 0;
      row++;
      
      // Eğer son satırı geçtiyse, tahta doldurulmuş demektir
      if (row >= 9) {
        return true;
      }
    }
    
    // Eğer hücre zaten doluysa, bir sonraki hücreye geç
    if (board[row][col] !== 0) {
      return fillBoard(board, row, col + 1);
    }
    
    // 1-9 arası sayıları karıştır
    const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    
    // Her sayıyı dene
    for (let i = 0; i < numbers.length; i++) {
      const num = numbers[i];
      
      // Eğer sayı geçerliyse, yerleştir
      if (isValidPlacement(board, row, col, num)) {
        board[row][col] = num;
        
        // Recursively bir sonraki hücreyi doldur
        if (fillBoard(board, row, col + 1)) {
          return true;
        }
        
        // Eğer bir sonraki hücreyi dolduramadıysak, bu hücreyi sıfırla (backtrack)
        board[row][col] = 0;
      }
    }
    
    // Hiçbir sayı yerleştirilemezse, false döndür (backtrack)
    return false;
  }
  
  // Sayı yerleştirme geçerli mi kontrol et
  function isValidPlacement(board, row, col, num) {
    // Satırda çakışma kontrolü
    for (let i = 0; i < 9; i++) {
      if (board[row][i] === num) {
        return false;
      }
    }
    
    // Sütunda çakışma kontrolü
    for (let i = 0; i < 9; i++) {
      if (board[i][col] === num) {
        return false;
      }
    }
    
    // 3x3 kutuda çakışma kontrolü
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[boxRow + i][boxCol + j] === num) {
          return false;
        }
      }
    }
    
    // Herhangi bir çakışma yoksa, geçerli bir yerleştirme
    return true;
  }
  
  // Zorluk seviyesine göre hücreleri kaldır
  function removeCells(cellsToRemove) {
    const positions = [];
    
    // Tüm pozisyonları listeye ekle
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        positions.push({ row, col });
      }
    }
    
    // Pozisyonları karıştır
    shuffleArray(positions);
    
    // Belirtilen sayıda hücreyi kaldır
    for (let i = 0; i < cellsToRemove; i++) {
      const { row, col } = positions[i];
      gameState.visibleBoard[row][col] = 0;
    }
  }
  
  // Tahtayı görselleştir
  function renderBoard() {
    // Önce tahtayı temizle
    sudokuBoard.innerHTML = '';
    
    // 9x9 grid oluştur
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cellValue = gameState.visibleBoard[row][col];
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        // Hücre sınırlarını ekle
        if (row % 3 === 0) cell.classList.add('border-top');
        if (row === 8) cell.classList.add('border-bottom');
        if (col % 3 === 0) cell.classList.add('border-left');
        if (col === 8) cell.classList.add('border-right');
        
        // Hücre değerini ayarla
        if (cellValue !== 0) {
          cell.textContent = cellValue;
          cell.classList.add('given'); // Başlangıçta verilen ipuçlarını işaretle
        } else {
          cell.classList.add('empty');
        }
        
        // Hücre tıklama olay dinleyicisini ekle
        cell.addEventListener('click', function() {
          if (gameState.isGameActive && !gameState.isPaused) {
            // Önceki seçili hücreyi temizle
            const previousCell = document.querySelector('.sudoku-cell.selected');
            if (previousCell) previousCell.classList.remove('selected');
            
            // Yeni hücreyi seç
            this.classList.add('selected');
            gameState.selectedCell = { row, col };
            
            playSound('click');
          }
        });
        
        sudokuBoard.appendChild(cell);
      }
    }
  }
  
  // Sayı yerleştir
  function placeNumber(number) {
    if (!gameState.selectedCell) return;
    
    const { row, col } = gameState.selectedCell;
    const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    
    // Eğer hücre başlangıçta verilen bir ipucuysa, değiştirilemez
    if (cell.classList.contains('given')) {
      return;
    }
    
    // Not modunda ise farklı işlem yap
    if (gameState.noteMode) {
      // Not modunu uygula
      handleNoteMode(cell, number);
      return;
    }
    
    // Eğer sayı tahtadaki çözüme uygunsa
    if (gameState.board[row][col] === number) {
      cell.textContent = number;
      cell.classList.remove('empty', 'error');
      cell.classList.add('filled');
      
      // Daha önce doldurulmamışsa ilerlemeyi artır
      if (gameState.visibleBoard[row][col] === 0) {
        gameState.filledCells++;
      }
      
      // Tahtayı güncelle
      gameState.visibleBoard[row][col] = number;
      
      // Oyun ilerlemesini güncelle
      updateGameProgress();
      
      // Doğru ses çal
      playSound('place');
      
      // Tahta tamamlandı mı kontrol et
      if (isBoardComplete()) {
        endGame(true);
      }
    } else {
      // Yanlış sayı
      cell.textContent = number;
      cell.classList.remove('empty');
      cell.classList.add('error');
      
      // Hata sayısını artır
      gameState.errors++;
      errorDisplay.textContent = gameState.errors;
      
      // Hata sesi çal
      playSound('error');
    }
  }
  
  // Not modunu işle
  function handleNoteMode(cell, number) {
    // Not içeriğini al veya oluştur
    let notes = cell.dataset.notes ? JSON.parse(cell.dataset.notes) : [];
    
    // Notlar içinde sayı var mı kontrol et
    const index = notes.indexOf(number);
    
    if (index === -1) {
      // Sayı notlarda yoksa ekle
      notes.push(number);
    } else {
      // Sayı notlarda varsa kaldır
      notes.splice(index, 1);
    }
    
    // Notları sırala
    notes.sort((a, b) => a - b);
    
    // Notları hücreye kaydet
    cell.dataset.notes = JSON.stringify(notes);
    
    // Notları görsel olarak göster
    renderNotes(cell, notes);
    
    playSound('click');
  }
  
  // Notları görselleştir
  function renderNotes(cell, notes) {
    // Hücreyi temizle
    cell.textContent = '';
    cell.innerHTML = '';
    
    // Not grid oluştur
    const notesGrid = document.createElement('div');
    notesGrid.className = 'notes-grid';
    
    // 3x3 grid olarak notları yerleştir
    for (let i = 1; i <= 9; i++) {
      const noteCell = document.createElement('div');
      noteCell.className = 'note-cell';
      
      // Eğer not listesinde varsa sayıyı göster
      if (notes.includes(i)) {
        noteCell.textContent = i;
      }
      
      notesGrid.appendChild(noteCell);
    }
    
    cell.appendChild(notesGrid);
  }
  
  // İpucu ver
  function giveHint() {
    if (!gameState.isGameActive || gameState.isPaused) return;
    
    // Boş hücreleri bul
    const emptyCells = [];
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gameState.visibleBoard[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }
    
    if (emptyCells.length === 0) return;
    
    // Rastgele bir boş hücre seç
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const { row, col } = randomCell;
    
    // Hücreyi doldur
    gameState.visibleBoard[row][col] = gameState.board[row][col];
    
    // Tahta görünümünü güncelle
    const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    cell.textContent = gameState.board[row][col];
    cell.classList.remove('empty', 'error');
    cell.classList.add('filled', 'hint'); // Hint sınıfını ekleyerek vurgula
    
    // İpucu kullanım sayısını artır
    gameState.hintsUsed++;
    
    // İlerlemeyi güncelle
    gameState.filledCells++;
    updateGameProgress();
    
    // İpucu sesi çal
    playSound('hint');
    
    // Tahta tamamlandı mı kontrol et
    if (isBoardComplete()) {
      endGame(true);
    }
  }
  
  // Klavye tuşlarını dinle
  function handleKeyDown(e) {
    if (!gameState.isGameActive || gameState.isPaused) return;
    
    // Sayı tuşları (1-9)
    if (e.key >= '1' && e.key <= '9') {
      const number = parseInt(e.key);
      placeNumber(number);
    }
    
    // Yön tuşları ile hücre seçimi
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      moveSelection(e.key);
    }
    
    // Backspace veya Delete tuşları ile silme
    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (gameState.selectedCell) {
        const { row, col } = gameState.selectedCell;
        const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
        
        if (!cell.classList.contains('given')) {
          cell.textContent = '';
          cell.classList.remove('filled', 'error');
          cell.classList.add('empty');
          
          // Hücreyi temizle
          gameState.visibleBoard[row][col] = 0;
          
          // İlerlemeyi güncelle
          updateGameProgress();
        }
      }
    }
    
    // N tuşu ile not modu
    if (e.key === 'n' || e.key === 'N') {
      gameState.noteMode = !gameState.noteMode;
      noteToggleBtn.classList.toggle('active', gameState.noteMode);
    }
  }
  
  // Yön tuşları ile hücre seçimini taşı
  function moveSelection(direction) {
    if (!gameState.selectedCell) {
      // Eğer henüz bir hücre seçilmemişse, sol üst köşeden başla
      gameState.selectedCell = { row: 0, col: 0 };
    } else {
      // Mevcut seçimi al
      const { row, col } = gameState.selectedCell;
      
      // Yeni konumu hesapla
      let newRow = row;
      let newCol = col;
      
      switch (direction) {
        case 'ArrowUp':
          newRow = Math.max(0, row - 1);
          break;
        case 'ArrowDown':
          newRow = Math.min(8, row + 1);
          break;
        case 'ArrowLeft':
          newCol = Math.max(0, col - 1);
          break;
        case 'ArrowRight':
          newCol = Math.min(8, col + 1);
          break;
      }
      
      // Seçimi güncelle
      if (newRow !== row || newCol !== col) {
        // Önceki seçili hücreyi temizle
        const previousCell = document.querySelector('.sudoku-cell.selected');
        if (previousCell) previousCell.classList.remove('selected');
        
        // Yeni hücreyi seç
        gameState.selectedCell = { row: newRow, col: newCol };
        const newCell = document.querySelector(`.sudoku-cell[data-row="${newRow}"][data-col="${newCol}"]`);
        if (newCell) newCell.classList.add('selected');
      }
    }
  }
  
  // Çözümü kontrol et
  function checkSolution() {
    if (!gameState.isGameActive) return;
    
    let isCorrect = true;
    let errorCells = [];
    
    // Tüm dolu hücreleri kontrol et
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cellValue = gameState.visibleBoard[row][col];
        
        // Boş hücreleri atla
        if (cellValue === 0) continue;
        
        // Değer doğru mu kontrol et
        if (cellValue !== gameState.board[row][col]) {
          isCorrect = false;
          errorCells.push({ row, col });
        }
      }
    }
    
    // Hataları göster
    errorCells.forEach(({ row, col }) => {
      const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
      cell.classList.add('error');
    });
    
    // Sonucu bildir
    if (isCorrect) {
      // Tüm tahta doldurulmuşsa oyunu bitir
      if (isBoardComplete()) {
        endGame(true);
      } else {
        showAlert('Şu ana kadar her şey doğru. Devam edin!', 'success');
      }
    } else {
      showAlert(`${errorCells.length} hatalı hücre bulundu!`, 'error');
      
      // Hata sayısını artır
      gameState.errors += 1;
      errorDisplay.textContent = gameState.errors;
      
      // Hata sesi çal
      playSound('error');
    }
  }
  
  // Oyun ilerlemesini güncelle
  function updateGameProgress() {
    // Doldurulan hücre yüzdesini hesapla
    const progress = Math.floor((gameState.filledCells / gameState.totalCellsToFill) * 100);
    progressDisplay.textContent = `${progress}%`;
    
    // Skoru hesapla ve göster
    updateScore();
  }
  
  // Skoru güncelle
  function updateScore() {
    // Temel puan
    const baseScore = difficultySettings[gameState.difficulty].baseScore;
    
    // Hata cezası
    const errorPenalty = gameState.errors * difficultySettings[gameState.difficulty].errorPenalty;
    
    // İpucu cezası
    const hintPenalty = gameState.hintsUsed * difficultySettings[gameState.difficulty].hintPenalty;
    
    // Basit puan hesaplama
    gameState.score = Math.max(0, baseScore - errorPenalty - hintPenalty);
    
    // Skoru göster
    scoreDisplay.textContent = gameState.score;
  }
  
  // Tahta tamamlandı mı
  function isBoardComplete() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gameState.visibleBoard[row][col] === 0) {
          return false;
        }
      }
    }
    return true;
  }
  
  // Oyunu bitir
  function endGame(completed) {
    // Zamanlayıcıyı durdur
    clearInterval(gameState.timerInterval);
    
    // Oyunu pasif yap
    gameState.isGameActive = false;
    
    // Zaman bonusu ekle (10 dakikadan kısa sürede tamamlandıysa)
    const timeInMinutes = gameState.timer / 60;
    let timeBonus = 0;
    
    if (completed && timeInMinutes < 10) {
      const minutesUnder10 = 10 - timeInMinutes;
      timeBonus = Math.floor(minutesUnder10 * difficultySettings[gameState.difficulty].timeBonus * 10);
      gameState.score += timeBonus;
    }
    
    // Final sonuçlarını göster
    finalScore.textContent = gameState.score;
    finalTime.textContent = timeDisplay.textContent;
    finalErrors.textContent = gameState.errors;
    
    // Rating belirle (5 üzerinden)
    let rating = 5;
    if (gameState.errors > 0) rating--;
    if (gameState.errors > 3) rating--;
    if (gameState.hintsUsed > 0) rating--;
    if (gameState.hintsUsed > 3) rating--;
    
    // Yıldızları göster
    const stars = ratingStars.querySelectorAll('i');
    for (let i = 0; i < stars.length; i++) {
      if (i < rating) {
        stars[i].className = 'fas fa-star';
      } else {
        stars[i].className = 'far fa-star';
      }
    }
    
    // Rating metnini güncelle
    const ratingTexts = ['Yeniden deneyin', 'Geliştirmelisiniz', 'İyi', 'Çok iyi', 'Mükemmel'];
    ratingText.textContent = ratingTexts[rating - 1];
    
    // Başarım kontrol et
    let achievement = null;
    
    if (completed) {
      if (rating === 5 && gameState.difficulty === 'HARD') {
        achievement = { name: 'Sudoku Ustası' };
      } else if (rating >= 4 && gameState.difficulty === 'HARD') {
        achievement = { name: 'Sudoku Dahisi' };
      } else if (timeInMinutes < 5 && gameState.difficulty !== 'EASY') {
        achievement = { name: 'Hız Ustası' };
      } else if (gameState.errors === 0) {
        achievement = { name: 'Kusursuz Çözüm' };
      }
    }
    
    // Başarım göster
    if (achievement) {
      document.getElementById('sudoku-achievement').style.display = 'flex';
      document.getElementById('achievement-name').textContent = achievement.name;
    } else {
      document.getElementById('sudoku-achievement').style.display = 'none';
    }
    
    // Oyun sonucu ekranını göster
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'block';
    
    // Tamamlanma sesi çal
    if (completed) {
      playSound('complete');
      saveScore();
    }
  }
  
  // Skoru kaydet
  function saveScore() {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameType: 'sudoku',
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
  
  // Uyarı göster
  function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    alertContainer.textContent = message;
    alertContainer.className = 'sudoku-alert';
    alertContainer.classList.add(type);
    
    alertContainer.style.display = 'block';
    setTimeout(() => {
      alertContainer.style.display = 'none';
    }, 3000);
  }
  
  // Ses çal
  function playSound(sound) {
    if (gameState.isSoundOn && sounds[sound]) {
      sounds[sound].currentTime = 0;
      sounds[sound].play().catch(e => console.log('Sound error:', e));
    }
  }
  
  // Sesi aç/kapa
  function toggleSound() {
    gameState.isSoundOn = !gameState.isSoundOn;
    soundToggleBtn.classList.toggle('active', gameState.isSoundOn);
    
    if (gameState.isSoundOn) {
      soundToggleBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    } else {
      soundToggleBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
  }
  
  // Yardımcı fonksiyonlar
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  // Oyunu başlat
  initGame();
});
