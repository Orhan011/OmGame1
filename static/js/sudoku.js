
// Sudoku oyunu için JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Oyun durumu
  const gameState = {
    board: Array(9).fill().map(() => Array(9).fill(0)),
    solution: Array(9).fill().map(() => Array(9).fill(0)),
    selectedCell: null,
    difficulty: 'easy',
    notesMode: false,
    timeStarted: null,
    timerInterval: null,
    gameCompleted: false,
    hintsUsed: 0,
    cellsToFill: 0,
    filledCells: 0
  };

  // DOM elemanları
  const boardElement = document.getElementById('sudoku-board');
  const timerElement = document.querySelector('.timer');
  const difficultyBtns = document.querySelectorAll('.difficulty-btn');
  const newGameBtn = document.querySelector('.new-game');
  const hintBtn = document.querySelector('.hint');
  const numpadBtns = document.querySelectorAll('.numpad-btn[data-num]');
  const notesToggleBtn = document.getElementById('notes-toggle');
  const eraseBtn = document.getElementById('erase');
  const statusElement = document.querySelector('.info-value.status');
  const difficultyDisplay = document.querySelector('.info-value.difficulty');

  // Alert mesajları
  const successAlert = document.getElementById('success-alert');
  const errorAlert = document.getElementById('error-alert');
  const infoAlert = document.getElementById('info-alert');

  // Pause menu
  const pauseMenu = document.getElementById('pause-menu');
  const resumeGameBtn = document.getElementById('resume-game');
  const restartGameBtn = document.getElementById('restart-game');
  const exitGameBtn = document.getElementById('exit-game');

  // Oyun zorluk seviyelerini ayarla
  const difficulties = {
    easy: { minClues: 35, maxClues: 40 },
    medium: { minClues: 30, maxClues: 34 },
    hard: { minClues: 25, maxClues: 29 }
  };

  // Sudoku tahtasını oluştur
  function createBoard() {
    boardElement.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const cell = document.createElement('div');
        cell.classList.add('sudoku-cell');
        cell.dataset.row = i;
        cell.dataset.col = j;
        
        // Not defteri için boş div oluştur
        const notes = document.createElement('div');
        notes.classList.add('cell-notes');
        for (let k = 0; k < 9; k++) {
          const note = document.createElement('div');
          note.classList.add('note');
          note.dataset.value = k + 1;
          notes.appendChild(note);
        }
        
        cell.appendChild(notes);
        boardElement.appendChild(cell);
        
        // Hücre tıklama olayını ekle
        cell.addEventListener('click', () => selectCell(i, j));
      }
    }
  }

  // Tahta durumunu güncelle
  function updateBoard() {
    const cells = boardElement.querySelectorAll('.sudoku-cell');
    cells.forEach(cell => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const value = gameState.board[row][col];
      
      // Hücre numaralarını güncelle
      if (value !== 0) {
        cell.textContent = value;
        // Sabit hücreler için class ekle
        if (cell.classList.contains('fixed')) {
          cell.style.color = 'var(--fixed-number-color)';
        } else {
          cell.style.color = 'var(--input-number-color)';
        }
        // Notları gizle
        cell.querySelector('.cell-notes').style.display = 'none';
      } else {
        cell.textContent = '';
        // Notları göster
        cell.querySelector('.cell-notes').style.display = 'grid';
      }
    });
  }

  // Hücre seçimi
  function selectCell(row, col) {
    // Önceki seçili hücreyi temizle
    if (gameState.selectedCell) {
      const { row: prevRow, col: prevCol } = gameState.selectedCell;
      const prevCells = boardElement.querySelectorAll('.sudoku-cell.selected, .sudoku-cell.highlighted');
      prevCells.forEach(cell => {
        cell.classList.remove('selected', 'highlighted');
      });
    }
    
    // Yeni hücreyi seç
    gameState.selectedCell = { row, col };
    
    // Tüm hücreleri güncelle
    const cells = boardElement.querySelectorAll('.sudoku-cell');
    cells.forEach(cell => {
      const cellRow = parseInt(cell.dataset.row);
      const cellCol = parseInt(cell.dataset.col);
      
      // Seçilen hücreyi vurgula
      if (cellRow === row && cellCol === col) {
        cell.classList.add('selected');
      }
      
      // Aynı satır, sütun veya 3x3 bloktaki hücreleri vurgula
      else if (cellRow === row || cellCol === col || 
               (Math.floor(cellRow / 3) === Math.floor(row / 3) && 
                Math.floor(cellCol / 3) === Math.floor(col / 3))) {
        cell.classList.add('highlighted');
      }
      
      // Aynı değere sahip hücreleri vurgula
      const selectedValue = gameState.board[row][col];
      if (selectedValue !== 0 && gameState.board[cellRow][cellCol] === selectedValue) {
        cell.classList.add('highlighted');
      }
    });
  }

  // Numpad tıklama işlemi
  function handleNumpadClick(num) {
    if (!gameState.selectedCell || gameState.gameCompleted) return;
    
    const { row, col } = gameState.selectedCell;
    const cell = boardElement.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    
    // Sabit hücrelerin değiştirilmesini engelle
    if (cell.classList.contains('fixed')) {
      showAlert('Bu hücre değiştirilemez!', 'error');
      return;
    }
    
    // Not modu açıksa
    if (gameState.notesMode) {
      toggleNote(row, col, num);
    } else {
      // Normal numara yerleştirme
      const oldValue = gameState.board[row][col];
      gameState.board[row][col] = num;
      
      // Hücrenin içeriğini güncelle
      updateBoard();
      
      // Tahta durumunu kontrol et
      checkBoardState();
      
      // İstatistikleri güncelle
      if (oldValue === 0 && num !== 0) {
        gameState.filledCells++;
        updateGameStatus();
      }
    }
  }

  // Not ekleme/kaldırma
  function toggleNote(row, col, num) {
    const cell = boardElement.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    const note = cell.querySelector(`.note[data-value="${num}"]`);
    
    if (note.textContent === num.toString()) {
      note.textContent = '';
    } else {
      note.textContent = num;
    }
  }

  // Not modunu değiştirme
  function toggleNotesMode() {
    gameState.notesMode = !gameState.notesMode;
    notesToggleBtn.classList.toggle('active');
    notesToggleBtn.innerHTML = gameState.notesMode ? 
      '<i class="fas fa-pencil-alt"></i> Notlar (Açık)' : 
      '<i class="fas fa-pencil-alt"></i> Notlar (Kapalı)';
    
    showAlert(gameState.notesMode ? 'Not modu açıldı' : 'Not modu kapatıldı', 'info');
  }

  // Silme işlemi
  function eraseCell() {
    if (!gameState.selectedCell || gameState.gameCompleted) return;
    
    const { row, col } = gameState.selectedCell;
    const cell = boardElement.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    
    // Sabit hücrelerin silinmesini engelle
    if (cell.classList.contains('fixed')) {
      showAlert('Bu hücre silinemez!', 'error');
      return;
    }
    
    // Eğer hücrede bir değer varsa, istatistikleri güncelle
    if (gameState.board[row][col] !== 0) {
      gameState.filledCells--;
      updateGameStatus();
    }
    
    // Hücreyi temizle
    gameState.board[row][col] = 0;
    
    // Notları da temizle
    const notes = cell.querySelectorAll('.note');
    notes.forEach(note => {
      note.textContent = '';
    });
    
    // Tahtayı güncelle
    updateBoard();
  }

  // Oyun durumunu kontrol et
  function checkBoardState() {
    // Tüm hücreler dolu mu kontrol et
    let isFull = true;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (gameState.board[i][j] === 0) {
          isFull = false;
          break;
        }
      }
      if (!isFull) break;
    }
    
    // Eğer tahta dolu ise, çözümü kontrol et
    if (isFull) {
      let isCorrect = true;
      for (let i = 0; i < 9 && isCorrect; i++) {
        for (let j = 0; j < 9; j++) {
          if (gameState.board[i][j] !== gameState.solution[i][j]) {
            isCorrect = false;
            break;
          }
        }
      }
      
      if (isCorrect) {
        // Oyunu bitir
        gameCompleted();
      } else {
        showAlert('Çözüm doğru değil. Kontrol edin!', 'error');
      }
    }
  }

  // Oyun tamamlandı
  function gameCompleted() {
    // Timer'ı durdur
    clearInterval(gameState.timerInterval);
    
    // Oyun durumunu güncelle
    gameState.gameCompleted = true;
    statusElement.textContent = 'Tamamlandı!';
    statusElement.style.color = '#4CAF50';
    
    // Başarı mesajı göster
    showAlert('Tebrikler! Sudoku'yu başarıyla tamamladınız!', 'success');
    
    // Skor kaydetme
    const timeTaken = Math.floor((Date.now() - gameState.timeStarted) / 1000);
    const difficultyFactor = gameState.difficulty === 'easy' ? 1 :
                            gameState.difficulty === 'medium' ? 1.5 : 2;
    const score = Math.floor(10000 * difficultyFactor / (timeTaken + gameState.hintsUsed * 60));
    
    // Skoru kaydet
    saveScore(score);
  }

  // Skor kaydetme
  function saveScore(score) {
    // API'ye skoru gönder
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: 'sudoku',
        score: score
      }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Skor kaydedildi:', data);
    })
    .catch((error) => {
      console.error('Skor kaydedilemedi:', error);
    });
  }

  // Oyun durumunu güncelle
  function updateGameStatus() {
    const progress = Math.floor((gameState.filledCells / gameState.cellsToFill) * 100);
    statusElement.textContent = `${progress}% Tamamlandı`;
  }

  // Zamanlayıcıyı başlat
  function startTimer() {
    gameState.timeStarted = Date.now();
    
    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
    }
    
    gameState.timerInterval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - gameState.timeStarted) / 1000);
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  // Zorluk seviyesini değiştir
  function changeDifficulty(difficulty) {
    gameState.difficulty = difficulty;
    
    // UI güncelle
    difficultyBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.difficulty === difficulty) {
        btn.classList.add('active');
      }
    });
    
    // Zorluk adını görüntüle
    let difficultyName = 'Kolay';
    if (difficulty === 'medium') difficultyName = 'Orta';
    if (difficulty === 'hard') difficultyName = 'Zor';
    difficultyDisplay.textContent = difficultyName;
    
    // Yeni oyun başlat
    startNewGame();
  }

  // İpucu ver
  function giveHint() {
    if (!gameState.selectedCell || gameState.gameCompleted) return;
    
    const { row, col } = gameState.selectedCell;
    const cell = boardElement.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    
    // Sabit hücreler için ipucu verme
    if (cell.classList.contains('fixed')) {
      showAlert('Bu hücre zaten dolu!', 'info');
      return;
    }
    
    // Eğer hücre doğru değere sahipse, ipucu verme
    if (gameState.board[row][col] === gameState.solution[row][col]) {
      showAlert('Bu hücre zaten doğru!', 'info');
      return;
    }
    
    // İpucu ver
    gameState.hintsUsed++;
    gameState.board[row][col] = gameState.solution[row][col];
    
    // Tahtayı güncelle
    updateBoard();
    
    // İstatistikleri güncelle
    gameState.filledCells++;
    updateGameStatus();
    
    // İpucu kullanıldı mesajı
    showAlert(`Doğru değer: ${gameState.solution[row][col]}`, 'info');
    
    // Oyun durumunu kontrol et
    checkBoardState();
  }

  // Yeni oyun başlat
  function startNewGame() {
    // Eski oyunu temizle
    clearInterval(gameState.timerInterval);
    gameState.selectedCell = null;
    gameState.gameCompleted = false;
    gameState.hintsUsed = 0;
    gameState.filledCells = 0;
    gameState.notesMode = false;
    notesToggleBtn.classList.remove('active');
    notesToggleBtn.innerHTML = '<i class="fas fa-pencil-alt"></i> Notlar (Kapalı)';
    
    // Oyun durumunu sıfırla
    statusElement.textContent = 'Devam Ediyor';
    statusElement.style.color = '';
    
    // Yeni Sudoku tahtası oluştur
    generateSudoku();
    
    // UI'ı güncelle
    createBoard();
    updateBoard();
    
    // Zamanlayıcıyı başlat
    startTimer();
    
    // Başlangıç mesajı
    showAlert('Yeni oyun başlatıldı. Bol şanslar!', 'success');
  }

  // Sudoku çözümü oluştur
  function generateSudoku() {
    // Boş tahta oluştur
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        gameState.board[i][j] = 0;
        gameState.solution[i][j] = 0;
      }
    }
    
    // Bir çözüm oluştur
    solveSudoku(gameState.solution);
    
    // Çözümden ipuçları (clues) belirle
    const difficulty = difficulties[gameState.difficulty];
    const totalClues = Math.floor(Math.random() * (difficulty.maxClues - difficulty.minClues + 1)) + difficulty.minClues;
    
    // Çözümün kopyasını al
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        gameState.board[i][j] = gameState.solution[i][j];
      }
    }
    
    // Rastgele hücreleri boşalt
    const positions = [];
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        positions.push({ row: i, col: j });
      }
    }
    
    // Pozisyonları karıştır
    shuffleArray(positions);
    
    // Belirli sayıda hücreyi boşalt
    const cellsToEmpty = 81 - totalClues;
    for (let i = 0; i < cellsToEmpty; i++) {
      const { row, col } = positions[i];
      gameState.board[row][col] = 0;
    }
    
    // Sabit hücreleri belirle
    const cells = boardElement.querySelectorAll('.sudoku-cell');
    cells.forEach(cell => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      
      if (gameState.board[row][col] !== 0) {
        cell.classList.add('fixed');
      } else {
        cell.classList.remove('fixed');
      }
    });
    
    // Doldurulması gereken hücre sayısını belirle
    gameState.cellsToFill = 81 - totalClues;
    gameState.filledCells = 0;
  }

  // Sudoku çözümü oluştur
  function solveSudoku(board) {
    // Rastgele bir başlangıç tahtası oluştur
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    shuffleArray(numbers);
    
    // İlk satırı doldur
    for (let i = 0; i < 9; i++) {
      board[0][i] = numbers[i];
    }
    
    // Geri kalan tahtayı çöz
    if (!solveBoard(board, 1, 0)) {
      // Çözüm bulunamadıysa, tekrar dene
      return solveSudoku(board);
    }
    
    return true;
  }

  // Backtracking ile Sudoku çözümü
  function solveBoard(board, row, col) {
    // Tüm hücreler dolduysa, çözüm tamamlandı
    if (row === 9) return true;
    
    // Bir sonraki hücreye geç
    const nextRow = col === 8 ? row + 1 : row;
    const nextCol = col === 8 ? 0 : col + 1;
    
    // Eğer hücre dolu ise, bir sonraki hücreye geç
    if (board[row][col] !== 0) {
      return solveBoard(board, nextRow, nextCol);
    }
    
    // Bu hücre için olası değerleri dene
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    shuffleArray(numbers);
    
    for (let num of numbers) {
      // Değer geçerli mi kontrol et
      if (isValidMove(board, row, col, num)) {
        // Değeri yerleştir
        board[row][col] = num;
        
        // Sonraki hücreye geç
        if (solveBoard(board, nextRow, nextCol)) {
          return true;
        }
        
        // Eğer çözüm bulunamadıysa, geri al
        board[row][col] = 0;
      }
    }
    
    // Hiçbir değer geçerli değilse, geri dön
    return false;
  }

  // Geçerli hamle kontrolü
  function isValidMove(board, row, col, num) {
    // Satır kontrolü
    for (let i = 0; i < 9; i++) {
      if (board[row][i] === num) return false;
    }
    
    // Sütun kontrolü
    for (let i = 0; i < 9; i++) {
      if (board[i][col] === num) return false;
    }
    
    // 3x3 blok kontrolü
    const blockRow = Math.floor(row / 3) * 3;
    const blockCol = Math.floor(col / 3) * 3;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[blockRow + i][blockCol + j] === num) return false;
      }
    }
    
    return true;
  }

  // Diziyi karıştır
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Alert mesajı göster
  function showAlert(message, type) {
    const alertElement = type === 'success' ? successAlert :
                       type === 'error' ? errorAlert : infoAlert;
    
    alertElement.textContent = message;
    alertElement.style.display = 'block';
    
    setTimeout(() => {
      alertElement.style.display = 'none';
    }, 3000);
  }

  // Oyunu duraklatma menüsünü göster/gizle
  function togglePauseMenu() {
    const isPaused = pauseMenu.style.display === 'flex';
    pauseMenu.style.display = isPaused ? 'none' : 'flex';
    
    // Timer'ı durdur/devam ettir
    if (isPaused) {
      startTimer();
    } else {
      clearInterval(gameState.timerInterval);
    }
  }

  // Olay dinleyicileri
  difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => changeDifficulty(btn.dataset.difficulty));
  });
  
  newGameBtn.addEventListener('click', startNewGame);
  hintBtn.addEventListener('click', giveHint);
  
  numpadBtns.forEach(btn => {
    btn.addEventListener('click', () => handleNumpadClick(parseInt(btn.dataset.num)));
  });
  
  notesToggleBtn.addEventListener('click', toggleNotesMode);
  eraseBtn.addEventListener('click', eraseCell);
  
  // Klavye olayları
  document.addEventListener('keydown', (e) => {
    if (!gameState.selectedCell || gameState.gameCompleted) return;
    
    if (e.key >= '1' && e.key <= '9') {
      handleNumpadClick(parseInt(e.key));
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      eraseCell();
    } else if (e.key === 'n' || e.key === 'N') {
      toggleNotesMode();
    } else if (e.key === 'h' || e.key === 'H') {
      giveHint();
    } else if (e.key === 'Escape') {
      togglePauseMenu();
    }
  });
  
  // Pause menü düğmeleri
  resumeGameBtn.addEventListener('click', togglePauseMenu);
  restartGameBtn.addEventListener('click', () => {
    togglePauseMenu();
    startNewGame();
  });
  exitGameBtn.addEventListener('click', () => {
    window.location.href = '/all-games';
  });
  
  // Oyunu başlat
  createBoard();
  startNewGame();
});
