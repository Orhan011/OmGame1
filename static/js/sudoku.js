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
        const num = btn.getAttribute('data-num');
        enterNumber(parseInt(num));
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
    resumeGameBtn.addEventListener('click', resumeGame);
    restartGameBtn.addEventListener('click', generateNewGame);
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
    // Basit bir örnek tahta
    const exampleSolution = [
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

    // Çözümü depola
    gameState.solution = JSON.parse(JSON.stringify(exampleSolution));
    
    // Zorluk seviyesine göre bazı hücreleri gizle
    gameState.board = createPuzzleFromSolution(exampleSolution, getDifficultyRemovalCount());
    
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
    for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
      const {row, col} = positions[i];
      puzzle[row][col] = 0;
    }
    
    return puzzle;
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
        cell.addEventListener('click', () => selectCell(row, col));
        
        // 3x3 bloğunu belirtmek için kenar çizgileri
        if (col % 3 === 2 && col < 8) cell.classList.add('border-right');
        if (row % 3 === 2 && row < 8) cell.classList.add('border-bottom');
        
        boardElement.appendChild(cell);
      }
    }
  }

  function selectCell(row, col) {
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
    
    // Başlangıç zamanını kaydet (skor hesaplama için)
    localStorage.setItem('sudokuGameStartTime', new Date().toString());
    
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
    
    // Skor gönder
    sendScore();
    
    // Zafer ekranını göster
    document.getElementById('game-completed').style.display = 'flex';
    
    // Tebrik mesajı
    const timeMessage = formatTime(gameState.timer);
    showAlert(`Tebrikler! Sudoku'yu ${timeMessage} sürede tamamladınız!`, 'success');
    
    // Yeni oyun butonunu aktif et
    document.getElementById('new-game-after-win').addEventListener('click', () => {
      document.getElementById('game-completed').style.display = 'none';
      generateNewGame();
    });
  }

  function sendScore() {
    // Oyun istatistiklerini hazırla
    const gameStartTime = localStorage.getItem('sudokuGameStartTime');
    const playtime = gameState.timer; // Saniye cinsinden
    
    // Zorluk seviyesini belirle
    let difficulty = gameState.difficulty;
    
    // İpucu sayısını hesapla (tahta doldurma sayısı)
    const hintCount = document.querySelectorAll('.sudoku-cell.fixed').length - getDifficultyRemovalCount();
    
    // Oyun istatistiklerini topla
    const gameStats = {
      duration_seconds: playtime,
      move_count: document.querySelectorAll('.sudoku-cell:not(.fixed)').length,
      hint_count: hintCount,
      grid_size: 9, // 9x9 Sudoku
      empty_cells: getDifficultyRemovalCount()
    };
    
    // Zafer ekranında skoru göster
    const updateScoreDisplay = function(scoreHtml, data) {
      const scoreContainer = document.getElementById('game-score-container');
      if (scoreContainer) {
        scoreContainer.innerHTML = scoreHtml;
      }
    };
    
    // Ortak puan hesaplama ve gösterme fonksiyonunu kullan
    saveScoreAndDisplay('sudoku', 0, playtime, difficulty, gameStats, updateScoreDisplay);
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
    gameState.board = Array(9).fill().map(() => Array(9).fill(0));
    gameState.solution = Array(9).fill().map(() => Array(9).fill(0));
    gameState.selectedCell = null;
    gameState.originalCells = new Set();
    gameState.timer = 0;
    gameState.status = 'ongoing';
    gameState.paused = false;
    
    // Not modu kapalı olarak başlat
    gameState.notesEnabled = false;
    notesToggleBtn.innerHTML = '<i class="fas fa-pencil-alt"></i> Notlar (Kapalı)';
    notesToggleBtn.classList.remove('active');
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