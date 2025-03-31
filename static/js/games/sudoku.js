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
    const progress = Math.floor((solvedCells / totalCellsToSolve) * 100);
    progressDisplay.textContent = `${progress}%`;
    progressPercent.textContent = `${progress}%`;
    progressBar.style.width = `${progress}%`;
    
    // Oyunu tamamladık mı kontrol et
    if (solvedCells === totalCellsToSolve) {
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