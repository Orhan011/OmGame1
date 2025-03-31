
// Sudoku oyunu için JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const sudokuBoard = document.getElementById('sudoku-board');
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');
  const newGameBtn = document.getElementById('new-game');
  const hintBtn = document.getElementById('hint');
  const solveBtn = document.getElementById('solve');
  const checkBtn = document.getElementById('check-solution');
  const numpadBtns = document.querySelectorAll('.numpad-btn');
  const notesToggle = document.getElementById('notes-toggle');
  const eraseBtn = document.getElementById('erase');
  const timerDisplay = document.getElementById('timer');
  const gameStatusDisplay = document.getElementById('game-status');
  
  // Oyun değişkenleri
  let selectedCell = null;
  let difficulty = 'kolay'; // Varsayılan zorluk
  let gameBoard = [];
  let solution = [];
  let notesMode = false;
  let timer = null;
  let seconds = 0;
  let gameActive = false;
  
  // Zorluk butonları için event listener
  difficultyButtons.forEach(button => {
    button.addEventListener('click', function() {
      difficultyButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      difficulty = this.dataset.difficulty;
      startNewGame();
    });
  });
  
  // Yeni oyun butonu
  newGameBtn.addEventListener('click', startNewGame);
  
  // İpucu butonu
  hintBtn.addEventListener('click', giveHint);
  
  // Çöz butonu
  solveBtn.addEventListener('click', solvePuzzle);
  
  // Kontrol butonu
  checkBtn.addEventListener('click', checkSolution);
  
  // Notlar toggle
  notesToggle.addEventListener('click', function() {
    notesMode = !notesMode;
    this.classList.toggle('active', notesMode);
    if (notesMode) {
      this.innerHTML = '<i class="fas fa-pencil-alt"></i> Notlar (Açık)';
    } else {
      this.innerHTML = '<i class="fas fa-pencil-alt"></i> Notlar (Kapalı)';
    }
  });
  
  // Silme butonu
  eraseBtn.addEventListener('click', function() {
    if (selectedCell && !selectedCell.classList.contains('fixed')) {
      selectedCell.textContent = '';
      selectedCell.classList.remove('error');
      selectedCell.dataset.value = '0';
      updateGameBoard();
    }
  });
  
  // Numpad tuşları
  numpadBtns.forEach(button => {
    if (button.dataset.num) {
      button.addEventListener('click', function() {
        if (selectedCell && !selectedCell.classList.contains('fixed')) {
          const num = this.dataset.num;
          
          if (notesMode) {
            toggleNote(selectedCell, num);
          } else {
            // Not modunda değilse, doğrudan değeri ata
            selectedCell.innerHTML = num;
            selectedCell.dataset.value = num;
            selectedCell.classList.remove('notes');
            
            // Çakışma kontrolü
            checkConflicts();
            
            // Oyun bitmiş mi kontrol et
            if (isGameComplete()) {
              endGame(true);
            }
          }
          
          updateGameBoard();
        }
      });
    }
  });
  
  // Oyun tahtasını oluştur
  function createBoard() {
    sudokuBoard.innerHTML = '';
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.dataset.value = '0';
        
        // Izgara çizgilerini ayarla
        if (row % 3 === 0) cell.classList.add('border-top');
        if (row === 8) cell.classList.add('border-bottom');
        if (col % 3 === 0) cell.classList.add('border-left');
        if (col === 8) cell.classList.add('border-right');
        
        // Hücre tıklama olayı
        cell.addEventListener('click', function() {
          if (gameActive) {
            if (selectedCell) {
              selectedCell.classList.remove('selected');
            }
            
            this.classList.add('selected');
            selectedCell = this;
            
            // Aynı değere sahip hücreleri vurgula
            highlightSameNumbers(this.textContent);
          }
        });
        
        sudokuBoard.appendChild(cell);
      }
    }
  }
  
  // Yeni oyunu başlat
  function startNewGame() {
    resetTimer();
    startTimer();
    gameActive = true;
    gameStatusDisplay.textContent = 'Oyun başladı! Bol şanslar!';
    gameStatusDisplay.className = 'text-success';
    
    // Mevcut tahtayı temizle
    createBoard();
    
    // Zorluk seviyesine göre dolu hücre sayısı
    let filledCells;
    switch(difficulty) {
      case 'kolay':
        filledCells = 38;
        break;
      case 'orta':
        filledCells = 30;
        break;
      case 'zor':
        filledCells = 24;
        break;
      default:
        filledCells = 38;
    }
    
    // Yeni sudoku oluştur
    generateSudoku(filledCells);
  }
  
  // Sudoku tahtası oluştur
  function generateSudoku(filledCells) {
    // Önce çözümü oluştur
    solution = createSolvedGrid();
    
    // Çözümün bir kopyasını al
    gameBoard = solution.map(row => [...row]);
    
    // İpuçlarını belirle (zorluk seviyesine göre)
    let cells = [];
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        cells.push({row: i, col: j});
      }
    }
    
    // Karıştır
    cells = shuffleArray(cells);
    
    // Belirli sayıda hücreyi boş bırak
    for (let i = 0; i < 81 - filledCells; i++) {
      const cell = cells[i];
      gameBoard[cell.row][cell.col] = 0;
    }
    
    // Tahtayı güncelle
    updateBoardDisplay();
  }
  
  // Çözülmüş bir Sudoku ızgarası oluştur
  function createSolvedGrid() {
    const grid = Array(9).fill().map(() => Array(9).fill(0));
    
    // Basit doldurma algoritması
    if (!fillGrid(grid)) {
      console.error("Geçerli bir Sudoku çözümü oluşturulamadı!");
    }
    
    return grid;
  }
  
  // Izgara doldurma fonksiyonu (geri izleme algoritması)
  function fillGrid(grid) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          // Karışık sırada 1-9 sayılarını dene
          const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          
          for (let i = 0; i < nums.length; i++) {
            const num = nums[i];
            
            // Kurallara uygunsa, bu sayıyı yerleştir
            if (isValidPlacement(grid, row, col, num)) {
              grid[row][col] = num;
              
              // Geri izleme ile devam et
              if (fillGrid(grid)) {
                return true;
              }
              
              // Bu çözüm yolu çalışmadı, geri al
              grid[row][col] = 0;
            }
          }
          
          // Hiçbir sayı işe yaramadı, geriye dön
          return false;
        }
      }
    }
    
    // Tüm hücreler dolduruldu
    return true;
  }
  
  // Sayı yerleştirmenin geçerli olup olmadığını kontrol et
  function isValidPlacement(grid, row, col, num) {
    // Aynı satırda çakışma var mı?
    for (let c = 0; c < 9; c++) {
      if (grid[row][c] === num) {
        return false;
      }
    }
    
    // Aynı sütunda çakışma var mı?
    for (let r = 0; r < 9; r++) {
      if (grid[r][col] === num) {
        return false;
      }
    }
    
    // Aynı 3x3 kutucukta çakışma var mı?
    const boxStartRow = Math.floor(row / 3) * 3;
    const boxStartCol = Math.floor(col / 3) * 3;
    
    for (let r = boxStartRow; r < boxStartRow + 3; r++) {
      for (let c = boxStartCol; c < boxStartCol + 3; c++) {
        if (grid[r][c] === num) {
          return false;
        }
      }
    }
    
    // Tüm kontrollerden geçti, yerleştirme geçerli
    return true;
  }
  
  // Tahtayı güncelle
  function updateBoardDisplay() {
    const cells = document.querySelectorAll('.sudoku-cell');
    
    cells.forEach(cell => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const value = gameBoard[row][col];
      
      if (value !== 0) {
        cell.textContent = value;
        cell.dataset.value = value;
        cell.classList.add('fixed');
      } else {
        cell.textContent = '';
        cell.dataset.value = '0';
        cell.classList.remove('fixed');
      }
    });
  }
  
  // Oyun tahtasını güncelle
  function updateGameBoard() {
    const cells = document.querySelectorAll('.sudoku-cell');
    
    cells.forEach(cell => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const value = parseInt(cell.dataset.value) || 0;
      
      gameBoard[row][col] = value;
    });
  }
  
  // İpucu ver
  function giveHint() {
    if (!gameActive) return;
    
    // Boş hücreleri bul
    const emptyCells = [];
    const cells = document.querySelectorAll('.sudoku-cell');
    
    cells.forEach(cell => {
      if (!cell.classList.contains('fixed') && (cell.textContent === '' || cell.classList.contains('notes'))) {
        emptyCells.push(cell);
      }
    });
    
    if (emptyCells.length === 0) return;
    
    // Rastgele bir boş hücre seç
    const randCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const row = parseInt(randCell.dataset.row);
    const col = parseInt(randCell.dataset.col);
    
    // Çözümdeki değeri göster
    randCell.textContent = solution[row][col];
    randCell.dataset.value = solution[row][col];
    randCell.classList.add('hint');
    randCell.classList.remove('notes');
    
    updateGameBoard();
    checkConflicts();
    
    // Oyun bitmiş mi kontrol et
    if (isGameComplete()) {
      endGame(true);
    }
  }
  
  // Sudoku'yu çöz
  function solvePuzzle() {
    gameActive = false;
    stopTimer();
    
    const cells = document.querySelectorAll('.sudoku-cell');
    
    cells.forEach(cell => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      
      cell.textContent = solution[row][col];
      cell.dataset.value = solution[row][col];
      
      if (!cell.classList.contains('fixed')) {
        cell.classList.add('solution');
      }
      
      cell.classList.remove('error', 'notes');
    });
    
    gameStatusDisplay.textContent = 'Çözüm gösterildi!';
    gameStatusDisplay.className = 'text-info';
  }
  
  // Çözümü kontrol et
  function checkSolution() {
    updateGameBoard();
    
    const cells = document.querySelectorAll('.sudoku-cell');
    let incorrect = 0;
    
    cells.forEach(cell => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const value = parseInt(cell.dataset.value) || 0;
      
      if (value !== 0 && value !== solution[row][col]) {
        cell.classList.add('error');
        incorrect++;
      } else {
        cell.classList.remove('error');
      }
    });
    
    if (incorrect > 0) {
      gameStatusDisplay.textContent = `${incorrect} yanlış rakam var!`;
      gameStatusDisplay.className = 'text-danger';
    } else if (isGameComplete()) {
      endGame(true);
    } else {
      gameStatusDisplay.textContent = 'Şu ana kadar her şey doğru!';
      gameStatusDisplay.className = 'text-success';
    }
  }
  
  // Çakışmaları kontrol et
  function checkConflicts() {
    const cells = document.querySelectorAll('.sudoku-cell');
    
    // Önce tüm hata işaretlerini kaldır
    cells.forEach(cell => {
      cell.classList.remove('error');
    });
    
    // Satır ve sütun çakışmalarını kontrol et
    for (let i = 0; i < 9; i++) {
      checkRowConflicts(i);
      checkColConflicts(i);
    }
    
    // 3x3 bölge çakışmalarını kontrol et
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        checkBoxConflicts(boxRow, boxCol);
      }
    }
  }
  
  // Satır çakışmalarını kontrol et
  function checkRowConflicts(row) {
    const values = {};
    
    for (let col = 0; col < 9; col++) {
      const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
      const value = parseInt(cell.dataset.value) || 0;
      
      if (value !== 0) {
        if (values[value]) {
          // Çakışma var
          cell.classList.add('error');
          values[value].forEach(conflictCell => {
            conflictCell.classList.add('error');
          });
        } else {
          values[value] = [cell];
        }
      }
    }
  }
  
  // Sütun çakışmalarını kontrol et
  function checkColConflicts(col) {
    const values = {};
    
    for (let row = 0; row < 9; row++) {
      const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
      const value = parseInt(cell.dataset.value) || 0;
      
      if (value !== 0) {
        if (values[value]) {
          // Çakışma var
          cell.classList.add('error');
          values[value].forEach(conflictCell => {
            conflictCell.classList.add('error');
          });
        } else {
          values[value] = [cell];
        }
      }
    }
  }
  
  // 3x3 bölge çakışmalarını kontrol et
  function checkBoxConflicts(boxRow, boxCol) {
    const values = {};
    
    for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
      for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
        const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
        const value = parseInt(cell.dataset.value) || 0;
        
        if (value !== 0) {
          if (values[value]) {
            // Çakışma var
            cell.classList.add('error');
            values[value].forEach(conflictCell => {
              conflictCell.classList.add('error');
            });
          } else {
            values[value] = [cell];
          }
        }
      }
    }
  }
  
  // Oyun tamamlandı mı kontrol et
  function isGameComplete() {
    // Tüm hücreler dolu ve çözüme uygun mu?
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
        const value = parseInt(cell.dataset.value) || 0;
        
        if (value === 0 || value !== solution[row][col]) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  // Oyunu bitir
  function endGame(won) {
    gameActive = false;
    stopTimer();
    
    if (won) {
      // Skoru hesapla: zorluk * 1000 / saniye
      let difficultyMultiplier;
      switch(difficulty) {
        case 'kolay': difficultyMultiplier = 1; break;
        case 'orta': difficultyMultiplier = 2; break;
        case 'zor': difficultyMultiplier = 3; break;
        default: difficultyMultiplier = 1;
      }
      
      const score = Math.floor((difficultyMultiplier * 1000) / Math.max(seconds, 60));
      
      gameStatusDisplay.textContent = `Tebrikler! Sudoku'yu ${formatTime(seconds)} içinde çözdün! Skor: ${score}`;
      gameStatusDisplay.className = 'text-success';
      
      // Skoru kaydet
      saveScore(score);
    }
  }
  
  // Skoru kaydet
  function saveScore(score) {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameType: 'sudoku',
        score: score
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Skor kaydedildi:', data);
    })
    .catch(error => {
      console.error('Skor kaydedilirken hata oluştu:', error);
    });
  }
  
  // Aynı sayıları vurgula
  function highlightSameNumbers(number) {
    const cells = document.querySelectorAll('.sudoku-cell');
    
    cells.forEach(cell => {
      cell.classList.remove('highlight');
      
      if (cell.textContent === number && number !== '') {
        cell.classList.add('highlight');
      }
    });
  }
  
  // Not ekle/kaldır
  function toggleNote(cell, num) {
    cell.classList.add('notes');
    
    // Mevcut notları al
    const notes = cell.querySelectorAll('.note');
    let noteExists = false;
    
    // Bu not var mı kontrol et
    for (let note of notes) {
      if (note.textContent === num) {
        note.remove();
        noteExists = true;
        break;
      }
    }
    
    // Not yoksa ekle
    if (!noteExists) {
      const noteSpan = document.createElement('span');
      noteSpan.className = 'note';
      noteSpan.textContent = num;
      
      // Notları hizala
      const position = parseInt(num) - 1;
      const row = Math.floor(position / 3);
      const col = position % 3;
      
      noteSpan.style.gridRow = row + 1;
      noteSpan.style.gridColumn = col + 1;
      
      cell.appendChild(noteSpan);
    }
    
    // Hücre notlar içermiyor mu kontrolü
    if (cell.querySelectorAll('.note').length === 0) {
      cell.classList.remove('notes');
      cell.dataset.value = '0';
    } else {
      cell.dataset.value = '0'; // Notlar varken değeri 0 olarak ayarla
    }
  }
  
  // Zamanlayıcı fonksiyonları
  function startTimer() {
    seconds = 0;
    updateTimerDisplay();
    
    timer = setInterval(() => {
      seconds++;
      updateTimerDisplay();
    }, 1000);
  }
  
  function stopTimer() {
    clearInterval(timer);
  }
  
  function resetTimer() {
    stopTimer();
    seconds = 0;
    updateTimerDisplay();
  }
  
  function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(seconds);
  }
  
  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Yardımcı fonksiyonlar
  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
  
  // Oyunu başlat
  createBoard();
  startNewGame();
});
