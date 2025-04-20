/**
 * Sudoku - Mantık ve sayı bulmaca oyunu
 * Mantıksal düşünme yeteneklerini geliştirmeye yönelik bir oyun
 */

class SudokuGame {
  constructor() {
    // Oyun tahtası elemanları
    this.boardEl = document.getElementById('sudoku-board');
    this.timerEl = document.getElementById('timer');
    this.movesEl = document.getElementById('moves-count');
    this.difficultySelect = document.getElementById('difficulty-select');
    this.newGameBtn = document.getElementById('new-game-btn');
    this.newGameModalBtn = document.getElementById('new-game-modal');
    this.hintBtn = document.getElementById('hint-btn');
    this.showHintBtn = document.getElementById('show-hint-btn');
    this.noteModeBtn = document.getElementById('note-mode-btn');
    this.checkSolutionBtn = document.getElementById('check-solution-btn');
    this.helpBtn = document.getElementById('help-btn');
    this.closeHelpBtn = document.getElementById('close-help-btn');
    this.helpPanel = document.getElementById('help-panel');

    // Bootstrap modallarını hazırla
    this.resultModal = new bootstrap.Modal(document.getElementById('result-modal'));
    this.hintModal = new bootstrap.Modal(document.getElementById('hint-modal'));
    
    // Oyun ayarları kontrolleri
    this.highlightSameCheck = document.getElementById('highlight-same');
    this.highlightErrorsCheck = document.getElementById('highlight-errors');
    this.showCandidatesCheck = document.getElementById('show-candidates');

    // Oyun değişkenleri
    this.board = Array(9).fill().map(() => Array(9).fill(0)); // Mevcut durum
    this.solution = Array(9).fill().map(() => Array(9).fill(0)); // Çözüm
    this.fixed = Array(9).fill().map(() => Array(9).fill(false)); // Sabit hücreler
    this.candidates = Array(9).fill().map(() => Array(9).fill().map(() => new Set())); // Aday notları
    this.selectedCell = null;
    this.noteMode = false;
    this.timeInterval = null;
    this.startTime = null;
    this.moves = 0;
    this.hintsUsed = 0;
    this.difficulty = 'easy';
    this.gameActive = false;

    // Event listener'ları ayarla
    this.setupEventListeners();
    
    // Yeni oyun başlat
    this.newGame();
  }

