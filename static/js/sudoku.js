
/**
 * Sudoku Oyunu
 * Modern ve etkileşimli sudoku oyunu uygulaması
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
  const gameCompletedScreen = document.getElementById('game-completed');
  const newGameAfterWinBtn = document.getElementById('new-game-after-win');
  const shareScoreBtn = document.getElementById('share-score');

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
    paused: false
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
      });
    });

    // Yeni oyun butonu
    newGameBtn.addEventListener('click', () => {
      if (gameState.status === 'ongoing' && !confirm('Oyun devam ediyor. Yeni oyun başlatmak istediğinizden emin misiniz?')) {
        return;
      }
      generateNewGame();
    });

    // İpucu butonu
    hintBtn.addEventListener('click', provideHint);

    // Not modu butonu
    notesToggleBtn.addEventListener('click', toggleNotesMode);

    // Silme butonu
    eraseBtn.addEventListener('click', eraseCell);

    // Numpad butonları
    numpadBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const num = parseInt(btn.getAttribute('data-num'));
        enterNumber(num);
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
    if (resumeGameBtn) {
      resumeGameBtn.addEventListener('click', resumeGame);
    }
    
    if (restartGameBtn) {
      restartGameBtn.addEventListener('click', generateNewGame);
    }
    
    if (exitGameBtn) {
      exitGameBtn.addEventListener('click', () => {
        window.location.href = '/all-games';
      });
    }

    // Oyun tamamlandı ekranı butonları
    if (newGameAfterWinBtn) {
      newGameAfterWinBtn.addEventListener('click', () => {
        gameCompletedScreen.style.display = 'none';
        generateNewGame();
      });
    }
    
    if (shareScoreBtn) {
      shareScoreBtn.addEventListener('click', () => {
        // Skoru paylaşma işlemleri (sosyal medya, vb.)
        alert('Skorunuz: ' + formatTime(gameState.timer));
      });
    }

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
    // Sudoku çözümü oluştur
    generateSolution();
    
    // Çözümden tahtayı oluştur (belirli sayıda hücreyi boşaltarak)
    createPuzzleFromSolution();
  }

  function generateSolution() {
    // Temel şablon
    const baseGrid = [
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [4, 5, 6, 7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3, 4, 5, 6],
      [2, 3, 4, 5, 6, 7, 8, 9, 1],
      [5, 6, 7, 8, 9, 1, 2, 3, 4],
      [8, 9, 1, 2, 3, 4, 5, 6, 7],
      [3, 4, 5, 6, 7, 8, 9, 1, 2],
      [6, 7, 8, 9, 1, 2, 3, 4, 5],
      [9, 1, 2, 3, 4, 5, 6, 7, 8]
    ];
    
    // Çözümü karıştır
    shuffleSudoku(baseGrid);
    
    // Çözümü kaydet
    gameState.solution = JSON.parse(JSON.stringify(baseGrid));
  }

  function shuffleSudoku(grid) {
    // Satırları blok içinde karıştır
    for (let block = 0; block < 3; block++) {
      const start = block * 3;
      for (let i = 0; i < 20; i++) {
        const r1 = start + Math.floor(Math.random() * 3);
        let r2 = start + Math.floor(Math.random() * 3);
        while (r1 === r2) {
          r2 = start + Math.floor(Math.random() * 3);
        }
        [grid[r1], grid[r2]] = [grid[r2], grid[r1]];
      }
    }
    
    // Sütunları blok içinde karıştır
    for (let block = 0; block < 3; block++) {
      const start = block * 3;
      for (let i = 0; i < 20; i++) {
        const c1 = start + Math.floor(Math.random() * 3);
        let c2 = start + Math.floor(Math.random() * 3);
        while (c1 === c2) {
          c2 = start + Math.floor(Math.random() * 3);
        }
        
        // Sütunları değiştir
        for (let row = 0; row < 9; row++) {
          [grid[row][c1], grid[row][c2]] = [grid[row][c2], grid[row][c1]];
        }
      }
    }
    
    // Blokları yatay olarak karıştır
    for (let i = 0; i < 20; i++) {
      const b1 = Math.floor(Math.random() * 3);
      let b2 = Math.floor(Math.random() * 3);
      while (b1 === b2) {
        b2 = Math.floor(Math.random() * 3);
      }
      
      // Blokları değiştir
      for (let row = 0; row < 3; row++) {
        [grid[b1 * 3 + row], grid[b2 * 3 + row]] = [grid[b2 * 3 + row], grid[b1 * 3 + row]];
      }
    }
    
    // Rakamları yeniden eşle (1-9)
    const mapping = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    shuffleArray(mapping);
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        grid[row][col] = mapping[grid[row][col] - 1];
      }
    }
  }

  function createPuzzleFromSolution() {
    // Çözümden tahtayı kopyala
    gameState.board = JSON.parse(JSON.stringify(gameState.solution));
    
    // Orijinal hücreleri temizle
    gameState.originalCells.clear();
    
    // Zorluk seviyesine göre boşaltılacak hücre sayısını belirle
    const cellsToRemove = getDifficultyRemovalCount();
    
    // Tüm pozisyonları hazırla
    const positions = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        positions.push({row, col});
      }
    }
    
    // Pozisyonları karıştır
    shuffleArray(positions);
    
    // Belirli sayıda hücreyi boşalt
    for (let i = 0; i < cellsToRemove; i++) {
      const {row, col} = positions[i];
      gameState.board[row][col] = 0;
    }
    
    // Kalan hücreleri orijinal olarak işaretle
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gameState.board[row][col] !== 0) {
          gameState.originalCells.add(`${row}-${col}`);
        }
      }
    }
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
        } 
        // Boş hücre
        else {
          // Notlar için konteyner
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
        cell.addEventListener('click', () => selectCell(row, col));
        
        // 3x3 bloğunu belirtmek için kenar çizgileri
        if (col % 3 === 2 && col < 8) cell.classList.add('border-right');
        if (row % 3 === 2 && row < 8) cell.classList.add('border-bottom');
        
        boardElement.appendChild(cell);
      }
    }
  }

  function selectCell(row, col) {
    // Oyun duraklatılmışsa seçime izin verme
    if (gameState.paused) return;
    
    // Önceki seçili hücreyi temizle
    if (gameState.selectedCell) {
      const prevCell = getCellElement(gameState.selectedCell.row, gameState.selectedCell.col);
      if (prevCell) prevCell.classList.remove('selected');
    }
    
    // Seçim aynı hücreye yapıldıysa seçimi iptal et
    if (gameState.selectedCell && gameState.selectedCell.row === row && gameState.selectedCell.col === col) {
      gameState.selectedCell = null;
      return;
    }
    
    // Yeni hücreyi seç
    gameState.selectedCell = { row, col };
    const cellElement = getCellElement(row, col);
    if (cellElement) cellElement.classList.add('selected');
  }

  function enterNumber(num) {
    if (!gameState.selectedCell || gameState.paused) return;
    
    const { row, col } = gameState.selectedCell;
    
    // Orijinal (değiştirilemez) hücrelere sayı girişi yok
    if (gameState.originalCells.has(`${row}-${col}`)) {
      showAlert('Bu hücre değiştirilemez!', 'error');
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
        gameState.board[row][col] = num;
      }
      
      // Tahtayı güncelle
      renderBoard();
      
      // Seçilen hücreyi tekrar işaretle
      const cellElement = getCellElement(row, col);
      if (cellElement) cellElement.classList.add('selected');
      
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
    if (noteElement) {
      if (noteElement.textContent === num.toString()) {
        noteElement.textContent = '';
      } else {
        noteElement.textContent = num;
      }
    }
  }

  function eraseCell() {
    if (!gameState.selectedCell || gameState.paused) return;
    
    const { row, col } = gameState.selectedCell;
    
    // Orijinal hücreler değiştirilemez
    if (gameState.originalCells.has(`${row}-${col}`)) {
      showAlert('Bu hücre değiştirilemez!', 'error');
      return;
    }
    
    // Hücreyi temizle
    gameState.board[row][col] = 0;
    
    // Tahtayı güncelle
    renderBoard();
    
    // Seçilen hücreyi tekrar işaretle
    const cellElement = getCellElement(row, col);
    if (cellElement) cellElement.classList.add('selected');
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
    
    // Tahtayı güncelle
    renderBoard();
    
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
      '<i class="fas fa-pencil-alt"></i> Notlar';
    
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
      }
      
      e.preventDefault();
    }
    // Del veya Backspace tuşu ile silme
    else if (e.key === 'Delete' || e.key === 'Backspace') {
      eraseCell();
      e.preventDefault();
    }
    // Space ile not modu
    else if (e.key === ' ') {
      toggleNotesMode();
      e.preventDefault();
    }
    // H tuşu ile ipucu
    else if (e.key.toLowerCase() === 'h') {
      provideHint();
    }
    // N tuşu ile yeni oyun
    else if (e.key.toLowerCase() === 'n') {
      if (confirm('Yeni oyun başlatmak istediğinizden emin misiniz?')) {
        generateNewGame();
      }
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
    
    // Skor bilgilerini hazırla
    const gameStats = {
      duration_seconds: gameState.timer,
      empty_cells: getDifficultyRemovalCount(),
      grid_size: 9,
      hint_count: document.querySelectorAll('.sudoku-cell.fixed').length - (81 - getDifficultyRemovalCount())
    };
    
    // Skor bilgisini güncelle
    updateScoreDisplay(gameStats);
    
    // Zafer ekranını göster
    gameCompletedScreen.style.display = 'flex';
    
    // Tebrik mesajı
    showAlert(`Tebrikler! Sudoku'yu ${formatTime(gameState.timer)} sürede tamamladınız!`, 'success');
  }

  function updateScoreDisplay(gameStats) {
    const scoreContainer = document.getElementById('game-score-container');
    if (!scoreContainer) return;
    
    // Oyun istatistiklerini göster
    scoreContainer.innerHTML = `
      <div class="score-display">
        <div class="score-item">
          <div class="score-label">Süre</div>
          <div class="score-value">${formatTime(gameStats.duration_seconds)}</div>
        </div>
        <div class="score-item">
          <div class="score-label">Zorluk</div>
          <div class="score-value">${getDifficultyName(gameState.difficulty)}</div>
        </div>
        <div class="score-item">
          <div class="score-label">İpuçları</div>
          <div class="score-value">${gameStats.hint_count || 0}</div>
        </div>
      </div>
    `;
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
    
    if (!alertElement) return;
    
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
    gameState.board = Array(9).fill().map(() => Array(9).fill(0));
    gameState.solution = Array(9).fill().map(() => Array(9).fill(0));
    gameState.selectedCell = null;
    gameState.originalCells = new Set();
    gameState.timer = 0;
    gameState.status = 'ongoing';
    gameState.paused = false;
    
    // Not modu kapalı olarak başlat
    gameState.notesEnabled = false;
    if (notesToggleBtn) {
      notesToggleBtn.innerHTML = '<i class="fas fa-pencil-alt"></i> Notlar';
      notesToggleBtn.classList.remove('active');
    }
  }

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
