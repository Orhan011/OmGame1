
/**
 * Sudoku Oyunu
 * 
 * Profesyonel ve interaktif Sudoku oyun uygulaması
 * Özellikler: Zorluk seviyeleri, ipuçları, notlar, zamanlayıcı ve puan sistemi
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elementleri
  const boardElement = document.getElementById('sudoku-board');
  const difficultyBtns = document.querySelectorAll('.difficulty-btn');
  const newGameBtn = document.querySelector('.new-game');
  const hintBtn = document.querySelector('.hint');
  const notesToggleBtn = document.getElementById('notes-toggle');
  const eraseBtn = document.getElementById('erase');
  const numpadBtns = document.querySelectorAll('.numpad-btn[data-num]');
  const timerElement = document.querySelector('.timer');
  const difficultyDisplay = document.querySelector('.difficulty');
  const statusDisplay = document.querySelector('.status');
  const pauseMenu = document.getElementById('pause-menu');
  const resumeGameBtn = document.getElementById('resume-game');
  const restartGameBtn = document.getElementById('restart-game');
  const exitGameBtn = document.getElementById('exit-game');
  
  // Ses Efektleri
  const audioEffects = {
    select: new Audio('/static/sounds/click.mp3'),
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    complete: new Audio('/static/sounds/game-complete.mp3'),
    hint: new Audio('/static/sounds/hint.mp3')
  };
  
  // Ses Fonksiyonu
  function playSound(sound) {
    try {
      if (gameState.soundEnabled) {
        audioEffects[sound].currentTime = 0;
        audioEffects[sound].play();
      }
    } catch (error) {
      console.log("Ses çalma hatası:", error);
    }
  }

  // Oyun Durumu
  let gameState = {
    board: Array(9).fill().map(() => Array(9).fill(0)),
    solution: Array(9).fill().map(() => Array(9).fill(0)),
    selectedCell: null,
    originalCells: new Set(),
    notesEnabled: false,
    difficulty: 'easy',
    timer: 0,
    timerInterval: null,
    status: 'ongoing',
    paused: false,
    soundEnabled: true,
    hintsUsed: 0,
    moves: 0
  };

  // Oyun İşlevleri
  function initGame() {
    setupEventListeners();
    generateNewGame();
  }

  function setupEventListeners() {
    // Zorluk butonları
    difficultyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (gameState.status === 'ongoing' && !confirm('Oyun devam ediyor. Yeni oyun başlatmak istediğinizden emin misiniz?')) {
          return;
        }
        
        const newDifficulty = btn.getAttribute('data-difficulty');
        changeDifficulty(newDifficulty);
        
        // UI Güncellemeleri
        difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        playSound('select');
      });
    });

    // Yeni oyun butonu
    newGameBtn.addEventListener('click', () => {
      if (gameState.status === 'ongoing' && !confirm('Oyun devam ediyor. Yeni oyun başlatmak istediğinizden emin misiniz?')) {
        return;
      }
      generateNewGame();
      playSound('select');
    });

    // İpucu butonu
    hintBtn.addEventListener('click', () => {
      provideHint();
      playSound('hint');
    });

    // Not modu butonu
    notesToggleBtn.addEventListener('click', () => {
      toggleNotesMode();
      playSound('select');
    });

    // Silme butonu
    eraseBtn.addEventListener('click', () => {
      eraseCell();
      playSound('select');
    });

    // Numpad butonları
    numpadBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const num = btn.getAttribute('data-num');
        enterNumber(parseInt(num));
        playSound('select');
      });
    });

    // Klavye olayları
    document.addEventListener('keydown', handleKeyPress);
    
    // Oyunu duraklatma ve devam ettirme
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && gameState.status === 'ongoing') {
        pauseGame();
      }
    });
    
    // Duraklatma menüsü butonları
    resumeGameBtn.addEventListener('click', () => {
      resumeGame();
      playSound('select');
    });
    
    restartGameBtn.addEventListener('click', () => {
      generateNewGame();
      playSound('select');
    });
    
    exitGameBtn.addEventListener('click', () => {
      window.location.href = '/all-games';
    });

    // ESC tuşu ile duraklatma
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && gameState.status === 'ongoing') {
        if (gameState.paused) {
          resumeGame();
        } else {
          pauseGame();
        }
      }
    });
  }

  function generateNewGame() {
    // Oyun durumunu sıfırla
    resetGameState();
    
    // Zorluk seviyesini ekrana yansıt
    difficultyDisplay.textContent = getDifficultyName(gameState.difficulty);
    
    // Yeni Sudoku oluştur
    generateSudoku();
    
    // Tahtayı çiz
    renderBoard();
    
    // Zamanlayıcıyı başlat
    startTimer();
    
    // Durum göstergesini güncelle
    updateStatusDisplay('ongoing');
    
    // Duraklatma menüsünü kapat
    pauseMenu.style.display = 'none';
    gameState.paused = false;
    
    // Başarılı başlangıç mesajı
    showAlert('Yeni oyun başlatıldı! İyi şanslar!', 'info');
  }

  function generateSudoku() {
    // Sudoku çözüm oluşturma
    generateSudokuSolution();
    
    // Zorluk seviyesine göre bazı hücreleri gizle
    gameState.board = createPuzzleFromSolution(gameState.solution, getDifficultyRemovalCount());
    
    // Orijinal hücreleri kaydet
    gameState.originalCells.clear();
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gameState.board[row][col] !== 0) {
          gameState.originalCells.add(`${row}-${col}`);
        }
      }
    }
  }

  function generateSudokuSolution() {
    // Boş tahta oluştur
    let board = Array(9).fill().map(() => Array(9).fill(0));
    
    // Sudoku çözüm algoritması
    if (!solveSudoku(board)) {
      console.error("Çözüm oluşturulamadı!");
      // Basit bir örnek çözüm ile devam et
      board = [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9]
      ];
    }
    
    // Çözümü karıştır
    board = shuffleSudoku(board);
    
    // Çözümü depola
    gameState.solution = JSON.parse(JSON.stringify(board));
  }

  function solveSudoku(board) {
    // Backtracking algoritması ile sudoku çözümü
    const emptyCell = findEmptyCell(board);
    if (!emptyCell) return true;
    
    const [row, col] = emptyCell;
    
    // 1-9 arası rakamları karıştır
    const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    
    for (let num of nums) {
      if (isValidPlacement(board, row, col, num)) {
        board[row][col] = num;
        
        if (solveSudoku(board)) {
          return true;
        }
        
        board[row][col] = 0;
      }
    }
    
    return false;
  }

  function findEmptyCell(board) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          return [row, col];
        }
      }
    }
    return null;
  }

  function isValidPlacement(board, row, col, num) {
    // Satır kontrolü
    for (let c = 0; c < 9; c++) {
      if (board[row][c] === num) return false;
    }
    
    // Sütun kontrolü
    for (let r = 0; r < 9; r++) {
      if (board[r][col] === num) return false;
    }
    
    // 3x3 kutu kontrolü
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (board[boxRow + r][boxCol + c] === num) return false;
      }
    }
    
    return true;
  }

  function shuffleSudoku(board) {
    const newBoard = JSON.parse(JSON.stringify(board));
    
    // Rastgele dönüşümler uygula (5 kez)
    for (let i = 0; i < 5; i++) {
      const operation = Math.floor(Math.random() * 5);
      
      switch(operation) {
        case 0: // Satır gruplarını değiştir
          swapRowGroups(newBoard);
          break;
        case 1: // Sütun gruplarını değiştir
          swapColumnGroups(newBoard);
          break;
        case 2: // Grup içinde satırları değiştir
          swapRowsInGroup(newBoard);
          break;
        case 3: // Grup içinde sütunları değiştir
          swapColumnsInGroup(newBoard);
          break;
        case 4: // Tahtayı çevir (transpose)
          transposeBoard(newBoard);
          break;
      }
    }
    
    return newBoard;
  }

  function swapRowGroups(board) {
    const group1 = Math.floor(Math.random() * 3);
    let group2 = Math.floor(Math.random() * 3);
    
    // Farklı bir grup seç
    while (group1 === group2) {
      group2 = Math.floor(Math.random() * 3);
    }
    
    // Grupları değiştir
    for (let row = 0; row < 3; row++) {
      const temp = [...board[group1 * 3 + row]];
      board[group1 * 3 + row] = [...board[group2 * 3 + row]];
      board[group2 * 3 + row] = temp;
    }
  }

  function swapColumnGroups(board) {
    const group1 = Math.floor(Math.random() * 3);
    let group2 = Math.floor(Math.random() * 3);
    
    // Farklı bir grup seç
    while (group1 === group2) {
      group2 = Math.floor(Math.random() * 3);
    }
    
    // Grupları değiştir
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 3; col++) {
        const temp = board[row][group1 * 3 + col];
        board[row][group1 * 3 + col] = board[row][group2 * 3 + col];
        board[row][group2 * 3 + col] = temp;
      }
    }
  }

  function swapRowsInGroup(board) {
    const group = Math.floor(Math.random() * 3);
    const row1 = Math.floor(Math.random() * 3);
    let row2 = Math.floor(Math.random() * 3);
    
    // Farklı bir satır seç
    while (row1 === row2) {
      row2 = Math.floor(Math.random() * 3);
    }
    
    // Satırları değiştir
    const temp = [...board[group * 3 + row1]];
    board[group * 3 + row1] = [...board[group * 3 + row2]];
    board[group * 3 + row2] = temp;
  }

  function swapColumnsInGroup(board) {
    const group = Math.floor(Math.random() * 3);
    const col1 = Math.floor(Math.random() * 3);
    let col2 = Math.floor(Math.random() * 3);
    
    // Farklı bir sütun seç
    while (col1 === col2) {
      col2 = Math.floor(Math.random() * 3);
    }
    
    // Sütunları değiştir
    for (let row = 0; row < 9; row++) {
      const temp = board[row][group * 3 + col1];
      board[row][group * 3 + col1] = board[row][group * 3 + col2];
      board[row][group * 3 + col2] = temp;
    }
  }

  function transposeBoard(board) {
    const newBoard = JSON.parse(JSON.stringify(board));
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        board[row][col] = newBoard[col][row];
      }
    }
  }

  function createPuzzleFromSolution(solution, cellsToRemove) {
    const puzzle = JSON.parse(JSON.stringify(solution));
    const positions = [];
    
    // Tüm pozisyonları oluştur
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        positions.push({row, col});
      }
    }
    
    // Pozisyonları karıştır
    shuffleArray(positions);
    
    // Belirli sayıda hücreyi temizle
    let removed = 0;
    let i = 0;
    
    while (removed < cellsToRemove && i < positions.length) {
      const {row, col} = positions[i];
      const temp = puzzle[row][col];
      puzzle[row][col] = 0;
      
      // Çoklu çözüm kontrolü (zor zorluk için kapa)
      if (gameState.difficulty === 'hard' || hasUniqueSolution(puzzle)) {
        removed++;
      } else {
        // Çoklu çözüm varsa geri al
        puzzle[row][col] = temp;
      }
      
      i++;
    }
    
    return puzzle;
  }

  function hasUniqueSolution(puzzle) {
    // Basit kontrol: Bulmaca çözülebilir mi
    const tempPuzzle = JSON.parse(JSON.stringify(puzzle));
    let solutionCount = 0;
    
    function countSolutions(board) {
      if (solutionCount > 1) return;
      
      const emptyCell = findEmptyCell(board);
      if (!emptyCell) {
        solutionCount++;
        return;
      }
      
      const [row, col] = emptyCell;
      
      for (let num = 1; num <= 9; num++) {
        if (isValidPlacement(board, row, col, num)) {
          board[row][col] = num;
          countSolutions(board);
          board[row][col] = 0;
        }
      }
    }
    
    countSolutions(tempPuzzle);
    
    return solutionCount === 1;
  }

  function renderBoard() {
    // Tahtayı temizle
    boardElement.innerHTML = '';
    
    // Hücreleri oluştur
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.createElement('div');
        cell.classList.add('sudoku-cell');
        cell.setAttribute('data-row', row);
        cell.setAttribute('data-col', col);
        
        // Orijinal hücreyse (değiştirilemez)
        if (gameState.originalCells.has(`${row}-${col}`)) {
          cell.classList.add('fixed');
          cell.textContent = gameState.board[row][col];
        } 
        // Oyuncu tarafından doldurulmuş
        else if (gameState.board[row][col] !== 0) {
          cell.textContent = gameState.board[row][col];
          
          // Doğru mu kontrol et
          if (gameState.board[row][col] === gameState.solution[row][col]) {
            cell.classList.add('correct');
          } else {
            cell.classList.add('incorrect');
          }
        } 
        // Boş hücre
        else {
          cell.classList.add('empty');
          // Notlar için içerik
          const notesContainer = document.createElement('div');
          notesContainer.classList.add('notes-container');
          for (let i = 1; i <= 9; i++) {
            const noteElement = document.createElement('span');
            noteElement.classList.add('note');
            noteElement.setAttribute('data-note', i);
            notesContainer.appendChild(noteElement);
          }
          cell.appendChild(notesContainer);
        }
        
        // Hücreye tıklama olayı ekle
        cell.addEventListener('click', () => {
          selectCell(row, col);
          playSound('select');
        });
        
        // 3x3 bloğunu belirtmek için kenar çizgileri
        if (col % 3 === 2 && col < 8) cell.classList.add('border-right');
        if (row % 3 === 2 && row < 8) cell.classList.add('border-bottom');
        
        boardElement.appendChild(cell);
      }
    }
    
    // Not değerlerini güncelle
    updateAllNotes();
  }
  
  function updateAllNotes() {
    const cells = document.querySelectorAll('.sudoku-cell.empty');
    cells.forEach(cell => {
      const row = parseInt(cell.getAttribute('data-row'));
      const col = parseInt(cell.getAttribute('data-col'));
      
      // Hücrenin not konteynerini bul
      const notesContainer = cell.querySelector('.notes-container');
      if (!notesContainer) return;
      
      // Her not için kontrol et
      const noteElements = notesContainer.querySelectorAll('.note');
      noteElements.forEach(noteElement => {
        const noteValue = parseInt(noteElement.getAttribute('data-note'));
        
        // Önceden kaydedilmiş not değeri
        if (hasNote(row, col, noteValue)) {
          noteElement.textContent = noteValue;
        } else {
          noteElement.textContent = '';
        }
      });
    });
  }
  
  function hasNote(row, col, num) {
    const cellKey = `${row}-${col}`;
    const noteKey = `note-${cellKey}-${num}`;
    return localStorage.getItem(noteKey) === 'true';
  }

  function selectCell(row, col) {
    // Duraklatılmışsa seçime izin verme
    if (gameState.paused) return;
    
    // Önceki seçili hücreyi temizle
    if (gameState.selectedCell) {
      const prevCell = getCellElement(gameState.selectedCell.row, gameState.selectedCell.col);
      if (prevCell) prevCell.classList.remove('selected');
      
      // Aynı sütun ve satırda olanları vurgula
      unhighlightRelatedCells(gameState.selectedCell.row, gameState.selectedCell.col);
    }
    
    // Seçim aynı hücreye yapıldıysa seçimi iptal et
    if (gameState.selectedCell && gameState.selectedCell.row === row && gameState.selectedCell.col === col) {
      gameState.selectedCell = null;
      return;
    }
    
    // Yeni hücreyi seç
    gameState.selectedCell = { row, col };
    const cellElement = getCellElement(row, col);
    if (cellElement) {
      cellElement.classList.add('selected');
      
      // Aynı sütun ve satırda olanları vurgula
      highlightRelatedCells(row, col);
    }
  }
  
  function highlightRelatedCells(row, col) {
    // Aynı satır, sütun ve 3x3 bloğundaki hücreleri vurgula
    for (let i = 0; i < 9; i++) {
      // Aynı satır
      const rowCell = getCellElement(row, i);
      if (rowCell && i !== col) rowCell.classList.add('highlight');
      
      // Aynı sütun
      const colCell = getCellElement(i, col);
      if (colCell && i !== row) colCell.classList.add('highlight');
    }
    
    // Aynı 3x3 blok
    const blockRow = Math.floor(row / 3) * 3;
    const blockCol = Math.floor(col / 3) * 3;
    
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const blockCell = getCellElement(blockRow + r, blockCol + c);
        if (blockCell && (blockRow + r !== row || blockCol + c !== col)) {
          blockCell.classList.add('highlight');
        }
      }
    }
    
    // Aynı değere sahip hücreleri vurgula
    const value = gameState.board[row][col];
    if (value !== 0) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (gameState.board[r][c] === value && (r !== row || c !== col)) {
            const valueCell = getCellElement(r, c);
            if (valueCell) valueCell.classList.add('same-value');
          }
        }
      }
    }
  }
  
  function unhighlightRelatedCells(row, col) {
    // Tüm vurguları kaldır
    const cells = document.querySelectorAll('.sudoku-cell.highlight, .sudoku-cell.same-value');
    cells.forEach(cell => {
      cell.classList.remove('highlight', 'same-value');
    });
  }

  function enterNumber(num) {
    if (!gameState.selectedCell || gameState.paused) return;
    
    const { row, col } = gameState.selectedCell;
    
    // Orijinal (değiştirilemez) hücrelere sayı girişi yok
    if (gameState.originalCells.has(`${row}-${col}`)) {
      showAlert('Bu hücre değiştirilemez!', 'error');
      playSound('wrong');
      return;
    }
    
    if (gameState.notesEnabled) {
      // Not modunda
      toggleNote(row, col, num);
    } else {
      // Normal modda
      // Aynı sayı zaten varsa sil (toggle gibi)
      if (gameState.board[row][col] === num) {
        gameState.board[row][col] = 0;
      } else {
        // Hamle sayısını artır
        gameState.moves++;
        
        // Önceki değer
        const prevValue = gameState.board[row][col];
        
        // Yeni değeri ata
        gameState.board[row][col] = num;
        
        // Doğru mu kontrol et
        const isCorrect = gameState.board[row][col] === gameState.solution[row][col];
        
        // Ses efekti
        if (isCorrect) {
          playSound('correct');
        } else {
          playSound('wrong');
        }
      }
      
      // Tahtayı güncelle
      renderBoard();
      
      // Seçilen hücreyi tekrar işaretle
      const cellElement = getCellElement(row, col);
      if (cellElement) {
        cellElement.classList.add('selected');
        
        // İlgili hücreleri vurgula
        highlightRelatedCells(row, col);
      }
      
      // Oyun tamamlandı mı kontrol et
      if (isBoardFilled() && isBoardCorrect()) {
        gameCompleted();
      }
    }
  }

  function toggleNote(row, col, num) {
    const cellElement = getCellElement(row, col);
    if (!cellElement || gameState.board[row][col] !== 0) return;
    
    const noteElement = cellElement.querySelector(`.note[data-note="${num}"]`);
    if (!noteElement) return;
    
    // Not değerini değiştir
    const cellKey = `${row}-${col}`;
    const noteKey = `note-${cellKey}-${num}`;
    
    if (noteElement.textContent === num.toString()) {
      noteElement.textContent = '';
      localStorage.removeItem(noteKey);
    } else {
      noteElement.textContent = num;
      localStorage.setItem(noteKey, 'true');
    }
  }

  function eraseCell() {
    if (!gameState.selectedCell || gameState.paused) return;
    
    const { row, col } = gameState.selectedCell;
    
    // Orijinal hücreler değiştirilemez
    if (gameState.originalCells.has(`${row}-${col}`)) {
      showAlert('Bu hücre değiştirilemez!', 'error');
      playSound('wrong');
      return;
    }
    
    // Hücrenin mevcut değeri
    const currentValue = gameState.board[row][col];
    
    // Boş değilse hamle sayısını artır
    if (currentValue !== 0) {
      gameState.moves++;
    }
    
    // Hücreyi temizle
    gameState.board[row][col] = 0;
    
    // Notları da temizle
    clearCellNotes(row, col);
    
    // Tahtayı güncelle
    renderBoard();
    
    // Seçilen hücreyi tekrar işaretle
    const cellElement = getCellElement(row, col);
    if (cellElement) {
      cellElement.classList.add('selected');
      
      // İlgili hücreleri vurgula
      highlightRelatedCells(row, col);
    }
  }
  
  function clearCellNotes(row, col) {
    const cellKey = `${row}-${col}`;
    
    // Tüm notları temizle
    for (let num = 1; num <= 9; num++) {
      const noteKey = `note-${cellKey}-${num}`;
      localStorage.removeItem(noteKey);
    }
  }

  function provideHint() {
    if (!gameState.selectedCell || gameState.paused) return;
    
    const { row, col } = gameState.selectedCell;
    
    // Orijinal hücreler zaten dolu
    if (gameState.originalCells.has(`${row}-${col}`)) {
      showAlert('Bu hücre zaten dolu!', 'info');
      return;
    }
    
    // Hücre zaten doğru ise ipucu gereksiz
    if (gameState.board[row][col] === gameState.solution[row][col]) {
      showAlert('Bu hücre zaten doğru!', 'info');
      return;
    }
    
    // İpucu olarak doğru değeri göster
    gameState.board[row][col] = gameState.solution[row][col];
    
    // Bu hücreyi artık orijinal olarak işaretle
    gameState.originalCells.add(`${row}-${col}`);
    
    // İpucu kullanım sayısını artır
    gameState.hintsUsed++;
    
    // Tahtayı güncelle
    renderBoard();
    
    // Seçilen hücreyi tekrar işaretle
    const cellElement = getCellElement(row, col);
    if (cellElement) {
      cellElement.classList.add('selected');
      
      // İlgili hücreleri vurgula
      highlightRelatedCells(row, col);
    }
    
    showAlert('İpucu kullanıldı!', 'success');
    
    // Oyun tamamlandı mı kontrol et
    if (isBoardFilled() && isBoardCorrect()) {
      gameCompleted();
    }
  }

  function toggleNotesMode() {
    gameState.notesEnabled = !gameState.notesEnabled;
    notesToggleBtn.innerHTML = gameState.notesEnabled ? 
      '<i class="fas fa-pencil-alt"></i> Notlar (Açık)' : 
      '<i class="fas fa-pencil-alt"></i> Notlar (Kapalı)';
    
    notesToggleBtn.classList.toggle('active', gameState.notesEnabled);
    
    showAlert(gameState.notesEnabled ? 'Not modu açıldı!' : 'Not modu kapatıldı!', 'info');
  }

  function handleKeyPress(e) {
    if (gameState.paused) return;
    
    // Sayı tuşları
    if (e.key >= '1' && e.key <= '9') {
      enterNumber(parseInt(e.key));
    }
    // Yön tuşları ile hücre seçimi
    else if (e.key.startsWith('Arrow') && gameState.selectedCell) {
      const { row, col } = gameState.selectedCell;
      let newRow = row;
      let newCol = col;
      
      switch(e.key) {
        case 'ArrowUp':    newRow = Math.max(0, row - 1); break;
        case 'ArrowDown':  newRow = Math.min(8, row + 1); break;
        case 'ArrowLeft':  newCol = Math.max(0, col - 1); break;
        case 'ArrowRight': newCol = Math.min(8, col + 1); break;
      }
      
      if (newRow !== row || newCol !== col) {
        selectCell(newRow, newCol);
        playSound('select');
      }
      
      e.preventDefault();
    }
    // Del veya Backspace tuşu ile silme
    else if (e.key === 'Delete' || e.key === 'Backspace') {
      eraseCell();
      playSound('select');
      e.preventDefault();
    }
    // Space ile not modu
    else if (e.key === ' ') {
      toggleNotesMode();
      playSound('select');
      e.preventDefault();
    }
    // H tuşu ile ipucu
    else if (e.key.toLowerCase() === 'h') {
      provideHint();
      playSound('hint');
    }
    // N tuşu ile yeni oyun
    else if (e.key.toLowerCase() === 'n') {
      if (confirm('Yeni oyun başlatmak istediğinizden emin misiniz?')) {
        generateNewGame();
        playSound('select');
      }
    }
    // P tuşu ile pause/resume
    else if (e.key.toLowerCase() === 'p') {
      if (gameState.paused) {
        resumeGame();
      } else {
        pauseGame();
      }
      playSound('select');
    }
  }

  function startTimer() {
    // Varsa önceki zamanlayıcıyı durdur
    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
    }
    
    gameState.timer = 0;
    timerElement.textContent = formatTime(gameState.timer);
    
    gameState.timerInterval = setInterval(() => {
      if (!gameState.paused) {
        gameState.timer++;
        timerElement.textContent = formatTime(gameState.timer);
      }
    }, 1000);
  }

  function pauseGame() {
    if (gameState.status !== 'ongoing') return;
    
    gameState.paused = true;
    pauseMenu.style.display = 'flex';
    updateStatusDisplay('paused');
  }

  function resumeGame() {
    gameState.paused = false;
    pauseMenu.style.display = 'none';
    updateStatusDisplay('ongoing');
  }

  function gameCompleted() {
    // Zamanlayıcıyı durdur
    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
    }
    
    // Oyun durumunu güncelle
    gameState.status = 'completed';
    updateStatusDisplay('completed');
    
    // Oyun tamamlandı sesi
    playSound('complete');
    
    // Skor gönder
    sendScore();
    
    // Tebrik mesajı
    const timeMessage = formatTime(gameState.timer);
    const difficultyName = getDifficultyName(gameState.difficulty);
    showAlert(`Tebrikler! ${difficultyName} seviyede Sudoku'yu ${timeMessage} sürede tamamladınız!`, 'success');
  }

  function sendScore() {
    // Zorluk seviyesine göre puan hesapla
    let baseScore = 1000;
    
    switch(gameState.difficulty) {
      case 'easy':   baseScore = 1000; break;
      case 'medium': baseScore = 2000; break;
      case 'hard':   baseScore = 3000; break;
    }
    
    // Süreye göre puan düşür (30 dakikadan sonra minimum puan 200)
    const timeBonus = Math.max(0.2, 1 - (gameState.timer / 1800));
    
    // Hamle sayısı bonusu (81 hamle ideal, fazlası ceza)
    const movesBase = 81; // 9x9 tahta
    const movesFactor = Math.max(0.5, 1 - Math.max(0, gameState.moves - movesBase) / 100);
    
    // İpucu kullanım cezası
    const hintPenalty = Math.max(0.4, 1 - (gameState.hintsUsed * 0.1));
    
    // Nihai puan
    const finalScore = Math.round(baseScore * timeBonus * movesFactor * hintPenalty);
    
    // Skoru sunucuya gönder
    fetch('/api/save-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type: 'sudoku',
        score: finalScore,
        details: {
          difficulty: gameState.difficulty,
          time: gameState.timer,
          moves: gameState.moves,
          hints_used: gameState.hintsUsed
        }
      })
    })
    .then(response => response.json())
    .then(data => console.log('Skor gönderildi:', data))
    .catch(error => console.error('Skor gönderme hatası:', error));
  }

  // Yardımcı Fonksiyonlar
  function getCellElement(row, col) {
    return document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
  }

  function isBoardFilled() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gameState.board[row][col] === 0) {
          return false;
        }
      }
    }
    return true;
  }

  function isBoardCorrect() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gameState.board[row][col] !== gameState.solution[row][col]) {
          return false;
        }
      }
    }
    return true;
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function showAlert(message, type) {
    const alertId = `${type}-alert`;
    const alertElement = document.getElementById(alertId);
    
    alertElement.textContent = message;
    alertElement.classList.add('show');
    
    setTimeout(() => {
      alertElement.classList.remove('show');
    }, 3000);
  }

  function changeDifficulty(difficulty) {
    gameState.difficulty = difficulty;
    difficultyDisplay.textContent = getDifficultyName(difficulty);
    generateNewGame();
  }

  function getDifficultyName(difficulty) {
    switch(difficulty) {
      case 'easy': return 'Kolay';
      case 'medium': return 'Orta';
      case 'hard': return 'Zor';
      default: return 'Kolay';
    }
  }

  function getDifficultyRemovalCount() {
    // Kaldırılacak hücre sayısı (81 hücreden)
    switch(gameState.difficulty) {
      case 'easy': return 35;    // 46 ipucu kalır
      case 'medium': return 45;  // 36 ipucu kalır
      case 'hard': return 55;    // 26 ipucu kalır
      default: return 35;
    }
  }

  function updateStatusDisplay(status) {
    gameState.status = status;
    
    switch(status) {
      case 'ongoing':
        statusDisplay.textContent = 'Devam Ediyor';
        statusDisplay.classList.remove('status-paused', 'status-completed');
        statusDisplay.classList.add('status-ongoing');
        break;
      case 'paused':
        statusDisplay.textContent = 'Duraklatıldı';
        statusDisplay.classList.remove('status-ongoing', 'status-completed');
        statusDisplay.classList.add('status-paused');
        break;
      case 'completed':
        statusDisplay.textContent = 'Tamamlandı';
        statusDisplay.classList.remove('status-ongoing', 'status-paused');
        statusDisplay.classList.add('status-completed');
        break;
    }
  }

  function resetGameState() {
    // Temel oyun durumunu sıfırla
    gameState.board = Array(9).fill().map(() => Array(9).fill(0));
    gameState.solution = Array(9).fill().map(() => Array(9).fill(0));
    gameState.selectedCell = null;
    gameState.originalCells = new Set();
    gameState.timer = 0;
    gameState.status = 'ongoing';
    gameState.paused = false;
    gameState.hintsUsed = 0;
    gameState.moves = 0;
    
    // Not modu kapalı olarak başlat
    gameState.notesEnabled = false;
    notesToggleBtn.innerHTML = '<i class="fas fa-pencil-alt"></i> Notlar (Kapalı)';
    notesToggleBtn.classList.remove('active');
  }

  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // Oyunu başlat
  initGame();
});