  // Event listener'ları kurulumu
  setupEventListeners() {
    // Yeni oyun butonları
    this.newGameBtn.addEventListener('click', () => this.newGame());
    this.newGameModalBtn.addEventListener('click', () => {
      this.resultModal.hide();
      this.newGame();
    });
    
    // İpucu butonu
    this.hintBtn.addEventListener('click', () => {
      document.getElementById('hint-text').textContent = 'Bir ipucu almak istediğinizden emin misiniz? Bu puan hesaplamanızı etkileyecektir.';
      this.hintModal.show();
    });
    
    // İpucu gösterme butonu
    this.showHintBtn.addEventListener('click', () => {
      this.showHint();
      this.hintModal.hide();
    });
    
    // Not modu butonu
    this.noteModeBtn.addEventListener('click', () => {
      this.noteMode = !this.noteMode;
      this.noteModeBtn.classList.toggle('active', this.noteMode);
    });
    
    // Çözüm kontrol butonu
    this.checkSolutionBtn.addEventListener('click', () => this.checkSolution());
    
    // Yardım butonu
    this.helpBtn.addEventListener('click', () => {
      this.helpPanel.classList.remove('hidden');
    });
    
    // Yardım kapatma butonu
    this.closeHelpBtn.addEventListener('click', () => {
      this.helpPanel.classList.add('hidden');
    });
    
    // Zorluk seçimi
    this.difficultySelect.addEventListener('change', () => {
      this.difficulty = this.difficultySelect.value;
    });
    
    // Oyun ayarları değişikliği
    this.highlightSameCheck.addEventListener('change', () => this.updateBoardHighlights());
    this.highlightErrorsCheck.addEventListener('change', () => this.updateBoardHighlights());
    this.showCandidatesCheck.addEventListener('change', () => this.renderBoard());
    
    // Sayı butonları
    document.querySelectorAll('.number-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const value = parseInt(btn.dataset.value);
        if (this.selectedCell) {
          this.setNumber(value);
        }
      });
    });
    
    // Klavye olayları
    document.addEventListener('keydown', (e) => {
      if (!this.gameActive) return;
      
      if (this.selectedCell) {
        // Sayı tuşları
        if (e.key >= '1' && e.key <= '9') {
          this.setNumber(parseInt(e.key));
        }
        // Silme tuşları
        else if (e.key === '0' || e.key === 'Delete' || e.key === 'Backspace') {
          this.setNumber(0);
        }
        // Not modu için n tuşu
        else if (e.key === 'n' || e.key === 'N') {
          this.noteMode = !this.noteMode;
          this.noteModeBtn.classList.toggle('active', this.noteMode);
        }
        // Ok tuşları ile hareket
        else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          
          const [row, col] = this.selectedCell;
          let newRow = row, newCol = col;
          
          if (e.key === 'ArrowUp') newRow = Math.max(0, row - 1);
          else if (e.key === 'ArrowDown') newRow = Math.min(8, row + 1);
          else if (e.key === 'ArrowLeft') newCol = Math.max(0, col - 1);
          else if (e.key === 'ArrowRight') newCol = Math.min(8, col + 1);
          
          this.selectCell(newRow, newCol);
        }
      }
    });
  }

  // Yeni bir oyun başlat
  newGame() {
    // Önceki oyunu temizle
    clearInterval(this.timeInterval);
    
    // Oyun değişkenlerini sıfırla
    this.board = Array(9).fill().map(() => Array(9).fill(0));
    this.fixed = Array(9).fill().map(() => Array(9).fill(false));
    this.candidates = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
    this.selectedCell = null;
    this.moves = 0;
    this.hintsUsed = 0;
    this.updateMovesDisplay();
    
    // Tahtayı oluştur
    this.generateBoard();
    
    // Sayacı başlat
    this.startTimer();
    
    // Tahtayı render et
    this.renderBoard();
    
    this.gameActive = true;
  }

  // Sezgisel Sudoku çözücü
  solveSudoku(board) {
    const emptyCell = this.findEmptyCell(board);
    if (!emptyCell) return true; // Tüm hücreler dolu, çözüm bulundu
    
    const [row, col] = emptyCell;
    
    // Karıştırılmış sayı dizisi (rastgelelik için)
    const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    
    for (const num of numbers) {
      if (this.isValidPlacement(board, row, col, num)) {
        board[row][col] = num;
        
        if (this.solveSudoku(board)) {
          return true;
        }
        
        board[row][col] = 0; // Backtrack
      }
    }
    
    return false; // Çözüm bulunamadı
  }

  // Boş bir hücre bul
  findEmptyCell(board) {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === 0) {
          return [i, j];
        }
      }
    }
    return null;
  }

  // Numaranın geçerli bir yerleştirme olup olmadığını kontrol et
  isValidPlacement(board, row, col, num) {
    // Satır kontrolü
    for (let i = 0; i < 9; i++) {
      if (board[row][i] === num) {
        return false;
      }
    }
    
    // Sütun kontrolü
    for (let i = 0; i < 9; i++) {
      if (board[i][col] === num) {
        return false;
      }
    }
    
    // 3x3 blok kontrolü
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

  // Dizi elemanlarını karıştır
  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // Zorluk seviyesine göre hücre sayısını belirle
  getCellsToRemove() {
    switch (this.difficulty) {
      case 'easy': return 35; // 46 hücre görünür
      case 'medium': return 45; // 36 hücre görünür
      case 'hard': return 52; // 29 hücre görünür
      case 'expert': return 58; // 23 hücre görünür
      default: return 35;
    }
  }

  // Sudoku tahtası üret
  generateBoard() {
    // Çözümü oluştur
    const solvedBoard = Array(9).fill().map(() => Array(9).fill(0));
    this.solveSudoku(solvedBoard);
    
    // Çözümü kaydet
    this.solution = JSON.parse(JSON.stringify(solvedBoard));
    
    // Başlangıç tahtası için çözümü kopyala
    this.board = JSON.parse(JSON.stringify(solvedBoard));
    
    // Hücreleri zorluğa göre kaldır
    const cellsToRemove = this.getCellsToRemove();
    const allCells = [];
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        allCells.push([row, col]);
      }
    }
    
    // Rastgele hücreleri kaldır
    const shuffledCells = this.shuffleArray(allCells);
    const removedCells = shuffledCells.slice(0, cellsToRemove);
    
    for (const [row, col] of removedCells) {
      this.board[row][col] = 0;
    }
    
    // Sabit hücreleri işaretle
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        this.fixed[row][col] = this.board[row][col] !== 0;
      }
    }
  }

  // Tahtayı render et
  renderBoard() {
    this.boardEl.innerHTML = '';
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        const value = this.board[row][col];
        const isFixed = this.fixed[row][col];
        
        if (value !== 0) {
          cell.textContent = value;
          if (isFixed) {
            cell.classList.add('fixed');
          }
        } else if (this.showCandidatesCheck.checked && this.candidates[row][col].size > 0) {
          cell.classList.add('candidates');
          for (let n = 1; n <= 9; n++) {
            const candidateEl = document.createElement('div');
            candidateEl.className = 'candidate';
            candidateEl.textContent = this.candidates[row][col].has(n) ? n : '';
            cell.appendChild(candidateEl);
          }
        }
        
        cell.addEventListener('click', () => {
          this.selectCell(row, col);
        });
        
        this.boardEl.appendChild(cell);
      }
    }
    
    this.updateBoardHighlights();
  }

  // Hücre seçimi
  selectCell(row, col) {
    this.selectedCell = [row, col];
    this.updateBoardHighlights();
  }

  // Seçili hücreyi güncelle
  updateBoardHighlights() {
    document.querySelectorAll('.sudoku-cell').forEach(cell => {
      cell.classList.remove('selected', 'highlighted', 'related', 'error');
    });
    
    if (!this.selectedCell) return;
    
    const [selectedRow, selectedCol] = this.selectedCell;
    const selectedValue = this.board[selectedRow][selectedCol];
    
    // Tüm hücreleri kontrol et
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cellEl = this.boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const value = this.board[row][col];
        
        // Seçili hücre
        if (row === selectedRow && col === selectedCol) {
          cellEl.classList.add('selected');
        }
        
        // Hata vurgulama
        if (this.highlightErrorsCheck.checked && value !== 0) {
          if (!this.isValidPlacement({ ...this.board, [row]: { ...this.board[row], [col]: 0 } }, row, col, value)) {
            cellEl.classList.add('error');
          }
        }
        
        // Aynı değerleri vurgula
        if (this.highlightSameCheck.checked && selectedValue !== 0 && value === selectedValue) {
          cellEl.classList.add('highlighted');
        }
        
        // İlişkili hücreleri vurgula (aynı satır, sütun veya blok)
        if (row === selectedRow || col === selectedCol || 
            (Math.floor(row / 3) === Math.floor(selectedRow / 3) && 
             Math.floor(col / 3) === Math.floor(selectedCol / 3))) {
          cellEl.classList.add('related');
        }
      }
    }
  }

  // Sayı giriş işlemi
  setNumber(num) {
    if (!this.selectedCell || !this.gameActive) return;
    
    const [row, col] = this.selectedCell;
    
    // Sabit hücrelere değer girilmez
    if (this.fixed[row][col]) return;
    
    if (this.noteMode) {
      // Not modu etkinse, adayları güncelle
      if (num === 0) {
        // Tüm adayları temizle
        this.candidates[row][col].clear();
      } else {
        // Aday ekle veya çıkar
        if (this.candidates[row][col].has(num)) {
          this.candidates[row][col].delete(num);
        } else {
          this.candidates[row][col].add(num);
        }
      }
    } else {
      // Normal mod
      // Hamle sayısını güncelle
      if (this.board[row][col] !== num) {
        this.moves++;
        this.updateMovesDisplay();
      }
      
      // Tahtayı güncelle
      this.board[row][col] = num;
      
      // Adayları temizle
      if (num !== 0) {
        this.candidates[row][col].clear();
      }
      
      // Oyun tamamlandı mı kontrol et
      if (this.checkComplete()) {
        this.gameOver(true);
      }
    }
    
    // Tahtayı yeniden render et
    this.renderBoard();
  }

  // İpucu göster
  showHint() {
    if (!this.gameActive) return false;
    
    // İpucu sayısını artır
    this.hintsUsed++;
    
    let emptyCells = [];
    
    // Boş hücreleri bul
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.board[row][col] === 0) {
          emptyCells.push([row, col]);
        }
      }
    }
    
    if (emptyCells.length === 0) return false;
    
    // Rastgele bir boş hücre seç
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const [hintRow, hintCol] = emptyCells[randomIndex];
    
    // Doğru değeri yerleştir
    this.board[hintRow][hintCol] = this.solution[hintRow][hintCol];
    this.fixed[hintRow][hintCol] = true;
    
    // İpucu metnini güncelle
    document.getElementById('hint-text').textContent = `Doğru değer: ${this.solution[hintRow][hintCol]} (${hintRow+1}, ${hintCol+1} konumuna yerleştirildi)`;
    
    // Hamle sayısını artır
    this.moves++;
    this.updateMovesDisplay();
    
    // Tahtayı yeniden render et
    this.renderBoard();
    
    // Hücreyi seç
    this.selectCell(hintRow, hintCol);
    
    // Oyun tamamlandı mı kontrol et
    if (this.checkComplete()) {
      this.gameOver(true);
    }
    
    return true;
  }

  // Çözümü kontrol et
  checkSolution() {
    if (!this.gameActive) return;
    
    let errors = 0;
    let empty = 0;
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.board[row][col] === 0) {
          empty++;
        } else if (this.board[row][col] !== this.solution[row][col]) {
          errors++;
        }
      }
    }
    
    let message = '';
    
    if (errors === 0 && empty === 0) {
      message = 'Tebrikler! Tahtayı doğru şekilde tamamladınız!';
      this.gameOver(true);
    } else if (errors === 0 && empty > 0) {
      message = `Şimdiye kadar tüm değerler doğru! ${empty} hücre daha doldurmanız gerekiyor.`;
    } else {
      message = `Tahtada ${errors} hatalı değer var. Kontrol edip düzeltmeniz gerekiyor.`;
    }
    
    document.getElementById('hint-text').textContent = message;
    this.hintModal.show();
  }

  // Oyun tamamlandı mı kontrol et
  checkComplete() {
    // Tüm hücreleri kontrol et
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        // Boş hücre veya yanlış değer varsa tamamlanmamış
        if (this.board[row][col] === 0 || this.board[row][col] !== this.solution[row][col]) {
          return false;
        }
      }
    }
    
    return true;
  }

  // Oyun sonu
  gameOver(isWin) {
    this.gameActive = false;
    clearInterval(this.timeInterval);
    
    // Sonuç modalını güncelle
    document.getElementById('win-message').style.display = isWin ? 'block' : 'none';
    document.getElementById('result-time').textContent = this.timerEl.textContent;
    document.getElementById('result-difficulty').textContent = this.getDifficultyText();
    document.getElementById('result-moves').textContent = this.moves;
    
    // Modalı göster
    this.resultModal.show();
  }

  // Zorluk seviyesi metnini al
  getDifficultyText() {
    switch (this.difficulty) {
      case 'easy': return 'Kolay';
      case 'medium': return 'Orta';
      case 'hard': return 'Zor';
      case 'expert': return 'Uzman';
      default: return 'Kolay';
    }
  }

  // Zamanlayıcıyı başlat
  startTimer() {
    // Önceki zamanlayıcıyı temizle
    clearInterval(this.timeInterval);
    
    // Başlangıç zamanını ayarla
    this.startTime = Date.now();
    
    // Zamanlayıcıyı güncelle
    this.timerEl.textContent = '00:00';
    
    // Interval başlat
    this.timeInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      
      this.timerEl.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  // Hamle sayısını güncelle
  updateMovesDisplay() {
    this.movesEl.textContent = this.moves;
  }
}

// Oyunu başlat
window.sudokuGame = new SudokuGame();