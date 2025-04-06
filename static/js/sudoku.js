
/**
 * Sudoku Oyunu - Profesyonel JavaScript Uygulaması
 * Geliştirilmiş, modern ve kullanıcı dostu bir sudoku deneyimi
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elementleri
  const sudokuBoard = document.getElementById('sudoku-board');
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');
  const newGameButton = document.querySelector('.new-game');
  const hintButton = document.querySelector('.hint');
  const pauseButton = document.querySelector('.pause');
  const notesToggle = document.getElementById('notes-toggle');
  const eraseButton = document.getElementById('erase');
  const numpadButtons = document.querySelectorAll('.numpad-btn[data-num]');
  
  // Bilgi Göstergeleri
  const timerElement = document.querySelector('.timer');
  const difficultyElement = document.querySelector('.difficulty');
  const statusElement = document.querySelector('.status');
  const hintsElement = document.querySelector('.hints');
  
  // Uyarı Elementleri
  const successAlert = document.getElementById('success-alert');
  const errorAlert = document.getElementById('error-alert');
  const infoAlert = document.getElementById('info-alert');

  // Ses Efektleri
  const sounds = {
    click: new Audio('/static/sounds/click.mp3'),
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    hint: new Audio('/static/sounds/hint.mp3'),
    complete: new Audio('/static/sounds/success.mp3')
  };

  // Sesleri çalma fonksiyonu (hata yönetimi ile)
  const playSound = (soundName) => {
    try {
      if (sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(err => {
          console.log("Ses çalma hatası:", err);
        });
      }
    } catch (error) {
      console.log("Ses çalma hatası:", error);
    }
  };

  // Oyun Durumu
  const gameState = {
    difficulty: 'easy',
    board: Array(9).fill().map(() => Array(9).fill(0)),
    solution: Array(9).fill().map(() => Array(9).fill(0)),
    fixedCells: Array(9).fill().map(() => Array(9).fill(false)),
    isNotesMode: false,
    notes: Array(9).fill().map(() => Array(9).fill().map(() => Array(9).fill(false))),
    selectedCell: null,
    gameStarted: false,
    gamePaused: false,
    gameCompleted: false,
    timer: 0,
    timerInterval: null,
    hintsRemaining: 3,
    mistakes: 0
  };

  // Zorluk Seviyesi Ayarları
  const difficultySettings = {
    easy: { cellsToRemove: 30, hints: 3 },
    medium: { cellsToRemove: 40, hints: 3 },
    hard: { cellsToRemove: 50, hints: 2 }
  };

  // Sudoku Tahtasını Oluştur
  function createBoard() {
    sudokuBoard.innerHTML = '';
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.createElement('div');
        cell.classList.add('sudoku-cell');
        
        // Kalın kenarlıkları ekle (3x3 bölgeler için)
        if (col === 2 || col === 5) cell.style.borderRight = '2px solid var(--border-color)';
        if (row === 2 || row === 5) cell.style.borderBottom = '2px solid var(--border-color)';
        
        // Notlar için container ekle
        const notesContainer = document.createElement('div');
        notesContainer.classList.add('notes-container');
        
        for (let i = 0; i < 9; i++) {
          const note = document.createElement('span');
          note.classList.add('note');
          note.textContent = i + 1;
          note.style.display = 'none';
          notesContainer.appendChild(note);
        }
        
        cell.appendChild(notesContainer);
        
        // Hücre tıklama olayı
        cell.addEventListener('click', () => selectCell(row, col));
        
        // Satır ve sütun indekslerini veri özniteliği olarak ekle
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        sudokuBoard.appendChild(cell);
      }
    }
  }

  // Yeni Oyun Başlat
  function startNewGame() {
    // Önceki timer'ı temizle
    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
    }
    
    // Oyun durumunu sıfırla
    gameState.board = Array(9).fill().map(() => Array(9).fill(0));
    gameState.solution = Array(9).fill().map(() => Array(9).fill(0));
    gameState.fixedCells = Array(9).fill().map(() => Array(9).fill(false));
    gameState.notes = Array(9).fill().map(() => Array(9).fill().map(() => Array(9).fill(false)));
    gameState.selectedCell = null;
    gameState.gameStarted = true;
    gameState.gamePaused = false;
    gameState.gameCompleted = false;
    gameState.timer = 0;
    gameState.mistakes = 0;
    
    // Zorluk seviyesine göre ipuçlarını ayarla
    gameState.hintsRemaining = difficultySettings[gameState.difficulty].hints;
    hintsElement.textContent = gameState.hintsRemaining;
    
    // Tahta ve çözümü oluştur
    generateSudoku();
    
    // Tahtayı görsel olarak güncelle
    updateBoardDisplay();
    
    // Sayacı başlat
    startTimer();
    
    // Oyun durumu göstergesini güncelle
    updateStatusDisplay();
    
    playSound('click');
    
    // Not modunu sıfırla
    toggleNotesMode(false);
  }

  // Geçerli bir Sudoku çözümü oluştur
  function generateSudoku() {
    // Önce boş bir çözüm oluştur
    generateSolution(gameState.solution);
    
    // Çözümü kopyala
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        gameState.board[row][col] = gameState.solution[row][col];
      }
    }
    
    // Zorluk seviyesine göre hücreleri kaldır
    removeCells(difficultySettings[gameState.difficulty].cellsToRemove);
  }

  // Geçerli bir Sudoku çözümü oluştur (recursive backtracking ile)
  function generateSolution(grid) {
    const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    return fillGrid(grid, 0, 0, nums);
  }
  
  // Grid'i doldurma yardımcı fonksiyonu (recursive)
  function fillGrid(grid, row, col, nums) {
    if (row === 9) return true;
    
    const nextRow = col === 8 ? row + 1 : row;
    const nextCol = col === 8 ? 0 : col + 1;
    
    for (let i = 0; i < 9; i++) {
      const num = nums[i];
      
      if (isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num;
        
        if (fillGrid(grid, nextRow, nextCol, nums)) return true;
        
        grid[row][col] = 0;
      }
    }
    
    return false;
  }
  
  // Bir sayının belirli bir konuma yerleştirilip yerleştirilemeyeceğini kontrol et
  function isValidPlacement(grid, row, col, num) {
    // Satır kontrolü
    for (let i = 0; i < 9; i++) {
      if (grid[row][i] === num) return false;
    }
    
    // Sütun kontrolü
    for (let i = 0; i < 9; i++) {
      if (grid[i][col] === num) return false;
    }
    
    // 3x3 kutu kontrolü
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[boxRow + i][boxCol + j] === num) return false;
      }
    }
    
    return true;
  }
  
  // Belirli sayıda hücreyi kaldır
  function removeCells(count) {
    const cells = [];
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        cells.push({ row, col });
      }
    }
    
    shuffleArray(cells);
    
    for (let i = 0; i < count; i++) {
      if (i < cells.length) {
        const { row, col } = cells[i];
        gameState.board[row][col] = 0;
      }
    }
    
    // Sabit hücreleri işaretle
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        gameState.fixedCells[row][col] = gameState.board[row][col] !== 0;
      }
    }
  }
  
  // Diziyi karıştır (Fisher-Yates algoritması)
  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
  
  // Sayaç işlevleri
  function startTimer() {
    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
    }
    
    gameState.timer = 0;
    updateTimerDisplay();
    
    gameState.timerInterval = setInterval(() => {
      if (!gameState.gamePaused && !gameState.gameCompleted) {
        gameState.timer++;
        updateTimerDisplay();
      }
    }, 1000);
  }
  
  function pauseTimer() {
    gameState.gamePaused = true;
    updateStatusDisplay();
  }
  
  function resumeTimer() {
    gameState.gamePaused = false;
    updateStatusDisplay();
  }
  
  function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timer / 60);
    const seconds = gameState.timer % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Tahtanın görsel gösterimini güncelle
  function updateBoardDisplay() {
    const cells = document.querySelectorAll('.sudoku-cell');
    
    cells.forEach(cell => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const value = gameState.board[row][col];
      
      // Hücre içeriğini temizle
      cell.textContent = '';
      
      // Not container'ı yeniden ekle
      const notesContainer = document.createElement('div');
      notesContainer.classList.add('notes-container');
      
      for (let i = 0; i < 9; i++) {
        const note = document.createElement('span');
        note.classList.add('note');
        note.textContent = i + 1;
        note.style.display = gameState.notes[row][col][i] ? 'flex' : 'none';
        notesContainer.appendChild(note);
      }
      
      cell.appendChild(notesContainer);
      
      // Değer ve CSS sınıflarını ayarla
      if (value !== 0) {
        cell.textContent = value;
        notesContainer.style.display = 'none';
      }
      
      cell.classList.remove('fixed', 'selected', 'highlighted');
      
      if (gameState.fixedCells[row][col]) {
        cell.classList.add('fixed');
      }
      
      // Seçili hücreye stil uygula
      if (gameState.selectedCell && gameState.selectedCell.row === row && gameState.selectedCell.col === col) {
        cell.classList.add('selected');
      }
      
      // Aynı satır, sütun ve kutuyu vurgula
      if (gameState.selectedCell) {
        const isSameRow = gameState.selectedCell.row === row;
        const isSameCol = gameState.selectedCell.col === col;
        const isSameBox = Math.floor(gameState.selectedCell.row / 3) === Math.floor(row / 3) && 
                         Math.floor(gameState.selectedCell.col / 3) === Math.floor(col / 3);
        const isSameValue = value !== 0 && gameState.board[gameState.selectedCell.row][gameState.selectedCell.col] === value;
        
        if ((isSameRow || isSameCol || isSameBox || isSameValue) && 
            !(gameState.selectedCell.row === row && gameState.selectedCell.col === col)) {
          cell.classList.add('highlighted');
        }
      }
    });
  }

  // Bir hücreyi seç
  function selectCell(row, col) {
    if (gameState.gameCompleted || gameState.gamePaused) return;
    
    gameState.selectedCell = { row, col };
    updateBoardDisplay();
    
    playSound('click');
  }

  // Seçili hücreye sayı ekle
  function enterNumber(num) {
    if (!gameState.selectedCell || gameState.gameCompleted || gameState.gamePaused) return;
    
    const { row, col } = gameState.selectedCell;
    
    // Sabit hücrelere sayı girilemez
    if (gameState.fixedCells[row][col]) return;
    
    if (gameState.isNotesMode) {
      // Not modu açıksa, notu ekle/çıkar
      gameState.notes[row][col][num - 1] = !gameState.notes[row][col][num - 1];
      updateBoardDisplay();
      playSound('click');
      return;
    }
    
    // Normal mod: Sayıyı ekle
    const oldValue = gameState.board[row][col];
    
    // Aynı sayıyı tekrar girerse, silme işlemi yap
    if (oldValue === num) {
      gameState.board[row][col] = 0;
      updateBoardDisplay();
      playSound('click');
      return;
    }
    
    // Sayı ekle
    gameState.board[row][col] = num;
    
    // Hatalı giriş kontrolü
    if (gameState.solution[row][col] !== num) {
      playSound('wrong');
      gameState.mistakes++;
      
      const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
      cell.classList.add('error');
      setTimeout(() => {
        cell.classList.remove('error');
      }, 500);
      
      showAlert(errorAlert, 'Hatalı giriş!');
    } else {
      playSound('correct');
      
      // Doğru giriş animasyonu
      const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
      cell.classList.add('correct');
      setTimeout(() => {
        cell.classList.remove('correct');
      }, 500);
      
      // Otomatik olarak notları temizle
      clearNotesForNumber(num, row, col);
    }
    
    updateBoardDisplay();
    
    // Oyun tamamlandı mı kontrol et
    if (isBoardComplete()) {
      handleGameCompletion();
    }
  }
  
  // Bir sayı girildiğinde ilgili satır, sütun ve kutudan o sayıya ait notları temizle
  function clearNotesForNumber(num, row, col) {
    // Satırdaki notları temizle
    for (let i = 0; i < 9; i++) {
      gameState.notes[row][i][num - 1] = false;
    }
    
    // Sütundaki notları temizle
    for (let i = 0; i < 9; i++) {
      gameState.notes[i][col][num - 1] = false;
    }
    
    // 3x3 kutudaki notları temizle
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        gameState.notes[boxRow + i][boxCol + j][num - 1] = false;
      }
    }
  }
  
  // Tahta tamamlandı mı kontrol et
  function isBoardComplete() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gameState.board[row][col] !== gameState.solution[row][col]) {
          return false;
        }
      }
    }
    return true;
  }
  
  // Oyun tamamlandığında çağrılan fonksiyon
  function handleGameCompletion() {
    gameState.gameCompleted = true;
    clearInterval(gameState.timerInterval);
    
    updateStatusDisplay();
    playSound('complete');
    
    showAlert(successAlert, 'Tebrikler! Sudoku başarıyla tamamlandı!');
  }
  
  // İpucu göster
  function showHint() {
    if (!gameState.selectedCell || gameState.gameCompleted || gameState.gamePaused) return;
    if (gameState.hintsRemaining <= 0) {
      showAlert(infoAlert, 'İpucu hakkınız kalmadı!');
      return;
    }
    
    const { row, col } = gameState.selectedCell;
    
    // Sabit hücre veya zaten doğru doldurulmuş hücre için ipucu gösterme
    if (gameState.fixedCells[row][col] || gameState.board[row][col] === gameState.solution[row][col]) {
      showAlert(infoAlert, 'Bu hücre için ipucu kullanılamaz!');
      return;
    }
    
    // İpucu göster
    gameState.board[row][col] = gameState.solution[row][col];
    gameState.fixedCells[row][col] = true;
    gameState.hintsRemaining--;
    
    hintsElement.textContent = gameState.hintsRemaining;
    updateBoardDisplay();
    
    playSound('hint');
    showAlert(infoAlert, 'İpucu kullanıldı!');
    
    // Oyun tamamlandı mı kontrol et
    if (isBoardComplete()) {
      handleGameCompletion();
    }
  }
  
  // Not modunu aç/kapat
  function toggleNotesMode(force = null) {
    if (force !== null) {
      gameState.isNotesMode = force;
    } else {
      gameState.isNotesMode = !gameState.isNotesMode;
    }
    
    notesToggle.classList.toggle('active', gameState.isNotesMode);
    playSound('click');
    
    if (gameState.isNotesMode) {
      showAlert(infoAlert, 'Not modu açıldı');
    } else {
      showAlert(infoAlert, 'Not modu kapatıldı');
    }
  }
  
  // Seçili hücredeki sayıyı veya notları sil
  function eraseCell() {
    if (!gameState.selectedCell || gameState.gameCompleted || gameState.gamePaused) return;
    
    const { row, col } = gameState.selectedCell;
    
    // Sabit hücreler silinemez
    if (gameState.fixedCells[row][col]) return;
    
    if (gameState.board[row][col] !== 0) {
      // Sayıyı sil
      gameState.board[row][col] = 0;
    } else {
      // Tüm notları sil
      for (let i = 0; i < 9; i++) {
        gameState.notes[row][col][i] = false;
      }
    }
    
    updateBoardDisplay();
    playSound('click');
  }
  
  // Zorluk seviyesini değiştir
  function changeDifficulty(difficulty) {
    gameState.difficulty = difficulty;
    
    // UI güncelleme
    difficultyButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
    });
    
    difficultyElement.textContent = difficulty === 'easy' ? 'Kolay' : (difficulty === 'medium' ? 'Orta' : 'Zor');
    
    // Yeni oyun başlat
    startNewGame();
  }
  
  // Oyunu duraklat
  function pauseGame() {
    if (gameState.gameCompleted) return;
    
    pauseTimer();
    showPauseMenu();
  }
  
  // Oyuna devam et
  function resumeGame() {
    hidePauseMenu();
    resumeTimer();
  }
  
  // Oyun durumu göstergesini güncelle
  function updateStatusDisplay() {
    if (gameState.gameCompleted) {
      statusElement.textContent = 'Tamamlandı';
      statusElement.classList.add('status-completed');
      statusElement.classList.remove('status-ongoing', 'status-paused');
    } else if (gameState.gamePaused) {
      statusElement.textContent = 'Duraklatıldı';
      statusElement.classList.add('status-paused');
      statusElement.classList.remove('status-ongoing', 'status-completed');
    } else {
      statusElement.textContent = 'Devam Ediyor';
      statusElement.classList.add('status-ongoing');
      statusElement.classList.remove('status-completed', 'status-paused');
    }
  }
  
  // Duraklama menüsünü göster (Bootstrap modal)
  function showPauseMenu() {
    const pauseModal = new bootstrap.Modal(document.getElementById('pause-modal'));
    pauseModal.show();
  }
  
  // Duraklama menüsünü gizle (Bootstrap modal)
  function hidePauseMenu() {
    const pauseModal = bootstrap.Modal.getInstance(document.getElementById('pause-modal'));
    if (pauseModal) {
      pauseModal.hide();
    }
  }
  
  // Mesaj göster
  function showAlert(alertElement, message) {
    alertElement.textContent = message;
    alertElement.classList.add('show');
    
    setTimeout(() => {
      alertElement.classList.remove('show');
    }, 3000);
  }
  
  // Olay Dinleyicileri
  function setupEventListeners() {
    // Zorluk seviyesi butonları
    difficultyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        changeDifficulty(btn.dataset.difficulty);
      });
    });
    
    // Yeni oyun butonu
    newGameButton.addEventListener('click', startNewGame);
    
    // İpucu butonu
    hintButton.addEventListener('click', showHint);
    
    // Duraklat butonu
    pauseButton.addEventListener('click', pauseGame);
    
    // Not modu toggle
    notesToggle.addEventListener('click', () => toggleNotesMode());
    
    // Sil butonu
    eraseButton.addEventListener('click', eraseCell);
    
    // Numpad butonları
    numpadButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const num = parseInt(btn.dataset.num);
        enterNumber(num);
      });
    });
    
    // Klavye olayları
    document.addEventListener('keydown', (e) => {
      if (gameState.gamePaused || gameState.gameCompleted) return;
      
      const key = e.key;
      
      if (/^[1-9]$/.test(key)) {
        // 1-9 tuşları: Sayı giriş
        enterNumber(parseInt(key));
      } else if (key === 'Delete' || key === 'Backspace') {
        // Delete veya Backspace: Sil
        eraseCell();
      } else if (key === 'n' || key === 'N') {
        // N: Not modu toggle
        toggleNotesMode();
      } else if (key === 'Escape') {
        // Escape: Oyunu duraklat
        pauseGame();
      } else if (key === ' ') {
        // Space: İpucu
        showHint();
      } else if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
        // Ok tuşları: Hücreler arası gezinme
        if (!gameState.selectedCell) return;
        
        let newRow = gameState.selectedCell.row;
        let newCol = gameState.selectedCell.col;
        
        if (key === 'ArrowUp') newRow = Math.max(0, newRow - 1);
        else if (key === 'ArrowDown') newRow = Math.min(8, newRow + 1);
        else if (key === 'ArrowLeft') newCol = Math.max(0, newCol - 1);
        else if (key === 'ArrowRight') newCol = Math.min(8, newCol + 1);
        
        selectCell(newRow, newCol);
        e.preventDefault();
      }
    });
    
    // Duraklama menüsü butonları
    document.querySelector('.resume-game').addEventListener('click', resumeGame);
    document.querySelector('.modal-content .new-game').addEventListener('click', () => {
      hidePauseMenu();
      startNewGame();
    });
    document.querySelector('.exit-game').addEventListener('click', () => {
      hidePauseMenu();
      // Oyun sayfasından ayrılma (uygulamaya göre değiştirilebilir)
      window.location.href = '/games';
    });
    
    // Duraklama menüsü kapatıldığında oyuna devam et
    document.getElementById('pause-modal').addEventListener('hidden.bs.modal', () => {
      if (gameState.gamePaused && !gameState.gameCompleted) {
        resumeGame();
      }
    });
  }
  
  // İlk Yükleme
  function init() {
    createBoard();
    setupEventListeners();
    changeDifficulty('easy');
  }
  
  // Oyunu başlat
  init();
});
